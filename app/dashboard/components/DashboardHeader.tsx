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
import { BrainCircuit, House, UserRoundCog } from "lucide-react";

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

  return (
    <div className="bg-white shadow-sm border-b sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Image
              src="/img/ith.png"
              alt="ITH Logo"
              width={60}
              height={60}
              className="rounded-lg hidden md:flex"
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                จัดการรายงานความปลอดภัย
              </h1>
              <p className="text-gray-600">
                ระบบอนุมัติรายงานการสังเกตความปลอดภัย
              </p>
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-3 justify-center items-center space-x-2">
            <Select
              value={String(selectedYear)}
              onValueChange={(v) => onYearChange(Number(v))}
            >
              <SelectTrigger className="w-[110px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from(
                  { length: new Date().getFullYear() - 2022 },
                  (_, i) => new Date().getFullYear() - i
                ).map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year + 543} ({year})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={onRefresh}
              disabled={isLoading}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {isLoading ? "กำลังโหลด..." : "รีเฟรช"}
            </Button>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  router.push(`/`);
                }}
              >
                <House className="h-5 w-5" />
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  const params = new URLSearchParams({
                    employeeId: employeeId || "",
                    fullName: employeeName || "",
                    department: department || "",
                    group: group || "",
                  }).toString();
                  router.push(`/manageusers?${params}`);
                }}
              >
                <UserRoundCog className="h-5 w-5" />
              </Button>

              {isSheOrManager && (
                <Button
                  variant="outline"
                  onClick={() => router.push("/ai-analytics")}
                  title="AI Analytics"
                >
                  <BrainCircuit className="h-5 w-5 text-indigo-600" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
