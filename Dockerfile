# Stage 1: Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package.json ก่อน เพื่อใช้ Docker cache
COPY package*.json ./
RUN npm install

# Copy source code ทั้งหมด
COPY . .

# รับ build args (ใช้ได้เฉพาะตอน build)
ARG NEXT_PUBLIC_VAPID_PUBLIC_KEY
ARG VAPID_PRIVATE_KEY

# set env สำหรับ build (Next.js จะใช้ตอน build)
ENV NEXT_PUBLIC_VAPID_PUBLIC_KEY=$NEXT_PUBLIC_VAPID_PUBLIC_KEY
ENV VAPID_PRIVATE_KEY=$VAPID_PRIVATE_KEY

# รัน build
RUN npm run build

# Stage 2: Production image
FROM node:18-alpine

WORKDIR /app

# รับ build args อีกรอบ (ถ้าจะส่งค่าเข้า runtime container)
ARG NEXT_PUBLIC_VAPID_PUBLIC_KEY
ARG VAPID_PRIVATE_KEY

# set env สำหรับ runtime
ENV NEXT_PUBLIC_VAPID_PUBLIC_KEY=$NEXT_PUBLIC_VAPID_PUBLIC_KEY
ENV VAPID_PRIVATE_KEY=$VAPID_PRIVATE_KEY

# Copy ไฟล์จำเป็นจาก builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["npm", "run", "start"]
