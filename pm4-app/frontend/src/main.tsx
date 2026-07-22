import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './zds-setup';   // arranque único de Zurich DS (tokens + comportamientos)
import './shared.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
