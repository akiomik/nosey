<script lang="ts">
  import type { SearchResult } from '$lib/types';

  export let result: SearchResult;
</script>

{#each result.data as record}
  <p>{record.content}</p>
{/each}
