import { google } from 'googleapis';

// สร้าง auth client
async function getAuthClient() {
  try {
    // สร้าง auth client จาก environment variables
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive'],
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
    const sheets = google.sheets({ version: 'v4', auth: client });
    
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
    const sheets = google.sheets({ version: 'v4', auth });
    
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: range,
      valueInputOption: 'USER_ENTERED',  // ข้อมูลจะถูกแปลงตามรูปแบบของ Google Sheets
      insertDataOption: 'INSERT_ROWS',   // แทรกข้อมูลเป็นแถวใหม่
      resource: {
        values: values,
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('Error appending data to Google Sheets:', error);
    throw error;
  }
}

// [ UPDATE ]
export async function updateSheetData(range, values) {
  try {
    const auth = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });
    
    const response = await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: range,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: values,
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('Error updating data in Google Sheets:', error);
    throw error;
  }
}

