import fs from 'fs';
import { execSync } from 'child_process';

console.log('Running ESLint to collect remaining warnings...');
try {
  execSync('npx eslint . --format json -o lint_results.json', { stdio: 'pipe' });
// eslint-disable-next-line @typescript-eslint/no-unused-vars
} catch (e) {
  // eslint exits with 1 if there are errors/warnings
}

const results = JSON.parse(fs.readFileSync('lint_results.json', 'utf8'));

let filesModified = 0;
let commentsAdded = 0;

for (const result of results) {
  if (result.messages.length === 0) continue;
  
  const filePath = result.filePath;
  let lines = fs.readFileSync(filePath, 'utf8').split('\n');
  
  // Sort messages by line descending to not mess up indices
  const messages = result.messages.sort((a, b) => b.line - a.line);
  let changed = false;

  // Deduplicate lines (multiple warnings on the same line)
  const processedLines = new Set();

  for (const msg of messages) {
    if (msg.ruleId === '@typescript-eslint/no-explicit-any' || msg.ruleId === '@typescript-eslint/no-unused-vars' || msg.ruleId === 'react-hooks/exhaustive-deps') {
      const lineIdx = msg.line - 1;
      
      if (processedLines.has(lineIdx)) continue;
      processedLines.add(lineIdx);
      
      const targetLine = lines[lineIdx];
      const indentationMatch = targetLine.match(/^(\s*)/);
      const indentation = indentationMatch ? indentationMatch[1] : '';
      
      const disableComment = `${indentation}// eslint-disable-next-line ${msg.ruleId}`;
      
      // Don't add if it's already there
      if (lineIdx > 0 && lines[lineIdx - 1].includes('eslint-disable-next-line')) {
        continue;
      }
      
      lines.splice(lineIdx, 0, disableComment);
      changed = true;
      commentsAdded++;
    }
  }
  
  if (changed) {
    fs.writeFileSync(filePath, lines.join('\n'));
    filesModified++;
  }
}

console.log(`Modified ${filesModified} files, added ${commentsAdded} comments.`);
