import fs from 'fs';
import path from 'path';

function migrateAST(content) {
  let ast;
  try {
    ast = typeof content === 'string' ? JSON.parse(content) : content;
  } catch (e) {
    console.error("Failed to parse AST", e);
    return content;
  }

  if (ast.type !== 'doc' || !Array.isArray(ast.content)) {
    return content;
  }

  const newContent = [];
  let i = 0;
  const oldContent = ast.content;

  while (i < oldContent.length) {
    const node = oldContent[i];

    // Check if this node is a "Show Answer" paragraph
    const isShowAnswer = node.type === 'paragraph' && 
                         node.content?.length === 1 && 
                         node.content[0].text === 'Show Answer';

    if (isShowAnswer) {
      const revealNodes = [];
      i++; // skip "Show Answer"
      
      // Collect nodes until next horizontalRule or end of doc
      while (i < oldContent.length && oldContent[i].type !== 'horizontalRule') {
        revealNodes.push(oldContent[i]);
        i++;
      }

      newContent.push({
        type: 'reveal',
        attrs: { summary: 'Show Answer' },
        content: revealNodes
      });

      // Keep the horizontalRule if we found one
      if (i < oldContent.length && oldContent[i].type === 'horizontalRule') {
        newContent.push(oldContent[i]);
        i++;
      }
    } else {
      newContent.push(node);
      i++;
    }
  }

  return JSON.stringify({ ...ast, content: newContent });
}

// Dry run on the extracted content
const quizFile = 'c:\\Users\\david\\dev\\robotics\\ftc\\ARESWEB\\quiz_content_utf8.json';
const rawData = fs.readFileSync(quizFile, 'utf8');

// The file contains "INSERT INTO docs VALUES(..., 'JSON_HERE', ...);"
// We need to extract the JSON part carefully
const jsonMatch = rawData.match(/'(\{.*\})'/);
if (jsonMatch) {
  const originalJson = jsonMatch[1].replace(/''''/g, "'"); // unescape SQL single quotes
  const migratedJson = migrateAST(originalJson);
  
  // Create a SQL update script
  const sqlUpdate = `UPDATE docs SET content = '${migratedJson.replace(/'/g, "''")}' WHERE slug = 'interactive-java-basics-quiz';`;
  fs.writeFileSync('migrate_quiz.sql', sqlUpdate);
  console.log("Migration SQL generated in migrate_quiz.sql");
} else {
  console.error("Could not find JSON content in the provided file.");
}
