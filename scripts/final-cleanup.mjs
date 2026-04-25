import fs from 'fs';
import path from 'path';

function walkSync(dir, filelist) {
  let files = fs.readdirSync(dir);
  filelist = filelist || [];
  files.forEach(function(file) {
    if (fs.statSync(path.join(dir, file)).isDirectory()) {
      filelist = walkSync(path.join(dir, file), filelist);
    }
    else {
      filelist.push(path.join(dir, file));
    }
  });
  return filelist;
}

const routesDir = path.join(process.cwd(), 'functions/api/routes');
let files = walkSync(routesDir, []).filter(f => f.endsWith('.ts') && !f.endsWith('.test.ts'));

for (const filePath of files) {
  let content = fs.readFileSync(filePath, 'utf-8');

  fs.writeFileSync(filePath, content);
}

console.log("Processed " + files.length + " files.");
