const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  await client.connect();
  
  // Get all employees
  const employeesRes = await client.query('SELECT * FROM "bbso_ith"."employees"');
  const employees = employeesRes.rows;

  // Get all reports in range
  const start = new Date(2026, 3, 21).getTime();
  const end = new Date(2026, 4, 20, 23, 59, 59, 999).getTime();

  const reportsRes = await client.query(`
    SELECT "employeeId", "group", "createdAt", "department"
    FROM "bbso_ith"."records" 
    WHERE "status" = 'approved'
  `);
  
  const monthlyReports = reportsRes.rows.filter(r => {
      const t = new Date(r.createdAt).getTime();
      return t >= start && t <= end;
  });

  const reportCountByEmp = new Map();
  for (const r of monthlyReports) {
      reportCountByEmp.set(r.employeeId, (reportCountByEmp.get(r.employeeId) || 0) + 1);
  }

  // Build reportBasedGroups for AUX3, AUX4, AUX5
  const reportBasedGroups = { 'ITH-AUX': { 'AUX3': new Set(), 'AUX4': new Set(), 'AUX5': new Set() } };

  // Static
  employees.forEach(emp => {
      if (emp.department === 'ITH-OE') return;
      if (!emp.group) return;
      const groups = emp.group.split(',').map(g => g.trim());
      groups.forEach(grp => {
          if (['AUX3', 'AUX4', 'AUX5'].includes(grp)) {
              if (emp.department) {
                  if(!reportBasedGroups[emp.department]) reportBasedGroups[emp.department] = {};
                  if(!reportBasedGroups[emp.department][grp]) reportBasedGroups[emp.department][grp] = new Set();
                  reportBasedGroups[emp.department][grp].add(emp.employeerId);
              }
          }
      });
  });

  // Dynamic
  monthlyReports.forEach(r => {
      if (r.department === 'ITH-OE') return;
      const grp = (r.group || '').trim();
      if (['AUX3', 'AUX4', 'AUX5'].includes(grp)) {
          const dept = r.department || 'Unknown';
          if(!reportBasedGroups[dept]) reportBasedGroups[dept] = {};
          if(!reportBasedGroups[dept][grp]) reportBasedGroups[dept][grp] = new Set();
          reportBasedGroups[dept][grp].add(r.employeeId);
      }
  });

  // Calculate isEligible
  const deptName = 'ITH-AUX';
  ['AUX3', 'AUX4', 'AUX5'].forEach(grp => {
      const members = Array.from(reportBasedGroups[deptName][grp] || []);
      let totalBbs = 0;
      members.forEach(m => {
          totalBbs += (reportCountByEmp.get(m) || 0);
      });
      console.log(`Group ${grp} has ${members.length} members. Total BBS = ${totalBbs}. isEligible = ${totalBbs >= 12}`);
      if (members.includes('2EN94038')) {
          console.log(`   -> 2EN94038 is in ${grp}`);
      }
  });

  await client.end();
}

main().catch(console.error);
