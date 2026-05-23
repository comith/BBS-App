"use client";

import { type PayrollData } from "../../hooks/usePayrollData";

interface Props {
  summary: PayrollData["summary"];
}

export function PayrollSummaryCards({ summary }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <div className="text-3xl font-bold text-blue-600">
          {summary.totalIndividuals}
        </div>
        <div className="text-sm text-blue-700 mt-1">ITH-OE (รายบุคคล)</div>
      </div>
      <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
        <div className="text-3xl font-bold text-purple-600">
          {summary.totalGroups}
        </div>
        <div className="text-sm text-purple-700 mt-1">กลุ่มย่อย</div>
      </div>
      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
        <div className="text-3xl font-bold text-green-600">
          {summary.totalPaymentUnits}
        </div>
        <div className="text-sm text-green-700 mt-1">ได้รับเงิน</div>
      </div>
      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
        <div className="text-3xl font-bold text-yellow-600">
          {summary.eligibleIndividuals + summary.eligibleGroups}
        </div>
        <div className="text-sm text-yellow-700 mt-1">หน่วยผ่านเกณฑ์</div>
      </div>
      <div className="bg-red-50 p-4 rounded-lg border border-red-200">
        <div className="text-3xl font-bold text-red-600">
          {summary.totalUnits - summary.totalPaymentUnits}
        </div>
        <div className="text-sm text-red-700 mt-1">ไม่ผ่านเกณฑ์</div>
      </div>
    </div>
  );
}
