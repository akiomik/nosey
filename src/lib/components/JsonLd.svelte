<script lang="ts">
  import { jsonLdTag } from '$lib/helpers/jsonLdTag';

  interface Props {
    url: string;
    isRoot: boolean;
  }

  let { url, isRoot }: Props = $props();

  let jsonLd = $derived({
    '@context': 'https://schema.org',
    '@type': isRoot ? 'WebSite' : 'SearchResultsPage',
    name: 'nosey',
    alternateName: ['Nosey', 'nosquawks'],
    about: 'A Nostr searcher',
    url,
  });
</script>

<!-- eslint-disable-next-line svelte/no-at-html-tags -->
{@html jsonLdTag(jsonLd)}
