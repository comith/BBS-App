const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const emps = await prisma.employee.findMany({
        where: { employeerId: { startsWith: '2EN' } }
    });
    console.log("Count:", emps.length);
    if (emps.length > 0) {
        console.log(JSON.stringify(emps.slice(0, 5), null, 2));
        
        // Also check if any of these have multiple groups separated by commas
        const multipleGroups = emps.filter(e => e.group && e.group.includes(','));
        console.log("Employees with multiple groups count:", multipleGroups.length);
        if (multipleGroups.length > 0) {
            console.log("Example:", multipleGroups[0]);
        }
    }
}

main().catch(console.error);
