"use client";

import { format } from "date-fns";
import { th } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Ban,
  BrainCircuit,
  Check,
  ChevronDown,
  ChevronUp,
  Eye,
} from "lucide-react";
import { type Report, getStatusInfo } from "../types";

interface Props {
  report: Report;
  isOpen: boolean;
  isSheOrManager: boolean;
  onToggle: () => void;
  onApprove: () => void;
  onReject: () => void;
  onView: () => void;
  onAiView: () => void;
}

export function ReportCard({
  report,
  isOpen,
  isSheOrManager,
  onToggle,
  onApprove,
  onReject,
  onView,
  onAiView,
}: Props) {
  const statusInfo = getStatusInfo(report.status);
  const StatusIcon = statusInfo.icon;

  return (
    <Card
      className="hover:shadow-md transition-shadow border-l-4 border-l-transparent data-[status=pending]:border-l-yellow-400 data-[status=approved]:border-l-green-500 data-[status=rejected]:border-l-red-500"
      data-status={report.status}
    >
      <Collapsible open={isOpen} onOpenChange={onToggle}>
        <CollapsibleTrigger asChild>
          <CardContent className="p-3 md:p-4 cursor-pointer hover:bg-gray-50">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">
                    #{report.id}
                  </span>
                  <Badge
                    className={cn("hidden md:flex", statusInfo.color)}
                  >
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {statusInfo.label}
                  </Badge>
                  <Badge
                    className={cn(
                      "md:hidden text-[10px] px-1.5 h-5",
                      statusInfo.color
                    )}
                  >
                    {statusInfo.label}
                  </Badge>
                  {report.priority === "high" && (
                    <Badge
                      variant="outline"
                      className="text-red-600 border-red-200 text-[10px] h-5 px-1.5"
                    >
                      สำคัญ
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500">
                    {format(report.submittedDate, "dd/MM/yy HH:mm")}
                  </span>
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-start md:items-center">
                <div className="md:col-span-4">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-600 uppercase">
                      {report.employeeName.substring(0, 2)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 line-clamp-1">
                        {report.employeeName}
                      </p>
                      <p className="text-xs text-gray-500 line-clamp-1">
                        {report.department}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="hidden md:block md:col-span-4">
                  <p
                    className="text-sm text-gray-600 line-clamp-1"
                    title={report.safetyCategory}
                  >
                    {report.safetyCategory}
                  </p>
                </div>

                <div className="md:col-span-2 flex items-center gap-3 text-sm">
                  <div
                    className="flex items-center gap-1.5"
                    title="Safe Actions"
                  >
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="font-medium text-gray-700">
                      {report.safeCount}
                    </span>
                  </div>
                  <div
                    className="flex items-center gap-1.5"
                    title="Unsafe Actions"
                  >
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <span className="font-medium text-gray-700">
                      {report.unsafeCount}
                    </span>
                  </div>
                </div>

                <div
                  className="md:col-span-2 flex items-center justify-end gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  {report.status === "pending" && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          onApprove();
                        }}
                        title="อนุมัติ"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          onReject();
                        }}
                        title="ไม่อนุมัติ"
                      >
                        <Ban className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  {isSheOrManager && report.aiInsight && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAiView();
                      }}
                      title="ดูผลวิเคราะห์ AI"
                    >
                      <BrainCircuit className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-500 hover:text-gray-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      onView();
                    }}
                    title="ดูรายละเอียด"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="md:hidden text-xs text-gray-500 line-clamp-1 mt-1">
                {report.safetyCategory}
              </div>
            </div>
          </CardContent>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-4 pb-4 px-4 bg-gray-50/50 border-t">
            <div className="pt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">หมวดหมู่ความปลอดภัย</p>
                  <p className="font-medium text-sm">
                    {report.safetyCategory}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">งานที่สังเกต</p>
                  <p className="font-medium">{report.observedWork}</p>
                </div>
                {report.subCategory && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-600">หมวดหมู่ย่อย</p>
                    <p className="font-medium text-sm">{report.subCategory}</p>
                  </div>
                )}
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-600">รายการที่เลือก</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {report.selectedOptions.map((option, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="text-xs"
                      >
                        {option}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">ไฟล์แนบ</p>
                  <p className="font-medium text-blue-600">
                    {report.attachment.length} ไฟล์
                  </p>
                </div>
              </div>

              {report.status === "approved" && report.approvedDate && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-2">
                  <p className="text-sm text-green-800">
                    <strong>อนุมัติเมื่อ:</strong>{" "}
                    {format(report.approvedDate, "dd MMMM yyyy HH:mm", {
                      locale: th,
                    })}
                  </p>
                  <p className="text-sm text-green-800">
                    <strong>อนุมัติโดย:</strong> {report.approvedBy}
                  </p>
                  {report.adminNote && (
                    <p className="text-sm text-green-800 mt-1">
                      <strong>หมายเหตุ:</strong> {report.adminNote}
                    </p>
                  )}
                </div>
              )}

              {report.status === "rejected" && report.adminNote && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-2">
                  <p className="text-sm text-red-800">
                    <strong>เหตุผลที่ไม่อนุมัติ:</strong> {report.adminNote}
                  </p>
                  <p className="text-sm text-red-800">
                    <strong>โดย:</strong> {report.approvedBy} เมื่อ{" "}
                    {report.approvedDate &&
                      format(report.approvedDate, "dd/MM/yyyy HH:mm")}
                  </p>
                </div>
              )}

              {report.status === "pending" && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-2">
                  <p className="text-sm text-yellow-800">
                    🕐 รายงานนี้รอการพิจารณาอนุมัติ
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
