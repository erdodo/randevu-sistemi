# --- Pre-built image (no build step) ---
FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy pre-built standalone app
COPY .next/standalone ./
COPY .next/static ./.next/static
COPY public ./public

# Copy prisma for db push at runtime
COPY prisma ./prisma
COPY prisma.config.ts ./prisma.config.ts

# Install only prisma CLI + pg adapter for runtime
RUN npm install --no-save prisma@7 @prisma/client@7 @prisma/adapter-pg@7 2>/dev/null && \
    npx prisma generate

# Copy entrypoint
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["./docker-entrypoint.sh"]
