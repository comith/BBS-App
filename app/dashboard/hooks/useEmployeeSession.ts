"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "bbs_employee_data";
export const MAINTENANCE_ADMIN = "3ST19686";

const loadFromLocalStorage = () => {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error("Error loading from localStorage:", error);
      return null;
    }
  }
  return null;
};

export interface EmployeeSession {
  sheid: string | null;
  employeeId: string | null;
  employeeName: string | null;
  department: string | null;
  group: string | null;
  position: string | null;
  isMaintenanceAdmin: boolean;
  isSheOrManager: boolean;
  loaded: boolean;
}

export function useEmployeeSession(): EmployeeSession {
  const [sheid, setSheid] = useState<string | null>(null);
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [employeeName, setEmployeeName] = useState<string | null>(null);
  const [department, setDepartment] = useState<string | null>(null);
  const [group, setGroup] = useState<string | null>(null);
  const [position, setPosition] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const employeeData = loadFromLocalStorage();
    if (employeeData) {
      const {
        employeerId = "",
        fullName = "",
        department: dept = "",
        group: grp = "",
        position: pos = "",
      } = employeeData;

      setSheid(employeerId);
      setEmployeeId(employeerId);
      setEmployeeName(fullName);
      setDepartment(dept);
      setGroup(grp);
      setPosition(pos);
    } else {
      console.warn("No employee data found in localStorage");
    }
    setLoaded(true);
  }, []);

  const isMaintenanceAdmin = sheid === MAINTENANCE_ADMIN;
  const isSheOrManager =
    (department?.toLowerCase().includes("she") ?? false) ||
    (group?.toLowerCase().includes("she") ?? false) ||
    position?.toLowerCase() === "manager" ||
    position?.toLowerCase() === "she";

  return {
    sheid,
    employeeId,
    employeeName,
    department,
    group,
    position,
    isMaintenanceAdmin,
    isSheOrManager,
    loaded,
  };
}
