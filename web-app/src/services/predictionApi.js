/**
 * Boundary between the UI and the future Python/FastAPI backend.
 *
 * Nothing outside this module knows how a prediction is produced. Components
 * import these functions only; they never talk to the model directly.
 *
 * To switch from mock data to the real service, set VITE_API_URL in a .env
 * file (see .env.example) — the fetch paths below take over automatically.
 */
import mockPrediction from '../data/mockPrediction.js'
import mockHistory from '../data/mockHistory.js'
import {
  baseValue,
  shapValues,
  featureImportance,
  beeswarmData,
} from '../data/mockShap.js'

const API_URL = import.meta.env.VITE_API_URL ?? ''

/** True when the app is connected to the FastAPI backend. */
export const isBackendConnected = Boolean(API_URL)

/** Small delay so the UI exercises its loading state exactly as it will later. */
const delay = (ms = 350) => new Promise((resolve) => setTimeout(resolve, ms))

async function postJson(path, body) {
  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(await errorMessage(response, path))
  }

  return response.json()
}

async function errorMessage(response, path) {
  try {
    const body = await response.json()
    if (body?.detail) return typeof body.detail === 'string' ? body.detail : JSON.stringify(body.detail)
  } catch {
    // response had no JSON body
  }
  return `Request to ${path} failed with status ${response.status}`
}

async function getJson(path) {
  const response = await fetch(`${API_URL}${path}`)

  if (!response.ok) {
    throw new Error(`Request to ${path} failed with status ${response.status}`)
  }

  return response.json()
}

/**
 * Run a prediction for one month of field and management data.
 * @param {object} inputs values keyed by `featureSchema` field keys
 * @returns {Promise<object>} prediction payload (see data/mockPrediction.js)
 */
export async function predictYield(inputs) {
  if (API_URL) {
    return postJson('/api/predict', inputs)
  }

  await delay()
  // Mock mode: echo back the parts of the request the result screen displays.
  return {
    ...mockPrediction,
    prediction_month: inputs?.month ?? mockPrediction.prediction_month,
    extent: inputs?.extent ?? mockPrediction.extent,
    prediction_date: formatNow(),
    inputs,
  }
}

/** SHAP explanation for the most recent prediction. */
export async function fetchShapExplanation(inputs) {
  if (API_URL) {
    return postJson('/api/explain', inputs ?? {})
  }

  await delay(250)
  return {
    base_value: baseValue,
    shap_values: shapValues,
    feature_importance: featureImportance,
    beeswarm: beeswarmData,
  }
}

/** Past predictions, newest first. */
export async function fetchPredictionHistory() {
  if (!API_URL) {
    throw new Error('Prediction history needs the backend. Set VITE_API_URL in web-app/.env and restart the app.')
  }
  return getJson('/api/predictions')
}

/** Field keys for the form select (with extent and age). */
export async function fetchFields() {
  if (API_URL) {
    return getJson('/api/fields')
  }

  await delay(100)
  return mockFields
}

/**
 * Historical same-month averages for one field, keyed like featureSchema.
 * Returns null in mock mode so the form keeps its current values.
 */
export async function fetchFieldDefaults(fieldKey, month) {
  if (!API_URL || !fieldKey) return null
  const query = new URLSearchParams({ field_key: fieldKey, month })
  return getJson(`/api/field-defaults?${query}`)
}

/** Monthly forecast for every field (default: the two years after the data). */
export async function fetchForecast(years) {
  if (!API_URL) {
    throw new Error('The forecast needs the backend. Set VITE_API_URL in .env and restart the app.')
  }
  const query = years?.length ? `?years=${years.join(',')}` : ''
  return getJson(`/api/forecast${query}`)
}

/** Link to the forecast CSV served by the backend. */
export function forecastCsvUrl(years) {
  const query = years?.length ? `?years=${years.join(',')}` : ''
  return `${API_URL}/api/forecast.csv${query}`
}

const mockFields = [
  { field_key: '10', extent: 2.67, age: 35 },
  { field_key: '11', extent: 3.1, age: 30 },
]

function formatNow() {
  const now = new Date()
  const date = now.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
  const time = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
  return `${date}, ${time}`
}
