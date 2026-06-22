import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import '@zurich/css-components/base.css';
import '@zurich/css-components/javascript.js';
import './shared.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
