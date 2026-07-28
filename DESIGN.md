---
name: SHREY/OS
description: A fully-functioning Windows 95/98-era desktop OS, rebuilt as a portfolio.
colors:
  windows-navy: "#000080"
  terminal-amber: "#ffb454"
  os-accent: "#e89020"
  phosphor-green: "#39ff14"
  titlebar-start: "#000080"
  titlebar-end: "#1084d0"
  chrome-silver: "#c0c0c0"
  chrome-silver-lt: "#dfdfdf"
  chrome-silver-dk: "#808080"
  desktop-graphite: "#1b1e24"
  desktop-graphite-dark: "#1a1d23"
  panel-dark: "#3a3f47"
  field-white: "#ffffff"
  field-dark: "#23272e"
  error-red: "#b00020"
  error-bg: "#ffecec"
  error-border: "#e0a0a0"
typography:
  display:
    fontFamily: "Chakra Petch, Arial Narrow, sans-serif"
    fontSize: "clamp(96px, 15.5vw, 210px)"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "normal"
  headline:
    fontFamily: "Chakra Petch, Arial Narrow, sans-serif"
    fontSize: "24px"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "0.06em"
  title:
    fontFamily: "IBM Plex Sans, Segoe UI, Tahoma, sans-serif"
    fontSize: "18px"
    fontWeight: 700
    lineHeight: 1.2
  body:
    fontFamily: "IBM Plex Sans, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "IBM Plex Sans, Segoe UI, Tahoma, sans-serif"
    fontSize: "11px"
    fontWeight: 700
    lineHeight: 1.2
  micro-body:
    fontFamily: "IBM Plex Sans, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.6
  mono:
    fontFamily: "IBM Plex Mono, Consolas, monospace"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.4
rounded:
  none: "0px"
  hairline: "1px"
  small: "2px"
  toggle: "11px"
  circle: "50%"
spacing:
  xs: "6px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
components:
  window-titlebar:
    backgroundColor: "linear-gradient({colors.titlebar-start}, {colors.titlebar-end})"
    textColor: "#ffffff"
    typography: "{typography.label}"
    height: "22px"
  button-chrome:
    backgroundColor: "{colors.chrome-silver}"
    textColor: "#000000"
    rounded: "{rounded.none}"
    padding: "0 8px"
    height: "24px"
  button-chrome-pressed:
    backgroundColor: "{colors.chrome-silver}"
    textColor: "#000000"
    rounded: "{rounded.none}"
  well-sunken:
    backgroundColor: "{colors.field-white}"
    textColor: "#000000"
    rounded: "{rounded.none}"
    padding: "0 7px"
    height: "24px"
---

# Design System: SHREY/OS

## Overview

**Creative North Star: "The Working Relic"**

SHREY/OS is not a retro-themed website — it is a Windows 95/98-era desktop that happens to run in a browser and happens to be a portfolio. Every window drags, every button depresses, every boot sequence actually boots. The chrome is authentic down to the 1px bevel, but nothing about it is inert set-dressing: the CRT boot, the dial-up handshake, the BSOD, the screensaver are all wired to real application state (`OSContext`), not looping video. The system's entire claim to craft rests on this distinction — a themed React site could copy the beige and the scanlines; it could not copy a taskbar that actually tracks open windows.

Two hard rejections keep this honest: no flat modern SaaS surface (soft rounded corners, ambient gradients, floating cards) is allowed to leak in anywhere, and no section is allowed to invent its own visual identity — the OS is one continuous machine, not a set of themed pages wearing a shared header.

**Key Characteristics:**
- Hard 1–2px bevel borders (light top/left, dark bottom/right) are the *only* depth language for controls; soft shadows are reserved for a handful of cinematic/CRT moments (glow, scanlines), never for ordinary chrome.
- One signature accent pair — Windows Navy in light mode, Terminal Amber in dark — is reused verbatim by every section (`--sk-sig`, `--ab-sig`, `--pj-sig`, `--jn-sig`, `--at-sig`, `--ct-sig` all resolve to the same two values).
- Sharp corners everywhere except literal circular controls (radio dots, LEDs) and the two switch/toggle exceptions.
- Type is real web fonts standing in for period system faces (Chakra Petch for the wordmark, IBM Plex Sans/Mono for everything else) so mobile never falls back to a different platform font than desktop.

## Colors

The palette is a light/dark pair of faithful Win95 (light) and Midnight-graphite (dark) themes, switched by `data-theme` on `<html>`. Every value below is the light-theme canonical; the dark-theme counterpart is noted where the two diverge.

