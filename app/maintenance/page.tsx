"use client";

import { useEffect, useState, useCallback } from "react";
import { apiFetch } from "@/lib/api-fetch";
import { useRouter } from "next/navigation";

interface MaintenanceData {
  isActive: boolean;
  startTime?: string;
  endTime?: string;
  message?: string;
}

function formatThaiDateTime(iso?: string) {
  console.log("iso", iso);
  if (!iso) return "-";
  return new Date(iso).toLocaleString("th-TH", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MaintenancePage() {
  const router = useRouter();
  const [data, setData] = useState<MaintenanceData>({ isActive: true });
  const [timeLeft, setTimeLeft] = useState<string>("");

  const checkStatus = useCallback(async () => {
    try {
      const res = await apiFetch("/api/maintenance-status");
      if (!res.ok) return;
      const json: MaintenanceData = await res.json();
      setData(json);
      if (!json.isActive) {
        router.push("/");
      }
    } catch {
      // keep showing page if check fails
    }
  }, [router]);

  // Poll every 30 seconds
  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 30_000);
    return () => clearInterval(interval);
  }, [checkStatus]);

  // Countdown timer
  useEffect(() => {
    if (!data.endTime) return;

    const tick = () => {
      const diff = new Date(data.endTime!).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft("กำลังตรวจสอบ...");
        checkStatus();
        return;
      }
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1_000);
      setTimeLeft(
        `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`,
      );
    };

    tick();
    const timer = setInterval(tick, 1_000);
    return () => clearInterval(timer);
  }, [data.endTime, checkStatus]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden">
        {/* Top bar */}
        <div className="h-1.5 bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400" />

        <div className="p-8 text-center">
          {/* Icon */}
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg
              className="w-10 h-10 text-orange-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            ปิดปรับปรุงระบบชั่วคราว
          </h1>
          <p className="text-gray-500 text-sm leading-relaxed mb-6">
            {data.message ||
              "ขณะนี้ระบบกำลังอยู่ระหว่างการปรับปรุง กรุณาลองใหม่อีกครั้งในภายหลัง"}
          </p>

          {/* Time info */}
          {(data.startTime || data.endTime) && (
            <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 mb-5 text-sm space-y-2 text-left">
              {data.startTime && (
                <div className="flex justify-between gap-4">
                  <span className="text-gray-400 shrink-0">เริ่มต้น</span>
                  <span className="font-medium text-gray-700 text-right">
                    {formatThaiDateTime(data.startTime)}
                  </span>
                </div>
              )}
              {data.endTime && (
                <div className="flex justify-between gap-4">
                  <span className="text-gray-400 shrink-0">สิ้นสุด</span>
                  <span className="font-medium text-gray-700 text-right">
                    {formatThaiDateTime(data.endTime)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Countdown */}
          {data.endTime && timeLeft && (
            <div className="mb-6">
              <p className="text-xs text-gray-400 mb-1">เวลาที่เหลือ</p>
              <p className="text-4xl font-mono font-bold text-orange-500 tracking-widest">
                {timeLeft}
              </p>
            </div>
          )}

          {/* Status indicator */}
          <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
            <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
            <span>ระบบจะกลับมาใช้งานได้โดยอัตโนมัติ</span>
          </div>
        </div>
      </div>
    </div>
  );
}
