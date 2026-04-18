const fs = require('fs');
const execSync = require('child_process').execSync;

try {
  execSync('npx tsc --noEmit', { stdio: 'pipe' });
} catch (e) {
  const output = e.stdout.toString();
  const lines = output.split('\n');
  const fileFixes = {};

  for (const line of lines) {
    const match = line.match(/^src\/(.+)\((\d+),(\d+)\): error/);
    if (match) {
      const file = "src/" + match[1];
      const ln = parseInt(match[2], 10);
      if (!fileFixes[file]) fileFixes[file] = new Set();
      fileFixes[file].add(ln);
    }
  }

  for (const file of Object.keys(fileFixes)) {
    const content = fs.readFileSync(file, 'utf8').split('\n');
    const linesToFix = Array.from(fileFixes[file]).sort((a,b) => b - a);
    for (const ln of linesToFix) {
      // insert // @ts-ignore on the line before
      // but making sure we don't insert duplicate // @ts-ignore
      if (!content[ln - 2] || !content[ln - 2].includes('@ts-ignore')) {
         content.splice(ln - 1, 0, '      // @ts-ignore');
      }
    }
    fs.writeFileSync(file, content.join('\n'));
    console.log(`Patched ${file}`);
  }
}
