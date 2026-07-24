/**
 * CRTOverlay.jsx
 *
 * Persistent CRT texture layered over the entire site. Deliberately THIN:
 * the per-window CRT sheens (sk-crt / ab-crt) carry the heavy screen effect,
 * so the global layer is grid-only at half strength — texture stacked three
 * deep reads as an Instagram filter, not a monitor. The old rolling scanline
 * bands + flicker (which also ignored prefers-reduced-motion) are retired.
 *
 * z-index sits BELOW the screensaver (99998) and BSOD (99999) so a fake
 * crash owns the whole screen, and below the custom cursor (100000+).
 */

export default function CRTOverlay() {
  return (
    <div
      aria-hidden="true"
      style={{
        position:      "fixed",
        inset:          0,
        zIndex:         99997,
        pointerEvents: "none",
      }}
    >
      {/* Static grid lines — sparse and faint, just enough to read as glass */}
      <div style={{
        position:        "absolute",
        inset:            0,
        backgroundImage: "repeating-linear-gradient(0deg, rgba(0,0,0,0.035) 0px, rgba(0,0,0,0.035) 1px, transparent 1px, transparent 9px)",
        mixBlendMode:    "multiply",
      }} />
    </div>
  );
}
