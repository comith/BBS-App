"use client";

import { format } from "date-fns";
import { th } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Ban, BrainCircuit, Check, FileImage } from "lucide-react";
import { type Report, getStatusInfo } from "../types";
import { isImageFile } from "../utils/fileHelpers";

interface Props {
  report: Report | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSheOrManager: boolean;
  onViewImage: (url: string) => void;
  onApprove: (r: Report) => void;
  onReject: (r: Report) => void;
  onAiView: (r: Report) => void;
}

export function ReportDetailModal({
  report,
  open,
  onOpenChange,
  isSheOrManager,
  onViewImage,
  onApprove,
  onReject,
  onAiView,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-[95vw] sm:w-full sm:max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        {report && (
          <>
            <DialogHeader>
              <DialogTitle>รายละเอียดรายงาน #{report.id}</DialogTitle>
              <DialogDescription className="sr-only">
                ข้อมูลรายงานการสังเกตความปลอดภัย
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 break-words">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">ข้อมูลพนักงาน</h3>
                  <div className="bg-gray-50 p-3 rounded space-y-1 text-sm">
                    <p>
                      <strong>ชื่อ:</strong> {report.employeeName}
                    </p>
                    <p>
                      <strong>รหัส:</strong> {report.employeeId}
                    </p>
                    <p>
                      <strong>แผนก:</strong> {report.department}
                    </p>
                    <p>
                      <strong>กลุ่ม:</strong> {report.group}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">ข้อมูลการสังเกต</h3>
                  <div className="bg-gray-50 p-3 rounded space-y-1 text-sm">
                    <p>
                      <strong>วันที่:</strong>{" "}
                      {format(report.date, "dd MMMM yyyy", { locale: th })}
                    </p>
                    <p className="break-words whitespace-pre-wrap">
                      <strong>งานที่สังเกต:</strong> {report.observedWork}
                    </p>
                    <p>
                      <strong>แผนกที่ถูกสังเกต:</strong>{" "}
                      {report.observedDepartment}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">หมวดหมู่ความปลอดภัย</h3>
                  <div className="bg-gray-50 p-3 rounded space-y-1 text-sm">
                    <p>
                      <strong>หมวดหมู่หลัก:</strong> {report.safetyCategory}
                    </p>
                    {report.subCategory && (
                      <p>
                        <strong>หมวดหมู่ย่อย:</strong> {report.subCategory}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">รายการที่เลือก</h3>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="flex flex-wrap gap-1">
                      {report.selectedOptions.map((option, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="text-xs whitespace-normal break-words h-auto text-left py-1"
                        >
                          {option === "8. อื่นๆ"
                            ? "อื่นๆ: " + report.other
                            : option}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">ผลการสังเกต</h3>
                  <div className="bg-gray-50 p-3 rounded space-y-1 text-sm">
                    <p>
                      <strong className="text-green-600">Safe Actions:</strong>{" "}
                      {report.safeCount} คน
                      {report.actionType !== "" ? " และได้ดำเนินการ " : ""}{" "}
                      <strong className="text-green-600">
                        {" "}
                        {report.actionType}
                      </strong>
                    </p>

                    <p>
                      <strong className="text-red-600">Unsafe Actions:</strong>{" "}
                      {report.unsafeCount} คน
                      {report.actionTypeunsafe !== ""
                        ? " และได้ดำเนินการ "
                        : ""}{" "}
                      <strong className="text-red-600">
                        {" "}
                        {report.actionTypeunsafe}
                      </strong>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="font-semibold mb-2">ไฟล์แนบ</h3>
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm text-gray-600">
                  มีไฟล์แนบทั้งหมด {report.attachment.length} ไฟล์
                </p>
                <div className="mt-2 space-y-2">
                  {report.attachment.map((file, index) => {
                    const isImg = isImageFile(file.name);
                    return (
                      <div key={index} className="flex items-center gap-2">
                        {isImg ? (
                          <button
                            onClick={() => onViewImage(file.webViewLink)}
                            className="text-sm text-blue-600 hover:text-blue-800 hover:underline cursor-pointer inline-flex items-center gap-1 text-left max-w-full"
                          >
                            <FileImage className="w-4 h-4 text-blue-500 flex-shrink-0" />{" "}
                            <span className="break-all">{file.name}</span> (คลิกเพื่อดูรูป)
                          </button>
                        ) : (
                          <a
                            href={file.webViewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline cursor-pointer inline-flex items-center gap-1 max-w-full"
                          >
                            <span className="flex-shrink-0">📎</span> <span className="break-all">{file.name}</span>
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {report.status !== "pending" && (
              <div className="mt-6">
                <h3 className="font-semibold mb-2">ข้อมูลการอนุมัติ</h3>
                <div
                  className={cn(
                    "p-3 rounded border",
                    report.status === "approved"
                      ? "bg-green-50 border-green-200"
                      : "bg-red-50 border-red-200"
                  )}
                >
                  <div className="text-sm space-y-1">
                    <p>
                      <strong>สถานะ:</strong>{" "}
                      {getStatusInfo(report.status).label}
                      {report.status === "rejected" && (
                        <span className="text-gray-500 ml-2">
                          ({report.comment})
                        </span>
                      )}
                    </p>
                    {report.approvedDate && (
                      <p>
                        <strong>วันที่:</strong>{" "}
                        {format(
                          report.approvedDate,
                          "dd MMMM yyyy HH:mm",
                          { locale: th }
                        )}
                      </p>
                    )}
                    {report.approvedBy && (
                      <p>
                        <strong>อนุมัติโดย:</strong> {report.approvedBy}
                      </p>
                    )}
                    {report.adminNote && (
                      <p>
                        <strong>หมายเหตุ:</strong> {report.adminNote}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {(report.status === "pending" || report.status === "approved" || report.aiInsight) && (
              <div className="mt-6 flex flex-wrap gap-3">
                {report.status === "pending" && isSheOrManager && (
                  <>
                    <Button
                      onClick={() => onApprove(report)}
                      className="bg-green-600 hover:bg-green-700 flex-1 min-w-[120px]"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      อนุมัติ
                    </Button>
                    <Button 
                      onClick={() => onReject(report)}
                      className="flex-1 min-w-[120px]"
                    >
                      <Ban className="h-4 w-4 mr-2" />
                      ไม่อนุมัติ
                    </Button>
                  </>
                )}
                {(report.status === "approved" || report.aiInsight) && (
                  <Button 
                    variant="outline" 
                    onClick={() => onAiView(report)}
                    className="flex-1 min-w-[120px] bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
                  >
                    <BrainCircuit className="h-4 w-4 mr-2" />
                    ผลวิเคราะห์ AI
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
