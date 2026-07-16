import { describe, expect, it } from 'vitest';
import { createSearchPageSeo } from './seo';

describe('createSearchPageSeo', () => {
  it('uses the site root for the initial page', () => {
    expect(createSearchPageSeo('', 0)).toEqual({
      isInitial: true,
      url: 'https://nosey.vercel.app',
    });
  });

  it('creates a canonical URL for a search query', () => {
    expect(createSearchPageSeo('from:npub1abc', 0)).toEqual({
      isInitial: false,
      url: 'https://nosey.vercel.app/?q=from%3Anpub1abc',
    });
  });

  it('includes a non-initial result page', () => {
    expect(createSearchPageSeo('hello', 2)).toEqual({
      isInitial: false,
      url: 'https://nosey.vercel.app/?q=hello&page=2',
    });
  });
});
