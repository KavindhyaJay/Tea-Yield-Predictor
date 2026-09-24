# TeaYield Predictor — full system

```
TeaYield-Predictor/
├── backend/    FastAPI + trained CatBoost pipeline   (see backend/README.md)
└── web-app/    React + Vite frontend                  (see web-app/README.md)
```

## Run it

1. **Export the model.** Run `backend/export_model.py` as the last cell of the training
   notebook. Put `catboost_tea_yield_pipeline.joblib` in `backend/model/`.
2. **Start the backend** (terminal 1):
   ```bash
   conda activate tea_ml
   pip install fastapi "uvicorn[standard]"
   cd backend
   uvicorn app.main:app --reload --port 8000
   ```
3. **Start the frontend** (terminal 2):
   ```bash
   cd web-app
   npm install
   npm run dev
   ```
   `web-app/.env` already contains `VITE_API_URL=http://127.0.0.1:8000`.
   Restart `npm run dev` whenever `.env` changes.
4. Open <http://localhost:5173>.

## Screens connected to the model

- **New Prediction:** choose a Field Key, month and year. The form fills with that
  field's historical values for the month; edit anything and press *Predict Yield*.
- **Prediction Result:** predicted Yield_Month (kg/ha); the actual yield is shown when
  the month is in the 2021–2025 data.
- **SHAP Explanations:** waterfall for this prediction plus global importance,
  beeswarm and dependence plots from the model.
- **Prediction History:** every prediction, stored by the backend.
- **Yield Forecast (new):** monthly prediction for every field, Jan 2026 – Dec 2027,
  with a chart, field × month tables and a CSV download.
