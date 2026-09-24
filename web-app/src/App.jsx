import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import NewPrediction from './pages/NewPrediction.jsx'
import PredictionResult from './pages/PredictionResult.jsx'
import PredictionHistory from './pages/PredictionHistory.jsx'
import ShapExplanation from './pages/ShapExplanation.jsx'
import About from './pages/About.jsx'
import YieldForecast from './pages/YieldForecast.jsx'
import Logout from './pages/Logout.jsx'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/new-prediction" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="new-prediction" element={<NewPrediction />} />
        <Route path="result" element={<PredictionResult />} />
        <Route path="history" element={<PredictionHistory />} />
        <Route path="shap" element={<ShapExplanation />} />
        <Route path="forecast" element={<YieldForecast />} />
        <Route path="about" element={<About />} />
        <Route path="logout" element={<Logout />} />
        <Route path="*" element={<Navigate to="/new-prediction" replace />} />
      </Route>
    </Routes>
  )
}
