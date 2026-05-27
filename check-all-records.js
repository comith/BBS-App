const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  await client.connect();
  
  const start = new Date(2026, 3, 21).getTime();
  const end = new Date(2026, 4, 20, 23, 59, 59, 999).getTime();

  const res = await client.query(`SELECT "employeeId", "group", "createdAt", "submittedDate" FROM "bbso_ith"."records" WHERE "status" = 'approved'`);
  
  console.log("Records containing 2EN94038 in any field:");
  res.rows.forEach(r => {
      const t = r.submittedDate ? new Date(r.submittedDate).getTime() : new Date(r.createdAt).getTime();
      const inRange = t >= start && t <= end;
      if (inRange && (r.employeeId === '2EN94038' || JSON.stringify(r).includes('2EN94038'))) {
          console.log(`- ${r.employeeId} in ${r.group} on ${new Date(t)}`);
      }
  });

  await client.end();
}

main().catch(console.error);
