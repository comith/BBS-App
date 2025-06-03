//component/formpage.tsx
"use client";
// ===================================== Import Statements =====================================
import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { format, isValid, parse } from "date-fns";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GrUserWorker } from "react-icons/gr";
import { ImUserTie } from "react-icons/im";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import Image from "next/image";

// ====================================== interface =====================================

interface Option {
  id: number;
  name: string;
}

interface SelectedOption {
  id: number;
  name: string;
}

interface Category {
  id: number;
  name: string;
  imagePath: string;
  alt: string;
}

interface SubSafetyCategory {
  id: number;
  category_id: number;
  name: string;
  imagePath: string;
  alt: string;
  type: "multiselect" | "option";
  subject: string;
  placeholder: string;
  title?: string;
  departcategory_id: Array<{ id: number; shortname: string }>;
  option: Option[];
}

interface Group {
  id: number;
  name: string;
  group: string;
}

interface Department {
  id: number;
  name: string;
  group: string;
  shortname?: string;
}

function SafetyObservationForm() {
  const { toast } = useToast();
  const searchParams = new URLSearchParams(window.location.search);
  const employeeId = searchParams.get("employeeId");
  const employeeName = searchParams.get("fullName");
  const depatment = searchParams.get("department");
  const group = searchParams.get("group");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [sub_safetyCategoryData, setSubSafetyCategoryData] = React.useState<
    SubSafetyCategory[]
  >([]);
  const [list_department, setListDepartment] = React.useState<Department[]>([]);
  const [list_group, setListGroup] = React.useState<Group[]>([]);
  const [safetyCategoryData, setSafetyCategoryData] = React.useState<
    Category[]
  >([]);

  const [isLoading, setIsLoading] = React.useState(true);
  const [uploadedFiles, setUploadedFiles] = React.useState<
    Array<{
      id: string;
      name: string;
      webViewLink: string;
      originalFile: File;
      status: "uploading" | "success" | "error";
      error?: string;
    }>
  >([]);
  const [isUploading, setIsUploading] = React.useState(false);

  // ===================================== Components =====================================

  // Form schema
  const formSchema = z
    .object({
      date: z
        .date({
          required_error: "กรุณาเลือก วันที่",
        })
        .refine((date) => date <= new Date(), {
          message: "วันที่ต้องไม่เกินวันนี้",
        }),
      employeeId: z.string().min(1, {
        message: "กรุณากรอก รหัสพนักงาน",
      }),
      username: z.string().min(1, {
        message: "กรุณาระบุ ชื่อ-นามสกุล",
      }),
      group: z.string().optional(),
      type: z.enum(
        list_department.length > 0
          ? ([
              list_department[0].name,
              ...list_department.slice(1).map((item) => item.name),
            ] as [string, ...string[]])
          : ([""] as [string, ...string[]]),
        {
          required_error: "กรุณาเลือก สังกัด บริษัท / แผนก",
          invalid_type_error: "กรุณาเลือก สังกัด บริษัท / แผนก",
        }
      ),
      safetyCategory: z.string().optional(),
      sub_safetyCategory: z.string().optional(),
      observed_work: z.string().min(1, {
        message: "กรุณากรอก งานที่สังเกตุ",
      }),
      depart_notice: z.string().min(1, {
        message: "กรุณาเลือก สังกัดแผนกที่ถูกสังเกตุ",
      }),
      vehicleEquipment: z
        .record(
          z.string(),
          z
            .record(
              z.string(),
              z.record(z.string(), z.boolean().optional()).optional()
            )
            .optional()
        )
        .optional(),
      selectedOptions: z
        .array(
          z.object({
            id: z.number(),
            name: z.string(),
          })
        )
        .min(1, {
          message: "กรุณาเลือกอย่างน้อย 1 รายการ",
        })
        .optional(),
      safeActionCount: z.coerce.number().min(0).optional(),
      actionType: z.enum(["ชมเชย", "เพิกเฉย"]).optional(),
      unsafeActionCount: z.coerce.number().min(0).optional(),
      actionTypeunsafe: z.enum(["ตักเตือน", "เพิกเฉย"]).optional(),
      attachment: z
        .any()
        .refine((files) => {
          // ตรวจสอบว่ามีไฟล์หรือไม่ (REQUIRED)
          if (Array.isArray(files)) {
            return (
              files.length > 0 && files.some((f) => f.status === "success")
            );
          } else {
            return files && files.length > 0;
          }
        }, "กรุณาแนบไฟล์อย่างน้อย 1 ไฟล์")
        .refine((files) => {
          // ตรวจสอบขนาดไฟล์

          if (Array.isArray(files)) {
            // Skip validation สำหรับ uploaded files เพราะผ่านการตรวจสอบแล้ว
            return true;
          }

          if (files && files.length > 0) {
            return Array.from(files).every((file) => {
              const fileObj = file as File;
              const isVideo = fileObj.type.startsWith("video/");
              const maxSize = isVideo ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
              return fileObj.size <= maxSize;
            });
          }
          return true;
        }, "ไฟล์รูปภาพ/เอกสารต้องไม่เกิน 10MB, วีดิโอไม่เกิน 100MB")
        .refine((files) => {
          if (Array.isArray(files)) {
            // Skip validation สำหรับ uploaded files เพราะผ่านการตรวจสอบแล้ว
            return true;
          }

          // ตรวจสอบประเภทไฟล์
          const allowedTypes = [
            // รูปภาพ
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/gif",
            "image/webp",
            "image/svg+xml",

            // เอกสาร
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

            // วีดิโอ
            "video/mp4",
            "video/mpeg",
            "video/quicktime",
            "video/x-msvideo", // .avi
            "video/webm",
            "video/x-ms-wmv", // .wmv
            "video/3gpp", // .3gp
            "video/x-flv", // .flv
          ];

          if (files && files.length > 0) {
            return Array.from(files).every((file) =>
              allowedTypes.includes((file as File).type)
            );
          }
          return true;
        }, "รองรับเฉพาะไฟล์รูปภาพ (JPG, PNG, GIF, WebP, SVG), วีดิโอ (MP4, AVI, MOV, WebM) และเอกสาร (PDF, DOC, DOCX)")
        .refine((files) => {
          // ตรวจสอบจำนวนไฟล์
          if (Array.isArray(files)) {
            return files.length <= 5;
          }

          return !files || files.length <= 5;
        }, "สามารถแนบไฟล์ได้สูงสุด 5 ไฟล์"),
      other: z.string().optional(),
      attachid: z.string().optional(),
      codeemployee: z.string().optional(),
      levelOfSafety: z.string().optional(),
    })
    .superRefine((data, ctx) => {
      // ถ้าเลือกหัวข้อที่ 8. อื่นๆ ต้องกรอกข้อมูลเพิ่มเติม

      const selectedOptions: SelectedOption[] = data.selectedOptions || [];
      if (
        selectedOptions.some(
          (item: SelectedOption) => item.id === 72 || item.name === "8. อื่นๆ"
        ) &&
        (!data.other || !data.other.trim())
      ) {
        ctx.addIssue({
          path: ["other"],
          code: z.ZodIssueCode.custom,
          message: "กรุณาระบุข้อมูลเพิ่มเติมหากเลือกหัวข้อ 'อื่นๆ'",
        });
      }
    });

  const uploadFileImmediately = async (file: File) => {
    const tempId = `temp_${Date.now()}_${Math.random()}`;

    // เพิ่มไฟล์ใน state พร้อมสถานะ uploading
    setUploadedFiles((prev) => [
      ...prev,
      {
        id: tempId,
        name: file.name,
        webViewLink: "",
        originalFile: file,
        status: "uploading",
      },
    ]);

    try {
      // สร้าง FormData สำหรับส่งไฟล์
      const formData = new FormData();
      formData.append("file", file);
      formData.append("filename", file.name);

      // ส่งไฟล์ไป API upload
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      console.log("Upload result:", result);

      if (!response.ok) {
        throw new Error(result.message || "Upload failed");
      }

      // อัปเดตสถานะเป็น success
      setUploadedFiles((prev) =>
        prev.map((item) =>
          item.id === tempId
            ? {
                ...item,
                id: result.file.id,
                webViewLink: result.file.webViewLink,
                status: "success" as const,
              }
            : item
        )
      );

      toast({
        title: "อัปโหลดสำเร็จ",
        description: `ไฟล์ ${file.name} ถูกอัปโหลดเรียบร้อยแล้ว`,
      });

      return result.file;
    } catch (error) {
      console.error("Upload error:", error);

      // อัปเดตสถานะเป็น error
      setUploadedFiles((prev) =>
        prev.map((item) =>
          item.id === tempId
            ? {
                ...item,
                status: "error" as const,
                error: error instanceof Error ? error.message : "Upload failed",
              }
            : item
        )
      );

      toast({
        title: "อัปโหลดล้มเหลว",
        description: `ไม่สามารถอัปโหลดไฟล์ ${file.name} ได้`,
        variant: "destructive",
      });

      throw error;
    }
  };

  const fetchDepartments = async (): Promise<Department[]> => {
    const response = await fetch("/api/get?type=department");
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  };

  const fetchGroups = async (): Promise<Group[]> => {
    const response = await fetch("/api/get?type=group");
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  };

  const fetchCategories = async (): Promise<Category[]> => {
    const response = await fetch("/api/get?type=category");
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  };

  const fetchSubSafetyCategories = async (): Promise<SubSafetyCategory[]> => {
    const response = await fetch("/api/get?type=subcategory");
    const data = await response.json();
    console.log("Fetched sub safety categories:", data);
    return Array.isArray(data) ? data : [];
  };

  React.useEffect(() => {
    setIsLoading(true);
    window.scrollTo(0, 0);

    const loadAllData = async () => {
      setIsLoading(true);
      try {
        const [departments, groups, categories, subSafetyCategories] =
          await Promise.all([
            fetchDepartments(),
            fetchGroups(),
            fetchCategories(),
            fetchSubSafetyCategories(),
          ]);

        setListDepartment(departments);
        setListGroup(groups);
        setSafetyCategoryData(categories);
        setSubSafetyCategoryData(subSafetyCategories);
      } catch (error) {
        // handle error
      } finally {
        setIsLoading(false);
      }
    };

    loadAllData();
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date(),
      employeeId: employeeId ?? undefined,
      username: employeeName ?? "",
      type: depatment ?? "",
      group: group ?? "",
      safetyCategory: undefined,
      sub_safetyCategory: undefined,
      observed_work: "",
      depart_notice: "",
      vehicleEquipment: {},
      safeActionCount: undefined,
      unsafeActionCount: undefined,
      selectedOptions: [],
      attachment: undefined,
      attachid: "",
      other: "",
      codeemployee: "",
      levelOfSafety: "",
    },
    mode: "onTouched",
  });

  React.useEffect(() => {
    const successfulFiles = uploadedFiles.filter((f) => f.status === "success");

    // อัปเดต form field เฉพาะเมื่อมีไฟล์ที่สำเร็จ
    if (successfulFiles.length > 0) {
      form.setValue("attachment", successfulFiles);
    } else if (uploadedFiles.length === 0) {
      // ถ้าไม่มีไฟล์เลย ให้ clear field
      form.setValue("attachment", undefined);
    }

    // Trigger validation
    form.trigger("attachment");
  }, [uploadedFiles, form]);

  const addnewUser = async () => {
    const employeeId = form.getValues("employeeId");
    const username = form.getValues("username");
    const type = form.getValues("type");
    const group = form.getValues("group");

    if (!employeeId || !username) {
      toast({
        title: "กรุณากรอกรหัสพนักงานและชื่อให้ครบถ้วน",
        variant: "destructive",
      });
      return false; // ❌ return false เพื่อหยุดการดำเนินการ
    }

    try {
      const response = await fetch("/api/post", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "employee", // ✅ ส่ง type employee
          data: {
            employeerId: employeeId,
            fullName: username,
            department: type,
            group: group || "",
            position: "employee",
          },
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to add user");
      }

      toast({
        title: "เพิ่มพนักงานสำเร็จ",
        description: `พนักงาน ${username} ถูกเพิ่มเรียบร้อยแล้ว`,
        variant: "success",
      });

      return true; // ✅ return true เมื่อสำเร็จ
    } catch (error) {
      console.error("Error adding user:", error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description:
          error instanceof Error ? error.message : "ไม่สามารถเพิ่มพนักงานได้",
        variant: "destructive",
      });
      return false; // ❌ return false เมื่อเกิดข้อผิดพลาด
    }
  };

  // Improved form submission with proper validation and feedback
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    // ตรวจสอบ form errors ก่อนส่ง
    const isValid = handleFormErrors();
    if (!isValid) {
      return; // หยุดการส่งถ้ามี errors
    }
    const needToAddEmployee = employeeName === "" || employeeId === "";

    if (needToAddEmployee) {
      console.log("🔍 Need to add new employee first");
      const addEmployeeSuccess = await addnewUser();

      if (!addEmployeeSuccess) {
        console.log("❌ Failed to add employee, stopping submission");
        return; // หยุดการส่งข้อมูลถ้าเพิ่มพนักงานไม่สำเร็จ
      }

      console.log("✅ Employee added successfully, continuing with submission");
    }

    setIsSubmitting(true);

    try {
      // 🔥 เช็คจากไฟล์ที่อัปโหลดสำเร็จแล้ว แทนที่จะเช็คจาก data.attachment
      const successfulFiles = uploadedFiles.filter(
        (f) => f.status === "success"
      );
      const hasUploadedFiles = successfulFiles.length > 0;

      console.log("🔍 Submit check:", {
        totalUploadedFiles: uploadedFiles.length,
        successfulFiles: successfulFiles.length,
        hasUploadedFiles: hasUploadedFiles,
        fileIds: successfulFiles.map((f) => f.id),
      });

      if (hasUploadedFiles) {
        // 🔥 กรณีมีไฟล์ที่อัปโหลดสำเร็จแล้ว: ส่งเป็น JSON พร้อม file IDs
        const submissionData = {
          date: data.date ? data.date.toISOString() : new Date().toISOString(),
          employeeId: data.employeeId || "",
          username: data.username || "",
          group: data.group || "",
          type: data.type || "",
          safetyCategory: data.safetyCategory || "",
          sub_safetyCategory: data.sub_safetyCategory || "",
          observed_work: data.observed_work || "",
          depart_notice: data.depart_notice || "",
          safeActionCount: data.safeActionCount || 0,
          actionType: data.actionType || "",
          unsafeActionCount: data.unsafeActionCount || 0,
          actionTypeunsafe: data.actionTypeunsafe || "",
          other: data.other || "",
          vehicleEquipment: data.vehicleEquipment || {},
          selectedOptions: data.selectedOptions || [],
          // ✅ ส่ง file IDs ทั้งหมดที่อัปโหลดสำเร็จ
          uploadedFiles: successfulFiles.map((f) => ({
            id: f.id,
            name: f.name,
            webViewLink: f.webViewLink,
          })),
          codeemployee: data.codeemployee || "",
          levelOfSafety: data.levelOfSafety || "",
        };

        console.log("📤 Submitting with files:", {
          fileCount: submissionData.uploadedFiles.length,
          files: submissionData.uploadedFiles,
        });

        // ส่งข้อมูลเป็น JSON
        const response = await fetch("/api/post", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(submissionData),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Failed to submit data");
        }

        // แสดงข้อความสำเร็จ
        toast({
          title: "บันทึกข้อมูลสำเร็จ",
          variant: "success",
          description: "ข้อมูลของคุณถูกบันทึกเรียบร้อยแล้ว",
        });

        console.log("✅ Submission successful with uploaded files:", result);
      } else {
        // 🔥 กรณีไม่มีไฟล์: ส่งข้อมูลอย่างเดียว
        const submissionData = {
          date: data.date ? data.date.toISOString() : new Date().toISOString(),
          employeeId: data.employeeId,
          username: data.username,
          group: data.group,
          type: data.type,
          safetyCategory: data.safetyCategory,
          sub_safetyCategory: data.sub_safetyCategory,
          observed_work: data.observed_work,
          depart_notice: data.depart_notice,
          vehicleEquipment: data.vehicleEquipment || {},
          selectedOptions: data.selectedOptions || [],
          safeActionCount: data.safeActionCount || 0,
          actionType: data.actionType || "",
          unsafeActionCount: data.unsafeActionCount || 0,
          actionTypeunsafe: data.actionTypeunsafe || "",
          uploadedFiles: [], // ไม่มีไฟล์
          other: data.other || "",
        };

        console.log("📤 Submitting without files");

        const response = await fetch("/api/post", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(submissionData),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Failed to submit data");
        }

        toast({
          title: "ส่งข้อมูลสำเร็จ",
          variant: "success",
          description: `ข้อมูลการสังเกตความปลอดภัยถูกบันทึกเรียบร้อยแล้ว${
            result.data?.recordId ? ` (ID: ${result.data.recordId})` : ""
          }`,
        });

        console.log("✅ Submission successful without files:", result);
      }

      // 🔄 รีเซ็ตหลังจากส่งสำเร็จ
      form.reset();
      setUploadedFiles([]);
    } catch (error) {
      console.error("❌ Submission error:", error);

      toast({
        title: "เกิดข้อผิดพลาด",
        description:
          error instanceof Error
            ? error.message
            : "ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get form values
  const selectedType = form.watch("type");
  const selectedSafetyCategory = form.watch("safetyCategory");
  const selectedSubCategory = form.watch("sub_safetyCategory");
  const safeActionCount = form.watch("safeActionCount") || 0;
  const unsafeActionCount = form.watch("unsafeActionCount") || 0;

  // Derived values
  const isDepartmentITH =
    list_department.find((item) => item.name === selectedType)?.group === "ITH";

  // Determine if safety subcategory should show
  const showSubSafetyCategory =
    selectedSafetyCategory && selectedSafetyCategory !== "4";

  // Filter subcategories based on selected category
  const filteredSubCategories = selectedSafetyCategory
    ? sub_safetyCategoryData.filter(
        (item) => item.category_id === Number(selectedSafetyCategory)
      )
    : [];

  // Handler for form errors
  const handleFormErrors = () => {
    const criticalFields = [
      "date",
      "employeeId",
      "username",
      "type",
      "observed_work",
      "attachment",
    ];

    const criticalErrors = criticalFields.filter(
      (field) =>
        !!form.formState.errors[field as keyof typeof form.formState.errors]
    );

    if (criticalErrors.length > 0) {
      const errorMessages = criticalErrors.map((field) => {
        const error =
          form.formState.errors[field as keyof typeof form.formState.errors];
        return `${field}: ${error?.message || "Invalid"}`;
      });

      console.log("Critical form errors:", errorMessages);

      toast({
        title: "กรุณาตรวจสอบข้อมูล",
        description: `ท่านได้กรอกข้อมูลไม่ครบถ้วน`,
        variant: "destructive",
      });

      // Scroll to first error field
      const firstErrorField = document.querySelector(
        `[name="${criticalErrors[0]}"]`
      );
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: "smooth", block: "center" });
      }

      return false; // Return false if there are errors
    }

    return true; // Return true if no errors
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl m-auto bg-white p-3">
      <Image
        src="/img/header.jpg"
        alt="Logo"
        className="w-full m-auto mb-4"
        width={800}
        height={200}
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Employee Information Section */}
          <FormSection
            title="ข้อมูลพนักงาน"
            icon={<ImUserTie className="text-3xl" />}
          >
            <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_2fr] gap-4">
              {/* Date Field */}
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      วันที่
                      <RequiredMark />
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="dd-MM-yyyy"
                        value={
                          field.value && isValid(new Date(field.value))
                            ? format(new Date(field.value), "dd/MM/yyyy")
                            : ""
                        }
                        onChange={(e) => {
                          const value = e.target.value;
                          const parsed = parse(value, "dd/MM/yyyy", new Date());
                          field.onChange(isValid(parsed) ? parsed : undefined);
                        }}
                        disabled
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Employee ID Field */}
              <FormField
                control={form.control}
                name="employeeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      รหัสพนักงาน
                      <RequiredMark />
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="รหัสพนักงาน"
                        {...field}
                        readOnly={!!employeeId}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Employee Name Field */}
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem className="gap-0">
                    <FormLabel>
                      ชื่อ-นามสกุล
                      <RequiredMark />
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="ชื่อ - นามสกุล"
                        {...field}
                        readOnly={!!employeeName}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Department Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>
                      สังกัด บริษัท / แผนก
                      <RequiredMark />
                    </FormLabel>
                    <FormControl>
                      <DepartmentSelection
                        value={field.value}
                        onChange={field.onChange}
                        departments={list_department}
                        form={form}
                        readOnly={!!depatment}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Group Selection for ITH departments */}
              {isDepartmentITH && (
                <FormField
                  control={form.control}
                  name="group"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        เลือกกลุ่มในชุด{" "}
                        <span className="font-bold text-orange-400">
                          {selectedType}
                        </span>
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={!!group}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="เลือกกลุ่ม" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {list_group
                            .filter((item) => item.group === selectedType)
                            .map((item) => (
                              <SelectItem key={item.id} value={item.name}>
                                {item.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
          </FormSection>

          {/* Safety Category Selection */}
          <FormField
            control={form.control}
            name="safetyCategory"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormSection
                  title="หัวข้อที่สังเกตุพฤติกรรมความปลอดภัยในการทำงาน"
                  icon={<GrUserWorker className="text-[36px]" />}
                >
                  <FormControl>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                      {safetyCategoryData.map((category) => (
                        <CategoryCard
                          key={category.id}
                          category={category}
                          isSelected={field.value === String(category.id)}
                          onClick={() => {
                            const newValue =
                              field.value === String(category.id)
                                ? undefined
                                : String(category.id);
                            field.onChange(newValue);

                            // Clear sub category and options when main category changes
                            form.setValue("sub_safetyCategory", undefined);
                            form.setValue("selectedOptions", []);
                          }}
                        />
                      ))}
                    </div>
                  </FormControl>
                </FormSection>
              </FormItem>
            )}
          />

          {/* Sub-safety Category Selection */}
          {showSubSafetyCategory && (
            <FormField
              control={form.control}
              name="sub_safetyCategory"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormSection
                    title={
                      safetyCategoryData.find(
                        (item) => item.id === Number(selectedSafetyCategory)
                      )?.name || ""
                    }
                  >
                    <FormControl>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                        {filteredSubCategories.map((category) => (
                          <CategoryCard
                            key={category.id}
                            category={category}
                            isSelected={field.value === String(category.id)}
                            onClick={() => {
                              const newValue =
                                field.value === String(category.id)
                                  ? undefined
                                  : String(category.id);

                              field.onChange(newValue);
                              form.setValue("selectedOptions", []);
                              form.setValue("depart_notice", "");
                            }}
                          />
                        ))}
                      </div>
                    </FormControl>
                  </FormSection>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Observed Work and Equipment Section */}
          {(form.watch("sub_safetyCategory") ||
            form.watch("safetyCategory") === "4") && (
            <FormSection
              title={
                selectedSafetyCategory === "4"
                  ? safetyCategoryData.find((item) => item.id === 4)?.name || ""
                  : sub_safetyCategoryData.find(
                      (item) => item.id === Number(selectedSubCategory)
                    )?.name || ""
              }
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 space-y-3 mb-4">
                <FormField
                  control={form.control}
                  name="observed_work"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {selectedSafetyCategory === "4"
                          ? sub_safetyCategoryData.find(
                              (item) => item.id === 10
                            )?.subject || "งานที่สังเกตุ"
                          : sub_safetyCategoryData.find(
                              (item) => item.id === Number(selectedSubCategory)
                            )?.subject || "งานที่สังเกตุ"}
                        <RequiredMark />
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={
                            selectedSafetyCategory === "4"
                              ? sub_safetyCategoryData.find(
                                  (item) => item.id === 10
                                )?.placeholder || "ระบุพื้นที่พบเจอ"
                              : sub_safetyCategoryData.find(
                                  (item) =>
                                    item.id === Number(selectedSubCategory)
                                )?.placeholder || "งานที่สังเกตุ"
                          }
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="depart_notice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        สังกัดแผนกที่ถูกสังเกตุ <RequiredMark />
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="เลือกสังกัดแผนกที่ถูกสังเกตุ" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(() => {
                            // ถ้าเลือก Safety Category 4 ให้ใช้ข้อมูลจาก id = 10
                            if (selectedSafetyCategory === "4") {
                              return sub_safetyCategoryData
                                .find((item) => item.id === 10)
                                ?.departcategory_id?.map((item) => (
                                  <SelectItem
                                    key={item.id}
                                    value={item.shortname}
                                  >
                                    {item.shortname}
                                  </SelectItem>
                                ));
                            }

                            // ถ้ามี Sub Category ที่เลือก ให้ใช้ข้อมูลจาก Sub Category
                            if (selectedSubCategory) {
                              return sub_safetyCategoryData
                                .find(
                                  (item) =>
                                    item.id === Number(selectedSubCategory)
                                )
                                ?.departcategory_id?.map((item) => (
                                  <SelectItem
                                    key={item.id}
                                    value={item.shortname}
                                  >
                                    {item.shortname}
                                  </SelectItem>
                                ));
                            }

                            // ถ้าไม่มี Sub Category แต่มี Safety Category (fallback)
                            if (selectedSafetyCategory) {
                              const fallbackData = sub_safetyCategoryData.find(
                                (item) =>
                                  item.id === Number(selectedSafetyCategory)
                              );
                              return fallbackData?.departcategory_id?.map(
                                (item) => (
                                  <SelectItem
                                    key={item.id}
                                    value={item.shortname}
                                  >
                                    {item.shortname}
                                  </SelectItem>
                                )
                              );
                            }

                            // ถ้าไม่มีข้อมูลเลย
                            return (
                              <SelectItem value="" disabled>
                                กรุณาเลือก Category ก่อน
                              </SelectItem>
                            );
                          })()}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {group === "SHE" && (
                  <div className="flex flex-col md:flex-row md:col-span-2 gap-4">
                    <FormField
                      control={form.control}
                      name="codeemployee"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            รหัสพนักงานที่ถูกสังเกตุ (ถ้ามี)
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              placeholder="ระบุรหัสพนักงานที่ถูกสังเกตุ เช่น 5LD01234"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="levelOfSafety"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ระดับความเสี่ยง</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="เลือกระดับความเสี่ยง" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {["PPE", "เสี่ยงสูง", "อุบัติเหตุ"].map(
                                (level) => (
                                  <SelectItem key={level} value={level}>
                                    {level}
                                  </SelectItem>
                                )
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>

              {/* Dynamic Options - Multi-Select or Single Select based on type */}
              <FormField
                control={form.control}
                name="selectedOptions"
                render={({ field }) => {
                  const selectedValues = field.value || [];

                  // ถ้าเลือก safety category 4 ให้ใช้ข้อมูลจาก sub_safetyCategoryData id 10
                  // ถ้าไม่ใช่ ให้ใช้ sub category ปกติ
                  const currentSubCategory =
                    selectedSafetyCategory === "4"
                      ? sub_safetyCategoryData.find((item) => item.id === 10)
                      : sub_safetyCategoryData.find(
                          (item) => item.id === Number(selectedSubCategory)
                        );

                  // ตรวจสอบว่ามีข้อมูลให้แสดงหรือไม่
                  if (
                    selectedSafetyCategory === "4"
                      ? !currentSubCategory || !currentSubCategory.option
                      : !selectedSubCategory ||
                        !currentSubCategory ||
                        !currentSubCategory.option
                  ) {
                    return (
                      <FormItem>
                        <FormLabel>เลือกรายการ</FormLabel>
                        <div className="text-sm text-gray-500 p-4 border rounded-md bg-gray-50">
                          {selectedSafetyCategory === "4"
                            ? "ไม่พบข้อมูลตัวเลือก"
                            : "กรุณาเลือก Sub Category ก่อน"}
                        </div>
                        <FormMessage />
                      </FormItem>
                    );
                  }

                  // ตรวจสอบ type ว่าเป็น "multiselect" หรือ "option" (single)
                  const isMultiSelect =
                    currentSubCategory &&
                    currentSubCategory.type === "multiselect";

                  // Handler สำหรับ Multi-Select (checkbox)

                  const handleCheckedChange = (
                    optionId: number,
                    optionName: string,
                    checked: boolean | "indeterminate"
                  ) => {
                    const newValues: Option[] = checked
                      ? [...selectedValues, { id: optionId, name: optionName }]
                      : selectedValues.filter(
                          (item: Option) => item.id !== optionId
                        );

                    field.onChange(newValues);
                  };

                  // Handler สำหรับ Single Select (radio)
                  const handleRadioChange = (
                    optionId: number,
                    optionName: string
                  ) => {
                    // ถ้าเลือกตัวเดิมอีกครั้ง ให้ unselect
                    const isCurrentlySelected = selectedValues.some(
                      (item: Option) => item.id === optionId
                    );

                    if (isCurrentlySelected) {
                      field.onChange([]);
                    } else {
                      field.onChange([{ id: optionId, name: optionName }]);
                    }
                  };

                  return (
                    <FormItem className="mt-4">
                      <FormLabel>
                        <span className="text-md font-semibold">
                          {selectedSafetyCategory === "4"
                            ? currentSubCategory?.title ||
                              "ประเภทความเสี่ยง Unsafe condition"
                            : sub_safetyCategoryData.find(
                                (item) =>
                                  item.id === Number(selectedSubCategory)
                              )?.title || "เลือกรายการประเมินพฤติกรรม"}
                        </span>

                        <RequiredMark />
                        {isMultiSelect ? (
                          <span className="text-xs text-blue-600 ml-2">
                            (เลือกได้หลายรายการ)
                          </span>
                        ) : (
                          <span className="text-xs text-green-600 ml-2">
                            (เลือกได้ 1 รายการ)
                          </span>
                        )}
                      </FormLabel>

                      <div className="space-y-3 h-auto overflow-y-auto border rounded-md p-4">
                        {currentSubCategory &&
                          currentSubCategory.option &&
                          currentSubCategory.option.map((option) => {
                            const isSelected = selectedValues.some(
                              (item) => item.id === option.id
                            );

                            return (
                              <div
                                key={option.id}
                                className="flex items-start space-x-3"
                              >
                                {isMultiSelect ? (
                                  // Multi-Select: ใช้ Checkbox
                                  <Checkbox
                                    id={`option-${option.id}`}
                                    checked={isSelected}
                                    onCheckedChange={(checked) =>
                                      handleCheckedChange(
                                        option.id,
                                        option.name,
                                        checked
                                      )
                                    }
                                    className="mt-0.5 flex-shrink-0"
                                  />
                                ) : (
                                  // Single Select: ใช้ Radio Button
                                  <input
                                    type="radio"
                                    id={`option-${option.id}`}
                                    name="single-option"
                                    checked={isSelected}
                                    onChange={() =>
                                      handleRadioChange(option.id, option.name)
                                    }
                                    className="mt-1 flex-shrink-0"
                                  />
                                )}
                                <label
                                  htmlFor={`option-${option.id}`}
                                  className="text-sm font-medium leading-relaxed cursor-pointer"
                                >
                                  {option.name}
                                </label>
                              </div>
                            );
                          })}
                      </div>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
              {form
                .watch("selectedOptions")
                ?.some((item) => item.name === "8. อื่นๆ") && (
                <FormField
                  control={form.control}
                  name="other"
                  render={({ field }) => (
                    <FormItem className="mt-4">
                      <FormLabel>
                        หากเลือกหัวข้อที่ 8.อื่นๆ จงอธิบาย
                        <RequiredMark />
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="กรุณาระบุข้อมูลเพิ่มเติม"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Safe Action Section */}
              <div className="flex flex-col md:flex-row gap-8 mt-4">
                <FormField
                  control={form.control}
                  name="safeActionCount"
                  render={({ field }) => (
                    <FormItem className="space-y-3 md:mb-4 flex-1">
                      <FormLabel>
                        <b className="text-green-600">Safe Action</b>{" "}
                        พฤติกรรมที่ปลอดภัย (จำนวนคน)
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          placeholder="จำนวนคนที่มีพฤติกรรมปลอดภัย"
                          value={field.value || ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === "") {
                              field.onChange(undefined);
                            } else {
                              const numValue = Number(value);
                              field.onChange(numValue >= 0 ? numValue : 0);
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {safeActionCount > 0 && (
                  <FormField
                    control={form.control}
                    name="actionType"
                    render={({ field }) => (
                      <FormItem className="space-y-3 mb-4 flex-1">
                        <FormLabel>
                          ท่านดำเนินการอย่างไรกับผู้ปฏิบัติงานที่ปลอดภัย
                        </FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="flex flex-row gap-10 mt-2"
                          >
                            <div className="flex items-center space-x-3">
                              <RadioGroupItem value="ชมเชย" id="praise" />
                              <Label htmlFor="praise">ชมเชย</Label>
                            </div>
                            <div className="flex items-center space-x-3">
                              <RadioGroupItem
                                value="เพิกเฉย"
                                id="ignore-safe"
                              />
                              <Label htmlFor="ignore-safe">เพิกเฉย</Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              {/* Unsafe Action Section */}
              <div className="flex flex-col mt-4 md:flex-row gap-8">
                <FormField
                  control={form.control}
                  name="unsafeActionCount"
                  render={({ field }) => (
                    <FormItem className="space-y-3 md:mb-4 flex-1">
                      <FormLabel>
                        <b className="text-red-600">Unsafe Action</b>{" "}
                        พฤติกรรมที่ไม่ปลอดภัย (จำนวนคน)
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          placeholder="จำนวนคนที่มีพฤติกรรมไม่ปลอดภัย"
                          value={field.value || ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === "") {
                              field.onChange(undefined);
                            } else {
                              const numValue = Number(value);
                              field.onChange(numValue >= 0 ? numValue : 0);
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {unsafeActionCount > 0 && (
                  <FormField
                    control={form.control}
                    name="actionTypeunsafe"
                    render={({ field }) => (
                      <FormItem className="space-y-3 mb-4 flex-1">
                        <FormLabel>
                          ท่านดำเนินการอย่างไรกับผู้ปฏิบัติงานที่ไม่ปลอดภัย
                        </FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="flex flex-row gap-10 mt-2"
                          >
                            <div className="flex items-center space-x-3">
                              <RadioGroupItem value="ตักเตือน" id="warn" />
                              <Label htmlFor="warn">ตักเตือน</Label>
                            </div>
                            <div className="flex items-center space-x-3">
                              <RadioGroupItem
                                value="เพิกเฉย"
                                id="ignore-unsafe"
                              />
                              <Label htmlFor="ignore-unsafe">เพิกเฉย</Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              {/* File Attachment Field */}
              <FormField
                control={form.control}
                name="attachment"
                render={({ field }) => (
                  <FormItem className="space-y-3 my-6">
                    <FormLabel className="text-base font-semibold text-gray-800">
                      แนบรูปพฤติกรรมที่สังเกตุ <RequiredMark />
                    </FormLabel>
                    <FormControl>
                      <div className="space-y-4">
                        {/* Modern File Drop Zone */}
                        <div
                          className={cn(
                            "relative border-2 border-dashed rounded-xl p-8 transition-all duration-300 cursor-pointer group",
                            "hover:border-blue-400 hover:bg-blue-50/50",
                            form.formState.errors.attachment
                              ? "border-red-300 bg-red-50/30"
                              : uploadedFiles.length > 0
                              ? "border-green-400 bg-green-50/30"
                              : "border-gray-300 bg-gray-50/50"
                          )}
                          onClick={() =>
                            document
                              .getElementById("file-upload-input")
                              ?.click()
                          }
                        >
                          {/* Hidden File Input */}
                          <input
                            id="file-upload-input"
                            type="file"
                            multiple
                            accept="image/*,video/*,.pdf,.doc,.docx"
                            onChange={async (e) => {
                              const files = e.target.files;
                              if (!files || files.length === 0) return;

                              // ตรวจสอบจำนวนไฟล์ทั้งหมด
                              if (uploadedFiles.length + files.length > 5) {
                                toast({
                                  title: "ไฟล์เกินจำนวนที่อนุญาต",
                                  description: "สามารถแนบไฟล์ได้สูงสุด 5 ไฟล์",
                                  variant: "destructive",
                                });
                                return;
                              }

                              setIsUploading(true);

                              // อัปโหลดไฟล์ทีละไฟล์
                              const uploadPromises = Array.from(files).map(
                                async (file) => {
                                  // ตรวจสอบขนาดไฟล์
                                  const isVideo =
                                    file.type.startsWith("video/");
                                  const maxSize = isVideo
                                    ? 100 * 1024 * 1024
                                    : 10 * 1024 * 1024;

                                  if (file.size > maxSize) {
                                    toast({
                                      title: "ไฟล์ใหญ่เกินไป",
                                      description: `ไฟล์ ${
                                        file.name
                                      } ใหญ่เกิน ${isVideo ? "100MB" : "10MB"}`,
                                      variant: "destructive",
                                    });
                                    return null;
                                  }

                                  // ตรวจสอบประเภทไฟล์
                                  const allowedTypes = [
                                    "image/jpeg",
                                    "image/jpg",
                                    "image/png",
                                    "image/gif",
                                    "image/webp",
                                    "image/svg+xml",
                                    "application/pdf",
                                    "application/msword",
                                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                                    "video/mp4",
                                    "video/mpeg",
                                    "video/quicktime",
                                    "video/x-msvideo",
                                    "video/webm",
                                    "video/x-ms-wmv",
                                    "video/3gpp",
                                    "video/x-flv",
                                  ];

                                  if (!allowedTypes.includes(file.type)) {
                                    toast({
                                      title: "ประเภทไฟล์ไม่ถูกต้อง",
                                      description: `ไฟล์ ${file.name} ไม่ใช่ประเภทที่รองรับ`,
                                      variant: "destructive",
                                    });
                                    return null;
                                  }

                                  try {
                                    return await uploadFileImmediately(file);
                                  } catch (error) {
                                    return null;
                                  }
                                }
                              );

                              // รอให้อัปโหลดทั้งหมดเสร็จ
                              await Promise.all(uploadPromises);
                              setIsUploading(false);
                              // รีเซ็ต input
                              e.target.value = "";
                            }}
                            className="hidden"
                          />

                          {/* Upload Content */}
                          <div className="text-center">
                            {isUploading ? (
                              // Uploading State
                              <div className="space-y-4">
                                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                                  <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                                <div>
                                  <p className="text-lg font-semibold text-blue-700">
                                    🔄 กำลังอัปโหลด...
                                  </p>
                                  <p className="text-sm text-blue-600 mt-1">
                                    กรุณารอสักครู่
                                  </p>
                                </div>
                              </div>
                            ) : uploadedFiles.length > 0 ? (
                              // Files Uploaded State
                              <div className="space-y-4">
                                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-200 transition-colors">
                                  <svg
                                    className="w-8 h-8 text-green-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                </div>
                                <div>
                                  <p className="text-lg font-semibold text-green-700">
                                    ✨ มีไฟล์แนบแล้ว!
                                  </p>
                                  <p className="text-sm text-green-600 mt-1">
                                    {uploadedFiles.length} ไฟล์ |
                                    คลิกเพื่อเพิ่มไฟล์
                                  </p>
                                </div>
                              </div>
                            ) : (
                              // Default State
                              <div className="space-y-4">
                                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                                  <svg
                                    className="w-8 h-8 text-blue-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                    />
                                  </svg>
                                </div>
                                <div>
                                  <p className="text-lg font-semibold text-gray-700">
                                    📎 เลือกไฟล์หรือลากไฟล์มาวาง
                                  </p>
                                  <p className="text-sm text-gray-500 mt-1">
                                    ไฟล์จะถูกอัปโหลดทันทีเมื่อเลือก
                                    <br />
                                    <span className="text-xs">
                                      รูปภาพ/เอกสาร: ไม่เกิน 10MB | วีดิโอ:
                                      ไม่เกิน 100MB
                                    </span>
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Quick Upload Button */}
                            <div className="mt-6">
                              <span className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-full text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform group-hover:scale-105">
                                <svg
                                  className="w-5 h-5 mr-2"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                  />
                                </svg>
                                {uploadedFiles.length > 0
                                  ? "เพิ่มไฟล์"
                                  : "เลือกไฟล์"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Uploaded Files List */}
                        {uploadedFiles.length > 0 && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-semibold text-gray-700">
                                📁 ไฟล์ที่อัปโหลด (
                                {
                                  uploadedFiles.filter(
                                    (f) => f.status === "success"
                                  ).length
                                }
                                /{uploadedFiles.length})
                              </h4>
                              <button
                                type="button"
                                onClick={() => {
                                  setUploadedFiles([]);
                                  field.onChange([]);
                                  form.trigger("attachment");
                                }}
                                className="text-xs text-red-500 hover:text-red-700 font-medium px-3 py-1 rounded-full hover:bg-red-50 transition-colors"
                              >
                                ลบทั้งหมด
                              </button>
                            </div>

                            <div className="grid gap-3 max-h-60 overflow-y-auto">
                              {uploadedFiles.map((uploadedFile, index) => {
                                const file = uploadedFile.originalFile;
                                const isImage = file.type.startsWith("image/");
                                const isVideo = file.type.startsWith("video/");
                                const isPDF = file.type === "application/pdf";
                                const isDoc =
                                  file.type.includes("word") ||
                                  file.name.toLowerCase().endsWith(".doc") ||
                                  file.name.toLowerCase().endsWith(".docx");

                                const fileSize = (
                                  file.size /
                                  1024 /
                                  1024
                                ).toFixed(2);

                                return (
                                  <div
                                    key={uploadedFile.id}
                                    className={cn(
                                      "flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-md",
                                      uploadedFile.status === "success"
                                        ? "bg-white border-green-200 hover:border-green-300"
                                        : uploadedFile.status === "uploading"
                                        ? "bg-blue-50 border-blue-200"
                                        : "bg-red-50 border-red-300"
                                    )}
                                  >
                                    <div className="flex items-center space-x-4 flex-1 min-w-0">
                                      {/* File Icon */}
                                      <div
                                        className={cn(
                                          "w-12 h-12 rounded-lg flex items-center justify-center text-xl font-semibold",
                                          isImage
                                            ? "bg-purple-100 text-purple-600"
                                            : isVideo
                                            ? "bg-orange-100 text-orange-600"
                                            : isPDF
                                            ? "bg-red-100 text-red-600"
                                            : isDoc
                                            ? "bg-blue-100 text-blue-600"
                                            : "bg-gray-100 text-gray-600"
                                        )}
                                      >
                                        {isImage
                                          ? "🖼️"
                                          : isVideo
                                          ? "🎬"
                                          : isPDF
                                          ? "📄"
                                          : isDoc
                                          ? "📝"
                                          : "📎"}
                                      </div>

                                      {/* File Info */}
                                      <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold text-gray-900 truncate">
                                          {file.name}
                                        </p>
                                        <div className="flex items-center space-x-2 text-xs mt-1">
                                          <span
                                            className={cn(
                                              "px-2 py-1 rounded-full font-medium",
                                              uploadedFile.status === "success"
                                                ? "bg-green-100 text-green-700"
                                                : uploadedFile.status ===
                                                  "uploading"
                                                ? "bg-blue-100 text-blue-700"
                                                : "bg-red-100 text-red-700"
                                            )}
                                          >
                                            {fileSize} MB
                                          </span>
                                          <span className="text-gray-400">
                                            •
                                          </span>
                                          <span className="text-gray-500 uppercase text-xs">
                                            {file.type.split("/")[1] ||
                                              "Unknown"}
                                          </span>
                                          {uploadedFile.status ===
                                            "uploading" && (
                                            <>
                                              <span className="text-gray-400">
                                                •
                                              </span>
                                              <span className="text-blue-600 font-semibold">
                                                อัปโหลด...
                                              </span>
                                            </>
                                          )}
                                          {uploadedFile.status === "error" && (
                                            <>
                                              <span className="text-gray-400">
                                                •
                                              </span>
                                              <span className="text-red-600 font-semibold">
                                                ล้มเหลว
                                              </span>
                                            </>
                                          )}
                                        </div>
                                      </div>

                                      {/* Status Icon */}
                                      <div className="flex-shrink-0">
                                        {uploadedFile.status === "uploading" ? (
                                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                          </div>
                                        ) : uploadedFile.status ===
                                          "success" ? (
                                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                            <svg
                                              className="w-4 h-4 text-green-600"
                                              fill="none"
                                              stroke="currentColor"
                                              viewBox="0 0 24 24"
                                            >
                                              <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M5 13l4 4L19 7"
                                              />
                                            </svg>
                                          </div>
                                        ) : (
                                          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                                            <svg
                                              className="w-4 h-4 text-red-600"
                                              fill="none"
                                              stroke="currentColor"
                                              viewBox="0 0 24 24"
                                            >
                                              <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M6 18L18 6M6 6l12 12"
                                              />
                                            </svg>
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* Delete Button */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setUploadedFiles((prev) =>
                                          prev.filter((_, i) => i !== index)
                                        );
                                        const remainingFiles =
                                          uploadedFiles.filter(
                                            (_, i) => i !== index
                                          );
                                        field.onChange(
                                          remainingFiles.filter(
                                            (f) => f.status === "success"
                                          )
                                        );
                                        form.trigger("attachment");
                                      }}
                                      className="ml-3 p-2 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-full transition-all duration-200 flex-shrink-0 group"
                                      title="ลบไฟล์นี้"
                                      disabled={
                                        uploadedFile.status === "uploading"
                                      }
                                    >
                                      <svg
                                        className="w-5 h-5 group-hover:scale-110 transition-transform"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth="2"
                                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                        />
                                      </svg>
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </FormControl>

                    {/* File Requirements */}
                    <div className="mt-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <svg
                              className="w-5 h-5 text-blue-600 mt-0.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          </div>
                          <div className="text-sm text-blue-800 space-y-1">
                            <span className="font-semibold block">
                              📋 ข้อกำหนดไฟล์:
                            </span>
                            <span className="block">
                              • ประเภท: JPG, PNG, GIF, WebP, MP4, AVI, MOV,
                              WebM, PDF, DOC, DOCX
                            </span>
                            <span className="block">
                              • ขนาด: ไม่เกิน 10MB ต่อไฟล์ (วีดิโอไม่เกิน 100MB)
                            </span>
                            <span className="block text-red-600 font-semibold">
                              • หมายเหตุ: ไฟล์จะถูกอัปโหลดทันทีเมื่อเลือก
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Submit Button */}
              <Button
                type="submit"
                onClick={() => {
                  // Manual validation trigger
                  form.trigger().then((isValid) => {
                    if (!isValid) {
                      handleFormErrors();
                    }
                  });
                }}
                disabled={form.formState.isSubmitting || isSubmitting}
                className="w-full md:w-auto hover:cursor-pointer transition-all duration-200 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg px-6 py-3 shadow-lg flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {form.formState.isSubmitting || isSubmitting ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>กำลังบันทึก...</span>
                  </div>
                ) : (
                  "บันทึกข้อมูล"
                )}
              </Button>
            </FormSection>
          )}
        </form>
      </Form>
    </div>
  );
}

export default SafetyObservationForm;

// Helper Components
const RequiredMark = () => <sup className="text-red-500">*</sup>;

const FormSection = ({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div className="border-b border-gray-300 shadow-md rounded-lg mb-4 mt-4">
    <div className="bg-orange-500 text-white p-4 rounded-t-lg flex items-center gap-3">
      {icon}
      <span>{title}</span>
    </div>
    <div className="p-4">{children}</div>
  </div>
);

const CategoryCard = ({
  category,
  isSelected,
  onClick,
}: {
  category: { id: number; name: string; imagePath: string; alt: string };
  isSelected: boolean;
  onClick: () => void;
}) => (
  <div
    className={cn(
      "relative border rounded-md p-4 hover:border-orange-500 cursor-pointer transition-all",
      isSelected ? "border-orange-500 bg-orange-50" : ""
    )}
    onClick={onClick}
  >
    <div className="absolute top-4 left-4 w-4 h-4 rounded-full border border-gray-300 flex items-center justify-center">
      {isSelected && <div className="w-2 h-2 rounded-full bg-orange-500" />}
    </div>
    <div className="flex flex-col items-center">
      <div className="w-full h-32 mb-2 flex justify-center">
        <Image
          src={category.imagePath}
          alt={category.alt}
          className="h-full object-contain"
          width={120}
          height={120}
        />
      </div>
      <span className="text-sm text-start">{category.name}</span>
    </div>
  </div>
);

const DepartmentSelection = ({
  value,
  onChange,
  departments,
  form,
  readOnly = false,
}: {
  value: string;
  onChange: (value: string) => void;
  departments: Array<{ id: number; name: string; group: string }>;
  form: any;
  readOnly?: boolean;
}) => (
  <RadioGroup
    onValueChange={onChange}
    value={value}
    className="flex flex-col md:flex-row gap-6 space-y-3 mt-3"
  >
    <div>
      <p className="font-medium mb-2">ITH</p>
      {departments
        .filter((item) => item.group === "ITH")
        .map((item) => (
          <div key={item.id} className="flex items-center space-x-3 mb-2">
            <RadioGroupItem
              value={item.name}
              id={item.name}
              disabled={readOnly}
              className={readOnly ? "cursor-not-allowed" : ""}
            />
            <Label htmlFor={item.name}>{item.name}</Label>
          </div>
        ))}
    </div>

    <div>
      <p className="font-medium mb-2">SUB</p>
      {departments
        .filter((item) => item.group === "SUB")
        .map((item) => (
          <div key={item.id} className="flex items-center space-x-3 mb-2">
            <RadioGroupItem
              value={item.name}
              id={item.name}
              onClick={() => {
                form.setValue("group", "");
              }}
              disabled={readOnly}
              className={readOnly ? "cursor-not-allowed" : ""}
            />
            <Label htmlFor={item.name}>{item.name}</Label>
          </div>
        ))}
    </div>
  </RadioGroup>
);
