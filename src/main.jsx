import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

// Capture acquisition source ONCE per device, before any redirect can wipe
// document.referrer or strip the ?ref= URL param. Stashed in localStorage so
// useUserStats can read it on the user's first signed-in session.
(() => {
  if (!localStorage.getItem('eras_referrer') && document.referrer) {
    localStorage.setItem('eras_referrer', document.referrer);
  }
  const ref = new URLSearchParams(window.location.search).get('ref');
  if (ref && !localStorage.getItem('eras_signup_source')) {
    localStorage.setItem('eras_signup_source', ref);
  }
})();

// Register the service worker so the app works offline (required for PWA install on Android)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err => {
      console.warn('Service worker registration failed:', err);
    });
  });
}

// Dev-only: visiting /?dev=audit during `npm run dev` opens the category-pick
// review UI instead of the main app. /?dev=cards opens the shareable card
// preview. The query check is gated on import.meta.env.DEV so the dev
// components (and their data imports) are tree-shaken out of production.
const devMode = import.meta.env.DEV
  ? new URLSearchParams(window.location.search).get('dev')
  : null;

async function render() {
  let Root = App;
  if (devMode === 'audit') {
    const mod = await import('./dev/AuditReview.jsx');
    Root = mod.default;
  } else if (devMode === 'cards') {
    const mod = await import('./dev/CardPreview.jsx');
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
