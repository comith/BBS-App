"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MAINTENANCE_ADMIN } from "./useEmployeeSession";

export interface MaintenanceSetting {
  isActive: boolean;
  startTime: string;
  endTime: string;
  message: string;
}

interface SaveMessage {
  type: "success" | "error";
  text: string;
}

const toDatetimeLocal = (iso?: string | null) => {
  if (!iso) return "";
  return new Date(iso).toISOString().slice(0, 16);
};

export interface MaintenanceState {
  maintenanceSetting: MaintenanceSetting;
  setMaintenanceSetting: React.Dispatch<
    React.SetStateAction<MaintenanceSetting>
  >;
  isSaving: boolean;
  saveMsg: SaveMessage | null;
  save: () => Promise<void>;
}

export function useMaintenance(isMaintenanceAdmin: boolean): MaintenanceState {
  const [maintenanceSetting, setMaintenanceSetting] =
    useState<MaintenanceSetting>({
      isActive: false,
      startTime: "",
      endTime: "",
      message: "",
    });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<SaveMessage | null>(null);
  const saveMsgTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchSetting = useCallback(async () => {
    if (!isMaintenanceAdmin) return;
    try {
      const res = await fetch("/api/maintenance", {
        headers: { "x-employee-id": MAINTENANCE_ADMIN },
      });
      if (res.ok) {
        const data = await res.json();
        setMaintenanceSetting({
          isActive: data.isActive ?? false,
          startTime: toDatetimeLocal(data.startTime),
          endTime: toDatetimeLocal(data.endTime),
          message: data.message ?? "",
        });
      }
    } catch {
      // silently ignore
    }
  }, [isMaintenanceAdmin]);

  useEffect(() => {
    if (isMaintenanceAdmin) {
      fetchSetting();
    }
  }, [isMaintenanceAdmin, fetchSetting]);

  useEffect(() => {
    return () => {
      if (saveMsgTimeoutRef.current) clearTimeout(saveMsgTimeoutRef.current);
    };
  }, []);

  const save = useCallback(async () => {
    setIsSaving(true);
    if (saveMsgTimeoutRef.current) clearTimeout(saveMsgTimeoutRef.current);
    try {
      const res = await fetch("/api/maintenance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-employee-id": MAINTENANCE_ADMIN,
        },
        body: JSON.stringify({
          isActive: maintenanceSetting.isActive,
          startTime: maintenanceSetting.startTime || null,
          endTime: maintenanceSetting.endTime || null,
          message: maintenanceSetting.message || null,
        }),
      });
      if (res.ok) {
        setSaveMsg({ type: "success", text: "บันทึกการตั้งค่าสำเร็จ" });
      } else {
        setSaveMsg({ type: "error", text: "บันทึกไม่สำเร็จ กรุณาลองใหม่" });
      }
    } catch {
      setSaveMsg({ type: "error", text: "เกิดข้อผิดพลาด กรุณาลองใหม่" });
    } finally {
      setIsSaving(false);
      saveMsgTimeoutRef.current = setTimeout(() => setSaveMsg(null), 4000);
    }
  }, [maintenanceSetting]);

  return {
    maintenanceSetting,
    setMaintenanceSetting,
    isSaving,
    saveMsg,
    save,
  };
}
