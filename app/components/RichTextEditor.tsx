/**
 * Rich Text Editor Component
 * Slate-based editor with Medium-style inline toolbar
 */

import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { createEditor, Editor, Transforms, Range, Element as SlateElement } from 'slate';
import type { Descendant, BaseEditor } from 'slate';
import { Slate, Editable, withReact, ReactEditor, useSlate } from 'slate-react';
import { withHistory } from 'slate-history';
import { cn } from '~/lib/utils';
import type { CustomElement, CustomText } from '~/lib/slate-markdown';

// ============================================================================
// Types
// ============================================================================

interface RichTextEditorProps {
  value: Descendant[];
  onChange: (value: Descendant[]) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  onSubmit?: () => void;
}

type CustomEditor = BaseEditor & ReactEditor;

// ============================================================================
// Main Component
// ============================================================================

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Start writing...',
  className,
  autoFocus = false,
  onSubmit,
}: RichTextEditorProps) {
  const editor = useMemo(() => withHistory(withReact(createEditor())), []);
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 });
  const editableRef = useRef<HTMLDivElement>(null);

  // Handle autofocus
  useEffect(() => {
    if (autoFocus && editableRef.current) {
      // Small delay to ensure the editor is fully mounted
      const timer = setTimeout(() => {
        ReactEditor.focus(editor);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [autoFocus, editor]);

  // Handle selection change to show/hide toolbar
  const handleSelectionChange = useCallback(() => {
    const { selection } = editor;

    // Hide toolbar if no selection or selection is collapsed
    if (!selection || Range.isCollapsed(selection)) {
      setShowToolbar(false);
      return;
    }

    // Get the DOM range and calculate position
    const domSelection = window.getSelection();
    if (domSelection && domSelection.rangeCount > 0) {
      const domRange = domSelection.getRangeAt(0);
      const rect = domRange.getBoundingClientRect();

      setToolbarPosition({
        top: rect.top - 50 + window.scrollY,
        left: rect.left + rect.width / 2 + window.scrollX,
      });
      setShowToolbar(true);
    }
  }, [editor]);

  return (
    <div className={cn('relative', className)}>
      <Slate editor={editor} initialValue={value} onChange={onChange}>
        {showToolbar && (
          <InlineToolbar
            style={{
              position: 'absolute',
              top: `${toolbarPosition.top}px`,
              left: `${toolbarPosition.left}px`,
              transform: 'translateX(-50%)',
              zIndex: 50,
            }}
          />
        )}

        <Editable
          ref={editableRef as any}
          placeholder={placeholder}
          autoFocus={autoFocus}
          onSelect={handleSelectionChange}
          className={cn(
            'min-h-[300px] w-full rounded-lg border border-gray-700 bg-gray-800',
            'px-4 py-3 text-gray-100 outline-none',
            'placeholder:text-gray-500',
            'focus:border-wallie-accent focus:ring-2 focus:ring-wallie-accent/20'
          )}
          renderElement={renderElement}
          renderLeaf={renderLeaf}
          onKeyDown={(event) => {
            // Handle keyboard shortcuts
            if (event.metaKey || event.ctrlKey) {
              switch (event.key) {
                case 'b': {
                  event.preventDefault();
                  toggleMark(editor, 'bold');
                  break;
                }
                case 'i': {
                  event.preventDefault();
                  toggleMark(editor, 'italic');
                  break;
                }
                case '`': {
                  event.preventDefault();
                  toggleMark(editor, 'code');
                  break;
                }
                case 'Enter': {
                  if (onSubmit) {
                    event.preventDefault();
                    onSubmit();
                  }
                  break;
                }
              }
            }
          }}
        />
      </Slate>
    </div>
  );
}

// ============================================================================
// Inline Toolbar Component
// ============================================================================

interface InlineToolbarProps {
  style: React.CSSProperties;
}

function InlineToolbar({ style }: InlineToolbarProps) {
  const editor = useSlate() as ReactEditor;

  return (
    <div
      style={style}
      className="flex items-center gap-1 rounded-lg border border-gray-700 bg-gray-900 p-1 shadow-lg"
      onMouseDown={(e) => {
        // Prevent toolbar clicks from losing editor selection
        e.preventDefault();
      }}
    >
      <ToolbarButton
        active={isMarkActive(editor, 'bold')}
        onToggle={() => toggleMark(editor, 'bold')}
        icon="B"
        title="Bold (Cmd+B)"
      />
      <ToolbarButton
        active={isMarkActive(editor, 'italic')}
        onToggle={() => toggleMark(editor, 'italic')}
        icon="I"
        title="Italic (Cmd+I)"
      />
      <ToolbarButton
        active={isMarkActive(editor, 'code')}
        onToggle={() => toggleMark(editor, 'code')}
        icon="<>"
        title="Code (Cmd+`)"
      />
      <div className="mx-1 h-6 w-px bg-gray-700" />
      <BlockButton
        active={isBlockActive(editor, 'heading-one')}
        onToggle={() => toggleBlock(editor, 'heading-one')}
        icon="H1"
        title="Heading 1"
      />
      <BlockButton
        active={isBlockActive(editor, 'heading-two')}
        onToggle={() => toggleBlock(editor, 'heading-two')}
        icon="H2"
        title="Heading 2"
      />
      <BlockButton
        active={isBlockActive(editor, 'block-quote')}
        onToggle={() => toggleBlock(editor, 'block-quote')}
        icon='""'
        title="Quote"
      />
    </div>
  );
}

// ============================================================================
// Toolbar Button Components
// ============================================================================

interface ToolbarButtonProps {
  active: boolean;
  onToggle: () => void;
  icon: string;
  title: string;
}

function ToolbarButton({ active, onToggle, icon, title }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      title={title}
      className={cn(
        'rounded px-3 py-1.5 text-sm font-semibold transition-colors',
        active
          ? 'bg-wallie-accent text-gray-900'
          : 'text-gray-300 hover:bg-gray-800 hover:text-gray-100'
      )}
    >
      {icon}
    </button>
  );
}

interface BlockButtonProps {
  active: boolean;
  onToggle: () => void;
  icon: string;
  title: string;
}

function BlockButton({ active, onToggle, icon, title }: BlockButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      title={title}
      className={cn(
        'rounded px-2 py-1.5 text-xs font-semibold transition-colors',
        active
          ? 'bg-wallie-accent text-gray-900'
          : 'text-gray-300 hover:bg-gray-800 hover:text-gray-100'
      )}
    >
      {icon}
    </button>
  );
}

// ============================================================================
// Rendering Functions
// ============================================================================

function renderElement(props: any) {
  const { attributes, children, element } = props;

  switch (element.type) {
    case 'heading-one':
      return (
        <h1 {...attributes} className="mb-4 text-3xl font-bold text-gray-100">
          {children}
        </h1>
      );
    case 'heading-two':
      return (
        <h2 {...attributes} className="mb-3 text-2xl font-bold text-gray-100">
          {children}
        </h2>
      );
    case 'heading-three':
      return (
        <h3 {...attributes} className="mb-2 text-xl font-bold text-gray-100">
          {children}
        </h3>
      );
    case 'block-quote':
      return (
        <blockquote {...attributes} className="border-l-4 border-wallie-accent pl-4 italic text-gray-300">
          {children}
        </blockquote>
      );
    case 'code-block':
      return (
        <pre {...attributes} className="rounded bg-gray-900 p-3 font-mono text-sm text-gray-300">
          <code>{children}</code>
        </pre>
      );
    case 'list-item':
      return (
        <li {...attributes} className="ml-4 list-disc text-gray-100">
          {children}
        </li>
      );
    default:
      return (
        <p {...attributes} className="mb-2 text-gray-100">
          {children}
        </p>
      );
  }
}

function renderLeaf(props: any) {
  const { attributes, children, leaf } = props;
  let renderedChildren = children;

  if (leaf.bold) {
    renderedChildren = <strong className="font-bold">{renderedChildren}</strong>;
  }

  if (leaf.italic) {
    renderedChildren = <em className="italic">{renderedChildren}</em>;
  }

  if (leaf.code) {
    renderedChildren = (
      <code className="rounded bg-gray-900 px-1.5 py-0.5 font-mono text-sm text-wallie-accent">
        {renderedChildren}
      </code>
    );
  }

  return <span {...attributes}>{renderedChildren}</span>;
}

// ============================================================================
// Editor Helper Functions
// ============================================================================

function isMarkActive(editor: ReactEditor, format: keyof Omit<CustomText, 'text'>) {
  const marks = Editor.marks(editor as any);
  return marks ? marks[format] === true : false;
}

function toggleMark(editor: ReactEditor, format: keyof Omit<CustomText, 'text'>) {
  const isActive = isMarkActive(editor, format);

  if (isActive) {
    Editor.removeMark(editor as any, format);
  } else {
    Editor.addMark(editor as any, format, true);
  }
}

function isBlockActive(editor: ReactEditor, format: CustomElement['type']) {
  const { selection } = editor;
  if (!selection) return false;

  const [match] = Array.from(
    Editor.nodes(editor as any, {
      at: Editor.unhangRange(editor as any, selection),
      match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === format,
    })
  );

  return !!match;
}

function toggleBlock(editor: ReactEditor, format: CustomElement['type']) {
  const isActive = isBlockActive(editor, format);
  const newType = isActive ? 'paragraph' : format;

  Transforms.setNodes(
    editor as any,
    { type: newType },
    { match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n) }
  );
}
