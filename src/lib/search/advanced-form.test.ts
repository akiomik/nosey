import { nip19 } from 'nostr-tools';
import { describe, expect, it } from 'vitest';
import { AdvancedSearchFormSchema } from './advanced-form';

const mattnNpub = 'npub1937vv2nf06360qn9y8el6d8sevnndy7tuh5nzre4gj05xc32tnwqauhaj6';

describe('AdvancedSearchFormSchema', () => {
  it('converts form-specific strings into search filters', () => {
    const { data: pubkey } = nip19.decode(mattnNpub);

    expect(
      AdvancedSearchFormSchema.parse({
        keyword: '  hello  ',
        from: mattnNpub,
        since: '2024-01-01',
        until: '2024-12-31',
      })
    ).toEqual({
      query: 'hello',
      pubkey,
      since: new Date('2024-01-01T00:00:00.000Z'),
      until: new Date('2024-12-31T00:00:00.000Z'),
    });
  });

  it('returns a field error for an invalid author', () => {
    const result = AdvancedSearchFormSchema.safeParse({
      keyword: '',
      from: 'not-an-npub',
      since: '',
      until: '',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === 'from')).toBe(true);
    }
  });

  it('returns a field error for an invalid date', () => {
    const result = AdvancedSearchFormSchema.safeParse({
      keyword: '',
      from: '',
      since: '2024-02-30',
      until: '',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === 'since')).toBe(true);
    }
  });

  it('returns an until error for a reversed date range', () => {
    const result = AdvancedSearchFormSchema.safeParse({
      keyword: '',
      from: '',
      since: '2024-12-31',
      until: '2024-01-01',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === 'until')).toBe(true);
    }
  });
});
