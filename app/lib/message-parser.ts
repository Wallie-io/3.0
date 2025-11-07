/**
 * Message Parser Utility
 * Parses message content for embedded image references
 */

export type MessagePart =
  | { type: 'text'; content: string }
  | { type: 'image'; imageId: string };

/**
 * Parse message content for {{image:IMAGE_ID}} patterns
 * Returns an array of text and image parts
 */
export function parseMessageContent(content: string): MessagePart[] {
  const parts: MessagePart[] = [];
  const imagePattern = /\{\{image:([a-zA-Z0-9_-]+)\}\}/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = imagePattern.exec(content)) !== null) {
    // Add text before the image
    if (match.index > lastIndex) {
      const textContent = content.slice(lastIndex, match.index);
      if (textContent) {
        parts.push({ type: 'text', content: textContent });
      }
    }

    // Add the image reference
    parts.push({ type: 'image', imageId: match[1] });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text after last image
  if (lastIndex < content.length) {
    const textContent = content.slice(lastIndex);
    if (textContent) {
      parts.push({ type: 'text', content: textContent });
    }
  }

  // If no images found, return the whole content as text
  if (parts.length === 0) {
    parts.push({ type: 'text', content });
  }

  return parts;
}

/**
 * Insert image reference into message content at cursor position
 */
export function insertImageReference(
  content: string,
  imageId: string,
  cursorPosition?: number
): string {
  const imageRef = `{{image:${imageId}}}`;

  if (cursorPosition !== undefined) {
    return (
      content.slice(0, cursorPosition) +
      imageRef +
      content.slice(cursorPosition)
    );
  }

  // Append to end if no cursor position provided
  return content + (content ? ' ' : '') + imageRef;
}
