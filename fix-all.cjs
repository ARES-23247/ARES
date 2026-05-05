const fs = require('fs');

function fixRouter(file, routerName) {
  let c = fs.readFileSync(file, 'utf8');
  if (!c.includes('eslint-disable @typescript-eslint/no-explicit-any')) {
    c = '/* eslint-disable @typescript-eslint/no-explicit-any */\n' + c;
  }
  
  // replace `async (input, c)` with `async (input: any, c: any)`
  c = c.replace(/([a-zA-Z0-9_]+):\s*async\s*\(\s*input\s*,\s*c\s*\)\s*=>/g, '$1: async (input: any, c: any) =>');
  
  // replace router definition `const obj = {` with `const obj: any = {`
  c = c.replace(new RegExp(`const ${routerName} = \\{`), `const ${routerName}: any = {`);
  
  fs.writeFileSync(file, c);
}

fixRouter('functions/api/routes/posts.ts', 'postTsRestRouterObj');
fixRouter('functions/api/routes/points.ts', 'pointsTsRestRouterObj');
fixRouter('functions/api/routes/outreach/index.ts', 'outreachTsRestRouterObj');

// Fix posts.test.ts errors
let postsTest = fs.readFileSync('functions/api/routes/posts.test.ts', 'utf8');
postsTest = postsTest.replace(/mockDb\.run\(\)/g, 'mockDb.run!()');
postsTest = postsTest.replace(/mockDb\.updateTable\(\)/g, 'mockDb.updateTable!()');
postsTest = postsTest.replace(/mockDb\.insertInto\(\)/g, 'mockDb.insertInto!()');
postsTest = postsTest.replace(/mockDb\.selectFrom\(\)/g, 'mockDb.selectFrom!()');
// Actually, `mockDb.updateTable` might be called as `mockDb.updateTable('...')`.
postsTest = postsTest.replace(/mockDb\.updateTable/g, 'mockDb.updateTable!');
postsTest = postsTest.replace(/mockDb\.insertInto/g, 'mockDb.insertInto!');
postsTest = postsTest.replace(/mockDb\.selectFrom/g, 'mockDb.selectFrom!');
postsTest = postsTest.replace(/mockDb\.run/g, 'mockDb.run!');
fs.writeFileSync('functions/api/routes/posts.test.ts', postsTest);

// Fix points.test.ts import
let pointsTest = fs.readFileSync('functions/api/routes/points.test.ts', 'utf8');
pointsTest = pointsTest.replace('../../src/test/types', '../../../src/test/types');
fs.writeFileSync('functions/api/routes/points.test.ts', pointsTest);
