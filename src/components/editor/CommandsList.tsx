import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Editor, Range } from '@tiptap/core';
import { Heading1, Heading2, List, ListTodo, Quote, Code, Table, Info, AlertTriangle, Lightbulb, Workflow, TerminalSquare, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

interface CommandItem {
  title: string;
  description: string;
  icon: React.ReactNode;
  command: (props: { editor: Editor, range: Range }) => void;
}

interface CommandsListProps {
  editor: Editor;
  range: Range;
  items: CommandItem[];
}

export interface CommandsListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

export const CommandsList = forwardRef<CommandsListRef, CommandsListProps>((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const items: CommandItem[] = [
    {
      title: 'Heading 1',
      description: 'Big section heading',
      icon: <Heading1 size={18} />,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run();
      },
    },
    {
      title: 'Heading 2',
      description: 'Medium section heading',
      icon: <Heading2 size={18} />,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run();
      },
    },
    {
      title: 'Bullet List',
      description: 'Create a simple bullet list',
      icon: <List size={18} />,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleBulletList().run();
      },
    },
    {
      title: 'Task List',
      description: 'Track tasks with checkboxes',
      icon: <ListTodo size={18} />,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleTaskList().run();
      },
    },
    {
      title: 'Quote',
      description: 'Capture a quote',
      icon: <Quote size={18} />,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleBlockquote().run();
      },
    },
    {
      title: 'Code Block',
      description: 'Syntax highlighted code',
      icon: <Code size={18} />,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
      },
    },
    {
      title: 'Mermaid Diagram',
      description: 'Live architecture diagram tool',
      icon: <Workflow size={18} className="text-ares-cyan" />,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setNode('mermaidBlock', { language: 'mermaid' }).run();
      },
    },
    {
      title: 'Interactive Simulator',
      description: 'Inject a React simulator block',
      icon: <TerminalSquare size={18} className="text-ares-red" />,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).run();
        window.dispatchEvent(new CustomEvent('open-sim-picker'));
      },
    },
    {
      title: 'Info Callout',
      description: 'Blue information box',
      icon: <Info size={18} className="text-ares-cyan" />,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setCallout({ type: 'info' }).run();
      },
    },
    {
      title: 'Warning Callout',
      description: 'Red warning box',
      icon: <AlertTriangle size={18} className="text-ares-red" />,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setCallout({ type: 'warning' }).run();
      },
    },
    {
      title: 'Tip Callout',
      description: 'Gold tip box',
      icon: <Lightbulb size={18} className="text-ares-gold" />,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setCallout({ type: 'tip' }).run();
      },
    },
    {
      title: 'Table',
      description: 'Insert a 3x3 table',
      icon: <Table size={18} />,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
      },
    },
    {
      title: 'Table of Contents',
      description: 'Generate list of headings',
      icon: <BookOpen size={18} className="text-ares-gold" />,
      command: ({ editor, range }) => {
        const headings: { level: number, text: string, id: string }[] = [];
        editor.state.doc.descendants((node) => {
          if (node.type.name === 'heading') {
            const level = node.attrs.level;
            if (level === 2 || level === 3) {
              const text = node.textContent;
              const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
              headings.push({ level, text, id });
            }
          }
        });

        editor.chain().focus().deleteRange(range).run();
        
        if (headings.length === 0) {
          toast.error("No H2 or H3 headings found in document.");
          return;
        }

        let html = '<ul>';
        headings.forEach(h => {
          if (h.level === 3) {
            html += `<li><ul><li><a href="#${h.id}">${h.text}</a></li></ul></li>`;
          } else {
            html += `<li><a href="#${h.id}">${h.text}</a></li>`;
          }
        });
        html += '</ul><p></p>';
        editor.chain().focus().insertContent(html).run();
      },
    },
  ];

  const selectItem = (index: number) => {
    const item = items[index];
    if (item) {
      item.command({ editor: props.editor, range: props.range });
    }
  };

  useEffect(() => {
    setSelectedIndex(0);
  }, [props.items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === 'ArrowUp') {
        setSelectedIndex((selectedIndex + items.length - 1) % items.length);
        return true;
      }
      if (event.key === 'ArrowDown') {
        setSelectedIndex((selectedIndex + 1) % items.length);
        return true;
      }
      if (event.key === 'Enter') {
        selectItem(selectedIndex);
        return true;
      }
      return false;
    },
  }));

  return (
    <div className="bg-obsidian border border-white/10 ares-cut-sm shadow-2xl overflow-hidden min-w-[280px] backdrop-blur-xl animate-in fade-in zoom-in duration-200">
      <div className="p-2 border-b border-white/10">
        <span className="text-xs font-bold text-marble/40 uppercase tracking-widest px-2">Commands</span>
      </div>
      <div className="max-h-[320px] overflow-y-auto p-1 custom-scrollbar">
        {items.map((item, index) => (
          <button
            key={index}
            onClick={() => selectItem(index)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 ares-cut-sm text-left transition-all ${
              index === selectedIndex ? 'bg-ares-gold/20 text-ares-gold shadow-inner' : 'text-marble/50 hover:bg-white/5 hover:text-white'
            }`}
          >
            <div className={`p-2 ares-cut-sm ${index === selectedIndex ? 'bg-ares-gold/20' : 'bg-white/5'}`}>
              {item.icon}
            </div>
            <div>
              <div className="text-sm font-bold">{item.title}</div>
              <div className="text-xs opacity-60 font-medium">{item.description}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
});

CommandsList.displayName = 'CommandsList';
