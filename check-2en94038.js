const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  await client.connect();
  
  const start = new Date(2026, 3, 21).getTime();
  const end = new Date(2026, 4, 20, 23, 59, 59, 999).getTime();

  const res = await client.query(`SELECT "group", "createdAt" FROM "bbso_ith"."records" WHERE "status" = 'approved' AND "employeeId" = '2EN94038'`);
  
  console.log("Records for 2EN94038:");
  res.rows.forEach(r => {
      const t = new Date(r.createdAt).getTime();
      const inRange = t >= start && t <= end;
      console.log(`- ${r.group} on ${r.createdAt} (In Range: ${inRange})`);
  });

  await client.end();
}

main().catch(console.error);
