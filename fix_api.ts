import fs from 'fs';
import path from 'path';

const API_FILE = 'src/utils/api.ts';
const apiContent = `const API_URL = import.meta.env.VITE_API_URL || '';

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const path = endpoint.startsWith('/') ? endpoint : \`/\${endpoint}\`;
  const url = \`\${API_URL}\${path}\`;
  
  const method = options.method || 'GET';
  
  console.log(\`[API Request] \${method} \${url}\`);
  if (options.body) {
    try {
      console.log(\`[API Payload]\`, JSON.parse(options.body as string));
    } catch {
      console.log(\`[API Payload]\`, options.body);
    }
  }

  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      console.error(\`[API Error] \${method} \${url} returned \${response.status}\`);
    } else {
      console.log(\`[API Success] \${method} \${url} returned \${response.status}\`);
    }
    return response;
  } catch (err) {
    console.error(\`[API Failed] \${method} \${url}\`, err);
    throw err;
  }
}
`;

fs.mkdirSync(path.dirname(API_FILE), { recursive: true });
fs.writeFileSync(API_FILE, apiContent);

function walkSync(dir: string, filelist: string[] = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filepath = path.join(dir, file);
    if (fs.statSync(filepath).isDirectory()) {
      if (file !== 'node_modules' && file !== 'dist') {
        filelist = walkSync(filepath, filelist);
      }
    } else {
      if (filepath.endsWith('.ts') || filepath.endsWith('.tsx')) {
        filelist.push(filepath);
      }
    }
  }
  return filelist;
}

const files = walkSync('src');

for (const file of files) {
  if (file === API_FILE) continue;
  
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('fetch(')) {
    // Determine relative path to api.ts
    const depth = file.split('/').length - 2; // src/pages/Login.tsx -> 3 - 2 = 1
    let relPath = '';
    if (depth === 0) relPath = './utils/api';
    else if (depth === 1) relPath = '../utils/api';
    else if (depth === 2) relPath = '../../utils/api';
    else if (depth === 3) relPath = '../../../utils/api';
    
    // Check if import is already there
    if (!content.includes('import { apiFetch }')) {
      content = `import { apiFetch } from '${relPath}';\n` + content;
    }
    
    // Replace fetch('/api and fetch(`/api
    // Wait, some might just be fetch(url), etc. Let's globally replace fetch( with apiFetch(
    // where fetch takes a path starting with '\/' or '\`\/'
    content = content.replace(/fetch\s*\(\s*['"]\/api/g, "apiFetch('/api");
    content = content.replace(/fetch\s*\(\s*`\/api/g, "apiFetch(`/api");
    
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
  }
}
