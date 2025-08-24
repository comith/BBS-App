"use client";

import React, {
  createContext,
  useContext,
  useCallback,
  useEffect,
} from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  NotificationLog,
  NotificationLogContextType,
} from "@/types/notificationLog";
import { NotificationLogService } from "@/services/notificationLogService";
import { useAlertNotification } from "@/hooks/alertNotification";
import { useNotification } from "@/hooks/useNotification";

const NotificationLogContext = createContext<NotificationLogContextType | null>(
  null
);

interface NotificationLogProviderProps {
  readonly children: React.ReactNode;
  readonly refreshInterval?: number; // milliseconds
  readonly enableRealtime?: boolean;
}


export function NotificationLogProvider({
  children,
  refreshInterval = 30000, // 30 วินาที
  enableRealtime = true,
}: NotificationLogProviderProps) {
  const queryClient = useQueryClient();
  const service = NotificationLogService.getInstance();
  useNotification();
  const showAlert = useAlertNotification();

  // ✅ ใช้ React Query สำหรับ fetch logs
  const {
    data: logs = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["notification-logs"],
    queryFn: () => service.fetchLogs(),
    staleTime: 5 * 60 * 1000, // 5 นาที
    gcTime: 10 * 60 * 1000, // 10 นาที
    refetchInterval: enableRealtime ? refreshInterval : false,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  const STORAGE_KEY = "bbs_employee_data";

interface EmployeeData {
  position?: string;
  [key: string]: any;
}

const loadFromLocalStorage = (): EmployeeData | null => {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) as EmployeeData : null;
    } catch (error) {
      console.error("Error loading from localStorage:", error);
      return null;
    }
  }
  return null;
};

const changeStatus = (status:string) =>{
  switch(status) {
    case "approved":
      return "ผ่านการตรวจสอบ";
    case "rejected":
      return "ไม่ผ่านการตรวจสอบ";
    default:
      return status;
  }
}

const updateLogNotification = (log: any) => {
  // update logs notification
  fetch('/api/notification-logs', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id: log.id, data: {
      id: log.id,
      action: log.action,
      action_from: log.action_from,
      notification_to: log.notification_to,
      isNotification: true
    } }),
  });
};

  useEffect(() => {
    const userData = loadFromLocalStorage();
    const arrayCheck = [logs].flat();
    if (Array.isArray(arrayCheck) && arrayCheck.length > 0) {
      const newLogs = Array.isArray(arrayCheck[0]) ? arrayCheck[0] : [arrayCheck[0]];
      const newArry = newLogs[0].logs.filter((data: any) => data.isNotification === false);
      if (newArry.length > 0 && userData) {
        (async () => {
          await Promise.all(
            newArry.map(async (log: any) => {
              if((userData.position === "SHE" || userData.position === "Manager") && log.notification_to === "SHE" ) {
                showAlert("รายงานใหม่", "มีรายงานพฤติกรรมใหม่จาก " + log.action_from);
                updateLogNotification(log);
              }else if(log.notification_to === userData.employeerId) {
                showAlert("รายงานของทาน", changeStatus(log.action) + " จาก " + log.action_from + " เรียบร้อยแล้ว");
                updateLogNotification(log);
              }
            })
          );
        })();
      }
    }

  }, [logs]);

  // ✅ Mutations สำหรับ CRUD operations
  const addMutation = useMutation({
    mutationFn: (
      log: Omit<NotificationLog, "id" | "created_at" | "updated_at">
    ) => service.createLog(log),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-logs"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: number;
      updates: Partial<NotificationLog>;
    }) => service.updateLog(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-logs"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => service.deleteLog(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-logs"] });
    },
  });

  // ✅ Helper functions
  const getLogsByUser = useCallback(
    (userId: string): NotificationLog[] => {
      return logs.filter((log) => log.notification_to === userId);
    },
    [logs]
  );

  const getUnreadLogs = useCallback(
    (userId: string): NotificationLog[] => {
      return logs.filter(
        (log) => log.notification_to === userId && log.isNotification === false
      );
    },
    [logs]
  );

  const addLog = useCallback(
    async (log: Omit<NotificationLog, "id" | "created_at" | "updated_at">) => {
      await addMutation.mutateAsync(log);
    },
    [addMutation]
  );

  const updateLog = useCallback(
    async (id: number, updates: Partial<NotificationLog>) => {
      await updateMutation.mutateAsync({ id, updates });
    },
    [updateMutation]
  );

  const deleteLog = useCallback(
    async (id: number) => {
      await deleteMutation.mutateAsync(id);
    },
    [deleteMutation]
  );

  const markAsRead = useCallback(
    async (id: number) => {
      await updateLog(id, { isNotification: true });
    },
    [updateLog]
  );

  const markAllAsRead = useCallback(
    async (userId: string) => {
      const unreadLogs = getUnreadLogs(userId);
      await Promise.all(
        unreadLogs.map((log) =>
          log.id ? markAsRead(log.id) : Promise.resolve()
        )
      );
    },
    [getUnreadLogs, markAsRead]
  );

  const refreshLogs = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const contextValue: NotificationLogContextType = React.useMemo(
    () => ({
      logs,
      isLoading,
      error: error?.message || null,
      addLog,
      updateLog,
      deleteLog,
      getLogsByUser,
      getUnreadLogs,
      markAsRead,
      markAllAsRead,
      refreshLogs,
    }),
    [
      logs,
      isLoading,
      error,
      addLog,
      updateLog,
      deleteLog,
      getLogsByUser,
      getUnreadLogs,
      markAsRead,
      markAllAsRead,
      refreshLogs,
    ]
  );

  return (
    <NotificationLogContext.Provider value={contextValue}>
      {children}
    </NotificationLogContext.Provider>
  );
}

// ✅ Custom hook สำหรับใช้งาน
export function useNotificationLog(): NotificationLogContextType {
  const context = useContext(NotificationLogContext);
  if (!context) {
    throw new Error(
      "useNotificationLog must be used within NotificationLogProvider"
    );
  }
  return context;
}

// hooks/useNotificationLogHelpers.ts - Helper hooks
export function useUserNotifications(userId: string) {
  const { getLogsByUser, getUnreadLogs, markAllAsRead } = useNotificationLog();

  const userLogs = getLogsByUser(userId);
  const unreadLogs = getUnreadLogs(userId);
  const unreadCount = unreadLogs.length;

  return {
    userLogs,
    unreadLogs,
    unreadCount,
    markAllAsRead: () => markAllAsRead(userId),
  };
}

export function useNotificationActions() {
  const { addLog, updateLog, deleteLog, markAsRead } = useNotificationLog();

  // สร้าง notification log สำหรับ action ต่างๆ
  const logFormSubmission = useCallback(
    async (fromUser: string, toUser: string) => {
      await addLog({
        action: "form_submitted",
        action_from: fromUser,
        notification_to: toUser,
        isNotification: false,
      });
    },
    [addLog]
  );

  const logReportGenerated = useCallback(
    async (fromUser: string, toUser: string) => {
      await addLog({
        action: "report_generated",
        action_from: fromUser,
        notification_to: toUser,
        isNotification: false,
      });
    },
    [addLog]
  );

  const logSystemAlert = useCallback(
    async (message: string, toUser: string) => {
      await addLog({
        action: "system_alert",
        action_from: "system",
        notification_to: toUser,
        isNotification: false,
      });
    },
    [addLog]
  );

  return {
    logFormSubmission,
    logReportGenerated,
    logSystemAlert,
    markAsRead,
    updateLog,
    deleteLog,
  };
}
