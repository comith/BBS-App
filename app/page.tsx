// app/page.tsx
"use client";
import React, { useState, useCallback, useMemo, useEffect } from "react";
import { SquareUser, RefreshCw, Shield, Users, BarChart3 } from "lucide-react";

import { useRouter } from "next/navigation";
import Image from "next/image";
import NotificationToggleButton from "@/components/NotificationToggleButton";
import {
  useEmployeeData,
  useRefreshEmployeeData,
} from "@/hooks/useEmployeeData";

interface FormData {
  employeerId: string;
  fullName: string;
  department: string;
  group: string;
  position: string;
}

// LocalStorage utility functions
const STORAGE_KEY = "bbs_employee_data";

const saveToLocalStorage = (data: FormData) => {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error saving to localStorage:", error);
    }
  }
};

const loadFromLocalStorage = (): FormData | null => {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error loading from localStorage:", error);
      return null;
    }
  }
  return null;
};

const clearLocalStorage = () => {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error clearing localStorage:", error);
    }
  }
};

// Refresh Button Component
const RefreshButton = React.memo(() => {
  const { refresh } = useRefreshEmployeeData();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <button
      onClick={handleRefresh}
      disabled={isRefreshing}
      className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 disabled:opacity-50 transition-colors"
    >
      <RefreshCw className={`w-3 h-3 ${isRefreshing ? "animate-spin" : ""}`} />
      {isRefreshing ? "กำลังอัพเดท..." : "รีเฟรชข้อมูล"}
    </button>
  );
});

RefreshButton.displayName = "RefreshButton";

// BackgroundSVG Component
const BackgroundSVG = React.memo(() => (
  <svg
    className="absolute inset-0 w-full h-full"
    viewBox="0 0 800 600"
    preserveAspectRatio="xMidYMid slice"
  >
    <defs>
      <linearGradient id="waveGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop
          offset="0%"
          style={{ stopColor: "rgba(255,255,255,0.1)", stopOpacity: 1 }}
        />
        <stop
          offset="100%"
          style={{ stopColor: "rgba(255,255,255,0.05)", stopOpacity: 1 }}
        />
      </linearGradient>
      <linearGradient id="waveGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop
          offset="0%"
          style={{ stopColor: "rgba(255,255,255,0.08)", stopOpacity: 1 }}
        />
        <stop
          offset="100%"
          style={{ stopColor: "rgba(255,255,255,0.03)", stopOpacity: 1 }}
        />
      </linearGradient>
    </defs>
    <path
      d="M0,200 Q200,100 400,150 T800,120 L800,0 L0,0 Z"
      fill="url(#waveGrad1)"
    />
    <path
      d="M0,300 Q300,200 600,250 T800,230 L800,0 L0,0 Z"
      fill="url(#waveGrad2)"
    />
    <path
      d="M0,450 Q150,350 300,400 Q450,450 600,400 Q700,370 800,390 L800,600 L0,600 Z"
      fill="url(#waveGrad1)"
    />
    <circle
      cx="150"
      cy="120"
      r="60"
      fill="rgba(255,255,255,0.1)"
      className="animate-pulse"
      style={{ animationDuration: "4s" }}
    />
    <circle
      cx="650"
      cy="80"
      r="40"
      fill="rgba(255,255,255,0.08)"
      className="animate-pulse"
      style={{ animationDuration: "6s" }}
    />
    <circle cx="100" cy="450" r="25" fill="rgba(255,255,255,0.12)" />
    <circle
      cx="700"
      cy="500"
      r="35"
      fill="rgba(255,255,255,0.1)"
      className="animate-pulse"
      style={{ animationDuration: "5s" }}
    />
    <circle cx="400" cy="350" r="15" fill="rgba(255,255,255,0.15)" />
    <circle cx="200" cy="300" r="20" fill="rgba(255,255,255,0.1)" />
    <circle
      cx="300"
      cy="150"
      r="5"
      fill="rgba(255,255,255,0.2)"
      className="animate-bounce"
      style={{ animationDuration: "3s" }}
    />
    <circle cx="500" cy="200" r="3" fill="rgba(255,255,255,0.25)" />
    <circle
      cx="600"
      cy="300"
      r="4"
      fill="rgba(255,255,255,0.2)"
      className="animate-ping"
      style={{ animationDuration: "3s" }}
    />
    <circle cx="150" cy="350" r="6" fill="rgba(255,255,255,0.18)" />
    <circle
      cx="750"
      cy="200"
      r="4"
      fill="rgba(255,255,255,0.22)"
      className="animate-pulse"
      style={{ animationDuration: "2s" }}
    />
  </svg>
));

