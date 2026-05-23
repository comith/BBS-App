"use client";

import * as React from "react";
import { useState } from "react";
import { type Report } from "./types";
import { usePayrollData } from "./hooks/usePayrollData";
import { exportPayrollToCSV } from "./utils/payrollExport";
import { PayrollHeader } from "./components/payroll/PayrollHeader";
import { PayrollSummaryCards } from "./components/payroll/PayrollSummaryCards";
import { PayrollIndividualsSection } from "./components/payroll/PayrollIndividualsSection";
import { PayrollGroupsSection } from "./components/payroll/PayrollGroupsSection";
import { EmployeeReportsDialog } from "./components/payroll/EmployeeReportsDialog";
import { SheViolationsDialog } from "./components/payroll/SheViolationsDialog";

interface EmployeeInfo {
  employeeId: string;
  employeeName: string;
  department: string;
  group: string;
  [key: string]: any;
}

interface PayrollReportSummaryProps {
  reports: Report[];
  employeeList: EmployeeInfo[];
}

const PayrollReportSummary = React.memo<PayrollReportSummaryProps>(
  ({ reports, employeeList }) => {
    const {
      selectedMonth,
      changeMonth,
      isLoadingShe,
      fetchSheViolations,
      payrollData,
    } = usePayrollData(reports, employeeList);

    const [isExporting, setIsExporting] = useState(false);

    // Employee Report Details
    const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
    const [showReportDetails, setShowReportDetails] = useState(false);

    // SHE Violation Details
    const [selectedSheViolations, setSelectedSheViolations] = useState<any[]>(
      []
    );
    const [showSheDetails, setShowSheDetails] = useState(false);
    const [sheDetailsTitle, setSheDetailsTitle] = useState("");

    const handleExport = () => {
      setIsExporting(true);
      try {
        exportPayrollToCSV(payrollData, selectedMonth);
      } catch (error) {
        console.error("Export error:", error);
        alert("เกิดข้อผิดพลาดในการ Export ข้อมูล");
      } finally {
        setIsExporting(false);
      }
    };

    const handleViewEmployeeReports = (employee: any) => {
      setSelectedEmployee(employee);
      setShowReportDetails(true);
    };

    const handleViewSheViolations = (violations: any[], title: string) => {
      setSelectedSheViolations(violations);
      setSheDetailsTitle(title);
      setShowSheDetails(true);
    };

    return (
      <div className="space-y-6">
        <PayrollHeader
          selectedMonth={selectedMonth}
          monthRange={payrollData.monthRange}
          onChangeMonth={changeMonth}
          onRefreshShe={fetchSheViolations}
          isLoadingShe={isLoadingShe}
          onExport={handleExport}
          isExporting={isExporting}
        />

        <PayrollSummaryCards summary={payrollData.summary} />

        <PayrollIndividualsSection
          individuals={payrollData.individuals}
          onViewEmployeeReports={handleViewEmployeeReports}
          onViewSheViolations={handleViewSheViolations}
        />

        <PayrollGroupsSection
          departments={payrollData.departments}
          totalGroups={payrollData.summary.totalGroups}
          onViewEmployeeReports={handleViewEmployeeReports}
          onViewSheViolations={handleViewSheViolations}
        />

        <EmployeeReportsDialog
          open={showReportDetails}
          onOpenChange={setShowReportDetails}
          selectedEmployee={selectedEmployee}
          selectedMonth={selectedMonth}
          reports={reports}
        />

        <SheViolationsDialog
          open={showSheDetails}
          onOpenChange={setShowSheDetails}
          title={sheDetailsTitle}
          violations={selectedSheViolations}
        />
      </div>
    );
  }
);

PayrollReportSummary.displayName = "PayrollReportSummary";

export default PayrollReportSummary;
