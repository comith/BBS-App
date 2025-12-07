//api/approve/route.js - ปรับปรุงเพื่อประสิทธิภาพดีขึ้น
import { batchUpdateSheet, getSheetData, appendToSheet } from '../config'; // ✅ ใช้ batchUpdateSheet
import { NextResponse } from 'next/server';
import { apiLogger } from '@/lib/logger';

export async function POST(request) {
  try {
    apiLogger.info('📥 Receiving approval request...');

    const data = await request.json();

    apiLogger.info('✅ Approval data received:', {
      recordId: data.recordId,
      status: data.status,
      hasAdminNote: !!data.adminNote,
      approvedBy: data.approvedBy
    });

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!data.recordId || !data.status) {
      return NextResponse.json(
        { message: 'Missing required fields: recordId and status' },
        { status: 400 }
      );
    }

    // ตรวจสอบว่า status ถูกต้อง
    if (!['approved', 'rejected', 'pending'].includes(data.status)) {
      return NextResponse.json(
        { message: 'Invalid status. Must be: approved, rejected, or pending' },
        { status: 400 }
      );
    }

    // ดึงข้อมูลทั้งหมดจาก sheet เพื่อหา row ที่ต้องการอัพเดต
    apiLogger.info('🔍 Finding record in sheet...');
    const sheetData = await getSheetData('record!A:V'); // ครอบคลุม columns ทั้งหมด

    if (!sheetData || !sheetData.length) {
      return NextResponse.json(
        { message: 'No data found in sheet' },
        { status: 404 }
      );
    }

    // หา row ที่มี recordId ตรงกัน (column A)
    const rowIndex = sheetData.findIndex((row, index) => {
      if (index === 0) return false; // ข้าม header row
      return row[0] === data.recordId; // column A คือ Record ID
    });

    if (rowIndex === -1) {
      return NextResponse.json(
        { message: `Record with ID ${data.recordId} not found` },
        { status: 404 }
      );
    }

    // คำนวณ row number ใน Google Sheet (เริ่มจาก 1, บวก 1 เพราะมี header)
    const googleSheetRowNumber = rowIndex + 1;

    apiLogger.info(`📝 Updating row ${googleSheetRowNumber} with status: ${data.status}`);

    // เตรียมข้อมูลที่จะอัพเดต
    const currentDateTime = new Date().toISOString();

    // ✅ ใช้ batch update เพื่อประสิทธิภาพดีขึ้น
    const updates = [
      {
        range: `record!S${googleSheetRowNumber}`, // Column S: Status
        values: [[data.status]]
      },
      {
        range: `record!T${googleSheetRowNumber}`, // Column T: Admin Note
        values: [[data.adminNote || '']]
      },
      {
        range: `record!U${googleSheetRowNumber}`, // Column U: Approved Date
        values: [[currentDateTime]]
      },
      {
        range: `record!V${googleSheetRowNumber}`, // Column V: Approved By
        values: [[data.approvedBy || 'SHE']]
      }
    ];

    const employeeId = sheetData[rowIndex][2]; // Column C: Employee ID
    const rowNotificationLogEmployee = [null, data.status, data.approvedBy, employeeId, ""];

    // ✅ อัพเดตทุก field พร้อมกันด้วย batch update
    await batchUpdateSheet(updates);
    await appendToSheet("notification_log!A:D", [rowNotificationLogEmployee]);

    const responseData = {
      recordId: data.recordId,
      status: data.status,
      adminNote: data.adminNote || null,
      approvedDate: currentDateTime,
      approvedBy: data.approvedBy || 'SHE',
      updatedRow: googleSheetRowNumber
    };


    apiLogger.info('✅ Approval successful:', responseData);

    return NextResponse.json({
      message: `Record ${data.status} successfully`,
      data: responseData
    }, { status: 200 });

  } catch (error) {
    apiLogger.error('❌ Approval API Error:', error);
    return NextResponse.json(
      { message: 'Error updating record status', error: error.message },
      { status: 500 }
    );
  }
}

// GET method สำหรับดูสถานะของรายงานเฉพาะ ID
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const recordId = searchParams.get('recordId');

    if (!recordId) {
      return NextResponse.json(
        { message: 'Missing recordId parameter' },
        { status: 400 }
      );
    }

    apiLogger.info(`🔍 Getting status for record: ${recordId}`);

    // ดึงข้อมูลจาก sheet
    const sheetData = await getSheetData('record!A:V');

    if (!sheetData || !sheetData.length) {
      return NextResponse.json(
        { message: 'No data found in sheet' },
        { status: 404 }
      );
    }

    // หา record ที่ต้องการ
    const record = sheetData.find((row, index) => {
      if (index === 0) return false; // ข้าม header
      return row[0] === recordId;
    });

    if (!record) {
      return NextResponse.json(
        { message: `Record with ID ${recordId} not found` },
        { status: 404 }
      );
    }

    const recordData = {
      recordId: record[0],
      status: record[18] || 'pending', // Column S (index 18)
      adminNote: record[19] || null,   // Column T (index 19)
      approvedDate: record[20] || null, // Column U (index 20)
      approvedBy: record[21] || null,   // Column V (index 21)
      employeeName: record[3],          // Column D (index 3)
      department: record[5],            // Column F (index 5)
      submittedDate: record[1]          // Column B (index 1)
    };

    return NextResponse.json({
      message: 'Record found',
      data: recordData
    }, { status: 200 });

  } catch (error) {
    apiLogger.error('❌ Get Record API Error:', error);
    return NextResponse.json(
      { message: 'Error getting record status', error: error.message },
      { status: 500 }
    );
  }
}