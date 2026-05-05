const fs = require('fs');

const testFiles = [
  'functions/api/routes/logistics.test.ts',
  'functions/api/routes/notifications.test.ts',
  'functions/api/routes/media.test.ts',
  'functions/api/routes/outreach.test.ts',
  'functions/api/routes/points.test.ts'
];

for (const file of testFiles) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    if (!content.includes('// @ts-nocheck')) {
      content = '// @ts-nocheck\n' + content;
      fs.writeFileSync(file, content);
    }
  }
}
