const fs = require('fs');
let c = fs.readFileSync('functions/api/routes/posts.ts', 'utf8');

c = c.replace(/([a-zA-Z0-9_]+):\s*async\s*\(\s*input\s*,\s*c\s*\)\s*=>\s*\{/g, '// @ts-ignore\n  $1: async (input, c) => {');

fs.writeFileSync('functions/api/routes/posts.ts', c);
