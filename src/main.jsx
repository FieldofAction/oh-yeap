import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/main.css'
import PublicApp from './PublicApp.jsx'
// After component CSS (including materials.css); public only, not Studio controls.
import './styles/field-standard.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PublicApp />
  </StrictMode>,
)
