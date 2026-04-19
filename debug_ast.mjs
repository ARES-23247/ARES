import { marked } from 'marked';
import { generateJSON } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import fs from 'fs';

const data = JSON.parse(fs.readFileSync('trouble_sample.json', 'utf8'));
const results = Array.isArray(data) ? data[0].results : data.results;
const content = results[0].content;

if (content.trim().startsWith('{')) {
  console.log("Already JSON");
  // process JSON
} else {
  const html = marked.parse(content);
  const ast = generateJSON(html, [StarterKit, Image, Link]);
  fs.writeFileSync('debug_ast.json', JSON.stringify(ast, null, 2));
  console.log("AST written to debug_ast.json");
}
