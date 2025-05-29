// app/api/upload/route.js
import { stat } from 'fs';
import { uploadFileToDrive } from '../config'; // Adjust the import path as necessary
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    // ตรวจสอบว่าเป็น multipart/form-data
    const contentType = request.headers.get('content-type') || '';
    
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { message: 'Content type must be multipart/form-data' },
        { status: 400 }
      );
    }

    // แปลง request เป็น FormData
    const formData = await request.formData();
    
    // ดึงไฟล์และข้อมูลจาก formData
    const file = formData.get('file');
    if (!file) {
      return NextResponse.json(
        { message: 'No file provided' },
        { status: 400 }
      );
    }
    
    const filename = formData.get('filename') || file.name;
    const folderId = formData.get('folderId') || process.env.GOOGLE_DRIVE_FOLDER_ID || null;
    
    // อ่านไฟล์เป็น arrayBuffer แล้วแปลงเป็น Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = file.type;

    // อัปโหลดไฟล์ไปยัง Google Drive
    const uploadedFile = await uploadFileToDrive(
      buffer,
      filename,
      mimeType,
      folderId
    );

    console.log('File uploaded successfully:', uploadedFile);

    // ส่งข้อมูลไฟล์ที่อัปโหลดกลับไป
    return NextResponse.json({
      message: 'File uploaded successfully',
      file: {
        id: uploadedFile.id,
        name: uploadedFile.name,
        webViewLink: uploadedFile.webViewLink
      },
      status: 'success'
    }, { status: 201 });
    
  } catch (error) {
    // console.error('API Error:', error);
    return NextResponse.json(
      { message: 'Error uploading file', error: error.message },
      { status: 500 }
    );
  }
}