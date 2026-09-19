# ==========================================
# PitchXI Production Multi-Stage Dockerfile
# ==========================================
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Step 1: Install Dependencies
FROM base AS deps
COPY package.json package-lock.json ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
RUN npm ci

# Step 2: Build Application
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client & Build Packages
ENV NODE_ENV=production
RUN npm run build --workspace=@pitchxi/shared-types
RUN cd apps/api && npx prisma generate
RUN npm run build --workspace=@pitchxi/api
RUN npm run build --workspace=@pitchxi/web

# Step 3: Production Runner
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=4000
WORKDIR /app

# Copy built artifacts & dependencies
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared-types ./packages/shared-types
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/apps/web/dist ./apps/web/dist

EXPOSE 4000

# Run Prisma migrations & start PitchXI API server with WebSockets
CMD ["sh", "-c", "cd apps/api && npx prisma db push && node dist/index.js"]
