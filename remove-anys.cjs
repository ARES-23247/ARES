const fs = require('fs');
const glob = require('glob');

const files = glob.sync('functions/api/routes/**/*.ts');

for (const file of files) {
  let c = fs.readFileSync(file, 'utf8');
  
  c = c.replace(/\(\s*input\s*:\s*any\s*,\s*c\s*:\s*any\s*\)/g, '(input, c)');
  c = c.replace(/\(\s*_input\s*:\s*any\s*,\s*c\s*:\s*any\s*\)/g, '(_input, c)');
  c = c.replace(/\(\s*input\s*:\s*any\s*,\s*c\s*:\s*HonoContext\s*\)/g, '(input, c: HonoContext)');
  c = c.replace(/\(\s*_input\s*:\s*any\s*,\s*c\s*:\s*HonoContext\s*\)/g, '(_input, c: HonoContext)');
  
  // Also fix the ones without 'c' type
  c = c.replace(/\(\s*input\s*:\s*any\s*,\s*c\s*\)/g, '(input, c)');
  c = c.replace(/\(\s*_input\s*:\s*any\s*,\s*c\s*\)/g, '(_input, c)');

  // Fix object types cast to `as any` that we added
  c = c.replace(/as any\s*\)/g, ')');
  c = c.replace(/,\s*([A-Za-z0-9_]+)\s*as any/g, ', $1');

  fs.writeFileSync(file, c);
}
