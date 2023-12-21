export function buildQuery(form: {
  keyword: string;
  from: string;
  since: string;
  until: string;
}): string {
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
