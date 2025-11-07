/**
 * Slate to Markdown Serialization
 * Converts between Slate's internal format and Markdown
 */

import { Node, Text } from 'slate';
import type { Descendant } from 'slate';

// ============================================================================
// Types
// ============================================================================

export type CustomElement = {
  type: 'paragraph' | 'heading-one' | 'heading-two' | 'heading-three' | 'block-quote' | 'bulleted-list' | 'numbered-list' | 'list-item' | 'code-block';
  children: CustomText[];
};

export type CustomText = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  code?: boolean;
  underline?: boolean;
};

export type SlateNode = CustomElement | CustomText;

declare module 'slate' {
  interface CustomTypes {
    Element: CustomElement;
    Text: CustomText;
  }
}

// ============================================================================
// Serialize: Slate → Markdown
// ============================================================================

/**
 * Convert Slate nodes to Markdown string
 */
export function serializeToMarkdown(nodes: Descendant[]): string {
  return nodes.map((node) => serializeNode(node)).join('\n\n');
}

function serializeNode(node: Descendant): string {
  if (Text.isText(node)) {
    let text = node.text;

    // Apply text formatting
    if (node.bold) text = `**${text}**`;
    if (node.italic) text = `*${text}*`;
    if (node.code) text = `\`${text}\``;
    if (node.underline) text = `<u>${text}</u>`; // HTML for underline

    return text;
  }

  const children = node.children.map((n) => serializeNode(n)).join('');

  switch (node.type) {
    case 'paragraph':
      return children;
    case 'heading-one':
      return `# ${children}`;
    case 'heading-two':
      return `## ${children}`;
    case 'heading-three':
      return `### ${children}`;
    case 'block-quote':
      return `> ${children}`;
    case 'code-block':
      return `\`\`\`\n${children}\n\`\`\``;
    case 'bulleted-list':
      return children;
    case 'numbered-list':
      return children;
    case 'list-item':
      return `- ${children}`;
    default:
      return children;
  }
}

// ============================================================================
// Deserialize: Markdown → Slate
// ============================================================================

/**
 * Convert Markdown string to Slate nodes
 * This is a simplified parser for common markdown patterns
 */
export function deserializeFromMarkdown(markdown: string): Descendant[] {
  if (!markdown || markdown.trim() === '') {
    return [{ type: 'paragraph', children: [{ text: '' }] }];
  }

  const lines = markdown.split('\n');
  const nodes: Descendant[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Code block
    if (line.startsWith('```')) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      nodes.push({
        type: 'code-block',
        children: [{ text: codeLines.join('\n') }],
      });
      i++; // Skip closing ```
      continue;
    }

    // Heading 1
    if (line.startsWith('# ')) {
      nodes.push({
        type: 'heading-one',
        children: parseInlineFormatting(line.slice(2)),
      });
      i++;
      continue;
    }

    // Heading 2
    if (line.startsWith('## ')) {
      nodes.push({
        type: 'heading-two',
        children: parseInlineFormatting(line.slice(3)),
      });
      i++;
      continue;
    }

    // Heading 3
    if (line.startsWith('### ')) {
      nodes.push({
        type: 'heading-three',
        children: parseInlineFormatting(line.slice(4)),
      });
      i++;
      continue;
    }

    // Block quote
    if (line.startsWith('> ')) {
      nodes.push({
        type: 'block-quote',
        children: parseInlineFormatting(line.slice(2)),
      });
      i++;
      continue;
    }

    // List item
    if (line.startsWith('- ') || line.startsWith('* ')) {
      nodes.push({
        type: 'list-item',
        children: parseInlineFormatting(line.slice(2)),
      });
      i++;
      continue;
    }

    // Empty line
    if (line.trim() === '') {
      i++;
      continue;
    }

    // Default: paragraph
    nodes.push({
      type: 'paragraph',
      children: parseInlineFormatting(line),
    });
    i++;
  }

  // If no nodes were created, return empty paragraph
  if (nodes.length === 0) {
    return [{ type: 'paragraph', children: [{ text: '' }] }];
  }

  return nodes;
}

/**
 * Parse inline formatting (bold, italic, code) in a text string
 */
function parseInlineFormatting(text: string): CustomText[] {
  // This is a simplified parser
  // For production, consider using a proper markdown parser

  const nodes: CustomText[] = [];
  let currentText = '';
  let i = 0;

  while (i < text.length) {
    // Bold (**text**)
    if (text[i] === '*' && text[i + 1] === '*') {
      if (currentText) {
        nodes.push({ text: currentText });
        currentText = '';
      }
      i += 2;
      let boldText = '';
      while (i < text.length && !(text[i] === '*' && text[i + 1] === '*')) {
        boldText += text[i];
        i++;
      }
      if (boldText) {
        nodes.push({ text: boldText, bold: true });
      }
      i += 2;
      continue;
    }

    // Italic (*text*)
    if (text[i] === '*') {
      if (currentText) {
        nodes.push({ text: currentText });
        currentText = '';
      }
      i++;
      let italicText = '';
      while (i < text.length && text[i] !== '*') {
        italicText += text[i];
        i++;
      }
      if (italicText) {
        nodes.push({ text: italicText, italic: true });
      }
      i++;
      continue;
    }

    // Code (`text`)
    if (text[i] === '`') {
      if (currentText) {
        nodes.push({ text: currentText });
        currentText = '';
      }
      i++;
      let codeText = '';
      while (i < text.length && text[i] !== '`') {
        codeText += text[i];
        i++;
      }
      if (codeText) {
        nodes.push({ text: codeText, code: true });
      }
      i++;
      continue;
    }

    currentText += text[i];
    i++;
  }

  if (currentText) {
    nodes.push({ text: currentText });
  }

  // If no nodes, return empty text
  if (nodes.length === 0) {
    return [{ text: '' }];
  }

  return nodes;
}

// ============================================================================
// Initial Value
// ============================================================================

/**
 * Get empty/initial Slate value
 */
export function getInitialValue(): Descendant[] {
  return [
    {
      type: 'paragraph',
      children: [{ text: '' }],
    },
  ];
}
