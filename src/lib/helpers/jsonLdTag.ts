export function jsonLdTag(json: object): string {
  return `<script type="application/ld+json">${JSON.stringify(json)}</script>`;
}
