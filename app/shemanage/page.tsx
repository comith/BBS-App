"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  Edit3,
  Trash2,
  Save,
  X,
  Search,
  Filter,
  Eye,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Plus,
  FileText,
  User,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/components/ui/use-toast";

// Interface สำหรับ SHE Violation
interface SheViolation {
  record_id: string;
  date: string;
  employee_id: string;
  fullname: string;
  group: string;
  depart: string;
  safetycategory_id: string;
  sub_safetycategory_id: string;
  observed_Work: string;
  department_notice: string;
  vehicleEquipment: any;
  selectedOptions: any[];
  safeActionCount: number;
  actionType: string;
  unsafeActionCount: number;
  actionTypeunsafe: string;
  attachment: any[];
  other: string;
  employee_code: string;
  level_accident: string;
  status?: string;
  created_date?: string;
  updated_date?: string;
}

// ฟังก์ชันแปลงระดับความเสี่ยงเป็นสีและไอคอน
const getRiskLevelInfo = (level: string) => {
  switch (level) {
    case "อุบัติเหตุ":
      return {
        color: "bg-red-100 text-red-800 border-red-200",
        icon: AlertTriangle,
        bgColor: "bg-red-50",
      };
    case "เสี่ยงสูง":
      return {
        color: "bg-orange-100 text-orange-800 border-orange-200",
        icon: AlertCircle,
        bgColor: "bg-orange-50",
      };
    case "PPE":
      return {
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        icon: AlertCircle,
        bgColor: "bg-yellow-50",
      };
    default:
      return {
        color: "bg-gray-100 text-gray-800 border-gray-200",
        icon: AlertCircle,
        bgColor: "bg-gray-50",
      };
  }
};

