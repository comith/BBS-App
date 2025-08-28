# Stage 1: ใช้ Node.js official image เป็น Base image
FROM node:18-alpine AS builder

ARG NEXT_PUBLIC_VAPID_PUBLIC_KEY
ENV NEXT_PUBLIC_VAPID_PUBLIC_KEY=$NEXT_PUBLIC_VAPID_PUBLIC_KEY

WORKDIR /app

# Copy source code ทั้งหมดไปยัง working directory
# คำสั่งนี้จะคัดลอกทั้งโฟลเดอร์ 'public' และไฟล์อื่นๆ ที่จำเป็น
COPY . .

# Copy package.json และ package-lock.json
COPY package*.json ./
RUN npm install

# รัน build command ของ Next.js
RUN npm run build

# Stage 2: สร้าง Production image
FROM node:18-alpine

# Set environment variables for the production runtime
ARG NEXT_PUBLIC_VAPID_PUBLIC_KEY
ENV NEXT_PUBLIC_VAPID_PUBLIC_KEY=$NEXT_PUBLIC_VAPID_PUBLIC_KEY

WORKDIR /app

# Copy ไฟล์ build ที่จำเป็นจาก builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# *** ส่วนสำคัญ: Copy โฟลเดอร์ public ***
# โฟลเดอร์นี้จะต้องมีใน Final image เพื่อให้เข้าถึง Assets ได้
COPY public ./public


EXPOSE 3000

# กำหนด command ที่จะรันเมื่อ container เริ่มต้น
CMD ["npm", "run", "start"]