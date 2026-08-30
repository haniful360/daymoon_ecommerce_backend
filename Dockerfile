# =================================================================
# Stage 1: Base & Dependencies
# =================================================================
FROM node:22-alpine AS dependencies

WORKDIR /app

# Enable pnpm via corepack
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy dependency definition files
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

# Install dependencies and approve builds
RUN pnpm install && pnpm approve-builds --all

# Generate Prisma Client inside Docker
RUN pnpm exec prisma generate

# =================================================================
# Stage 2: Build Application
# =================================================================
FROM dependencies AS builder

WORKDIR /app

# Copy source code and config files
COPY tsconfig*.json nest-cli.json ./
COPY src ./src/

# Compile TypeScript to JavaScript in /app/dist
RUN pnpm build

# =================================================================
# Stage 3: Production Runner
# =================================================================
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Copy built application and generated Prisma files
COPY --from=builder /app/dist ./dist
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/generated ./generated
COPY --from=dependencies /app/prisma ./prisma
COPY --from=dependencies /app/package.json ./package.json

EXPOSE 5000

# Start NestJS production server
CMD ["node", "dist/main.js"]

