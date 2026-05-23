"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { type MaintenanceState } from "../hooks/useMaintenance";

interface Props {
  state: MaintenanceState;
}

export function MaintenanceSettings({ state }: Props) {
  const {
    maintenanceSetting,
    setMaintenanceSetting,
    isSaving,
    saveMsg,
    save,
  } = state;

  return (
    <Card className="py-4 px-0 md:p-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-orange-500" />
          <span>ตั้งค่าการปิดปรับปรุงระบบ</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status toggle */}
        <div className="flex items-center justify-between p-4 rounded-xl border bg-gray-50">
          <div>
            <p className="font-medium text-gray-800">สถานะระบบ</p>
            <p className="text-sm text-gray-500">
              {maintenanceSetting.isActive
                ? "ระบบปิดปรับปรุง — ผู้ใช้จะเห็นหน้าแจ้งซ่อมบำรุง"
                : "ระบบเปิดใช้งานปกติ"}
            </p>
          </div>
          <button
            onClick={() =>
              setMaintenanceSetting((prev) => ({
                ...prev,
                isActive: !prev.isActive,
              }))
            }
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${
              maintenanceSetting.isActive ? "bg-orange-500" : "bg-gray-300"
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                maintenanceSetting.isActive
                  ? "translate-x-6"
                  : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {/* Time range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">
              เวลาเริ่มต้น
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={maintenanceSetting.startTime.slice(0, 10)}
                onChange={(e) =>
                  setMaintenanceSetting((prev) => ({
                    ...prev,
                    startTime:
                      e.target.value + (prev.startTime.slice(10) || "T00:00"),
                  }))
                }
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              />
              <input
                type="text"
                inputMode="numeric"
                placeholder="HH:mm"
                maxLength={5}
                value={maintenanceSetting.startTime.slice(11, 16)}
                onChange={(e) => {
                  const digits = e.target.value
                    .replace(/\D/g, "")
                    .slice(0, 4);
                  const formatted =
                    digits.length > 2
                      ? digits.slice(0, 2) + ":" + digits.slice(2)
                      : digits;
                  setMaintenanceSetting((prev) => ({
                    ...prev,
                    startTime:
                      (prev.startTime.slice(0, 10) ||
                        new Date().toISOString().slice(0, 10)) +
                      "T" +
                      formatted,
                  }));
                }}
                className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">
              เวลาสิ้นสุด
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={maintenanceSetting.endTime.slice(0, 10)}
                onChange={(e) =>
                  setMaintenanceSetting((prev) => ({
                    ...prev,
                    endTime:
                      e.target.value + (prev.endTime.slice(10) || "T00:00"),
                  }))
                }
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              />
              <input
                type="text"
                inputMode="numeric"
                placeholder="HH:mm"
                maxLength={5}
                value={maintenanceSetting.endTime.slice(11, 16)}
                onChange={(e) => {
                  const digits = e.target.value
                    .replace(/\D/g, "")
                    .slice(0, 4);
                  const formatted =
                    digits.length > 2
                      ? digits.slice(0, 2) + ":" + digits.slice(2)
                      : digits;
                  setMaintenanceSetting((prev) => ({
                    ...prev,
                    endTime:
                      (prev.endTime.slice(0, 10) ||
                        new Date().toISOString().slice(0, 10)) +
                      "T" +
                      formatted,
                  }));
                }}
                className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Custom message */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">
            ข้อความแจ้งผู้ใช้{" "}
            <span className="text-gray-400 font-normal">(ไม่บังคับ)</span>
          </label>
          <Textarea
            value={maintenanceSetting.message}
            onChange={(e) =>
              setMaintenanceSetting((prev) => ({
                ...prev,
                message: e.target.value,
              }))
            }
            placeholder="เช่น กำลังอัปเดตระบบฐานข้อมูล คาดว่าจะแล้วเสร็จภายใน 2 ชั่วโมง"
            rows={3}
            className="resize-none"
          />
        </div>

        {/* Save feedback */}
        {saveMsg && (
          <div
            className={`flex items-center gap-2 text-sm px-4 py-2 rounded-lg ${
              saveMsg.type === "success"
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {saveMsg.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            {saveMsg.text}
          </div>
        )}

        {/* Save button */}
        <div className="flex justify-end">
          <Button
            onClick={save}
            disabled={isSaving}
            className="bg-orange-500 hover:bg-orange-600 min-w-[120px]"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                กำลังบันทึก...
              </>
            ) : (
              "บันทึกการตั้งค่า"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
