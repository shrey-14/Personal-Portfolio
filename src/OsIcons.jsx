/* ═══════════════════════════════════════════════════════════════════════════
   OsIcons.jsx — SHREY/OS colored icon system
   ───────────────────────────────────────────────────────────────────────────
   Full-color pixel-art icons from the SerenityOS project
   (https://serenityos.org) — an open-source OS whose entire icon set is
   hand-drawn under ONE community style guide in the late-90s desktop
   tradition. Original artwork (no Microsoft IP), BSD-2-Clause:
   Copyright (c) 2018-2026, the SerenityOS developers.
   License shipped at /icons/os/LICENSE-SerenityOS.txt; credited in About.

   DESIGN RULE (matches real Win95): colored icons live on SURFACES —
   desktop, Start menu, taskbar app buttons, titlebars, dialog headers.
   Inline text-adjacent glyphs (tray, Launch/Source, chevrons, brands) stay
   monochrome via PixelIcons.jsx — exactly how classic systrays worked.

   Each icon ships at its native grid (16 or 32). A component picks the
   sharpest source for the requested size: size ≥ 24 → 32px art, else 16px.
   Always render at 16 / 32 / 48 / 64 CSS px (multiples or 1.5×, which lands
   on integer 3× at 2× DPR) with image-rendering: pixelated.
═══════════════════════════════════════════════════════════════════════════ */

const os = (n16, n32) => ({ size = 16, className = '', label, ...rest }) => {
  const use32 = n32 && size >= 24;
  const src = `/icons/os/${use32 ? 32 : 16}/${use32 ? n32 : n16 || n32}.png`;
  return (
    <img
      src={src}
      width={size}
      height={size}
      alt={label || ''}
      aria-hidden={label ? undefined : true}
      draggable={false}
      className={`os-ico ${className}`}
      {...rest}
    />
  );
};

/* ── Desktop / launchers ── */
export const OsComputer     = os(null, 'desktop');            // beige CRT tower
export const OsRecycleBin   = os('trash-can', 'recycle-bin');
export const OsFolder       = os('filetype-folder', 'filetype-folder');
export const OsFolderOpen   = os('filetype-folder-open', 'filetype-folder-open');
export const OsPdf          = os('filetype-pdf', 'filetype-pdf');
export const OsMail         = os('app-mail', 'app-mail');
export const OsShutdown     = os('power', 'shutdown');
export const OsHelp         = os('app-help', 'app-help');

/* ── App windows / taskbar ── */
export const OsPaint        = os('app-pixel-paint', 'app-pixel-paint');
export const OsTextEditor   = os('app-text-editor', 'app-text-editor');
export const OsSettings     = os('app-settings', 'app-settings');
export const OsDisplaySet   = os('app-display-settings', 'app-display-settings');
export const OsSysMonitor   = os('app-system-monitor', 'app-system-monitor');
export const OsProfiler     = os('app-profiler', 'app-profiler');
export const OsTerminal     = os('app-terminal', 'app-terminal');
export const OsHardDisk     = os('hard-disk', 'hard-disk');
export const OsNetwork      = os('network-connected', 'network');
export const OsText         = os('filetype-text', 'filetype-text');
export const OsSave         = os('save', null);

/* ── Project identities ── */
export const OsMaps         = os('app-maps', 'app-maps');           // AI Radar
export const OsImageViewer  = os('app-image-viewer', 'app-image-viewer'); // vision
export const OsCertificate  = os('certificate', 'certificate');     // 1st place
export const OsBrowser      = os('app-browser', 'app-browser');

/* ── Pixel Factory 95 launcher ──
   Hand-drawn inline SVG (no PNG asset) — a little chip-and-conveyor glyph
   in the same chunky, flat-shaded language as the SerenityOS set, sized as
   crisp vectors instead of an upscaled bitmap. */
export function OsGameFactory({ size = 16, className = '', label, ...rest }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" shapeRendering="crispEdges"
      role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}
      className={`os-ico ${className}`} {...rest}>
      <rect x="1" y="1" width="14" height="14" fill="#3a7bd5" />
      <rect x="2" y="2" width="12" height="12" fill="#1b1e24" />
      <rect x="3" y="3" width="4" height="4" fill="#39ff14" />
      <rect x="9" y="3" width="4" height="4" fill="#ffb454" />
      <rect x="3" y="9" width="4" height="4" fill="#ffb454" />
      <rect x="9" y="9" width="4" height="4" fill="#39ff14" />
      <rect x="7" y="7" width="2" height="2" fill="#fff" />
    </svg>
  );
}
