const fs = require('fs');
const raw = fs.readFileSync('test-results.json', 'utf16le');
const jsonStr = raw.substring(raw.indexOf('{'), raw.lastIndexOf('}') + 1);
const data = JSON.parse(jsonStr);
const failedFiles = data.testResults.filter(t => t.status === 'failed');
console.log('FAILED TEST FILES:');
failedFiles.forEach(f => {
  console.log('--- ' + f.name + ' ---');
  f.assertionResults.filter(a => a.status === 'failed').forEach(a => {
    console.log('TEST:', a.title);
    console.log('ERR:', a.failureMessages[0].split('\n')[0]);
  });
});
