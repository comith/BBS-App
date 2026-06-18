// app/dashboard/types.ts — shared types and pure helpers for the dashboard
import { CheckCircle2, Clock, XCircle, AlertCircle } from "lucide-react";
import { fixStorageUrl } from "@/lib/utils";


export interface ApiReport {
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
  status: string;
  adminNote?: string;
  approvedDate?: string;
  approvedBy?: string;
  comment?: string;
  aiInsight?: any;
}

export interface Report {
  id: number;
  recordId: string;
  date: Date;
  employeeId: string;
  employeeName: string;
  department: string;
  group: string;
  safetyCategory: string;
  subCategory: string | null;
  observedWork: string;
  observedDepartment: string;
  status: "approved" | "pending" | "rejected";
  safeCount: number;
  unsafeCount: number;
  selectedOptions: string[];
  attachment: Array<{
    id: string;
    name: string;
    webViewLink: string;
  }>;
  adminNote: string | null;
  approvedDate: Date | null;
  approvedBy: string | null;
  submittedDate: Date;
  priority: "low" | "normal" | "high";
  actionType?: string;
  actionTypeunsafe?: string;
  other?: string;
  comment?: string;
  aiInsight?: any;
  searchString: string;
}

export const getStatusInfo = (status: string) => {
  switch (status) {
    case "approved":
      return {
        label: "อนุมัติแล้ว",
        color: "bg-green-100 text-green-800 border-green-200",
        icon: CheckCircle2,
        textColor: "text-green-600",
      };
    case "pending":
      return {
        label: "รอการอนุมัติ",
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        icon: Clock,
        textColor: "text-yellow-600",
      };
    case "rejected":
      return {
        label: "ไม่อนุมัติ",
        color: "bg-red-100 text-red-800 border-red-200",
        icon: XCircle,
        textColor: "text-red-600",
      };
    default:
      return {
        label: "ไม่ทราบสถานะ",
        color: "bg-gray-100 text-gray-800 border-gray-200",
        icon: AlertCircle,
        textColor: "text-gray-600",
      };
  }
};

export const getPriorityInfo = (priority: string) => {
  switch (priority) {
    case "high":
      return {
        label: "สูง",
        color: "bg-red-100 text-red-800",
        textColor: "text-red-600",
      };
    case "low":
      return {
        label: "ต่ำ",
        color: "bg-gray-100 text-gray-800",
        textColor: "text-gray-600",
      };
    default:
      return {
        label: "ปกติ",
        color: "bg-blue-100 text-blue-800",
        textColor: "text-blue-600",
      };
  }
};

export const transformApiDataToDashboardReport = (
  apiData: ApiReport[],
  categories: any[],
  subCategories: any[]
): Report[] => {
  return apiData.map((item, index) => {
    const category = categories.find(
      (cat) => cat.id === parseInt(item.safetycategory_id)
    );
    const subCategory = subCategories.find(
      (sub) => sub.id === parseInt(item.sub_safetycategory_id)
    );

    let priority: "low" | "normal" | "high" = "normal";
    if (item.unsafeActionCount >= 3) {
      priority = "high";
    } else if (item.unsafeActionCount === 0) {
      priority = "low";
    }

    const selectedOptionsArray = Array.isArray(item.selectedOptions)
      ? item.selectedOptions.map((opt) =>
          typeof opt === "string" ? opt : opt.name || "ไม่ระบุ"
        )
      : [];

    const attachmentArray = Array.isArray(item.attachment)
      ? item.attachment.map((file) => {
          if (typeof file === "string") {
            return { id: "", name: file, webViewLink: "" };
          }
          return {
            id: file.id || "",
            name: file.name || "ไม่ระบุ",
            webViewLink: fixStorageUrl(file.webViewLink),

          };
        })
      : [];

    const catName = category?.name || `Category ID: ${item.safetycategory_id}`;
    const subCatName = subCategory?.name || "";
    const observedWorkVal = item.observed_Work || "ไม่ระบุ";
    const deptVal = item.depart || "";
    const searchString = `${item.fullname} ${item.employee_id} ${catName} ${subCatName} ${observedWorkVal} ${deptVal}`.toLowerCase();

    return {
      id: index + 1,
      recordId: item.record_id,
      date: new Date(item.date),
      employeeId: item.employee_id,
      employeeName: item.fullname,
      department: item.depart,
      group: item.group,
      safetyCategory: catName,
      subCategory: subCategory?.name || null,
      observedWork: observedWorkVal,
      observedDepartment: item.department_notice || item.group || "ไม่ระบุ",
      status:
        item.status && item.status.trim() !== ""
          ? (item.status as "approved" | "pending" | "rejected")
          : "pending",
      safeCount: Number(item.safeActionCount) || 0,
      unsafeCount: Number(item.unsafeActionCount) || 0,
      selectedOptions: selectedOptionsArray,
      attachment: attachmentArray,
      adminNote: item.adminNote || null,
      approvedDate: item.approvedDate ? new Date(item.approvedDate) : null,
      approvedBy: item.approvedBy || null,
      submittedDate: new Date(item.date),
      priority,
      actionType: item.actionType || "",
      actionTypeunsafe: item.actionTypeunsafe || "",
      other: item.other || "",
      comment: item.comment || "",
      aiInsight: item.aiInsight || null,
      searchString,
    };
  });
};
