import { useEffect, useMemo, useState } from 'react'
import { Download } from 'lucide-react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import PageHeader from '../components/PageHeader.jsx'
import InfoBox from '../components/InfoBox.jsx'
import { fetchForecast, forecastCsvUrl } from '../services/predictionApi.js'
import { formatYield } from '../lib/format.js'

const ALL_FIELDS = '__all__'
const YEAR_COLOURS = ['#3F8E4F', '#8FA795', '#1F3B2D']

/** Monthly predicted yield for every field over the next two years. */
export default function YieldForecast() {
  const [forecast, setForecast] = useState(null)
  const [error, setError] = useState(null)
  const [selectedField, setSelectedField] = useState(ALL_FIELDS)

  useEffect(() => {
    let cancelled = false
    fetchForecast()
      .then((result) => !cancelled && setForecast(result))
      .catch((requestError) => !cancelled && setError(requestError.message))
    return () => {
      cancelled = true
    }
  }, [])

  const view = useMemo(() => (forecast ? buildView(forecast, selectedField) : null), [
    forecast,
    selectedField,
  ])

  const title = forecast
    ? `Monthly predicted made tea yield by field, January ${forecast.years[0]} – December ${
        forecast.years[forecast.years.length - 1]
      }`
    : 'Monthly predicted made tea yield by field'

  return (
    <>
      <PageHeader title="Yield Forecast" subtitle={title} />

      {error ? (
        <p className="rounded-md border border-negative/30 bg-negative/5 px-3 py-2 text-xs text-negative">
          {error}
        </p>
      ) : null}

      {!forecast && !error ? (
        <div className="ty-card flex h-40 items-center justify-center text-xs text-muted">
          Loading forecast…
        </div>
      ) : null}

      {view ? (
        <div className="space-y-6">
          {/* Controls */}
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="w-64">
              <label htmlFor="forecast-field" className="ty-label">
                Field Key
              </label>
              <select
                id="forecast-field"
                value={selectedField}
                onChange={(event) => setSelectedField(event.target.value)}
                className="ty-input"
              >
                <option value={ALL_FIELDS}>All fields (mean)</option>
                {forecast.fields.map((field) => (
                  <option key={field} value={field}>
                    {field}
                  </option>
                ))}
              </select>
            </div>
            <a href={forecastCsvUrl(forecast.years)} className="ty-btn-secondary">
              <Download className="h-4 w-4" strokeWidth={2} />
              Download CSV
            </a>
          </div>

          {/* Yearly totals */}
          <div className="grid grid-cols-3 gap-4">
            {forecast.years.map((year) => (
              <div key={year} className="ty-card px-5 py-4">
                <p className="text-xs text-muted">Predicted yield {year}</p>
                <p className="mt-2 text-lg font-bold text-ink">
                  {formatYield(view.yearTotals[year])} kg/ha
                </p>
              </div>
            ))}
            <div className="ty-card px-5 py-4">
              <p className="text-xs text-muted">Peak month</p>
              <p className="mt-2 text-lg font-bold text-ink">
                {view.peak.month} ({formatYield(view.peak.value)} kg/ha)
              </p>
            </div>
          </div>

          {/* Chart */}
          <section className="ty-card px-5 py-4">
            <h2 className="text-[15px] font-semibold text-ink">
              {selectedField === ALL_FIELDS ? 'All fields (mean)' : `Field ${selectedField}`}
            </h2>
            <p className="mb-4 mt-1 text-xs text-muted">Predicted Yield_Month (kg/ha) by month</p>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={view.chart} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                <CartesianGrid stroke="#EDF1EE" />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={{ stroke: '#D7DFD9' }}
                  tick={{ fontSize: 10 }}
                />
                <YAxis tickLine={false} axisLine={{ stroke: '#D7DFD9' }} tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(value) => `${formatYield(value)} kg/ha`}
                  contentStyle={{ border: '1px solid #E1E7E2', borderRadius: 6, fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {forecast.years.map((year, index) => (
                  <Line
                    key={year}
                    type="monotone"
                    dataKey={String(year)}
                    name={String(year)}
                    stroke={YEAR_COLOURS[index % YEAR_COLOURS.length]}
                    strokeWidth={2}
                    strokeDasharray={index === 0 ? undefined : '4 3'}
                    dot={{ r: 3 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </section>

          {/* Field x month table */}
          {forecast.years.map((year) => (
            <section key={year} className="ty-card overflow-hidden">
              <h2 className="border-b border-line px-5 py-3.5 text-[15px] font-semibold text-ink">
                {year} — predicted Yield_Month by field (kg/ha)
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-line bg-page/60">
                      <th className="sticky left-0 bg-page px-4 py-2.5 text-xs font-semibold text-ink">
                        Field Key
                      </th>
                      {forecast.months.map((month) => (
                        <th key={month} className="px-3 py-2.5 text-right text-xs font-semibold text-ink">
                          {month}
                        </th>
                      ))}
                      <th className="px-4 py-2.5 text-right text-xs font-semibold text-ink">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {view.tableFields.map((field) => (
                      <tr
                        key={field}
                        className={[
                          'border-b border-line last:border-b-0',
                          field === selectedField ? 'bg-success-bg' : '',
                        ].join(' ')}
                      >
                        <td
                          className={[
                            'sticky left-0 px-4 py-2 text-xs font-medium text-ink',
                            field === selectedField ? 'bg-success-bg' : 'bg-white',
                          ].join(' ')}
                        >
                          {field}
                        </td>
                        {forecast.months.map((month) => (
                          <td key={month} className="px-3 py-2 text-right text-xs tabular-nums text-ink">
                            {formatYield(view.lookup[`${field}|${year}|${month}`], 1)}
                          </td>
                        ))}
                        <td className="px-4 py-2 text-right text-xs font-semibold tabular-nums text-ink">
                          {formatYield(view.fieldYearTotals[`${field}|${year}`], 1)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}

          <InfoBox>
            <p>
              Inputs for each field and month are the field&apos;s average for that month over{' '}
              {forecast.base_years[0]}–{forecast.base_years[forecast.base_years.length - 1]}, so the
              forecast reflects typical conditions, not a weather outlook.
            </p>
            <p>
              Both forecast years use the same inputs, so their monthly values are expected to be
              the same.
            </p>
          </InfoBox>
        </div>
      ) : null}
    </>
  )
}

function buildView(forecast, selectedField) {
  const lookup = {}
  const fieldYearTotals = {}
  for (const row of forecast.rows) {
    lookup[`${row.field_key}|${row.year}|${row.month}`] = row.predicted
    const key = `${row.field_key}|${row.year}`
    fieldYearTotals[key] = (fieldYearTotals[key] ?? 0) + row.predicted
  }

  const fieldsInView = selectedField === ALL_FIELDS ? forecast.fields : [selectedField]
  const valueFor = (year, month) => {
    const values = fieldsInView
      .map((field) => lookup[`${field}|${year}|${month}`])
      .filter((value) => value !== undefined)
    return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null
  }

  const chart = forecast.months.map((month) => {
    const point = { month }
    for (const year of forecast.years) point[String(year)] = valueFor(year, month)
    return point
  })

  const yearTotals = {}
  let peak = { month: '-', value: null }
  for (const year of forecast.years) {
    yearTotals[year] = 0
    for (const month of forecast.months) {
      const value = valueFor(year, month) ?? 0
      yearTotals[year] += value
      if (peak.value === null || value > peak.value) peak = { month: `${month} ${year}`, value }
    }
  }

  return { lookup, fieldYearTotals, chart, yearTotals, peak, tableFields: forecast.fields }
}
