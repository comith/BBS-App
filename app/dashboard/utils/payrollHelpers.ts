import { format } from "date-fns";

export interface EmployeeInfoLoose {
  employeeId: string;
  employeeName: string;
  department: string;
  group: string;
  [key: string]: any;
}

export const monthNames = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];

export const getMonthlyRange = (date: Date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const start = new Date(year, month - 1, 21);
  start.setHours(0, 0, 0, 0);
  const end = new Date(year, month, 20);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

export const isManagerGroup = (groupName: string) => {
  if (!groupName) return false;
  const lowerGroup = groupName.toLowerCase();
  return lowerGroup.includes("manager") || lowerGroup.includes("management");
};

// Individuals: ITH-OE OR groups ending with exactly '0' (not other digits like CV10)
export const isIndividual = (emp: EmployeeInfoLoose) => {
  if (emp.department === "ITH-OE") return true;
  if (!emp.group) return false;
  const trimmedGroup = emp.group.trim();
  return trimmedGroup.endsWith("0") && !trimmedGroup.match(/\d{2,}$/);
};

export const formatDateRange = (range: { start: Date; end: Date }) =>
  `${format(range.start, "dd/MM/yyyy")} - ${format(range.end, "dd/MM/yyyy")}`;
