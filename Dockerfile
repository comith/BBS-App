# Stage 1: Builder
FROM node:20-slim AS builder

WORKDIR /app

# Build tools สำหรับ native modules (web-push, pg)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy lockfile + prisma schema ก่อน npm ci
# เพราะ @prisma/client มี postinstall ที่รัน `prisma generate`
# ถ้า schema.prisma ไม่อยู่ตอน npm ci → generate ล้มเหลว → PrismaClient ไม่มี type
COPY package*.json ./
COPY prisma ./prisma

RUN npm ci

# Copy source code ที่เหลือ
COPY . .

ARG NEXT_PUBLIC_VAPID_PUBLIC_KEY
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_VAPID_PUBLIC_KEY=$NEXT_PUBLIC_VAPID_PUBLIC_KEY
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

RUN npm run build

# Stage 2: Production runner
FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy เฉพาะสิ่งที่จำเป็น
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

CMD ["npm", "run", "start"]
