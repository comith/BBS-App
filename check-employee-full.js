const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const res = await client.query(`SELECT * FROM "bbso_ith"."employees" WHERE "employeerId" = '2EN94038' OR "fullName" LIKE '%ยุทธนา%'`);
  console.log(res.rows);
  await client.end();
}

main().catch(console.error);
