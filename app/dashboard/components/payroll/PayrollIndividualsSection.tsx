"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ChevronLeft, ChevronRight, Filter, Search } from "lucide-react";
import { type PayrollIndividual } from "../../hooks/usePayrollData";

interface Props {
  individuals: PayrollIndividual[];
  onViewEmployeeReports: (employee: PayrollIndividual) => void;
  onViewSheViolations: (violations: any[], title: string) => void;
}

const ITEMS_PER_PAGE = 25;

export function PayrollIndividualsSection({
  individuals,
  onViewEmployeeReports,
  onViewSheViolations,
}: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "eligible" | "ineligible"
  >("eligible");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredIndividuals = useMemo(() => {
    return individuals
      .filter((emp) => {
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          return (
            emp.employeeId?.toLowerCase().includes(query) ||
            emp.employeeName?.toLowerCase().includes(query) ||
            emp.group?.toLowerCase().includes(query)
          );
        }
        return true;
      })
      .filter((emp) => {
        if (statusFilter === "eligible") return emp.isEligible;
        if (statusFilter === "ineligible") return !emp.isEligible;
        return true;
      });
  }, [individuals, searchQuery, statusFilter]);

  const totalPages = Math.ceil(filteredIndividuals.length / ITEMS_PER_PAGE);
  const paginatedIndividuals = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredIndividuals.slice(startIndex, endIndex);
  }, [filteredIndividuals, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  if (individuals.length === 0) return null;

  return (
    <Accordion
      type="single"
      collapsible
      defaultValue="individuals"
      className="border rounded-lg bg-white shadow-sm"
    >
      <AccordionItem value="individuals" className="border-none">
        <AccordionTrigger className="px-4 hover:no-underline bg-blue-50 rounded-t-lg">
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-blue-700">
              🧑‍💼 คิดรายบุคคล (ITH-OE)
            </span>
            <Badge
              variant="secondary"
              className="bg-white text-blue-700 border border-blue-200"
            >
              {individuals.length} คน
            </Badge>
          </div>
        </AccordionTrigger>
        <AccordionContent className="p-4">
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
                ทั้งหมด ({individuals.length})
              </Button>
              <Button
                size="sm"
                variant={statusFilter === "eligible" ? "default" : "outline"}
                onClick={() => setStatusFilter("eligible")}
                className={
                  statusFilter === "eligible"
                    ? "bg-green-600 hover:bg-green-700"
                    : ""
                }
              >
                💰 ได้รับ ({individuals.filter((e) => e.isEligible).length})
              </Button>
              <Button
                size="sm"
                variant={
                  statusFilter === "ineligible" ? "default" : "outline"
                }
                onClick={() => setStatusFilter("ineligible")}
                className={
                  statusFilter === "ineligible"
                    ? "bg-red-600 hover:bg-red-700"
                    : ""
                }
              >
                ❌ ไม่ได้รับ ({individuals.filter((e) => !e.isEligible).length})
              </Button>
            </div>
          </div>

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
                  <tr
                    key={employee.employeeId || `emp-${index}`}
                    className="border-b last:border-0 hover:bg-gray-50"
                  >
                    <td className="p-2 font-mono text-xs text-gray-600">
                      {employee.employeeId}
                    </td>
                    <td className="p-2 font-medium">
                      <button
                        onClick={() => onViewEmployeeReports(employee)}
                        className="text-left hover:text-blue-600 hover:underline cursor-pointer transition-colors"
                      >
                        {employee.employeeName}
                      </button>
                    </td>
                    <td className="p-2 text-xs text-gray-500">
                      {employee.department === "ITH-OE"
                        ? "ITH-OE"
                        : `${employee.department} (${employee.group})`}
                    </td>
                    <td className="p-2 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          employee.meetsBbsRequirement
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {employee.bbsCount}/12{" "}
                        {employee.meetsBbsRequirement ? "✓" : ""}
                      </span>
                    </td>
                    <td className="p-2 text-center">
                      {employee.ppeViolations > 0 ? (
                        <button
                          onClick={() =>
                            onViewSheViolations(
                              employee.sheReports?.filter(
                                (r: any) =>
                                  r.level_accident === "PPE" ||
                                  r.level_accident
                                    ?.toLowerCase()
                                    .includes("ppe")
                              ) || [],
                              `รายละเอียด SHE - PPE: ${employee.employeeName}`
                            )
                          }
                          className={`hover:underline cursor-pointer ${
                            employee.ppeViolations >= 1
                              ? "text-red-600 font-bold"
                              : "text-gray-600"
                          }`}
                        >
                          {employee.ppeViolations}{" "}
                          {employee.ppeViolations >= 1 && "❌"}
                        </button>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="p-2 text-center">
                      {employee.highRiskViolations > 0 ? (
                        <button
                          onClick={() =>
                            onViewSheViolations(
                              employee.sheReports?.filter(
                                (r: any) =>
                                  r.level_accident === "เสี่ยงสูง" ||
                                  r.level_accident
                                    ?.toLowerCase()
                                    .includes("เสี่ยงสูง")
                              ) || [],
                              `รายละเอียด SHE - เสี่ยงสูง: ${employee.employeeName}`
                            )
                          }
                          className={`hover:underline cursor-pointer ${
                            employee.highRiskViolations >= 1
                              ? "text-red-600 font-bold"
                              : "text-gray-600"
                          }`}
                        >
                          {employee.highRiskViolations}{" "}
                          {employee.highRiskViolations >= 1 && "❌"}
                        </button>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="p-2 text-center">
                      {employee.accidentViolations > 0 ? (
                        <button
                          onClick={() =>
                            onViewSheViolations(
                              employee.sheReports?.filter(
                                (r: any) =>
                                  r.level_accident === "อุบัติเหตุ" ||
                                  r.level_accident
                                    ?.toLowerCase()
                                    .includes("อุบัติเหตุ")
                              ) || [],
                              `รายละเอียด SHE - อุบัติเหตุ: ${employee.employeeName}`
                            )
                          }
                          className={`hover:underline cursor-pointer ${
                            employee.accidentViolations >= 1
                              ? "text-red-600 font-bold"
                              : "text-gray-600"
                          }`}
                        >
                          {employee.accidentViolations}{" "}
                          {employee.accidentViolations >= 1 && "❌"}
                        </button>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="p-2 text-center">
                      {employee.isEligible ? (
                        <span className="text-2xl" title="ได้รับเงิน">
                          💰
                        </span>
                      ) : (
                        <span
                          className="text-xl text-red-500"
                          title="ไม่ได้รับเงิน"
                        >
                          ❌
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredIndividuals.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="p-8 text-center text-gray-500"
                    >
                      ไม่พบข้อมูลที่ค้นหา
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                หน้า {currentPage} / {totalPages} (แสดง{" "}
                {(currentPage - 1) * ITEMS_PER_PAGE + 1}-
                {Math.min(
                  currentPage * ITEMS_PER_PAGE,
                  filteredIndividuals.length
                )}{" "}
                จาก {filteredIndividuals.length})
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" /> ก่อนหน้า
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  ถัดไป <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
