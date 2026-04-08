"use client";

import { useState, useEffect, lazy, Suspense } from "react";

const AdminDashboard = lazy(() => import("./DashboardClient"));

const LoadingScreen = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-gray-500">กำลังโหลด...</div>
  </div>
);

export default function DashboardLoader() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <LoadingScreen />;

  return (
    <Suspense fallback={<LoadingScreen />}>
      <AdminDashboard />
    </Suspense>
  );
}
