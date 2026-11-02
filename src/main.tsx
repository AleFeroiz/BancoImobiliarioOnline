import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './ui/App'
import { AppErrorBoundary } from './ui/AppErrorBoundary'
import { shouldReloadAfterChunkLoadError } from './ui/chunkLoadRecovery'
import './ui/styles.css'

window.addEventListener('vite:preloadError', (event) => {
  if (!shouldReloadAfterChunkLoadError(window.sessionStorage)) return
  event.preventDefault()
  window.location.reload()
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </React.StrictMode>,
)
