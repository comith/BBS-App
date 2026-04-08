/**
 * One-time migration script: Google Sheets → PostgreSQL (records table)
 *
 * Usage:
 *   npx ts-node -r tsconfig-paths/register scripts/import-records-from-sheets.ts
 *
 * Flags:
 *   --dry-run   แสดงข้อมูลที่จะ import โดยไม่บันทึกจริง
 *   --headers   แสดง headers ของ sheet แล้วหยุด
 */

import { google } from "googleapis";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const HEADERS_ONLY = args.includes("--headers");

const SHEET_ID = process.env.GOOGLE_SHEET_ID!;
const SHEET_NAME = "record"; // ชื่อ tab ใน Google Sheet

// ===============================
// Google Sheets Auth
// ===============================
async function getSheetData(): Promise<string[][]> {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  const sheets = google.sheets({ version: "v4", auth });
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: SHEET_NAME,
  });

  return (response.data.values as string[][]) || [];
}

// ===============================
// Map sheet row → Record object
// ===============================
function mapRow(
  headers: string[],
  row: string[]
): Record<string, unknown> | null {
  const get = (key: string) => {
    const idx = headers.indexOf(key);
    return idx !== -1 ? (row[idx] ?? "").trim() : "";
  };

  // Sheet column → Prisma field mapping
  // record_id        → id
  // date             → date
  // employee_id      → employeeId
  // fullname         → username
  // group            → group
  // depart           → type
  // safetycategory_id    → safetyCategory
  // sub_safetycategory_id → subSafetyCategory
  // observed_Work    → observedWork
  // department_notice → departNotice
  // vehicleEquipment → vehicleEquipment
  // selectedOptions  → selectedOptions
  // safeActionCount  → safeActionCount
  // actionType       → actionType
  // unsafeActionCount → unsafeActionCount
  // actionTypeunsafe → actionTypeUnsafe
  // attachment       → attachment
  // other            → other
  // status           → status
  // comment          → adminNote
  // approve_at       → approvedDate
  // approve_by       → approvedBy
  // notifyShe        → (ไม่มีใน Prisma model - ข้าม)
  // notifyEmployee   → (ไม่มีใน Prisma model - ข้าม)

  const id = get("record_id");
  if (!id) return null;

  const parseJsonSafe = (val: string) => {
    if (!val) return null;
    try {
      return JSON.parse(val);
    } catch {
      return val;
    }
  };

  const parseDate = (val: string) => {
    if (!val) return null;
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  };

  return {
    id,
    date: get("date") || null,
    employeeId: get("employee_id") || null,
    username: get("fullname") || null,
    group: get("group") || null,
    type: get("depart") || null,
    safetyCategory: get("safetycategory_id") || null,
    subSafetyCategory: get("sub_safetycategory_id") || null,
    observedWork: get("observed_Work") || null,
    departNotice: get("department_notice") || null,
    vehicleEquipment: parseJsonSafe(get("vehicleEquipment")),
    selectedOptions: get("selectedOptions") || null,
    safeActionCount: parseInt(get("safeActionCount") || "0") || 0,
    actionType: get("actionType") || null,
    unsafeActionCount: parseInt(get("unsafeActionCount") || "0") || 0,
    actionTypeUnsafe: get("actionTypeunsafe") || null,
    attachment: parseJsonSafe(get("attachment")),
    other: get("other") || null,
    status: get("status") || "pending",
    adminNote: get("comment") || null,
    approvedDate: parseDate(get("approve_at")),
    approvedBy: get("approve_by") || null,
    createdAt: parseDate(get("date")) ?? new Date(),
  };
}

// ===============================
// Main
// ===============================
async function main() {
  console.log("เชื่อมต่อ Google Sheets...");
  const rows = await getSheetData();

  if (rows.length === 0) {
    console.log("ไม่พบข้อมูลใน sheet");
    return;
  }

  const headers = rows[0];
  console.log(`\nHeaders (${headers.length} คอลัมน์):`);
  headers.forEach((h, i) => console.log(`  [${i}] ${h}`));

  if (HEADERS_ONLY) {
    console.log("\n--headers mode: หยุดที่นี่");
    return;
  }

  const dataRows = rows.slice(1).filter((r) => r.some((c) => c?.trim()));
  console.log(`\nพบ ${dataRows.length} แถว (ไม่รวม header)\n`);

  const records = dataRows
    .map((row) => mapRow(headers, row))
    .filter(Boolean) as Record<string, unknown>[];

  console.log(`parse สำเร็จ: ${records.length} records`);

  if (DRY_RUN) {
    console.log("\n--dry-run mode: ตัวอย่าง 3 แถวแรก:");
    console.log(JSON.stringify(records.slice(0, 3), null, 2));
    return;
  }

  // ===============================
  // Import to DB
  // ===============================
  const rawUrl = new URL(process.env.DATABASE_URL!);
  const schema = rawUrl.searchParams.get("schema") || "public";
  rawUrl.searchParams.delete("schema");
  const pool = new Pool({ connectionString: rawUrl.toString() });
  const adapter = new PrismaPg(pool, { schema });
  const prisma = new PrismaClient({ adapter } as any);
  let success = 0;
  let skip = 0;
  let fail = 0;

  console.log("เริ่ม import...");
  for (const record of records) {
    try {
      await (prisma.record as any).upsert({
        where: { id: record.id as string },
        update: record,
        create: record,
      });
      success++;
    } catch (err) {
      fail++;
      console.error(`  [FAIL] id=${record.id}:`, (err as Error).message);
    }
  }

  console.log(`\nสรุป:`);
  console.log(`  สำเร็จ  : ${success}`);
  console.log(`  ข้าม    : ${skip}`);
  console.log(`  ล้มเหลว : ${fail}`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
