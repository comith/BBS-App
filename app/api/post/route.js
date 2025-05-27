import { appendToSheet } from '../config'; // Adjust the import path as necessary
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    // รับข้อมูลจาก request body
    const data = await request.json();
    
    // สร้าง ID สำหรับการบันทึก (ถ้าต้องการ)
    const recordId = `BBS_${Date.now()}`;
    
    // จัดเตรียมข้อมูลสำหรับ Google Sheet
    // แปลง selectedOptions เป็น string เพื่อเก็บใน sheet
    const selectedOptionsText = data.selectedOptions?.map(option => option.name).join(', ') || '';
    
    // แปลง vehicleEquipment และ attachment เป็น JSON string
    const vehicleEquipmentText = JSON.stringify(data.vehicleEquipment || {});
    const attachmentText = JSON.stringify(data.attachment || {});
    
    // สร้าง array ของข้อมูลที่จะส่งไป Google Sheet
    const row = [
      recordId,                           // A: Record ID
      data.date || '',                    // B: Date
      data.employeeId || '',              // C: Employee ID
      data.username || '',                // D: Username
      data.group || '',                   // E: Group
      data.type || '',                    // F: Type
      data.safetyCategory || '',          // G: Safety Category
      data.sub_safetyCategory || '',      // H: Sub Safety Category
      data.observed_work || '',           // I: Observed Work
      data.depart_notice || '',           // J: Department Notice
      vehicleEquipmentText,               // K: Vehicle Equipment (JSON)
      selectedOptionsText,                // L: Selected Options (comma separated)
      data.safeActionCount || 0,          // M: Safe Action Count
      data.actionType || '',              // N: Action Type
      data.unsafeActionCount || 0,        // O: Unsafe Action Count
      data.actionTypeunsafe || '',        // P: Action Type Unsafe
      attachmentText,                     // Q: Attachment (JSON)
      data.other || ''                    // R: Other
    ];

    // เรียกใช้ฟังก์ชันเพิ่มข้อมูลลง Google Sheet ชื่อ "data_bbs"
    await appendToSheet('record!A:R', [row]);

    return NextResponse.json({ 
      message: 'Data added successfully',
      data: {
        ...data,
        recordId: recordId  // ส่ง record ID กลับไปในการตอบกลับ
      }
    }, { status: 201 });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { message: 'Error adding data to sheet', error: error.message },
      { status: 500 }
    );
  }
}