BackgroundSVG.displayName = "BackgroundSVG";

// Menu Buttons Component
const MenuButtons = React.memo(
  ({
    formData,
    router,
  }: {
    formData: FormData;
    router: ReturnType<typeof useRouter>;
  }) => {
    const handleFormClick = useCallback(() => {
      saveToLocalStorage(formData);
      router.push("/form");
    }, [router, formData]);

    const handleReportClick = useCallback(() => {
      saveToLocalStorage(formData);
      router.push("/employeer");
    }, [router, formData]);

    const handleDashboardClick = useCallback(() => {
      saveToLocalStorage(formData);
      router.push("/dashboard");
    }, [router, formData]);

    const buttonClass =
      "bg-white/80 backdrop-blur-md flex flex-col justify-center rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 p-6 w-full hover:-translate-y-2 hover:shadow-[0_20px_40px_rgb(0,0,0,0.1)] hover:border-blue-200/50 hover:bg-white transition-all duration-500 cursor-pointer group relative overflow-hidden";
    const imageWrapperClass =
      "relative w-24 h-24 mx-auto mb-5 transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 drop-shadow-xl";

    if (formData.position === "SHE") {
      return (
        <div className="grid grid-cols-2 gap-6 w-full max-w-xl pb-4 md:grid-cols-3">
          <button
            type="button"
            className={buttonClass}
            onClick={handleFormClick}
          >
            <div className={imageWrapperClass}>
              <Image
                src="/img/formicon.png"
                alt="Form Icon"
                fill
                className="object-contain"
                sizes="96px"
              />
            </div>
            <h2 className="text-base text-center font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
              บันทึกรายงาน
            </h2>
          </button>
          <button
            type="button"
            className={buttonClass}
            onClick={handleDashboardClick}
          >
            <div className={imageWrapperClass}>
              <Image
                src="/img/report_icon.png"
                alt="Report Icon"
                fill
                className="object-contain"
                sizes="96px"
              />
            </div>
            <h2 className="text-base text-center font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
              สรุปภาพรวม (All)
            </h2>
          </button>
          <button
            type="button"
            className={buttonClass}
            onClick={handleReportClick}
          >
            <div className={imageWrapperClass}>
              <Image
                src="/img/people_report.png"
                alt="Report Icon"
                fill
                className="object-contain"
                sizes="96px"
              />
            </div>
            <h2 className="text-base text-center font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
              รายงานของคุณ
            </h2>
          </button>
        </div>
      );
    }

    if (formData.position === "AC" || formData.position === "Manager") {
      return (
        <div className="flex flex-row gap-6 w-full max-w-lg pb-4">
          <button
            type="button"
            className={`${buttonClass} w-1/2`}
            onClick={handleFormClick}
          >
            <div className={imageWrapperClass}>
              <Image
                src="/img/formicon.png"
                alt="Form Icon"
                fill
                className="object-contain"
                sizes="96px"
              />
            </div>
            <h2 className="text-base text-center font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
              บันทึกรายงาน
            </h2>
          </button>
          <button
            type="button"
            className={`${buttonClass} w-1/2`}
            onClick={handleDashboardClick}
          >
            <div className={imageWrapperClass}>
              <Image
                src="/img/people_report.png"
                alt="Report Icon"
                fill
                className="object-contain"
                sizes="96px"
              />
            </div>
            <h2 className="text-base text-center font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
              สรุปผลรายงาน
            </h2>
          </button>
        </div>
      );
    }

    return (
      <div className="flex flex-row gap-6 w-full max-w-lg pb-4">
        <button
          type="button"
          className={`${buttonClass} w-1/2`}
          onClick={handleFormClick}
        >
          <div className={imageWrapperClass}>
            <Image
              src="/img/formicon.png"
              alt="Form Icon"
              fill
              className="object-contain"
              sizes="96px"
            />
          </div>
          <h2 className="text-base text-center font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
            บันทึกรายงาน
          </h2>
        </button>
        <button
          type="button"
          className={`${buttonClass} w-1/2`}
          onClick={handleReportClick}
        >
          <div className={imageWrapperClass}>
            <Image
              src="/img/people_report.png"
              alt="Report Icon"
              fill
              className="object-contain"
              sizes="96px"
            />
          </div>
          <h2 className="text-base text-center font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
            สรุปผลรายงาน
          </h2>
        </button>
      </div>
    );
  }
);

