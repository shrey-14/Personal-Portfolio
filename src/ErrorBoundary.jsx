import { Component } from 'react';

/* ═══════════════════════════════════════════════════════════════════════════
   AUDIT §4.3 — ErrorBoundary.jsx
   ───────────────────────────────────────────────────────────────────────────
   The site had zero error boundaries. A single fetch failure inside the ad-
   blocker's chopping block or a stray runtime error in any section would
   blank the whole app. Now we catch it and render a themed 'Application has
   stopped responding' window — on-brand (Win95 dialog language), useful
   (Restart button reloads), and defensive.
   ═══════════════════════════════════════════════════════════════════════════ */
export default class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // In production the console is the only sink we get; keep it minimal so
    // devtools opened by a curious visitor doesn't get a huge stack dump.
    if (typeof console !== 'undefined') {
      console.error('SHREY/OS crash:', error?.message || error);
      if (info?.componentStack) console.error(info.componentStack);
    }
  }

  handleRestart = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    // Inline styling — the boundary must render even if global.css failed.
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 999999,
        background: '#1a1d23',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24, fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
      }}>
        <div style={{
          maxWidth: 480, width: '100%',
          background: '#c0c0c0',
          border: '2px solid',
          borderTopColor: '#dfdfdf', borderLeftColor: '#dfdfdf',
          borderRightColor: '#808080', borderBottomColor: '#808080',
          outline: '1px solid #000',
          boxShadow: '4px 4px 0 rgba(0,0,0,0.6), 14px 20px 60px rgba(0,0,0,0.55)',
        }} role="alertdialog" aria-labelledby="err-title" aria-describedby="err-body">
          {/* Titlebar */}
          <div style={{
            height: 22, padding: '0 4px',
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'linear-gradient(to right, #000080, #1084d0)',
            color: '#fff',
            fontFamily: '"IBM Plex Sans", sans-serif',
            fontSize: 12, fontWeight: 700, letterSpacing: '0.2px',
          }}>
            <span aria-hidden="true">⚠</span>
            <span id="err-title" style={{ flex: 1 }}>SHREY/OS — Application error</span>
          </div>

          {/* Body */}
          <div id="err-body" style={{ padding: '18px 20px 16px', color: '#000' }}>
            <p style={{ margin: '0 0 12px', fontSize: 14, lineHeight: 1.55 }}>
              <strong>Application has stopped responding.</strong>
            </p>
            <p style={{ margin: '0 0 14px', fontSize: 12.5, lineHeight: 1.6, color: '#404040' }}>
              An unexpected error interrupted the OS. This is very likely a bug
              on my end — restarting will usually fix it. If it persists, please
              email me at <a
                style={{ color: '#000080', fontWeight: 600 }}
                href="mailto:pshrey964@gmail.com">pshrey964@gmail.com</a>.
            </p>

            {/* Technical detail — collapsed by default, on-brand mono */}
            {this.state.error?.message && (
              <details style={{ margin: '10px 0 14px' }}>
                <summary style={{
                  cursor: 'pointer', fontFamily: '"IBM Plex Mono", monospace',
                  fontSize: 11, color: '#404040', letterSpacing: '0.04em',
                }}>Technical details</summary>
                <pre style={{
                  margin: '6px 0 0', padding: '8px 10px',
                  background: '#000', color: '#39ff14',
                  fontFamily: '"IBM Plex Mono", monospace', fontSize: 11,
                  lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                  border: '1px solid #000',
                  boxShadow: 'inset 1px 1px 0 rgba(0,0,0,0.4)',
                }}>{String(this.state.error.message).slice(0, 400)}</pre>
              </details>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={this.handleRestart} style={{
                minWidth: 96, padding: '5px 14px', cursor: 'pointer',
                background: '#c0c0c0', color: '#000',
                border: '2px solid',
                borderTopColor: '#dfdfdf', borderLeftColor: '#dfdfdf',
                borderRightColor: '#808080', borderBottomColor: '#808080',
                fontFamily: '"IBM Plex Sans", sans-serif',
                fontSize: 12, fontWeight: 600,
              }}>Restart</button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
