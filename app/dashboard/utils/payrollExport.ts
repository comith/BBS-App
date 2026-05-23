import { monthNames } from "./payrollHelpers";
import { type PayrollData } from "../hooks/usePayrollData";

export const exportPayrollToCSV = (
  payrollData: PayrollData,
  selectedMonth: Date
) => {
  const exportData: any[] = [];

  // Individuals (รายบุคคลได้รับเงิน)
  payrollData.individuals
    .filter((emp) => emp.isEligible)
    .forEach((emp) => {
      exportData.push({
        กลุ่ม: "รายบุคคล",
        รหัสพนักงาน: emp.employeeId,
        "ชื่อ-สกุล": emp.employeeName,
        "การรายงาน (ครั้ง)": emp.bbsCount,
      });
    });

  // Groups (รายกลุ่มได้รับเงิน) — exclude employees with SHE violations
  payrollData.departments.forEach((dept) => {
    dept.subGroups
      .filter((group) => group.isEligible)
      .forEach((group) => {
        group.employees
          .filter((emp: any) => !emp.hasShePenalty)
          .forEach((emp: any) => {
            exportData.push({
              กลุ่ม: group.name,
              รหัสพนักงาน: emp.employeeId,
              "ชื่อ-สกุล": emp.employeeName,
              "การรายงาน (ครั้ง)": group.totalBbsCount,
            });
          });
      });
  });

  const headers = Object.keys(exportData[0] || {});
  const csvContent = [
    headers.join(","),
    ...exportData.map((row) =>
      headers
        .map((header) => {
          const value = row[header] || "";
          return `"${String(value).replace(/"/g, '""')}"`;
        })
        .join(",")
    ),
  ].join("\n");

  const BOM = "﻿";
  const blob = new Blob([BOM + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  const monthName = monthNames[selectedMonth.getMonth()];
  const year = selectedMonth.getFullYear();
  link.setAttribute("href", url);
  link.setAttribute("download", `Payroll_Report_${monthName}_${year}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
