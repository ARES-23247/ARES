const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.resolve(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('src');
let count = 0;
files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const lines = content.split('\n');
  lines.forEach((l, i) => {
    if (/(<button|<a\s|<Link).*?className=[\"'][^\"']*?\bares-cut\b[\"'\s]/.test(l)) {
      console.log(f.substring(f.indexOf('src')) + ':' + (i + 1) + ': ' + l.trim());
      count++;
    }
  });
});
console.log('Total found:', count);
