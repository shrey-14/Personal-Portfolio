/* ══════════════════════════════════════════════════════════════════════════
   AskShreySection.jsx — "AI.TERMINAL" (SHREY/OS · section 06)
   ──────────────────────────────────────────────────────────────────────────
   Win95 window: IBM Plex Mono terminal chat backed by Groq.
   Mirrors the exact architecture of JourneySection / SkillsSection:
     • OSContext owns the win state (wins.aiterminal)
     • IntersectionObserver reveals + opens the window on scroll
     • Drag / minimize / close via wAction
     • Taskbar registration in FixedComponents TB_WINS
   ══════════════════════════════════════════════════════════════════════════ */
import { useState, useRef, useEffect, useCallback } from 'react';
import useWindowDrag from './useWindowDrag';
import { useOS, playClick, playWindowOpen } from './OSContext';
import { OsTerminal } from './OsIcons';

/* ── Backend config ─────────────────────────────────────────────────────────
   The Groq key + system prompt live SERVER-SIDE in api/ask.js (a Vercel
   function mirroring api/contact.js) — a VITE_* key would ship in the public
   bundle where anyone can lift it. The label below is display copy only. */
const ASK_ENDPOINT = '/api/ask';
const MODEL_LABEL  = 'llama-3.3-70b';
/* Conversation depth sent per request — enough context, bounded cost. */
const HISTORY_LIMIT = 8;

/* ── Suggested prompts ─────────────────────────────────────────────────── */
const SUGS = [
  'What is AI Radar?',
  'How did you win the hackathon?',
  'What roles is Shrey looking for?',
  'Computer vision experience?',
  'Tell me about the MSc',
];

/* ── One message in the conversation ──────────────────────────────────── */
function Message({ role, text, ts }) {
  const label = role === 'user' ? 'YOU' : role === 'ai' ? 'SHREY·AI' : 'SYSTEM';
  return (
    <div className={`at-msg at-msg-${role}`}>
      <div className="at-msg-meta">{label} · {ts}</div>
      <div className="at-msg-text">
        {role === 'user' && <span className="at-msg-pfx" aria-hidden="true">&gt; </span>}
        {role === 'ai'   && <span className="at-msg-pfx at-msg-pfx-ai" aria-hidden="true">$ </span>}
        {text}
      </div>
    </div>
  );
}

function ThinkingMessage() {
  return (
    <div className="at-msg at-msg-ai at-msg-thinking">
      <div className="at-msg-meta">SHREY·AI</div>
      <div className="at-msg-text">
        <span className="at-msg-pfx at-msg-pfx-ai" aria-hidden="true">$ </span>
        <span className="at-thinking-cursor" aria-label="thinking">▋</span>
      </div>
    </div>
  );
}

/* ── Helpers ───────────────────────────────────────────────────────────── */
function nowTS() {
  const n = new Date();
  return `${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}:${String(n.getSeconds()).padStart(2,'0')}`;
}
function bootTS() { return '00:00:00'; }

const BOOT_MSGS = [
  { role: 'sys',  text: 'AI.TERMINAL v1.0 — SHREY/OS\nModel: llama-3.3-70b via Groq\n──────────────────────────────\nSession started. Ask anything about Shrey. (tip: this is a real shell — try \'help\')', ts: bootTS() },
  { role: 'ai',   text: "Hey — I'm an AI built on everything Shrey has shipped and studied.\n\nAsk me about his projects, skills, background, or whether he'd be the right fit for your team. I only know what's in his CV — I'll say so if something's outside that.", ts: '00:00:01' },
];

/* Local shell commands — answered instantly, client-side, no Groq round-trip.
   Role stays 'sys' (never 'ai') so it's never mistaken for the model
   reasoning — this is the terminal itself talking, like a real shell. Exact
   match only (not substring) so a genuine question containing "help" never
   misfires. */
