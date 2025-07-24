// app/api/upload/route.js
import { NextResponse } from 'next/server';

// URL ของ Google Apps Script Web App ที่คุณ deploy แล้ว
const GAS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxSvJvg_py6efJNxd8zWuzhMQSXii1w3RSijKcqjGNI53B6J4vP_JvNTBhx6Frhn6UX/exec";

// ฟังก์ชันแปลงไฟล์เป็น Base64
async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

// ฟังก์ชันแปลงไฟล์เป็น Base64 สำหรับ Node.js environment
async function fileToBase64Server(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    const mimeType = file.type || 'application/octet-stream';
    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    throw new Error(`Failed to convert file to base64: ${error.message}`);
  }
}

// ฟังก์ชันแปลงขนาดไฟล์เป็นรูปแบบที่อ่านง่าย
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export async function POST(request) {
  try {
    // ตรวจสอบว่ามี Google Apps Script URL หรือไม่
    if (!GAS_WEB_APP_URL) {
      return NextResponse.json(
        { message: 'Google Apps Script URL not configured' },
        { status: 500 }
      );
    }

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
    
    // ตรวจสอบว่ามีไฟล์หรือไม่
    const file = formData.get('file');
    if (!file) {
      return NextResponse.json(
        { message: 'No file provided' },
        { status: 400 }
      );
    }

    console.log('Processing file for Base64 conversion:', {
      filename: file.name,
      size: file.size,
      type: file.type
    });

    // แปลงไฟล์เป็น Base64
    const base64Data = await fileToBase64Server(file);
    const fileName = formData.get('filename') || file.name;
    const folderId = formData.get('folderId') || null;
    const fileSize = formatFileSize(file.size);
    const fileType = file.type;

    // เตรียมข้อมูลสำหรับส่งไปยัง Google Apps Script
    const requestData = {
      base64Data,
      fileName,
      fileSize,
      fileType,
      folderId
    };

    console.log('Sending to Google Apps Script:', {
      fileName,
      fileSize,
      fileType,
      base64Length: base64Data.length
    });

    // ส่งข้อมูลไปยัง Google Apps Script แบบ JSON
    const gasResponse = await fetch(GAS_WEB_APP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData)
    });

    // ตรวจสอบ response จาก Google Apps Script
    if (!gasResponse.ok) {
      console.error('Google Apps Script error:', gasResponse.status, gasResponse.statusText);
      
      let errorData = {};
      try {
        errorData = await gasResponse.json();
      } catch (parseError) {
        const errorText = await gasResponse.text();
        errorData = { message: errorText || 'Unknown error' };
      }
      
      return NextResponse.json(
        { 
          message: 'Error from Google Apps Script', 
          error: errorData.message || errorData.error || 'Unknown error',
          status: gasResponse.status
        },
        { status: gasResponse.status >= 400 ? gasResponse.status : 500 }
      );
    }

    // ดึงข้อมูลจาก Google Apps Script response
    let gasData;
    try {
      const responseText = await gasResponse.text();
      console.log('Raw GAS response length:', responseText.length);
      
      gasData = JSON.parse(responseText);
      console.log('Parsed GAS data:', gasData);
    } catch (e) {
      console.error('Failed to parse GAS response as JSON:', e);
      return NextResponse.json(
        { message: 'Invalid response from Google Apps Script' },
        { status: 500 }
      );
    }
    
    console.log('File uploaded successfully via Google Apps Script:', {
      fileId: gasData.file?.id || 'missing',
      fileName: gasData.file?.name || 'missing',
      status: gasData.status
    });
    
    // ส่งข้อมูลกลับไปยัง client (เหมือน API เดิม)
    return NextResponse.json({
      message: gasData.message || 'File uploaded successfully',
      file: {
        id: gasData.file?.id,
        name: gasData.file?.name,
        webViewLink: gasData.file?.webViewLink,
        downloadUrl: gasData.file?.downloadUrl
      },
      status: gasData.status || 'success'
    }, { status: 201 });
    
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { 
        message: 'Error uploading file', 
        error: error.message,
        details: error.cause || 'Network or server error'
      },
      { status: 500 }
    );
  }
}

// สำหรับจัดการ CORS preflight requests
export async function OPTIONS(request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}