"use client";

import { type PayrollData } from "../../hooks/usePayrollData";
import { cn } from "@/lib/utils";

interface Props {
  summary: PayrollData["summary"];
}

export function PayrollSummaryCards({ summary }: Props) {
  const cards = [
    {
      value: summary.totalIndividuals,
      label: "ITH-OE (รายบุคคล)",
      color: "text-blue-600",
      bg: "bg-blue-50/80",
      border: "border-blue-100",
      labelColor: "text-blue-700",
    },
    {
      value: summary.totalGroups,
      label: "กลุ่มย่อย",
      color: "text-purple-600",
      bg: "bg-purple-50/80",
      border: "border-purple-100",
      labelColor: "text-purple-700",
    },
    {
      value: summary.totalPaymentUnits,
      label: "ได้รับเงิน",
      color: "text-emerald-600",
      bg: "bg-emerald-50/80",
      border: "border-emerald-100",
      labelColor: "text-emerald-700",
    },
    {
      value: summary.eligibleIndividuals + summary.eligibleGroups,
      label: "หน่วยผ่านเกณฑ์",
      color: "text-amber-600",
      bg: "bg-amber-50/80",
      border: "border-amber-100",
      labelColor: "text-amber-700",
    },
    {
      value: summary.totalUnits - summary.totalPaymentUnits,
      label: "ไม่ผ่านเกณฑ์",
      color: "text-rose-600",
      bg: "bg-rose-50/80",
      border: "border-rose-100",
      labelColor: "text-rose-700",
    },
  ];

  return (
    <div className="flex overflow-x-auto no-scrollbar gap-3 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 snap-x">
      {cards.map((card, idx) => (
        <div 
          key={idx}
          className={cn(
            "snap-center min-w-[140px] flex-shrink-0 flex-1 p-4 rounded-2xl border shadow-sm relative overflow-hidden transition-transform active:scale-95",
            card.bg,
            card.border
          )}
        >
          <div className={cn("absolute -right-4 -top-4 w-16 h-16 rounded-full opacity-30 blur-xl bg-white")} />
          <div className={cn("text-3xl font-bold mb-1", card.color)}>
            {card.value}
          </div>
          <div className={cn("text-xs font-medium", card.labelColor)}>
            {card.label}
          </div>
        </div>
      ))}
    </div>
  );
}
