import type { AdvancedSearchFormData } from '$lib/types';

export function buildQuery(form: AdvancedSearchFormData): string {
  let query = '';
  if (form.keyword) {
    query = form.keyword.trim();
  }
  if (form.from) {
    query = `${query} from:${form.from}`.trim();
  }
  if (form.since) {
    query = `${query} since:${form.since}`.trim();
  }
  if (form.until) {
    query = `${query} until:${form.until}`.trim();
  }

  return query;
}
