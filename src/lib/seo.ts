const SITE_URL = 'https://nosey.vercel.app';
const SITE_NAME = 'nosey';
const SITE_DESCRIPTION = 'A Nostr searcher';
const SITE_ALTERNATE_NAMES = ['Nosey', 'nosquawks'];

const createUrl = (query: string, page: number, isInitial: boolean) => {
  if (isInitial) {
    return SITE_URL;
  }

  const params = new URLSearchParams({ q: query });
  if (page !== 0) {
    params.set('page', page.toString());
  }

  return `${SITE_URL}/?${params}`;
};

export const createSearchPageSeo = (query: string, page: number) => {
  const isInitial = query === '';
  const url = createUrl(query, page, isInitial);

  return {
    isInitial,
    url,
    title: isInitial ? 'nosey | A Nostr searcher' : `${query} - nosey`,
    description: SITE_DESCRIPTION,
    keywords: 'nostr,search,notes,damus,snort',
    ogTitle: isInitial ? 'nosey' : `${query} - nosey`,
    ogType: 'website',
    ogSiteName: SITE_NAME,
    ogImage: `${SITE_URL}/ogp.png`,
    twitterCard: 'summary',
    twitterImage: `${SITE_URL}/favicon.png`,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': isInitial ? 'WebSite' : 'SearchResultsPage',
      name: SITE_NAME,
      alternateName: SITE_ALTERNATE_NAMES,
      about: SITE_DESCRIPTION,
      url,
    },
  };
};
