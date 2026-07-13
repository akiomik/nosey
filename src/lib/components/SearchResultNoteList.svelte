<script lang="ts">
  import type { SearchResult } from '$lib/types';

  interface Props {
    result: SearchResult;
  }

  let { result }: Props = $props();
</script>

{#each result.data as record}
  <p>{record.content}</p>
{/each}
