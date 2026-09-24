import { createContext, useContext, useMemo, useState } from 'react'

/**
 * Holds the prediction currently being viewed so the Result and SHAP screens
 * share one payload. A value is added after a real prediction is submitted.
 */
const PredictionContext = createContext(null)

export function PredictionProvider({ children }) {
  const [prediction, setPrediction] = useState(null)
  const [lastInputs, setLastInputs] = useState(null)

  const value = useMemo(
    () => ({ prediction, setPrediction, lastInputs, setLastInputs }),
    [prediction, lastInputs]
  )

  return <PredictionContext.Provider value={value}>{children}</PredictionContext.Provider>
}

export function usePrediction() {
  const context = useContext(PredictionContext)

  if (!context) {
    throw new Error('usePrediction must be used inside a PredictionProvider')
  }

  return context
}
