const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

let lintOutput = '';
try {
  lintOutput = execSync('npx eslint . --ext ts,tsx --format json', { encoding: 'utf8' });
} catch (e) {
  lintOutput = e.stdout;
}

const lintResults = JSON.parse(lintOutput);

for (const result of lintResults) {
  if (result.messages.length === 0) continue;
  
  let content = fs.readFileSync(result.filePath, 'utf8');
  let lines = content.split('\n');
  let changed = false;

  result.messages.sort((a, b) => b.line - a.line);

  for (const msg of result.messages) {
    const lineIdx = msg.line - 1;
    let line = lines[lineIdx];
    
    if (msg.ruleId === '@typescript-eslint/no-unused-vars') {
      const match = msg.message.match(/'([^']+)'/);
      if (match) {
        const name = match[1];
        if (name === 'React') {
          line = line.replace(/React,\s*/, '').replace(/React\s*,/, '').replace(/React\s*/, '').replace(/\{\s*\}/, '').replace(/import\s+from\s+['"]react['"];?/i, '');
          if (line.trim() === "import  from 'react';") line = '';
          if (line.trim() === "import { } from 'react';") line = '';
          lines[lineIdx] = line;
          changed = true;
        } else if (line.includes(name)) {
          if (line.includes(`{ ${name} }`)) {
            line = line.replace(`{ ${name} }`, '');
          } else if (line.includes(` ${name},`)) {
            line = line.replace(` ${name},`, '');
          } else if (line.includes(`, ${name}`)) {
            line = line.replace(`, ${name}`, '');
          }
          lines[lineIdx] = line;
          changed = true;
        }
      }
    } else if (msg.ruleId === '@typescript-eslint/no-explicit-any') {
      line = line.replace(/\bany\b/g, 'unknown');
      lines[lineIdx] = line;
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(result.filePath, lines.join('\n'), 'utf8');
    console.log('Fixed', result.filePath);
  }
}
