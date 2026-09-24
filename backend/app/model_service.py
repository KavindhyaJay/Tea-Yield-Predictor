"""
Model service: loads the trained CatBoost pipeline and the 2021-2025 dataset,
builds model input rows, predicts, forecasts and explains (SHAP).

Nothing here depends on FastAPI, so it can also be tested from a notebook:

    from app.model_service import TeaYieldService
    svc = TeaYieldService("model/catboost_tea_yield_pipeline.joblib",
                          "data/MATTAKELLE_2021_2025_WITH_METEOROLOGY.csv")
    svc.predict_one({"field_key": "10", "month": "June", "year": 2026})
"""
from __future__ import annotations

import io
from datetime import datetime

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer

TARGET = "Yield_Month"
FIELD = "Field Key"
MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
          "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
MONTH_NUM = {m: i + 1 for i, m in enumerate(MONTHS)}
FULL_MONTHS = ["January", "February", "March", "April", "May", "June", "July",
               "August", "September", "October", "November", "December"]
FULL_TO_SHORT = dict(zip(FULL_MONTHS, MONTHS))
SHORT_TO_FULL = dict(zip(MONTHS, FULL_MONTHS))

ENGINEERED = ["Month_Num", "Month_sin", "Month_cos", "Date_Index",
              "Rainfall_per_WetDay", "Temp_Range"]

# frontend form key  ->  dataset column(s)
FORM_TO_COLUMNS = {
    "last12_yph_nitrogen":     ["Last 12 Months YPH - Nitrogen"],
    "nitrogen_per_hect_month": ["Nitrogen per Hect- Month"],
    "plucking_average_month":  ["Plucking Average - Month"],
    "gl_ha_rd_month":          ["GL/Ha/Rd -Month"],
    "lph_month":               ["LPH - Month"],
    "plucking_round_months":   ["Plucking Round - Months"],
    "rainfall":                ["Rainfall"],
    "airtemp_max":             ["AirTemp_Max"],
    "sunshine":                ["Sunshine"],
    "rh_morning":              ["RH_Morning"],
    "wetdays":                 ["WetDays"],
    "extent":                  ["Extent", "Extend"],
    "age_as_at_310324":        ["Age as at 31/03/24"],
}

# SHAP values of these model columns are reported together under one name
SHAP_GROUPS = {
    "Month": "Month", "Month.1": "Month", "Month_Num": "Month",
    "Month_sin": "Month", "Month_cos": "Month",
    "Year": "Year", "Date_Index": "Year",
    "Field Key": "Field Key", "Field Key.1": "Field Key",
}

DEFAULT_METRICS = {"r2": 0.9887, "rmse": 7.926, "mae": 4.410}   # thesis CatBoost results


# ----------------------------------------------------------------------
# helpers
# ----------------------------------------------------------------------
def add_features(df: pd.DataFrame) -> pd.DataFrame:
    """Same feature engineering as the training notebook."""
    df = df.copy()
    df["Month_Num"] = df["Month"].map(MONTH_NUM)
    df["Month_sin"] = np.sin(2 * np.pi * df["Month_Num"] / 12)
    df["Month_cos"] = np.cos(2 * np.pi * df["Month_Num"] / 12)
    df["Date_Index"] = df["Year"] * 12 + df["Month_Num"]
    if {"Rainfall", "WetDays"} <= set(df.columns):
        df["Rainfall_per_WetDay"] = df["Rainfall"] / (df["WetDays"] + 1)
    if {"AirTemp_Max", "AirTemp_Min"} <= set(df.columns):
        df["Temp_Range"] = df["AirTemp_Max"] - df["AirTemp_Min"]
    return df


def to_short_month(month: str) -> str:
    month = str(month).strip()
    if month in MONTH_NUM:
        return month
    if month in FULL_TO_SHORT:
        return FULL_TO_SHORT[month]
    raise ValueError(f"Unknown month: {month!r}")


def _dense(matrix):
    if hasattr(matrix, "toarray"):
        matrix = matrix.toarray()
    return np.asarray(matrix, dtype=float)


