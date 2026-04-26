import fs from 'fs';
import path from 'path';

const d = path.join('shared', 'schemas', 'contracts');
const files = fs.readdirSync(d).filter(f => f.endsWith('.ts'));

for (const f of files) {
  let content = fs.readFileSync(path.join(d, f), 'utf8');
  content = content.replace(/body:\s*z\.any\(\)\.optional\(\),/g, 'body: c.noBody(),');
  fs.writeFileSync(path.join(d, f), content);
}
console.log('Replaced z.any().optional() with c.noBody()');
