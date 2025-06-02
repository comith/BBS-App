//pages/api/get.js
import { getSheetData } from "./config"; 

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
          if (header === "id") {
            value = value ? parseInt(value, 10) : 0;
          }
          break;
          
        case "group":
          if (header === "id") {
            value = value ? parseInt(value, 10) : 0;
          }
          break;

        case "record":
          if (header === "selectedOptions") {
            const parsed = safeJSONParse(value);
            value = Array.isArray(parsed) ? parsed : [];
          } else if (header === "vehicleEquipment") {
            const parsed = safeJSONParse(value);
            value = parsed && typeof parsed === "object" ? parsed : {};
          } else if (header === "attachment") {
            const parsed = safeJSONParse(value);
            value = Array.isArray(parsed) ? parsed : [];
          } else if (
            header === "safeActionCount" ||
            header === "unsafeActionCount"
          ) {
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
    const data = await getSheetData(sheetRange);

    if (!data || data.length === 0) {
      return { success: false, data: [], message: "No data found." };
    }

    if (type === "subcategory") {
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

// Main handler function - แก้ไขเป็น default export
export default async function handler(req, res) {
  console.log("Request:", req.method, req.query);
  
  try {
    // รองรับ CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // รองรับ CORS preflight request
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // รองรับเฉพาะ GET method
    if (req.method !== 'GET') {
      return res.status(405).json({
        message: 'Method not allowed. Only GET requests are supported.'
      });
    }

    // ดึง query parameters
    const { type } = req.query;

    if (!type) {
      return res.status(400).json({
        message: "Missing 'type' parameter. Use: record, category, subcategory, department, group, employee, or she_violations"
      });
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
        return res.status(400).json({
          message: "Invalid type parameter. Use: record, category, subcategory, department, group, employee, or she_violations"
        });
    }

    if (!result.success) {
      console.log("No data found or error:", result);
      const statusCode = result.data.length === 0 ? 404 : 500;
      return res.status(statusCode).json({
        message: result.message,
        error: result.error
      });
    }

    return res.status(200).json(result.data);

  } catch (error) {
    console.error("Handler Error:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
}