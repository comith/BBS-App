"use client";
import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface DateRange {
  from?: Date;
  to?: Date;
}

export type CustomCalendarProps = {
  mode: "range" | "single";
  selected: DateRange | Date | undefined;
  onSelect: (value: any) => void;
  numberOfMonths?: number;
  className?: string;
  [key: string]: any;
};

const monthNames = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน",
  "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม",
  "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];
const dayNames = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

export const CustomCalendar = ({
  mode,
  selected,
  onSelect,
  className,
}: CustomCalendarProps) => {
  const [currentMonth, setCurrentMonth] = React.useState(new Date());

  const getDaysInMonth = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

  const getFirstDayOfMonth = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const isDateInRange = (date: Date): boolean => {
    if (!selected || typeof selected !== "object") return false;
    if ("from" in selected) {
      const range = selected as DateRange;
      if (!range.from) return false;
      if (mode === "range" && range.from && range.to) {
        return date >= range.from && date <= range.to;
      }
      return range.from && date.getTime() === range.from.getTime();
    }
    return false;
  };

  const isDateRangeStart = (date: Date): boolean => {
    if (selected && typeof selected === "object" && "from" in selected && (selected as DateRange).from) {
      return date.getTime() === (selected as DateRange).from!.getTime();
    }
    return false;
  };

  const isDateRangeEnd = (date: Date): boolean => {
    if (selected && typeof selected === "object" && "to" in selected && (selected as DateRange).to) {
      return date.getTime() === (selected as DateRange).to!.getTime();
    }
    return false;
  };

  const handleDateClick = (date: Date) => {
    if (mode === "range") {
      const range = selected as DateRange | undefined;
      if (!range?.from || (range.from && range.to)) {
        onSelect({ from: date, to: undefined });
      } else if (range.from && !range.to) {
        if (date < range.from) {
          onSelect({ from: date, to: range.from });
        } else {
          onSelect({ from: range.from, to: date });
        }
      }
    } else {
      onSelect(date);
    }
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days: React.ReactNode[] = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-9 w-9" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const isInRange = isDateInRange(date);
      const isRangeStart = isDateRangeStart(date);
      const isRangeEnd = isDateRangeEnd(date);
      const isToday = new Date().toDateString() === date.toDateString();

      days.push(
        <button
          key={day}
          onClick={() => handleDateClick(date)}
          className={cn(
            "h-9 w-9 rounded-md text-sm font-normal transition-colors hover:bg-gray-100",
            isInRange && "bg-orange-100 text-orange-900",
            (isRangeStart || isRangeEnd) && "bg-orange-500 text-white hover:bg-orange-600",
            isToday && !isInRange && "bg-gray-200 font-medium",
            "focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
          )}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  return (
    <div className={cn("p-3", className)}>
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
          className="h-8 w-8 rounded-md border hover:bg-gray-100 flex items-center justify-center"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="text-sm font-medium">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </div>
        <button
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
          className="h-8 w-8 rounded-md border hover:bg-gray-100 flex items-center justify-center"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((day) => (
          <div key={day} className="h-9 w-9 flex items-center justify-center text-sm font-medium text-gray-500">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">{renderCalendar()}</div>
    </div>
  );
};
