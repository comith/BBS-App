/**
 * Migration script: Google Sheets → Supabase (PostgreSQL)
 * Run: npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/migrate-from-sheets.ts
 */

import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

import { google } from 'googleapis'
import { Client } from 'pg'

// ── DB client ─────────────────────────────────────────────────────────────────
async function createClient(): Promise<Client> {
  const rawUrl = new URL(process.env.DATABASE_URL!)
  const schema = rawUrl.searchParams.get('schema') || 'public'
  rawUrl.searchParams.delete('schema')

  const client = new Client({ connectionString: rawUrl.toString() })
  await client.connect()
  await client.query(`SET search_path TO "${schema}"`)
  console.log(`✅ Connected to DB (schema: ${schema})`)
  return client
}

// ── Google Sheets ─────────────────────────────────────────────────────────────
async function getSheets() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!,
      private_key: process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  })
  return google.sheets({ version: 'v4', auth })
}

async function getSheetData(sheets: any, range: string): Promise<any[][]> {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range,
  })
  return res.data.values || []
}

function toRows(raw: any[][]): Record<string, string>[] {
  if (raw.length < 2) return []
  const [headers, ...rows] = raw
  return rows.map((row) =>
    Object.fromEntries(headers.map((h: string, i: number) => [h.trim(), (row[i] ?? '').toString()]))
  )
}

function safeInt(val: string | undefined): number {
  const n = parseInt(val ?? '', 10)
  return isNaN(n) ? 0 : n
}

function safeJSON(val: string | undefined): string | null {
  if (!val || val.trim() === '') return null
  try { JSON.parse(val); return val } catch { return null }
}

function safeDate(val: string | undefined): string | null {
  if (!val || val.trim() === '') return null
  const d = new Date(val)
  return isNaN(d.getTime()) ? null : d.toISOString()
}

function str(val: string | undefined): string | null {
  return val && val.trim() !== '' ? val.trim() : null
}

