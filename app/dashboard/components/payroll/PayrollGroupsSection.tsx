"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Search } from "lucide-react";
import {
  type PayrollDepartment,
  type PayrollGroupEmployee,
} from "../../hooks/usePayrollData";

interface Props {
  departments: PayrollDepartment[];
  totalGroups: number;
  onViewEmployeeReports: (employee: PayrollGroupEmployee) => void;
  onViewSheViolations: (violations: any[], title: string) => void;
}

export function PayrollGroupsSection({
  departments,
  totalGroups,
  onViewEmployeeReports,
  onViewSheViolations,
}: Props) {
  const [groupSearchQuery, setGroupSearchQuery] = useState("");

  if (departments.length === 0) return null;

  return (
    <Accordion
      type="single"
      collapsible
      defaultValue="other-depts"
      className="border rounded-lg bg-white shadow-sm mt-6"
    >
      <AccordionItem value="other-depts" className="border-none">
        <AccordionTrigger className="px-4 hover:no-underline bg-purple-50 rounded-t-lg">
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-purple-700">
              🏢 แผนกอื่นๆ (คิดรายกลุ่ม)
            </span>
            <Badge
              variant="secondary"
              className="bg-white text-purple-700 border border-purple-200"
            >
              {totalGroups} กลุ่มย่อย
            </Badge>
          </div>
        </AccordionTrigger>
        <AccordionContent className="p-4 bg-gray-50">
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
            {departments.map((dept) => {
              const filteredSubGroups = dept.subGroups.filter((group) => {
                if (!groupSearchQuery) return true;

                const hasMatchingEmployee = group.employees.some(
                  (emp) => {
                    const query = groupSearchQuery.toLowerCase();
                    return (
                      (emp.employeeId &&
                        emp.employeeId.toLowerCase().includes(query)) ||
                      (emp.employeeName &&
                        emp.employeeName.toLowerCase().includes(query))
                    );
                  }
                );

                return hasMatchingEmployee;
              });

              if (groupSearchQuery && filteredSubGroups.length === 0) {
                return null;
              }

              return (
                <div
                  key={dept.departmentName}
                  className="bg-white rounded-lg border shadow-sm overflow-hidden"
                >
                  <div className="px-4 py-3 bg-gray-100 border-b flex justify-between items-center">
                    <div className="font-bold text-gray-700 text-lg">
                      {dept.departmentName}
                    </div>
                    <Badge variant="outline" className="bg-white">
                      {dept.totalEligibleSubGroups} / {dept.totalSubGroups}{" "}
                      กลุ่มผ่านเกณฑ์
                    </Badge>
                  </div>
                  <div className="p-2">
                    <Accordion
                      type="multiple"
                      className="space-y-2"
                      value={
                        groupSearchQuery
                          ? filteredSubGroups.map((g) => g.id)
                          : undefined
                      }
                    >
                      {filteredSubGroups.map((group) => (
                        <AccordionItem
                          key={group.id}
                          value={group.id}
                          className={`border rounded-md px-3 ${
                            group.isEligible
                              ? "bg-green-50/30 border-green-200"
                              : "bg-red-50/30 border-red-200"
                          }`}
                        >
                          <AccordionTrigger className="hover:no-underline py-2">
                            <div className="flex flex-1 items-center justify-between mr-2">
                              <div className="text-left flex items-center gap-3">
                                <span className="font-semibold text-sm text-gray-800">
                                  {group.name}
                                </span>
                                <span className="text-xs text-gray-500">
                                  (สมาชิก {group.totalEmployees} คน | ส่งรวม{" "}
                                  {group.totalBbsCount}/12)
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                {group.isEligible ? (
                                  <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-green-200">
                                    ได้รับเงิน 💰
                                  </Badge>
                                ) : (
                                  <Badge className="bg-red-100 text-red-800 hover:bg-red-200 border-red-200">
                                    ไม่ได้รับ ❌
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pb-3 pt-0">
                            <div className="mt-2 text-xs text-gray-600 mb-2 pl-1">
                              {group.isEligible ? (
                                <span className="text-green-600">
                                  ✓ ยอดส่งรวม {group.totalBbsCount} ครั้ง (เป้า
                                  12) | ไม่มีการรายงานจาก SHE เกินเกณฑ์
                                </span>
                              ) : (
                                <span className="text-red-600">
                                  ✗{" "}
                                  {group.totalBbsCount < 12
                                    ? `ยอดส่งรวมไม่ถึง (${group.totalBbsCount}/12)`
                                    : ""}
                                  {group.hasGroupShePenalty && (
                                    <span>
                                      {group.totalBbsCount < 12 ? " | " : ""}
                                      พบสมาชิกในกลุ่มมีบันทึก SHE
                                      (ตัดสิทธิ์ทั้งกลุ่ม)
                                    </span>
                                  )}
                                </span>
                              )}
                            </div>
                            <div className="bg-white rounded border overflow-x-auto">
                              <table className="w-[600px] md:w-full text-xs">
                                <thead className="bg-gray-50 text-gray-600">
                                  <tr>
                                    <th className="p-2 text-left bg-gray-50">
                                      ชื่อ-นามสกุล
                                    </th>
                                    <th className="p-2 text-center bg-gray-50">
                                      จำนวนส่ง
                                    </th>
                                    <th className="p-2 text-center bg-gray-50">
                                      PPE
                                    </th>
                                    <th className="p-2 text-center bg-gray-50">
                                      เสี่ยงสูง
                                    </th>
                                    <th className="p-2 text-center bg-gray-50">
                                      อุบัติเหตุ
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {(() => {
                                    const filteredEmployees =
                                      group.employees.filter((emp) => {
                                        if (!groupSearchQuery) return true;
                                        const query =
                                          groupSearchQuery.toLowerCase();
                                        return (
                                          emp.employeeId
                                            ?.toLowerCase()
                                            .includes(query) ||
                                          emp.employeeName
                                            ?.toLowerCase()
                                            .includes(query)
                                        );
                                      });

                                    if (filteredEmployees.length === 0) {
                                      return (
                                        <tr>
                                          <td
                                            colSpan={5}
                                            className="p-4 text-center text-gray-500 text-xs"
                                          >
                                            ไม่พบสมาชิกที่ค้นหา
                                          </td>
                                        </tr>
                                      );
                                    }

                                    return filteredEmployees.map(
                                      (emp, idx) => (
                                        <tr
                                          key={idx}
                                          className="border-t hover:bg-gray-50"
                                        >
                                          <td className="p-2 font-medium text-gray-800">
                                            <button
                                              onClick={() =>
                                                onViewEmployeeReports(emp)
                                              }
                                              className="text-left hover:text-blue-600 hover:underline cursor-pointer transition-colors"
                                            >
                                              {emp.employeeName}
                                            </button>
                                          </td>
                                          <td className="p-2 text-center text-gray-600">
                                            {emp.bbsCount}
                                          </td>
                                          <td className="p-2 text-center">
                                            {emp.ppeViolations > 0 ? (
                                              <button
                                                onClick={() =>
                                                  onViewSheViolations(
                                                    emp.sheReports?.filter(
                                                      (r: any) =>
                                                        r.level_accident ===
                                                          "PPE" ||
                                                        r.level_accident
                                                          ?.toLowerCase()
                                                          .includes("ppe")
                                                    ) || [],
                                                    `รายละเอียด SHE - PPE: ${emp.employeeName}`
                                                  )
                                                }
                                                className={`hover:underline cursor-pointer ${
                                                  emp.ppeViolations >= 3
                                                    ? "text-red-600 font-bold"
                                                    : "text-gray-600"
                                                }`}
                                              >
                                                {emp.ppeViolations}{" "}
                                                {emp.ppeViolations >= 3 &&
                                                  "❌"}
                                              </button>
                                            ) : (
                                              <span className="text-gray-400">
                                                -
                                              </span>
                                            )}
                                          </td>
                                          <td className="p-2 text-center">
                                            {emp.highRiskViolations > 0 ? (
                                              <button
                                                onClick={() =>
                                                  onViewSheViolations(
                                                    emp.sheReports?.filter(
                                                      (r: any) =>
                                                        r.level_accident ===
                                                          "เสี่ยงสูง" ||
                                                        r.level_accident
                                                          ?.toLowerCase()
                                                          .includes(
                                                            "เสี่ยงสูง"
                                                          )
                                                    ) || [],
                                                    `รายละเอียด SHE - เสี่ยงสูง: ${emp.employeeName}`
                                                  )
                                                }
                                                className={`hover:underline cursor-pointer ${
                                                  emp.highRiskViolations >= 2
                                                    ? "text-red-600 font-bold"
                                                    : "text-gray-600"
                                                }`}
                                              >
                                                {emp.highRiskViolations}{" "}
                                                {emp.highRiskViolations >=
                                                  2 && "❌"}
                                              </button>
                                            ) : (
                                              <span className="text-gray-400">
                                                -
                                              </span>
                                            )}
                                          </td>
                                          <td className="p-2 text-center">
                                            {emp.accidentViolations > 0 ? (
                                              <button
                                                onClick={() =>
                                                  onViewSheViolations(
                                                    emp.sheReports?.filter(
                                                      (r: any) =>
                                                        r.level_accident ===
                                                          "อุบัติเหตุ" ||
                                                        r.level_accident
                                                          ?.toLowerCase()
                                                          .includes(
                                                            "อุบัติเหตุ"
                                                          )
                                                    ) || [],
                                                    `รายละเอียด SHE - อุบัติเหตุ: ${emp.employeeName}`
                                                  )
                                                }
                                                className={`hover:underline cursor-pointer ${
                                                  emp.accidentViolations >= 1
                                                    ? "text-red-600 font-bold"
                                                    : "text-gray-600"
                                                }`}
                                              >
                                                {emp.accidentViolations}{" "}
                                                {emp.accidentViolations >=
                                                  1 && "❌"}
                                              </button>
                                            ) : (
                                              <span className="text-gray-400">
                                                -
                                              </span>
                                            )}
                                          </td>
                                        </tr>
                                      )
                                    );
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

            {groupSearchQuery &&
              departments.every((dept) => {
                const filteredSubGroups = dept.subGroups.filter((group) =>
                  group.employees.some((emp) => {
                    const query = groupSearchQuery.toLowerCase();
                    return (
                      (emp.employeeId &&
                        emp.employeeId.toLowerCase().includes(query)) ||
                      (emp.employeeName &&
                        emp.employeeName.toLowerCase().includes(query))
                    );
                  })
                );
                return filteredSubGroups.length === 0;
              }) && (
                <div className="text-center py-8 text-gray-500">
                  {`ไม่พบผลการค้นหา "${groupSearchQuery}" ในกลุ่มใดๆ`}
                </div>
              )}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
