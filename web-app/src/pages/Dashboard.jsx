import { useEffect, useState } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import PageHeader from '../components/PageHeader.jsx'
import { modelInfo } from '../data/modelInfo.js'
import { fetchPredictionHistory } from '../services/predictionApi.js'
import { formatYield } from '../lib/format.js'

/** Minimal overview kept secondary to the three screens shown in the thesis. */
export default function Dashboard() {
  const [history, setHistory] = useState([])
  const [historyError, setHistoryError] = useState(null)

  useEffect(() => {
    let cancelled = false

    fetchPredictionHistory()
      .then((rows) => {
        if (cancelled) return
        setHistory([...rows].reverse())
      })
      .catch((error) => {
        if (!cancelled) setHistoryError(error.message)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const latestPrediction = history.at(-1)
  const summary = [
    {
      label: 'Latest Prediction',
      value: latestPrediction ? `${formatYield(latestPrediction.predicted)} kg/ha` : '-',
    },
    {
      label: 'Latest Prediction Month',
      value: latestPrediction?.month ?? '-',
    },
    { label: 'Model', value: modelInfo.name.replace(' Regressor', '') },
  ]

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Overview of the latest prediction" />

      <div className="grid grid-cols-3 gap-4">
        {summary.map((item) => (
          <div key={item.label} className="ty-card px-5 py-4">
            <p className="text-xs text-muted">{item.label}</p>
            <p className="mt-2 text-lg font-bold text-ink">{item.value}</p>
          </div>
        ))}
      </div>

      <section className="ty-card mt-6 px-5 py-4">
        <h2 className="text-[15px] font-semibold text-ink">Predicted vs Actual Yield</h2>
        <p className="mb-4 mt-1 text-xs text-muted">Tea yield (kg/ha) by month</p>
        {historyError ? (
          <p className="mb-4 rounded-md border border-negative/30 bg-negative/5 px-3 py-2 text-xs text-negative">
            {historyError}
          </p>
        ) : null}
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={history} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
            <CartesianGrid stroke="#EDF1EE" />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={{ stroke: '#D7DFD9' }}
              tick={{ fontSize: 10 }}
            />
            <YAxis
              domain={['dataMin - 60', 'dataMax + 60']}
              tickLine={false}
              axisLine={{ stroke: '#D7DFD9' }}
              tick={{ fontSize: 10 }}
            />
            <Tooltip
              contentStyle={{ border: '1px solid #E1E7E2', borderRadius: 6, fontSize: 12 }}
            />
            <Line
              type="monotone"
              dataKey="predicted"
              name="Predicted"
              stroke="#3F8E4F"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="actual"
              name="Actual"
              stroke="#8FA795"
              strokeWidth={2}
              strokeDasharray="4 3"
              dot={{ r: 3 }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </section>
    </>
  )

}