### Primary
- **Windows Navy** (`#000080`, light theme) / **Terminal Amber** (`#ffb454`, dark theme): the one signature accent, shared by all six section identities and the titlebar gradient start. Used for section wordmarks, active-state ink, focus glows (`rgba(0,0,128,0.42)` light / `rgba(255,180,84,0.5)` dark), and every "this is the important thing" moment.

### Secondary
- **OS Accent** (`#e89020` light / `#ffb454` dark): the general interactive chrome accent — tray icons, folder icons, focus outlines, marching-ants selection, taskbar network-flash. Distinct from the per-section signature: this is "the OS reacting to you," not "which section you're in."

### Tertiary
- **Phosphor Green** (`#39ff14`): CRT-terminal legacy accent. Rare — reserved for genuine CRT/terminal-glow moments (boot sequences, scanline artifacts), never used as a general UI color.

### Neutral
- **Classic Silver** (`#c0c0c0`, `--chrome`/`--win-face`): the Win95 panel gray — window faces, buttons, taskbar, every piece of chrome that isn't a content surface.
- **Chrome Highlight** (`#dfdfdf`, `--chrome-lt`): the light edge of every bevel (raised top/left).
- **Chrome Shadow** (`#808080`, `--chrome-dk`): the dark edge of every bevel (raised bottom/right).
- **Desktop Graphite** (`#1b1e24` light / `#1a1d23` dark): the desktop backdrop behind all windows — deliberately graphite, not navy or teal, so the cinematic hero blends seamlessly into the desktop with no visible seam.
- **Field White** (`#ffffff` light) / **Field Dark** (`#23272e` dark): input/editor well backgrounds — Notepad bodies, terminal panes, form fields.
- **Error Red** (`#b00020` light / `#ffb3b3` dark, `--error-red` equivalent): the Contact form's validation-error text and link color. Paired with **Error Wash** (`#ffecec` light / `#3a1e1e` dark) as background and a matching mid-tone border (`#e0a0a0` light / `#6a3535` dark). The only error/disabled treatment in the codebase — semantic, low-saturation, reserved for that one state.

### Secondary Supporting Palettes (per the One Accent Rule's own carve-out)
These are real, coherent families reused across several components — not per-section identity colors, and not drift.
- **Explorer Blue-Gray** (anchors: `#c9cfd6`, `#aeb6bf`, `#8b929b`, `#2a5fba`/`#000050` selection pair): a cool file-manager chrome skin, distinct from Classic Silver — Projects' sidebar/explorer surfaces and their selection-highlight state (`#2a5fba`/`#000050` echoes classic Explorer selection blue).
- **Sepia/Paper** (anchors: `#f4f1ea`, `#d6d2c6`, `#c9c5b8`, `#9a9689`): warm postcard/plastic tones — About's record paper texture and the CRT-monitor-mockup bezel plastic in Projects.

### Named Rules
**The One Accent Rule.** Every section's signature color is the *same* navy/amber pair, never a per-section hue. A section is allowed its own supporting palette (Journey's plot lines, Projects' disk colors) but never its own primary identity color — that would fracture the "one machine" claim.

**The Bevel-Only Rule.** Depth on any interactive control comes from a 1–2px hard-edged bevel (light-top/left, dark-bottom/right = raised; reversed = pressed/sunken), never from `border-radius` + soft shadow. Reserve soft shadow for CRT/cinematic effects, signature focus glow, and the floating-window elevation shadow (see Elevation & Depth) — never for ordinary static buttons or cards.

## Typography

**Display Font:** Chakra Petch (with Arial Narrow fallback)
**Body/Chrome Font:** IBM Plex Sans (with Segoe UI, Tahoma fallback)
**Mono Font:** IBM Plex Mono (with Consolas fallback)

**Character:** Chakra Petch's chamfered, hardware-badge angularity carries the one big wordmark moment; everything else runs on IBM Plex Sans and Mono — one real superfamily standing in for old system/terminal type, crisp down to 10–11px chrome labels on every screen (not just Windows, where the historical fonts would actually be installed).

