FROM node:20-alpine AS base

# Install dependencies for native modules
RUN apk add --no-cache python3 make g++ libc6-compat

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/skills ./skills
COPY --from=builder /app/node_modules/pptxgenjs ./node_modules/pptxgenjs
COPY --from=builder /app/node_modules/jszip ./node_modules/jszip

# Copy pre-existing data (assets, uploads, SQLite DB, presentations)
COPY --from=builder /app/data ./data
RUN mkdir -p /app/data/uploads /app/data/presentations
RUN chown -R nextjs:nodejs /app/data

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
