# =====================================================================
# PREDICT Yield_Month FOR ANY MONTH(S), ANY YEAR(S), ANY FIELD(S)
# with the trained CatBoost pipeline.
#
# Needs in the same folder:
#   catboost_tea_yield_pipeline.joblib      (saved from the notebook)
#   MATTAKELLE_2021_2025_WITH_METEOROLOGY.csv
#
# EXAMPLES
#   python predict_any_period.py --years 2026                     # all fields, all 12 months
#   python predict_any_period.py --years 2026-2030                # five years ahead
#   python predict_any_period.py --years 2026,2028 --months Jan,Feb,Mar
#   python predict_any_period.py --years 2027 --fields 10,11,7A
#   python predict_any_period.py --years 2026 --base-years 2024-2025
#   python predict_any_period.py --years 2027 --scale Rainfall=0.9,Nitrogen per Hect- Month=1.1
#   python predict_any_period.py --years 2026 --plot
#
#   # work from a file with the REAL input values instead of historical averages
#   python predict_any_period.py --years 2026 --months Jan-May --template
#   python predict_any_period.py --from-csv MY_2026_INPUT.csv      # also tests, if actuals are filled
# =====================================================================
import argparse
import sys

import joblib
import numpy as np
import pandas as pd

HISTORY_CSV = "MATTAKELLE_2021_2025_WITH_METEOROLOGY.csv"
MODEL_FILE = "catboost_tea_yield_pipeline.joblib"

TARGET = "Yield_Month"
FIELD = "Field Key"
MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
          "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
MONTH_NUM = {m: i + 1 for i, m in enumerate(MONTHS)}
FULL_TO_SHORT = {"january": "Jan", "february": "Feb", "march": "Mar", "april": "Apr",
                 "may": "May", "june": "Jun", "july": "Jul", "august": "Aug",
                 "september": "Sep", "october": "Oct", "november": "Nov", "december": "Dec"}
ENGINEERED = ["Month_Num", "Month_sin", "Month_cos", "Date_Index",
              "Rainfall_per_WetDay", "Temp_Range"]


# ---------------------------------------------------------------------
# feature engineering - identical to the training notebook
# ---------------------------------------------------------------------
def add_features(df):
    df = df.copy()
    df.columns = df.columns.str.strip()
    df["Month_Num"] = df["Month"].map(MONTH_NUM)
    df["Month_sin"] = np.sin(2 * np.pi * df["Month_Num"] / 12)
    df["Month_cos"] = np.cos(2 * np.pi * df["Month_Num"] / 12)
    df["Date_Index"] = df["Year"] * 12 + df["Month_Num"]
    if {"Rainfall", "WetDays"} <= set(df.columns):
        df["Rainfall_per_WetDay"] = df["Rainfall"] / (df["WetDays"] + 1)
    if {"AirTemp_Max", "AirTemp_Min"} <= set(df.columns):
        df["Temp_Range"] = df["AirTemp_Max"] - df["AirTemp_Min"]
    return df


def load_history(path=HISTORY_CSV):
    df = pd.read_csv(path, dtype={FIELD: str, "Field Key.1": str})
    df.columns = df.columns.str.strip()
    return add_features(df.dropna(subset=[TARGET]))


def load_model(path=MODEL_FILE):
    bundle = joblib.load(path)
    if isinstance(bundle, dict):
        return bundle["pipeline"], list(bundle.get("feature_columns")
                                        or bundle["pipeline"].feature_names_in_)
    return bundle, list(bundle.feature_names_in_)


# ---------------------------------------------------------------------
# argument parsing: "2026-2030", "Jan,Feb", "all", "June"
# ---------------------------------------------------------------------
def parse_years(text, default):
    if not text or text.lower() == "all":
        return default
    years = []
    for part in text.split(","):
        part = part.strip()
        if "-" in part:
            a, b = part.split("-")
            years += list(range(int(a), int(b) + 1))
        else:
            years.append(int(part))
    return sorted(dict.fromkeys(years))


