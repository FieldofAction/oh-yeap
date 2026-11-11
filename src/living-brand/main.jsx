import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './workbench.css'
import Workbench from './Workbench.jsx'
import { publicCatalog } from './catalog.js'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Workbench catalog={publicCatalog} />
  </StrictMode>,
)
