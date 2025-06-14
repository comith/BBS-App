// config.js

import { google } from "googleapis";
import { Readable } from "stream";

// สร้าง auth client
async function getAuthClient() {
  try {
    // สร้าง auth client จาก environment variables
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      },
      scopes: [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive",
      ],
    });

    return auth;
  } catch (error) {
    // console.error('Error creating auth client:', error);
    throw error;
  }
}

// [ GET ]
export async function getSheetData(range) {
  try {
    const auth = await getAuthClient();
    const client = await auth.getClient();
    const sheets = google.sheets({ version: "v4", auth: client });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: range,
    });

    return response.data.values;
  } catch (error) {
    // console.error('Error fetching data from Google Sheets:', error);
    throw error;
  }
}


// [ POST ]
export async function appendToSheet(range, values) {
  try {
    const auth = await getAuthClient();
    const sheets = google.sheets({ version: "v4", auth });

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: range,
      valueInputOption: "USER_ENTERED", // ข้อมูลจะถูกแปลงตามรูปแบบของ Google Sheets
      insertDataOption: "INSERT_ROWS", // แทรกข้อมูลเป็นแถวใหม่
      resource: {
        values: values,
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error appending data to Google Sheets:", error);
    throw error;
  }
}

// [ UPDATE ]
export async function updateSheet(range, values) {
  try {
    const auth = await getAuthClient();
    const sheets = google.sheets({ version: "v4", auth });

    const response = await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: range,
      valueInputOption: "USER_ENTERED",
      resource: {
        values: values,
      },
    });

    console.log(
      `✅ Updated ${response.data.updatedCells} cells in range ${range}`
    );
    return response.data;
  } catch (error) {
    console.error("❌ Error updating sheet:", error);
    throw error;
  }
}

export async function batchUpdateSheet(updates) {
  try {
    const auth = await getAuthClient();
    const sheets = google.sheets({ version: "v4", auth });

    const response = await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      requestBody: {
        valueInputOption: "USER_ENTERED",
        data: updates.map((update) => ({
          range: update.range,
          values: update.values,
        })),
      },
    });

    console.log(`✅ Batch updated ${response.data.totalUpdatedCells} cells`);
    return response.data;
  } catch (error) {
    console.error("❌ Error batch updating sheet:", error);
    throw error;
  }
}

// [ Upload File ]

// ===> Upload file ไปยัง folder <===
export async function uploadFileToDrive(
  fileBuffer,
  filename,
  mimeType,
  folderId = null
) {
  try {
    const auth = await getAuthClient();
    const drive = google.drive({ version: "v3", auth });

    // ตรวจสอบว่ามีการระบุ folderId และมีอยู่จริงหรือไม่
    let targetFolderId = folderId;
    if (folderId) {
      try {
        const folderExists = await checkFolderExists(folderId);
        if (!folderExists) {
          console.log(
            `Folder ID ${folderId} does not exist. Creating a new folder...`
          );
          // สร้างโฟลเดอร์ใหม่ชื่อ "Uploads" หรือชื่อที่ต้องการ
          targetFolderId = await createFolder("Uploads");
          console.log(`Created new folder with ID: ${targetFolderId}`);
        }
      } catch (error) {
        console.error("Error checking folder:", error);
        // ถ้าเกิดข้อผิดพลาดในการตรวจสอบ ให้สร้างโฟลเดอร์ใหม่
        targetFolderId = await createFolder("Uploads");
        console.log(`Created new folder with ID: ${targetFolderId}`);
      }
    }

    // สร้าง metadata ของไฟล์
    const fileMetadata = {
      name: filename,
    };

    // ถ้ามี folder ID ให้ระบุ
    if (targetFolderId) {
      fileMetadata.parents = [targetFolderId];
    }

    // ตรวจสอบว่า fileBuffer เป็น Buffer จริงๆ
    if (!Buffer.isBuffer(fileBuffer)) {
      fileBuffer = Buffer.from(fileBuffer);
    }

    // แปลง Buffer เป็น Readable Stream (ถ้าจำเป็น)
    const stream = new Readable();
    stream.push(fileBuffer);
    stream.push(null); // บอกว่าข้อมูลสิ้นสุดแล้ว

    // อัปโหลดไฟล์
    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: {
        mimeType: mimeType,
        body: stream, // หรือใช้ fileBuffer โดยตรงถ้าทำงานได้
      },
      fields: "id,name,webViewLink",
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    // เพิ่มข้อมูลโฟลเดอร์ในผลลัพธ์
    const result = response.data;
    result.folderId = targetFolderId;

    return result;
  } catch (error) {
    console.error("Error uploading file to Google Drive:", error);
    throw error;
  }
}

// ===>  สร้างไฟล์ใน Google Drive  <===
export async function createDriveFile(
  filename,
  mimeType,
  content,
  folderId = process.env.GOOGLE_DRIVE_FOLDER_ID
) {
  try {
    // สร้าง JWT client จาก credentials
    const auth = await getAuthClient();

    // สร้าง client สำหรับ Google Drive API
    const drive = google.drive({ version: "v3", auth });

    // สร้าง metadata ของไฟล์
    const fileMetadata = {
      name: filename,
    };

    // ถ้ามี folder ID ให้ระบุ
    if (folderId) {
      fileMetadata.parents = [folderId];
    }

    // สร้างไฟล์
    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: {
        mimeType: mimeType,
        body: content,
      },
      fields: "id,name,webViewLink",
    });

    return response.data;
  } catch (error) {
    console.error("Error creating file in Google Drive:", error);
    throw error;
  }
}

// ===> สร้างโฟลเดอร์ใน Google Drive <===
export async function checkFolderExists(folderId) {
  try {
    const auth = await getAuthClient();
    const drive = google.drive({ version: "v3", auth });

    const response = await drive.files.get({
      fileId: folderId,
      fields: "id,name,mimeType",
    });

    // ตรวจสอบว่าเป็นโฟลเดอร์จริงๆ
    return (
      response.data &&
      response.data.mimeType === "application/vnd.google-apps.folder"
    );
  } catch (error) {
    // ถ้าเกิด error 404 แสดงว่าไม่พบโฟลเดอร์
    if (error.response && error.response.status === 404) {
      return false;
    }
    // กรณีอื่นๆ ให้โยน error ต่อ
    throw error;
  }
}

// ===> สร้างโฟลเดอร์ใน Google Drive <===
export async function createFolder(folderName) {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/drive"],
    });

    const drive = google.drive({ version: "v3", auth });

    const response = await drive.files.create({
      requestBody: {
        name: folderName,
        mimeType: "application/vnd.google-apps.folder",
      },
      fields: "id",
    });

    console.log(`Folder created with ID: ${response.data.id}`);
    return response.data.id;
  } catch (error) {
    console.error("Error creating folder:", error);
    throw error;
  }
}
