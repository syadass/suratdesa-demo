import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/poppins/400.css'
import '@fontsource/poppins/500.css'
import '@fontsource/poppins/600.css'
import '@fontsource/poppins/700.css'
import './index.css'
import { ensureSeed } from './lib/store.js'
import App from './App.jsx'

// DEMO MODE: isi data contoh di localStorage sebelum aplikasi dirender
ensureSeed()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
