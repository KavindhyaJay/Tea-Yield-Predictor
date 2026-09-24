import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App.jsx'
import { PredictionProvider } from './context/PredictionContext.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <PredictionProvider>
        <App />
      </PredictionProvider>
    </HashRouter>
  </React.StrictMode>
)
