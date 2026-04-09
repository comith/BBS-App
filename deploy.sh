#!/bin/bash
set -e

echo "🚀 Starting Deployment..."

# เพิ่มบรรทัดนี้: ล้างการเปลี่ยนแปลงที่เกิดขึ้นบน VPS ทิ้งก่อน (ป้องกันศึกแย่งไฟล์)
echo "🧹 Clearing auto-generated files..."
git checkout -- .

echo "📥 Pulling latest code..."
git pull origin main

# --- ส่วนที่เพิ่มมา: แสดงข้อมูลเวอร์ชัน ---
echo "----------------------------------------------"
echo "📌 Current Version Details:"
# แสดงรหัส Commit สั้นๆ และข้อความ Commit ล่าสุด
git log -1 --format="%C(auto)%h %C(magenta)[%ad]%C(reset) %s" --date=short
echo "----------------------------------------------"

# 2. ติดตั้ง dependencies
echo "📦 Installing dependencies..."
npm install

# 3. ล้างไฟล์เก่าและ Cache
echo "🧹 Cleaning old builds and cache..."
rm -rf .next/cache

# 4. สร้างไฟล์ใหม่
echo "🏗️ Building the project..."
npm run build

# 5. จัดการสิทธิ์ไฟล์
echo "🔐 Setting permissions..."
sudo chown -R $USER:www-data .next
sudo chmod -R 755 .next

# 6. รีสตาร์ท PM2
echo "🔄 Restarting PM2 process..."
pm2 restart bbs-web-1

echo "✅ Deployment Successful!"
