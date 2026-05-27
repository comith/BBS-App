const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  await client.connect();
  
  // Find employee 2EN94038
  const res = await client.query(`SELECT "employeerId", "fullName", "group", "department" FROM "bbso_ith"."employees" WHERE "employeerId" = '2EN94038'`);
  console.log("Employee:", res.rows);
  
  // Get all approved records for this month
  const records = await client.query(`SELECT "group", "employeeId" FROM "bbso_ith"."records" WHERE "status" = 'approved' AND "employeeId" = '2EN94038'`);
  console.log("Records for 2EN94038 this month in groups:");
  const groups = new Set();
  records.rows.forEach(r => groups.add(r.group));
  console.log(Array.from(groups));

  await client.end();
}

main().catch(console.error);
