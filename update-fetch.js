const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const filesStr = execSync('find /home/computer/BBS-App/app -name "*.ts" -o -name "*.tsx"').toString();
const files = filesStr.split('\n').filter(Boolean);

let updatedCount = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf-8');
  
  // Exclude api-fetch itself and api routes backend files
  if (file.includes('/api/')) continue;

  // We want to replace fetch("/api/...") with apiFetch("/api/...")
  // Only where it actually uses fetch for /api
  if (content.includes('fetch("/api/') || content.includes("fetch('/api/") || content.includes('fetch(`/api/')) {
    
    // Check if we already imported apiFetch
    if (!content.includes('import { apiFetch } from "@/lib/api-fetch"')) {
       // Insert after the first import or at the top
       if (content.includes('import ')) {
           content = content.replace(/(import .*?;?\n)/, '$1import { apiFetch } from "@/lib/api-fetch";\n');
       } else {
           content = 'import { apiFetch } from "@/lib/api-fetch";\n' + content;
       }
    }

    content = content.replace(/fetch\((['"`]\/api\/[^)]+)\)/g, 'apiFetch($1)');
    content = content.replace(/fetch\((['"`]\/api\/)/g, 'apiFetch($1');

    fs.writeFileSync(file, content, 'utf-8');
    console.log(`Updated ${file}`);
    updatedCount++;
  }
}

console.log(`Updated ${updatedCount} files.`);
