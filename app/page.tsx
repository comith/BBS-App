"use client";
import React, { useState, useCallback, useMemo, useEffect } from "react";
import { SquareUser, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
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
    <circle cx="150" cy="120" r="60" fill="rgba(255,255,255,0.1)" />
    <circle cx="650" cy="80" r="40" fill="rgba(255,255,255,0.08)" />
    <circle cx="100" cy="450" r="25" fill="rgba(255,255,255,0.12)" />
    <circle cx="700" cy="500" r="35" fill="rgba(255,255,255,0.1)" />
    <circle cx="400" cy="350" r="15" fill="rgba(255,255,255,0.15)" />
    <circle cx="200" cy="300" r="20" fill="rgba(255,255,255,0.1)" />
    <circle cx="300" cy="150" r="5" fill="rgba(255,255,255,0.2)" />
    <circle cx="500" cy="200" r="3" fill="rgba(255,255,255,0.25)" />
    <circle cx="600" cy="300" r="4" fill="rgba(255,255,255,0.2)" />
    <circle cx="150" cy="350" r="6" fill="rgba(255,255,255,0.18)" />
    <circle cx="750" cy="200" r="4" fill="rgba(255,255,255,0.22)" />
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
    const createURLParams = useCallback(
      (path: string) => {
        const params = new URLSearchParams({
          employeeId: formData.employeerId,
          fullName: formData.fullName,
          department: formData.department,
          group: formData.group,
        });
        return `${path}?${params.toString()}`;
      },
      [formData]
    );

    const handleFormClick = useCallback(() => {
      router.push(createURLParams("/form"));
    }, [router, createURLParams]);

    const handleReportClick = useCallback(() => {
      router.push(createURLParams("/employeer"));
    }, [router, createURLParams]);

    const handleDashboardClick = useCallback(() => {
      router.push(createURLParams("/dashboard"));
    }, [router, createURLParams]);

    if (formData.position === "SHE") {
      return (
        <div className="flex flex-row gap-4 w-full max-w-md pb-4">
          <div
            className="bg-white flex flex-col justify-center rounded-2xl shadow-xl p-4 w-1/2 hover:scale-105 transition-transform duration-200 hover:cursor-pointer"
            onClick={handleFormClick}
          >
            <img
              src="/img/formicon.png"
              alt="Form Icon"
              className="w-auto h-32 m-auto"
            />
            <h2 className="text-lg text-center font-bold text-gray-900 mb-2">
              บันทึกรายงานพฤติกรรม
            </h2>
          </div>
          <div
            className="bg-white rounded-2xl shadow-xl p-4 w-1/2 hover:scale-105 transition-transform duration-200 hover:cursor-pointer"
            onClick={handleDashboardClick}
          >
            <img
              src="/img/report_icon.png"
              alt="Report Icon"
              className="w-auto h-32 m-auto"
            />
            <h2 className="text-lg text-center font-bold text-gray-900 mb-2">
              สรุปผลรายงานพฤติกรรม
            </h2>
          </div>
        </div>
      );
    }

    if (formData.position !== "SHE" && formData.position !== "") {
      return (
        <div className="flex flex-row gap-4 w-full max-w-md pb-4">
          <div
            className="bg-white flex flex-col justify-center rounded-2xl shadow-xl p-4 w-1/2 hover:scale-105 transition-transform duration-200 hover:cursor-pointer"
            onClick={handleFormClick}
          >
            <img
              src="/img/formicon.png"
              alt="Form Icon"
              className="w-auto h-32 m-auto"
            />
            <h2 className="text-lg text-center font-bold text-gray-900 mb-2">
              บันทึกรายงานพฤติกรรม
            </h2>
          </div>
          <div
            className="bg-white rounded-2xl shadow-xl p-4 w-1/2 hover:scale-105 transition-transform duration-200 hover:cursor-pointer"
            onClick={handleReportClick}
          >
            <img
              src="/img/report_icon.png"
              alt="Report Icon"
              className="w-auto h-32 m-auto"
            />
            <h2 className="text-lg text-center font-bold text-gray-900 mb-2">
              สรุปผลรายงานพฤติกรรม
            </h2>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-row gap-4 w-full max-w-md pb-4">
        <div
          className="bg-white flex flex-col justify-center rounded-2xl shadow-xl p-4 w-1/2 hover:scale-105 transition-transform duration-200 hover:cursor-pointer"
          onClick={handleFormClick}
        >
          <img
            src="/img/formicon.png"
            alt="Form Icon"
            className="w-auto h-32 m-auto"
          />
          <h2 className="text-lg text-center font-bold text-gray-900 mb-2">
            บันทึกรายงานพฤติกรรม
          </h2>
        </div>
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

const RequiredMark = React.memo(() => <sup className="text-red-500">*</sup>);
RequiredMark.displayName = "RequiredMark";

function ModernBBSLogin() {
  const router = useRouter();
  const [employeeIdFromUrl, setEmployeeIdFromUrl] = useState("");

  // ✅ ใช้ React Query hooks
  const { data: employees, isLoading, error, refetch } = useEmployeeData();

  const [formData, setFormData] = useState<FormData>({
    employeerId: employeeIdFromUrl,
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
        setFormData((prev) => ({
          ...prev,
          fullName: employee.fullName,
          department: String(employee.department),
          group: employee.group || "",
          position: employee.position || "",
        }));
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

  // ✅ Auto-fill จาก URL parameter
  useEffect(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const employeeId = searchParams.get("employeeId") || "";
      setEmployeeIdFromUrl(employeeId);

      if (employeeId && employees) {
        findEmployeeData(employeeIdFromUrl);
      }
    }
  }, [employeeIdFromUrl, employees, findEmployeeData]);

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
      {/* Left side - Abstract Design */}
      <div className="w-full xl:w-1/2 relative overflow-hidden hidden xl:block">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "url('/img/bg_login.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0">
          <BackgroundSVG />
        </div>
        <div className="relative z-10 flex flex-col justify-between h-[100vh] p-8">
          <div className="flex flex-row gap-3">
            <img
              src="/img/ith.png"
              alt="Logo"
              className="w-32 h-32 translate-y-[-5px]"
            />
            <div className="flex flex-col">
              <div className="flex flex-row gap-3">
                <span className="text-orange-400 text-[40px] text-shadow-2xs font-medium tracking-wider">
                  Behavior
                </span>
                <span className="text-blue-600 text-[40px] text-shadow-2xs font-medium tracking-wider">
                  Base
                </span>
                <span className="text-blue-600 text-[40px] text-shadow-2xs font-medium tracking-wider">
                  Safety
                </span>
              </div>
              <span className="text-slate-400 text-[26px] text-shadow-2xs font-medium tracking-wider">
                ความปลอดภัย เริ่มต้นที่พฤติกรรม
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side */}
      <div className="w-full xl:w-1/2 flex items-center justify-center bg-gray-50 py-4 overflow-auto">
        <div className="w-full mx-8 flex gap-4 flex-col">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Behavior Base Safety (BBS)
              </h2>
              คือการจัดการพฤติกรรมเสี่ยง{" "}
              <b className="text-orange-500">เพื่อสร้างพฤติกรรมที่ปลอดภัย </b>
              โดยไม่ต้องการให้พนักงานได้รับบาดเจ็บเพื่อปรับเปลี่ยนพฤติกรรมเสี่ยงให้เป็นพฤติกรรมที่ปลอดภัย
              ซึ่งอาศัยความร่วมมือของพนักงานทุกคน จนเกิดเป็น{" "}
              <b className="text-orange-500">วัฒนธรรมความปลอดภัยในองค์กร</b>
              <br />
              <br />
              <b className="text-orange-500 text-[18px] md:text-[17px]">
                BBS ทำอะไร?
              </b>
              <div className="pl-4 gap-2 flex flex-col mt-2">
                <li>
                  <b className="text-orange-500 text-[18px]">
                    เน้นพฤติกรรม BBS
                  </b>{" "}
                  ไม่ได้รอให้เกิดอุบัติเหตุแล้วค่อยมาแก้ไข
                  แต่จะเข้าไปสังเกตและปรับเปลี่ยนพฤติกรรมที่เสี่ยงต่อการเกิดอุบัติเหตุตั้งแต่เนิ่นๆ
                </li>
                <li>
                  <b className="text-orange-500 text-[18px] md:text-[17px]">
                    ทุกคนมีส่วนร่วม
                  </b>{" "}
                  ทุกคนในองค์กร ไม่ว่าจะเป็นพนักงาน ผู้จัดการ หรือเจ้าของกิจการ
                  ต่างมีส่วนร่วมในการสังเกตและปรับปรุงพฤติกรรมของตนเองและผู้อื่น
                </li>
                <li>
                  <b className="text-orange-500 text-[18px] md:text-[17px]">
                    วัดผลได้
                  </b>{" "}
                  BBS มีวิธีการวัดผลที่ชัดเจน
                  ทำให้เราสามารถเห็นผลลัพธ์และปรับปรุงแนวทางได้อย่างต่อเนื่อง
                </li>
              </div>
            </div>
          </div>

          {/* Input section */}
          <div className="bg-white rounded-2xl shadow-xl p-4 w-full mb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <SquareUser className="w-6 h-6 text-gray-500 mr-2" />
                <span className="text-gray-700 font-medium">
                  กรอกรหัสพนักงานเพื่อเริ่มใช้งาน <RequiredMark />
                </span>
              </div>
              <RefreshButton />
            </div>
            <input
              type="text"
              name="employeerId"
              value={formData.employeerId}
              onChange={handleInputChange}
              placeholder="กรอกรหัสพนักงาน เช่น 5LD01234"
              className="w-full px-4 py-4 border-l-4 border-blue-500 bg-gray-50 rounded-lg focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 placeholder-gray-500"
            />
          </div>

          {/* Menu buttons - only show when employeerId is valid */}
          {formData.employeerId.length >= 8 && (
            <MenuButtons formData={formData} router={router} />
          )}
        </div>
      </div>
    </div>
  );
}

export default ModernBBSLogin;
