/**
 * @file main.tsx
 * @description Sovelluksen käynnistystiedosto (entry point).
 * Kiinnittää React-juurikomponentin HTML-dokumentin `#root`-elementtiin.
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Luodaan React-juuri ja renderöidään sovellus StrictMode-tilassa kehitystarkistuksia varten
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
