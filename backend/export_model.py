# =====================================================================
# Run this as a NEW CELL at the end of your training notebook
# (after "TUNE ALL MODELS AND COMPARE"). It saves the tuned CatBoost
# pipeline for the web backend:  backend/model/catboost_tea_yield_pipeline.joblib
# =====================================================================
import os
import joblib
from sklearn.base import clone

MODEL_NAME = "CatBoost"
REFIT_ON_ALL_DATA = True      # retrain tuned CatBoost on all 2021-2025 rows

model = clone(best_models_all[MODEL_NAME]).fit(X, y) if REFIT_ON_ALL_DATA \
        else best_models_all[MODEL_NAME]

bundle = {
    "pipeline": model,
    "feature_columns": list(X.columns),
    "target": TARGET,
    "best_params": best_params_all[MODEL_NAME],
    # metrics shown in the web app (thesis values for the final CatBoost model)
    "metrics": {"r2": 0.9887, "rmse": 7.926, "mae": 4.410},
}

os.makedirs("backend/model", exist_ok=True)      # change the path if needed
joblib.dump(bundle, "backend/model/catboost_tea_yield_pipeline.joblib")
print("Saved backend/model/catboost_tea_yield_pipeline.joblib with",
      len(bundle["feature_columns"]), "features")
