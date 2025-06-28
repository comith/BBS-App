// api/get/route.js - เพิ่ม debug และ error handling
import { getSheetData } from "../config";
import { NextResponse } from "next/server";

// เพิ่ม debug logging
console.log("API Route loaded successfully");

function safeJSONParse(str) {
  if (typeof str === "string" && str.trim() !== "") {
    const trimmed = str.trim();
    if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
      try {
        return JSON.parse(str);
      } catch (error) {
        console.error("JSON parse error:", error);
        return null;
      }
    }
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

      switch (type) {
        case "subcategory":
          if (header === "departcategory_id") {
            const parsed = safeJSONParse(value);
            value = Array.isArray(parsed) ? parsed : [];
          } else if (header === "id" || header === "category_id") {
            value = value ? parseInt(value, 10) : 0;
          }
          break;

        case "category":
          if (header === "id") {
            value = value ? parseInt(value, 10) : 0;
          }
          break;

        case "department":
        case "group":
          if (header === "id") {
            value = value ? parseInt(value, 10) : 0;
          }
          break;

        case "record":
          if (header === "selectedOptions") {
            const parsed = safeJSONParse(value);
            value = parsed.split(",");

          } else if (header === "vehicleEquipment") {
            const parsed = safeJSONParse(value);
            value = parsed && typeof parsed === "object" ? parsed : {};
          } else if (header === "attachment") {
            const parsed = safeJSONParse(value);
            value = Array.isArray(parsed) ? parsed : [];
          } else if (header === "safeActionCount" || header === "unsafeActionCount") {
            value = value ? parseInt(value, 10) : 0;
          }
          break;

        default:
          break;
      }

      item[header] = value;
    });
    return item;
  });
}

async function fetchAndFormatData(sheetRange, type) {
  try {
    console.log(`🔍 Fetching data for type: ${type}, range: ${sheetRange}`);
    
    // ตรวจสอบว่า getSheetData function มีอยู่ไหม
    if (typeof getSheetData !== 'function') {
      throw new Error('getSheetData function is not available');
    }

    const data = await getSheetData(sheetRange);
    console.log(`📊 Data received:`, data ? `${data.length} rows` : 'null');

    if (!data || data.length === 0) {
      return { success: false, data: [], message: "No data found." };
    }

    if (type === "subcategory") {
      console.log("🔧 Processing subcategory with additional data...");
      
      const dataWithSubcategory = await getSheetData("list_option!A1:C");
      const datawithDepartment = await getSheetData("list_department!A1:D");

      if (dataWithSubcategory && dataWithSubcategory.length > 0) {
        const subcategoryOptions = dataWithSubcategory.reduce((acc, row) => {
          const [id, name, subCategoryId] = row;
          if (subCategoryId) {
            acc[subCategoryId] = acc[subCategoryId] || [];
            acc[subCategoryId].push({ id: parseInt(id, 10), name });
          }
          return acc;
        }, {});

        const departmentOptions = datawithDepartment.reduce((acc, row) => {
          const [id, shortname] = row;
          acc[id] = { id: parseInt(id, 10), shortname };
          return acc;
        }, {});

        const formattedData = formatDataByType(data, type).map((item) => {
          if (Array.isArray(item.departcategory_id)) {
            item.departcategory_id = item.departcategory_id.map(
              (id) => departmentOptions[id] || {}
            );
          } else {
            item.departcategory_id = [];
          }

          item.option = subcategoryOptions[item.id] || [];
          return item;
        });

        console.log(`✅ Subcategory processed: ${formattedData.length} items`);
        
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
    console.log(`✅ Data formatted: ${formattedData.length} items`);
    
    return {
      success: true,
      data: formattedData,
      message: `${type.charAt(0).toUpperCase() + type.slice(1)} data fetched successfully.`,
    };
  } catch (error) {
    console.error("❌ API Error:", error);
    console.error("Error stack:", error.stack);
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
  console.log("🔗 GET request received at /api/get");
  try {
    console.log("🚀 API GET request received");
    
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    
    console.log(`📝 Request type: ${type}`);

    // ตรวจสอบว่ามี type parameter ไหม
    if (!type) {
      console.log("❌ No type parameter provided");
      return NextResponse.json(
        { message: "Type parameter is required" },
        { status: 400 }
      );
    }

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
        result = await fetchAndFormatData("sub_category_data!A1:K", "subcategory");
        break;
      case "department":
        result = await fetchAndFormatData("list_department!A1:D", "department");
        break;
      case "group":
        result = await fetchAndFormatData("list_group!A1:C", "group");
        break;
      case "she_violations":
        result = await fetchAndFormatData("record_she!A1:T", "she_violations");
        break;

      default:
        console.log(`❌ Invalid type: ${type}`);
        return NextResponse.json(
          {
            message: "Invalid type parameter. Use: record, category, subcategory, department, group, employee, or she_violations",
          },
          { status: 400 }
        );
    }

    console.log(`📤 Result:`, result.success ? 'Success' : 'Failed');

    if (!result.success) {
      return NextResponse.json(
        { message: result.message, error: result.error },
        { status: result.data.length === 0 ? 404 : 500 }
      );
    }
    console.log(`📊 Returning data for type: ${type}`);
    return NextResponse.json(result.data);
    
  } catch (error) {
    console.error("💥 Unexpected error in GET handler:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}