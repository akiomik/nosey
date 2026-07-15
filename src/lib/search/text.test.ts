import { nip19 } from 'nostr-tools';
import { describe, expect, it } from 'vitest';
import { searchTextCodec } from './text';

const mattnNpub = 'npub1937vv2nf06360qn9y8el6d8sevnndy7tuh5nzre4gj05xc32tnwqauhaj6';

describe('searchTextCodec', () => {
  it('decodes keywords and directives into search filters', () => {
    const { data: pubkey } = nip19.decode(mattnNpub);

    expect(
      searchTextCodec.decode(`hello from:${mattnNpub} since:2024-01-01 until:2024-12-31`)
    ).toEqual({
      query: 'hello',
      pubkey,
      since: new Date('2024-01-01T00:00:00.000Z'),
      until: new Date('2024-12-31T00:00:00.000Z'),
    });
  });

  it('encodes filters using a canonical directive order', () => {
    const { data: pubkey } = nip19.decode(mattnNpub);

    expect(
      searchTextCodec.encode({
        query: 'hello',
        pubkey: pubkey as string,
        since: new Date('2024-01-01T00:00:00.000Z'),
        until: new Date('2024-12-31T00:00:00.000Z'),
      })
    ).toBe(`hello from:${mattnNpub} since:2024-01-01 until:2024-12-31`);
  });

  it('rejects malformed known directives instead of silently dropping them', () => {
    expect(searchTextCodec.safeDecode('from:not-an-npub').success).toBe(false);
    expect(searchTextCodec.safeDecode('since:not-a-date').success).toBe(false);
  });

  it('keeps unknown and empty directives as keyword text', () => {
    expect(searchTextCodec.decode('has:media since:')).toEqual({ query: 'has:media since:' });
  });
});
