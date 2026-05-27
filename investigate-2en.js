const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  // Find all employees who appear as supervisors of groups other than their own
  // by looking at reports where the group differs from the employee's static group
  const empRes = await client.query('SELECT "employeerId", "fullName", "group", "department", "position" FROM "bbso_ith"."employees" WHERE "employeerId" LIKE \'2EN%\'');
  
  console.log("=== 2EN Employees and their static groups ===");
  for (const emp of empRes.rows) {
    console.log(`${emp.employeerId} | ${emp.fullName} | group: ${emp.group} | dept: ${emp.department} | pos: ${emp.position}`);
  }

  // Check what groups these 2EN employees submitted reports to (all time)
  const reportsRes = await client.query(`
    SELECT "employeeId", "group", COUNT(*) as cnt 
    FROM "bbso_ith"."records" 
    WHERE "status" = 'approved' AND "employeeId" LIKE '2EN%'
    GROUP BY "employeeId", "group"
    ORDER BY "employeeId", "group"
  `);
  
  console.log("\n=== 2EN Report submissions by group ===");
  for (const r of reportsRes.rows) {
    console.log(`${r.employeeId} -> group ${r.group} (${r.cnt} reports)`);
  }

  // Check: is there a separate table that maps supervisors to groups?
  // Let's look at the departments/groups tables
  const cols = await client.query(`
    SELECT table_name, column_name 
    FROM information_schema.columns 
    WHERE table_schema = 'bbso_ith' 
    ORDER BY table_name, ordinal_position
  `);
  
  console.log("\n=== All tables and columns ===");
  let currentTable = '';
  for (const c of cols.rows) {
    if (c.table_name !== currentTable) {
      currentTable = c.table_name;
      console.log(`\nTable: ${currentTable}`);
    }
    console.log(`  - ${c.column_name}`);
  }

  await client.end();
}

main().catch(console.error);
