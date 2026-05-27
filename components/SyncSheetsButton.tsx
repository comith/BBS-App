"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CloudDownload, Loader } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

export function useSyncSheets(onSuccess?: () => void) {
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

  const handleSync = async () => {
    try {
      setIsSyncing(true);

      const res = await fetch("/api/sync-sheets", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "เกิดข้อผิดพลาดในการซิงค์ข้อมูล");
      }

      toast({
        title: "ซิงค์ข้อมูลสำเร็จ",
        description: `ซิงค์พนักงาน ${data.summary?.employees || 0} คนจาก Google Sheets เรียบร้อยแล้ว`,
        variant: "success",
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error("Sync error:", error);
      toast({
        title: "ซิงค์ข้อมูลไม่สำเร็จ",
        description: `ไม่สามารถซิงค์ข้อมูลได้: ${error.message || "ซิงค์ข้อมูลไม่สำเร็จ กรุณาลองใหม่"}`,
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return { isSyncing, handleSync };
}

interface SyncSheetsButtonProps {
  onSuccess?: () => void;
  className?: string;
  variant?: "ghost" | "default" | "outline";
}

export function SyncSheetsButton({ onSuccess, className, variant = "ghost" }: SyncSheetsButtonProps) {
  const { isSyncing, handleSync } = useSyncSheets(onSuccess);

  return (
    <Button
      variant={variant}
      size="icon"
      onClick={handleSync}
      disabled={isSyncing}
      title="ซิงค์ข้อมูลพนักงานจาก Sheet"
      className={cn("h-8 w-8 text-blue-600 hover:bg-blue-50 hover:text-blue-700 hidden sm:inline-flex", className)}
    >
      {isSyncing ? (
        <Loader className="h-4 w-4 animate-spin" />
      ) : (
        <CloudDownload className="h-4 w-4" />
      )}
    </Button>
  );
}
