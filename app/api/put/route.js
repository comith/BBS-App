// api/put/route.js
import { getSheetData, batchUpdateSheet } from "../config";
import { NextResponse } from "next/server";
import { apiLogger } from '@/lib/logger';

function findEmployeeRowIndex(sheetData, id, employeerId) {
  for (let i = 1; i < sheetData.length; i++) {
    if (employeerId === "") {
      if (sheetData[i][0] === id) {
        return i + 1;
      }
    }
    if (employeerId !== "" && sheetData[i][1] === employeerId) {
      return i + 1;
    }
  }
  return -1;
}

export async function PUT(request) {
  try {
    const { type, id, data } = await request.json();

    if (type !== "employee") {
      return NextResponse.json(
        { message: "Invalid type. Only employee updates are supported." },
        { status: 400 }
      );
    }

    // ดึงข้อมูลปัจจุบันจาก sheet
    const sheetData = await getSheetData("employee!A:F");

    if (!sheetData || sheetData.length === 0) {
      return NextResponse.json(
        { message: "No data found in sheet" },
        { status: 404 }
      );
    }

    const rowIndex = findEmployeeRowIndex(sheetData, id, data.employeerId);

    if (rowIndex === -1) {
      return NextResponse.json(
        { message: "Employee not found" },
        { status: 404 }
      );
    }

    // เตรียมข้อมูลที่จะอัพเดท
    const updatedRow = [
      null,
      data.employeerId || "",
      data.fullName || "",
      data.department || "",
      data.group || "",
      data.employeerId !== "" ? "employee" : data.position,
    ];

    // อัพเดทข้อมูลใน Google Sheet
    const updates = [
      {
        range: `employee!A${rowIndex}:F${rowIndex}`,
        values: [updatedRow],
      },
    ];

    await batchUpdateSheet(updates);

    return NextResponse.json({
      message: "Employee updated successfully",
      data: { id, ...data },
    });
  } catch (error) {
    apiLogger.error("Error updating employee:", error);
    return NextResponse.json(
      { message: "Error updating employee", error: error.message },
      { status: 500 }
    );
  }
}
