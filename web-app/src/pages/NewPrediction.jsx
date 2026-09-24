import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import PageHeader from '../components/PageHeader.jsx'
import Field from '../components/Field.jsx'
import { defaultInputs, featureSections } from '../data/featureSchema.js'
import {
  fetchFieldDefaults,
  fetchFields,
  isBackendConnected,
  predictYield,
} from '../services/predictionApi.js'
import { usePrediction } from '../context/PredictionContext.jsx'

/** Panel 1 of Figure 13 — the input form. */
export default function NewPrediction() {
  const navigate = useNavigate()
  const { setPrediction, setLastInputs } = usePrediction()
  const [inputs, setInputs] = useState(defaultInputs)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [fields, setFields] = useState([])
  const [defaultsNote, setDefaultsNote] = useState(null)

  // Load the field keys once and select the first field.
  useEffect(() => {
    let cancelled = false
    fetchFields()
      .then((rows) => {
        if (cancelled) return
        setFields(rows)
        setInputs((current) =>
          current.field_key ? current : { ...current, field_key: rows[0]?.field_key ?? '' }
        )
      })
      .catch((requestError) => !cancelled && setError(requestError.message))
    return () => {
      cancelled = true
    }
  }, [])

  // When the field or month changes, pre-fill the form with that field's
  // historical average for the month (backend only). Every value stays editable.
  useEffect(() => {
    if (!isBackendConnected || !inputs.field_key) return
    let cancelled = false
    fetchFieldDefaults(inputs.field_key, inputs.month)
      .then((result) => {
        if (cancelled || !result) return
        setInputs((current) => ({ ...current, ...stripNulls(result.values) }))
        setDefaultsNote(
          `Pre-filled with the ${result.month} average of field ${result.field_key} ` +
            `(${result.base_years[0]}–${result.base_years[result.base_years.length - 1]}). ` +
            'Edit any value before predicting.'
        )
      })
      .catch((requestError) => !cancelled && setError(requestError.message))
    return () => {
      cancelled = true
    }
  }, [inputs.field_key, inputs.month])

  // Inject the field keys into the schema's Field Key select.
  const sections = useMemo(
    () =>
      featureSections.map((section) => ({
        ...section,
        fields: section.fields.map((field) =>
          field.key === 'field_key'
            ? { ...field, options: fields.map((row) => row.field_key) }
            : field
        ),
      })),
    [fields]
  )

  const handleChange = (key, value) => {
    setInputs((current) => ({ ...current, [key]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const payload = toNumericPayload(inputs)
      const result = await predictYield(payload)
      setLastInputs(payload)
      setPrediction(result)
      navigate('/result')
    } catch (requestError) {
      setError(requestError.message ?? 'Prediction failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <PageHeader title="New Prediction" subtitle="Enter the input values for prediction" />

      <form onSubmit={handleSubmit} className="max-w-2xl">
        {defaultsNote ? (
          <p className="mb-4 rounded-md border border-success-border bg-success-bg px-3 py-2 text-xs text-primary-dark">
            {defaultsNote}
          </p>
        ) : null}

        {sections.map((section) => (
          <section key={section.title} className="mb-6">
            <h2 className="ty-section-title">{section.title}</h2>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              {section.fields.map((field) => (
                <div key={field.key} className={field.width === 'half' ? 'col-span-1' : 'col-span-2'}>
                  <Field field={field} value={inputs[field.key]} onChange={handleChange} />
                </div>
              ))}
            </div>
          </section>
        ))}

        {error ? (
          <p className="mb-3 rounded-md border border-negative/30 bg-negative/5 px-3 py-2 text-xs text-negative">
            {error}
          </p>
        ) : null}

        <button type="submit" className="ty-btn-primary w-full" disabled={submitting}>
          <Sparkles className="h-4 w-4" strokeWidth={2} />
          {submitting ? 'Predicting…' : 'Predict Yield'}
        </button>
      </form>
    </>
  )
}

function stripNulls(values) {
  return Object.fromEntries(
    Object.entries(values ?? {}).filter(([, value]) => value !== null && value !== undefined)
  )
}

/** Numeric fields arrive from the DOM as strings; the API expects numbers. */
function toNumericPayload(inputs) {
  const numericKeys = featureSections
    .flatMap((section) => section.fields)
    .filter((field) => field.type === 'number')
    .map((field) => field.key)

  return Object.fromEntries(
    Object.entries(inputs).map(([key, value]) => [
      key,
      numericKeys.includes(key) ? Number(value) : value,
    ])
  )
}
