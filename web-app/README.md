# TeaYield Predictor — Frontend

React frontend for the tea yield prediction research project. The interface is a
direct implementation of **Figure 13: Prediction application interface** from the
thesis — the figure is the authoritative visual reference and the UI should not be
redesigned.

## Stack

- React 18 + Vite
- Tailwind CSS (palette sampled from the thesis figure, see `tailwind.config.js`)
- React Router
- Recharts (feature importance, dependence plot, dashboard trend)
- Hand-drawn SVG for the SHAP waterfall and beeswarm, so they match the figure

## Running

```bash
npm install
npm run dev
```

The app starts on <http://localhost:5173> with mock data — no backend needed.

## Screens

| Route | Screen | Figure 13 panel |
| --- | --- | --- |
| `/new-prediction` | Input form | 1 — Input Form |
| `/result` | Prediction result, summary, cross-validation metrics | 2 — Prediction Output View |
| `/shap` | Waterfall, feature impact, info note | 3 — SHAP Explanation View |
| `/dashboard` | Minimal overview | — |
| `/history` | Past predictions table | — |
| `/forecast` | 2-year monthly forecast by field (needs the backend) | — |
| `/about` | Research and model notes | — |

## Project structure

```
src/
├── components/        shell, cards, form controls
│   └── charts/        SHAP waterfall, beeswarm, importance, dependence
├── context/           holds the prediction shared by the result and SHAP screens
├── data/              mock payloads and the input-field schema
├── lib/               number formatting and the SHAP colour scale
├── pages/             one file per route
├── services/
│   └── predictionApi.js   the only module that talks to the backend
└── App.jsx
```

## Connecting the FastAPI backend

All backend access lives in [`src/services/predictionApi.js`](src/services/predictionApi.js).
No component imports `fetch` or knows about CatBoost. To switch from mock data to
the real service, copy `.env.example` to `.env` and set:

```
VITE_API_URL=http://127.0.0.1:8000
```

With `VITE_API_URL` set, the service calls the real endpoints instead of returning
mock data. Endpoints expected by the frontend:

| Method | Path | Used by |
| --- | --- | --- |
| `POST` | `/api/predict` | New Prediction form |
| `POST` | `/api/explain` | SHAP Explanation screen |
| `GET` | `/api/predictions` | Prediction History, Dashboard |
| `GET` | `/api/fields`, `/api/field-defaults` | Field Key select and form pre-fill |
| `GET` | `/api/forecast`, `/api/forecast.csv` | Yield Forecast |

The backend lives in `../backend` — see its README for how to run it.

### `POST /api/predict`

Request body — keys are the `key` values in
[`src/data/featureSchema.js`](src/data/featureSchema.js), which is the one place to
rename fields once the final CatBoost feature names are confirmed:

```json
{
  "last12_yph_nitrogen": 1250,
  "nitrogen_per_hect_month": 35,
  "plucking_average_month": 780,
  "gl_ha_rd_month": 42.5,
  "lph_month": 1250,
  "plucking_round_months": 14,
  "rainfall": 245.0,
  "airtemp_max": 28.6,
  "sunshine": 7.8,
  "rh_morning": 92,
  "wetdays": 12,
  "extent": 24.6,
  "age_as_at_310324": 18,
  "month": "June"
}
```

Response:

```json
{
  "prediction": 1286.45,
  "unit": "kg/ha",
  "model": "CatBoost Regressor",
  "prediction_month": "June",
  "prediction_date": "10 May 2025, 10:24 AM",
  "extent": 24.6,
  "actual_yield": null,
  "base_value": 1102.37,
  "metrics": { "r2": 0.9887, "rmse": 7.83, "mae": 4.68 },
  "shap_values": [{ "feature": "Rainfall", "value": 19.73 }]
}
```

### `POST /api/explain`

```json
{
  "base_value": 1102.37,
  "shap_values": [{ "feature": "Rainfall", "value": 19.73 }],
  "feature_importance": [{ "feature": "Rainfall", "value": 24.6 }],
  "beeswarm": [
    {
      "feature": "Rainfall",
      "points": [{ "shap": 12.4, "normalized": 0.82, "jitter": 0.1 }]
    }
  ]
}
```

`normalized` is the feature value scaled to 0–1 and drives the blue-to-red colour
scale; `jitter` (-0.25 to 0.25) only spreads overlapping dots vertically.

## Notes on the mock data

- Feature names and the sample record in
  [`featureSchema.js`](src/data/featureSchema.js) are taken from Figure 13.
- The SHAP contributions in [`mockShap.js`](src/data/mockShap.js) were set so they
  sum exactly to `prediction - base_value` (1286.45 − 1102.37 = 184.08), which is
  what makes the waterfall close on the predicted value. They are placeholders and
  will be replaced by the values the backend returns.
- Cross-validation metrics live in [`modelInfo.js`](src/data/modelInfo.js) only, so
  the reported figures can be updated in one place.
