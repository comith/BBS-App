"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BrainCircuit, Home, MoreVertical, RefreshCw, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  selectedYear: number;
  onYearChange: (year: number) => void;
  isLoading: boolean;
  onRefresh: () => void;
  employeeId: string | null;
  employeeName: string | null;
  department: string | null;
  group: string | null;
  isSheOrManager: boolean;
}

export function DashboardHeader({
  selectedYear,
  onYearChange,
  isLoading,
  onRefresh,
  employeeId,
  employeeName,
  department,
  group,
  isSheOrManager,
}: Props) {
  const router = useRouter();

  const handleSettings = () => {
    const params = new URLSearchParams({
      employeeId: employeeId || "",
      fullName: employeeName || "",
      department: department || "",
      group: group || "",
    }).toString();
    router.push(`/manageusers?${params}`);
  };

  return (
    <div className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-slate-200 shadow-sm supports-[backdrop-filter]:bg-white/60">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          {/* Left: Branding */}
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex-shrink-0 shadow-sm rounded-lg overflow-hidden border border-slate-100 hidden sm:block">
              <Image
                src="/img/ith.png"
                alt="ITH Logo"
                width={36}
                height={36}
                className="object-cover"
              />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm md:text-base font-bold text-slate-900 truncate">
                จัดการรายงาน BBS
              </h1>
              <p className="text-[10px] md:text-xs text-slate-500 truncate hidden sm:block">
                ระบบจัดการรายงานการสังเกตความปลอดภัย
              </p>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
            <Select
              value={String(selectedYear)}
              onValueChange={(v) => onYearChange(Number(v))}
            >
              <SelectTrigger className="w-[85px] h-8 text-xs bg-slate-50 border-slate-200 focus:ring-0 focus:ring-offset-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from(
                  { length: new Date().getFullYear() - 2022 },
                  (_, i) => new Date().getFullYear() - i
                ).map((year) => (
                  <SelectItem key={year} value={String(year)} className="text-xs">
                    {year + 543}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="ghost"
              size="icon"
              onClick={onRefresh}
              disabled={isLoading}
              className="h-8 w-8 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push(`/`)}
              className="h-8 w-8 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            >
              <Home className="h-4 w-4" />
            </Button>

            {/* Desktop Icons */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSettings}
              className="h-8 w-8 text-slate-600 hover:bg-slate-100 hover:text-slate-900 hidden sm:inline-flex"
            >
              <Settings className="h-4 w-4" />
            </Button>

            {isSheOrManager && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/ai-analytics")}
                className="h-8 w-8 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 hidden sm:inline-flex"
              >
                <BrainCircuit className="h-4 w-4" />
              </Button>
            )}

            {/* Mobile More Menu */}
            <div className="sm:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-slate-100 text-slate-600 outline-none transition-colors">
                  <MoreVertical className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={handleSettings}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>จัดการผู้ใช้</span>
                  </DropdownMenuItem>
                  {isSheOrManager && (
                    <DropdownMenuItem onClick={() => router.push("/ai-analytics")}>
                      <BrainCircuit className="mr-2 h-4 w-4 text-indigo-600" />
                      <span className="text-indigo-600 font-medium">AI Analytics</span>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
