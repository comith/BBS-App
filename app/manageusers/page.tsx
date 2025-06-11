"use client";
import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Search,
  Users,
  RefreshCw,
  Loader,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";

const EmployeeManager = () => {
  const router = useRouter();
  const { toast } = useToast();
  interface Employee {
    id: string;
    employeerId: string;
    fullName: string;
    department: string;
    group: string;
    position: string;
  }
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<UpdateEmployeeAPIRequest>({
    id: "",
    employeerId: "",
    fullName: "",
    department: "",
    group: "",
    position: "",
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");
  const [duplicateCheck, setDuplicateCheck] = useState("");
  const [unDuplicated, setUnDuplicated] = useState<Employee[]>([]);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Dropdown options states
  interface Department {
    id: string;
    name: string;
    shortname?: string;
    [key: string]: any;
  }
  interface Group {
    id: string;
    name: string;
    [key: string]: any;
  }
  const [departments, setDepartments] = useState<Department[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(true);

  const [newEmployee, setNewEmployee] = useState({
    employeerId: "",
    fullName: "",
    department: "",
    group: "",
    position: "employee",
  });

  // ฟังก์ชันดึงข้อมูล dropdown options จาก API
  const fetchDropdownOptions = async () => {
    setOptionsLoading(true);
    try {
      // ดึงข้อมูลแผนก
      const deptResponse = await fetch("/api/get?type=department");
      if (deptResponse.ok) {
        const deptData = await deptResponse.json();
        setDepartments(deptData);
      }

      // ดึงข้อมูลกลุ่ม
      const groupResponse = await fetch("/api/get?type=group");
      if (groupResponse.ok) {
        const groupData = await groupResponse.json();
        setGroups(groupData);
      }
    } catch (error) {
      console.error("Error fetching dropdown options:", error);
    } finally {
      setOptionsLoading(false);
    }
  };



  // ฟังก์ชันดึงข้อมูลพนักงานจาก API
  const fetchEmployees = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/get?type=employee");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      // แปลงข้อมูลให้ตรงกับ format ที่ใช้
      interface EmployeeAPIResponse {
        id?: string | number;
        employeerId?: string;
        fullName?: string;
        department?: string;
        group?: string;
        position?: string;
      }

      interface Employee {
        id: string;
        employeerId: string;
        fullName: string;
        department: string;
        group: string;
        position: string;
      }

      const formattedData: Employee[] = (data as EmployeeAPIResponse[]).map((emp: EmployeeAPIResponse): Employee => ({
        id: emp.id?.toString() || Math.random().toString(),
        employeerId: emp.employeerId || "",
        fullName: emp.fullName || "",
        department: emp.department || "",
        group: emp.group || "",
        position: emp.position || "",
      }));

      setEmployees(formattedData);

      // หา duplicate employee IDs
      const uniemployees: Employee[] = [];
      const seen = new Set();
      formattedData.forEach((emp) => {
        if (!seen.has(emp.employeerId)) {
          seen.add(emp.employeerId);
          uniemployees.push(emp);
        }
      });

      setUnDuplicated(uniemployees);
    } catch (error) {
      console.error("Error fetching employees:", error);
      setError(
        "ไม่สามารถดึงข้อมูลพนักงานได้: " +
          (error instanceof Error ? error.message : String(error))
      );
    } finally {
      setLoading(false);
    }
  };

  // ฟังก์ชันเพิ่มพนักงานใหม่
  interface AddEmployeeAPIResponse {
    recordId?: string;
    [key: string]: any;
  }

  interface AddEmployeeAPIRequest {
    employeerId: string;
    fullName: string;
    department: string;
    group: string;
    position: string;
  }

  const addEmployeeToAPI = async (
    employeeData: AddEmployeeAPIRequest
  ): Promise<AddEmployeeAPIResponse> => {
    setSaving(true);
    try {
      const response = await fetch("/api/post", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "employee",
          data: employeeData,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: AddEmployeeAPIResponse = await response.json();
      return result;
    } catch (error) {
      console.error("Error adding employee:", error);
      throw error;
    } finally {
      setSaving(false);
    }
  };

  // ฟังก์ชันอัพเดทข้อมูลพนักงาน
  interface UpdateEmployeeAPIRequest {
    id: string;
    employeerId: string;
    fullName: string;
    department: string;
    group: string;
    position: string;
  }

  interface UpdateEmployeeAPIResponse {
    [key: string]: any;
  }

  const updateEmployeeInAPI = async (
    employeeData: UpdateEmployeeAPIRequest
  ): Promise<UpdateEmployeeAPIResponse> => {
    setSaving(true);
    try {
      const response = await fetch("/api/put", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "employee",
          id: employeeData.id, // ส่ง id แยกต่างหาก
          data: {
            employeerId: employeeData.employeerId,
            fullName: employeeData.fullName,
            department: employeeData.department,
            group: employeeData.group,
            position: employeeData.position,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: UpdateEmployeeAPIResponse = await response.json();
      return result;
    } catch (error: any) {
      toast({
        title: "แก้ไขข้อมูลไม่สำเร็จ",
        description: `ไม่สามารถอัพเดทข้อมูลพนักงานได้: ${
          error instanceof Error ? error.message : String(error)
        }`,
        variant: "destructive",
      });
      throw error;
    } finally {
      setSaving(false);
    }
  };

  // ฟังก์ชันลบพนักงาน
  interface DeleteEmployeeAPIRequest {
    type: string;
    id: string;
  }

  interface DeleteEmployeeAPIResponse {
    [key: string]: any;
  }

  const deleteEmployeeFromAPI = async (employeeId: string): Promise<DeleteEmployeeAPIResponse> => {
    setSaving(true);
    try {
      const requestBody: DeleteEmployeeAPIRequest = {
        type: "employee",
        id: employeeId,
      };
      const response = await fetch("/api/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result: DeleteEmployeeAPIResponse = await response.json();
      return result;
    } catch (error) {
      console.error("Error deleting employee:", error);
      throw error;
    } finally {
      setSaving(false);
    }
  };

  // ดึงข้อมูลเมื่อ component mount
  useEffect(() => {
    fetchEmployees();
    fetchDropdownOptions();
  }, []);

  // ฟังก์ชันสำหรับการค้นหา
  const filteredEmployees = employees.filter(
    (emp) =>
      emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employeerId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.group.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentEmployees = filteredEmployees.slice(startIndex, endIndex);

  // เริ่มการแก้ไข
  interface StartEditEmployee {
    id: string;
    employeerId: string;
    fullName: string;
    department: string;
    group: string;
    position: string;
  }
  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({
      id: "",
      employeerId: "",
      fullName: "",
      department: "",
      group: "",
      position: "",
    });
  };

  // บันทึกการแก้ไข
  const saveEdit = async () => {
    // ตรวจสอบรหัสพนักงานซ้ำ
    // const duplicate = checkDuplicateEmployeeId(editForm.employeerId, editingId);
    // if (duplicate) {
    //   toast({
    //     title: "รหัสพนักงานซ้ำ",
    //     description: `รหัสพนักงาน "${editForm.employeerId}" มีอยู่แล้วในระบบ (${duplicate.fullName})`,
    //     variant: "error",
    //   });
    //   return;
    // }

    try {
      await updateEmployeeInAPI(editForm);
      setEmployees(
        employees.map((emp) => (emp.id === editingId ? editForm : emp))
      );
      setEditingId(null);
      setEditForm({
        id: "",
        employeerId: "",
        fullName: "",
        department: "",
        group: "",
        position: "",
      });
      toast({
        title: "อัพเดทข้อมูลสำเร็จ",
        description: `ข้อมูลพนักงาน "${editForm.fullName}" ได้รับการอัพเดทเรียบร้อยแล้ว`,
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "อัพเดทข้อมูลไม่สำเร็จ",
        description: `ไม่สามารถอัพเดทข้อมูลพนักงานได้: ${
          error instanceof Error ? error.message : String(error)
        }`,
        variant: "destructive",
      });
    }
  };

  // ลบพนักงาน

  // เพิ่มพนักงานใหม่
  const addEmployee = async () => {
    if (!newEmployee.employeerId || !newEmployee.fullName) {
      toast({
        title: "ข้อมูลไม่ครบถ้วน",
        description: "กรุณากรอก รหัสพนักงาน และ ชื่อ-นามสกุล",
        variant: "destructive",
      });
      return;
    }

    // ตรวจสอบรหัสพนักงานซ้ำ
    // const duplicate = checkDuplicateEmployeeId(newEmployee.employeerId);
    // if (duplicate) {
    //   toast({
    //     title: "รหัสพนักงานซ้ำ",
    //     description: `รหัสพนักงาน "${newEmployee.employeerId}" มีอยู่แล้วในระบบ (${duplicate.fullName})`,
    //     variant: "error",
    //   });
    //   return;
    // }

    try {
      const result = await addEmployeeToAPI(newEmployee);

      // เพิ่มข้อมูลใหม่ในระบบ
      const newId = result.recordId || Date.now().toString();
      const newEmployeeWithId = { ...newEmployee, id: newId };

      setEmployees([...employees, newEmployeeWithId]);
      setNewEmployee({
        employeerId: "",
        fullName: "",
        department:
          departments.length > 0
            ? departments[0].name || departments[0].shortname || ""
            : "",
        group: groups.length > 0 ? groups[0].name || "" : "",
        position: "employee",
      });
      setShowAddForm(false);
     toast({
        title: "เพิ่มพนักงานสำเร็จ",
        description: `พนักงาน "${newEmployee.fullName}" ได้รับการเพิ่มเรียบร้อยแล้ว`,
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "เพิ่มพนักงานไม่สำเร็จ",
        description: `ไม่สามารถเพิ่มพนักงานได้: ${
          error instanceof Error ? error.message : String(error)
        }`,
        variant: "destructive",
      });
    }
  };

  // ตัวเลือกตำแหน่งงาน (static)
  const positionOptions = [
    "EN",
    "FM",
    "(T)Leader",
    "(L)Leader",
    "employee",
    "Manager",
    "Supervisor",
    "SHE",
  ];

  // ฟังก์ชันสำหรับ pagination
  interface GoToPageFn {
    (page: number): void;
  }

  const goToPage: GoToPageFn = (page) => {
    setCurrentPage(page);
  };

  const goToPrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  // Reset page เมื่อมีการค้นหา
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // ถ้ากำลังโหลดข้อมูล
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6 bg-white">
        <div className="flex items-center justify-center min-h-96">
          <div className="flex items-center gap-3">
            <Loader className="w-8 h-8 animate-spin text-blue-600" />
            <span className="text-lg text-gray-600">
              กำลังโหลดข้อมูลพนักงาน...
            </span>
          </div>
        </div>
      </div>
    );
  }

      function startEdit(employee: Employee): void {
        setEditingId(employee.id);
        setEditForm({
          id: employee.id,
          employeerId: employee.employeerId,
          fullName: employee.fullName,
          department: employee.department,
          group: employee.group,
          position: employee.position,
        });
      }

  return (
    <div className="w-full mx-auto p-4 bg-white">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Users className="w-8 h-8 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-800">
            ระบบจัดการข้อมูลพนักงาน
          </h1>
        </div>
        <p className="text-gray-600">
          จัดการข้อมูลพนักงานในแผนก ITH (Civil, Mechanical Operations, Survey)
        </p>
      </div>

      {/* แสดง Error ถ้ามี */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}

      {/* แสดงการตรวจสอบรหัสซ้ำ */}
      {duplicateCheck && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded mb-4 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          <p>{duplicateCheck}</p>
        </div>
      )}

      {/* แถบค้นหาและปุ่มควบคุม */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="ค้นหาพนักงาน..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchEmployees}
            disabled={loading}
            className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            รีเฟรช
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            เพิ่มพนักงานใหม่
          </button>
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"   
          >
            ย้อนกลับ
          </button>
        </div>
      </div>

      {/* ฟอร์มเพิ่มพนักงานใหม่ */}
      {showAddForm && (
        <div className="bg-gray-50 p-6 rounded-lg mb-6">
          <h3 className="text-lg font-semibold mb-4">เพิ่มพนักงานใหม่</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                รหัสพนักงาน
              </label>
              <input
                type="text"
                value={newEmployee.employeerId}
                onChange={(e) =>
                  setNewEmployee({
                    ...newEmployee,
                    employeerId: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="เช่น 2EN94044"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ชื่อ-นามสกุล
              </label>
              <input
                type="text"
                value={newEmployee.fullName}
                onChange={(e) =>
                  setNewEmployee({ ...newEmployee, fullName: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="เช่น นายสมชาย ใจดี"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                แผนก
              </label>
              <select
                value={newEmployee.department}
                onChange={(e) =>
                  setNewEmployee({ ...newEmployee, department: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                disabled={optionsLoading}
              >
                <option value="">เลือกแผนก</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.shortname || dept.name}>
                    {dept.name} {dept.shortname ? `(${dept.shortname})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                กลุ่ม
              </label>
              <select
                value={newEmployee.group}
                onChange={(e) =>
                  setNewEmployee({ ...newEmployee, group: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                disabled={optionsLoading}
              >
                <option value="">เลือกกลุ่ม</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.name}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ตำแหน่ง
              </label>
              <select
                value={newEmployee.position}
                onChange={(e) =>
                  setNewEmployee({ ...newEmployee, position: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                {positionOptions.map((pos) => (
                  <option key={pos} value={pos}>
                    {pos}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={addEmployee}
              disabled={saving}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {saving ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? "กำลังบันทึก..." : "บันทึก"}
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              disabled={saving}
              className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 disabled:opacity-50"
            >
              <X className="w-4 h-4" />
              ยกเลิก
            </button>
          </div>
        </div>
      )}

      {/* สถิติ */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            {unDuplicated.length}
          </div>
          <div className="text-sm text-blue-600">จำนวนพนักงานทั้งหมด</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {unDuplicated.filter((emp) => emp.department.includes("CV")).length}
          </div>
          <div className="text-sm text-green-600">แผนก CV</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">
            {unDuplicated.filter((emp) => emp.department.includes("MO")).length}
          </div>
          <div className="text-sm text-purple-600">แผนก MO</div>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-orange-600">
            {unDuplicated.filter((emp) => emp.department.includes("SV")).length}
          </div>
          <div className="text-sm text-orange-600">แผนก SV</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-red-600">
            {unDuplicated.filter((emp) => emp.position === "(T)Leader").length}
          </div>
          <div className="text-sm text-red-600">หัวหน้าทีม</div>
        </div>
      </div>

      {/* ตารางข้อมูลพนักงาน */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  รหัสพนักงาน
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ชื่อ-นามสกุล
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  แผนก
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  กลุ่ม
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ตำแหน่ง
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  จัดการ
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentEmployees.map((employee) => (
                <tr key={employee.id} className="hover:bg-gray-50">
                  {editingId === employee.id ? (
                    <>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <input
                          type="text"
                          value={editForm.employeerId}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              employeerId: e.target.value,
                            })
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <input
                          type="text"
                          value={editForm.fullName}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              fullName: e.target.value,
                            })
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <select
                          value={editForm.department}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              department: e.target.value,
                            })
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        >
                          {departments.map((dept) => (
                            <option
                              key={dept.id}
                              value={dept.shortname || dept.name}
                            >
                              {dept.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <select
                          value={editForm.group}
                          onChange={(e) =>
                            setEditForm({ ...editForm, group: e.target.value })
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        >
                          {groups.map((group) => (
                            <option key={group.id} value={group.name}>
                              {group.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <select
                          value={editForm.position}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              position: e.target.value,
                            })
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        >
                          {positionOptions.map((pos) => (
                            <option key={pos} value={pos}>
                              {pos}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <button
                            onClick={saveEdit}
                            disabled={saving}
                            className="text-green-600 hover:text-green-900 disabled:opacity-50"
                          >
                            {saving ? (
                              <Loader className="w-4 h-4 animate-spin" />
                            ) : (
                              <Save className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={cancelEdit}
                            disabled={saving}
                            className="text-gray-600 hover:text-gray-900 disabled:opacity-50"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {employee.employeerId}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 max-w-48 truncate">
                        {employee.fullName}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            employee.department.includes("CV")
                              ? "bg-green-100 text-green-800"
                              : employee.department.includes("MO")
                              ? "bg-purple-100 text-purple-800"
                              : employee.department.includes("SV")
                              ? "bg-orange-100 text-orange-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {employee.department}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {employee.group}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            employee.position === "(T)Leader"
                              ? "bg-purple-100 text-purple-800"
                              : employee.position === "(L)Leader"
                              ? "bg-blue-100 text-orange-800"
                              : employee.position === "EN"
                              ? "bg-blue-100 text-blue-800"
                              : employee.position === "FM"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {employee.position}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => startEdit(employee)}
                            disabled={saving}
                            className="text-indigo-600 hover:text-indigo-900 disabled:opacity-50"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={goToPrevPage}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ก่อนหน้า
                </button>
                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ถัดไป
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    แสดง <span className="font-medium">{startIndex + 1}</span>{" "}
                    ถึง{" "}
                    <span className="font-medium">
                      {Math.min(endIndex, filteredEmployees.length)}
                    </span>{" "}
                    จาก{" "}
                    <span className="font-medium">
                      {filteredEmployees.length}
                    </span>{" "}
                    รายการ
                  </p>
                </div>
                <div>
                  <nav
                    className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                    aria-label="Pagination"
                  >
                    <button
                      onClick={goToPrevPage}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => goToPage(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === pageNum
                              ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                              : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      onClick={goToNextPage}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {filteredEmployees.length === 0 && searchTerm && !loading && (
        <div className="text-center py-8">
          <p className="text-gray-500">
            ไม่พบข้อมูลพนักงานที่ตรงกับการค้นหา "{searchTerm}"
          </p>
        </div>
      )}

      {employees.length === 0 && !loading && !error && (
        <div className="text-center py-8">
          <p className="text-gray-500">ไม่มีข้อมูลพนักงาน</p>
        </div>
      )}

      {/* แสดงสถานะการบันทึก */}
      {saving && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg">
          <div className="flex items-center gap-2">
            <Loader className="w-4 h-4 animate-spin" />
            <span>กำลังบันทึกข้อมูล...</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default EmployeeManager;
