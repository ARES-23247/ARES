import fs from 'fs';
import glob from 'glob';

// 1. Rename coverImageUrl to thumbnail
const filesToRenameCoverImage = glob.sync('{src,functions,shared}/**/*.{ts,tsx}');

filesToRenameCoverImage.forEach(file => {
  if (file.includes('socialSync.test.ts') || file.includes('socialSync.ts') || file.includes('bluesky.ts') || file.includes('webhooks.ts') || file.includes('events/handlers.ts')) {
    // Keep coverImageUrl for socialSync payloads if desired, but we can change it everywhere for consistency
    // Actually socialSync uses coverImageUrl in its type `SocialDispatchPayload`. Let's change it there too for consistency.
  }
  let content = fs.readFileSync(file, 'utf8');
  const original = content;
  content = content.replace(/coverImageUrl/g, 'thumbnail');
  
  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Renamed coverImageUrl to thumbnail in ${file}`);
  }
});

// 2. Standardize season_id as INTEGER in Zod schemas
const schemaFiles = glob.sync('shared/schemas/**/*Contract.ts').concat(glob.sync('shared/schemas/*Schema.ts'));

schemaFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;
  
  // Zod schemas might have seasonId: z.string().max(255).optional(), let's change to z.coerce.number().optional()
  content = content.replace(/seasonId: z\.string\(\)\.max\(255\)\.optional\(\)/g, 'seasonId: z.coerce.number().optional()');
  
  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Standardized seasonId as number in ${file}`);
  }
});

// 3. Dynamic Authorship in posts.ts
const postsTs = 'functions/api/routes/posts.ts';
if (fs.existsSync(postsTs)) {
  let content = fs.readFileSync(postsTs, 'utf8');
  const original = content;

  // Replace `author: "ARES Team"` with dynamic author attribution
  // In savePost:
  // email is user?.email || "anonymous_dashboard_user"
  // Let's use user?.name or user?.nickname or "ARES Team"
  // Wait, `getSessionUser(c)` returns `sessionUser` from middleware
  content = content.replace(
    /author: "ARES Team"/g,
    'author: user?.name || "ARES Team"'
  );

  if (content !== original) {
    fs.writeFileSync(postsTs, content, 'utf8');
    console.log(`Implemented dynamic authorship in ${postsTs}`);
  }
}
