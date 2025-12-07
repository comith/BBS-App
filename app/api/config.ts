// config.ts - Google Sheets & Drive API Configuration

import { google } from "googleapis";
import { Readable } from "stream";
import { apiLogger } from "@/lib/logger";

// Type definitions


interface FileMetadata {
    name: string;
    parents?: string[];
}

/**
 * Create and return Google Auth client
 * @returns Google Auth instance
 */
async function getAuthClient() {
    try {
        const privateKey = process.env.GOOGLE_PRIVATE_KEY;
        const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;

        if (!privateKey || !clientEmail) {
            throw new Error("Missing Google credentials in environment variables");
        }

        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: clientEmail,
                private_key: privateKey.replace(/\\n/g, "\n"),
            },
            scopes: [
                "https://www.googleapis.com/auth/spreadsheets",
                "https://www.googleapis.com/auth/drive",
            ],
        });

        return auth;
    } catch (error) {
        apiLogger.error("Error creating auth client", error);
        throw error;
    }
}

/**
 * Get data from Google Sheet
 * @param range - Sheet range (e.g., "Sheet1!A1:B10")
 * @returns Array of row values
 */
export async function getSheetData(range: string): Promise<any[][] | undefined> {
    try {
        const auth = await getAuthClient();
        const sheets = google.sheets({ version: "v4", auth });

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.GOOGLE_SHEET_ID,
            range: range,
        });

        apiLogger.info(`Fetched data from range: ${range}`);
        return response.data.values || undefined;
    } catch (error) {
        apiLogger.error(`Error fetching data from Google Sheets (range: ${range})`, error);
        throw error;
    }
}

/**
 * Append data to Google Sheet
 * @param range - Sheet range
 * @param values - 2D array of values to append
 * @returns Response data
 */
export async function appendToSheet(range: string, values: any[][]) {
    try {
        const auth = await getAuthClient();
        const sheets = google.sheets({ version: "v4", auth });

        const response = await sheets.spreadsheets.values.append({
            spreadsheetId: process.env.GOOGLE_SHEET_ID,
            range: range,
            valueInputOption: "USER_ENTERED",
            insertDataOption: "INSERT_ROWS",
            requestBody: {
                values: values,
            },
        });

        apiLogger.info(`Appended ${values.length} rows to range: ${range}`);
        return response.data;
    } catch (error) {
        apiLogger.error(`Error appending data to Google Sheets (range: ${range})`, error);
        throw error;
    }
}

/**
 * Update data in Google Sheet
 * @param range - Sheet range
 * @param values - 2D array of values to update
 * @returns Response data
 */
export async function updateSheet(range: string, values: any[][]) {
    try {
        const auth = await getAuthClient();
        const sheets = google.sheets({ version: "v4", auth });

        const response = await sheets.spreadsheets.values.update({
            spreadsheetId: process.env.GOOGLE_SHEET_ID,
            range: range,
            valueInputOption: "USER_ENTERED",
            requestBody: {
                values: values,
            },
        });

        apiLogger.info(`Updated ${response.data.updatedCells} cells in range: ${range}`);
        return response.data;
    } catch (error) {
        apiLogger.error(`Error updating sheet (range: ${range})`, error);
        throw error;
    }
}

/**
 * Batch update multiple ranges in Google Sheet
 * @param updates - Array of update objects with range and values
 * @returns Response data
 */
export async function batchUpdateSheet(
    updates: Array<{ range: string; values: any[][] }>
) {
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

        apiLogger.info(`Batch updated ${response.data.totalUpdatedCells} cells`);
        return response.data;
    } catch (error) {
        apiLogger.error("Error batch updating sheet", error);
        throw error;
    }
}

/**
 * Upload file to Google Drive
 * @param fileBuffer - File buffer
 * @param filename - Name of the file
 * @param mimeType - MIME type of the file
 * @param folderId - Optional folder ID
 * @returns File metadata
 */
