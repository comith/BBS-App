"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiFetch } from "@/lib/api-fetch";
import { startOfDay } from "date-fns";
import {
  type Report,
  transformApiDataToDashboardReport,
} from "../types";

interface EmployeeInfo {
  employeeId: string;
  employeeName: string;
  department: string;
  group: string;
  [key: string]: any;
}

interface StaticData {
  categories: any[];
  subCategories: any[];
}

export interface ReportsState {
  reports: Report[];
  setReports: React.Dispatch<React.SetStateAction<Report[]>>;
  isLoading: boolean;
  isBackgroundLoading: boolean;
  error: string | null;
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  fetchReports: () => Promise<void>;
  employeeList: EmployeeInfo[];
  departmentList: string[];
  topDepartments: [string, number][];
  stats: ReportStats;
}

export interface ReportStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  highPriority: number;
  totalSafeActions: number;
  totalUnsafeActions: number;
  todayReports: number;
  ppe: number;
  ppe_safe: number;
  ppe_unsafe: number;
  tools: number;
  tools_safe: number;
  tools_unsafe: number;
  unsafe_actions: number;
  unsafe_actions_safe: number;
  unsafe_actions_unsafe: number;
  unsafe_condition: number;
  unsafe_condition_safe: number;
  unsafe_condition_unsafe: number;
}

