import { useEffect, useState } from 'react'
import PageHeader from '../components/PageHeader.jsx'
import { fetchPredictionHistory } from '../services/predictionApi.js'
import { formatYield } from '../lib/format.js'

export default function PredictionHistory() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    fetchPredictionHistory().then((result) => {
      if (cancelled) return
      setRows(result)
      setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <>
      <PageHeader title="Prediction History" subtitle="Previous predictions made with this model" />

      <section className="ty-card overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-line bg-page/60">
              <th className="px-5 py-3 text-xs font-semibold text-ink">Field</th>
              <th className="px-5 py-3 text-xs font-semibold text-ink">Month</th>
              <th className="px-5 py-3 text-xs font-semibold text-ink">Predicted Yield</th>
              <th className="px-5 py-3 text-xs font-semibold text-ink">Actual Yield</th>
              <th className="px-5 py-3 text-xs font-semibold text-ink">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-5 py-6 text-center text-xs text-muted">
                  Loading…
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-b border-line last:border-b-0">
                  <td className="px-5 py-3 text-xs text-ink">{row.field_key ?? '-'}</td>
                  <td className="px-5 py-3 text-xs text-ink">{row.month}</td>
                  <td className="px-5 py-3 text-xs text-ink">
                    {formatYield(row.predicted)} kg/ha
                  </td>
                  <td className="px-5 py-3 text-xs text-ink">
                    {row.actual === null ? '-' : `${formatYield(row.actual)} kg/ha`}
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={row.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </>
  )
}

function StatusBadge({ status }) {
  const completed = status === 'Completed'

  return (
    <span
      className={[
        'inline-flex rounded-full px-2.5 py-0.5 text-2xs font-medium',
        completed
          ? 'border border-success-border bg-success-bg text-primary-dark'
          : 'border border-line bg-page text-muted',
      ].join(' ')}
    >
      {status}
    </span>
  )
}
