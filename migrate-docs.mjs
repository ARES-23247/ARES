import fs from "fs";
import path from "path";

const SOURCE_DIR = "C:\\Users\\david\\dev\\robotics\\ftc\\ARESLib\\website\\src\\content\\docs";
const OUTPUT_FILE = "C:\\Users\\david\\dev\\robotics\\ftc\\ARESWEB\\docs-seed.sql";

const categoryMap = {
  "hardware-abstraction": "Foundation Track",
  "swerve-kinematics": "Precision Track",
  "championship-testing": "Reliability Track",
  "power-management": "Reliability Track",
  "standards": "The ARESLib Standard",
  "guides": "Getting Started",
  "reference": "Reference"
};

function getFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const file of list) {
    const fullPath = path.resolve(dir, file.name);
    if (file.isDirectory()) {
      results = results.concat(getFiles(fullPath));
    } else if (fullPath.endsWith(".mdx") || fullPath.endsWith(".md")) {
      results.push(fullPath);
    }
  }
  return results;
}

const files = getFiles(SOURCE_DIR);
let sqlList = [];

let sortOrder = 10;

for (const file of files) {
  // Skip index splash page
  if (file.endsWith("index.mdx")) continue;

  const content = fs.readFileSync(file, "utf8");
  
  // Parse Frontmatter
  let title = "Untitled";
  let description = "";
  
  const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
  const match = content.match(frontmatterRegex);
  
  let markdownBody = content;
  
  if (match) {
    const vm = match[1];
    const titleMatch = vm.match(/^title:\s*(.*)$/m);
    if (titleMatch) title = titleMatch[1].replace(/['"]/g, "").trim();
    
    const descMatch = vm.match(/^description:\s*(.*)$/m);
    if (descMatch) description = descMatch[1].replace(/['"]/g, "").trim();
    
    // Strip frontmatter and Astro imports from body
    markdownBody = content.replace(frontmatterRegex, "").trim();
    markdownBody = markdownBody.replace(/import {.*} from '@astrojs\/starlight\/components';/g, "").trim();
  }

  // Determine Slug
  const relativePath = path.relative(SOURCE_DIR, file).replace(/\\/g, "/");
  const slug = relativePath.replace(/\.mdx?$/, "").replace(/\//g, "-").toLowerCase();

  // Determine Category based on folder path
  let category = "General";
  const parentFolder = path.basename(path.dirname(file));
  
  if (categoryMap[parentFolder]) {
    category = categoryMap[parentFolder];
  } else if (relativePath.startsWith("tutorials")) {
    category = "Tutorials"; 
  } else if (relativePath.includes("guides")) {
    category = "Guides";
  }

  // Create SQL INSERT
  // Escape single quotes by doubling them
  const safeSlug = slug.replace(/'/g, "''");
  const safeTitle = title.replace(/'/g, "''");
  const safeCat = category.replace(/'/g, "''");
  const safeDesc = description.replace(/'/g, "''");
  const safeContent = markdownBody.replace(/'/g, "''");

  const sql = `INSERT INTO docs (slug, title, category, sort_order, description, content) VALUES ('${safeSlug}', '${safeTitle}', '${safeCat}', ${sortOrder++}, '${safeDesc}', '${safeContent}');`;
  sqlList.push(sql);
}

fs.writeFileSync(OUTPUT_FILE, sqlList.join("\n\n"));
console.log(`Generated ${sqlList.length} SQL INSERT statements into ${OUTPUT_FILE}`);
