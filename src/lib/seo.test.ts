import { describe, expect, it } from 'vitest';
import { createSearchPageSeo } from './seo';

describe('createSearchPageSeo', () => {
  it('uses the site root and default metadata for the initial page', () => {
    expect(createSearchPageSeo('', 0)).toEqual({
      isInitial: true,
      url: 'https://nosey.vercel.app',
      title: 'nosey | A Nostr searcher',
      description: 'A Nostr searcher',
      keywords: 'nostr,search,notes,damus,snort',
      ogTitle: 'nosey',
      ogType: 'website',
      ogSiteName: 'nosey',
      ogImage: 'https://nosey.vercel.app/ogp.png',
      twitterCard: 'summary',
      twitterImage: 'https://nosey.vercel.app/favicon.png',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'nosey',
        alternateName: ['Nosey', 'nosquawks'],
        about: 'A Nostr searcher',
        url: 'https://nosey.vercel.app',
      },
    });
  });

  it('creates a canonical URL and title for a search query', () => {
    const seo = createSearchPageSeo('from:npub1abc', 0);
    expect(seo).toMatchObject({
      isInitial: false,
      url: 'https://nosey.vercel.app/?q=from%3Anpub1abc',
      title: 'from:npub1abc - nosey',
      ogTitle: 'from:npub1abc - nosey',
      jsonLd: {
        '@type': 'SearchResultsPage',
        url: 'https://nosey.vercel.app/?q=from%3Anpub1abc',
      },
    });
  });

  it('includes a non-initial result page in the canonical URL', () => {
    const seo = createSearchPageSeo('hello', 2);
    expect(seo).toMatchObject({
      isInitial: false,
      url: 'https://nosey.vercel.app/?q=hello&page=2',
      title: 'hello - nosey',
      jsonLd: {
        '@type': 'SearchResultsPage',
        url: 'https://nosey.vercel.app/?q=hello&page=2',
      },
    });
  });
});
