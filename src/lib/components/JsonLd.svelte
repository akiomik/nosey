<script lang="ts">
  import { jsonLdTag } from '$lib/helpers/jsonLdTag';

  export let url: string;
  export let isRoot: boolean;

  $: jsonLd = {
    '@context': 'https://schema.org',
    '@type': isRoot ? 'WebSite' : 'SearchResultsPage',
    name: 'nosey',
    alternateName: ['Nosey', 'nosquawks'],
    about: 'A Nostr searcher',
    url,
  };
</script>

<!-- eslint-disable-next-line svelte/no-at-html-tags -->
{@html jsonLdTag(jsonLd)}