export async function uploadFileToDrive(
    fileBuffer: Buffer,
    filename: string,
    mimeType: string,
    folderId: string | null = null
) {
    try {
        const auth = await getAuthClient();
        const drive = google.drive({ version: "v3", auth });

        // Check if folder exists
        let targetFolderId = folderId;
        if (folderId) {
            try {
                const folderExists = await checkFolderExists(folderId);
                if (!folderExists) {
                    apiLogger.warn(`Folder ID ${folderId} does not exist. Creating new folder...`);
                    targetFolderId = await createFolder("Uploads");
                    apiLogger.info(`Created new folder with ID: ${targetFolderId}`);
                }
            } catch (error) {
                apiLogger.error("Error checking folder", error);
                targetFolderId = await createFolder("Uploads");
                apiLogger.info(`Created new folder with ID: ${targetFolderId}`);
            }
        }

        // Create file metadata
        const fileMetadata: FileMetadata = {
            name: filename,
        };

        if (targetFolderId) {
            fileMetadata.parents = [targetFolderId];
        }

        // Ensure fileBuffer is a Buffer
        const buffer = Buffer.isBuffer(fileBuffer)
            ? fileBuffer
            : Buffer.from(fileBuffer);

        // Convert Buffer to Readable Stream
        const stream = new Readable();
        stream.push(buffer);
        stream.push(null);

        // Upload file
        const response = await drive.files.create({
            requestBody: fileMetadata,
            media: {
                mimeType: mimeType,
                body: stream,
            },
            fields: "id,name,webViewLink",
            supportsAllDrives: true,
        });

        const result = {
            ...response.data,
            folderId: targetFolderId,
        };

        apiLogger.info(`Uploaded file: ${filename} (ID: ${response.data.id})`);
        return result;
    } catch (error) {
        apiLogger.error(`Error uploading file to Google Drive: ${filename}`, error);
        throw error;
    }
}

/**
 * Create file in Google Drive
 * @param filename - Name of the file
 * @param mimeType - MIME type
 * @param content - File content
 * @param folderId - Optional folder ID
 * @returns File metadata
 */
export async function createDriveFile(
    filename: string,
    mimeType: string,
    content: any,
    folderId: string = process.env.GOOGLE_DRIVE_FOLDER_ID || ""
) {
    try {
        const auth = await getAuthClient();
        const drive = google.drive({ version: "v3", auth });

        const fileMetadata: FileMetadata = {
            name: filename,
        };

        if (folderId) {
            fileMetadata.parents = [folderId];
        }

        const response = await drive.files.create({
            requestBody: fileMetadata,
            media: {
                mimeType: mimeType,
                body: content,
            },
            fields: "id,name,webViewLink",
        });

        apiLogger.info(`Created file: ${filename} (ID: ${response.data.id})`);
        return response.data;
    } catch (error) {
        apiLogger.error(`Error creating file in Google Drive: ${filename}`, error);
        throw error;
    }
}

/**
 * Check if folder exists in Google Drive
 * @param folderId - Folder ID to check
 * @returns Boolean indicating if folder exists
 */
export async function checkFolderExists(folderId: string): Promise<boolean> {
    try {
        const auth = await getAuthClient();
        const drive = google.drive({ version: "v3", auth });

        const response = await drive.files.get({
            fileId: folderId,
            fields: "id,name,mimeType",
        });

        return (
            response.data &&
            response.data.mimeType === "application/vnd.google-apps.folder"
        );
    } catch (error: any) {
        if (error.response && error.response.status === 404) {
            return false;
        }
        throw error;
    }
}

/**
 * Create folder in Google Drive
 * @param folderName - Name of the folder
 * @returns Folder ID
 */
export async function createFolder(folderName: string): Promise<string> {
    try {
        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!,
                private_key: process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
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

        const folderId = response.data.id!;
        apiLogger.info(`Created folder: ${folderName} (ID: ${folderId})`);
        return folderId;
    } catch (error) {
        apiLogger.error(`Error creating folder: ${folderName}`, error);
        throw error;
    }
}
