import type { UnlockToastState } from '../types';
import type { EventBannerState, ModuleUnlockState } from '../useGameEngine';

export function EventBanner({ banner }: { banner: EventBannerState | null }) {
  if (!banner) return null;
  return (
    <div className="pf-banner" role="alert">
      <div className="pf-banner-title">⚠ {banner.text}</div>
      <div className="pf-banner-sub">{banner.sub}</div>
    </div>
  );
}

export function ModuleUnlockBanner({ banner }: { banner: ModuleUnlockState | null }) {
  if (!banner) return null;
  return (
    <div className="pf-banner pf-banner-unlock" role="status">
      <div className="pf-banner-title">✔ NEW HARDWARE — {banner.text}</div>
    </div>
  );
}

const SECTION_LABEL: Record<UnlockToastState['section'], string> = {
  projects: 'Projects.exe',
  skills: 'Skills / Neural Graph',
  contact: 'Contact.exe',
  resume: 'Resume.pdf',
};

export function UnlockToast({
  toast, onOpen, onDismiss,
}: { toast: UnlockToastState; onOpen: () => void; onDismiss: () => void }) {
  return (
    <div className="pf-toast" role="dialog" aria-label="Section unlocked">
      <div className="pf-toast-bar">
        <span>SYSTEM MESSAGE</span>
        <button className="pf-winbtn" onClick={onDismiss} aria-label="Dismiss">✕</button>
      </div>
      <div className="pf-toast-body">
        <b>{toast.moduleName} mastered — {SECTION_LABEL[toast.section]} unlocked!</b>
        Your factory just expanded a piece of the real OS.
        <div className="pf-toast-actions">
          <button className="pf-btn pf-btn-primary" onClick={onOpen}>Open</button>
          <button className="pf-btn" onClick={onDismiss}>Later</button>
        </div>
      </div>
    </div>
  );
}
