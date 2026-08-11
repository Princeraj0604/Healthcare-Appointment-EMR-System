# ============================================================
# Healthcare Backend — Multi-stage Dockerfile
# Stage 1: Build TypeScript
# Stage 2: Run production node (lean image)
# ============================================================

# ── Stage 1: Build ───────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency files
COPY package*.json ./
COPY prisma ./prisma/

# Install all deps (including devDependencies for build)
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# ── Stage 2: Production ──────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# Install curl for health check
RUN apk add --no-cache curl

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy Prisma files
COPY prisma ./prisma/

# Generate Prisma client in production stage
RUN npx prisma generate

# Copy built JS from builder stage
COPY --from=builder /app/dist ./dist

# Create necessary directories
RUN mkdir -p logs uploads

# Non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodeuser -u 1001

USER nodeuser

EXPOSE 5000

# Run migrations then start server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
