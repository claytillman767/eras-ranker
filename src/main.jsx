import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { FeedbackScreenProvider } from './context/FeedbackScreen.jsx'
import { isUatMode, clearOnboardingFlags } from './uat.js'

// UAT-as-new-user mode — when the developer toggle in Settings is on, every
// page load starts with onboarding flags cleared so the Welcome tour, album
// mode modal, VibeCheckIntro, drag hint, and bridge-autoplay nudge all
// reappear. Flag set in localStorage; only the developer email can flip it.
if (isUatMode()) {
  clearOnboardingFlags();
}

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

// Lemon Squeezy checkout overlay script. Loaded once at app start so
// usePro.unlockPro can call window.LemonSqueezy.Url.Open(checkoutUrl)
// without an extra round-trip when the user clicks Subscribe.
//
// The script is small (~25KB) and async, so it doesn't block first paint.
// If it fails to load (offline, ad blocker, network glitch), unlockPro
// falls back to a new-tab redirect — the upgrade still works, just
// without the in-page overlay.
if (typeof window !== 'undefined' && !document.getElementById('lemon-js')) {
  const s = document.createElement('script');
  s.id = 'lemon-js';
  s.src = 'https://app.lemonsqueezy.com/js/lemon.js';
  s.async = true;
  s.defer = true;
  s.onload = () => {
    // LS exposes window.createLemonSqueezy() once the script loads;
    // calling it sets up window.LemonSqueezy.Url.Open(...).
    if (typeof window.createLemonSqueezy === 'function') {
      window.createLemonSqueezy();
    }
    // Auto-close the LS overlay the moment a checkout succeeds, so the
    // user never sees LS's "Thank you / View Order" screen. The "Processing
    // payment…" banner is already showing in the app, and the celebration
    // prompt fires within seconds once the webhook flips isPro on the
    // user's Firestore record. Wrapped in optional chaining + a string
    // .includes('success') match so a future event-name change in lemon.js
    // can't crash the page.
    if (window.LemonSqueezy?.Setup) {
      try {
        window.LemonSqueezy.Setup({
          eventHandler: (event) => {
            const name = String(event?.event || '').toLowerCase();
            if (name.includes('success')) {
              window.LemonSqueezy?.Url?.Close?.();
            }
          },
        });
      } catch (e) {
        console.warn('lemon.js Setup failed:', e);
      }
    }
  };
  document.head.appendChild(s);
}

// Dev-only: visiting /?dev=cards during `npm run dev` opens the shareable
// card preview instead of the main app. The query check is gated on
// import.meta.env.DEV so the dev components are tree-shaken out of
// production.
const devMode = import.meta.env.DEV
  ? new URLSearchParams(window.location.search).get('dev')
  : null;

async function render() {
  let Root = App;
  if (devMode === 'cards') {
    const mod = await import('./dev/CardPreview.jsx');
    Root = mod.default;
  }
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <ErrorBoundary>
        <FeedbackScreenProvider>
          <Root />
        </FeedbackScreenProvider>
      </ErrorBoundary>
    </StrictMode>,
  );
}

render();
