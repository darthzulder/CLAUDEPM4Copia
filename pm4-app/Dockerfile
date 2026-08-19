FROM node:24-alpine

WORKDIR /app

# Copy package descriptors first to take advantage of layer caching.
# Los TRES workspaces del package.json de la raíz tienen que estar acá: `npm ci` valida el árbol
# completo contra el lock, así que si falta un package.json el install no cubre ese workspace.
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/
# CORREGIDO (Fase 7): faltaba, así que el `npm ci` del contenedor nunca instaló las dependencias de
# Angular — @angular/*, @zurich/angular-components ni @zurich-col/lib-zurich. El contenedor podía
# correr React y fallaba en cualquier comando de `frontend-ng` con "Cannot find module", un síntoma
# que se lee como problema del código y era del build de la imagen.
COPY frontend-ng/package.json ./frontend-ng/
# frontend deps @zurich/* resuelven a file:vendor/*.tgz (ZDS vendorizado, ver
# frontend/vendor/README.md) — el tarball debe existir antes de "npm ci".
#
# Sigue siendo necesario aunque React ya no se despliegue (Fase 7): mientras `frontend` esté en el
# array `workspaces`, el lock tiene entradas `file:frontend/vendor/*.tgz` y `npm ci` las resuelve.
# El día que se retire el workspace hay que borrar esta línea Y regenerar el lock, en el mismo
# commit. Angular NO usa estos tarballs: toma @zurich/*@0.8.2 del feed de Azure (ver .npmrc).
COPY frontend/vendor/ ./frontend/vendor/

# Install dependencies for all workspaces
RUN npm ci

# Copy the rest of the application files
COPY . .

# Backend Express (3001) y el dev server de Angular (4200). El 5173 era el de Vite/React, que desde
# la Fase 7 ya no es el frontend por defecto — `npm run dev` levanta backend + frontend-ng.
EXPOSE 3001 4200

# Run the concurrently dev server (backend + Angular). Para React: `npm run dev:react`.
CMD ["npm", "run", "dev"]