MenuButtons.displayName = "MenuButtons";

// Loading component
const LoadingScreen = React.memo(() => (
  <div className="flex items-center justify-center h-screen">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
      <h1 className="text-2xl font-bold text-gray-900 mb-4">กำลังโหลด...</h1>
      <p className="text-gray-600">กรุณารอสักครู่...</p>
    </div>
  </div>
));

LoadingScreen.displayName = "LoadingScreen";

// Error component
const ErrorScreen = React.memo(
  ({ error, onRetry }: { error: string; onRetry: () => void }) => (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center max-w-md">
        <div className="text-red-500 text-4xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          เกิดข้อผิดพลาด
        </h1>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={onRetry}
          className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg transition-colors"
        >
          ลองใหม่อีกครั้ง
        </button>
      </div>
    </div>
  )
);

ErrorScreen.displayName = "ErrorScreen";

// Clear Data Button Component
const ClearDataButton = React.memo(() => {
  const [isClearing, setIsClearing] = useState(false);

  const handleClear = useCallback(() => {
    setIsClearing(true);
    clearLocalStorage();
    setTimeout(() => {
      setIsClearing(false);
      window.location.reload(); // Refresh page to clear form
    }, 500);
  }, []);

  return (
    <button
      onClick={handleClear}
      disabled={isClearing}
      className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 disabled:opacity-50 transition-colors"
    >
      {isClearing ? "กำลังล้างข้อมูล..." : "ล้างข้อมูลที่บันทึก"}
    </button>
  );
});

ClearDataButton.displayName = "ClearDataButton";

const RequiredMark = React.memo(() => <sup className="text-red-500">*</sup>);
RequiredMark.displayName = "RequiredMark";

// #############################   Main Component  ######################

