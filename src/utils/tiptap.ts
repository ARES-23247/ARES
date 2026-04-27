/**
 * Shared utility for parsing Tiptap AST (JSON) into plain text.
 */
export function extractAstText(jsonStr: string | undefined | null): string {
  if (!jsonStr) return "";
  
  try {
    // If it's not a JSON string, return as-is
    if (!jsonStr.trim().startsWith('{') && !jsonStr.trim().startsWith('[')) {
      return jsonStr;
    }

    const ast = JSON.parse(jsonStr);
    
    // Handle Tiptap "doc" structure
    if (ast && ast.type === "doc") {
      interface AstNode {
        text?: string;
        content?: AstNode[];
      }
      const extract = (node: AstNode): string => {
        if (node.text) return node.text;
        if (node.content) return node.content.map(extract).join(" ");
        return "";
      };
      return extract(ast).trim();
    }
    
    return jsonStr;
  } catch {
    return jsonStr;
  }
}
