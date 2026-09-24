/** Shared number formatting so every screen prints yields the same way. */
export function formatYield(value, decimals = 2) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '-'
  }

  return Number(value).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

export function formatSigned(value, decimals = 2) {
  const sign = value >= 0 ? '+' : '-'
  return `${sign}${Math.abs(value).toFixed(decimals)}`
}

/**
 * Blue (low feature value) to red (high feature value) scale used by the
 * SHAP beeswarm and dependence plots, mirroring the `shap` library default.
 */
export function shapColor(normalized) {
  const t = Math.min(1, Math.max(0, normalized))
  const from = [33, 102, 224]
  const to = [214, 39, 40]
  const channel = (i) => Math.round(from[i] + (to[i] - from[i]) * t)
  return `rgb(${channel(0)}, ${channel(1)}, ${channel(2)})`
}
