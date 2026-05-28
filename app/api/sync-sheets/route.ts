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

    // ──────────────────────────────────────────────
    // ดึงข้อมูลจาก Google Sheets ทั้ง 4 แผ่นพร้อมกันในครั้งเดียว (batchGet)
    // แทนที่จะเรียก API ทีละแผ่น 4 ครั้งตามลำดับ
    // ──────────────────────────────────────────────
    const batchRes = await sheets.spreadsheets.values.batchGet({
      spreadsheetId,
      ranges: [
        'list_department!A1:D',
        'list_group!A1:C',
        'employee!A1:F',
        'list_option!A1:C',
      ],
    });

    const valueRanges = batchRes.data.valueRanges || [];
    const deptRows = toRows(valueRanges[0]?.values || []);
    const groupRows = toRows(valueRanges[1]?.values || []);
    const empRows = toRows(valueRanges[2]?.values || []);
    const optRaw = valueRanges[3]?.values || [];

    // ──────────────────────────────────────────────
    // ใช้ Prisma Transaction เพื่อ batch DB operations ทั้งหมดรวมกัน
    // ลด round-trip ไปยังฐานข้อมูล
    // ──────────────────────────────────────────────
    await prisma.$transaction(async (tx) => {

      // 1. Departments — รวบรวม upsert operations แล้วยิงพร้อมกัน
      const deptOps = [];
      for (const row of deptRows) {
        const vals = Object.values(row);
        const name = str(row['name'] || row['shortname'] || vals[1]);
        const groupName = str(row['groupName'] || row['group_name'] || vals[2]);

        if (!name) continue;

        deptOps.push(
          tx.department.upsert({
            where: { name },
            update: { groupName },
            create: { name, groupName },
          })
        );
        summary.departments++;
      }
      await Promise.all(deptOps);

      // สร้าง lookup map สำหรับ department name -> id
      // เพื่อหลีกเลี่ยงการ query ทีละรายการในลูปของ Groups
      const allDepts = await tx.department.findMany({ select: { id: true, name: true } });
      const deptMap = new Map(allDepts.map((d) => [d.name, d.id]));

      // 2. Groups — ใช้ deptMap แทนการ findUnique ทีละรอบ
      const groupOps = [];
      for (const row of groupRows) {
        const vals = Object.values(row);
        const name = str(row['name'] || vals[1]);
        const deptName = str(row['department'] || row['departmentName'] || vals[2]);

        if (!name) continue;

        const departmentId = deptName ? (deptMap.get(deptName) ?? null) : null;

        groupOps.push(
          tx.group.upsert({
            where: { name },
            update: { departmentId },
            create: { name, departmentId },
          })
        );
        summary.groups++;
      }
      await Promise.all(groupOps);

      // 3. Employees — ลบทั้งหมดแล้ว createMany ครั้งเดียว (เดิมก็ทำแบบนี้อยู่แล้ว)
      await tx.employee.deleteMany();

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
        await tx.employee.createMany({
          data: employeesToCreate,
        });
      }

      // 4. List Options
      // โหลด subCategory IDs ทั้งหมดและ listOption ที่มีอยู่ขึ้นมาเก็บใน memory
      // เพื่อหลีกเลี่ยงการ query ทีละรายการ
      const allSubCategories = await tx.subCategory.findMany({ select: { id: true } });
      const subCatIds = new Set(allSubCategories.map((s) => s.id));

      const allExistingOpts = await tx.listOption.findMany({
        select: { name: true, subCategoryId: true },
      });
      const existingOptKeys = new Set(
        allExistingOpts.map((o) => `${o.name}::${o.subCategoryId}`)
      );

      const optionsToCreate: { name: string; subCategoryId: number }[] = [];
      for (let i = 1; i < optRaw.length; i++) {
        const optRow = optRaw[i];
        const optName = str(optRow[1] || '');
        const subId = safeInt(optRow[2]);

        if (!subId || !optName) continue;
        if (!subCatIds.has(subId)) continue;

        const key = `${optName}::${subId}`;
        if (existingOptKeys.has(key)) continue;

        // ป้องกัน duplicate ภายใน batch เดียวกัน
        existingOptKeys.add(key);
        optionsToCreate.push({ name: optName, subCategoryId: subId });
        summary.options++;
      }

      if (optionsToCreate.length > 0) {
        await tx.listOption.createMany({ data: optionsToCreate });
      }
    });

    return NextResponse.json({ success: true, summary });

  } catch (error: any) {
    console.error("Sync API Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