const LOCAL_COMMANDS = {
  help: "Available commands: help · whoami · ls · neofetch · date · clear\nOr just type a real question — I'll answer from Shrey's CV.",
  whoami: "shrey — MSc AI @ Brunel University London (2026–27) · BEng IT, LJ Institute (First Class Distinction) · ex-Data Science Intern @ Petpooja · seeking AI/ML placements, London or remote.\ngroups: root(admin), ml(engineer), cv(computer-vision)",
  ls: "projects/\n├── ai_radar.ts          260+ records/day · Hit@1 100%\n├── kitchen_opt.ipynb    1st place hackathon\n├── road_damage.pt       YOLOv5 · 87% mAP@0.5\n└── contact.card         -> scroll to 07\n\ntry: neofetch",
  neofetch: "shrey@SHREY-OS\n─────────────────\nOS: SHREY/OS 1.0\nHost: Brunel University London\nKernel: MSc-AI 2026.01\nUptime: 2 shipped ML projects, 1 hackathon win\nShell: /bin/groq\nTerminal: ask.shrey.exe\nCPU: Human Reasoning Engine\nMemory: 800+ pipelines optimised (Petpooja)",
};
LOCAL_COMMANDS.dir = LOCAL_COMMANDS.ls;
const SUDO_REPLY = "shrey is not in the sudoers file. This incident will be reported.\n(kidding — this terminal only reads Shrey's CV, no prod access here. Try a real question.)";

/* Client-side ceiling so a hung Groq call can't leave the terminal disabled
   forever with only "Clear conversation" (which wipes history) as an out. */
const FETCH_TIMEOUT_MS = 25_000;

/* ════════════════════════════════════════════════════════════════════════
   SECTION
  ════════════════════════════════════════════════════════════════════════ */
