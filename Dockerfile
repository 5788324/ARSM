# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN npx prisma generate
RUN pnpm build

# Stage 2: Runtime
FROM node:20-alpine AS runner
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

# Install ffmpeg for media scanning
RUN apk add --no-cache ffmpeg

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.pnpm ./node_modules/.pnpm

EXPOSE 3000

CMD ["node", "server.js"]
