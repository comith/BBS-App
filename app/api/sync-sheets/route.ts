import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { prisma } from '@/lib/prisma';

export const maxDuration = 60; // Set longer timeout for this API route if using Vercel

function toRows(raw: any[][]): Record<string, string>[] {
  if (raw.length < 2) return [];
  const [headers, ...rows] = raw;
  return rows.map((row) =>
    Object.fromEntries(headers.map((h: string, i: number) => [h.trim(), (row[i] ?? '').toString()]))
  );
}

function str(val: string | undefined): string | null {
  return val && val.trim() !== '' ? val.trim() : null;
}

function safeInt(val: string | undefined): number {
  const n = parseInt(val ?? '', 10);
  return isNaN(n) ? 0 : n;
}

export async function POST() {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    if (!spreadsheetId) {
      throw new Error("Missing GOOGLE_SHEET_ID");
    }

    const summary = {
      departments: 0,
      groups: 0,
      employees: 0,
      options: 0
    };

    // 1. Departments
    const deptRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'list_department!A1:D',
    });
    const deptRows = toRows(deptRes.data.values || []);
    for (const row of deptRows) {
      const vals = Object.values(row);
      const name = str(row['name'] || row['shortname'] || vals[1]);
      const groupName = str(row['groupName'] || row['group_name'] || vals[2]);
      
      if (!name) continue;

      await prisma.department.upsert({
        where: { name },
        update: { groupName },
        create: { name, groupName },
      });
      summary.departments++;
    }

    // 2. Groups
    const groupRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'list_group!A1:C',
    });
    const groupRows = toRows(groupRes.data.values || []);
    for (const row of groupRows) {
      const vals = Object.values(row);
      const name = str(row['name'] || vals[1]);
      const deptName = str(row['department'] || row['departmentName'] || vals[2]);
      
      if (!name) continue;

      let departmentId: number | null = null;
      if (deptName) {
        const dept = await prisma.department.findUnique({
          where: { name: deptName }
        });
        departmentId = dept?.id ?? null;
      }

      await prisma.group.upsert({
        where: { name },
        update: { departmentId },
        create: { name, departmentId },
      });
      summary.groups++;
    }

    // 3. Employees
    const empRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'employee!A1:F',
    });
    const empRows = toRows(empRes.data.values || []);
    
    // Clear all existing employees first so we don't duplicate them across multiple sync actions
    await prisma.employee.deleteMany();

    const employeesToCreate = [];
    for (const row of empRows) {
      const vals = Object.values(row);
      let employeerId = str(row['employeerId'] || row['employeerID'] || vals[1]);
      const fullName = str(row['fullName'] || vals[2]);
      const department = str(row['department'] || vals[3]);
      const group = str(row['group'] || vals[4]);
      const position = str(row['position'] || vals[5]);

      // ถ้าไม่มีทั้ง employeerId และ fullName ให้ข้ามแถวว่าง
      if (!employeerId && !fullName) continue;

      if (!employeerId) {
        // ไม่มี employeerId -> สร้างด้วย generated ID
        employeerId = `EMP_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      }

      employeesToCreate.push({
        employeerId,
        fullName,
        department,
        group,
        position,
      });
      summary.employees++;
    }

    if (employeesToCreate.length > 0) {
      await prisma.employee.createMany({
        data: employeesToCreate,
      });
    }

    // 4. List Options (Assuming they rely on an existing SubCategoryId)
    // For List Options, the schema doesn't have a unique constraint on 'name', 
    // but typically we can try to find first or we might just use a unique constraint if we have one.
    // In the migration script, it uses `ON CONFLICT DO NOTHING` but without a unique constraint in Prisma,
    // this can be tricky. We will use findFirst to prevent duplicate inserts.
    const optRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'list_option!A1:C',
    });
    const optRaw = optRes.data.values || [];
    for (let i = 1; i < optRaw.length; i++) {
      const optRow = optRaw[i];
      const optId = safeInt(optRow[0]);
      const optName = str(optRow[1] || '');
      const subId = safeInt(optRow[2]);

      if (!subId || !optName) continue;

      // Check if subCategory exists to avoid foreign key errors
      const subExists = await prisma.subCategory.findUnique({
        where: { id: subId }
      });

      if (subExists) {
        // Since list_options does not have a unique identifier across name/subCategory,
        // we check if it already exists before inserting.
        const existingOpt = await prisma.listOption.findFirst({
          where: { name: optName, subCategoryId: subId }
        });

        if (!existingOpt) {
          await prisma.listOption.create({
            data: {
              name: optName,
              subCategoryId: subId
            }
          });
          summary.options++;
        }
      }
    }

    return NextResponse.json({ success: true, summary });

  } catch (error: any) {
    console.error("Sync API Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