# ----------------------------------------------------------------------
# service
# ----------------------------------------------------------------------
class TeaYieldService:
    def __init__(self, model_path: str, data_path: str, base_years=None):
        bundle = joblib.load(model_path)
        if isinstance(bundle, dict):
            self.pipeline = bundle["pipeline"]
            self.feature_columns = list(bundle.get("feature_columns")
                                        or self.pipeline.feature_names_in_)
            self.metrics = bundle.get("metrics") or DEFAULT_METRICS
        else:                                   # a bare sklearn Pipeline was saved
            self.pipeline = bundle
            self.feature_columns = list(self.pipeline.feature_names_in_)
            self.metrics = DEFAULT_METRICS

        self.preprocess = self.pipeline[:-1]
        self.model = self.pipeline[-1]
        self.model_name = "CatBoost Regressor"

        # ---- dataset ----
        df = pd.read_csv(data_path, dtype={FIELD: str, "Field Key.1": str})
        df.columns = df.columns.str.strip()
        df = df.dropna(subset=[TARGET])
        self.df = add_features(df)
        self.field_order = list(dict.fromkeys(self.df[FIELD]))
        self.base_years = base_years or sorted(self.df["Year"].unique().tolist())
        self.last_data_year = int(self.df["Year"].max())

        self._build_profiles()
        self._map_model_outputs()
        self._global_cache = None
        self._forecast_cache = {}

    # ------------------------------------------------------------------
    # field x month input profiles (same method as the notebook forecast)
    # ------------------------------------------------------------------
    def _build_profiles(self):
        raw_cols = [c for c in self.df.columns if c not in ENGINEERED]
        hist = self.df[self.df["Year"].isin(self.base_years)]
        self.num_raw = [c for c in hist[raw_cols].select_dtypes(include="number").columns
                        if c != "Year"]
        num_part = hist.groupby([FIELD, "Month"])[self.num_raw].mean().reset_index()

        latest = (self.df[self.df["Year"] == self.last_data_year]
                  .sort_values("Month_Num").groupby(FIELD).tail(1))
        self.txt_cols = [c for c in raw_cols
                         if c not in self.num_raw + [FIELD, "Month", "Year"]]
        profiles = num_part.merge(latest[[FIELD] + self.txt_cols], on=FIELD, how="left")
        self.profiles = profiles.set_index([FIELD, "Month"]).sort_index()

    def _rows(self, field_keys, months, years, overrides=None) -> pd.DataFrame:
        """Model-ready rows for every (field, month, year) combination."""
        index = pd.MultiIndex.from_product([field_keys, months], names=[FIELD, "Month"])
        base = self.profiles.reindex(index).reset_index()
        frames = [base.assign(Year=int(y)) for y in years]
        rows = pd.concat(frames, ignore_index=True)
        if "Month.1" in self.df.columns:
            rows["Month.1"] = rows["Month"]
        if "Field Key.1" in self.df.columns:
            rows["Field Key.1"] = rows[FIELD]
        for column, value in (overrides or {}).items():
            if column in rows.columns and value is not None:
                rows[column] = value
        return add_features(rows)

    # ------------------------------------------------------------------
    # metadata for the form
    # ------------------------------------------------------------------
    def fields(self):
        latest = (self.df[self.df["Year"] == self.last_data_year]
                  .groupby(FIELD).tail(1).set_index(FIELD))
        out = []
        for fk in self.field_order:
            row = latest.loc[fk] if fk in latest.index else None
            def num(col):
                v = None if row is None else row.get(col, np.nan)
                return None if v is None or pd.isna(v) else float(v)
            out.append({"field_key": fk, "extent": num("Extent"),
                        "age": num("Age as at 31/03/24")})
        return out

    def field_defaults(self, field_key: str, month: str):
        """Historical same-month averages for a field, keyed like the frontend form."""
        m = to_short_month(month)
        if (field_key, m) not in self.profiles.index:
            raise KeyError(f"Unknown field key: {field_key}")
        profile = self.profiles.loc[(field_key, m)]
        values = {}
        for key, columns in FORM_TO_COLUMNS.items():
            v = profile.get(columns[0], np.nan)
            values[key] = None if pd.isna(v) else round(float(v), 2)
        return {"field_key": field_key, "month": SHORT_TO_FULL[m],
                "base_years": [int(y) for y in self.base_years], "values": values}

    def actual_yield(self, field_key, month_short, year):
        hit = self.df[(self.df[FIELD] == field_key) & (self.df["Month"] == month_short)
                      & (self.df["Year"] == int(year))]
        return None if hit.empty else round(float(hit[TARGET].iloc[0]), 3)

    # ------------------------------------------------------------------
    # prediction
    # ------------------------------------------------------------------
    def build_input(self, payload: dict) -> tuple[pd.DataFrame, dict]:
        field_key = str(payload.get("field_key") or self.field_order[0])
        if field_key not in self.field_order:
            raise KeyError(f"Unknown field key: {field_key}")
        month = to_short_month(payload.get("month", "Jan"))
        year = int(payload.get("year") or self.last_data_year + 1)

        overrides = {}
        for key, columns in FORM_TO_COLUMNS.items():
            value = payload.get(key)
            if value is None or value == "":
                continue
            for column in columns:
                overrides[column] = float(value)

        rows = self._rows([field_key], [month], [year], overrides)
        meta = {"field_key": field_key, "month": month, "year": year}
        return rows[self.feature_columns], meta

    def predict_one(self, payload: dict) -> dict:
        X, meta = self.build_input(payload)
        prediction = float(self.pipeline.predict(X)[0])
        explanation = self.explain_rows(X)
        extent = payload.get("extent")
        if extent in (None, ""):
            extent = float(X["Extent"].iloc[0]) if "Extent" in X.columns else None
        return {
            "prediction": round(prediction, 3),
            "unit": "kg/ha",
            "model": self.model_name,
            "field_key": meta["field_key"],
            "year": meta["year"],
            "prediction_month": f"{SHORT_TO_FULL[meta['month']]} {meta['year']}",
            "prediction_date": datetime.now().strftime("%d %b %Y, %I:%M %p"),
            "extent": None if extent is None else float(extent),
            "actual_yield": self.actual_yield(meta["field_key"], meta["month"], meta["year"]),
            "base_value": explanation["base_value"],
            "metrics": self.metrics,
            "shap_values": explanation["shap_values"],
        }

    # ------------------------------------------------------------------
    # 2-year (or any horizon) monthly forecast for every field
    # ------------------------------------------------------------------
    def forecast(self, years=None) -> pd.DataFrame:
        years = tuple(int(y) for y in (years or [self.last_data_year + 1,
                                                 self.last_data_year + 2]))
        if years not in self._forecast_cache:
            rows = self._rows(self.field_order, MONTHS, years)
            pred = np.clip(self.pipeline.predict(rows[self.feature_columns]), 0, None)
            out = rows[[FIELD, "Year", "Month", "Month_Num"]].copy()
            out["Predicted_Yield_Month"] = np.round(pred, 3)
            out["Extent"] = rows["Extent"].values if "Extent" in rows else np.nan
            out[FIELD] = pd.Categorical(out[FIELD], self.field_order, ordered=True)
            out = out.sort_values([FIELD, "Year", "Month_Num"]).reset_index(drop=True)
            out[FIELD] = out[FIELD].astype(str)
            self._forecast_cache[years] = out
        return self._forecast_cache[years]

    def forecast_json(self, years=None, field_key=None) -> dict:
        fc = self.forecast(years)
        if field_key:
            fc = fc[fc[FIELD] == field_key]
        rows = [{"field_key": r[FIELD], "year": int(r["Year"]), "month": r["Month"],
                 "predicted": float(r["Predicted_Yield_Month"])}
                for _, r in fc.iterrows()]
        return {
            "unit": "kg/ha",
            "years": sorted(int(y) for y in fc["Year"].unique()),
            "months": MONTHS,
            "fields": self.field_order,
            "base_years": [int(y) for y in self.base_years],
            "rows": rows,
        }

    def forecast_csv(self, years=None) -> str:
        fc = self.forecast(years).drop(columns=["Month_Num"])
        buffer = io.StringIO()
        fc.to_csv(buffer, index=False)
        return buffer.getvalue()

    # ------------------------------------------------------------------
    # SHAP
    # ------------------------------------------------------------------
    def _map_model_outputs(self):
        """Map every column coming out of the preprocessor back to a feature name."""
        ct = next((step for _, step in self.preprocess.steps
                   if isinstance(step, ColumnTransformer)), None)
        try:
            names = list(ct.get_feature_names_out())
            owner = {}
            for tname, _, cols in ct.transformers_:
                if isinstance(cols, (list, tuple, pd.Index, np.ndarray)):
                    owner[tname] = [str(c) for c in cols]
            groups = []
            for name in names:
                prefix, _, rest = name.partition("__")
                cols = owner.get(prefix, [])
                if rest in cols:
                    original = rest
                else:
                    matches = [c for c in cols if rest.startswith(c + "_")]
                    original = max(matches, key=len) if matches else rest
                groups.append(SHAP_GROUPS.get(original, original))
        except Exception:                                    # pragma: no cover
            n = _dense(self.preprocess.transform(self.df[self.feature_columns].head(1))).shape[1]
            groups = [f"feature_{i}" for i in range(n)]
        self.output_groups = np.array(groups)
        self.group_names = list(dict.fromkeys(groups))

    def _raw_shap(self, Xp: np.ndarray):
        """SHAP values in the model's input space -> (values[n, f], base_value)."""
        if type(self.model).__module__.startswith("catboost"):
            from catboost import Pool
            vals = np.asarray(self.model.get_feature_importance(Pool(Xp), type="ShapValues"))
            return vals[:, :-1], float(vals[0, -1])
        import shap                                          # other tree models
        explainer = shap.TreeExplainer(self.model)
        vals = np.asarray(explainer.shap_values(Xp))
        base = float(np.ravel(explainer.expected_value)[0])
        return vals, base

    def _grouped_shap(self, X: pd.DataFrame):
        Xp = _dense(self.preprocess.transform(X))
        vals, base = self._raw_shap(Xp)
        grouped = pd.DataFrame(vals, columns=self.output_groups).T.groupby(level=0).sum().T
        return grouped[self.group_names], base

    def explain_rows(self, X: pd.DataFrame, top_k: int = 12) -> dict:
        grouped, base = self._grouped_shap(X)
        contrib = grouped.iloc[0].sort_values(key=np.abs, ascending=False)
        shown = contrib.iloc[:top_k]
        shap_values = [{"feature": k, "value": round(float(v), 4)} for k, v in shown.items()]
        rest = contrib.iloc[top_k:]
        if len(rest):
            shap_values.append({"feature": f"Other features ({len(rest)})",
                                "value": round(float(rest.sum()), 4)})
        return {"base_value": round(base, 4), "shap_values": shap_values}

    def global_explanation(self, sample_size: int = 600, top_k: int = 14,
                           n_plot_features: int = 5, points_per_feature: int = 160) -> dict:
        if self._global_cache is not None:
            return self._global_cache
        sample = self.df.sample(n=min(sample_size, len(self.df)), random_state=42)
        grouped, base = self._grouped_shap(sample[self.feature_columns])

        importance = grouped.abs().mean().sort_values(ascending=False)
        feature_importance = [{"feature": k, "value": round(float(v), 4)}
                              for k, v in importance.iloc[:top_k].items()]

        numeric_groups = [g for g in importance.index
                          if g in sample.columns and pd.api.types.is_numeric_dtype(sample[g])]
        plot_features = numeric_groups[:n_plot_features]
        rng = np.random.default_rng(0)
        beeswarm, dependence = [], {}
        for feature in plot_features:
            x = sample[feature].astype(float).values
            s = grouped[feature].values
            ok = ~np.isnan(x)
            x, s = x[ok], s[ok]
            lo, hi = np.nanpercentile(x, 2), np.nanpercentile(x, 98)
            norm = np.clip((x - lo) / (hi - lo if hi > lo else 1), 0, 1)
            pick = rng.choice(len(x), size=min(points_per_feature, len(x)), replace=False)
            beeswarm.append({"feature": feature, "points": [
                {"shap": round(float(s[i]), 3), "normalized": round(float(norm[i]), 3),
                 "jitter": round(float(rng.uniform(-0.25, 0.25)), 3)} for i in pick]})
            dependence[feature] = {"unit": "", "points": [
                {"x": round(float(x[i]), 3), "y": round(float(s[i]), 3),
                 "normalized": round(float(norm[i]), 3)} for i in pick]}

        self._global_cache = {"expected_value": round(base, 4),
                              "feature_importance": feature_importance,
                              "beeswarm": beeswarm, "dependence": dependence}
        return self._global_cache

    def explain_payload(self, payload: dict) -> dict:
        X, _ = self.build_input(payload)
        local = self.explain_rows(X)
        glob = self.global_explanation()
        return {
            "base_value": local["base_value"],
            "shap_values": local["shap_values"],
            "feature_importance": glob["feature_importance"],
            "beeswarm": glob["beeswarm"],
            "dependence": glob["dependence"],
        }
