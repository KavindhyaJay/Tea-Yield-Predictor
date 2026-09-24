import { modelInfo } from './modelInfo.js'
import { baseValue, shapValues } from './mockShap.js'

/**
 * Mock response for a single prediction. Its shape is exactly the payload the
 * FastAPI backend will return from POST /api/predict, so swapping the mock for
 * a real fetch in `services/predictionApi.js` requires no UI changes.
 */
export const mockPrediction = {
  prediction: 1286.45,
  unit: 'kg/ha',
  model: modelInfo.name,
  prediction_month: 'June',
  prediction_date: '10 May 2025, 10:24 AM',
  extent: 24.6,
  actual_yield: null,
  base_value: baseValue,
  metrics: modelInfo.metrics,
  shap_values: shapValues,
}

export default mockPrediction
