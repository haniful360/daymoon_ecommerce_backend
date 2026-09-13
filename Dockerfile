# =================================================================
# Stage 1: Base & Dependencies
# =================================================================
FROM node:22-alpine AS dependencies

WORKDIR /app

# Install native compilation tools for bcrypt & OpenSSL/libc6 for Prisma
RUN apk add --no-cache python3 make g++ libc6-compat

# Enable pnpm via corepack
RUN corepack enable && corepack prepare pnpm@latest --activate

# Build-time dummy DATABASE_URL for Prisma client code generation
ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/daymoon_db?schema=public"

# Copy dependency definitions and Prisma schema files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

# Install dependencies cleanly
RUN pnpm install --frozen-lockfile || pnpm install

# Generate Prisma Client
RUN pnpm exec prisma generate

# =================================================================
# Stage 2: Build Application
# =================================================================
FROM dependencies AS builder

WORKDIR /app

# Copy source code and TypeScript config
COPY tsconfig*.json nest-cli.json ./
COPY src ./src/

# Compile TypeScript to JavaScript in /app/dist
RUN pnpm build

# =================================================================
# Stage 3: Production Runner
# =================================================================
FROM node:22-alpine AS runner

WORKDIR /app

# Runtime libraries for Prisma engine in Alpine
RUN apk add --no-cache libc6-compat

ENV NODE_ENV=production
ENV PORT=5000

# Copy built artifacts and dependencies
COPY --from=builder /app/dist ./dist
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/prisma ./prisma
COPY --from=dependencies /app/prisma.config.ts ./prisma.config.ts
COPY --from=dependencies /app/package.json ./package.json

EXPOSE 5000

# Start NestJS production server
CMD ["node", "dist/main.js"]
