"""
FastAPI backend for the TeaYield Predictor frontend.

Run from the backend folder:
    uvicorn app.main:app --reload --port 8000
"""
import os
from pathlib import Path

from fastapi import Body, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

from .history import HistoryStore
from .model_service import TeaYieldService

BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_PATH = os.getenv("MODEL_PATH", str(BASE_DIR / "model" / "catboost_tea_yield_pipeline.joblib"))
DATA_PATH = os.getenv("DATA_PATH", str(BASE_DIR / "data" / "MATTAKELLE_2021_2025_WITH_METEOROLOGY.csv"))
HISTORY_PATH = os.getenv("HISTORY_PATH", str(BASE_DIR / "data" / "history.db"))
configured_origins = [origin.strip() for origin in os.getenv(
    "FRONTEND_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
).split(",") if origin.strip()]
FRONTEND_ORIGINS = list(dict.fromkeys(
    configured_origins + ["https://kavindhyajay.github.io"]
))

app = FastAPI(title="TeaYield Predictor API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=FRONTEND_ORIGINS,
                   allow_methods=["*"], allow_headers=["*"])

service = TeaYieldService(MODEL_PATH, DATA_PATH)
history = HistoryStore(HISTORY_PATH)


def _parse_years(years: str | None):
    if not years:
        return None
    try:
        return [int(y) for y in years.split(",") if y.strip()]
    except ValueError:
        raise HTTPException(400, "years must look like 2026,2027")


@app.get("/api/health")
def health():
    return {"status": "ok", "model": service.model_name,
            "features": len(service.feature_columns), "fields": len(service.field_order),
            "data_until": service.last_data_year}


@app.get("/api/fields")
def fields():
    return service.fields()


@app.get("/api/field-defaults")
def field_defaults(field_key: str, month: str):
    try:
        return service.field_defaults(field_key, month)
    except (KeyError, ValueError) as err:
        raise HTTPException(404, str(err))


@app.post("/api/predict")
def predict(payload: dict = Body(...)):
    try:
        result = service.predict_one(payload)
        result["id"] = history.add(result, payload)
        result["inputs"] = payload
        return result
    except (KeyError, ValueError) as err:
        raise HTTPException(422, str(err))
    except Exception as err:
        # Return a readable API error instead of an opaque browser CORS failure.
        raise HTTPException(500, f"Prediction failed: {err}") from err


@app.post("/api/explain")
def explain(payload: dict = Body(default={})):
    try:
        return service.explain_payload(payload or {})
    except (KeyError, ValueError) as err:
        raise HTTPException(422, str(err))


@app.get("/api/predictions")
def predictions():
    return history.list()


@app.get("/api/forecast")
def forecast(years: str | None = Query(None, description="e.g. 2026,2027"),
             field_key: str | None = None):
    return service.forecast_json(_parse_years(years), field_key)


@app.get("/api/forecast.csv")
def forecast_csv(years: str | None = None):
    csv = service.forecast_csv(_parse_years(years))
    return Response(csv, media_type="text/csv", headers={
        "Content-Disposition": "attachment; filename=FIELD_MONTHLY_PREDICTION.csv"})
