<script lang="ts">
  import { nip19 } from 'nostr-tools';
  import ExternalLink from '$lib/components/ExternalLink.svelte';

  export let pubkey: string;

  let className = '';
  export { className as class };
</script>

<ExternalLink href="https://nostrapp.link/#{nip19.npubEncode(pubkey)}" class={className}>
  <slot />
</ExternalLink>
