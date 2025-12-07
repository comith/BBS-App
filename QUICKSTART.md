# 🚀 Quick Start Guide - BBS-App

## สำหรับผู้พัฒนาใหม่

### 1. ติดตั้งและเริ่มต้น (5 นาที)

```bash
# 1. Clone repository
git clone <your-repo-url>
cd BBS-App

# 2. ติดตั้ง dependencies
npm install

# 3. Setup environment variables
cp .env.example .env.local
# แก้ไขไฟล์ .env.local ใส่ค่าจริง

# 4. รัน development server
npm run dev
```

เปิดเบราว์เซอร์ที่ http://localhost:3000

### 2. Environment Variables ที่จำเป็น

แก้ไขไฟล์ `.env.local`:

```env
# Google Sheets (จำเป็น)
GOOGLE_SHEET_ID=your_sheet_id
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-email@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Google Drive (จำเป็น)
GOOGLE_DRIVE_FOLDER_ID=your_folder_id

# VAPID Keys สำหรับ Push Notifications (จำเป็น)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key
VAPID_PRIVATE_KEY=your_private_key
VAPID_SUBJECT=mailto:your-email@example.com
```

### 3. สร้าง VAPID Keys

```bash
npx web-push generate-vapid-keys
```

คัดลอกผลลัพธ์ใส่ใน `.env.local`

### 4. ตรวจสอบว่าทุกอย่างทำงาน

```bash
# Build project
npm run build

# Run tests
npm test

# Check linting
npm run lint
```

## สำหรับผู้ดูแลระบบ

### การ Deploy

#### Option 1: Docker

```bash
# Build image
docker build -t bbs-app .

# Run container
docker run -p 3000:3000 --env-file .env.local bbs-app
```

#### Option 2: Vercel

1. Push code ไป GitHub
2. Import project ใน Vercel
3. เพิ่ม environment variables
4. Deploy

### การ Backup

```bash
# Backup Google Sheets data
# (ใช้ Google Sheets export feature)

# Backup environment variables
cp .env.local .env.backup
```

## คำสั่งที่ใช้บ่อย

```bash
# Development
npm run dev              # รัน dev server
npm run build            # Build production
npm start                # รัน production server

# Code Quality
npm run lint             # ตรวจสอบ code
npm run lint -- --fix    # แก้ไข linting errors อัตโนมัติ
npm test                 # รัน tests
npm run test:watch       # รัน tests แบบ watch mode

# Git Cleanup (ครั้งแรกเท่านั้น)
.\scripts\cleanup-git.ps1  # ลบ .env files จาก git
```

## โครงสร้างโปรเจกต์

```
BBS-App/
├── app/              # Pages และ API routes
├── components/       # React components
├── hooks/            # Custom hooks
├── lib/              # Utilities (logger, errorHandler, etc.)
├── public/           # Static files
├── scripts/          # Helper scripts
└── types/            # TypeScript types
```

## การแก้ปัญหาเบื้องต้น

### ❌ Build ล้มเหลว

```bash
# ลบ .next และ node_modules แล้วติดตั้งใหม่
rm -rf .next node_modules
npm install
npm run build
```

### ❌ Environment variables ไม่ทำงาน

1. Restart dev server หลังแก้ไข `.env.local`
2. ตรวจสอบว่าตัวแปรขึ้นต้นด้วย `NEXT_PUBLIC_` (สำหรับ client-side)
3. ตรวจสอบว่าไม่มีช่องว่างหรืออักขระพิเศษ

### ❌ TypeScript errors

```bash
# ตรวจสอบ TypeScript errors
npx tsc --noEmit

# แก้ไขทีละข้อ หรือใช้ // @ts-ignore (ไม่แนะนำ)
```

### ❌ Google Sheets API ไม่ทำงาน

1. ตรวจสอบว่า Service Account มีสิทธิ์เข้าถึง Sheet
2. ตรวจสอบว่า API ถูกเปิดใช้งานใน Google Cloud Console
3. ตรวจสอบ private key format (ต้องมี `\n` ไม่ใช่ `\\n`)

## 📚 เอกสารเพิ่มเติม

- [README.md](./README.md) - Overview และ setup
- [implementation_plan.md](./.gemini/antigravity/brain/.../implementation_plan.md) - Migration guide
- [Next.js Docs](https://nextjs.org/docs)

## 🆘 ต้องการความช่วยเหลือ?

1. ตรวจสอบ [README.md](./README.md)
2. ตรวจสอบ [Migration Guide](./.gemini/antigravity/brain/.../implementation_plan.md)
3. ติดต่อทีมพัฒนา

---

**Happy Coding! 🎉**