def parse_months(text):
    if not text or text.lower() == "all":
        return MONTHS[:]
    def one(token):
        token = token.strip()
        if token[:3].title() in MONTH_NUM:
            return token[:3].title()
        if token.lower() in FULL_TO_SHORT:
            return FULL_TO_SHORT[token.lower()]
        raise SystemExit(f"Unknown month: {token}")
    out = []
    for part in text.split(","):
        if "-" in part and part.count("-") == 1:
            a, b = (one(p) for p in part.split("-"))
            out += MONTHS[MONTH_NUM[a] - 1: MONTH_NUM[b]]
        else:
            out.append(one(part))
    return list(dict.fromkeys(out))


def parse_fields(text, all_fields):
    if not text or text.lower() == "all":
        return all_fields
    chosen = [f.strip() for f in text.split(",")]
    unknown = [f for f in chosen if f not in all_fields]
    if unknown:
        raise SystemExit(f"Unknown field key(s): {unknown}\nAvailable: {all_fields}")
    return chosen


def parse_scale(text):
    """--scale 'Rainfall=0.9,Sunshine=1.05' -> {'Rainfall': 0.9, 'Sunshine': 1.05}"""
    factors = {}
    for part in (text or "").split(","):
        part = part.strip()
        if not part:
            continue
        column, _, value = part.rpartition("=")
        factors[column.strip()] = float(value)
    return factors


# ---------------------------------------------------------------------
# build the model input rows for the requested period
# ---------------------------------------------------------------------
def build_rows(hist, fields, months, years, base_years, scale=None):
    """
    Numeric inputs  = the field's average for that calendar month over base_years
    Text inputs     = the field's latest record in the data
    """
    raw_cols = [c for c in hist.columns if c not in ENGINEERED]
    base = hist[hist["Year"].isin(base_years)]
    if base.empty:
        raise SystemExit(f"No rows for base years {base_years}")

    num_cols = [c for c in base[raw_cols].select_dtypes(include="number").columns if c != "Year"]
    num_part = base.groupby([FIELD, "Month"])[num_cols].mean()

    latest_year = hist["Year"].max()
    latest = hist[hist["Year"] == latest_year].sort_values("Month_Num").groupby(FIELD).tail(1)
    txt_cols = [c for c in raw_cols if c not in num_cols + [FIELD, "Month", "Year"]]

    index = pd.MultiIndex.from_product([fields, months], names=[FIELD, "Month"])
    one_year = num_part.reindex(index).reset_index().merge(
        latest[[FIELD] + txt_cols], on=FIELD, how="left")

    rows = pd.concat([one_year.assign(Year=int(y)) for y in years], ignore_index=True)
    if "Month.1" in hist.columns:
        rows["Month.1"] = rows["Month"]
    if "Field Key.1" in hist.columns:
        rows["Field Key.1"] = rows[FIELD]

    for column, factor in (scale or {}).items():
        if column not in rows.columns:
            raise SystemExit(f"--scale column not in the data: {column}")
        rows[column] = rows[column] * factor

    return add_features(rows)


def sort_rows(df, fields):
    """Order by field, then year, then calendar month."""
    df = df.copy()
    df["_field"] = pd.Categorical(df[FIELD], categories=fields, ordered=True)
    df["_month"] = df["Month"].map(MONTH_NUM)
    df = df.sort_values(["_field", "Year", "_month"]).reset_index(drop=True)
    return df.drop(columns=["_field", "_month"])


