import { execSync } from 'child_process';
import { readdirSync, statSync, existsSync } from 'fs';
import { join } from 'path';

const d1Dir = join('.wrangler', 'state', 'v3', 'd1', 'miniflare-D1DatabaseObject');

if (!existsSync(d1Dir)) {
  console.error("Wrangler D1 local database directory not found.");
  console.error("Please run 'npm run db:setup:local' first to generate the local schema.");
  process.exit(1);
}

const files = readdirSync(d1Dir)
  .filter(file => file.endsWith('.sqlite'))
  .map(file => ({
    name: file,
    time: statSync(join(d1Dir, file)).mtime.getTime()
  }))
  .sort((a, b) => b.time - a.time);

if (files.length === 0) {
  console.error("No .sqlite database found in " + d1Dir);
  process.exit(1);
}

const latestDb = join(d1Dir, files[0].name);
console.log(`Using database: ${latestDb}`);

try {
  // Use npx so it uses the local kysely-codegen
  execSync(`npx kysely-codegen --dialect sqlite --url "${latestDb}" --out-file src/schemas/database.ts`, { stdio: 'inherit' });
  
  // Replace Buffer with Uint8Array since Cloudflare Workers use standard web APIs
  const { readFileSync, writeFileSync } = await import('fs');
  const typeFile = join(process.cwd(), 'src/schemas/database.ts');
  let typeContent = readFileSync(typeFile, 'utf8');
  typeContent = typeContent.replace(/\bBuffer\b/g, 'Uint8Array');
  writeFileSync(typeFile, typeContent, 'utf8');

  console.log("Successfully generated src/schemas/database.ts");
} catch (error) {
  console.error("Failed to run kysely-codegen.", error);
  process.exit(1);
}
