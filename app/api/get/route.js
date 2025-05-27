// api/get/route.js
import { getSheetData } from '../config';
import { NextResponse } from 'next/server';

// Helper function เพื่อ parse JSON strings safely
function safeJSONParse(str) {
  if (!str || str.trim() === '') return null;
  
  try {
    return JSON.parse(str);
  } catch (error) {
    console.warn('Failed to parse JSON:', str);
    return str; // ถ้า parse ไม่ได้ ให้คืนค่าเดิม
  }
}

// Helper function เพื่อ format ข้อมูลตามประเภท
function formatDataByType(data, type) {
  if (!data || data.length === 0) return [];

  const headers = data[0];
  const rows = data.slice(1);

  return rows.map(row => {
    const item = {};
    headers.forEach((header, index) => {
      let value = row[index] || '';

      // แปลงข้อมูลตามประเภทและคอลัมน์
      switch (type) {
        case 'subcategory':
          // สำหรับ sub_category_data ต้อง parse JSON ในคอลัมน์ departcategory และ option
          if (header === 'departcategory' || header === 'option') {
            value = safeJSONParse(value) || [];
          } else if (header === 'id' || header === 'category_id' || header === 'form_safety_id') {
            value = value ? parseInt(value, 10) : 0;
          }
          break;

        case 'category':
          // สำหรับ category_data
          if (header === 'id') {
            value = value ? parseInt(value, 10) : 0;
          }
          break;

        case 'department':
        case 'group':
          // สำหรับ list_department และ list_group
          if (header === 'id') {
            value = value ? parseInt(value, 10) : 0;
          }
          break;

        case 'record':
          // สำหรับ record data - อาจมีข้อมูล JSON อื่นๆ
          if (header === 'selectedOptions' || header === 'vehicleEquipment' || header === 'attachment') {
            value = safeJSONParse(value) || (header === 'selectedOptions' ? [] : {});
          } else if (header === 'safeActionCount' || header === 'unsafeActionCount') {
            value = value ? parseInt(value, 10) : 0;
          }
          break;

        default:
          // ไม่เปลี่ยนแปลงค่า
          break;
      }

      item[header] = value;
    });
    return item;
  });
}

// Helper function เพื่อหลีกเลี่ยงการ duplicate code
async function fetchAndFormatData(sheetRange, type) {
  try {
    const data = await getSheetData(sheetRange);
    
    if (!data || data.length === 0) {
      return { success: false, data: [], message: 'No data found.' };
    }
    
    const formattedData = formatDataByType(data, type);
    
    return { success: true, data: formattedData };
  } catch (error) {
    console.error('API Error:', error);
    return { 
      success: false, 
      data: [], 
      message: 'Error fetching sheet data', 
      error: error.message 
    };
  }
}

// GET method สำหรับดึงข้อมูลทั้งหมด
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');

  let result;
  
  switch (type) {
    case 'record':
      result = await fetchAndFormatData('record!A1:S', 'record');
      break;
    case 'category':
      result = await fetchAndFormatData('category_data!A1:D', 'category');
      break;
    case 'subcategory':
      result = await fetchAndFormatData('sub_category_data!A1:K', 'subcategory');
      break;
    case 'department':
      result = await fetchAndFormatData('list_department!A1:C', 'department');
      break;
    case 'group':
      result = await fetchAndFormatData('list_group!A1:C', 'group');
      break;
    default:
      return NextResponse.json(
        { message: 'Invalid type parameter. Use: record, category, subcategory, department, or group' },
        { status: 400 }
      );
  }

  if (!result.success) {
    return NextResponse.json(
      { message: result.message, error: result.error },
      { status: result.data.length === 0 ? 404 : 500 }
    );
  }

  return NextResponse.json(result.data);
}
