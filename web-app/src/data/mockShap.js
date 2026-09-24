/**
 * Mock SHAP output for the sample prediction shown in Figure 13.
 *
 * `shapValues` is the array the backend will return under `shap_values`; every
 * chart on the SHAP Explanation page is derived from it plus `baseValue`.
 * The contributions sum exactly to (prediction - baseValue) so the waterfall
 * closes on the predicted value.
 */
export const baseValue = 1102.37

export const shapValues = [
  { feature: 'Last 12 Months YPH - Nitrogen', value: 67.42 },
  { feature: 'Plucking Average - Month', value: 38.27 },
  { feature: 'GL/Ha/Rd - Month', value: 27.41 },
  { feature: 'Rainfall', value: 19.73 },
  { feature: 'Nitrogen per Hect - Month', value: 15.14 },
  { feature: 'LPH - Month', value: 11.82 },
  { feature: 'Extent', value: 10.29 },
  { feature: 'Age as at 31/03/24', value: 8.37 },
  { feature: 'AirTemp_Max', value: 4.92 },
  { feature: 'Plucking Round - Months', value: -6.21 },
  { feature: 'Sunshine', value: -4.87 },
  { feature: 'RH_Morning', value: -3.46 },
  { feature: 'WetDays', value: -2.99 },
  { feature: 'Month (June)', value: -1.76 },
]

/**
 * Mean absolute SHAP value per feature across the validation set.
 * Backend equivalent: `shap_importance`.
 */
export const featureImportance = [
  { feature: 'Last 12 Months YPH - Nitrogen', value: 71.4 },
  { feature: 'Plucking Average - Month', value: 45.8 },
  { feature: 'GL/Ha/Rd - Month', value: 33.2 },
  { feature: 'Rainfall', value: 24.6 },
  { feature: 'Nitrogen per Hect - Month', value: 19.1 },
  { feature: 'LPH - Month', value: 15.7 },
  { feature: 'Extent', value: 12.4 },
  { feature: 'Age as at 31/03/24', value: 10.2 },
  { feature: 'AirTemp_Max', value: 8.6 },
  { feature: 'Plucking Round - Months', value: 7.3 },
  { feature: 'Sunshine', value: 6.1 },
  { feature: 'RH_Morning', value: 4.9 },
  { feature: 'WetDays', value: 3.8 },
  { feature: 'Month', value: 2.6 },
]

/** Features shown in the beeswarm / dependence views, top-down. */
export const beeswarmFeatures = [
  'Last 12 Months YPH - Nitrogen',
  'Plucking Average - Month',
  'GL/Ha/Rd - Month',
  'Rainfall',
  'Nitrogen per Hect - Month',
]

/** Deterministic pseudo-random generator so the mock plots never re-shuffle. */
function seeded(seed) {
  let s = seed
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648
    return s / 2147483648
  }
}

/**
 * Per-feature scatter points: `shap` is the impact on model output,
 * `normalized` is the feature value scaled to 0..1 and drives the blue-to-red
 * colour scale ("Low impact" -> "High impact").
 */
export const beeswarmData = beeswarmFeatures.map((feature, featureIndex) => {
  const rand = seeded(97 + featureIndex * 31)
  const spread = 78 - featureIndex * 11
  const points = Array.from({ length: 44 }, () => {
    const normalized = rand()
    // High feature values push the prediction up, low values pull it down.
    const shap = (normalized - 0.5) * 2 * spread * (0.55 + rand() * 0.45)
    return {
      shap: Number(shap.toFixed(2)),
      normalized: Number(normalized.toFixed(3)),
      jitter: Number((rand() * 0.5 - 0.25).toFixed(3)),
    }
  })
  return { feature, points }
})

/** Dependence plot points: raw feature value against its SHAP value. */
export const dependenceData = {
  'Last 12 Months YPH - Nitrogen': { min: 900, max: 1600, unit: 'kg/ha' },
  'Plucking Average - Month': { min: 480, max: 1050, unit: 'kg/ha' },
  'GL/Ha/Rd - Month': { min: 22, max: 68, unit: 'kg' },
  Rainfall: { min: 40, max: 520, unit: 'mm' },
  'Nitrogen per Hect - Month': { min: 12, max: 58, unit: 'kg/ha' },
}

export function buildDependenceSeries(feature) {
  const index = Math.max(0, beeswarmFeatures.indexOf(feature))
  const range = dependenceData[feature] ?? { min: 0, max: 100, unit: '' }
  const rand = seeded(311 + index * 47)
  const spread = 78 - index * 11
  return Array.from({ length: 60 }, () => {
    const t = rand()
    const noise = (rand() - 0.5) * spread * 0.45
    return {
      x: Number((range.min + t * (range.max - range.min)).toFixed(1)),
      y: Number(((t - 0.5) * 2 * spread * 0.8 + noise).toFixed(2)),
      normalized: Number(t.toFixed(3)),
    }
  })
}
