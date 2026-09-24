import { Link } from 'react-router-dom'
import { ArrowLeft, BarChart3, CheckCircle2 } from 'lucide-react'
import PageHeader from '../components/PageHeader.jsx'
import { usePrediction } from '../context/PredictionContext.jsx'
import { metricLabels } from '../data/modelInfo.js'
import { formatYield } from '../lib/format.js'

/** Panel 2 of Figure 13 — the prediction output view. */
export default function PredictionResult() {
  const { prediction } = usePrediction()

  if (!prediction) {
    return (
      <>
        <PageHeader title="Prediction Result" subtitle="No prediction has been run yet" />
        <p className="text-sm text-muted">
          Run a new prediction to view its result.
        </p>
      </>
    )
  }

  const summaryRows = [
    ['Model Used', prediction.model],
    ['Field Key', prediction.field_key ?? '-'],
    ['Prediction Date', prediction.prediction_date],
    ['Prediction Month', prediction.prediction_month],
    // ['Extent (ha)', formatYield(prediction.extent, 1)],
    ['Actual Yield (if available)', formatYield(prediction.actual_yield)],
    // ['Base Value (Model Expectation)', `${formatYield(prediction.base_value)} kg/ha`],
  ]

  return (
    <>
      <PageHeader
        title="Prediction Result"
        subtitle="Here is the predicted monthly made tea yield"
      />

      {/* Result card */}
      <div className="rounded-lg border border-success-border bg-success-bg px-6 py-7 text-center">
        <p className="text-[13px] text-muted">Predicted Made Tea Yield</p>
        <p className="mt-2 text-5xl font-bold tracking-tight text-ink">
          {formatYield(prediction.prediction)}
        </p>
        <p className="mt-1 text-lg text-muted">{prediction.unit}</p>

        <hr className="mx-auto mt-5 max-w-sm border-success-border" />

        <p className="mt-4 flex items-center justify-center gap-2 text-[13px] text-primary-dark">
          <CheckCircle2 className="h-4 w-4" strokeWidth={2} />
          Prediction completed successfully
        </p>
      </div>

      {/* Prediction summary */}
      <section className="ty-card mt-6">
        <h2 className="border-b border-line px-5 py-3.5 text-[15px] font-semibold text-ink">
          Prediction Summary
        </h2>
        <dl>
          {summaryRows.map(([label, value]) => (
            <div key={label} className="grid grid-cols-2 border-b border-line last:border-b-0">
              <dt className="px-5 py-3 text-xs text-muted">{label}</dt>
              <dd className="border-l border-line px-5 py-3 text-xs text-ink">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Cross-validation metrics */}
      <section className="ty-card mt-6">
        <h2 className="border-b border-line px-5 py-3.5 text-[15px] font-semibold text-ink">
          Performance (Cross-Validation)
        </h2>
        <div className="grid grid-cols-3 divide-x divide-line">
          {Object.entries(metricLabels).map(([key, label]) => (
            <div key={key} className="px-5 py-5 text-center">
              <p className="text-[11px] text-muted">{label}</p>
              <p className="mt-2 text-xl font-bold text-ink">
                {formatMetric(key, prediction.metrics?.[key])}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-6 flex gap-3">
        <Link to="/new-prediction" className="ty-btn-secondary flex-1">
          <ArrowLeft className="h-4 w-4" strokeWidth={2} />
          New Prediction
        </Link>
        <Link to="/shap" className="ty-btn-primary flex-1">
          <BarChart3 className="h-4 w-4" strokeWidth={2} />
          View SHAP Explanation
        </Link>
      </div>
    </>
  )
}

function formatMetric(key, value) {
  if (value === null || value === undefined) return '-'
  return key === 'r2' ? Number(value).toFixed(4) : Number(value).toFixed(3)
}
