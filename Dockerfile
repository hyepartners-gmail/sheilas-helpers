# ------------ 1) Build FRONT-END -----------------
FROM node:18 AS frontend-builder

# Set work dir to /app/frontend
WORKDIR /app/frontend

# Install deps first (leverages Docker cache)
COPY frontend/package*.json ./
RUN npm ci

# Copy the rest of the front-end source and build
COPY frontend/ .
RUN npm run build          # outputs to frontend/dist

# ------------ 2) Build BACK-END ------------------
FROM node:18 AS backend-builder

WORKDIR /app/backend

# Install back-end deps
COPY backend/package*.json backend/tsconfig*.json ./
RUN npm ci

# Copy source & compile TypeScript ➜ dist/
COPY backend/ .
RUN npm run build          # assumes "build": "tsc" in backend/package.json

# ------------ 3) Create RUNTIME IMAGE ------------
FROM node:18-slim AS runner

# Copy compiled back-end
WORKDIR /app
COPY --from=backend-builder /app/backend/dist ./backend/dist
COPY --from=backend-builder /app/backend/node_modules ./backend/node_modules

# Copy compiled front-end into a public folder the Express app can serve
COPY --from=frontend-builder /app/frontend/dist ./backend/dist/public

# Set env vars expected by the app (override in Cloud Run as needed)
ENV NODE_ENV=production \
    PORT=3000

EXPOSE 3000
CMD ["node", "backend/dist/index.js"]
