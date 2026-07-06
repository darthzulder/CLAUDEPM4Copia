import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { execSync } from 'child_process';
import { resolve } from 'path';

let commitHash = process.env.RENDER_GIT_COMMIT || 'unknown';
if (commitHash === 'unknown') {
  try {
    commitHash = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch (e) {
    // Silencioso si no está Git instalado (ej. dentro de Docker local)
  }
}

export default defineConfig(({ mode }) => {
  // El .env vive en la raíz de pm4-app (un nivel arriba del root de Vite = frontend/).
  // NO usamos envDir para no exponer todas las VITE_* del .env raíz al front (eso
  // activaría, p.ej., el token de debug). Solo leemos la site key de reCAPTCHA y la
  // inyectamos como __RECAPTCHA_SITE_KEY__. En Render, loadEnv también toma la var
  // del process.env del dashboard.
  const rootEnv = loadEnv(mode, resolve(__dirname, '..'), ['VITE_']);

  return {
    plugins: [react()],
    envPrefix: ['VITE_', 'WEB_ENTRY_'],
    define: {
      __COMMIT_HASH__: JSON.stringify(commitHash),
      __RECAPTCHA_SITE_KEY__: JSON.stringify(rootEnv.VITE_RECAPTCHA_SITE_KEY || ''),
    },
    server: {
      host: true,
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
      },
    },
  };
});
