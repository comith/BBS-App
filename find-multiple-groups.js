const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  
  const employeesRes = await client.query('SELECT * FROM "bbso_ith"."employees"');
  const employees = employeesRes.rows;

  const start = new Date(2026, 3, 21).getTime();
  const end = new Date(2026, 4, 20, 23, 59, 59, 999).getTime();

  const reportsRes = await client.query(`SELECT "employeeId", "group", "createdAt", "department" FROM "bbso_ith"."records" WHERE "status" = 'approved'`);
  const monthlyReports = reportsRes.rows.filter(r => {
      const t = new Date(r.createdAt).getTime();
      return t >= start && t <= end;
  });

  const reportBasedGroups = {};
  
  // Static
  employees.forEach(emp => {
      if (emp.department === 'ITH-OE') return;
      if (!emp.group) return;
      const groups = emp.group.split(',').map(g => g.trim());
      groups.forEach(grp => {
          if (grp.endsWith("0") && !grp.match(/\d{2,}$/)) return;
          const dept = emp.department || 'Unknown';
          if (!reportBasedGroups[dept]) reportBasedGroups[dept] = {};
          if (!reportBasedGroups[dept][grp]) reportBasedGroups[dept][grp] = new Set();
          reportBasedGroups[dept][grp].add(emp.employeerId || emp.employeeId);
      });
  });

  // Dynamic
  monthlyReports.forEach(r => {
      if (r.department === 'ITH-OE') return;
      const grp = (r.group || '').trim();
      if (grp.endsWith("0") && !grp.match(/\d{2,}$/)) return;
      const dept = r.department || 'Unknown';
      if (!reportBasedGroups[dept]) reportBasedGroups[dept] = {};
      if (!reportBasedGroups[dept][grp]) reportBasedGroups[dept][grp] = new Set();
      reportBasedGroups[dept][grp].add(r.employeeId);
  });

  const employeeOccurrences = {};
  Object.keys(reportBasedGroups).forEach(dept => {
      Object.keys(reportBasedGroups[dept]).forEach(grp => {
          reportBasedGroups[dept][grp].forEach(empId => {
              if (!empId) return;
              if (!employeeOccurrences[empId]) employeeOccurrences[empId] = [];
              employeeOccurrences[empId].push({ dept, grp });
          });
      });
  });

  console.log("Employees in multiple groups this month:");
  let found = 0;
  for (const empId in employeeOccurrences) {
      if (employeeOccurrences[empId].length > 1) {
          console.log(`- ${empId}: `, employeeOccurrences[empId]);
          found++;
      }
  }
  if (found === 0) console.log("None.");

  await client.end();
}

main().catch(console.error);
