# BBS-App (Behavior Based Safety)

> ระบบจัดการพฤติกรรมความปลอดภัยสำหรับองค์กร ITH — Behavior Based Safety Web Application

## Overview

BBS-App เป็นระบบบันทึกและติดตามพฤติกรรมความปลอดภัยในองค์กร โดยให้พนักงานสามารถรายงานพฤติกรรมเสี่ยงและพฤติกรรมที่ปลอดภัยได้แบบ Real-time พร้อม Dashboard สรุปผลสำหรับผู้บริหาร

## Features

- **บันทึกรายงานพฤติกรรม** — กรอกแบบฟอร์มรายงานพร้อมแนบภาพ
- **Dashboard สรุปผล** — สถิติและกราฟแบบ Real-time แยกตามปี/แผนก/กลุ่ม
- **อนุมัติ/ปฏิเสธรายงาน** — Admin อนุมัติรายงานพร้อม feedback
- **Push Notifications (PWA)** — แจ้งเตือนผ่าน Web Push เมื่อมีรายงานใหม่
- **จัดการพนักงาน** — เพิ่ม/แก้ไขข้อมูลพนักงาน แผนก กลุ่ม หมวดหมู่
- **Maintenance Mode** — Admin ปิดระบบชั่วคราวพร้อม countdown page
- **Responsive / PWA** — รองรับ Desktop และ Mobile, ติดตั้งเป็น App ได้

## Tech Stack

| ด้าน | เทคโนโลยี |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| UI Components | Radix UI + shadcn/ui |
| Database | PostgreSQL (ผ่าน Supabase) |
| ORM | Prisma 7 |
| DB Driver | pg (node-postgres) |
| Auth | Supabase Auth |
| Charts | Recharts |
| Forms | React Hook Form + Zod |
| Notifications | Web Push API (VAPID) |
| PWA | @ducanh2912/next-pwa |
| State | TanStack Query v5 |

## Architecture

```
BBS-App/
├── app/
│   ├── api/                  # API Routes
│   │   ├── approve/          # อนุมัติ/ปฏิเสธรายงาน
│   │   ├── get/              # ดึงข้อมูล (employee, record, category ฯลฯ)
│   │   ├── post/             # เพิ่มข้อมูล
│   │   ├── put/              # แก้ไขข้อมูล
│   │   ├── delete/           # ลบข้อมูล
│   │   ├── upload/           # อัปโหลดไฟล์/รูปภาพ
│   │   ├── subscribe/        # บันทึก push subscription
│   │   ├── send-notification/# ส่ง push notification
│   │   ├── notification-logs/# ประวัติการแจ้งเตือน
│   │   ├── maintenance/      # ตั้งค่าปิดปรับปรุงระบบ (admin only)
│   │   └── maintenance-status/ # สถานะระบบ (public)
│   ├── auth/                 # หน้า Login
│   ├── dashboard/            # Dashboard หลัก (admin)
│   ├── form/                 # ฟอร์มบันทึกรายงาน
│   ├── employeer/            # หน้ารายงานของพนักงาน
│   ├── maintenance/          # หน้าปิดปรับปรุงระบบ (countdown)
│   ├── manageusers/          # จัดการข้อมูลพนักงาน
│   ├── managecategory/       # จัดการหมวดหมู่
│   └── shemanage/            # จัดการข้อมูล SHE
├── components/ui/            # shadcn/ui components
├── hooks/                    # Custom hooks (useNotification ฯลฯ)
├── lib/                      # Utilities (notificationService, utils)
├── prisma/
│   └── schema.prisma         # Database schema
├── middleware.ts             # Maintenance mode redirect
└── public/                   # Static assets, PWA icons
```

## Database Models (Prisma)

- `Employee` — ข้อมูลพนักงาน
- `Record` — รายงานพฤติกรรม
- `RecordShe` — รายงาน SHE
- `Category` / `SubCategory` — หมวดหมู่พฤติกรรม
- `Department` / `Group` — แผนกและกลุ่ม
- `ListOption` — ตัวเลือก dropdown
- `Subscription` — Push notification subscriptions
- `NotificationLog` — ประวัติการแจ้งเตือน
- `MaintenanceSetting` — ตั้งค่าปิดปรับปรุงระบบ

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL (หรือ Supabase project)

### Installation

1. **Clone & install**
   ```bash
   git clone <repository-url>
   cd BBS-App
   npm install
   ```

2. **ตั้งค่า environment variables**
   ```bash
   cp .env.example .env.local
   ```

   `.env.local` ที่จำเป็น:
   ```env
   DATABASE_URL=postgresql://...
   DIRECT_URL=postgresql://...
   NEXT_PUBLIC_SUPABASE_URL=https://...
   SUPABASE_SERVICE_ROLE_KEY=...
   NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
   VAPID_PRIVATE_KEY=...
   ```

   สร้าง VAPID keys:
   ```bash
   npx web-push generate-vapid-keys
   ```

3. **Setup database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

   เปิด [http://localhost:3000](http://localhost:3000)

## Scripts

```bash
npm run dev        # Development server
npm run build      # Build production
npm start          # Start production server
npm run lint       # ESLint
npm test           # Run tests
```

## Docker Deployment

สร้างไฟล์ `.env` ข้างๆ `docker-compose.yml`:

```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
```

รัน:
```bash
docker-compose up -d
```

> **หมายเหตุ:** `NEXT_PUBLIC_*` ต้องมีค่าตอน `docker build` เพราะ Next.js embed ค่าลง JS bundle ตอน build time

## Security

- ห้าม commit ไฟล์ `.env` หรือ `.env.local`
- `VAPID_PRIVATE_KEY` และ `SUPABASE_SERVICE_ROLE_KEY` เป็น server-side only
- Maintenance admin ถูก restrict ด้วย employee ID ใน server-side API
- ใช้ HTTPS ใน production (Web Push บังคับ HTTPS)

## Known Issues

- กด F5 ในบางครั้งอาจเจอ webpack cache error ในโหมด development — แก้ด้วยการกด Shift+F5 หรือลบ `.next/` แล้ว restart

---

ITH Development Team
