import React, { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import DocsMarkdownRenderer from '../components/docs/DocsMarkdownRenderer';
import TiptapRenderer, { type ASTNode } from '../components/TiptapRenderer';
import { api } from '../api/client';

export default function MathCornerLesson() {
  const { id } = useParams<{ id: string }>();
  const { data: docRes, isLoading } = api.docs.getDoc.useQuery(
    ["doc", id],
    { params: { slug: id || "" } },
    { enabled: !!id }
  );

  const doc = docRes?.status === 200 ? docRes.body.doc : null;

  // Detect if content is JSON AST or markdown
  const parsedAst = useMemo(() => {
    if (!doc?.content) return null;
    try {
      const parsed = JSON.parse(doc.content);
      // Check if it has the AST structure
      if (parsed && typeof parsed === 'object' && 'type' in parsed && parsed.type === 'doc') {
        return parsed as ASTNode;
      }
    } catch {
      // Not JSON, fall back to markdown
    }
    return null;
  }, [doc?.content]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!doc || doc.display_in_math_corner !== 1) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white px-4">
        <h1 className="text-4xl font-bold mb-4">Lesson Not Found</h1>
        <p className="text-slate-400 mb-8">The lesson you are looking for does not exist.</p>
        <Link to="/math-corner" className="px-6 py-2 bg-purple-600 rounded-md hover:bg-purple-700 transition-colors">
          Return to Math Corner
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <Link 
          to="/math-corner" 
          className="text-slate-400 hover:text-white transition-colors flex items-center text-sm font-medium"
        >
          <span className="mr-2">←</span> Back to Library
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-4">{doc.title}</h1>
          {doc.description && (
            <p className="text-lg text-slate-400 border-b border-slate-800 pb-8">{doc.description}</p>
          )}
        </div>

        <div className="ares-docs-content">
          {parsedAst ? (
            <TiptapRenderer node={parsedAst} />
          ) : (
            <DocsMarkdownRenderer content={doc.content || ""} />
          )}
        </div>
      </motion.div>
    </div>
  );
}
