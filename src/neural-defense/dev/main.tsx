import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { DevHarness } from './DevHarness';
import './dev.css';

const container = document.getElementById('root');
if (!container) throw new Error('#root not found');

createRoot(container).render(
  <StrictMode>
    <DevHarness />
  </StrictMode>,
);
