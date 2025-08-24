//api/post/route.js
import { appendToSheet } from "../config";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    // รับข้อมูลจาก JSON เท่านั้น
    console.log("📥 Receiving request...");

    const data = await request.json();

    if (data.type === "employee") {
      const row = [
        null,
        data.data.employeerId,
        data.data.fullName,
        data.data.department,
        data.data.group,
        data.data.position,
      ];
      await appendToSheet("employee!A:F", [row]);
      return NextResponse.json(
        { message: "Employee data added successfully" },
        { status: 201 }
      );
    }

    console.log("✅ Data received:", {
      employeeId: data.employeeId,
      username: data.username,
      hasUploadedFiles: !!data.uploadedFiles,
      uploadedFilesCount: data.uploadedFiles?.length || 0,
    });

    // สร้าง ID สำหรับการบันทึก
    const recordId = `BBS_${Date.now()}`;

    // จัดเตรียมข้อมูลสำหรับ Google Sheet
    const selectedOptionsText =
      data.selectedOptions?.map((option) => option.name).join(", ") || "";
    const vehicleEquipmentText = JSON.stringify(data.vehicleEquipment || {});

    // 🔥 จัดการข้อมูลไฟล์ - เก็บเป็น JSON ของ file IDs
    let attachmentText = "[]";

    if (
      data.uploadedFiles &&
      Array.isArray(data.uploadedFiles) &&
      data.uploadedFiles.length > 0
    ) {
      const fileData = data.uploadedFiles.map((file) => ({
        id: file.id,
        name: file.name,
        webViewLink: file.webViewLink || "",
        savedDate: new Date().toISOString(),
      }));
      attachmentText = JSON.stringify(fileData);
    }

    // สร้าง array ของข้อมูลที่จะส่งไป Google Sheet
    const row = [
      recordId, // A: Record ID
      data.date || "", // B: Date
      data.employeeId || "", // C: Employee ID
      data.username || "", // D: Username
      data.group || "", // E: Group
      data.type || "", // F: Type
      data.safetyCategory || "", // G: Safety Category
      data.sub_safetyCategory || "", // H: Sub Safety Category
      data.observed_work || "", // I: Observed Work
      data.depart_notice || "", // J: Department Notice
      vehicleEquipmentText, // K: Vehicle Equipment (JSON)
      selectedOptionsText, // L: Selected Options (comma separated)
      data.safeActionCount || 0, // M: Safe Action Count
      data.actionType || "", // N: Action Type
      data.unsafeActionCount || 0, // O: Unsafe Action Count
      data.actionTypeunsafe || "", // P: Action Type Unsafe
      attachmentText, // Q: Attachment (JSON with file IDs)
      data.other || "", // R: Other
    ];

    const rowByshe = [
      recordId, // A: Record ID
      data.date || "", // B: Date
      data.employeeId || "", // C: Employee ID
      data.username || "", // D: Username
      data.group || "", // E: Group
      data.type || "", // F: Type
      data.safetyCategory || "", // G: Safety Category
      data.sub_safetyCategory || "", // H: Sub Safety Category
      data.observed_work || "", // I: Observed Work
      data.depart_notice || "", // J: Department Notice
      vehicleEquipmentText, // K: Vehicle Equipment (JSON)
      selectedOptionsText, // L: Selected Options (comma separated)
      data.safeActionCount || 0, // M: Safe Action Count
      data.actionType || "", // N: Action Type
      data.unsafeActionCount || 0, // O: Unsafe Action Count
      data.actionTypeunsafe || "", // P: Action Type Unsafe
      attachmentText, // Q: Attachment (JSON with file IDs)
      data.other || "", // R: Other
      data.codeemployee || "", // S: Code Employee
      data.levelOfSafety || "", // T: levelOfSafety
    ];

    const rowNotificationLogEmployee = [null ,"create", data.employeeId, "SHE", ""];

    console.log("💾 Saving to Google Sheet...");

    // บันทึกลง Google Sheet

    if (data.group !== "SHE" || !data.codeemployee) {
      // บันทึกข้อมูลของพนักงานทั่วไปที่ไม่ใช่ SHE
      await appendToSheet("record!A:R", [row]);
      await appendToSheet("notification_log!A:D", [rowNotificationLogEmployee]);
    } else {
      // บันทึกข้อมูลของพนักงาน SHE
      await appendToSheet("record!A:R", [row]);
      await appendToSheet("record_she!A:T", [rowByshe]);
      await appendToSheet("notification_log!A:D", [rowNotificationLogEmployee]);
    }

    const responseData = {
      recordId: recordId,
      totalFiles: data.uploadedFiles?.length || 0,
      successCount: data.uploadedFiles?.length || 0,
    };

    console.log("✅ Save successful:", responseData);

    return NextResponse.json(
      {
        message: "Data added successfully",
        data: responseData,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ API Error:", error);
    return NextResponse.json(
      { message: "Error adding data to sheet", error: error.message },
      { status: 500 }
    );
  }
}
