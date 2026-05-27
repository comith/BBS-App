"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { type Report } from "../types";
import {
  type EmployeeInfoLoose,
  getMonthlyRange,
  isIndividual,
  isManagerGroup,
} from "../utils/payrollHelpers";

interface EmployeeInfo {
  employeeId: string;
  employeeName: string;
  department: string;
  group: string;
  [key: string]: any;
}

export interface PayrollIndividual {
  employeeId: string;
  employeeName: string;
  department: string;
  group: string;
  bbsCount: number;
  bbsTarget: number;
  meetsBbsRequirement: boolean;
  ppeViolations: number;
  highRiskViolations: number;
  accidentViolations: number;
  hasShePenalty: boolean;
  sheViolationReasons: string[];
  isEligible: boolean;
  paymentStatus: string;
  statusColor: string;
  monthlyRange: { start: Date; end: Date };
  isSpecialIndividual: boolean;
  sheReports: any[];
  [key: string]: any;
}

export interface PayrollGroupEmployee {
  employeeId: string;
  employeeName: string;
  department: string;
  group: string;
  bbsCount: number;
  ppeViolations: number;
  highRiskViolations: number;
  accidentViolations: number;
  hasShePenalty: boolean;
  sheReports: any[];
  [key: string]: any;
}

export interface PayrollSubGroup {
  id: string;
  name: string;
  department: string;
  totalEmployees: number;
  totalBbsCount: number;
  isEligible: boolean;
  employees: PayrollGroupEmployee[];
  statusColor: string;
  totalGroupPpeViolations: number;
  totalGroupHighRiskViolations: number;
  totalGroupAccidentViolations: number;
  hasGroupShePenalty: boolean;
}

export interface PayrollDepartment {
  departmentName: string;
  subGroups: PayrollSubGroup[];
  totalSubGroups: number;
  totalEligibleSubGroups: number;
}

export interface PayrollData {
  monthRange: { start: Date; end: Date };
  individuals: PayrollIndividual[];
  departments: PayrollDepartment[];
  summary: {
    totalIndividuals: number;
    totalGroups: number;
    eligibleIndividuals: number;
    eligibleGroups: number;
    totalPaymentUnits: number;
    totalUnits: number;
  };
}

export interface UsePayrollDataResult {
  selectedMonth: Date;
  setSelectedMonth: React.Dispatch<React.SetStateAction<Date>>;
  changeMonth: (direction: "prev" | "next") => void;
  sheViolations: any[];
  isLoadingShe: boolean;
  fetchSheViolations: () => Promise<void>;
  payrollData: PayrollData;
}

