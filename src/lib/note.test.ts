import { describe, expect, it } from 'vitest';
import { hasInlineImageUrl, isNoteContentDefinitelyLong, transformNoteContent } from './note';

describe('note display helpers', () => {
  it('converts supported nostr URIs into linkifiable mentions', () => {
    expect(
      transformNoteContent(
        `nostr:npub1${'a'.repeat(58)} nostr:nprofile1${'b'.repeat(61)} nostr:note1${'c'.repeat(58)} nostr:nevent1${'d'.repeat(70)}`
      )
    ).toBe(
      `@npub1${'a'.repeat(58)} @nprofile1${'b'.repeat(61)} @note1${'c'.repeat(58)} @nevent1${'d'.repeat(70)}`
    );
  });

  it('identifies only content beyond the collapse threshold as definitely long', () => {
    expect(isNoteContentDefinitelyLong('a'.repeat(500))).toBe(false);
    expect(isNoteContentDefinitelyLong('a'.repeat(501))).toBe(true);
  });

  it('recognizes supported inline image URLs', () => {
    expect(hasInlineImageUrl('https://example.com/image.webp')).toBe(true);
    expect(hasInlineImageUrl('https://example.com/image.svg')).toBe(false);
  });
});
