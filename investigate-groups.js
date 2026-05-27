const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  // Look at the groups table - this is how groups relate to departments
  const groups = await client.query(`
    SELECT g.*, d.name as dept_name, d.group_name 
    FROM "bbso_ith"."groups" g 
    LEFT JOIN "bbso_ith"."departments" d ON g."departmentId" = d.id
    ORDER BY d.name, g.name
  `);
  
  console.log("=== Groups with their departments ===");
  for (const g of groups.rows) {
    console.log(`${g.name} -> dept: ${g.dept_name} (group_name: ${g.group_name})`);
  }

  // Check which groups AUX3,AUX4,AUX5 belong to
  console.log("\n=== AUX groups specifically ===");
  const auxGroups = groups.rows.filter(g => g.name && g.name.startsWith('AUX'));
  for (const g of auxGroups) {
    console.log(`${g.name} -> dept: ${g.dept_name}`);
  }

  // Find which employees have group containing comma (multi-group)
  const multiGroup = await client.query(`
    SELECT "employeerId", "fullName", "group", "department" 
    FROM "bbso_ith"."employees" 
    WHERE "group" LIKE '%,%'
    ORDER BY "department", "group"
  `);
  
  console.log("\n=== Employees with multiple groups (comma-separated) ===");
  for (const e of multiGroup.rows) {
    console.log(`${e.employeerId} | ${e.fullName} | groups: ${e.group} | dept: ${e.department}`);
  }

  await client.end();
}

main().catch(console.error);
