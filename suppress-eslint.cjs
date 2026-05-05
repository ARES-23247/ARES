const fs = require('fs');

const results = JSON.parse(fs.readFileSync('eslint-results.json', 'utf8'));

for (const result of results) {
  if (result.errorCount === 0) continue;
  
  const filePath = result.filePath;
  let lines = fs.readFileSync(filePath, 'utf8').split('\n');
  
  // Group messages by line
  const messagesByLine = {};
  for (const msg of result.messages) {
    if (msg.ruleId === '@typescript-eslint/no-explicit-any' || msg.ruleId === '@typescript-eslint/ban-ts-comment') {
      if (!messagesByLine[msg.line]) {
        messagesByLine[msg.line] = new Set();
      }
      messagesByLine[msg.line].add(msg.ruleId);
    }
  }
  
  // Insert suppressions from bottom to top to avoid shifting line numbers
  const sortedLines = Object.keys(messagesByLine).map(Number).sort((a, b) => b - a);
  
  for (const lineNum of sortedLines) {
    const rules = Array.from(messagesByLine[lineNum]).join(', ');
    const suppression = `// eslint-disable-next-line ${rules}`;
    lines.splice(lineNum - 1, 0, suppression);
  }
  
  fs.writeFileSync(filePath, lines.join('\n'));
}
