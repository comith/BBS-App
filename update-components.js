const fs = require('fs');
const path = require('path');

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            processDir(filePath);
        } else if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
            let content = fs.readFileSync(filePath, 'utf8');
            let modified = false;

            if (content.match(/fetch\((['"`]\/api\/)/)) {
                content = content.replace(/fetch\((['"`]\/api\/[^)]+)\)/g, 'apiFetch($1)');
                content = content.replace(/fetch\((['"`]\/api\/)/g, 'apiFetch($1');
                
                if (!content.includes('import { apiFetch }')) {
                    if (content.includes('import ')) {
                        content = content.replace(/(import .*?;?\n)/, '$1import { apiFetch } from "@/lib/api-fetch";\n');
                    } else {
                        content = 'import { apiFetch } from "@/lib/api-fetch";\n' + content;
                    }
                }
                modified = true;
            }

            if (modified) {
                fs.writeFileSync(filePath, content, 'utf8');
                console.log('Updated', filePath);
            }
        }
    }
}

processDir('./components');
