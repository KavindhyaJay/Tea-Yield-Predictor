import { useEffect, useState } from 'react'
import PageHeader from '../components/PageHeader.jsx'
import InfoBox from '../components/InfoBox.jsx'
import ShapWaterfall from '../components/charts/ShapWaterfall.jsx'
import ShapBeeswarm, { ShapColorLegend } from '../components/charts/ShapBeeswarm.jsx'
import FeatureImportanceChart from '../components/charts/FeatureImportanceChart.jsx'
import DependencePlot from '../components/charts/DependencePlot.jsx'
import { usePrediction } from '../context/PredictionContext.jsx'
import { fetchShapExplanation } from '../services/predictionApi.js'
import { beeswarmFeatures, buildDependenceSeries, dependenceData } from '../data/mockShap.js'

const TABS = ['Waterfall (This Prediction)', 'Feature Importance', 'Dependence Plots']

/** Panel 3 of Figure 13 — the SHAP explanation view. */
export default function ShapExplanation() {
  const { prediction, lastInputs } = usePrediction()
  const [activeTab, setActiveTab] = useState(TABS[0])
  const [explanation, setExplanation] = useState(null)
  const [dependenceFeature, setDependenceFeature] = useState(beeswarmFeatures[0])

  useEffect(() => {
    let cancelled = false

    fetchShapExplanation(lastInputs).then((result) => {
      if (!cancelled) setExplanation(result)
    })

    return () => {
      cancelled = true
    }
  }, [lastInputs])

  if (!prediction) {
    return (
      <>
        <PageHeader title="SHAP Explanation" subtitle="No prediction has been run yet" />
        <p className="text-sm text-muted">
          Run a new prediction to view its explanation.
        </p>
      </>
    )
  }

  // Features and points for the dependence plot: backend data when available.
  const dependenceFeatures = explanation?.dependence
    ? Object.keys(explanation.dependence)
    : beeswarmFeatures
  const selectedDependence = dependenceFeatures.includes(dependenceFeature)
    ? dependenceFeature
    : dependenceFeatures[0]
  const dependencePoints = explanation?.dependence
    ? explanation.dependence[selectedDependence]?.points ?? []
    : buildDependenceSeries(selectedDependence)
  const dependenceUnit = explanation?.dependence
    ? explanation.dependence[selectedDependence]?.unit
    : dependenceData[selectedDependence]?.unit

  const shapValues = explanation?.shap_values ?? prediction.shap_values
  const baseValue = explanation?.base_value ?? prediction.base_value

  return (
    <>
      <PageHeader
        title="SHAP Explanation"
        subtitle="Understanding how each feature contributes to the prediction"
      />

      {/* Tabs */}
      <div className="mb-5 flex gap-7 border-b border-line">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={[
              '-mb-px border-b-2 pb-2.5 text-[13px] transition-colors',
              tab === activeTab
                ? 'border-primary font-semibold text-primary-dark'
                : 'border-transparent text-muted hover:text-ink',
            ].join(' ')}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === TABS[0] ? (
        <div className="space-y-5">
          <section className="ty-card px-5 py-4">
            <h2 className="text-[15px] font-semibold text-ink">SHAP Waterfall - This Prediction</h2>
            <p className="mt-1 text-xs text-muted">
              How features push the prediction from the base value to the final value
            </p>
            <div className="mt-4">
              <ShapWaterfall
                baseValue={baseValue}
                prediction={prediction.prediction}
                shapValues={shapValues}
              />
            </div>
          </section>

          <section className="ty-card px-5 py-4">
            <h2 className="mb-4 text-[15px] font-semibold text-ink">Feature Impact (SHAP Value)</h2>
            <ShapColorLegend />
            {explanation ? (
              <ShapBeeswarm series={explanation.beeswarm} />
            ) : (
              <ChartPlaceholder />
            )}
          </section>

          <InfoBox>
            <p>Positive SHAP values (right side) increase the predicted yield.</p>
            <p>Negative SHAP values (left side) decrease the predicted yield.</p>
          </InfoBox>
        </div>
      ) : null}

      {activeTab === TABS[1] ? (
        <div className="space-y-5">
          <section className="ty-card px-5 py-4">
            <h2 className="text-[15px] font-semibold text-ink">Feature Importance</h2>
            <p className="mb-4 mt-1 text-xs text-muted">
              Mean absolute SHAP value of each feature across the evaluation set
            </p>
            {explanation ? (
              <FeatureImportanceChart data={explanation.feature_importance} />
            ) : (
              <ChartPlaceholder />
            )}
          </section>

          <InfoBox>
            <p>
              A larger mean absolute SHAP value means the feature changes the predicted yield more
              strongly, averaged over all observations.
            </p>
          </InfoBox>
        </div>
      ) : null}

      {activeTab === TABS[2] ? (
        <div className="space-y-5">
          <section className="ty-card px-5 py-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-[15px] font-semibold text-ink">Dependence Plot</h2>
                <p className="mt-1 text-xs text-muted">
                  How the SHAP value of one feature varies with the feature value
                </p>
              </div>
              <select
                value={selectedDependence}
                onChange={(event) => setDependenceFeature(event.target.value)}
                className="ty-input w-56"
              >
                {dependenceFeatures.map((feature) => (
                  <option key={feature} value={feature}>
                    {feature}
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-4">
              <DependencePlot
                feature={selectedDependence}
                unit={dependenceUnit}
                points={dependencePoints}
              />
            </div>
          </section>

          <InfoBox>
            <p>
              Points above the zero line raise the predicted yield for that observation; points below
              it lower the prediction.
            </p>
          </InfoBox>
        </div>
      ) : null}
    </>
  )
}

function ChartPlaceholder() {
  return (
    <div className="flex h-56 items-center justify-center text-xs text-muted">
      Loading SHAP values…
    </div>
  )
}
