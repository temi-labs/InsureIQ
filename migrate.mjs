import fs from 'fs';
import path from 'path';

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function moveSafe(oldPath, newPath) {
  if (fs.existsSync(oldPath)) {
    fs.renameSync(oldPath, newPath);
    console.log(`Moved ${oldPath} -> ${newPath}`);
  }
}

// 1. Create client and server folders
ensureDir('client');
ensureDir('server/data');

// 2. Move frontend React/Vite files into client/
moveSafe('src', 'client/src');
moveSafe('public', 'client/public');
moveSafe('index.html', 'client/index.html');
moveSafe('vite.config.ts', 'client/vite.config.ts');
moveSafe('tsconfig.json', 'client/tsconfig.json');

// 3. Move backend into server/
moveSafe('server.ts', 'server/server.ts');

// 4. Move db.json into server/data/
moveSafe('client/src/data/db.json', 'server/data/db.json');

console.log("Stage 1 file moves completed.");
