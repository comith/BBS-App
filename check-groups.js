const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  await client.connect();
  
  // Get BBS reports count for AUX3, AUX4, AUX5 for the current period (April 21 - May 20 or May 21 - June 20)
  // Let's just group by "group" where status = 'approved' and count them
  const res = await client.query(`
    SELECT "group", COUNT(*) as count 
    FROM "bbso_ith"."records" 
    WHERE "status" = 'approved' AND "group" IN ('AUX3', 'AUX4', 'AUX5')
    GROUP BY "group"
  `);
  console.log("Approved records all time:");
  console.log(res.rows);

  // Check SHE violations
  const she = await client.query(`
    SELECT "group", COUNT(*) as count 
    FROM "bbso_ith"."records_she" 
    WHERE "group" IN ('AUX3', 'AUX4', 'AUX5')
    GROUP BY "group"
  `);
  console.log("SHE records all time:");
  console.log(she.rows);

  await client.end();
}

main().catch(console.error);
