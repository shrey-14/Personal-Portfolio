/* ═══════════════════════════════════════════════════════════════════════════
   PixelIcons.jsx — SHREY/OS unified icon system
   ───────────────────────────────────────────────────────────────────────────
   One source, one grid, one colour model:

   • UI icons: Pixelarticons by Gerrit Halfmann — https://pixelarticons.com
     MIT License, Copyright (c) 2019 Gerrit Halfmann. Path data reproduced
     under the MIT license (see LICENSE in the pixelarticons package).
   • Brand marks (GitHub / LinkedIn): HackerNoon Pixel Icon Library —
     https://pixeliconlibrary.com — CC BY 4.0. Attribution: "Icons from
     Pixel Icon Library by HackerNoon" (also credited in the About dialog).

   All icons are drawn on a 24×24 grid and inherit `currentColor`, so they
   theme themselves through the site's semantic tokens — no per-theme CSS.
   SIZING RULE: render at 24/48/72px (multiples of the grid). Never 16 or 20.
═══════════════════════════════════════════════════════════════════════════ */

const Px = ({ d, size = 24, className = '', label, ...rest }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="currentColor"
    shapeRendering="crispEdges"
    className={`px-ico ${className}`}
    aria-hidden={label ? undefined : true}
    role={label ? 'img' : undefined}
    aria-label={label}
    focusable="false"
    {...rest}
  >
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

/* ── Pixelarticons (MIT) ─────────────────────────────────────────────────── */

export const PxComputer = (p) => <Px {...p} d="M6 1h12v2H6zm0 8h12v2H6zM4 3h2v6H4zm14 0h2v6h-2zM4 13h16v2H4zm0 8h16v2H4zm-2-6h2v6H2zm18 0h2v6h-2zM6 17h2v2H6zm4 0h8v2h-8zm-2-6h2v2H8zm6 0h2v2h-2z" />;
export const PxTrash = (p) => <Px {...p} d="M18 22H6V20H18V22ZM9 6H15V4H17V6H22V8H20V20H18V8H6V20H4V8H2V6H7V4H9V6ZM15 4H9V2H15V4Z" />;
export const PxFolder = (p) => <Px {...p} d="M4 4h6v2H4zm0 14h16v2H4zM20 8h2v10h-2zM2 6h2v12H2zm8 0h10v2H10z" />;
export const PxFileText = (p) => <Px {...p} d={["M6 4H4v16h2zm10-2H6v2h10zm4 4h-2v14h2zm-2 14H6v2h12zM16 4h2v2h-2zm-4 0h2v6h-2z", "M12 8h6v2h-6zm-4 8h8v2H8zm0-4h8v2H8zm0-4h2v2H8z"]} />;
export const PxMail = (p) => <Px {...p} d="M6 8h2v2H6zm2 2h2v2H8zm10-2h-2v2h2zm-2 2h-2v2h2zm-6 2h4v2h-4zM2 6h2v12H2zm18 0h2v12h-2zM4 4h16v2H4zm0 14h16v2H4z" />;
export const PxPowerOff = (p) => <Px {...p} d="M6 20h10v2H6zM18 6h2v2h-2zm-2-2h2v2h-2zM4 18h2v2H4zm14 0h2v2h-2zM2 8h2v10H2zm18 0h2v8h-2zm-9-6h2v6h-2zm9 18h2v2h-2zm-4-4h2v2h-2zm-2-2h2v2h-2zm-2-2h2v2h-2zm-2-2h2v2h-2zM8 8h2v2H8zM6 6h2v2H6zM4 4h2v2H4zM2 2h2v2H2z" />;
export const PxVolume = (p) => <Px {...p} d="M11 22H9v-2H7v-2h2V6H7V4h2V2h2v20Zm8 0h-6v-2h6v2Zm2-2h-2v-2h2v2ZM7 18H5v-2h2v2Zm10 0h-4v-2h4v2Zm6 0h-2V6h2v12ZM5 10H3v4h2v2H1V8h4v2Zm14 6h-2V8h2v8Zm-4-2h-2v-4h2v4ZM7 8H5V6h2v2Zm10 0h-4V6h4v2Zm4-2h-2V4h2v2Zm-2-2h-6V2h6v2Z" />;
export const PxVolumeMute = (p) => <Px {...p} d={["M11 22H9v-2H7v-2h2V6H7V4h2V2h2v20ZM7 18H5v-2h2v2ZM5 10H3v4h2v2H1V8h4v2ZM7 8H5V6h2v2Z", "M15 8h2v2h-2zm6 0h2v2h-2zm-4 2h2v2h-2zm2 2h2v2h-2zm-4 0h2v2h-2zm-2 2h2v2h-2zm8 0h2v2h-2z"]} />;
export const PxLightbulb = (p) => <Px {...p} d="M9 4h6v2H9zM7 6h2v2H7zm8 0h2v2h-2zm4-2h2v2h-2zm2-2h2v2h-2zM0 10h3v2H0zm21 0h3v2h-3zM3 4h2v2H3zM1 2h2v2H1zm6 12h2v2H7zm8 0h2v2h-2zM5 8h2v6H5zm12 0h2v6h-2zm-8 8h6v2H9zm0 4h6v2H9zm0-2h2v2H9zm4 0h2v2h-2zM11 0h2v3h-2z" />;
export const PxLightbulbOff = (p) => <Px {...p} d="M9 3h6v2H9zM7 5h2v2H7zm8 0h2v2h-2zm-8 8h2v2H7zm8 0h2v2h-2zM5 7h2v6H5zm12 0h2v6h-2zm-8 8h6v2H9zm0 4h6v2H9zm0-2h2v2H9zm4 0h2v2h-2z" />;
export const PxBrush = (p) => <Px {...p} d={["M7 2h10v2H7zM5 4h2v10H5zm12-2h2v12h-2z", "M13 2h2v6h-2zM9 2h2v4H9zm-4 8h14v2H5zm2 4h10v2H7zm2 2h2v4H9zm4 0h2v4h-2zm-4 4h6v2H9z"]} />;
export const PxTerminal = (p) => <Px {...p} d="M4 2h16v2H4zm0 18h16v2H4zM2 4h2v16H2zm18 0h2v16h-2zM6 16h2v2H6zm2-2h2v2H8zm-2-2h2v2H6z" />;
export const PxNote = (p) => <Px {...p} d="M2 4h2v16H2zm18 0h2v12h-2zM4 2h16v2H4zm14 14h2v2h-2zm-2 2h2v2h-2zM4 20h12v2H4zm10-8h6v2h-6zm-2 2h2v6h-2z" />;
export const PxSettingsCog = (p) => <Px {...p} d={["M9 0h6v2H9zm6 24H9v-2h6zM0 15V9h2v6zm24-6v6h-2V9zM9 2h2v4H9zm6 20h-2v-4h2zM2 15v-2h4v2zm20-6v2h-4V9zm-9-7h2v4h-2zm-2 20H9v-4h2zM2 11V9h4v2zm20 2v2h-4v-2zM7 4h2v2H7zm10 0h-2v2h2zm0 16h-2v-2h2zM7 20h2v-2H7zM2 2h5v2H2zm20 0h-5v2h5zm0 20h-5v-2h5zM2 22h5v-2H2z", "M2 2h2v5H2zm20 0h-2v5h2zm0 20h-2v-5h2zM2 22h2v-5H2zM4 7h2v2H4zm16 0h-2v2h2zm0 10h-2v-2h2zM4 17h2v-2H4zm6-9h4v2h-4zm0 6h4v2h-4zm-2-4h2v4H8zm6 0h2v4h-2z"]} />;
export const PxMonitor = (p) => <Px {...p} d="M4 2h16v2H4zm0 14h16v2H4zM2 4h2v12H2zm18 0h2v12h-2zm-9 14h2v2h-2zm-3 2h8v2H8z" />;
export const PxSave = (p) => <Px {...p} d="M20 22H4V20H6V14H8V20H16V14H18V20H20V22ZM4 20H2V4H4V20ZM22 20H20V6H22V20ZM16 14H8V12H16V14ZM12 10H6V6H12V10ZM20 6H18V4H20V6ZM18 4H4V2H18V4Z" />;
export const PxAnalytics = (p) => <Px {...p} d="M4 2h16v2H4zm0 18h16v2H4zM2 4h2v16H2zm18 0h2v16h-2zm-9 8h2v6h-2zm-4 2h2v4H7zm8-8h2v12h-2z" />;
export const PxAppWindows = (p) => <Px {...p} d="M4 3h16v2H4zm0 16h16v2H4zM2 5h2v14H2zm18 0h2v14h-2zM4 7h16v2H4zm8-2h2v2h-2zm4 0h2v2h-2z" />;
export const PxExternalLink = (p) => <Px {...p} d={["M11 5H5v2h6V5ZM5 7H3v12h2V7Zm12 12H5v2h12v-2Zm2-6h-2v6h2v-6Zm-8 0H9v2h2v-2Zm2-2h-2v2h2v-2Zm2-2h-2v2h2V9Zm2-2h-2v2h2V7Zm2-2h-2v2h2V5Zm2-2h-2v8h2V3Z", "M21 3h-8v2h8V3Z"]} />;
export const PxGitBranch = (p) => <Px {...p} d="M4 14h4v2H4zm0 6h4v2H4zm-2-4h2v4H2zm6 0h2v4H8zm8-14h4v2h-4zm0 6h4v2h-4zm-2-4h2v4h-2zm6 0h2v4h-2zm-8 13h5v2h-5zm5-5h2v5h-2zM5 2h2v10H5z" />;
export const PxMenu = (p) => <Px {...p} d="M20 18H4v-2h16v2Zm0-5H4v-2h16v2Zm0-5H4V6h16v2Z" />;
export const PxClose = (p) => <Px {...p} d="M7 19H5V17H7V19ZM19 19H17V17H19V19ZM9 15V17H7V15H9ZM17 17H15V15H17V17ZM11 15H9V13H11V15ZM15 15H13V13H15V15ZM13 13H11V11H13V13ZM11 11H9V9H11V11ZM15 11H13V9H15V11ZM9 9H7V7H9V9ZM17 9H15V7H17V9ZM7 7H5V5H7V7ZM19 7H17V5H19V7Z" />;
export const PxChevronDown = (p) => <Px {...p} d="M13 16h-2v-2h2v2Zm-2-2H9v-2h2v2Zm4 0h-2v-2h2v2Zm-6-2H7v-2h2v2Zm8 0h-2v-2h2v2ZM7 10H5V8h2v2Zm12 0h-2V8h2v2Z" />;
export const PxSignal = (p) => <Px {...p} d="M19 3h2v18h-2zm-4 4h2v14h-2zm-4 4h2v10h-2zm-4 4h2v6H7zm-4 4h2v2H3z" />;
export const PxCopy = (p) => <Px {...p} d="M8 6h12v2H8zM4 2h12v2H4zm2 6h2v12H6zM2 4h2v12H2zm6 16h12v2H8zM20 8h2v12h-2zm-4-4h2v2h-2zM4 16h2v2H4z" />;
export const PxTrophy = (p) => <Px {...p} d="M16 17H13V19H15V21H9V19H11V17H8V15H16V17ZM18 5H22V11H20V7H18V11H20V13H18V15H16V5H8V15H6V13H4V11H6V7H4V11H2V5H6V3H18V5Z" />;
export const PxCamera = (p) => <Px {...p} d="M4 5h4v2H4zm4-2h8v2H8zm8 2h4v2h-4zM2 7h2v12H2zm2 12h16v2H4zM20 7h2v12h-2zM10 8h4v2h-4zm0 6h4v2h-4zm-2-4h2v4H8zm6 0h2v4h-2z" />;
export const PxCar = (p) => <Px {...p} d="M4 13h6v2H4zm10 0h6v2h-6zM4 17h6v2H4zm10 0h6v2h-6zM2 15h4v2H2zm6 0h8v2H8zm10 0h4v2h-4zm4-4h2v4h-2zm-6-4h2v2h-2zM4 5h12v2H4zm-4 6h2v4H0zm12-2h10v2H12zM2 7h2v4H2zm8 0h2v2h-2z" />;
export const PxRadio = (p) => <Px {...p} d="M11 9h2v2h-2zm0 4h2v2h-2zm-2-2h2v2H9zm4 0h2v2h-2zm6-2h-2v6h2zM5 9h2v6H5zm18-2h-2v10h2zM1 7h2v10H1zm16 0h-2v2h2zM7 7h2v2H7zm14-2h-2v2h2zM3 5h2v2H3zm14 10h-2v2h2zM7 15h2v2H7zm14 2h-2v2h2zM3 17h2v2H3z" />;
export const PxDebug = (p) => <Px {...p} d="M8 6h8v2H8zm0 14h8v2H8zM6 8h2v12H6zm10 0h2v12h-2zM4 8h2v2H4zm16 0h-2v2h2zM4 18h2v2H4zm16 0h-2v2h2zM2 20h2v2H2zm20 0h-2v2h2zM2 6h2v2H2zm20 0h-2v2h2zM2 13h4v2H2zm20 0h-4v2h4zM6 2h2v2H6zm2 2h2v2H8zm6 0h2v2h-2zm2-2h2v2h-2zm-6 8h4v2h-4zm0 4h4v2h-4z" />;

/* ── HackerNoon Pixel Icon Library brand marks (CC BY 4.0) ───────────────── */

export const PxGitHub = ({ size = 24, className = '', label = 'GitHub', ...rest }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor"
    shapeRendering="crispEdges" className={`px-ico ${className}`}
    role="img" aria-label={label} focusable="false" {...rest}>
    <polygon points="23 9 23 15 22 15 22 17 21 17 21 19 20 19 20 20 19 20 19 21 18 21 18 22 16 22 16 23 15 23 15 18 14 18 14 17 15 17 15 16 17 16 17 15 18 15 18 14 19 14 19 9 18 9 18 6 16 6 16 7 15 7 15 8 14 8 14 7 10 7 10 8 9 8 9 7 8 7 8 6 6 6 6 9 5 9 5 14 6 14 6 15 7 15 7 16 9 16 9 18 7 18 7 17 6 17 6 16 4 16 4 17 5 17 5 19 6 19 6 20 9 20 9 23 8 23 8 22 6 22 6 21 5 21 5 20 4 20 4 19 3 19 3 17 2 17 2 15 1 15 1 9 2 9 2 7 3 7 3 5 4 5 4 4 5 4 5 3 7 3 7 2 9 2 9 1 15 1 15 2 17 2 17 3 19 3 19 4 20 4 20 5 21 5 21 7 22 7 22 9 23 9" />
  </svg>
);

export const PxLinkedIn = ({ size = 24, className = '', label = 'LinkedIn', ...rest }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor"
    shapeRendering="crispEdges" className={`px-ico ${className}`}
    role="img" aria-label={label} focusable="false" {...rest}>
    <path d="m22,2v-1H2v1h-1v20h1v1h20v-1h1V2h-1Zm-9,10v8h-3v-11h3v1h1v-1h4v1h1v10h-3v-8h-3Zm-9-4v-3h3v3h-3Zm3,1v11h-3v-11h3Z" />
  </svg>
);
