# ── Stage 1: Build ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@9

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install all deps (including devDependencies for build)
RUN pnpm install --frozen-lockfile 2>/dev/null || pnpm install

# Copy source
COPY tsconfig.json ./
COPY src ./src

# Build TypeScript → JS
RUN pnpm run build

# ── Stage 2: Runtime ───────────────────────────────────────────────────────────
FROM node:20-alpine AS runtime

WORKDIR /app

# Install pnpm for production install
RUN npm install -g pnpm@9

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Production deps only
RUN pnpm install --prod --frozen-lockfile 2>/dev/null || pnpm install --prod

# Copy compiled output
COPY --from=builder /app/dist ./dist

# Copy migrations (needed at runtime for auto-migrate on startup)
COPY src/db/migrations ./dist/db/migrations

EXPOSE 3001

# Healthcheck for Railway
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:3001/health || exit 1

CMD ["node", "dist/index.js"]
