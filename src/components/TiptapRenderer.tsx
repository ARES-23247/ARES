import React, { ReactNode, lazy, Suspense } from "react";

const CodePlayground = lazy(() => import('./CodePlayground').catch(() => ({ default: () => <div className="text-red-500">Failed to load CodePlayground</div> })));
const InteractiveTutorial = lazy(() => import('./InteractiveTutorial').catch(() => ({ default: () => <div className="text-red-500">Failed to load InteractiveTutorial</div> })));
const CoreValueCallout = lazy(() => import('./CoreValueCallout').catch(() => ({ default: () => <div className="text-red-500">Failed to load CoreValueCallout</div> })));
const ComponentMap: Record<string, React.LazyExoticComponent<any>> = {
  CodePlayground,
  InteractiveTutorial,
  CoreValueCallout,
  Mermaid: lazy(() => Promise.resolve({ default: () => <div className="p-4 border border-zinc-800 bg-zinc-900 rounded text-zinc-400 text-sm font-mono">[Mermaid Diagram]</div> })),
  HomeCoreValues: lazy(() => Promise.resolve({ default: () => <div className="p-4 border border-zinc-800 bg-zinc-900 rounded text-zinc-400 text-sm font-mono">[Core Values Component]</div> }))
};

export interface ASTMark { type: string; }
export interface ASTNode {
  type: string;
  text?: string;
  content?: ASTNode[];
  level?: number;
  marks?: ASTMark[];
  src?: string;
  alt?: string;
  attrs?: Record<string, string | number>;
}

export default function TiptapRenderer({ node }: { node: ASTNode }) {
  if (!node) return null;

  if (node.type === "text") {
    let text: ReactNode = node.text;
    if (node.marks) {
      node.marks.forEach((mark) => {
        if (mark.type === "bold") text = <strong key={typeof text === "string" ? text + "b" : "b"}>{text}</strong>;
        if (mark.type === "italic") text = <em key={typeof text === "string" ? text + "i" : "i"}>{text}</em>;
      });
    }
    return <>{text}</>;
  }

  const children = node.content ? node.content.map((c, i) => <TiptapRenderer key={i} node={c} />) : null;

  switch (node.type) {
    case "doc": return <>{children}</>;
    case "heading": {
      const level = node.attrs?.level || node.level || 1;
      const Tag = `h${level}` as keyof JSX.IntrinsicElements;
      return <Tag>{children}</Tag>;
    }
    case "paragraph": return <p>{children}</p>;
    case "bulletList": return <ul>{children}</ul>;
    case "orderedList": return <ol>{children}</ol>;
    case "listItem": return <li>{children}</li>;
    case "image": {
      const srcStr = (node.src || node.attrs?.src || "") as string;
      const altStr = (node.alt || node.attrs?.alt || "") as string;
      return (
        <figure className="my-8 rounded-xl overflow-hidden glass-card border border-white/5">
          <div className="relative w-full aspect-video">
            <img src={srcStr} alt={altStr} className="w-full h-full object-cover" />
          </div>
          {altStr && <figcaption className="text-center text-sm text-white/80 mt-2 p-2">{altStr}</figcaption>}
        </figure>
      );
    }
    case "interactiveComponent": {
      const componentName = node.attrs?.componentName as string;
      const Component = ComponentMap[componentName];
      if (Component) {
        return (
          <Suspense fallback={<div className="p-8 border border-zinc-800 bg-zinc-900 rounded animate-pulse text-center text-zinc-500">Loading interactive tool...</div>}>
            <Component className="my-8" />
          </Suspense>
        );
      }
      return (
        <div className="p-4 border border-red-500/50 bg-red-500/10 text-red-400 rounded my-8 font-mono text-sm">
          Unknown interactive component: {componentName}
        </div>
      );
    }
    default: return <>{children}</>;
  }
}
