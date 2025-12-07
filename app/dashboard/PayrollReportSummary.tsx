"use client";

import * as React from "react";
import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    ChevronLeft,
    ChevronRight,
    FileText,
    Search,
    Filter,
    Download
} from "lucide-react";
import { EmployeeSendReport } from "@/components/EmployeeSendReport";

interface EmployeeInfo {
    employeeId: string;
    employeeName: string;
    department: string;
    group: string;
    [key: string]: any;
}

interface Report {
    id: number;
    recordId: string;
    date: Date;
    employeeId: string;
    employeeName: string;
    department: string;
    group: string;
    safetyCategory: string;
    subCategory: string | null;
    observedWork: string;
    observedDepartment: string;
    status: "approved" | "pending" | "rejected";
    safeCount: number;
    unsafeCount: number;
    selectedOptions: string[];
    attachment: Array<{
        id: string;
        name: string;
        webViewLink: string;
    }>;
    adminNote: string | null;
    approvedDate: Date | null;
    approvedBy: string | null;
    submittedDate: Date;
    priority: "low" | "normal" | "high";
    actionType?: string;
    actionTypeunsafe?: string;
    other?: string;
    comment?: string;
    category?: string;
}

interface PayrollReportSummaryProps {
    reports: Report[];
    employeeList: EmployeeInfo[];
}

