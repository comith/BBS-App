import { format } from "date-fns";
import { type Report, getStatusInfo, getPriorityInfo } from "../types";

export const exportReportsToCSV = (
  reports: Report[],
  dateRange: { from: Date | undefined; to: Date | undefined }
) => {
  const headers = [
    "รหัสรายงาน",
    "วันที่ส่ง",
    "รหัสพนักงาน",
    "ชื่อพนักงาน",
    "แผนก",
    "กลุ่ม",
    "หมวดหมู่ความปลอดภัย",
    "หมวดหมู่ย่อย",
    "งานที่สังเกต",
    "แผนกที่สังเกต",
    "จำนวน Safe",
    "จำนวน Unsafe",
    "สถานะ",
    "ความสำคัญ",
    "รายการที่เลือก",
    "จำนวนไฟล์แนบ",
    "หมายเหตุผู้อนุมัติ",
    "วันที่อนุมัติ",
    "ผู้อนุมัติ",
  ];

  const csvData = reports.map((report) => [
    report.id,
    format(report.submittedDate, "dd/MM/yyyy HH:mm"),
    report.employeeId,
    report.employeeName,
    report.department,
    report.group,
    report.safetyCategory,
    report.subCategory || "",
    report.observedWork,
    report.observedDepartment,
    report.safeCount,
    report.unsafeCount,
    getStatusInfo(report.status).label,
    getPriorityInfo(report.priority).label,
    report.selectedOptions.join("; "),
    report.attachment.length,
    report.adminNote || "",
    report.approvedDate
      ? format(report.approvedDate, "dd/MM/yyyy HH:mm")
      : "",
    report.approvedBy || "",
  ]);

  const allData = [headers, ...csvData];
  const csvContent = allData
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    )
    .join("\n");

  let filename = "BBS_Reports";
  if (dateRange.from && dateRange.to) {
    filename += `_${format(dateRange.from, "dd-MM-yyyy")}_to_${format(
      dateRange.to,
      "dd-MM-yyyy"
    )}`;
  } else if (dateRange.from) {
    filename += `_from_${format(dateRange.from, "dd-MM-yyyy")}`;
  }
  filename += ".csv";

  const blob = new Blob(["﻿" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