function ModernBBSLogin() {
  const router = useRouter();

  // ✅ ใช้ React Query hooks
  const { data: employees, isLoading, error, refetch } = useEmployeeData();
  const [formData, setFormData] = useState<FormData>({
    employeerId: "",
    fullName: "",
    department: "",
    group: "",
    position: "",
  });

  // ✅ ใช้ employees จาก React Query แทน employeeData
  const employeeMap = useMemo(() => {
    return new Map(employees?.map((emp) => [emp.employeerId, emp]) || []);
  }, [employees]);

  // ✅ แก้ไข findEmployeeData ให้ใช้ employeeMap ที่ถูกต้อง
  const findEmployeeData = useCallback(
    (id: string) => {
      const employee = employeeMap.get(id);
      if (employee) {
        const newFormData = {
          employeerId: id,
          fullName: employee.fullName,
          department: String(employee.department),
          group: employee.group || "",
          position: employee.position || "",
        };
        saveToLocalStorage(newFormData);
        setFormData(newFormData);
        // Auto save to localStorage when employee found
      } else {
        setFormData((prev) => ({
          ...prev,
          fullName: "",
          department: "",
          group: "",
          position: "",
        }));
      }
    },
    [employeeMap]
  );

  // Handle input change
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;

      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));

      if (name === "employeerId") {
        if (value.length >= 8) {
          findEmployeeData(value);
        } else {
          setFormData((prev) => ({
            ...prev,
            fullName: "",
            department: "",
            group: "",
            position: "",
          }));
        }
      }
    },
    [findEmployeeData]
  );

  // ✅ Load data from localStorage on component mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      // โหลดข้อมูลจาก localStorage เท่านั้น
      const storedData = loadFromLocalStorage();
      if (storedData?.employeerId) {
        setFormData(storedData);
        // Verify employee still exists in current data
        if (employees) {
          findEmployeeData(storedData.employeerId);
        }
      }
    }
  }, [employees, findEmployeeData]);

  // ✅ แสดง Loading Screen จาก React Query
  if (isLoading) {
    return <LoadingScreen />;
  }

  // ✅ แสดง Error Screen จาก React Query
  if (error) {
    return <ErrorScreen error={error.message} onRetry={() => refetch()} />;
  }

  return (
    <div className="min-h-screen flex">
      {/* Notification Settings Button - มุมบนขวา */}
      <div className="fixed top-4 right-4 z-50">
        <NotificationToggleButton />
      </div>

      {/* Left side - Abstract Design */}
      <div className="w-full xl:w-1/2 relative overflow-hidden hidden xl:block group">
        <div className="absolute inset-0 bg-gray-900" />
        <Image
          src="/img/bg_login.png"
          alt="Background"
          fill
          priority
          className="object-cover w-full h-full opacity-60 group-hover:scale-105 transition-transform duration-[20s]"
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-transparent to-orange-900/30" />

        <div className="absolute inset-0">
          <BackgroundSVG />
        </div>

        <div className="relative z-10 flex flex-col justify-between h-[100vh] p-12">
          <div className="flex flex-col gap-8">
            {/* Logo Section with Glass Effect */}
            <div className="inline-flex items-center gap-6 p-6 rounded-3xl bg-white/10 backdrop-blur-md border border-white/10 shadow-2xl hover:bg-white/15 transition-all duration-300 w-fit animate-in fade-in slide-in-from-top-4 duration-700">
              <div className="relative w-24 h-24 drop-shadow-lg">
                <Image
                  src="/img/ith.png"
                  alt="Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <div className="h-16 w-px bg-white/20" /> {/* Divider */}
              <div className="flex flex-col justify-center">
                <h1 className="text-3xl font-black text-white tracking-wide uppercase drop-shadow-md">
                  ITH Group
                </h1>
                <p className="text-blue-200 font-medium tracking-wider text-sm">
                  Safety Management
                </p>
              </div>
            </div>

            {/* Main Typography */}
            <div className="mt-12 space-y-4">
              <div className="flex flex-col animate-in fade-in slide-in-from-left-4 duration-1000 delay-300">
                <span className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-orange-300 to-yellow-200 filter drop-shadow-sm tracking-tighter">
                  Behavior
                </span>
                <span className="text-7xl font-black text-white tracking-tighter drop-shadow-lg">
                  Based Safety
                </span>
              </div>

              <div className="h-2 w-32 bg-orange-500 rounded-full animate-in fade-in width-[0] hover:w-48 transition-all duration-500 delay-500" />

              <p className="text-2xl text-slate-200 font-light tracking-wide max-w-lg leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-700">
                ความปลอดภัย... เริ่มต้นที่
                <span className="font-semibold text-orange-400">
                  พฤติกรรมของคุณ
                </span>
              </p>
            </div>
          </div>

          {/* Footer / Quote */}
          <div className="bg-black/30 backdrop-blur-sm p-6 rounded-2xl border-l-4 border-orange-500 max-w-md animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-1000">
            <p className="text-white/90 italic font-light text-lg">
              "Safety is not just a rule, it's a value we live by every day."
            </p>
          </div>
        </div>
      </div>

      {/* Right side */}
      <div className="w-full xl:w-1/2 flex items-center justify-center bg-gray-50/50 py-4 overflow-auto backdrop-blur-sm">
        <div className="w-full max-w-3xl mx-auto px-6 flex flex-col gap-6">
          {/* Hero / Info Card */}
          <div className="bg-white/90 backdrop-blur-3xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 overflow-hidden relative group hover:shadow-[0_8px_30px_rgb(249,115,22,0.1)] transition-all duration-700">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-orange-400 via-pink-500 to-red-500" />

            {/* Ambient Background Effects */}
            <div className="absolute -right-24 -top-24 w-80 h-80 bg-orange-100/50 rounded-full blur-[100px] opacity-40 group-hover:opacity-60 transition-opacity duration-1000 pointer-events-none mix-blend-multiply" />
            <div className="absolute -left-20 -bottom-24 w-80 h-80 bg-blue-100/50 rounded-full blur-[100px] opacity-40 group-hover:opacity-60 transition-opacity duration-1000 pointer-events-none mix-blend-multiply" />

            <div className="p-8 relative z-10">
              <div className="mb-10 text-center md:text-left">
                <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full bg-gradient-to-r from-orange-50 to-orange-100/50 border border-orange-100 text-orange-700 text-xs font-bold tracking-wider uppercase shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                  Safety Intelligence
                </div>
                <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 mb-6 tracking-tight drop-shadow-sm">
                  BBS System
                </h2>
                <p className="text-xl text-gray-600 leading-relaxed font-light">
                  ยกระดับมาตรฐานความปลอดภัย
                  <br className="hidden md:block" />
                  ด้วย
                  <span className="font-bold relative inline-block mx-1">
                    <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600">
                      พฤติกรรมที่ยั่งยืน
                    </span>
                    <span className="absolute bottom-1 left-0 w-full h-2 bg-orange-100/50 -z-10 skew-x-12" />
                  </span>
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Modern Card 1 */}
                <div className="p-6 rounded-2xl bg-white/40 border border-white/80 shadow-sm hover:shadow-xl hover:shadow-orange-500/5 hover:-translate-y-2 transition-all duration-500 group/card relative overflow-hidden backdrop-blur-sm">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 to-white/0 opacity-0 group-hover/card:opacity-100 transition-opacity duration-500" />
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-white to-orange-50 flex items-center justify-center mb-5 text-orange-500 shadow-[0_4px_20px_rgb(249,115,22,0.15)] group-hover/card:scale-110 group-hover/card:rotate-3 transition-all duration-500 ring-1 ring-orange-100">
                      <Shield className="w-7 h-7" />
                    </div>
                    <h3 className="font-bold text-gray-800 mb-2 text-lg">
                      Prevention
                    </h3>
                    <p className="text-sm text-gray-500 leading-relaxed text-center font-medium">
                      จัดการความเสี่ยงเชิงรุก
                    </p>
                  </div>
                </div>

                {/* Modern Card 2 */}
                <div className="p-6 rounded-2xl bg-white/40 border border-white/80 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-2 transition-all duration-500 group/card relative overflow-hidden backdrop-blur-sm">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-white/0 opacity-0 group-hover/card:opacity-100 transition-opacity duration-500" />
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-white to-blue-50 flex items-center justify-center mb-5 text-blue-500 shadow-[0_4px_20px_rgb(59,130,246,0.15)] group-hover/card:scale-110 group-hover/card:-rotate-3 transition-all duration-500 ring-1 ring-blue-100">
                      <Users className="w-7 h-7" />
                    </div>
                    <h3 className="font-bold text-gray-800 mb-2 text-lg">
                      Engagement
                    </h3>
                    <p className="text-sm text-gray-500 leading-relaxed text-center font-medium">
                      พลังความร่วมมือทุกคน
                    </p>
                  </div>
                </div>

                {/* Modern Card 3 */}
                <div className="p-6 rounded-2xl bg-white/40 border border-white/80 shadow-sm hover:shadow-xl hover:shadow-green-500/5 hover:-translate-y-2 transition-all duration-500 group/card relative overflow-hidden backdrop-blur-sm">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-white/0 opacity-0 group-hover/card:opacity-100 transition-opacity duration-500" />
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-white to-green-50 flex items-center justify-center mb-5 text-green-500 shadow-[0_4px_20px_rgb(34,197,94,0.15)] group-hover/card:scale-110 group-hover/card:rotate-3 transition-all duration-500 ring-1 ring-green-100">
                      <BarChart3 className="w-7 h-7" />
                    </div>
                    <h3 className="font-bold text-gray-800 mb-2 text-lg">
                      Evaluation
                    </h3>
                    <p className="text-sm text-gray-500 leading-relaxed text-center font-medium">
                      วัดผลแม่นยำพัฒนาจริง
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Input Section */}
          <div className="bg-white/80 backdrop-blur-2xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 p-4 relative overflow-hidden hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-500">
            <div />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg text-blue-500">
                    <SquareUser className="w-6 h-6" />
                  </div>
                  <span className="text-gray-700 font-semibold text-lg">
                    เข้าสู่ระบบ <RequiredMark />
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <RefreshButton />
                </div>
              </div>

              <div className="relative group">
                <input
                  type="text"
                  name="employeerId"
                  value={formData.employeerId}
                  onChange={handleInputChange}
                  placeholder="กรอกรหัสพนักงาน (เช่น 5LD01234)"
                  className="w-full px-6 py-5 pl-6 text-lg bg-gray-50 rounded-2xl border-2 border-transparent focus:bg-white focus:border-blue-500 focus:shadow-lg focus:shadow-blue-500/10 outline-none transition-all duration-300 placeholder-gray-400 font-medium text-gray-800 tracking-wide"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none group-focus-within:text-blue-500 transition-colors">
                  ➔
                </div>
              </div>

              {/* Verified User Badge */}
              {formData.fullName && (
                <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold text-lg shadow-sm">
                    ✓
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 text-sm">
                      {formData.fullName}
                    </p>
                    <p className="text-xs text-gray-500 flex items-center gap-2">
                      <span className="bg-white px-2 py-0.5 rounded text-xs border border-green-200">
                        {formData.department}
                      </span>
                      <span>•</span>
                      <span>{formData.group}</span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Menu Buttons */}
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {formData.employeerId.length >= 8 && formData.fullName && (
              <MenuButtons formData={formData} router={router} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ModernBBSLogin;
