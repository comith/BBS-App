const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  await client.connect();
  
  // Date range
  const start = new Date(2026, 3, 21).getTime();
  const end = new Date(2026, 4, 20, 23, 59, 59, 999).getTime();

  // We need to fetch the dates to see if they fall in the range
  // wait, createdAt or date string?
  // In the application, it parses `submittedDate`.
  // Wait, `records` has `createdAt`.

  const res = await client.query(`
    SELECT "group", "createdAt", "status"
    FROM "bbso_ith"."records" 
    WHERE "status" = 'approved' AND "group" IN ('AUX3', 'AUX4', 'AUX5')
  `);
  
  const counts = { AUX3: 0, AUX4: 0, AUX5: 0 };
  res.rows.forEach(r => {
      const t = new Date(r.createdAt).getTime();
      if (t >= start && t <= end) {
          counts[r.group]++;
      }
  });

  console.log("Approved records this month:");
  console.log(counts);

  await client.end();
}

main().catch(console.error);
