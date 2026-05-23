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

interface Props {
  stats: ReportStats;
  isLoading: boolean;
}

export function StatsCards({ stats, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="h-4 bg-gray-200 rounded mb-2 w-20"></div>
                    <div className="h-8 bg-gray-200 rounded w-12"></div>
                  </div>
                  <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">รอการอนุมัติ</p>
              <p className="text-2xl font-bold text-yellow-600">
                {stats.pending}
              </p>
            </div>
            <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">อนุมัติแล้ว</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.approved}
              </p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">วันนี้</p>
              <p className="text-2xl font-bold text-blue-600">
                {stats.todayReports}
              </p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">รายงานทั้งหมด</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center">
              <FileText className="h-6 w-6 text-gray-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PPE */}
      <Card>
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div className="w-full md:w-3/4">
              <div className="flex items-center gap-2 justify-between w-full">
                <p className="text-sm font-medium text-gray-600">PPE</p>
                <div className="h-12 w-12  md:hidden  bg-orange-100 rounded-full flex items-center justify-center">
                  <HardHat className="h-6 w-6 text-orange-600" />
                </div>
              </div>
              <div className="flex flex-col mt-4 md:mt-0">
                <p className="text-2xl font-bold text-gray-900">{stats.ppe}</p>
                <div className="flex flex-col mt-4 md:mt-0">
                  <p className="text-sm text-green-600">
                    Safe Act. : {stats.ppe_safe}
                  </p>
                  <p className="text-sm text-red-600">
                    UnSafe Act. : {stats.ppe_unsafe}
                  </p>
                </div>
              </div>
            </div>
            <div className="h-12 w-12 hidden md:flex bg-orange-100 rounded-full flex items-center justify-center">
              <HardHat className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tools */}
      <Card>
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div className="w-full md:w-3/4">
              <div className="flex items-center gap-2 justify-between w-full">
                <p className="text-sm font-medium text-gray-600">Tools</p>
                <div className="h-12 w-12 md:hidden bg-gray-100 rounded-full flex items-center justify-center">
                  <Wrench className="h-6 w-6 text-gray-600" />
                </div>
              </div>
              <div className="flex flex-col mt-4 md:mt-0">
                <p className="text-2xl font-bold text-gray-900">
                  {stats.tools}
                </p>
                <div className="flex flex-col mt-4 md:mt-0">
                  <p className="text-sm text-green-600">
                    Safe Act. : {stats.tools_safe}
                  </p>
                  <p className="text-sm text-red-600">
                    UnSafe Act. : {stats.tools_unsafe}
                  </p>
                </div>
              </div>
            </div>
            <div className="h-12 w-12 hidden md:flex bg-gray-100 rounded-full flex items-center justify-center">
              <Wrench className="h-6 w-6 text-gray-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Unsafe Action */}
      <Card>
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div className="w-full md:w-3/4">
              <div className="flex items-center gap-2 justify-between w-full">
                <p className="text-sm font-medium text-gray-600">
                  Unsafe Action
                </p>
                <div className="h-12 w-12 md:hidden bg-green-100 rounded-full flex items-center justify-center">
                  <Bike className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="flex flex-col mt-4 md:mt-0">
                <p className="text-2xl font-bold text-gray-900">
                  {stats.unsafe_actions}
                </p>
                <div className="flex flex-col mt-4 md:mt-0">
                  <p className="text-sm text-green-600">
                    Safe Act. : {stats.unsafe_actions_safe}
                  </p>
                  <p className="text-sm text-red-600">
                    UnSafe Act. : {stats.unsafe_actions_unsafe}
                  </p>
                </div>
              </div>
            </div>
            <div className="h-12 w-12 hidden md:flex bg-green-100 rounded-full flex items-center justify-center">
              <Bike className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Unsafe Condition */}
      <Card>
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div className="w-full md:w-3/4">
              <div className="flex items-center gap-2 justify-between w-full">
                <p className="text-sm font-medium text-gray-600">
                  Unsafe Condition
                </p>
                <div className="h-12 w-12 md:hidden bg-blue-100 rounded-full flex items-center justify-center">
                  <ReceiptText className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="flex flex-col mt-4 md:mt-0">
                <p className="text-2xl font-bold text-gray-900">
                  {stats.unsafe_condition}
                </p>
                <div className="flex flex-col mt-4 md:mt-0">
                  <p className="text-sm text-green-600">
                    Safe Act. : {stats.unsafe_condition_safe}
                  </p>
                  <p className="text-sm text-red-600">
                    UnSafe Act. : {stats.unsafe_condition_unsafe}
                  </p>
                </div>
              </div>
            </div>
            <div className="h-12 w-12 hidden md:flex bg-blue-100 rounded-full flex items-center justify-center">
              <ReceiptText className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
