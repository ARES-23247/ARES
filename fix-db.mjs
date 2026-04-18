import fs from "fs";
import path from "path";

const SOURCE_DIR = "C:\\Users\\david\\dev\\robotics\\frc\\MARSLib\\website\\src\\content\\docs\\troubleshooting";
const OUTPUT_FILE = "C:\\Users\\david\\dev\\robotics\\ftc\\ARESWEB\\fix-docs.sql";

const files = fs.readdirSync(SOURCE_DIR).filter(f => f.endsWith(".mdx") || f.endsWith(".md"));

let sqlList = [];

for (const file of files) {
  const content = fs.readFileSync(path.join(SOURCE_DIR, file), "utf8");
  
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

  // FTC Context Replacement
  markdownBody = markdownBody
    .replace(/RoboRIO/g, "Control Hub")
    .replace(/RioLog/g, "FTC Dashboard Log")
    .replace(/Driver Station/g, "Driver Station App")
    .replace(/Phoenix Positioner/g, "REV Hardware Client")
    .replace(/CAN Bus/g, "I2C/RS485 Bus")
    .replace(/WPILib/g, "FTC SDK")
    .replace(/XboxController/g, "Gamepad")
    .replace(/CAN errors/g, "I2C errors")
    .replace(/CAN bus/g, "I2C bus")
    .replace(/`\.(\/gradlew build)`/g, "`./gradlew assembleDebug`")
    .replace(/`\.(\/gradlew deploy)`/g, "`adb install -r ...`");

  // Determine Slug
  const slug = "troubleshooting-" + file.replace(/\.mdx?$/, "").replace(/\//g, "-").toLowerCase();

  // Create SQL UPDATE
  const safeTitle = title.replace(/'/g, "''");
  const safeDesc = description.replace(/'/g, "''");
  const safeContent = markdownBody.replace(/'/g, "''");

  const sql = `UPDATE docs SET title = '${safeTitle}', description = '${safeDesc}', content = '${safeContent}' WHERE slug = '${slug}';`;
  sqlList.push(sql);
}

fs.writeFileSync(OUTPUT_FILE, sqlList.join("\n\n"));
console.log(`Generated ${sqlList.length} SQL UPDATE statements into ${OUTPUT_FILE}`);
