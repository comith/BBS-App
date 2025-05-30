// api/get/route.js - แก้ไขเพื่อแก้ปัญหา JSON parse error
import { getSheetData } from "../config";
import { NextResponse } from "next/server";

function safeJSONParse(str) {
  // ตรวจสอบว่าเป็น JSON format หรือไม่ก่อน
  if (typeof str === "string" && str.trim() !== "") {
    // ตรวจสอบว่าขึ้นต้นด้วย [ หรือ { (JSON format)
    const trimmed = str.trim();
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        return JSON.parse(str);
      } catch (error) {
        console.error("JSON parse error:", error);
        return null;
      }
    }
    // ถ้าไม่ใช่ JSON format ให้คืนค่าเป็น string ธรรมดา
    return str;
  }
  return null;
}

function formatDataByType(data, type) {
  if (!data || data.length === 0) return [];

  const headers = data[0];
  const rows = data.slice(1);

  return rows.map((row) => {
    const item = {};
    headers.forEach((header, index) => {
      let value = row[index] || "";

      // แปลงข้อมูลตามประเภทและคอลัมน์
      switch (type) {
        case "subcategory":
          // สำหรับ sub_category_data ต้อง parse JSON ในคอลัมน์ departcategory และ option
          if (header === "departcategory_id") {
            const parsed = safeJSONParse(value);
            value = Array.isArray(parsed) ? parsed : [];
          } else if (header === "id" || header === "category_id") {
            value = value ? parseInt(value, 10) : 0;
          }
          break;

        case "category":
          // สำหรับ category_data
          if (header === "id") {
            value = value ? parseInt(value, 10) : 0;
          }
          break;

        case "department":
        case "group":
          // สำหรับ list_department และ list_group
          if (header === "id") {
            value = value ? parseInt(value, 10) : 0;
          }
          break;

        case "record":
          // สำหรับ record data - ต้องระวัง JSON fields
          if (header === "selectedOptions") {
            const parsed = safeJSONParse(value);
            value = Array.isArray(parsed) ? parsed : [];
          } else if (header === "vehicleEquipment") {
            const parsed = safeJSONParse(value);
            value = (parsed && typeof parsed === 'object') ? parsed : {};
          } else if (header === "attachment") {
            const parsed = safeJSONParse(value);
            value = Array.isArray(parsed) ? parsed : [];
          } else if (
            header === "safeActionCount" ||
            header === "unsafeActionCount"
          ) {
            value = value ? parseInt(value, 10) : 0;
          }
          // สำหรับ field อื่นๆ ให้เก็บเป็น string ธรรมดา
          break;

        default:
          // ไม่เปลี่ยนแปลงค่า - เก็บเป็น string
          break;
      }

      item[header] = value;
    });
    return item;
  });
}

async function fetchAndFormatData(sheetRange, type) {
  try {
    const data = await getSheetData(sheetRange);

    if (!data || data.length === 0) {
      return { success: false, data: [], message: "No data found." };
    }

    if (type === "subcategory") {
      const dataWithSubcategory = await getSheetData("list_option!A1:C");
      const datawithDepartment = await getSheetData("list_department!A1:D");
      
      if (dataWithSubcategory && dataWithSubcategory.length > 0) {
        // id | name | sub_category_id filter by sub_category_id
        const subcategoryOptions = dataWithSubcategory.reduce((acc, row) => {
          const [id, name, subCategoryId] = row;
          if (subCategoryId) {
            acc[subCategoryId] = acc[subCategoryId] || [];
            acc[subCategoryId].push({ id: parseInt(id, 10), name });
          }
          return acc;
        }, {});

        // id | name | group | shortname filter by departcategory_id width id and return shortname
        const departmentOptions = datawithDepartment.reduce((acc, row) => {
          const [id, name, group, shortname] = row;
          acc[id] = { id: parseInt(id, 10), shortname };
          return acc;
        }, {});

        const formattedData = formatDataByType(data, type).map((item) => {
          // แปลง departcategory_id เป็น array ของ objects
          if (Array.isArray(item.departcategory_id)) {
            item.departcategory_id = item.departcategory_id.map(
              (id) => departmentOptions[id] || {}
            );
          } else {
            item.departcategory_id = [];
          }
          
          // แปลง option เป็น array ของ objects
          item.option = subcategoryOptions[item.id] || [];
          return item;
        });

        return {
          success: true,
          data: formattedData,
          message: "Subcategory data fetched successfully.",
        };
      }
      
      return {
        success: false,
        data: [],
        message: "No subcategory options found.",
      };
    }

    const formattedData = formatDataByType(data, type);
    return {
      success: true,
      data: formattedData,
      message: `${type.charAt(0).toUpperCase() + type.slice(1)} data fetched successfully.`,
    };
  } catch (error) {
    console.error("API Error:", error);
    return {
      success: false,
      data: [],
      message: "Error fetching sheet data",
      error: error.message,
    };
  }
}

// GET method สำหรับดึงข้อมูลทั้งหมด
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");

  let result;

  switch (type) {
    case "record":
      result = await fetchAndFormatData("record!A1:S", "record");
      break;
    case "employee":
      result = await fetchAndFormatData("employee!A1:F", "employee");
      break;
    case "category":
      result = await fetchAndFormatData("category_data!A1:D", "category");
      break;
    case "subcategory":
      result = await fetchAndFormatData(
        "sub_category_data!A1:K",
        "subcategory"
      );
      break;
    case "department":
      result = await fetchAndFormatData("list_department!A1:D", "department");
      break;
    case "group":
      result = await fetchAndFormatData("list_group!A1:C", "group");
      break;
    default:
      return NextResponse.json(
        {
          message:
            "Invalid type parameter. Use: record, category, subcategory, department, or group",
        },
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