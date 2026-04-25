/**
 * Frontend AST text extraction utility.
 * Extracts plain text from Tiptap ProseMirror AST nodes for SEO meta descriptions.
 */

interface ASTNode {
  type: string;
  text?: string;
  content?: ASTNode[];
}

/**
 * Recursively extracts plain text from a Tiptap ProseMirror AST node.
 * Used for generating SEO meta description snippets from rich-text content.
 */
export function extractTextFromAst(node: ASTNode | string | null): string {
  if (!node) return "";
  if (typeof node === "string") {
    try {
      const parsed = JSON.parse(node) as ASTNode;
      return extractTextFromAst(parsed);
    } catch {
      return node;
    }
  }
  if (node.text) return node.text;
  if (node.content) {
    return node.content.map(extractTextFromAst).join(" ");
  }
  return "";
}
