const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  await client.connect();
  
  const start = new Date(2026, 3, 21).getTime();
  const end = new Date(2026, 4, 20, 23, 59, 59, 999).getTime();

  // Check SHE violations
  const she = await client.query(`
    SELECT "group", "createdAt" 
    FROM "bbso_ith"."records_she" 
    WHERE "group" IN ('AUX3', 'AUX4', 'AUX5')
  `);
  
  const counts = { AUX3: 0, AUX4: 0, AUX5: 0 };
  she.rows.forEach(r => {
      const t = new Date(r.createdAt).getTime();
      if (t >= start && t <= end) {
          counts[r.group]++;
      }
  });

  console.log("SHE records this month:");
  console.log(counts);

  await client.end();
}

main().catch(console.error);