export function useReports(sessionLoaded: boolean): ReportsState {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isBackgroundLoading, setIsBackgroundLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [employeeList, setEmployeeList] = useState<EmployeeInfo[]>([]);

  const staticDataRef = useRef<StaticData | null>(null);

  const fetchReports = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch page 1 (50 items) first for instant render
      const params = new URLSearchParams({
        type: "record",
        year: selectedYear.toString(),
        page: "1",
        limit: "50",
      });

      const cached = staticDataRef.current;

      const fetchPromises: Promise<Response>[] = [
        apiFetch(`/api/get?${params.toString()}`),
        ...(cached
          ? []
          : [
              apiFetch("/api/get?type=category"),
              apiFetch("/api/get?type=subcategory"),
              apiFetch("/api/get?type=employee"),
            ]),
      ];

      const [recordResponse, ...staticResponses] = await Promise.all(
        fetchPromises
      );

      if (!recordResponse.ok) {
        const err = new Error("server") as Error & { status: number };
        err.status = recordResponse.status;
        throw err;
      }

      let categoryData: any[];
      let subCategoryData: any[];

      if (cached) {
        categoryData = cached.categories;
        subCategoryData = cached.subCategories;
      } else {
        const [catData, subCatData, empData] = await Promise.all(
          staticResponses.map((r) => r.json())
        );
        categoryData = catData;
        subCategoryData = subCatData;
        staticDataRef.current = {
          categories: catData,
          subCategories: subCatData,
        };
        setEmployeeList(
          Array.isArray(empData)
            ? empData.map((emp: any) => ({
                ...emp,
                employeeId: emp.employeerId || emp.employeeId || "",
                employeeName: emp.fullName || emp.employeeName || "",
              }))
            : []
        );
      }

      const apiData = await recordResponse.json();
      setReports(
        transformApiDataToDashboardReport(
          apiData ?? [],
          categoryData,
          subCategoryData
        )
      );
      setIsLoading(false); // Done loading page 1!

      // Now fetch all records of the year in the background
      setIsBackgroundLoading(true);
      const bgParams = new URLSearchParams({
        type: "record",
        year: selectedYear.toString(),
      });

      apiFetch(`/api/get?${bgParams.toString()}`)
        .then((res) => {
          if (!res.ok) throw new Error("Background fetch failed");
          return res.json();
        })
        .then((bgData) => {
          setReports(
            transformApiDataToDashboardReport(
              bgData ?? [],
              categoryData,
              subCategoryData
            )
          );
        })
        .catch((err) => {
          console.warn("Background fetch warning:", err);
        })
        .finally(() => {
          setIsBackgroundLoading(false);
        });

    } catch (err) {
      console.error("Error fetching reports:", err);
      if (err instanceof TypeError) {
        setError("CONNECTION_FAILED");
      } else if (err instanceof Error && (err as any).status >= 500) {
        setError("DB_ERROR");
      } else {
        setError("ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่");
      }
      setIsLoading(false);
    }
  }, [selectedYear]);

  // Initial load — once session is ready
  useEffect(() => {
    if (sessionLoaded) {
      fetchReports();
    }
    // Only on session load; selectedYear changes handled by next effect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionLoaded]);

  // Re-fetch on year change (skip first run)
  const isFirstYearRun = useRef(true);
  useEffect(() => {
    if (isFirstYearRun.current) {
      isFirstYearRun.current = false;
      return;
    }
    fetchReports();
  }, [selectedYear, fetchReports]);

  // Auto-refresh on service worker message
  const playNotificationSound = useCallback(() => {
    try {
      const audio = new Audio("/sounds/alert.mp3");
      audio.play().catch((e) => {
        console.warn("Sound playback blocked or failed:", e);
      });
    } catch (e) {
      console.error("Error playing sound:", e);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !navigator.serviceWorker) return;
    const handler = (event: MessageEvent) => {
      if (event.data?.type === "REFRESH_REPORTS") {
        playNotificationSound();
        fetchReports();
      }
    };
    navigator.serviceWorker.addEventListener("message", handler);
    return () =>
      navigator.serviceWorker.removeEventListener("message", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const departmentList = useMemo(
    () => [...new Set(reports.map((r) => r.department))].sort(),
    [reports]
  );

  const topDepartments = useMemo<[string, number][]>(() => {
    const counts = new Map<string, number>();
    for (const r of reports) {
      counts.set(r.department, (counts.get(r.department) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [reports]);

  const stats = useMemo<ReportStats>(() => {
    const todayStart = startOfDay(new Date()).getTime();
    let pending = 0,
      approved = 0,
      rejected = 0,
      highPriority = 0;
    let totalSafeActions = 0,
      totalUnsafeActions = 0,
      todayReports = 0;
    let ppe = 0,
      ppe_safe = 0,
      ppe_unsafe = 0;
    let tools = 0,
      tools_safe = 0,
      tools_unsafe = 0;
    let unsafe_actions = 0,
      unsafe_actions_safe = 0,
      unsafe_actions_unsafe = 0;
    let unsafe_condition = 0,
      unsafe_condition_safe = 0,
      unsafe_condition_unsafe = 0;

    for (const r of reports) {
      if (r.status === "pending") pending++;
      else if (r.status === "approved") approved++;
      else if (r.status === "rejected") rejected++;

      if (r.priority === "high" && r.status === "pending") highPriority++;
      totalSafeActions += r.safeCount;
      totalUnsafeActions += r.unsafeCount;
      if (startOfDay(r.submittedDate).getTime() === todayStart) todayReports++;

      if (r.status === "approved") {
        const cat = r.safetyCategory;
        if (cat === "การสวมใส่อุปกรณ์คุ้มครองส่วนบุคคล PPE") {
          ppe++;
          ppe_safe += r.safeCount;
          ppe_unsafe += r.unsafeCount;
        } else if (
          cat ===
          "การใช้อุปกรณ์ เครื่องมือ เครื่องจักร และยานพาหนะต่างๆ ในการทำงาน Tool / Equipment / Machine / Vehicle"
        ) {
          tools++;
          tools_safe += r.safeCount;
          tools_unsafe += r.unsafeCount;
        } else if (
          cat ===
          "การกระทำที่ไม่ปลอดภัย และการจับชิ้นส่วน Unsafe Action / Driving / Line of fire"
        ) {
          unsafe_actions++;
          unsafe_actions_safe += r.safeCount;
          unsafe_actions_unsafe += r.unsafeCount;
        } else if (
          cat === "สภาพแวดล้อมที่ไม่ปลอดภัย Plant / Unsafe Condition (UC)"
        ) {
          unsafe_condition++;
          unsafe_condition_safe += r.safeCount;
          unsafe_condition_unsafe += r.unsafeCount;
        }
      }
    }

    return {
      total: reports.length,
      pending,
      approved,
      rejected,
      highPriority,
      totalSafeActions,
      totalUnsafeActions,
      todayReports,
      ppe,
      ppe_safe,
      ppe_unsafe,
      tools,
      tools_safe,
      tools_unsafe,
      unsafe_actions,
      unsafe_actions_safe,
      unsafe_actions_unsafe,
      unsafe_condition,
      unsafe_condition_safe,
      unsafe_condition_unsafe,
    };
  }, [reports]);

  return {
    reports,
    setReports,
    isLoading,
    isBackgroundLoading,
    error,
    selectedYear,
    setSelectedYear,
    fetchReports,
    employeeList,
    departmentList,
    topDepartments,
    stats,
  };
}

export type { EmployeeInfo };
