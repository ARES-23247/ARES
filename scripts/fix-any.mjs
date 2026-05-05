import fs from 'fs';
import path from 'path';

function processDirectory(directory) {
  const files = fs.readdirSync(directory);
  
  for (const file of files) {
    const fullPath = path.join(directory, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Remove inline disable comments
      content = content.replace(/\/\*\s*eslint-disable\s+@typescript-eslint\/no-explicit-any\s*\*\//g, '');
      content = content.replace(/\/\/\s*eslint-disable-next-line\s+@typescript-eslint\/no-explicit-any.*/g, '');
      
      // Replace : any with : unknown
      content = content.replace(/:\s*any/g, ': unknown');
      
      // Replace as any with as unknown
      content = content.replace(/\bas\s+any\b/g, 'as unknown');
      
      // Replace <any> with <unknown>
      content = content.replace(/<any>/g, '<unknown>');
      
      fs.writeFileSync(fullPath, content);
    }
  }
}

console.log('Replacing any with unknown...');
processDirectory(path.join(process.cwd(), 'src'));
processDirectory(path.join(process.cwd(), 'functions'));
processDirectory(path.join(process.cwd(), 'shared'));
console.log('Done');