### Hierarchy
- **Display** (700, `clamp(96px, 15.5vw, 210px)`, line-height 1): the hero SHREY PATEL wordmark morph. Appears exactly once per page load.
- **Headline** (700, 24–28px, line-height 1.1, `0.06em` tracking): section/app logotypes (e.g. the About.exe "logo" badge) — Chakra Petch at reduced scale.
- **Title** (700, 18–20px, line-height 1.2): window and card titles, System Properties identity text.
- **Body** (400, 13–15px, line-height 1.4–1.5): prose, record content, terminal replies, About/Journey copy.
- **Label** (700, 10–11px, line-height 1.2): chrome text — menu items, taskbar labels, spec rows, tray text. Always IBM Plex Sans, never scaled below 10px.
- **Micro-body** (400, 12px, line-height 1.5–1.7): a real, frequently-used step between Label and Body — section-head captions, prose paragraphs sized just under the Body floor. Not a mistake to fold into Label or Body; it's its own step.
- **Mono** (400, 11–14px): anything meant to read as "the machine talking" — terminal panes, boot sequences, status bars, camera/monospace readouts.

### Named Rules
**The One Wordmark Rule.** Chakra Petch is reserved for logotype-scale moments (hero wordmark, section app badges). It never appears in body copy, buttons, or chrome — those stay on IBM Plex Sans/Mono so the display face keeps its impact through scarcity.

## Layout

Single long-scroll page, container widths driven by three tokens: `--wrap-narrow` (560px, dialogs/mobile prose), `--wrap-content` (1080px, every section window), `--wrap-wide` (1180px, hero-scale windows only). Responsive breakpoints are token-driven and kept in sync between JS (`isMobile`) and CSS media queries: `--bp-mobile` (900px), `--bp-tablet` (640px), `--bp-phone` (400px). Section windows do not use a generic 12-column grid; each is a fixed-chrome "app window" whose internal layout (records, carousels, terminal panes) is bespoke to its content, unified only by the shared window frame.

## Elevation & Depth

Primarily bevel, not shadow. Every raised control (buttons, window frames, taskbar items) uses a hard 1–2px border with the light shade on top/left and the dark shade on bottom/right; every sunken/recessed surface (trays, meters, fieldsets, pressed buttons) simply inverts that same pair — "sunken wells share one recipe" is a literal comment in the codebase. Soft shadow is a deliberate second, minor layer reserved for cinematic/CRT moments: signature glows (`rgba(0,0,128,0.42)` / `rgba(255,180,84,0.5)`), CRT scanline/vignette blur, and a handful of inset well glows. The two languages never mix on the same element — a bevel button does not also get a drop shadow.

### Shadow Vocabulary
- **Sunken well** (`box-shadow: inset 1px 1px 0 var(--win-lt)`): the recessed-fieldset/pressed-field glow, paired with the reversed bevel border.
- **Signature glow** (`box-shadow: 0 0 …px var(--sk-sig-glow)` etc.): focus/active glow using each theme's signature color at ~0.42–0.5 alpha.
- **CRT vignette** (`box-shadow: inset 0 0 22px rgba(0,0,0,0.8–0.85)`): screen-edge darkening on CRT/monitor-framed surfaces only.
- **Floating-window elevation** (`box-shadow: 1px 1px 0 rgba(0,0,0,0.55), 4px 5px 0 rgba(0,0,0,0.16), 12px 16px 30px rgba(0,0,0,0.26)`, stacked on top of the normal raised bevel border): the one deliberate exception to bevel-only depth. A draggable window floating over the desktop reads as physically above it, which a flat bevel alone doesn't sell — the crisp 1px contact shadow keeps the retro hardness, the soft ambient layer underneath gives real elevation. Confirmed as an intentional, independently-repeated convention across all seven window shells (`.win95-window`, `.sk-win`, `.ab-win`, `.pj-win`, `.jn-win`, `.at-win`, `.ct-win`), not per-file drift. Reserved for actual floating/draggable windows only — static in-page cards and callouts stay bevel-only.

### Named Rules
**The Flat-By-Default Rule.** Surfaces are flat at rest. Elevation appears only via the bevel-border pair, the floating-window shadow above, or — in the narrow set of CRT/signature cases — a glow that responds to state, never as ambient decoration on a static, non-floating element.

## Shapes

