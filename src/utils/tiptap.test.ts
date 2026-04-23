import { describe, it, expect } from 'vitest';
import { extractAstText } from './tiptap';

describe('tiptap extractAstText utility', () => {
  it('returns empty string for null input', () => {
    expect(extractAstText(null)).toBe('');
  });

  it('returns empty string for undefined input', () => {
    expect(extractAstText(undefined)).toBe('');
  });

  it('returns empty string for empty string input', () => {
    expect(extractAstText('')).toBe('');
  });

  it('returns plain text strings as-is', () => {
    expect(extractAstText('Hello World')).toBe('Hello World');
  });

  it('extracts text from a simple Tiptap doc', () => {
    const doc = JSON.stringify({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Hello World' }],
        },
      ],
    });
    expect(extractAstText(doc)).toBe('Hello World');
  });

  it('extracts text from nested Tiptap content', () => {
    const doc = JSON.stringify({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'First' },
            { type: 'text', text: ' paragraph' },
          ],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Second paragraph' }],
        },
      ],
    });
    expect(extractAstText(doc)).toBe('First  paragraph Second paragraph');
  });

  it('handles deeply nested content nodes', () => {
    const doc = JSON.stringify({
      type: 'doc',
      content: [
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Item one' }],
                },
              ],
            },
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Item two' }],
                },
              ],
            },
          ],
        },
      ],
    });
    expect(extractAstText(doc)).toBe('Item one Item two');
  });

  it('returns raw string for malformed JSON', () => {
    const malformed = '{not valid json at all}';
    expect(extractAstText(malformed)).toBe(malformed);
  });

  it('returns raw string for JSON that is not a doc type', () => {
    const notDoc = JSON.stringify({ type: 'image', src: 'foo.png' });
    expect(extractAstText(notDoc)).toBe(notDoc);
  });

  it('handles doc with empty content array', () => {
    const emptyDoc = JSON.stringify({ type: 'doc', content: [] });
    expect(extractAstText(emptyDoc)).toBe('');
  });

  it('handles nodes with no text and no content', () => {
    const doc = JSON.stringify({
      type: 'doc',
      content: [
        { type: 'hardBreak' },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'After break' }],
        },
      ],
    });
    expect(extractAstText(doc)).toBe('After break');
  });

  it('returns raw string for JSON array input', () => {
    const arr = JSON.stringify([1, 2, 3]);
    expect(extractAstText(arr)).toBe(arr);
  });
});