export function usePayrollData(
  reports: Report[],
  employeeList: EmployeeInfo[]
): UsePayrollDataResult {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [sheViolations, setSheViolations] = useState<any[]>([]);
  const [isLoadingShe, setIsLoadingShe] = useState(false);

  const fetchSheViolations = useCallback(async () => {
    setIsLoadingShe(true);
    try {
      const response = await fetch("/api/get?type=she_violations");
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
  }, []);

  useEffect(() => {
    fetchSheViolations();
  }, [fetchSheViolations]);

  const changeMonth = useCallback((direction: "prev" | "next") => {
    setSelectedMonth((prev) => {
      const newDate = new Date(prev);
      const offset = direction === "prev" ? -1 : 1;
      newDate.setMonth(newDate.getMonth() + offset);
      return newDate;
    });
  }, []);

  const payrollData = useMemo<PayrollData>(() => {
    const monthlyRange = getMonthlyRange(selectedMonth);
    const rangeStart = monthlyRange.start.getTime();
    const rangeEnd = monthlyRange.end.getTime();

    const transformedEmployeeList: EmployeeInfoLoose[] = employeeList.map(
      (emp) => ({
        ...emp,
        employeeId: emp.employeeId || emp.employeerId || "",
        employeeName: emp.employeeName || emp.fullName || "",
        group: emp.group || "No Subgroup",
      })
    );

    const monthlyReports = reports.filter((r) => {
      const t = new Date(r.submittedDate).getTime();
      return t >= rangeStart && t <= rangeEnd && r.status === "approved";
    });

    // Index 1: count of approved monthly reports per employeeId
    const reportCountByEmp = new Map<string, number>();
    for (const r of monthlyReports) {
      reportCountByEmp.set(
        r.employeeId,
        (reportCountByEmp.get(r.employeeId) ?? 0) + 1
      );
    }

    // Index 2: SHE violations per employee within range, pre-categorised
    type SheBucket = {
      all: any[];
      ppe: number;
      highRisk: number;
      accident: number;
    };
    const sheByEmp = new Map<string, SheBucket>();
    for (const v of sheViolations) {
      const t = new Date(v.date).getTime();
      if (isNaN(t) || t < rangeStart || t > rangeEnd) continue;
      const empId = v.employee_code;
      if (!empId) continue;
      let b = sheByEmp.get(empId);
      if (!b) {
        b = { all: [], ppe: 0, highRisk: 0, accident: 0 };
        sheByEmp.set(empId, b);
      }
      b.all.push(v);
      const lvl = v.level_accident;
      const lvlLower = lvl?.toLowerCase?.() ?? "";
      if (lvl === "PPE" || lvlLower.includes("ppe")) b.ppe++;
      if (lvl === "เสี่ยงสูง" || lvlLower.includes("เสี่ยงสูง"))
        b.highRisk++;
      if (lvl === "อุบัติเหตุ" || lvlLower.includes("อุบัติเหตุ"))
        b.accident++;
    }
    const emptyShe: SheBucket = {
      all: [],
      ppe: 0,
      highRisk: 0,
      accident: 0,
    };
    const getShe = (empId: string) => sheByEmp.get(empId) ?? emptyShe;

    const individualEmployees = transformedEmployeeList.filter(isIndividual);
    const groupEmployees = transformedEmployeeList.filter(
      (emp) => !isIndividual(emp) && !isManagerGroup(emp.group)
    );

    // Process Individual Results (ITH-OE + Special Groups ending in 0)
    const individualResults: PayrollIndividual[] = individualEmployees.map(
      (employee) => {
        const bbsCount = reportCountByEmp.get(employee.employeeId) ?? 0;
        const bbsTarget = 12;
        const meetsBbsRequirement = bbsCount >= bbsTarget;

        const she = getShe(employee.employeeId);
        const sheReports = she.all;
        const ppeViolations = she.ppe;
        const highRiskViolations = she.highRisk;
        const accidentViolations = she.accident;

        const sheViolationReasons: string[] = [];
        if (ppeViolations >= 1)
          sheViolationReasons.push(`PPE (${ppeViolations} ครั้ง)`);
        if (highRiskViolations >= 1)
          sheViolationReasons.push(`เสี่ยงสูง (${highRiskViolations} ครั้ง)`);
        if (accidentViolations >= 1)
          sheViolationReasons.push(`อุบัติเหตุ (${accidentViolations} ครั้ง)`);
        const hasShePenalty = sheViolationReasons.length > 0;

        const isEligible = meetsBbsRequirement && !hasShePenalty;
        let paymentStatus = "";
        let statusColor = "";

        if (isEligible) {
          paymentStatus = "ได้รับเงิน";
          statusColor = "bg-green-100 text-green-800";
        } else {
          const reasons: string[] = [];
          if (!meetsBbsRequirement)
            reasons.push(`BBS ไม่ครบ (${bbsCount}/${bbsTarget})`);
          if (hasShePenalty)
            reasons.push(`SHE: ${sheViolationReasons.join(", ")}`);
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
          isSpecialIndividual:
            employee.department !== "ITH-OE" && !!employee.group,
          sheReports,
        };
      }
    );

    // Build groups from actual reports (source of truth for group membership)
    const reportBasedGroups: {
      [deptKey: string]: { [groupKey: string]: Set<string> };
    } = {};

    // Source of Truth 1: Employee List (Static Membership)
    groupEmployees.forEach((emp) => {
      const dept = emp.department || "Unknown Department";

      if (dept === "ITH-OE") return;

      const rawGroup = emp.group || "General";
      const groups = rawGroup
        .split(",")
        .map((g) => g.trim())
        .filter((g) => g !== "");

      groups.forEach((grp) => {
        if (grp.endsWith("0") && !grp.match(/\d{2,}$/)) return;

        if (!reportBasedGroups[dept]) reportBasedGroups[dept] = {};
        if (!reportBasedGroups[dept][grp])
          reportBasedGroups[dept][grp] = new Set();
        reportBasedGroups[dept][grp].add(emp.employeeId);
      });
    });

    // Source of Truth 2: Reports (Dynamic Activity)
    monthlyReports.forEach((report) => {
      const dept = report.department || "Unknown Department";
      const grp = report.group || "General";
      const empId = report.employeeId;

      if (dept === "ITH-OE") return;

      const trimmedGroup = grp.trim();
      if (trimmedGroup.endsWith("0") && !trimmedGroup.match(/\d{2,}$/))
        return;

      if (!reportBasedGroups[dept]) reportBasedGroups[dept] = {};
      if (!reportBasedGroups[dept][grp])
        reportBasedGroups[dept][grp] = new Set();
      reportBasedGroups[dept][grp].add(empId);
    });

    const departmentResults: PayrollDepartment[] = Object.keys(
      reportBasedGroups
    )
      .sort()
      .map((deptName) => {
        const deptGroups = reportBasedGroups[deptName];

        const calculatedSubGroups: PayrollSubGroup[] = Object.keys(
          deptGroups
        ).map((groupName) => {
          const employeeIds = Array.from(deptGroups[groupName]);

          const employeeStats: PayrollGroupEmployee[] = employeeIds.map(
            (empId) => {
              const empInfo = transformedEmployeeList.find(
                (e) => e.employeeId === empId
              ) || {
                employeeId: empId,
                employeeName: empId,
                department: deptName,
                group: groupName,
              };

              const bbsCount = reportCountByEmp.get(empId) ?? 0;

              const empShe = getShe(empId);
              const empSheReports = empShe.all;
              const ppeViolations = empShe.ppe;
              const highRiskViolations = empShe.highRisk;
              const accidentViolations = empShe.accident;

              const hasShePenalty =
                ppeViolations >= 1 ||
                highRiskViolations >= 1 ||
                accidentViolations >= 1;

              return {
                ...empInfo,
                bbsCount,
                ppeViolations,
                highRiskViolations,
                accidentViolations,
                hasShePenalty,
                sheReports: empSheReports,
              };
            }
          );

          const totalBbsCount = employeeStats.reduce(
            (sum, emp) => sum + emp.bbsCount,
            0
          );
          const isBbsPassed = totalBbsCount >= 12;

          const totalGroupPpeViolations = employeeStats.reduce(
            (sum, emp) => sum + emp.ppeViolations,
            0
          );
          const totalGroupHighRiskViolations = employeeStats.reduce(
            (sum, emp) => sum + emp.highRiskViolations,
            0
          );
          const totalGroupAccidentViolations = employeeStats.reduce(
            (sum, emp) => sum + emp.accidentViolations,
            0
          );

          // If ANY employee in the group has a SHE violation, the whole group is disqualified.
          const hasGroupShePenalty = employeeStats.some(
            (emp) => emp.hasShePenalty
          );

          const isEligible = isBbsPassed && !hasGroupShePenalty;

          return {
            id: `group-${deptName}-${groupName}`,
            name: groupName,
            department: deptName,
            totalEmployees: employeeStats.length,
            totalBbsCount,
            isEligible,
            employees: employeeStats,
            statusColor: isEligible
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800",
            totalGroupPpeViolations,
            totalGroupHighRiskViolations,
            totalGroupAccidentViolations,
            hasGroupShePenalty,
          };
        });

        // Sort subgroups: Eligible first, then by name
        calculatedSubGroups.sort((a, b) => {
          if (a.isEligible === b.isEligible)
            return a.name.localeCompare(b.name);
          return a.isEligible ? -1 : 1;
        });

        return {
          departmentName: deptName,
          subGroups: calculatedSubGroups,
          totalSubGroups: calculatedSubGroups.length,
          totalEligibleSubGroups: calculatedSubGroups.filter(
            (g) => g.isEligible
          ).length,
        };
      });

    // Deduplicate employees appearing in multiple groups (especially 2EN supervisors)
    // to prevent duplicate payments or missing out.
    const employeeGroupMap = new Map<
      string,
      {
        deptIndex: number;
        groupIndex: number;
        isEligible: boolean;
        hasShePenalty: boolean;
      }[]
    >();

    departmentResults.forEach((dept, dIdx) => {
      dept.subGroups.forEach((group, gIdx) => {
        group.employees.forEach((emp) => {
          if (!employeeGroupMap.has(emp.employeeId)) {
            employeeGroupMap.set(emp.employeeId, []);
          }
          employeeGroupMap.get(emp.employeeId)!.push({
            deptIndex: dIdx,
            groupIndex: gIdx,
            isEligible: group.isEligible,
            hasShePenalty: emp.hasShePenalty,
          });
        });
      });
    });

    employeeGroupMap.forEach((occurrences, empId) => {
      if (occurrences.length > 1) {
        let bestIndex = 0;
        let bestScore = -1;

        // Find the absolute best group for this employee
        for (let i = 0; i < occurrences.length; i++) {
          const occ = occurrences[i];
          const group =
            departmentResults[occ.deptIndex].subGroups[occ.groupIndex];
          
          let score = 0;
          if (group.isEligible) score += 100000;
          if (!occ.hasShePenalty) score += 10000;
          
          // Tie-breaker: choose the group with more overall BBS activity
          score += group.totalBbsCount;
          
          if (score > bestScore) {
            bestScore = score;
            bestIndex = i;
          }
        }

        // Keep the best one, remove from others
        for (let i = 0; i < occurrences.length; i++) {
          if (i !== bestIndex) {
            const occ = occurrences[i];
            const group =
              departmentResults[occ.deptIndex].subGroups[occ.groupIndex];
            group.employees = group.employees.filter(
              (e) => e.employeeId !== empId
            );
          }
        }
        
        if (empId.startsWith("2EN")) {
          console.log(`[DEDUP DEBUG] Employee ${empId} occurrences: ${occurrences.length}`);
          for (let i = 0; i < occurrences.length; i++) {
            const occ = occurrences[i];
            const group = departmentResults[occ.deptIndex].subGroups[occ.groupIndex];
            console.log(`  Group ${group.name} | isEligible: ${group.isEligible} | bbs: ${group.totalBbsCount} | Chosen: ${i === bestIndex}`);
          }
        }
      }
    });

    // Re-calculate total employees after deduplication
    departmentResults.forEach((dept) => {
      dept.subGroups.forEach((group) => {
        group.totalEmployees = group.employees.length;
      });
    });

    departmentResults.sort((a, b) =>
      a.departmentName.localeCompare(b.departmentName)
    );

    const totalGroupsCount = departmentResults.reduce(
      (acc, dept) => acc + dept.totalSubGroups,
      0
    );
    const totalEligibleGroupsCount = departmentResults.reduce(
      (acc, dept) => acc + dept.totalEligibleSubGroups,
      0
    );

    return {
      monthRange: monthlyRange,
      individuals: individualResults,
      departments: departmentResults,
      summary: {
        totalIndividuals: individualResults.length,
        totalGroups: totalGroupsCount,
        eligibleIndividuals: individualResults.filter((e) => e.isEligible)
          .length,
        eligibleGroups: totalEligibleGroupsCount,
        totalPaymentUnits:
          individualResults.filter((e) => e.isEligible).length +
          totalEligibleGroupsCount,
        totalUnits: individualResults.length + totalGroupsCount,
      },
    };
  }, [reports, sheViolations, selectedMonth, employeeList]);

  return {
    selectedMonth,
    setSelectedMonth,
    changeMonth,
    sheViolations,
    isLoadingShe,
    fetchSheViolations,
    payrollData,
  };
}