export default function AskShreySection() {
  const os     = useOS();
  const winCtl = !os.isMobile;

  const rootRef    = useRef(null);
  const winRef     = useRef(null);
  const onTitlebarDown = useWindowDrag(winRef, { enabled: !!winCtl });
  const msgsRef    = useRef(null);
  const inputRef   = useRef(null);
  const winOpenRef = useRef(false);
  const genRef     = useRef(0);      // bumps on Clear — stale replies discard

  const [msgs,     setMsgs]     = useState(BOOT_MSGS);
  const [input,    setInput]    = useState('');
  const [thinking, setThinking] = useState(false);
  const [status,   setStatus]   = useState('READY');

  const state  = os.wins?.aiterminal || { open: true, minimized: false };
  const hidden = winCtl && (!state.open || state.minimized);

  /* keep winOpenRef in sync */
  useEffect(() => { winOpenRef.current = !!os.wins.aiterminal?.open; }, [os.wins.aiterminal]);

  /* scroll the message pane (and only the pane) to the newest line */
  useEffect(() => {
    const el = msgsRef.current; if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: os.reducedMotion ? 'auto' : 'smooth' });
  }, [msgs, thinking, os.reducedMotion]);

  /* reveal + auto-open on scroll */
  useEffect(() => {
    const el = rootRef.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        el.classList.add('at-in');
        if (winCtl && !winOpenRef.current) {
          os.wAction('aiterminal', 'open');
          playWindowOpen();
        }
      }
    }, { threshold: 0.12 });
    io.observe(el);
    return () => io.disconnect();
  }, [winCtl]);


  /* send message */
  const send = useCallback(async (text) => {
    const q = (text ?? input).trim();
    if (!q || thinking) return;
    const cmdKey = q.toLowerCase();

    if (cmdKey === 'clear') {
      playClick();
      genRef.current += 1;
      setMsgs(BOOT_MSGS);
      setInput('');
      setThinking(false);
      setStatus('READY');
      return;
    }

    setInput('');
    playClick();
    const ts = nowTS();
    setMsgs(m => [...m, { role: 'user', text: q, ts }]);

    const localReply = cmdKey === 'date'
      ? `Local time: ${new Date().toString()}`
      : (LOCAL_COMMANDS[cmdKey] ?? (cmdKey.startsWith('sudo') ? SUDO_REPLY : null));
    if (localReply) {
      setMsgs(m => [...m, { role: 'sys', text: localReply, ts: nowTS() }]);
      return;
    }

    setThinking(true);
    setStatus('GENERATING...');

    const gen = genRef.current;
    const history = [...msgs, { role: 'user', text: q }]
      .filter(m => m.role === 'user' || m.role === 'ai')
      .slice(-HISTORY_LIMIT)
      .map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.text }));

    /* Offline / local-dev answers for the five suggested prompts — used when the
       serverless endpoint isn't reachable (e.g. `npm run dev` without
       `vercel dev`). All content sourced from the CV. */
    const DEMO = {
        'What is AI Radar?': "AI Radar is a production briefing platform Shrey built in May–Jun 2026.\n\nIt ingests 260+ AI news records daily via Prefect pipelines, embeds them with Jina AI, stores vectors in PostgreSQL/pgvector on Supabase, and serves personalised summaries through Groq LLaMA inference.\n\nHit@1 accuracy: 100%. End-to-end latency under 2 seconds.\nStack: FastAPI · Next.js · pgvector · Groq · Jina AI · Prefect · Supabase · Vercel · Railway",
        'How did you win the hackathon?': "First place — AI Kitchen Optimisation Hackathon (Mar 2025).\n\nShrey chained four AI models:\n1. YOLOv8 → detect kitchen inventory\n2. XGBoost + Prophet → forecast demand\n3. LLaMA via Groq → generate recipes\n4. Plotly → real-time dashboard\n\nMost teams used one model. The judges rewarded the end-to-end multimodal design.",
        'What roles is Shrey looking for?': "AI/ML placement, 2026–27, London or remote.\n\nStrong fit for:\n· Production ML systems / MLOps\n· Computer vision applications\n· RAG + LLM product development\n· Data engineering with real deployment",
        'Computer vision experience?': "Solid. Two shipped projects:\n\nRoad Damage Detection (Mar–Apr 2024):\n· YOLOv5 fine-tuned on 4-class road damage dataset\n· 87% mAP@0.5\n· PyTorch + OpenCV augmentation pipeline\n\nKitchen Optimisation Hackathon:\n· YOLOv8 for real-time inventory detection\n· Part of the 4-model pipeline that placed 1st",
        'Tell me about the MSc': "MSc Artificial Intelligence, Brunel University London (Jan 2026 – Apr 2027, in progress).\n\nModules: Machine Learning · Deep Learning · Data Visualisation · Modern Data\n\nBefore: BEng Information Technology, LJ Institute — First Class with Distinction (2021–2025).",
      };

    // Flash the statusbar to an error state, then settle back to READY —
    // "● ONLINE" must never sit next to a message admitting the request failed.
    let errored = false;
    const flagError = () => {
      errored = true;
      setStatus('ERROR');
      setTimeout(() => { if (genRef.current === gen) setStatus('READY'); }, 2200);
    };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const res = await fetch(ASK_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!res.ok) {
        // A real server response beats the offline demo — never mask a genuine
        // rate-limit/backend error behind a canned answer that looks scripted.
        const body = await res.json().catch(() => ({}));
        if (genRef.current !== gen) return;
        flagError();
        setMsgs(m => [...m, {
          role: 'sys',
          text: body.error || `Server error (${res.status}). Try again in a moment, or email pshrey964@gmail.com directly.`,
          ts: nowTS(),
        }]);
        return;
      }

      const data = await res.json();
      if (genRef.current !== gen) return;   // conversation was cleared mid-flight
      const ans = String(data.answer || '').trim() || 'No response.';
      setMsgs(m => [...m, { role: 'ai', text: ans, ts: nowTS() }]);
    } catch (err) {
      clearTimeout(timer);
      if (genRef.current !== gen) return;
      flagError();
      // Demo fallback is ONLY for the fetch itself failing (endpoint
      // unreachable — e.g. `npm run dev` without `vercel dev`), never for a
      // real HTTP error response, which is handled above.
      const demo = DEMO[q];
      if (demo) {
        await new Promise(r => setTimeout(r, 500 + q.length * 1.2));
        if (genRef.current !== gen) return;
        setMsgs(m => [...m, { role: 'ai', text: demo, ts: nowTS() }]);
      } else {
        const timedOut = err?.name === 'AbortError';
        setMsgs(m => [...m, {
          role: 'sys',
          text: timedOut
            ? 'Uplink timeout — the AI endpoint took too long to respond.\nTry again in a moment, or email pshrey964@gmail.com directly.'
            : 'Uplink error — the AI endpoint did not respond.\nTry again in a moment, or email pshrey964@gmail.com directly.',
          ts: nowTS(),
        }]);
      }
    } finally {
      if (genRef.current === gen) {
        setThinking(false);
        if (!errored) setStatus('READY');
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    }
  }, [input, msgs, thinking]);

  const clearChat = () => {
    playClick();
    genRef.current += 1;               // discard any in-flight reply
    setMsgs(BOOT_MSGS);
    setInput('');
    setThinking(false);
    setStatus('READY');
  };

  const goNext = () => {
    playClick();
    const el = document.getElementById('contact');
    if (el) el.scrollIntoView({ behavior: os.reducedMotion ? 'auto' : 'smooth' });
    else os.handleAction('contact');
  };

  return (
    <section id="ask-shrey" className="at-section" ref={rootRef}>
      <div className="at-inner">

        {/* section header — same pattern as sk-break / jn-break */}
        <header className="at-break">
          <span className="at-idx">06</span>
          <span className="at-title">Ask Shrey AI</span>
          <span className="at-sub">// ask_shrey.exe — online</span>
          <span className="at-rule" />
        </header>

        {/* Win95 window */}
        <div className={`at-win${hidden ? ' at-win-hidden' : ''}`} ref={winRef}>

          {/* titlebar */}
          <div className="at-titlebar draggable-titlebar" onPointerDown={onTitlebarDown}>
            <OsTerminal size={14} className="at-tico" aria-hidden="true" />
            <span className="at-titletxt">AI.TERMINAL — ask.shrey.exe</span>
            <span className="at-live-dot" aria-hidden="true" />
            <div className="at-winbtns">
              <button className="win-btn" aria-label="Minimize AI Terminal"
                onClick={() => { playClick(); os.wAction('aiterminal', 'minimize'); }}>_</button>
              <button className="win-btn" aria-hidden="true" tabIndex={-1}>□</button>
              <button className="win-btn win-close" aria-label="Close AI Terminal"
                onClick={() => { playClick(); os.wAction('aiterminal', 'close'); }}>✕</button>
            </div>
          </div>

          {/* menubar */}
          <div className="at-menubar">
            <span className="at-menu-item">File</span>
            <span className="at-menu-item">Edit</span>
            <span className="at-menu-item">Terminal</span>
            <span className="at-menu-item">Help</span>
            <span className="at-menu-spacer" />
            <span className="at-model-tag">Groq · {MODEL_LABEL}</span>
          </div>

          {/* messages */}
          <div className="at-messages" role="log" aria-live="polite" aria-label="AI conversation" ref={msgsRef}>
            {msgs.map((m, i) => <Message key={i} {...m} />)}
            {thinking && <ThinkingMessage />}
          </div>

          {/* suggestion chips */}
          <div className="at-sugs" aria-label="Suggested questions">
            {SUGS.map(s => (
              <button key={s} className="at-sug"
                onClick={() => send(s)}
                disabled={thinking}>
                {s}
              </button>
            ))}
          </div>

          {/* input strip */}
          <div className="at-input-row">
            <span className="at-prompt-pfx" aria-hidden="true">A:\&gt;</span>
            <input
              ref={inputRef}
              className="at-input"
              type="text"
              value={input}
              placeholder="ask anything about Shrey..."
              aria-label="Chat input"
              disabled={thinking}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.isComposing) send(); }}
            />
            <button className="at-clear-btn" onClick={clearChat} aria-label="Clear conversation">
              ↺ Clear
            </button>
            <button className="at-send" onClick={() => send()} disabled={thinking}
              aria-label="Send message">
              SEND ↵
            </button>
          </div>

          {/* statusbar */}
          <div className="at-statusbar" role="status" aria-live="polite">
            <span className="at-sb">{status}</span>
            <span className="at-sb">Groq API</span>
            <span className="at-sb at-sb-grow" />
            <span className={`at-sb ${status === 'ERROR' ? 'at-sb-error' : 'at-sb-online'}`}>
              {status === 'ERROR' ? '● UPLINK ERROR' : '● ONLINE'}
            </span>
          </div>

        </div>{/* /at-win */}

        {/* relaunch (when closed) — matches Journey's sec-relaunch pattern */}
        {winCtl && !state.open && (
          <button className="sec-relaunch"
            onClick={() => { playClick(); os.wAction('aiterminal', 'open'); }}>
            AI.TERMINAL — relaunch ▸
          </button>
        )}

        <button className="at-next" onClick={goNext}>
          <span>07 · Contact</span>
          <span className="at-next-arw">▼</span>
        </button>

      </div>
    </section>
  );
}