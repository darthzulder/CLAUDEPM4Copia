FROM node:24-alpine

WORKDIR /app

# Copy package descriptors first to take advantage of layer caching
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/
# frontend deps @zurich/* resuelven a file:vendor/*.tgz (ZDS vendorizado, ver
# frontend/vendor/README.md) — el tarball debe existir antes de "npm ci".
COPY frontend/vendor/ ./frontend/vendor/

# Install dependencies for all workspaces
RUN npm ci

# Copy the rest of the application files
COPY . .

# Expose Vite frontend (5173) and Express backend (3001) ports
EXPOSE 3001 5173

# Run the concurrently dev server
CMD ["npm", "run", "dev"]