# ---------------------------------------------------------------------
# outputs
# ---------------------------------------------------------------------
def save_outputs(pred, months, years, prefix, plot=False):
    long_path = f"{prefix}_long.csv"
    pred.to_csv(long_path, index=False)

    pred = pred.copy()
    pred["Period"] = pred["Month"] + "-" + pred["Year"].astype(str)
    periods = [f"{m}-{y}" for y in years for m in months]
    wide = pred.pivot(index=FIELD, columns="Period", values="Predicted_Yield_Month")
    wide = wide.reindex(index=list(dict.fromkeys(pred[FIELD])), columns=periods)
    for y in years:
        cols = [f"{m}-{y}" for m in months]
        wide[f"Total_{y}"] = wide[cols].sum(axis=1)
    wide_path = f"{prefix}_by_field.csv"
    wide.round(3).to_csv(wide_path)

    summary = (pred.groupby(["Year", "Month"])["Predicted_Yield_Month"]
                   .agg(["mean", "min", "max"]).reset_index())
    summary["_o"] = summary["Month"].map(MONTH_NUM)
    summary = summary.sort_values(["Year", "_o"]).drop(columns="_o")

    print("\nPREDICTED Yield_Month (kg/ha)  mean across the selected fields - predict_any_period.py:204")
    print(summary.round(2).to_string(index=False))
    print(f"\nSaved > {long_path}  ({len(pred)} rows) - predict_any_period.py:206")
    print(f"Saved > {wide_path} - predict_any_period.py:207")

    if plot:
        import matplotlib.pyplot as plt
        fig, ax = plt.subplots(figsize=(max(8, 0.5 * len(periods)), 5))
        for y in years:
            block = summary[summary["Year"] == y]
            ax.plot(block["Month"], block["mean"], marker="o", label=str(y))
        ax.set_xlabel("Month")
        ax.set_ylabel("Mean predicted Yield_Month (kg/ha)")
        ax.set_title("Predicted tea yield (CatBoost)")
        ax.grid(alpha=0.3)
        ax.legend()
        plt.tight_layout()
        plt.savefig(f"{prefix}.png", dpi=300)
        print(f"Saved > {prefix}.png - predict_any_period.py:222")
        plt.show()


def evaluate(pred):
    from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
    test = pred.dropna(subset=["Actual_Yield_Month"])
    if test.empty:
        return
    def row(label, t):
        return {"Group": label, "n": len(t),
                "R2": r2_score(t["Actual_Yield_Month"], t["Predicted_Yield_Month"]) if len(t) > 1 else np.nan,
                "MAE": mean_absolute_error(t["Actual_Yield_Month"], t["Predicted_Yield_Month"]),
                "RMSE": np.sqrt(mean_squared_error(t["Actual_Yield_Month"], t["Predicted_Yield_Month"]))}
    rows = [row("All", test)]
    for (y, m), block in test.groupby(["Year", "Month"], sort=False):
        rows.append(row(f"{m} {y}", block))
    print("\n================ TEST AGAINST ACTUAL YIELDS ================ - predict_any_period.py:239")
    print(pd.DataFrame(rows).round(4).to_string(index=False))


