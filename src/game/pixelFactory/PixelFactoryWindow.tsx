/* ══════════════════════════════════════════════════════════════════════════
   PixelFactoryWindow.tsx — top-level mount point for Pixel Factory 95.
   Wired to OSContext wins.pixelfactory exactly like ProjectsWindow/ContactWindow:
   drag / minimize / close all work through the same window manager. Renders
   nothing when closed or minimized so it costs nothing while off-screen.
   ═════════════════════════════════════════════════════════════════════════ */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useOS } from '../../OSContext';
import { useGameEngine } from './useGameEngine';
import { audio } from './audio';
import GameCanvas from './components/GameCanvas';
import HUD from './components/HUD';
import SidePanel from './components/SidePanel';
import { EventBanner, ModuleUnlockBanner, UnlockToast } from './components/Banners';
import { MainMenu, PauseMenu, GameOverDialog, SettingsDialog, CreditsDialog } from './components/MenuDialogs';
import type { UnlockToastState } from './types';
import './pixelfactory.css';

export default function PixelFactoryWindow() {
  const os = useOS();
  const winState = os.wins.pixelfactory || { open: false, minimized: false };
  const engine = useGameEngine();
  const winRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ tx: 0, ty: 0, pointerId: null as number | null, raf: 0 });
  const [showSettings, setShowSettings] = useState(false);
  const [showCredits, setShowCredits] = useState(false);
  const syncedReducedMotion = useRef(false);

  useEffect(() => {
    if (syncedReducedMotion.current) return;
    syncedReducedMotion.current = true;
    if (os.reducedMotion) engine.updateSettings({ reducedMotion: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!winState.open || winState.minimized) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (engine.phase === 'playing') engine.pauseGame();
      else if (showSettings) setShowSettings(false);
      else if (showCredits) setShowCredits(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [winState.open, winState.minimized, engine, showSettings, showCredits]);

  const onTitlebarDown = useCallback((e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest?.('.pf-winbtn')) return;
    const el = winRef.current; if (!el) return;
    const st = dragRef.current;
    if (st.pointerId != null) return;
    const bar = e.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    const homeLeft = rect.left - st.tx, homeTop = rect.top - st.ty, w = rect.width;
    const sx = e.clientX, sy = e.clientY, tx0 = st.tx, ty0 = st.ty;
    st.pointerId = e.pointerId;
    try { bar.setPointerCapture(e.pointerId); } catch { /* unsupported */ }

    const flush = () => { st.raf = 0; el.style.transform = `translate(-50%, -50%) translate(${st.tx}px,${st.ty}px)`; };
    const onMove = (ev: PointerEvent) => {
      if (ev.pointerId !== st.pointerId) return;
      let dtx = tx0 + (ev.clientX - sx), dty = ty0 + (ev.clientY - sy);
      dtx = Math.max(-(w - 80) - homeLeft, Math.min(window.innerWidth - 80 - homeLeft, dtx));
      dty = Math.max(-homeTop, Math.min(window.innerHeight - 54 - homeTop, dty));
      st.tx = dtx; st.ty = dty;
      if (!st.raf) st.raf = requestAnimationFrame(flush);
    };
    const onUp = (ev: PointerEvent) => {
      if (ev.pointerId !== st.pointerId) return;
      if (st.raf) { cancelAnimationFrame(st.raf); flush(); }
      st.pointerId = null;
      try { bar.releasePointerCapture(ev.pointerId); } catch { /* already released */ }
      bar.removeEventListener('pointermove', onMove);
      bar.removeEventListener('pointerup', onUp);
      bar.removeEventListener('pointercancel', onUp);
    };
    bar.addEventListener('pointermove', onMove);
    bar.addEventListener('pointerup', onUp);
    bar.addEventListener('pointercancel', onUp);
    e.preventDefault();
  }, []);

  const handleOpenSection = useCallback((toast: UnlockToastState) => {
    engine.dismissToast(toast.id);
    audio.notification();
    if (engine.phase === 'playing') engine.pauseGame();
    os.wAction('pixelfactory', 'minimize');
    if (toast.section === 'projects') os.handleAction('projects');
    else if (toast.section === 'contact') os.handleAction('contact');
    else if (toast.section === 'resume') window.open(os.cvHref, '_blank', 'noopener');
    else if (toast.section === 'skills') {
      const el = document.getElementById('skills');
      el?.scrollIntoView({ behavior: os.reducedMotion ? 'auto' : 'smooth', block: 'start' });
    }
  }, [engine, os]);

  if (!winState.open || winState.minimized) return null;

  const snapshot = engine.snapshot;

  return (
    <div className="pf-root">
      <div className="pf-window" ref={winRef} data-win-id="pixelfactory">
        <div className="pf-titlebar draggable-titlebar" onPointerDown={onTitlebarDown}>
          <span aria-hidden="true">🏭</span>
          <span className="pf-title-txt">
            Pixel Factory 95{snapshot && engine.phase === 'playing' ? ` — Score ${snapshot.stats.score}` : ''}
          </span>
          <div className="pf-winbtns">
            <button className="pf-winbtn" aria-label="Minimize"
              onClick={() => { audio.click(); os.wAction('pixelfactory', 'minimize'); }}>_</button>
            <button className="pf-winbtn" aria-hidden="true" tabIndex={-1}>□</button>
            <button className="pf-winbtn win-close" aria-label="Close"
              onClick={() => { audio.click(); os.wAction('pixelfactory', 'close'); }}>✕</button>
          </div>
        </div>

        <div className="pf-body">
          {snapshot && engine.phase !== 'menu' && (
            <HUD
              stats={snapshot.stats}
              highScore={engine.highScore}
              onPause={() => { audio.click(); engine.pauseGame(); }}
              onMute={() => engine.updateSettings({ sound: !engine.settings.sound })}
              muted={!engine.settings.sound}
            />
          )}

          <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>
            {snapshot && (
              <>
                <GameCanvas
                  snapshot={snapshot}
                  onAddBelt={engine.addBelt}
                  onRemoveBelt={engine.removeBelt}
                  onCollectPowerup={engine.collectPowerup}
                  reducedMotion={engine.settings.reducedMotion}
                />
                <SidePanel
                  snapshot={snapshot}
                  onAddBelt={engine.addBelt}
                  onRemoveBelt={engine.removeBelt}
                  onCollectPowerup={engine.collectPowerup}
                />
                <EventBanner banner={engine.eventBanner} />
                <ModuleUnlockBanner banner={engine.moduleUnlockBanner} />
                {engine.toastQueue.slice(0, 1).map(t => (
                  <UnlockToast key={t.id} toast={t} onOpen={() => handleOpenSection(t)} onDismiss={() => engine.dismissToast(t.id)} />
                ))}
              </>
            )}

            {engine.phase === 'menu' && (
              <MainMenu
                highScore={engine.highScore}
                hasSave={false}
                onNewGame={() => { audio.click(); engine.newGame(); }}
                onContinue={() => { audio.click(); engine.newGame(); }}
                onSettings={() => { audio.click(); setShowSettings(true); }}
                onCredits={() => { audio.click(); setShowCredits(true); }}
                onQuit={() => { audio.click(); os.wAction('pixelfactory', 'close'); }}
              />
            )}

            {engine.phase === 'paused' && !showSettings && (
              <PauseMenu
                onResume={() => { audio.click(); engine.resumeGame(); }}
                onRestart={() => { audio.click(); engine.newGame(); }}
                onSettings={() => { audio.click(); setShowSettings(true); }}
                onQuit={() => { audio.click(); engine.quitToMenu(); }}
              />
            )}

            {engine.phase === 'gameover' && engine.lastStats && (
              <GameOverDialog
                stats={engine.lastStats}
                highScore={engine.highScore}
                isNewBest={engine.isNewBest}
                onRetry={() => { audio.click(); engine.newGame(); }}
                onQuit={() => { audio.click(); engine.quitToMenu(); }}
              />
            )}

            {showSettings && (
              <SettingsDialog settings={engine.settings} onChange={engine.updateSettings} onClose={() => { audio.click(); setShowSettings(false); }} />
            )}
            {showCredits && <CreditsDialog onClose={() => { audio.click(); setShowCredits(false); }} />}
          </div>
        </div>
      </div>
    </div>
  );
}
