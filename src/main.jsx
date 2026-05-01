import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

// Register the service worker so the app works offline (required for PWA install on Android)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err => {
      console.warn('Service worker registration failed:', err);
    });
  });
}

// Dev-only: visiting /?dev=audit during `npm run dev` opens the category-pick
// review UI instead of the main app. The query check is gated on import.meta.env.DEV
// so the dev component (and its data imports) are tree-shaken out of production.
const isDevAudit =
  import.meta.env.DEV &&
  new URLSearchParams(window.location.search).get('dev') === 'audit';

async function render() {
  let Root = App;
  if (isDevAudit) {
    const mod = await import('./dev/AuditReview.jsx');
    Root = mod.default;
  }
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <ErrorBoundary>
        <Root />
      </ErrorBoundary>
    </StrictMode>,
  );
}

render();