function SheViolationsManagement() {
  const [violations, setViolations] = useState<SheViolation[]>([]);
  const [filteredViolations, setFilteredViolations] = useState<SheViolation[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [riskLevelFilter, setRiskLevelFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedViolation, setSelectedViolation] = useState<SheViolation | null>(null);
  const [editingViolation, setEditingViolation] = useState<SheViolation | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

  // ดึงข้อมูล SHE Violations
  const fetchViolations = async () => {
    setLoading(true);
    try {
      console.log("🔄 Fetching SHE violations...");

      const [violationsResponse, categoriesResponse, employeesResponse] = await Promise.all([
        fetch("/api/get?type=she_violations"),
        fetch("/api/get?type=category"),
        fetch("/api/get?type=employee"),
      ]);

      if (!violationsResponse.ok) {
        throw new Error(`HTTP error! status: ${violationsResponse.status}`);
      }

      const [violationsData, categoriesData, employeesData] = await Promise.all([
        violationsResponse.json(),
        categoriesResponse.json(),
        employeesResponse.json(),
      ]);

      console.log("✅ Data loaded:", {
        violations: violationsData.length,
        categories: categoriesData.length,
        employees: employeesData.length,
      });

      setViolations(violationsData);
      setCategories(categoriesData);
      setEmployees(employeesData);

    } catch (error) {
      console.error("❌ Error fetching violations:", error);
      toast(
        <div>
          <div className="font-bold text-red-600">เกิดข้อผิดพลาด</div>
          <div>ไม่สามารถโหลดข้อมูลได้</div>
        </div>
      );
    } finally {
      setLoading(false);
    }
  };

  // อัพเดท SHE Violation
  const updateViolation = async (updatedData: SheViolation) => {
    setSaving(true);
    try {
      const response = await fetch("/api/put", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "she_violation",
          id: updatedData.record_id,
          data: updatedData,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // อัพเดทข้อมูลใน state
      setViolations(violations.map(v => 
        v.record_id === updatedData.record_id ? updatedData : v
      ));

      toast(
        <div>
          <div className="font-bold text-green-600">บันทึกสำเร็จ</div>
          <div>แก้ไขรายการเรียบร้อยแล้ว</div>
        </div>
      );

      setIsEditDialogOpen(false);
      setEditingViolation(null);

    } catch (error) {
      console.error("❌ Error updating violation:", error);
      toast(
        <div>
          <div className="font-bold text-red-600">เกิดข้อผิดพลาด</div>
          <div>ไม่สามารถบันทึกการแก้ไขได้</div>
        </div>
      );
    } finally {
      setSaving(false);
    }
  };

  // ลบ SHE Violation
  const deleteViolation = async (recordId: string) => {
    setSaving(true);
    try {
      const response = await fetch("/api/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "she_violation",
          id: recordId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // ลบออกจาก state
      setViolations(violations.filter(v => v.record_id !== recordId));

      toast(
        <div>
          <div className="font-bold text-green-600">ลบสำเร็จ</div>
          <div>ยกเลิกการแจ้งเรียบร้อยแล้ว</div>
        </div>
      );

      setIsDeleteDialogOpen(false);
      setSelectedViolation(null);

    } catch (error) {
      console.error("❌ Error deleting violation:", error);
      toast(
        <div>
          <div className="font-bold text-red-600">เกิดข้อผิดพลาด</div>
          <div>ไม่สามารถยกเลิกการแจ้งได้</div>
        </div>
      );
    } finally {
      setSaving(false);
    }
  };

  // หาชื่อ category จาก ID
  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id === parseInt(categoryId));
    return category?.name || `Category ID: ${categoryId}`;
  };

  // หาชื่อพนักงานจาก employee_id
  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(emp => emp.employeerId === employeeId);
    return employee?.fullName || employeeId;
  };

  // Filter และ Search
  useEffect(() => {
    let filtered = violations;

    // Filter by risk level
    if (riskLevelFilter !== "all") {
      filtered = filtered.filter(v => v.level_accident === riskLevelFilter);
    }

    // Filter by status (if exists)
    if (statusFilter !== "all") {
      filtered = filtered.filter(v => v.status === statusFilter);
    }

    // Search
    if (searchTerm) {
      filtered = filtered.filter(v =>
        v.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.observed_Work.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.department_notice.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredViolations(filtered);
  }, [violations, riskLevelFilter, statusFilter, searchTerm]);

  // เรียกข้อมูลเมื่อ component mount
  useEffect(() => {
    fetchViolations();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Image
                src="/img/ith.png"
                alt="ITH Logo"
                width={60}
                height={60}
                className="rounded-lg"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  จัดการรายการ SHE Violations
                </h1>
                <p className="text-gray-600">
                  แก้ไขและยกเลิกการแจ้งรายการที่มีความเสี่ยง
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={fetchViolations}
                disabled={loading}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                รีเฟรช
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">รายการทั้งหมด</p>
                  <p className="text-2xl font-bold text-gray-900">{violations.length}</p>
                </div>
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600">อุบัติเหตุ</p>
                  <p className="text-2xl font-bold text-red-700">
                    {violations.filter(v => v.level_accident === "อุบัติเหตุ").length}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600">เสี่ยงสูง</p>
                  <p className="text-2xl font-bold text-orange-700">
                    {violations.filter(v => v.level_accident === "เสี่ยงสูง").length}
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-orange-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-600">PPE</p>
                  <p className="text-2xl font-bold text-yellow-700">
                    {violations.filter(v => v.level_accident === "PPE").length}
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="ค้นหารายการ..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={riskLevelFilter} onValueChange={setRiskLevelFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="กรองตามระดับความเสี่ยง" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกระดับ</SelectItem>
                  <SelectItem value="PPE">PPE</SelectItem>
                  <SelectItem value="เสี่ยงสูง">เสี่ยงสูง</SelectItem>
                  <SelectItem value="อุปบัติเหตุ">อุปบัติเหตุ</SelectItem>
                </SelectContent>
              </Select>
              <div className="text-sm text-gray-600 flex items-center">
                แสดง {filteredViolations.length} จาก {violations.length} รายการ
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Violations Table */}
        <Card className="p-4">
          <CardHeader>
            <CardTitle>รายการ SHE Violations</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                <p className="mt-2 text-gray-600">กำลังโหลดข้อมูล...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>วันที่</TableHead>
                      <TableHead>รหัสพนักงาน</TableHead>
                      <TableHead>ชื่อพนักงาน</TableHead>
                      <TableHead>งานที่สังเกต</TableHead>
                      <TableHead>ระดับความเสี่ยง</TableHead>
                      <TableHead>Safe/Unsafe</TableHead>
                      <TableHead>จัดการ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredViolations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600">ไม่พบรายการที่ตรงกับเงื่อนไข</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredViolations.map((violation) => {
                        const riskInfo = getRiskLevelInfo(violation.level_accident);
                        const RiskIcon = riskInfo.icon;

                        return (
                          <TableRow key={violation.record_id}>
                            <TableCell>
                              {format(new Date(violation.date), "dd/MM/yyyy")}
                            </TableCell>
                            <TableCell className="font-medium">
                              {violation.employee_id}
                            </TableCell>
                            <TableCell>{getEmployeeName(violation.employee_id)}</TableCell>
                            <TableCell className="max-w-48 truncate">
                              {violation.observed_Work}
                            </TableCell>
                            <TableCell>
                              <Badge className={riskInfo.color}>
                                <RiskIcon className="h-3 w-3 mr-1" />
                                {violation.level_accident}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <span className="text-green-600 font-medium">
                                  {violation.safeActionCount}
                                </span>
                                <span className="text-gray-400">/</span>
                                <span className="text-red-600 font-medium">
                                  {violation.unsafeActionCount}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedViolation(violation);
                                    setIsViewDialogOpen(true);
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setEditingViolation({ ...violation });
                                    setIsEditDialogOpen(true);
                                  }}
                                >
                                  <Edit3 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedViolation(violation);
                                    setIsDeleteDialogOpen(true);
                                  }}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>รายละเอียดการแจ้ง</DialogTitle>
          </DialogHeader>
          {selectedViolation && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">วันที่</label>
                  <p className="text-sm">{format(new Date(selectedViolation.date), "dd MMMM yyyy", { locale: th })}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">รหัสพนักงาน</label>
                  <p className="text-sm">{selectedViolation.employee_id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">ชื่อพนักงาน</label>
                  <p className="text-sm">{getEmployeeName(selectedViolation.employee_id)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">ระดับความเสี่ยง</label>
                  <Badge className={getRiskLevelInfo(selectedViolation.level_accident).color}>
                    {selectedViolation.level_accident}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">หมวดหมู่ความปลอดภัย</label>
                <p className="text-sm">{getCategoryName(selectedViolation.safetycategory_id)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">งานที่สังเกต</label>
                <p className="text-sm">{selectedViolation.observed_Work}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">หมายเหตุแผนก</label>
                <p className="text-sm">{selectedViolation.department_notice}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">พฤติกรรมปลอดภัย</label>
                  <p className="text-sm text-green-600 font-medium">{selectedViolation.safeActionCount} คน</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">พฤติกรรมไม่ปลอดภัย</label>
                  <p className="text-sm text-red-600 font-medium">{selectedViolation.unsafeActionCount} คน</p>
                </div>
              </div>
              {selectedViolation.other && (
                <div>
                  <label className="text-sm font-medium text-gray-700">หมายเหตุเพิ่มเติม</label>
                  <p className="text-sm">{selectedViolation.other}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>แก้ไขการแจ้ง</DialogTitle>
          </DialogHeader>
          {editingViolation && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    งานที่สังเกต
                  </label>
                  <Textarea
                    value={editingViolation.observed_Work}
                    onChange={(e) =>
                      setEditingViolation({
                        ...editingViolation,
                        observed_Work: e.target.value,
                      })
                    }
                    rows={3}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    ระดับความเสี่ยง
                  </label>
                  <Select
                    value={editingViolation.level_accident}
                    onValueChange={(value) =>
                      setEditingViolation({
                        ...editingViolation,
                        level_accident: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกระดับความเสี่ยง" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PPE">PPE</SelectItem>
                      <SelectItem value="เสี่ยงสูง">เสี่ยงสูง</SelectItem>
                      <SelectItem value="อุบัติเหตุ">อุบัติเหตุ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  หมายเหตุแผนก
                </label>
                <Textarea
                  value={editingViolation.department_notice}
                  onChange={(e) =>
                    setEditingViolation({
                      ...editingViolation,
                      department_notice: e.target.value,
                    })
                  }
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    พฤติกรรมปลอดภัย (คน)
                  </label>
                  <Input
                    type="number"
                    value={editingViolation.safeActionCount}
                    onChange={(e) =>
                      setEditingViolation({
                        ...editingViolation,
                        safeActionCount: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    พฤติกรรมไม่ปลอดภัย (คน)
                  </label>
                  <Input
                    type="number"
                    value={editingViolation.unsafeActionCount}
                    onChange={(e) =>
                      setEditingViolation({
                        ...editingViolation,
                        unsafeActionCount: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  หมายเหตุเพิ่มเติม
                </label>
                <Textarea
                  value={editingViolation.other}
                  onChange={(e) =>
                    setEditingViolation({
                      ...editingViolation,
                      other: e.target.value,
                    })
                  }
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setEditingViolation(null);
              }}
            >
              ยกเลิก
            </Button>
            <Button
              onClick={() => editingViolation && updateViolation(editingViolation)}
              disabled={saving}
            >
              {saving ? "กำลังบันทึก..." : "บันทึก"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยืนยันการยกเลิก</DialogTitle>
            <DialogDescription>
              คุณต้องการยกเลิกการแจ้งรายการนี้ใช่หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </DialogDescription>
          </DialogHeader>
          {selectedViolation && (
            <div className="py-4">
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">รหัสพนักงาน:</span>
                  <span className="font-medium">{selectedViolation.employee_id}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">งานที่สังเกต:</span>
                  <span className="font-medium max-w-48 truncate">{selectedViolation.observed_Work}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">ระดับความเสี่ยง:</span>
                  <Badge className={getRiskLevelInfo(selectedViolation.level_accident).color}>
                    {selectedViolation.level_accident}
                  </Badge>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setSelectedViolation(null);
              }}
            >
              ยกเลิก
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedViolation && deleteViolation(selectedViolation.record_id)}
              disabled={saving}
            >
              {saving ? "กำลังลบ..." : "ยืนยันการลบ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default SheViolationsManagement;