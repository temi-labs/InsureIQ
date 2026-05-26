const fs = require('fs');
const path = require('path');

const walk = dir => {
  fs.readdirSync(dir).forEach(file => {
    const p = path.join(dir, file);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (p.endsWith('.tsx') || p.endsWith('.ts')) {
      let content = fs.readFileSync(p, 'utf8');
      content = content.replace(/\[#EC5E24\]/g, '[var(--color-primary)]');
      content = content.replace(/\[#d6511e\]/g, '[var(--color-primary-dark)]');
      content = content.replace(/\[#d4531e\]/g, '[var(--color-primary-dark)]');
      content = content.replace(/stroke="#EC5E24"/g, 'stroke="var(--color-primary)"');
      content = content.replace(/fill="#EC5E24"/g, 'fill="var(--color-primary)"');
      content = content.replace(/stopColor="#EC5E24"/g, 'stopColor="var(--color-primary)"');
      fs.writeFileSync(p, content);
    }
  });
};

walk('src');
