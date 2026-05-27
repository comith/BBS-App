const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  await client.connect();
  
  const res = await client.query(`SELECT "employeerId", "fullName", "group", "department" FROM "bbso_ith"."employees" WHERE "employeerId" LIKE '2EN%'`);
  
  console.log(`Found ${res.rows.length} employees starting with 2EN.`);
  
  // check for multiple groups
  let multipleGroups = res.rows.filter(r => r.group && (r.group.includes(',') || r.group.includes('/')));
  
  console.log(`Employees with multiple groups: ${multipleGroups.length}`);
  if (multipleGroups.length > 0) {
    console.log(multipleGroups.slice(0, 5));
  }
  
  // also group by group string
  const grouped = {};
  for(let row of res.rows) {
      if(!grouped[row.group]) grouped[row.group] = 0;
      grouped[row.group]++;
  }
  console.log("Groups:", grouped);

  await client.end();
}

main().catch(console.error);
