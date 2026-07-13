import { nip19 } from 'nostr-tools';
import { describe, expect, it } from 'vitest';
import { parseQuery } from './parseQuery';

const mattnNpub = 'npub1937vv2nf06360qn9y8el6d8sevnndy7tuh5nzre4gj05xc32tnwqauhaj6';

describe('parseQuery', () => {
  it('treats plain words as the query keyword', () => {
    expect(parseQuery('hello world')).toEqual({ query: 'hello world' });
  });

  it('parses a from: filter into a decoded pubkey', () => {
    const { data: pubkey } = nip19.decode(mattnNpub);
    expect(parseQuery(`from:${mattnNpub}`)).toEqual({ pubkey });
  });

  it('ignores a from: filter with an invalid npub', () => {
    expect(parseQuery('from:not-a-valid-npub')).toEqual({});
  });

  it('parses since:/until: filters into Dates', () => {
    expect(parseQuery('since:2024-01-01 until:2024-12-31')).toEqual({
      since: new Date('2024-01-01'),
      until: new Date('2024-12-31'),
    });
  });

  it('mixes keywords and filters', () => {
    const { data: pubkey } = nip19.decode(mattnNpub);
    expect(parseQuery(`hello from:${mattnNpub} world`)).toEqual({
      query: 'hello world',
      pubkey,
    });
  });

  it('ignores filters with an empty value', () => {
    expect(parseQuery('since: hello')).toEqual({ query: 'since: hello' });
  });
});
