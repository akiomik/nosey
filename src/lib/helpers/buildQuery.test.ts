import { describe, expect, it } from 'vitest';
import type { AdvancedSearchFormData } from '$lib/types';
import { buildQuery } from './buildQuery';

const emptyForm: AdvancedSearchFormData = { keyword: '', from: '', since: '', until: '' };

describe('buildQuery', () => {
  it('returns an empty string when the form is empty', () => {
    expect(buildQuery(emptyForm)).toBe('');
  });

  it('uses the trimmed keyword alone', () => {
    expect(buildQuery({ ...emptyForm, keyword: '  hello world  ' })).toBe('hello world');
  });

  it('appends a from: filter', () => {
    expect(buildQuery({ ...emptyForm, from: 'npub1abc' })).toBe('from:npub1abc');
  });

  it('appends since:/until: filters', () => {
    expect(buildQuery({ ...emptyForm, since: '2024-01-01', until: '2024-12-31' })).toBe(
      'since:2024-01-01 until:2024-12-31'
    );
  });

  it('combines keyword and all filters in order', () => {
    const form: AdvancedSearchFormData = {
      keyword: 'hello',
      from: 'npub1abc',
      since: '2024-01-01',
      until: '2024-12-31',
    };
    expect(buildQuery(form)).toBe('hello from:npub1abc since:2024-01-01 until:2024-12-31');
  });
});
