const SITE_URL = 'https://nosey.vercel.app';

export const createSearchPageSeo = (query: string, page: number) => {
  const isInitial = query === '';
  if (isInitial) {
    return { isInitial, url: SITE_URL };
  }

  const params = new URLSearchParams({ q: query });
  if (page !== 0) {
    params.set('page', page.toString());
  }

  return { isInitial, url: `${SITE_URL}/?${params}` };
};
