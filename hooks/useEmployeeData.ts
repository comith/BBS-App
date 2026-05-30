"use client";

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-fetch';

export interface Employee {
  employeerId: string;
  fullName: string;
  department: string | number;
  group: string;
  position: string;
}

// Query key factory
export const employeeKeys = {
  all: ['employees'] as const,
  lists: () => [...employeeKeys.all, 'list'] as const,
  list: (filters: string) => [...employeeKeys.lists(), { filters }] as const,
  details: () => [...employeeKeys.all, 'detail'] as const,
  detail: (id: string) => [...employeeKeys.details(), id] as const,
};

// Fetch function
const fetchEmployees = async (): Promise<Employee[]> => {
  console.log('🔄 Fetching employee data from API...');
  
  const response = await apiFetch("/api/get?type=employee", {
    headers: {
      'Cache-Control': 'no-cache',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  console.log('✅ Employee data fetched successfully:', data.length, 'records');
  return data;
};

// Main hook
export const useEmployeeData = () => {
  return useQuery({
    queryKey: employeeKeys.lists(),
    queryFn: fetchEmployees,
    staleTime: 5 * 60 * 1000, // 5 นาที
    gcTime: 10 * 60 * 1000, // 10 นาที
    refetchOnWindowFocus: true, // รีเฟรชเมื่อกลับมาที่หน้าต่าง
    refetchOnMount: true, // รีเฟรชเมื่อ component mount
    refetchInterval: 10 * 60 * 1000, // รีเฟรชทุก 10 นาที
    retry: (failureCount, error) => {
      // Retry สูงสุด 3 ครั้ง
      if (failureCount < 3) {
        console.log(`🔄 Retrying... attempt ${failureCount + 1}`);
        return true;
      }
      return false;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

// Hook สำหรับหา employee คนเดียว
export const useEmployee = (employeeId: string) => {
  const { data: employees, ...queryResult } = useEmployeeData();
  
  const employee = employees?.find(emp => emp.employeerId === employeeId);
  
  return {
    employee,
    ...queryResult,
  };
};

// Hook สำหรับ manual refresh
export const useRefreshEmployeeData = () => {
  const queryClient = useQueryClient();
  
  const refresh = async () => {
    console.log('🔄 Manual refresh triggered');
    await queryClient.refetchQueries({
      queryKey: employeeKeys.lists(),
    });
  };

  const invalidate = () => {
    console.log('🗑️ Invalidating employee cache');
    queryClient.invalidateQueries({
      queryKey: employeeKeys.all,
    });
  };

  return { refresh, invalidate };
};