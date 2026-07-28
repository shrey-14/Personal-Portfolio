# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Broader tech audience, not recruiters alone: AI/ML recruiters and hiring managers screening Shrey Patel for 2026-27 placements (London or remote), plus other developers, collaborators, and founders who land on the site via HN, GitHub, or LinkedIn and are judging craft as much as fit.

As well as for any type of audience, who just visits the site or portfolio. 

## Product Purpose

Personal portfolio for Shrey Patel, presented as a fictional retro desktop OS ("SHREY/OS"). Exists to get a visitor from first impression to one of three actions: read the CV and form a credibility judgment, start a contact/interview conversation, or interrogate an AI-backed terminal for direct answers about Shrey's work.

## Positioning

Not a template portfolio — a fully-realized, functioning fake OS (Win95/98-era chrome: windows, taskbar, desktop icons, drag/minimize/close, CRT boot animation, dial-up/BSOD/screensaver easter eggs) where every section is styled as an "app" and the choreography (scroll-synced curves, carousels, terminal boot sequences) is load-bearing craft, not decoration. A neighboring portfolio could copy the retro skin; it could not truthfully copy the depth of interaction engineering underneath it.

## Operating Context

Single long-scroll page, seven ordered sections (Hero → About → Skills → Projects → Journey → AskShrey → Contact) inside a persistent OS shell (OSContext). Visitors browse on both desktop and mobile. Two live serverless endpoints extend the experience beyond static content: a Groq-backed AI terminal chat (api/ask.js) and a Resend/Supabase-backed contact flow (api/contact.js).

## Capabilities and Constraints

- AI.TERMINAL (AskShreySection) answers questions about Shrey using a fixed system prompt sourced from his CV — must never invent facts beyond that source.
- Contact flow sends via Resend and best-effort persists to Supabase; has honeypot + rate limiting.
- No test suite, linter, or type checker — nothing to run beyond `npm run dev/build/preview`.
- Theming is CSS-variable driven off `data-theme` on `<html>`; section components must never set `data-theme` themselves.

## Evidence on Hand

The full, current source of truth for Shrey's background is the `ABOUT SHREY` block in [api/ask.js](api/ask.js):
- MSc Artificial Intelligence, Brunel University London (Jan 2026 – Apr 2027, in progress)
- BEng Information Technology, LJ Institute — First Class with Distinction (2021–2025)
- Data Science Intern at Petpooja (Sep 2024 – May 2025): optimised 800+ BigQuery SQL pipelines (−30% latency), +15% OCR accuracy, NLP extraction pipelines
- Hackathon 1st Place: AI Kitchen Optimisation (Mar 2025) — YOLOv8 + LLaMA + XGBoost + Prophet
- AI Radar (May–Jun 2026): production RAG briefing platform, 260+ records/day, Hit@1 100%, FastAPI · Next.js · pgvector · Groq · Jina AI · Prefect · Supabase · Vercel · Railway
- Road Damage Detection (Mar–Apr 2024): YOLOv5, 87% mAP@0.5, PyTorch + OpenCV
- Seeking: AI/ML placement 2026–27, London or remote
- Contact: pshrey964@gmail.com | linkedin.com/in/shreypatel-ai | github.com/shrey-14

Confirmed as up-to-date; do not fabricate additional projects, metrics, employers, or dates beyond this block.

## Product Principles

1. Craft is the pitch — interaction depth and choreography precision are themselves evidence of engineering skill, not garnish on top of a CV.
2. Never fabricate — AI.TERMINAL and all copy stay strictly within the confirmed CV facts above.
3. Three exits, one visitor — every section should plausibly route toward CV credibility, direct contact, or terminal engagement; none of the three is disposable.
4. Retro fidelity over generic modernism — Win95/98-era conventions (windows, taskbar, dial-up, BSOD) are binding brand commitments, not a mood board to drift from.
5. One state hub — OSContext is the only owner of theme/window/overlay state; sections read and dispatch through it rather than growing local copies.

## Accessibility & Inclusion

No product-specific accessibility requirement established yet.
