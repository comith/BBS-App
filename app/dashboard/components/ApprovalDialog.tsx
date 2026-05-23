"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { type Report } from "../types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: "approve" | "reject" | null;
  report: Report | null;
  adminNote: string;
  onAdminNoteChange: (v: string) => void;
  isSubmitting: boolean;
  error: string | null;
  onSubmit: () => void;
  onCancel: () => void;
}

export function ApprovalDialog({
  open,
  onOpenChange,
  action,
  report,
  adminNote,
  onAdminNoteChange,
  isSubmitting,
  error,
  onSubmit,
  onCancel,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            {action === "approve" ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span>อนุมัติรายงาน</span>
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-red-600" />
                <span>ไม่อนุมัติรายงาน</span>
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            รายงาน #{report?.id} - {report?.employeeName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">ข้อมูลรายงาน</h4>
            <div className="text-sm space-y-1">
              <p>
                <strong>พนักงาน:</strong> {report?.employeeName} (
                {report?.employeeId})
              </p>
              <p>
                <strong>แผนก:</strong> {report?.department}
              </p>
              <p>
                <strong>งานที่สังเกต:</strong> {report?.observedWork}
              </p>
              <p>
                <strong>Safe/Unsafe:</strong> {report?.safeCount}/
                {report?.unsafeCount}
              </p>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              {action === "approve"
                ? "หมายเหตุการอนุมัติ (ไม่บังคับ)"
                : "เหตุผลที่ไม่อนุมัติ (บังคับ)"}
            </label>
            <Textarea
              placeholder={
                action === "approve"
                  ? "เช่น รายงานดีมาก มีรายละเอียดครบถ้วน"
                  : "เช่น ขาดรายละเอียดในการอธิบาย กรุณาส่งใหม่"
              }
              value={adminNote}
              onChange={(e) => onAdminNoteChange(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        {error && (
          <div className="px-1 pb-2">
            <p className="text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </p>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            ยกเลิก
          </Button>
          <Button
            onClick={onSubmit}
            disabled={
              (action === "reject" && !adminNote.trim()) || isSubmitting
            }
            className={
              action === "approve"
                ? "bg-green-600 hover:bg-green-700"
                : "bg-red-600 hover:bg-red-700"
            }
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                กำลังประมวลผล...
              </>
            ) : action === "approve" ? (
              "อนุมัติ"
            ) : (
              "ไม่อนุมัติ"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