Sharp corners are the default: `border-radius: 0` (explicitly reasserted in mobile-parity rules) on windows, buttons, fields, and taskbar items. The only rounded exceptions are literal circles (radio dots, LEDs, dial-up/status indicators, avatar-style badges — `border-radius: 50%`), a handful of 1–3px "just enough to not look ripped in half" fillet radii on non-chrome cinematic surfaces (Paint canvas corner, CRT screen edge), and the dark-mode toggle switch track (`11px`, a real pill because it's miming a physical slider). Borders are always 1–2px solid, colored via the bevel pair rather than a single flat border color.

## Components

### Buttons
- **Shape:** sharp corners (0px radius), 1.5–2px bevel border.
- **Chrome button** (`.win-btn`, `.start-btn`, taskbar buttons): background `var(--chrome)`, border raised (light top/left `var(--chrome-lt)`, dark bottom/right `var(--chrome-dk)`), IBM Plex Sans label at 9–12px.
- **Pressed / Active:** the identical bevel pair, inverted — dark top/left, light bottom/right. Described in-code as "classic inverted bevel, identical everywhere," applied uniformly across Start button, taskbar task buttons, theme toggle, and volume tray button.
- **Close button:** same chrome button, but hover fills `#c0392b` red with white text — the one button allowed a non-bevel hover treatment, because it signals a destructive/terminal action.

### Cards / Containers (Window panels)
- **Corner Style:** 0px radius, always.
- **Background:** `var(--win-face)` (Classic Silver light / `#3a3f47` dark).
- **Titlebar:** `linear-gradient(var(--tb-start), var(--tb-end))` — Windows Navy → `#1084d0` in light, steel-slate (`#4a5568` → `#6b7688`) in dark. Height 22px, bold 11px label, white text. Inactive windows drop to the gray `--tb-inact-a/b` gradient — never the accent gradient.
- **Shadow Strategy:** none by default; see Elevation & Depth for the rare signature-glow exception on focused/active states.
- **Border:** 1.5–2px bevel, raised.
- **Internal Padding:** 8–12px for chrome/dialog content.

### Inputs / Fields (sunken wells)
- **Style:** background `var(--field-bg)` (white light / `#23272e` dark), 1.5px bevel border **pre-inverted** (dark top/left, light bottom/right) so the well reads recessed at rest — this is the single shared recipe for trays, meters, and text fields alike.
- **Focus:** signature-color glow or `var(--accent)` outline, never a color-shifted border alone.
- **Error:** Error Red text (`#b00020` light / `#ffb3b3` dark) on an Error Wash background (`#ffecec` light / `#3a1e1e` dark), 1px solid border in a matching mid-tone (`#e0a0a0` light / `#6a3535` dark), `2px` radius — `.mail-error` in the Contact form. This is the one established treatment; reuse it rather than inventing a second error palette elsewhere.
- **Disabled:** a `pw-btn-disabled` button keeps its normal chrome bevel but drops to `var(--win-text-dim)` and gets `cursor: not-allowed` plus an explanatory `title` (see Projects' Launch button when a project has no public URL yet) — never just hidden with no explanation.

### Navigation (Taskbar)
- Fixed 32–34px bar, Start button + open-window task buttons + system tray, all using the identical chrome-button bevel recipe. Active/open windows show the pressed (inverted) bevel; inactive task buttons show raised. Mobile hides task buttons rather than shrinking them illegibly.

### Signature Component: Section Signature System
Every section (Skills, About, Projects, Journey, AskShrey, Contact) exposes its own `--{prefix}-sig` / `-sig-ink` / `-sig-soft` / `-sig-glow` token quartet, but all six quartets resolve to the *same two source values* (Windows Navy / Terminal Amber) — see the One Accent Rule. This is what lets each section feel like its own "app" while the whole OS stays visually one machine.

## Do's and Don'ts

### Do:
- **Do** build depth with the bevel-border pair (raised: light top/left, dark bottom/right; sunken: reversed) on every interactive control.
- **Do** reuse the exact Windows Navy (`#000080`) / Terminal Amber (`#ffb454`) pair for any new section's signature identity — never introduce a new per-section hue.
- **Do** keep corners sharp (0px radius) on all chrome, windows, buttons, and fields; reserve rounding for literal circles and the one toggle-switch pill.
- **Do** keep Chakra Petch scarce — logotype scale only — so IBM Plex Sans/Mono carry everything else as one coherent chrome voice.

### Don't:
- **Don't** introduce soft ambient shadows, rounded-corner cards, or gradient-mesh backgrounds anywhere — that is the explicitly rejected flat-modern-SaaS look.
- **Don't** give a section its own accent hue distinct from the shared navy/amber signature pair.
- **Don't** mix the bevel and soft-shadow depth languages on the same element.
- **Don't** set `data-theme` from inside a section component — it's owned exclusively by `OSContext` and written once on `<html>`.
