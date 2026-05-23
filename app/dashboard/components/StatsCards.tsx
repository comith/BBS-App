"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  Bike,
  Calendar,
  Check,
  Clock,
  FileText,
  HardHat,
  ReceiptText,
  Wrench,
} from "lucide-react";
import { type ReportStats } from "../hooks/useReports";
import { cn } from "@/lib/utils";

interface Props {
  stats: ReportStats;
  isLoading: boolean;
}

export function StatsCards({ stats, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="flex overflow-x-auto no-scrollbar gap-4 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="min-w-[140px] flex-shrink-0 border-slate-100 shadow-sm rounded-2xl animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-slate-200 rounded mb-2 w-16"></div>
              <div className="h-8 bg-slate-200 rounded w-10"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const overviewCards = [
    {
      label: "รออนุมัติ",
      value: stats.pending,
      icon: Clock,
      colorClass: "text-yellow-600",
      bgClass: "bg-yellow-100/50",
    },
    {
      label: "อนุมัติแล้ว",
      value: stats.approved,
      icon: Check,
      colorClass: "text-green-600",
      bgClass: "bg-green-100/50",
    },
    {
      label: "วันนี้",
      value: stats.todayReports,
      icon: Calendar,
      colorClass: "text-blue-600",
      bgClass: "bg-blue-100/50",
    },
    {
      label: "ทั้งหมด",
      value: stats.total,
      icon: FileText,
      colorClass: "text-slate-700",
      bgClass: "bg-slate-100",
    },
  ];

  const categoryCards = [
    {
      label: "PPE",
      value: stats.ppe,
      safe: stats.ppe_safe,
      unsafe: stats.ppe_unsafe,
      icon: HardHat,
      colorClass: "text-orange-600",
      bgClass: "bg-orange-50",
    },
    {
      label: "เครื่องมือ",
      value: stats.tools,
      safe: stats.tools_safe,
      unsafe: stats.tools_unsafe,
      icon: Wrench,
      colorClass: "text-indigo-600",
      bgClass: "bg-indigo-50",
    },
    {
      label: "การกระทำ",
      value: stats.unsafe_actions,
      safe: stats.unsafe_actions_safe,
      unsafe: stats.unsafe_actions_unsafe,
      icon: Bike,
      colorClass: "text-rose-600",
      bgClass: "bg-rose-50",
    },
    {
      label: "สภาพแวดล้อม",
      value: stats.unsafe_condition,
      safe: stats.unsafe_condition_safe,
      unsafe: stats.unsafe_condition_unsafe,
      icon: ReceiptText,
      colorClass: "text-cyan-600",
      bgClass: "bg-cyan-50",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Overview Carousel */}
      <div>
        <h2 className="text-sm font-semibold text-slate-800 mb-3 px-1">ภาพรวมรายงาน</h2>
        <div className="flex overflow-x-auto no-scrollbar gap-3 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 snap-x snap-mandatory">
          {overviewCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div 
                key={idx} 
                className={cn(
                  "snap-center min-w-[130px] sm:min-w-[150px] flex-shrink-0 flex-1 bg-white rounded-2xl border border-slate-100 shadow-sm p-4 relative overflow-hidden",
                  "active:scale-95 transition-transform"
                )}
              >
                <div className={cn("absolute -right-4 -top-4 w-16 h-16 rounded-full opacity-20 blur-xl", card.bgClass)} />
                <div className="flex flex-col gap-2">
                  <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", card.bgClass)}>
                    <Icon className={cn("w-4 h-4", card.colorClass)} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900 leading-none mb-1">{card.value}</p>
                    <p className="text-xs font-medium text-slate-500">{card.label}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Categories Grid */}
      <div>
        <h2 className="text-sm font-semibold text-slate-800 mb-3 px-1">แยกตามหมวดหมู่</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {categoryCards.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <div key={idx} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3.5 flex flex-col justify-between">
                <div className="flex items-center gap-2 mb-3">
                  <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0", cat.bgClass)}>
                    <Icon className={cn("w-3.5 h-3.5", cat.colorClass)} />
                  </div>
                  <p className="text-xs font-medium text-slate-700 truncate">{cat.label}</p>
                  <p className="text-sm font-bold text-slate-900 ml-auto">{cat.value}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mt-auto">
                  <div className="bg-emerald-50/50 rounded-lg p-2 text-center">
                    <p className="text-[10px] text-emerald-600 font-medium mb-0.5">ปลอดภัย</p>
                    <p className="text-sm font-bold text-emerald-700 leading-none">{cat.safe}</p>
                  </div>
                  <div className="bg-rose-50/50 rounded-lg p-2 text-center">
                    <p className="text-[10px] text-rose-600 font-medium mb-0.5">ไม่ปลอดภัย</p>
                    <p className="text-sm font-bold text-rose-700 leading-none">{cat.unsafe}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