// ── Main ───────────────────────────────────────────────────────────────────────
async function main() {
  const [sheets, db] = await Promise.all([getSheets(), createClient()])
  console.log('✅ Connected to Google Sheets')

  try {
    // ── 1. Departments ──────────────────────────────────────────────────────
    console.log('\n📦 Migrating departments...')
    const deptRaw = await getSheetData(sheets, 'list_department!A1:D')
    const deptRows = toRows(deptRaw)
    let deptCount = 0
    for (const row of deptRows) {
      // Try common column names
      const vals = Object.values(row)
      const name = str(row['name'] || row['shortname'] || vals[1])
      const groupName = str(row['groupName'] || row['group_name'] || vals[2])
      if (!name) continue
      await db.query(
        `INSERT INTO departments (name, group_name)
         VALUES ($1, $2)
         ON CONFLICT (name) DO UPDATE SET group_name = EXCLUDED.group_name`,
        [name, groupName]
      )
      deptCount++
    }
    console.log(`  ✔ ${deptCount} departments`)

    // ── 2. Groups ────────────────────────────────────────────────────────────
    console.log('\n📦 Migrating groups...')
    const groupRaw = await getSheetData(sheets, 'list_group!A1:C')
    const groupRows = toRows(groupRaw)
    let groupCount = 0
    for (const row of groupRows) {
      const vals = Object.values(row)
      const name = str(row['name'] || vals[1])
      const deptName = str(row['department'] || row['departmentName'] || vals[2])
      if (!name) continue
      let departmentId: number | null = null
      if (deptName) {
        const res = await db.query('SELECT id FROM departments WHERE name = $1', [deptName])
        departmentId = res.rows[0]?.id ?? null
      }
      await db.query(
        `INSERT INTO groups (name, "departmentId")
         VALUES ($1, $2)
         ON CONFLICT (name) DO UPDATE SET "departmentId" = EXCLUDED."departmentId"`,
        [name, departmentId]
      )
      groupCount++
    }
    console.log(`  ✔ ${groupCount} groups`)

    // ── 3. Employees ─────────────────────────────────────────────────────────
    console.log('\n📦 Migrating employees...')
    const empRaw = await getSheetData(sheets, 'employee!A1:F')
    const empRows = toRows(empRaw)
    
    // Clear all existing employees first
    await db.query('DELETE FROM employees')
    
    let empCount = 0
    for (const row of empRows) {
      const vals = Object.values(row)
      const employeerId = str(row['employeerId'] || row['employeerID'] || vals[1])
      if (!employeerId) continue
      await db.query(
        `INSERT INTO employees ("employeerId", "fullName", department, "group", position, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
        [
          employeerId,
          str(row['fullName'] || vals[2]),
          str(row['department'] || vals[3]),
          str(row['group'] || vals[4]),
          str(row['position'] || vals[5]),
        ]
      )
      empCount++
    }
    console.log(`  ✔ ${empCount} employees`)

    // ── 4. Categories ────────────────────────────────────────────────────────
    console.log('\n📦 Migrating categories...')
    const catRaw = await getSheetData(sheets, 'category_data!A1:D')
    const catRows = toRows(catRaw)
    let catCount = 0
    for (const row of catRows) {
      const vals = Object.values(row)
      const id = safeInt(row['id'] || vals[0])
      const name = str(row['name'] || vals[1])
      if (!name || !id) continue
      await db.query(
        `INSERT INTO categories (id, name, "imagePath", alt)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO UPDATE
           SET name = EXCLUDED.name,
               "imagePath" = EXCLUDED."imagePath",
               alt = EXCLUDED.alt`,
        [id, name, str(row['imagePath'] || vals[2]), str(row['alt'] || vals[3])]
      )
      catCount++
    }
    console.log(`  ✔ ${catCount} categories`)

    // ── 5. SubCategories ─────────────────────────────────────────────────────
    console.log('\n📦 Migrating subcategories...')
    const subRaw = await getSheetData(sheets, 'sub_category_data!A1:K')
    const subRows = toRows(subRaw)
    const optRaw = await getSheetData(sheets, 'list_option!A1:C')
    const optionsBySubId: Record<number, { id: number; name: string }[]> = {}
    for (const optRow of optRaw.slice(1)) {
      const subId = safeInt(optRow[2])
      if (!subId) continue
      optionsBySubId[subId] = optionsBySubId[subId] || []
      optionsBySubId[subId].push({ id: safeInt(optRow[0]), name: optRow[1] || '' })
    }
    let subCount = 0
    for (const row of subRows) {
      const vals = Object.values(row)
      const id = safeInt(row['id'] || vals[0])
      const categoryId = safeInt(row['category_id'] || vals[1])
      const name = str(row['name'] || vals[2])
      if (!name || !id || !categoryId) continue
      const departcategory = safeJSON(row['departcategory_id'] || row['departcategory'])
      await db.query(
        `INSERT INTO sub_categories
           (id, "categoryId", name, "imagePath", alt, type, subject, placeholder, title, departcategory, "createdAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
         ON CONFLICT (id) DO UPDATE
           SET "categoryId" = EXCLUDED."categoryId",
               name = EXCLUDED.name,
               "imagePath" = EXCLUDED."imagePath",
               alt = EXCLUDED.alt,
               type = EXCLUDED.type,
               subject = EXCLUDED.subject,
               placeholder = EXCLUDED.placeholder,
               title = EXCLUDED.title,
               departcategory = EXCLUDED.departcategory`,
        [
          id, categoryId, name,
          str(row['imagePath'] || vals[3]),
          str(row['alt'] || vals[4]),
          str(row['type'] || vals[5]),
          str(row['subject'] || vals[6]),
          str(row['placeholder'] || vals[7]),
          str(row['title'] || vals[8]),
          departcategory,
        ]
      )
      // Insert options
      for (const opt of optionsBySubId[id] || []) {
        await db.query(
          `INSERT INTO list_options (name, "subCategoryId")
           VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [opt.name, id]
        )
      }
      subCount++
    }
    console.log(`  ✔ ${subCount} subcategories`)

    // ── 6. Records ───────────────────────────────────────────────────────────
    console.log('\n📦 Migrating records...')
    const recRaw = await getSheetData(sheets, 'record!A1:V')
    const recRows = toRows(recRaw)
    let recCount = 0, recSkip = 0
    for (const row of recRows) {
      const vals = Object.values(row)
      // A=id B=date C=employeeId D=username E=group F=type G=safetyCategory
      // H=subSafetyCategory I=observedWork J=departNotice K=vehicleEquipment
      // L=selectedOptions M=safeActionCount N=actionType O=unsafeActionCount
      // P=actionTypeUnsafe Q=attachment R=other S=status T=adminNote
      // U=approvedDate V=approvedBy
      const id = str(row['id'] || vals[0])
      if (!id) { recSkip++; continue }
      await db.query(
        `INSERT INTO records
           (id, date, "employeeId", username, "group", type, "safetyCategory",
            "subSafetyCategory", "observedWork", "departNotice", "vehicleEquipment",
            "selectedOptions", "safeActionCount", "actionType", "unsafeActionCount",
            "actionTypeUnsafe", attachment, other, status, "adminNote",
            "approvedDate", "approvedBy", "createdAt", "updatedAt")
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,NOW(),NOW())
         ON CONFLICT (id) DO UPDATE
           SET status = EXCLUDED.status,
               "adminNote" = EXCLUDED."adminNote",
               "approvedDate" = EXCLUDED."approvedDate",
               "approvedBy" = EXCLUDED."approvedBy",
               "updatedAt" = NOW()`,
        [
          id,
          str(row['date'] || vals[1]),
          str(row['employeeId'] || vals[2]),
          str(row['username'] || vals[3]),
          str(row['group'] || vals[4]),
          str(row['type'] || vals[5]),
          str(row['safetyCategory'] || vals[6]),
          str(row['subSafetyCategory'] || row['sub_safetyCategory'] || vals[7]),
          str(row['observedWork'] || row['observed_work'] || vals[8]),
          str(row['departNotice'] || row['depart_notice'] || vals[9]),
          safeJSON(row['vehicleEquipment'] || vals[10]),
          str(row['selectedOptions'] || vals[11]),
          safeInt(row['safeActionCount'] || vals[12]),
          str(row['actionType'] || vals[13]),
          safeInt(row['unsafeActionCount'] || vals[14]),
          str(row['actionTypeUnsafe'] || row['actionTypeunsafe'] || vals[15]),
          safeJSON(row['attachment'] || vals[16]),
          str(row['other'] || vals[17]),
          str(row['status'] || vals[18]) || 'pending',
          str(row['adminNote'] || vals[19]),
          safeDate(row['approvedDate'] || vals[20]),
          str(row['approvedBy'] || vals[21]),
        ]
      )
      recCount++
    }
    console.log(`  ✔ ${recCount} records (skipped ${recSkip})`)

    // ── 7. SHE Records ───────────────────────────────────────────────────────
    console.log('\n📦 Migrating SHE records...')
    const sheRaw = await getSheetData(sheets, 'record_she!A1:T')
    const sheRows = toRows(sheRaw)
    let sheCount = 0, sheSkip = 0
    for (const row of sheRows) {
      const vals = Object.values(row)
      const id = str(row['id'] || vals[0])
      if (!id) { sheSkip++; continue }
      await db.query(
        `INSERT INTO records_she
           (id, date, "employeeId", username, "group", type, "safetyCategory",
            "subSafetyCategory", "observedWork", "departNotice", "vehicleEquipment",
            "selectedOptions", "safeActionCount", "actionType", "unsafeActionCount",
            "actionTypeUnsafe", attachment, other, "codeEmployee", "levelOfSafety",
            "createdAt", "updatedAt")
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,NOW(),NOW())
         ON CONFLICT (id) DO UPDATE
           SET "codeEmployee" = EXCLUDED."codeEmployee",
               "levelOfSafety" = EXCLUDED."levelOfSafety",
               "updatedAt" = NOW()`,
        [
          id,
          str(row['date'] || vals[1]),
          str(row['employeeId'] || vals[2]),
          str(row['username'] || vals[3]),
          str(row['group'] || vals[4]),
          str(row['type'] || vals[5]),
          str(row['safetyCategory'] || vals[6]),
          str(row['subSafetyCategory'] || row['sub_safetyCategory'] || vals[7]),
          str(row['observedWork'] || row['observed_work'] || vals[8]),
          str(row['departNotice'] || row['depart_notice'] || vals[9]),
          safeJSON(row['vehicleEquipment'] || vals[10]),
          str(row['selectedOptions'] || vals[11]),
          safeInt(row['safeActionCount'] || vals[12]),
          str(row['actionType'] || vals[13]),
          safeInt(row['unsafeActionCount'] || vals[14]),
          str(row['actionTypeUnsafe'] || row['actionTypeunsafe'] || vals[15]),
          safeJSON(row['attachment'] || vals[16]),
          str(row['other'] || vals[17]),
          str(row['codeEmployee'] || row['codeemployee'] || vals[18]),
          str(row['levelOfSafety'] || vals[19]),
        ]
      )
      sheCount++
    }
    console.log(`  ✔ ${sheCount} SHE records (skipped ${sheSkip})`)

    console.log('\n🎉 Migration complete!')
  } finally {
    await db.end()
  }
}

main().catch((e) => { console.error('❌ Migration failed:', e.message); process.exit(1) })