const PayrollReportSummary = React.memo<PayrollReportSummaryProps>(
    ({ reports, employeeList }) => {
        // Internal State
        const [selectedMonth, setSelectedMonth] = useState(new Date());
        const [sheViolations, setSheViolations] = useState<any[]>([]);
        const [isLoadingShe, setIsLoadingShe] = useState(false);

        // Modal State
        const [showLiseEmployeeSendReport, setShowLiseEmployeeSendReport] =
            useState(false);
        const [dataLiseEmployeeSendReport, setDataLiseEmployeeSendReport] =
            useState<any[]>([]);
        const [dataEmplooyeesInGroup, setDataEmplooyeesInGroup] = useState<any[]>([]);

        // UI State - Search, Filter, Pagination
        const [searchQuery, setSearchQuery] = useState("");
        const [statusFilter, setStatusFilter] = useState<"all" | "eligible" | "ineligible">("eligible");
        const [currentPage, setCurrentPage] = useState(1);
        const [itemsPerPage] = useState(25);
        const [isExporting, setIsExporting] = useState(false);

        // Employee Report Details State
        const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
        const [showReportDetails, setShowReportDetails] = useState(false);

        // SHE Violation Details State
        const [selectedSheViolations, setSelectedSheViolations] = useState<any[]>([]);
        const [showSheDetails, setShowSheDetails] = useState(false);
        const [sheDetailsTitle, setSheDetailsTitle] = useState("");

        // Group Search State
        const [groupSearchQuery, setGroupSearchQuery] = useState("");

        const getMonthlyRange = (date: Date) => {
            const year = date.getFullYear();
            const month = date.getMonth();
            const start = new Date(year, month - 1, 21);
            start.setHours(0, 0, 0, 0);
            const end = new Date(year, month, 20);
            end.setHours(23, 59, 59, 999);
            return { start, end };
        };

        const fetchSheViolations = async () => {
            setIsLoadingShe(true);
            try {
                const response = await fetch("/api/get?type=she");
                if (!response.ok) {
                    console.warn(`SHE API returned status: ${response.status}`);
                    setSheViolations([]);
                    return;
                }
                const data = await response.json();
                setSheViolations(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error("Error fetching SHE violations:", error);
                setSheViolations([]);
            } finally {
                setIsLoadingShe(false);
            }
        };

        useEffect(() => {
            fetchSheViolations();
        }, []);

        const payrollData = useMemo(() => {
            const monthlyRange = getMonthlyRange(selectedMonth);

            // Transform employeeList to ensure employeeId and employeeName exist
            const transformedEmployeeList = employeeList.map(emp => ({
                ...emp,
                employeeId: emp.employeeId || emp.employeerId || '',
                employeeName: emp.employeeName || emp.fullName || '',
                group: emp.group || "No Subgroup"
            }));

            const monthlyReports = reports.filter((r) => {
                const reportDate = new Date(r.submittedDate);
                return (
                    reportDate >= monthlyRange.start &&
                    reportDate <= monthlyRange.end &&
                    r.status === "approved"
                );
            });

            // Helper function to check if group is Manager
            const isManagerGroup = (groupName: string) => {
                if (!groupName) return false;
                const lowerGroup = groupName.toLowerCase();
                return lowerGroup.includes("manager") || lowerGroup.includes("management");
            };

            // Separate into individuals and groups
            // Individuals: ITH-OE OR groups ending with exactly '0' (not other digits like CV10)
            const isIndividual = (emp: EmployeeInfo) => {
                if (emp.department === "ITH-OE") return true;
                if (!emp.group) return false;
                // Only accept groups ending with single '0' (MO0, CV0) not multiple digits (CV10, MO10)
                const trimmedGroup = emp.group.trim();
                return trimmedGroup.endsWith("0") && !trimmedGroup.match(/\d{2,}$/);
            };

            const individualEmployees = transformedEmployeeList.filter(isIndividual);
            const groupEmployees = transformedEmployeeList.filter(emp =>
                !isIndividual(emp) &&
                !isManagerGroup(emp.group)
            );

            // Process Individual Results (ITH-OE + Special Groups ending in 0)
            const individualResults = individualEmployees.map((employee) => {
                const employeeMonthlyReports = monthlyReports.filter(
                    (r) => r.employeeId === employee.employeeId && r.status === "approved"
                );

                const bbsCount = employeeMonthlyReports.length;
                const bbsTarget = 12;
                const meetsBbsRequirement = bbsCount >= bbsTarget;

                const sheReports = sheViolations.filter((violation) => {
                    const violationDate = new Date(violation.date);
                    if (isNaN(violationDate.getTime())) return false;
                    return (
                        violation.employee_code === employee.employeeId &&
                        violationDate >= monthlyRange.start &&
                        violationDate <= monthlyRange.end
                    );
                });

                const ppeViolations = sheReports.filter(
                    (r) => r.level_accident === "PPE" || r.level_accident?.toLowerCase().includes("ppe")
                ).length;

                const highRiskViolations = sheReports.filter(
                    (r) => r.level_accident === "เสี่ยงสูง" || r.level_accident?.toLowerCase().includes("เสี่ยงสูง")
                ).length;

                const accidentViolations = sheReports.filter(
                    (r) => r.level_accident === "อุบัติเหตุ" || r.level_accident?.toLowerCase().includes("อุบัติเหตุ")
                ).length;

                const sheViolationReasons = [];
                if (ppeViolations >= 3) sheViolationReasons.push(`PPE (${ppeViolations} ครั้ง)`);
                if (highRiskViolations >= 2) sheViolationReasons.push(`เสี่ยงสูง (${highRiskViolations} ครั้ง)`);
                if (accidentViolations >= 1) sheViolationReasons.push(`อุบัติเหตุ (${accidentViolations} ครั้ง)`);
                const hasShePenalty = sheViolationReasons.length > 0;

                const isEligible = meetsBbsRequirement && !hasShePenalty;
                let paymentStatus = "";
                let statusColor = "";

                if (isEligible) {
                    paymentStatus = "ได้รับเงิน";
                    statusColor = "bg-green-100 text-green-800";
                } else {
                    const reasons = [];
                    if (!meetsBbsRequirement) reasons.push(`BBS ไม่ครบ (${bbsCount}/${bbsTarget})`);
                    if (hasShePenalty) reasons.push(`SHE: ${sheViolationReasons.join(", ")}`);
                    paymentStatus = `ไม่ได้รับ: ${reasons.join(" | ")}`;
                    statusColor = "bg-red-100 text-red-800";
                }

                return {
                    ...employee,
                    bbsCount,
                    bbsTarget,
                    meetsBbsRequirement,
                    ppeViolations,
                    highRiskViolations,
                    accidentViolations,
                    hasShePenalty,
                    sheViolationReasons,
                    isEligible,
                    paymentStatus,
                    statusColor,
                    monthlyRange,
                    isSpecialIndividual: employee.department !== "ITH-OE" && !!employee.group, // Flag to identify special individuals for UI if needed
                    sheReports // Include SHE reports for detail view
                };
            });

            // Build groups from actual reports (source of truth for group membership)
            // Step 1: Collect all employees who sent reports, grouped by their reported department + group
            const reportBasedGroups: { [deptKey: string]: { [groupKey: string]: Set<string> } } = {};
            const employeeReportData: { [empId: string]: { department: string; group: string; count: number } } = {};

            monthlyReports.forEach(report => {
                const dept = report.department || "Unknown Department";
                const grp = report.group || "General";
                const empId = report.employeeId;

                // Skip ITH-OE department (all ITH-OE are handled as individuals)
                if (dept === "ITH-OE") {
                    return;
                }

                // Skip groups ending with '0' (they are handled as individuals)
                if (grp.trim().endsWith("0")) {
                    return;
                }

                // Track which department + group this employee reported from
                if (!employeeReportData[empId]) {
                    employeeReportData[empId] = { department: dept, group: grp, count: 0 };
                }
                employeeReportData[empId].count++;

                // Build group structure
                if (!reportBasedGroups[dept]) reportBasedGroups[dept] = {};
                if (!reportBasedGroups[dept][grp]) reportBasedGroups[dept][grp] = new Set();
                reportBasedGroups[dept][grp].add(empId);
            });

            // Step 2: Add employees from employeeList who didn't send reports (count = 0)
            // They will be placed in their current group from employeeList
            groupEmployees.forEach(emp => {
                if (!employeeReportData[emp.employeeId]) {
                    const dept = emp.department || "Unknown Department";
                    const grp = emp.group || "General";

                    // Skip ITH-OE department (all ITH-OE are handled as individuals)
                    if (dept === "ITH-OE") {
                        return;
                    }

                    if (!reportBasedGroups[dept]) reportBasedGroups[dept] = {};
                    if (!reportBasedGroups[dept][grp]) reportBasedGroups[dept][grp] = new Set();
                    reportBasedGroups[dept][grp].add(emp.employeeId);

                    employeeReportData[emp.employeeId] = { department: dept, group: grp, count: 0 };
                }
            });

            // Step 3: Process each department and subgroup
            const departmentResults = Object.keys(reportBasedGroups).sort().map(deptName => {
                const deptGroups = reportBasedGroups[deptName];

                const calculatedSubGroups = Object.keys(deptGroups).map(groupName => {
                    const employeeIds = Array.from(deptGroups[groupName]);

                    const employeeStats = employeeIds.map(empId => {
                        // Find employee info from employeeList or create minimal info
                        const empInfo = transformedEmployeeList.find(e => e.employeeId === empId) || {
                            employeeId: empId,
                            employeeName: empId, // Fallback if not in list
                            department: deptName,
                            group: groupName
                        };

                        // Count reports for this employee
                        const empReports = monthlyReports.filter(
                            r => r.employeeId === empId && r.status === "approved"
                        );
                        const bbsCount = empReports.length;

                        // SHE Violations
                        const empSheReports = sheViolations.filter(violation => {
                            const violationDate = new Date(violation.date);
                            if (isNaN(violationDate.getTime())) return false;
                            return (
                                violation.employee_code === empId &&
                                violationDate >= monthlyRange.start &&
                                violationDate <= monthlyRange.end
                            );
                        });

                        const ppeViolations = empSheReports.filter(
                            (r) => r.level_accident === "PPE" || r.level_accident?.toLowerCase().includes("ppe")
                        ).length;
                        const highRiskViolations = empSheReports.filter(
                            (r) => r.level_accident === "เสี่ยงสูง" || r.level_accident?.toLowerCase().includes("เสี่ยงสูง")
                        ).length;
                        const accidentViolations = empSheReports.filter(
                            (r) => r.level_accident === "อุบัติเหตุ" || r.level_accident?.toLowerCase().includes("อุบัติเหตุ")
                        ).length;

                        const hasShePenalty = (ppeViolations >= 3) || (highRiskViolations >= 2) || (accidentViolations >= 1);

                        return {
                            ...empInfo,
                            bbsCount,
                            ppeViolations,
                            highRiskViolations,
                            accidentViolations,
                            hasShePenalty,
                            sheReports: empSheReports // Include SHE reports for detail view
                        };
                    });

                    // Group Eligibility Rule: 
                    // 1. Total BBS of all members >= 12 (Collective Target)
                    // 2. Group SHE violations (sum of all members):
                    //    - PPE < 12 times/month
                    //    - High Risk < 8 times/month
                    //    - Accident < 4 times/month
                    const totalBbsCount = employeeStats.reduce((sum, emp) => sum + emp.bbsCount, 0);
                    const isBbsPassed = totalBbsCount >= 12;

                    // Sum up all SHE violations across the group
                    const totalGroupPpeViolations = employeeStats.reduce((sum, emp) => sum + emp.ppeViolations, 0);
                    const totalGroupHighRiskViolations = employeeStats.reduce((sum, emp) => sum + emp.highRiskViolations, 0);
                    const totalGroupAccidentViolations = employeeStats.reduce((sum, emp) => sum + emp.accidentViolations, 0);

                    // Check group-level thresholds
                    const hasGroupShePenalty = (totalGroupPpeViolations >= 12) ||
                        (totalGroupHighRiskViolations >= 8) ||
                        (totalGroupAccidentViolations >= 4);

                    const isEligible = isBbsPassed && !hasGroupShePenalty;

                    return {
                        id: `group-${deptName}-${groupName}`,
                        name: groupName,
                        department: deptName,
                        totalEmployees: employeeStats.length,
                        totalBbsCount,
                        isEligible,
                        employees: employeeStats,
                        statusColor: isEligible ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800",
                        // Group-level SHE violations (sum of all members)
                        totalGroupPpeViolations,
                        totalGroupHighRiskViolations,
                        totalGroupAccidentViolations,
                        hasGroupShePenalty
                    };
                });

                // Sort subgroups: Eligible first, then by name
                calculatedSubGroups.sort((a, b) => {
                    if (a.isEligible === b.isEligible) return a.name.localeCompare(b.name);
                    return a.isEligible ? -1 : 1;
                });

                return {
                    departmentName: deptName,
                    subGroups: calculatedSubGroups,
                    totalSubGroups: calculatedSubGroups.length,
                    totalEligibleSubGroups: calculatedSubGroups.filter(g => g.isEligible).length
                };
            });

            // Sort departments by name
            departmentResults.sort((a, b) => a.departmentName.localeCompare(b.departmentName));

            const totalGroupsCount = departmentResults.reduce((acc, dept) => acc + dept.totalSubGroups, 0);
            const totalEligibleGroupsCount = departmentResults.reduce((acc, dept) => acc + dept.totalEligibleSubGroups, 0);

            return {
                monthRange: monthlyRange,
                individuals: individualResults,
                departments: departmentResults,
                summary: {
                    totalIndividuals: individualResults.length,
                    totalGroups: totalGroupsCount,
                    eligibleIndividuals: individualResults.filter((e) => e.isEligible).length,
                    eligibleGroups: totalEligibleGroupsCount,
                    totalPaymentUnits: individualResults.filter((e) => e.isEligible).length + totalEligibleGroupsCount,
                    totalUnits: individualResults.length + totalGroupsCount,
                },
            };
        }, [reports, sheViolations, selectedMonth, employeeList]);

        // Filtering and Pagination for Individuals (ITH-OE + Special Groups)
        const filteredIndividuals = useMemo(() => {
            return payrollData.individuals
                .filter((emp) => {
                    if (searchQuery) {
                        const query = searchQuery.toLowerCase();
                        return (
                            emp.employeeId?.toLowerCase().includes(query) ||
                            emp.employeeName?.toLowerCase().includes(query) ||
                            emp.group?.toLowerCase().includes(query) // Also search by group name for special individuals
                        );
                    }
                    return true;
                })
                .filter((emp) => {
                    if (statusFilter === "eligible") return emp.isEligible;
                    if (statusFilter === "ineligible") return !emp.isEligible;
                    return true;
                });
        }, [payrollData.individuals, searchQuery, statusFilter]);

        const totalPages = Math.ceil(filteredIndividuals.length / itemsPerPage);
        const paginatedIndividuals = useMemo(() => {
            const startIndex = (currentPage - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            return filteredIndividuals.slice(startIndex, endIndex);
        }, [filteredIndividuals, currentPage, itemsPerPage]);

        useEffect(() => {
            setCurrentPage(1);
        }, [searchQuery, statusFilter]);

        const changeMonth = (direction: "prev" | "next") => {
            setSelectedMonth((prev) => {
                const newDate = new Date(prev);
                const offset = direction === "prev" ? -1 : 1;
                newDate.setMonth(newDate.getMonth() + offset);
                return newDate;
            });
        };

        const monthNames = [
            "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
            "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
        ];

        const exportToExcel = () => {
            setIsExporting(true);
            try {
                // Prepare data for export
                const exportData: any[] = [];

                // Add Individuals (only eligible)
                payrollData.individuals
                    .filter(emp => emp.isEligible)
                    .forEach(emp => {
                        exportData.push({
                            'กลุ่ม': 'รายบุคคล',
                            'รหัสพนักงาน': emp.employeeId,
                            'ชื่อ-สกุล': emp.employeeName,
                            'การรายงาน (ครั้ง)': emp.bbsCount
                        });
                    });

                // Add Groups (only eligible groups)
                payrollData.departments.forEach(dept => {
                    dept.subGroups
                        .filter(group => group.isEligible)
                        .forEach(group => {
                            group.employees.forEach((emp: any) => {
                                exportData.push({
                                    'กลุ่ม': group.name,
                                    'รหัสพนักงาน': emp.employeeId,
                                    'ชื่อ-สกุล': emp.employeeName,
                                    'การรายงาน (ครั้ง)': group.totalBbsCount
                                });
                            });
                        });
                });

                // Convert to CSV
                const headers = Object.keys(exportData[0] || {});
                const csvContent = [
                    headers.join(','),
                    ...exportData.map(row =>
                        headers.map(header => {
                            const value = row[header] || '';
                            return `"${String(value).replace(/"/g, '""')}"`;
                        }).join(',')
                    )
                ].join('\n');

                // Add BOM for UTF-8
                const BOM = '\uFEFF';
                const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                const url = URL.createObjectURL(blob);

                const monthName = monthNames[selectedMonth.getMonth()];
                const year = selectedMonth.getFullYear();
                link.setAttribute('href', url);
                link.setAttribute('download', `Payroll_Report_${monthName}_${year}.csv`);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } catch (error) {
                console.error('Export error:', error);
                alert('เกิดข้อผิดพลาดในการ Export ข้อมูล');
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

        const formatDateRange = (range: { start: Date; end: Date }) => {
            return `${format(range.start, "dd/MM/yyyy")} - ${format(range.end, "dd/MM/yyyy")}`;
        };

        return (
            <div className="space-y-6">
                {/* Month Selector */}
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center space-x-4">
                        <Button variant="outline" size="sm" onClick={() => changeMonth("prev")}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="text-center">
                            <h3 className="text-lg font-semibold">
                                {monthNames[selectedMonth.getMonth()]} {selectedMonth.getFullYear()}
                            </h3>
                            <p className="text-sm text-gray-600">
                                ({formatDateRange(payrollData.monthRange)})
                            </p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => changeMonth("next")}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="flex items-center gap-4 flex-wrap">
                        <Button onClick={fetchSheViolations} disabled={isLoadingShe} variant="outline" size="sm">
                            {isLoadingShe ? "กำลังโหลด SHE..." : "รีเฟรช SHE"}
                        </Button>
                        <Button onClick={exportToExcel} disabled={isExporting} variant="default" size="sm" className="bg-green-600 hover:bg-green-700">
                            <Download className="h-4 w-4 mr-2" />
                            {isExporting ? "กำลัง Export..." : "Export"}
                        </Button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <div className="text-3xl font-bold text-blue-600">{payrollData.summary.totalIndividuals}</div>
                        <div className="text-sm text-blue-700 mt-1">ITH-OE (รายบุคคล)</div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                        <div className="text-3xl font-bold text-purple-600">{payrollData.summary.totalGroups}</div>
                        <div className="text-sm text-purple-700 mt-1">กลุ่มย่อย</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <div className="text-3xl font-bold text-green-600">{payrollData.summary.totalPaymentUnits}</div>
                        <div className="text-sm text-green-700 mt-1">ได้รับเงิน</div>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        <div className="text-3xl font-bold text-yellow-600">{payrollData.summary.eligibleIndividuals + payrollData.summary.eligibleGroups}</div>
                        <div className="text-sm text-yellow-700 mt-1">หน่วยผ่านเกณฑ์</div>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                        <div className="text-3xl font-bold text-red-600">
                            {payrollData.summary.totalUnits - payrollData.summary.totalPaymentUnits}
                        </div>
                        <div className="text-sm text-red-700 mt-1">ไม่ผ่านเกณฑ์</div>
                    </div>
                </div>

                {/* Individual Assessment (ITH-OE + Special Groups) */}
                {payrollData.individuals.length > 0 && (
                    <Accordion type="single" collapsible defaultValue="individuals" className="border rounded-lg bg-white shadow-sm">
                        <AccordionItem value="individuals" className="border-none">
                            <AccordionTrigger className="px-4 hover:no-underline bg-blue-50 rounded-t-lg">
                                <div className="flex items-center gap-3">
                                    <span className="text-lg font-bold text-blue-700">
                                        🧑‍💼 คิดรายบุคคล (ITH-OE)
                                    </span>
                                    <Badge variant="secondary" className="bg-white text-blue-700 border border-blue-200">
                                        {payrollData.individuals.length} คน
                                    </Badge>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="p-4">
                                {/* Search and Filters */}
                                <div className="mb-4 space-y-3">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <Input
                                            type="text"
                                            placeholder="ค้นหา (รหัส, ชื่อ, กลุ่ม)..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-10"
                                        />
                                    </div>
                                    <div className="flex gap-2 flex-wrap items-center">
                                        <span className="text-sm text-gray-600 flex items-center gap-1">
                                            <Filter className="h-4 w-4" /> กรอง:
                                        </span>
                                        <Button
                                            size="sm"
                                            variant={statusFilter === "all" ? "default" : "outline"}
                                            onClick={() => setStatusFilter("all")}
                                        >
                                            ทั้งหมด ({payrollData.individuals.length})
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant={statusFilter === "eligible" ? "default" : "outline"}
                                            onClick={() => setStatusFilter("eligible")}
                                            className={statusFilter === "eligible" ? "bg-green-600 hover:bg-green-700" : ""}
                                        >
                                            💰 ได้รับ ({payrollData.individuals.filter(e => e.isEligible).length})
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant={statusFilter === "ineligible" ? "default" : "outline"}
                                            onClick={() => setStatusFilter("ineligible")}
                                            className={statusFilter === "ineligible" ? "bg-red-600 hover:bg-red-700" : ""}
                                        >
                                            ❌ ไม่ได้รับ ({payrollData.individuals.filter(e => !e.isEligible).length})
                                        </Button>
                                    </div>
                                </div>

                                {/* Compact Table */}
                                <div className="overflow-x-auto rounded-lg border">
                                    <table className="w-[1000px] md:w-full text-sm">
                                        <thead>
                                            <tr className="bg-gray-100 border-b text-gray-700">
                                                <th className="text-left p-2 font-medium">รหัส</th>
                                                <th className="text-left p-2 font-medium">ชื่อ</th>
                                                <th className="text-left p-2 font-medium">กลุ่ม/แผนก</th>
                                                <th className="text-center p-2 font-medium">BBS</th>
                                                <th className="text-center p-2 font-medium">PPE</th>
                                                <th className="text-center p-2 font-medium">เสี่ยงสูง</th>
                                                <th className="text-center p-2 font-medium">อุบัติเหตุ</th>
                                                <th className="text-center p-2 font-medium">สถานะ</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {paginatedIndividuals.map((employee, index) => (
                                                <tr key={employee.employeeId || `emp-${index}`} className="border-b last:border-0 hover:bg-gray-50">
                                                    <td className="p-2 font-mono text-xs text-gray-600">{employee.employeeId}</td>
                                                    <td className="p-2 font-medium">
                                                        <button
                                                            onClick={() => handleViewEmployeeReports(employee)}
                                                            className="text-left hover:text-blue-600 hover:underline cursor-pointer transition-colors"
                                                        >
                                                            {employee.employeeName}
                                                        </button>
                                                    </td>
                                                    <td className="p-2 text-xs text-gray-500">
                                                        {employee.department === "ITH-OE" ? "ITH-OE" : `${employee.department} (${employee.group})`}
                                                    </td>
                                                    <td className="p-2 text-center">
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${employee.meetsBbsRequirement ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                                                            {employee.bbsCount}/12 {employee.meetsBbsRequirement ? "✓" : ""}
                                                        </span>
                                                    </td>
                                                    <td className="p-2 text-center">
                                                        {employee.ppeViolations > 0 ? (
                                                            <button
                                                                onClick={() => handleViewSheViolations(
                                                                    employee.sheReports?.filter((r: any) => r.level_accident === "PPE" || r.level_accident?.toLowerCase().includes("ppe")) || [],
                                                                    `รายละเอียด SHE - PPE: ${employee.employeeName}`
                                                                )}
                                                                className={`hover:underline cursor-pointer ${employee.ppeViolations >= 3 ? "text-red-600 font-bold" : "text-gray-600"}`}
                                                            >
                                                                {employee.ppeViolations} {employee.ppeViolations >= 3 && "❌"}
                                                            </button>
                                                        ) : (
                                                            <span className="text-gray-400">-</span>
                                                        )}
                                                    </td>
                                                    <td className="p-2 text-center">
                                                        {employee.highRiskViolations > 0 ? (
                                                            <button
                                                                onClick={() => handleViewSheViolations(
                                                                    employee.sheReports?.filter((r: any) => r.level_accident === "เสี่ยงสูง" || r.level_accident?.toLowerCase().includes("เสี่ยงสูง")) || [],
                                                                    `รายละเอียด SHE - เสี่ยงสูง: ${employee.employeeName}`
                                                                )}
                                                                className={`hover:underline cursor-pointer ${employee.highRiskViolations >= 2 ? "text-red-600 font-bold" : "text-gray-600"}`}
                                                            >
                                                                {employee.highRiskViolations} {employee.highRiskViolations >= 2 && "❌"}
                                                            </button>
                                                        ) : (
                                                            <span className="text-gray-400">-</span>
                                                        )}
                                                    </td>
                                                    <td className="p-2 text-center">
                                                        {employee.accidentViolations > 0 ? (
                                                            <button
                                                                onClick={() => handleViewSheViolations(
                                                                    employee.sheReports?.filter((r: any) => r.level_accident === "อุบัติเหตุ" || r.level_accident?.toLowerCase().includes("อุบัติเหตุ")) || [],
                                                                    `รายละเอียด SHE - อุบัติเหตุ: ${employee.employeeName}`
                                                                )}
                                                                className={`hover:underline cursor-pointer ${employee.accidentViolations >= 1 ? "text-red-600 font-bold" : "text-gray-600"}`}
                                                            >
                                                                {employee.accidentViolations} {employee.accidentViolations >= 1 && "❌"}
                                                            </button>
                                                        ) : (
                                                            <span className="text-gray-400">-</span>
                                                        )}
                                                    </td>
                                                    <td className="p-2 text-center">
                                                        {employee.isEligible ? (
                                                            <span className="text-2xl" title="ได้รับเงิน">💰</span>
                                                        ) : (
                                                            <span className="text-xl text-red-500" title="ไม่ได้รับเงิน">❌</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                            {filteredIndividuals.length === 0 && (
                                                <tr>
                                                    <td colSpan={8} className="p-8 text-center text-gray-500">
                                                        ไม่พบข้อมูลที่ค้นหา
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="mt-4 flex items-center justify-between">
                                        <div className="text-sm text-gray-500">
                                            หน้า {currentPage} / {totalPages} (แสดง {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredIndividuals.length)} จาก {filteredIndividuals.length})
                                        </div>
                                        <div className="flex gap-2">
                                            <Button size="sm" variant="outline" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                                                <ChevronLeft className="h-4 w-4" /> ก่อนหน้า
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                                                ถัดไป <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                )}

                {/* Other Departments (Nested Groups) */}
                {payrollData.departments.length > 0 && (
                    <Accordion type="single" collapsible defaultValue="other-depts" className="border rounded-lg bg-white shadow-sm mt-6">
                        <AccordionItem value="other-depts" className="border-none">
                            <AccordionTrigger className="px-4 hover:no-underline bg-purple-50 rounded-t-lg">
                                <div className="flex items-center gap-3">
                                    <span className="text-lg font-bold text-purple-700">
                                        🏢 แผนกอื่นๆ (คิดรายกลุ่ม)
                                    </span>
                                    <Badge variant="secondary" className="bg-white text-purple-700 border border-purple-200">
                                        {payrollData.summary.totalGroups} กลุ่มย่อย
                                    </Badge>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="p-4 bg-gray-50">
                                {/* Group Search */}
                                <div className="mb-4">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <Input
                                            type="text"
                                            placeholder="ค้นหาสมาชิกในกลุ่ม (รหัส, ชื่อ)..."
                                            value={groupSearchQuery}
                                            onChange={(e) => setGroupSearchQuery(e.target.value)}
                                            className="pl-10"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {payrollData.departments.map((dept) => {
                                        // Filter sub-groups based on search query
                                        const filteredSubGroups = dept.subGroups.filter(group => {
                                            if (!groupSearchQuery) return true;

                                            // Check if any employee in the group matches
                                            const hasMatchingEmployee = group.employees.some((emp: any) => {
                                                const query = groupSearchQuery.toLowerCase();
                                                return (
                                                    (emp.employeeId && emp.employeeId.toLowerCase().includes(query)) ||
                                                    (emp.employeeName && emp.employeeName.toLowerCase().includes(query))
                                                );
                                            });

                                            return hasMatchingEmployee;
                                        });

                                        // If search is active and no groups match, don't render this department
                                        if (groupSearchQuery && filteredSubGroups.length === 0) {
                                            return null;
                                        }

                                        return (
                                            <div key={dept.departmentName} className="bg-white rounded-lg border shadow-sm overflow-hidden">
                                                <div className="px-4 py-3 bg-gray-100 border-b flex justify-between items-center">
                                                    <div className="font-bold text-gray-700 text-lg">
                                                        {dept.departmentName}
                                                    </div>
                                                    <Badge variant="outline" className="bg-white">
                                                        {dept.totalEligibleSubGroups} / {dept.totalSubGroups} กลุ่มผ่านเกณฑ์
                                                    </Badge>
                                                </div>
                                                <div className="p-2">
                                                    <Accordion type="multiple" className="space-y-2" value={groupSearchQuery ? filteredSubGroups.map(g => g.id) : undefined}>
                                                        {filteredSubGroups.map((group) => (
                                                            <AccordionItem key={group.id} value={group.id} className={`border rounded-md px-3 ${group.isEligible ? 'bg-green-50/30 border-green-200' : 'bg-red-50/30 border-red-200'}`}>
                                                                <AccordionTrigger className="hover:no-underline py-2">
                                                                    <div className="flex flex-1 items-center justify-between mr-2">
                                                                        <div className="text-left flex items-center gap-3">
                                                                            <span className="font-semibold text-sm text-gray-800">
                                                                                {group.name}
                                                                            </span>
                                                                            <span className="text-xs text-gray-500">
                                                                                (สมาชิก {group.totalEmployees} คน | ส่งรวม {group.totalBbsCount}/12)
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex items-center gap-2">
                                                                            {group.isEligible ?
                                                                                <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-green-200">ได้รับเงิน 💰</Badge> :
                                                                                <Badge className="bg-red-100 text-red-800 hover:bg-red-200 border-red-200">ไม่ได้รับ ❌</Badge>
                                                                            }
                                                                        </div>
                                                                    </div>
                                                                </AccordionTrigger>
                                                                <AccordionContent className="pb-3 pt-0">
                                                                    <div className="mt-2 text-xs text-gray-600 mb-2 pl-1">
                                                                        {group.isEligible ?
                                                                            <span className="text-green-600">✓ ยอดส่งรวม {group.totalBbsCount} ครั้ง (เป้า 12) | ไม่มีการรายงานจาก SHE เกินเกณฑ์</span> :
                                                                            <span className="text-red-600">
                                                                                ✗ {group.totalBbsCount < 12 ? `ยอดส่งรวมไม่ถึง (${group.totalBbsCount}/12)` : ''}
                                                                                {group.hasGroupShePenalty && (
                                                                                    <span>
                                                                                        {group.totalBbsCount < 12 ? ' | ' : ''}
                                                                                        SHE รวมกลุ่ม:
                                                                                        {group.totalGroupPpeViolations >= 12 && ` PPE ${group.totalGroupPpeViolations}/12`}
                                                                                        {group.totalGroupHighRiskViolations >= 8 && ` เสี่ยงสูง ${group.totalGroupHighRiskViolations}/8`}
                                                                                        {group.totalGroupAccidentViolations >= 4 && ` อุบัติเหตุ ${group.totalGroupAccidentViolations}/4`}
                                                                                    </span>
                                                                                )}
                                                                            </span>
                                                                        }
                                                                    </div>
                                                                    <div className="bg-white rounded border overflow-x-auto">
                                                                        <table className="w-[600px] md:w-full text-xs">
                                                                            <thead className="bg-gray-50 text-gray-600">
                                                                                <tr>
                                                                                    <th className="p-2 text-left bg-gray-50">ชื่อ-นามสกุล</th>
                                                                                    <th className="p-2 text-center bg-gray-50">จำนวนส่ง</th>
                                                                                    <th className="p-2 text-center bg-gray-50">PPE</th>
                                                                                    <th className="p-2 text-center bg-gray-50">เสี่ยงสูง</th>
                                                                                    <th className="p-2 text-center bg-gray-50">อุบัติเหตุ</th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody>
                                                                                {(() => {
                                                                                    // Filter employees based on search query
                                                                                    const filteredEmployees = group.employees.filter((emp: any) => {
                                                                                        if (!groupSearchQuery) return true;
                                                                                        const query = groupSearchQuery.toLowerCase();
                                                                                        return (
                                                                                            emp.employeeId?.toLowerCase().includes(query) ||
                                                                                            emp.employeeName?.toLowerCase().includes(query)
                                                                                        );
                                                                                    });

                                                                                    if (filteredEmployees.length === 0) {
                                                                                        return (
                                                                                            <tr>
                                                                                                <td colSpan={5} className="p-4 text-center text-gray-500 text-xs">
                                                                                                    ไม่พบสมาชิกที่ค้นหา
                                                                                                </td>
                                                                                            </tr>
                                                                                        );
                                                                                    }

                                                                                    return filteredEmployees.map((emp: any, idx: number) => (
                                                                                        <tr key={idx} className="border-t hover:bg-gray-50">
                                                                                            <td className="p-2 font-medium text-gray-800">
                                                                                                <button
                                                                                                    onClick={() => handleViewEmployeeReports(emp)}
                                                                                                    className="text-left hover:text-blue-600 hover:underline cursor-pointer transition-colors"
                                                                                                >
                                                                                                    {emp.employeeName}
                                                                                                </button>
                                                                                            </td>
                                                                                            <td className="p-2 text-center text-gray-600">{emp.bbsCount}</td>
                                                                                            <td className="p-2 text-center">
                                                                                                {emp.ppeViolations > 0 ? (
                                                                                                    <button
                                                                                                        onClick={() => handleViewSheViolations(
                                                                                                            emp.sheReports?.filter((r: any) => r.level_accident === "PPE" || r.level_accident?.toLowerCase().includes("ppe")) || [],
                                                                                                            `รายละเอียด SHE - PPE: ${emp.employeeName}`
                                                                                                        )}
                                                                                                        className={`hover:underline cursor-pointer ${emp.ppeViolations >= 3 ? "text-red-600 font-bold" : "text-gray-600"}`}
                                                                                                    >
                                                                                                        {emp.ppeViolations} {emp.ppeViolations >= 3 && "❌"}
                                                                                                    </button>
                                                                                                ) : (
                                                                                                    <span className="text-gray-400">-</span>
                                                                                                )}
                                                                                            </td>
                                                                                            <td className="p-2 text-center">
                                                                                                {emp.highRiskViolations > 0 ? (
                                                                                                    <button
                                                                                                        onClick={() => handleViewSheViolations(
                                                                                                            emp.sheReports?.filter((r: any) => r.level_accident === "เสี่ยงสูง" || r.level_accident?.toLowerCase().includes("เสี่ยงสูง")) || [],
                                                                                                            `รายละเอียด SHE - เสี่ยงสูง: ${emp.employeeName}`
                                                                                                        )}
                                                                                                        className={`hover:underline cursor-pointer ${emp.highRiskViolations >= 2 ? "text-red-600 font-bold" : "text-gray-600"}`}
                                                                                                    >
                                                                                                        {emp.highRiskViolations} {emp.highRiskViolations >= 2 && "❌"}
                                                                                                    </button>
                                                                                                ) : (
                                                                                                    <span className="text-gray-400">-</span>
                                                                                                )}
                                                                                            </td>
                                                                                            <td className="p-2 text-center">
                                                                                                {emp.accidentViolations > 0 ? (
                                                                                                    <button
                                                                                                        onClick={() => handleViewSheViolations(
                                                                                                            emp.sheReports?.filter((r: any) => r.level_accident === "อุบัติเหตุ" || r.level_accident?.toLowerCase().includes("อุบัติเหตุ")) || [],
                                                                                                            `รายละเอียด SHE - อุบัติเหตุ: ${emp.employeeName}`
                                                                                                        )}
                                                                                                        className={`hover:underline cursor-pointer ${emp.accidentViolations >= 1 ? "text-red-600 font-bold" : "text-gray-600"}`}
                                                                                                    >
                                                                                                        {emp.accidentViolations} {emp.accidentViolations >= 1 && "❌"}
                                                                                                    </button>
                                                                                                ) : (
                                                                                                    <span className="text-gray-400">-</span>
                                                                                                )}
                                                                                            </td>
                                                                                        </tr>
                                                                                    ));
                                                                                })()}
                                                                            </tbody>
                                                                        </table>
                                                                    </div>
                                                                </AccordionContent>
                                                            </AccordionItem>
                                                        ))}
                                                    </Accordion>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {groupSearchQuery && payrollData.departments.every(dept => {
                                        const filteredSubGroups = dept.subGroups.filter(group =>
                                            group.employees.some((emp: any) => {
                                                const query = groupSearchQuery.toLowerCase();
                                                return (
                                                    (emp.employeeId && emp.employeeId.toLowerCase().includes(query)) ||
                                                    (emp.employeeName && emp.employeeName.toLowerCase().includes(query))
                                                );
                                            })
                                        );
                                        return filteredSubGroups.length === 0;
                                    }) && (
                                            <div className="text-center py-8 text-gray-500">
                                                ไม่พบผลการค้นหา "{groupSearchQuery}" ในกลุ่มใดๆ
                                            </div>
                                        )}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                )}

                {showLiseEmployeeSendReport && (
                    <EmployeeSendReport
                        setShowLiseEmployeeSendReport={setShowLiseEmployeeSendReport}
                        data={dataLiseEmployeeSendReport}
                        employeesInGroup={dataEmplooyeesInGroup}
                    />
                )}

                {/* Employee Report Details Dialog */}
                <Dialog open={showReportDetails} onOpenChange={setShowReportDetails}>
                    <DialogContent className="center min-w-[90dvw] max-h-[90vh] p-2 md:p-4">
                        <DialogHeader>
                            <DialogTitle className="text-[16px] font-bold md:text-2xl">
                                📋 รายละเอียดการส่งรายงาน BBS
                            </DialogTitle>
                            {selectedEmployee && (
                                <div className="mt-2 space-y-1">
                                    <p className="text-sm text-gray-600">
                                        <span className="font-semibold">รหัส:</span> {selectedEmployee.employeeId}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        <span className="font-semibold">ชื่อ:</span> {selectedEmployee.employeeName}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        <span className="font-semibold">แผนก:</span> {selectedEmployee.department}
                                        {selectedEmployee.group && ` (${selectedEmployee.group})`}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        <span className="font-semibold">จำนวนส่ง:</span> {selectedEmployee.bbsCount} ครั้ง
                                    </p>
                                </div>
                            )}
                        </DialogHeader>

                        {selectedEmployee && (
                            <div className="mt-4 overflow-x-hidden md:h-[100vh] h-[calc(100vh-100px)]">
                                <div className="rounded-lg border md:h-[calc(100vh-350px)] h-[calc(100vh-300px)] overflow-auto ">
                                    <table className="w-[1000px] md:w-full text-sm">
                                        <thead className="bg-gray-50 sticky top-0 z-10">
                                            <tr>
                                                <th className="p-3 text-left font-semibold">#</th>
                                                <th className="p-3 text-left font-semibold">วันที่ส่ง</th>
                                                <th className="p-3 text-left font-semibold">รายละเอียด</th>
                                                <th className="p-3 text-left font-semibold">แผนกที่สังเกต</th>
                                                <th className="p-3 text-center font-semibold">สถานะ</th>
                                            </tr>
                                        </thead>
                                        <tbody className="overflow-y-auto">
                                            {(() => {
                                                const currentMonthRange = getMonthlyRange(selectedMonth);
                                                const employeeReports = reports.filter(
                                                    r => r.employeeId === selectedEmployee.employeeId &&
                                                        new Date(r.submittedDate) >= currentMonthRange.start &&
                                                        new Date(r.submittedDate) <= currentMonthRange.end
                                                ).sort((a, b) => new Date(b.submittedDate).getTime() - new Date(a.submittedDate).getTime());

                                                if (employeeReports.length === 0) {
                                                    return (
                                                        <tr>
                                                            <td colSpan={6} className="p-8 text-center text-gray-500">
                                                                ไม่พบรายงานในเดือนนี้
                                                            </td>
                                                        </tr>
                                                    );
                                                }

                                                return employeeReports.map((report, index) => {
                                                    return (
                                                        <tr key={report.id || index} className="border-t hover:bg-gray-50">
                                                            <td className="p-3 text-gray-600">{index + 1}</td>
                                                            <td className="p-3">
                                                                {format(new Date(report.submittedDate), "dd/MM/yyyy HH:mm")}
                                                            </td>
                                                            <td className="p-3 max-w-md">
                                                                <div className="space-y-1">
                                                                    {report.observedWork && (
                                                                        <p className="text-gray-700">{report.observedWork}</p>
                                                                    )}
                                                                    {report.selectedOptions && report.selectedOptions.length > 0 && (
                                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                                            {report.selectedOptions.map((opt: string, i: number) => (
                                                                                <span key={i} className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                                                                                    {opt}
                                                                                </span>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="p-3 text-gray-600">
                                                                {report.observedDepartment || '-'}
                                                            </td>
                                                            <td className="p-3 text-center">
                                                                <Badge className={
                                                                    report.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                                        report.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                                            'bg-gray-100 text-gray-800'
                                                                }>
                                                                    {report.status === 'approved' ? 'อนุมัติ' :
                                                                        report.status === 'pending' ? 'รอดำเนินการ' :
                                                                            report.status}
                                                                </Badge>
                                                            </td>
                                                        </tr>
                                                    );
                                                });
                                            })()}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                {/* SHE Violation Details Dialog */}
                <Dialog open={showSheDetails} onOpenChange={setShowSheDetails}>
                    <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold">
                                ⚠️ {sheDetailsTitle}
                            </DialogTitle>
                            <p className="text-sm text-gray-600 mt-2">
                                จำนวนรายงานทั้งหมด: {selectedSheViolations.length} รายการ
                            </p>
                        </DialogHeader>

                        <div className="mt-4">
                            {selectedSheViolations.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">
                                    ไม่พบรายงาน SHE
                                </div>
                            ) : (
                                <div className="rounded-lg border overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="p-3 text-left font-semibold">#</th>
                                                <th className="p-3 text-left font-semibold">วันที่</th>
                                                <th className="p-3 text-left font-semibold">ระดับ</th>
                                                <th className="p-3 text-left font-semibold">รายละเอียด</th>
                                                <th className="p-3 text-left font-semibold">สถานที่</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedSheViolations.map((violation, index) => (
                                                <tr key={index} className="border-t hover:bg-gray-50">
                                                    <td className="p-3 text-gray-600">{index + 1}</td>
                                                    <td className="p-3">
                                                        {violation.date ? format(new Date(violation.date), "dd/MM/yyyy") : '-'}
                                                    </td>
                                                    <td className="p-3">
                                                        <Badge className={
                                                            violation.level_accident === "อุบัติเหตุ" ? "bg-red-100 text-red-800" :
                                                                violation.level_accident === "เสี่ยงสูง" ? "bg-orange-100 text-orange-800" :
                                                                    "bg-yellow-100 text-yellow-800"
                                                        }>
                                                            {violation.level_accident || 'ไม่ระบุ'}
                                                        </Badge>
                                                    </td>
                                                    <td className="p-3 max-w-md">
                                                        <div className="space-y-1">
                                                            {violation.description && (
                                                                <p className="text-gray-700">{violation.description}</p>
                                                            )}
                                                            {violation.detail && violation.detail !== violation.description && (
                                                                <p className="text-gray-600 text-xs">{violation.detail}</p>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="p-3 text-gray-600">
                                                        {violation.location || violation.area || '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        );
    }
);

PayrollReportSummary.displayName = "PayrollReportSummary";

export default PayrollReportSummary;
