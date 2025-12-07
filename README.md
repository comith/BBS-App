# BBS-App (Behavior Base Safety)

> ระบบจัดการพฤติกรรมความปลอดภัยสำหรับองค์กร - Behavior Base Safety Web Application

## 📋 Overview

BBS-App เป็นระบบจัดการพฤติกรรมเสี่ยงเพื่อสร้างพฤติกรรมที่ปลอดภัย โดยไม่ต้องรอให้เกิดอุบัติเหตุก่อน แต่จะเข้าไปสังเกตและปรับเปลี่ยนพฤติกรรมที่เสี่ยงตั้งแต่เนิ่นๆ เพื่อสร้างวัฒนธรรมความปลอดภัยในองค์กร

### ✨ Features

- 📝 **บันทึกรายงานพฤติกรรม** - ระบบบันทึกพฤติกรรมเสี่ยงและพฤติกรรมที่ปลอดภัย
- 📊 **Dashboard สรุปผล** - แสดงสถิติและรายงานแบบ real-time
- 👥 **จัดการผู้ใช้** - ระบบจัดการพนักงานและสิทธิ์การเข้าถึง
- 🔔 **Push Notifications** - แจ้งเตือนผ่าน Web Push API
- 📱 **Responsive Design** - รองรับทั้ง Desktop และ Mobile
- 🔐 **Google Sheets Integration** - เชื่อมต่อกับ Google Sheets สำหรับจัดเก็บข้อมูล

## 🚀 Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn
- Google Cloud Project with Sheets & Drive API enabled
- Google Service Account credentials

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd BBS-App
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` and fill in your credentials:
   - `GOOGLE_SHEET_ID` - Your Google Sheet ID
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL` - Service account email
   - `GOOGLE_PRIVATE_KEY` - Service account private key
   - `GOOGLE_DRIVE_FOLDER_ID` - Google Drive folder for file uploads
   - VAPID keys for push notifications (generate with `npx web-push generate-vapid-keys`)

4. **Run development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Architecture

```
BBS-App/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard pages
│   ├── form/              # Form pages
│   ├── employeer/         # Employee reports
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ui/               # UI components (shadcn/ui)
│   └── ...               # Feature components
├── hooks/                # Custom React hooks
├── lib/                  # Utility libraries
│   ├── logger.ts         # Logging utility
│   ├── translations.ts   # i18n translations
│   └── utils.ts          # Helper functions
├── contexts/             # React contexts
├── services/             # Service layer
├── types/                # TypeScript type definitions
└── public/               # Static assets
```

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [Radix UI](https://www.radix-ui.com/)
- **State Management**: [React Query (TanStack Query)](https://tanstack.com/query)
- **Forms**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **Backend**: Google Sheets API, Google Drive API
- **Notifications**: Web Push API

## 📝 Available Scripts

```bash
# Development
npm run dev          # Start development server

# Production
npm run build        # Build for production
npm start            # Start production server

# Code Quality
npm run lint         # Run ESLint
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
```

## 🔐 Security

- **Environment Variables**: Never commit `.env` or `.env.local` files
- **Service Account**: Use Google Service Account with minimal required permissions
- **VAPID Keys**: Keep VAPID private key secure
- **HTTPS**: Always use HTTPS in production for Web Push to work

## 📦 Deployment

### Docker Deployment

1. **Build Docker image**
   ```bash
   docker build -t bbs-app .
   ```

2. **Run container**
   ```bash
   docker run -p 3000:3000 --env-file .env.local bbs-app
   ```

### Vercel Deployment

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm test -- --coverage
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is proprietary software. All rights reserved.

## 👥 Team

- **Development Team**: ITH Development Team
- **Contact**: [your-email@example.com]

## 🐛 Known Issues

- React Strict Mode may cause double renders in development
- Some console warnings from third-party libraries

## 📚 Additional Documentation

- [API Documentation](./docs/API.md) - API endpoints and usage
- [Component Guide](./docs/COMPONENTS.md) - Component documentation
- [Deployment Guide](./docs/DEPLOYMENT.md) - Detailed deployment instructions

---

Made with ❤️ by ITH Team
