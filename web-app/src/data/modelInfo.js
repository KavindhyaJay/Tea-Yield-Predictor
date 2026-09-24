/**
 * Model metadata and cross-validation metrics.
 *
 * These are kept in one place so the figures reported in the thesis can be
 * updated without touching any component. Once the backend is connected the
 * same shape arrives in the `/api/predict` response under `metrics`.
 */
export const modelInfo = {
  name: 'CatBoost Regressor',
  metrics: {
    r2: 0.9887,
    rmse: 7.926,
    mae: 4.41,
  },
}

export const metricLabels = {
  r2: 'R² (Mean)',
  rmse: 'RMSE (Mean)',
  mae: 'MAE (Mean)',
}
