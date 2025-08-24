// api/get/route.js - เพิ่ม debug และ error handling
import { getSheetData } from "../config";
import { NextResponse } from "next/server";


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

  function formatSubcategory(header, value) {
    if (header === "departcategory_id") {
      const parsed = safeJSONParse(value);
      return Array.isArray(parsed) ? parsed : [];
    }
    if (header === "id" || header === "category_id") {
      return value ? parseInt(value, 10) : 0;
    }
    return value;
  }

  function formatCategory(header, value) {
    if (header === "id") {
      return value ? parseInt(value, 10) : 0;
    }
    return value;
  }

  // formatDepartmentOrGroup is intended for department/group specific formatting
  function formatDepartmentOrGroup(header, value) {
    if (header === "id") {
      return value ? parseInt(value, 10) : 0;
    }
    // Example: handle 'shortname' field for departments/groups
    if (header === "shortname") {
      return value ? value.toString().trim() : "";
    }
    return value;
  }

  function formatRecord(header, value) {
    if (header === "selectedOptions") {
      const parsed = safeJSONParse(value);
      return typeof parsed === "string" ? parsed.split(",") : [];
    }
    if (header === "vehicleEquipment") {
      const parsed = safeJSONParse(value);
      return parsed && typeof parsed === "object" ? parsed : {};
    }
    if (header === "attachment") {
      const parsed = safeJSONParse(value);
      return Array.isArray(parsed) ? parsed : [];
    }
    if (header === "safeActionCount" || header === "unsafeActionCount") {
      return value ? parseInt(value, 10) : 0;
    }
    return value;
  }

  return rows.map((row) => {
    const item = {};
    headers.forEach((header, index) => {
      let value = row[index] || "";
      switch (type) {
        case "subcategory":
          value = formatSubcategory(header, value);
          break;
        case "category":
          value = formatCategory(header, value);
          break;
        case "department":
        case "group":
          value = formatDepartmentOrGroup(header, value);
          break;
        case "record":
          value = formatRecord(header, value);
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
        result = await fetchAndFormatData("record!A1:V", "record");
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