# ---------------------------------------------------------------------
# main
# ---------------------------------------------------------------------
def main():
    ap = argparse.ArgumentParser(description="Predict tea yield for any month(s), year(s) and field(s).")
    ap.add_argument("--years", default="", help="2026 | 2026,2028 | 2026-2030")
    ap.add_argument("--months", default="all", help="all | Jan,Feb | Jan-May | June")
    ap.add_argument("--fields", default="all", help="all | 10,11,7A")
    ap.add_argument("--base-years", default="all", help="years used to build the inputs (default: all)")
    ap.add_argument("--scale", default="", help="what-if factors, e.g. 'Rainfall=0.9,Sunshine=1.05'")
    ap.add_argument("--template", action="store_true",
                    help="write a blank input CSV for the period instead of predicting")
    ap.add_argument("--from-csv", default="", help="predict from a filled input CSV")
    ap.add_argument("--history", default=HISTORY_CSV)
    ap.add_argument("--model", default=MODEL_FILE)
    ap.add_argument("--out", default="PREDICTION", help="prefix for the output files")
    ap.add_argument("--plot", action="store_true")
    args = ap.parse_args()

    hist = load_history(args.history)
    all_fields = list(dict.fromkeys(hist[FIELD]))
    last_year = int(hist["Year"].max())

    # ---------- predict from a filled input file ----------
    if args.from_csv:
        pipe, feature_cols = load_model(args.model)
        raw = pd.read_csv(args.from_csv, dtype={FIELD: str, "Field Key.1": str})
        raw.columns = raw.columns.str.strip()
        rows = add_features(raw)
        missing = [c for c in feature_cols if c not in rows.columns]
        if missing:
            raise SystemExit(f"Columns missing in {args.from_csv}: {missing}")
        empty = rows[feature_cols].isna().mean()
        empty = empty[empty > 0]
        if len(empty):
            print("WARNING  empty inputs, filled with the training median: - predict_any_period.py:278")
            print((empty * 100).round(1).astype(str).add("% - predict_any_period.py:279").to_string())
        rows["Predicted_Yield_Month"] = np.clip(pipe.predict(rows[feature_cols]), 0, None).round(3)
        pred = rows[[FIELD, "Year", "Month", "Predicted_Yield_Month"]].copy()
        if TARGET in rows.columns and rows[TARGET].notna().any():
            pred["Actual_Yield_Month"] = rows[TARGET].values
            pred["Error"] = pred["Predicted_Yield_Month"] - pred["Actual_Yield_Month"]
        months = [m for m in MONTHS if m in set(pred["Month"])]
        years = sorted(pred["Year"].unique().tolist())
        pred = sort_rows(pred, [f for f in all_fields if f in set(pred[FIELD])])
        save_outputs(pred, months, years, args.out, args.plot)
        if "Actual_Yield_Month" in pred.columns:
            evaluate(pred)
        return

    years = parse_years(args.years, [last_year + 1])
    months = parse_months(args.months)
    fields = parse_fields(args.fields, all_fields)
    base_years = parse_years(args.base_years, sorted(hist["Year"].unique().tolist()))
    scale = parse_scale(args.scale)

    print(f"Fields: {len(fields)} | Months: {months} | Years: {years} - predict_any_period.py:299")
    print(f"Inputs built from the {base_years[0]}{base_years[1]} samemonth averages - predict_any_period.py:300"
          + (f" | scaled: {scale}" if scale else ""))

    rows = build_rows(hist, fields, months, years, base_years, scale)

    # ---------- blank template for real input values ----------
    if args.template:
        monthly = [c for c in rows.columns
                   if c not in ENGINEERED + [FIELD, "Field Key.1", "Month", "Month.1", "Year"]
                   and pd.api.types.is_numeric_dtype(rows[c])]
        template = rows.drop(columns=ENGINEERED)
        template[monthly] = np.nan
        path = f"{args.out}_INPUT_TEMPLATE.csv"
        template.to_csv(path, index=False)
        print(f"\nTemplate saved > {path} ({len(template)} rows) - predict_any_period.py:314")
        print("Fill in the real values (and the actual Yield_Month if you have it), then run: - predict_any_period.py:315")
        print(f"python {sys.argv[0]} fromcsv {path} - predict_any_period.py:316")
        return

    # ---------- predict ----------
    pipe, feature_cols = load_model(args.model)
    missing = [c for c in feature_cols if c not in rows.columns]
    if missing:
        raise SystemExit(f"Training columns that could not be built: {missing}")
    rows["Predicted_Yield_Month"] = np.clip(pipe.predict(rows[feature_cols]), 0, None).round(3)

    pred = sort_rows(rows[[FIELD, "Year", "Month", "Predicted_Yield_Month"]], fields)
    save_outputs(pred, months, years, args.out, args.plot)

    if max(years) > last_year:
        print(f"\nNote: the model was trained on data up to {last_year}. Years beyond that get the - predict_any_period.py:330"
              "same inputs, so their predictions repeat unless you change --base-years or --scale.")


if __name__ == "__main__":
    main()