# TeaYield Predictor — Backend (FastAPI)

Serves the trained CatBoost pipeline to the React frontend in `../web-app`.

## 1. Export the trained model (once)

Run `export_model.py` as a new cell at the end of the training notebook
(after the "TUNE ALL MODELS AND COMPARE" cell). It writes
`backend/model/catboost_tea_yield_pipeline.joblib`. If the notebook is in another
folder, copy that file into `backend/model/`.

The dataset is already in `backend/data/MATTAKELLE_2021_2025_WITH_METEOROLOGY.csv`.

## 2. Start the API

Use the SAME conda environment that trained the model (scikit-learn and CatBoost
versions must match, otherwise the saved pipeline will not load):

```bash
conda activate tea_ml
pip install fastapi "uvicorn[standard]"
cd backend
uvicorn app.main:app --reload --port 8000
```

Check it: <http://127.0.0.1:8000/api/health> and the interactive docs at
<http://127.0.0.1:8000/docs>.

## Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/health` | model and data status |
| GET | `/api/fields` | field keys with extent and age |
| GET | `/api/field-defaults?field_key=10&month=June` | the field's same-month average (pre-fills the form) |
| POST | `/api/predict` | one prediction + SHAP waterfall values; saved to history |
| POST | `/api/explain` | SHAP for the last inputs + global importance, beeswarm, dependence |
| GET | `/api/predictions` | prediction history (SQLite, `data/history.db`) |
| GET | `/api/forecast?years=2026,2027&field_key=10` | monthly forecast for every field |
| GET | `/api/forecast.csv` | the same forecast as a CSV download |

## How inputs are built

The form sends 13 values plus field key, month and year. The model uses all the
columns in `X`, so the remaining columns are taken from the selected field's
average for that calendar month over 2021–2025 (text columns from its latest 2025
record). The same feature engineering as the notebook is then applied
(`Month_sin`, `Month_cos`, `Date_Index`, `Rainfall_per_WetDay`, `Temp_Range`).

The 2-year forecast uses the same field × month averages, so 2026 and 2027 come
out identical — CatBoost cannot extend a trend beyond the last training year.

SHAP values come from CatBoost's built-in `ShapValues` (no `shap` package needed).
One-hot and engineered columns are added back to their source feature (for
example `Month`, `Month_sin`, `Month_cos` → "Month"), and the waterfall closes
exactly on the prediction.

## Settings (environment variables)

`MODEL_PATH`, `DATA_PATH`, `HISTORY_PATH`, `FRONTEND_ORIGINS`
(default `http://localhost:5173,http://127.0.0.1:5173`).
