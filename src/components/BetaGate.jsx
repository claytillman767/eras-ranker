import { useState } from 'react';

// Full-screen beta access gate.
// Two paths: Google sign-in (checked against VITE_BETA_EMAILS allowlist)
// or a dev bypass password (VITE_BETA_PASSWORD).
export default function BetaGate({ onSignIn, onPassword, loading, rejected }) {
  const [pw, setPw]         = useState('');
  const [pwError, setPwError] = useState(false);

  const hasPassword = !!import.meta.env.VITE_BETA_PASSWORD;

  function handlePasswordSubmit(e) {
    e.preventDefault();
    if (pw === import.meta.env.VITE_BETA_PASSWORD) {
      onPassword();
    } else {
      setPwError(true);
    }
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 24px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      zIndex: 9999,
    }}>
      <div style={{ width: '100%', maxWidth: 360 }}>

        {/* Logo / title */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🌟</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
            The Eras Ranker
          </div>
          <div style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.5 }}>
            This app is currently in closed beta.<br />
            Sign in to request access, or enter the beta password below.
          </div>
        </div>

        {loading ? (
          /* Spinner while Firebase resolves the redirect result */
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{
              width: 32,
              height: 32,
              border: '3px solid #e5e7eb',
              borderTopColor: '#a855f7',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto',
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 12 }}>Signing in…</div>
          </div>
        ) : (
          <>
            {/* Rejected message */}
            {rejected && (
              <div style={{
                background: '#fef2f2',
                border: '0.5px solid #fecaca',
                borderRadius: 10,
                padding: '12px 14px',
                marginBottom: 20,
                fontSize: 13,
                color: '#dc2626',
                lineHeight: 1.5,
                textAlign: 'center',
              }}>
                That Google account isn't on the beta list.<br />
                Try a different account or enter the password below.
              </div>
            )}

            {/* Google sign-in */}
            <button
              onClick={onSignIn}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                width: '100%',
                padding: '13px',
                background: '#ffffff',
                border: '1px solid #d1d5db',
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 500,
                color: '#111827',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                marginBottom: hasPassword ? 20 : 0,
              }}
            >
              <GoogleIcon />
              Sign in with Google
            </button>

            {/* Password section */}
            {hasPassword && (
              <>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 20,
                }}>
                  <div style={{ flex: 1, height: '0.5px', background: '#e5e7eb' }} />
                  <span style={{ fontSize: 12, color: '#9ca3af' }}>or</span>
                  <div style={{ flex: 1, height: '0.5px', background: '#e5e7eb' }} />
                </div>

                <form onSubmit={handlePasswordSubmit}>
                  <input
                    type="password"
                    placeholder="Beta password"
                    value={pw}
                    onChange={e => { setPw(e.target.value); setPwError(false); }}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      border: pwError ? '1px solid #fca5a5' : '1px solid #d1d5db',
                      borderRadius: 10,
                      fontSize: 15,
                      color: '#111827',
                      background: pwError ? '#fef2f2' : '#ffffff',
                      outline: 'none',
                      boxSizing: 'border-box',
                      marginBottom: pwError ? 6 : 12,
                    }}
                  />
                  {pwError && (
                    <div style={{ fontSize: 12, color: '#dc2626', marginBottom: 10 }}>
                      Incorrect password.
                    </div>
                  )}
                  <button
                    type="submit"
                    style={{
                      width: '100%',
                      padding: '13px',
                      background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: 12,
                      fontSize: 15,
                      fontWeight: 600,
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(168,85,247,0.3)',
                    }}
                  >
                    Enter
                  </button>
                </form>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
      <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
    </svg>
  );
}
