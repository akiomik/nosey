import { describe, expect, it } from 'vitest';
import { shortenNostrId } from './nostr';

describe('shortenNostrId', () => {
  it('keeps the first nine and last eight characters', () => {
    expect(shortenNostrId('a'.repeat(64))).toBe('aaaaaaaaa:aaaaaaaa');
  });

  it('preserves a mention prefix as part of the shortened identifier', () => {
    expect(shortenNostrId(`@npub1${'a'.repeat(58)}`)).toBe('@npub1aaa:aaaaaaaa');
  });
});
