import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { NeuralDefenseGame } from '../NeuralDefenseGame';
import type { CameraMode } from '../game/rendering/CameraRig';
import './dev.css';

const container = document.getElementById('root');
if (!container) throw new Error('#root not found');

// Dev-only QA toggles, e.g. game-dev.html?camera=orthographic&crt=0
const params = new URLSearchParams(window.location.search);
const cameraMode = (params.get('camera') as CameraMode | null) ?? undefined;
const crtParam = params.get('crt');
const crtEnabled = crtParam === null ? undefined : crtParam !== '0';

createRoot(container).render(
  <StrictMode>
    <NeuralDefenseGame cameraMode={cameraMode} crtEnabled={crtEnabled} />
  </StrictMode>,
);
