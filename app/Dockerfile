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
COPY --from=builder /app/node_modules/setimmediate ./node_modules/setimmediate
COPY --from=builder /app/node_modules/lie ./node_modules/lie
COPY --from=builder /app/node_modules/immediate ./node_modules/immediate
COPY --from=builder /app/node_modules/readable-stream ./node_modules/readable-stream
COPY --from=builder /app/node_modules/safe-buffer ./node_modules/safe-buffer
COPY --from=builder /app/node_modules/inherits ./node_modules/inherits
COPY --from=builder /app/node_modules/string_decoder ./node_modules/string_decoder
COPY --from=builder /app/node_modules/util-deprecate ./node_modules/util-deprecate
COPY --from=builder /app/node_modules/core-util-is ./node_modules/core-util-is
COPY --from=builder /app/node_modules/process-nextick-args ./node_modules/process-nextick-args
COPY --from=builder /app/node_modules/isarray ./node_modules/isarray
COPY --from=builder /app/node_modules/pako ./node_modules/pako

# Copy pre-existing data (assets, uploads, SQLite DB, presentations)
COPY --from=builder /app/data ./data
RUN mkdir -p /app/data/uploads /app/data/presentations
RUN chown -R nextjs:nodejs /app/data

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
