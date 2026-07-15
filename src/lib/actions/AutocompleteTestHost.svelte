<script lang="ts">
  import { autocomplete } from './autocomplete.svelte';

  interface Props {
    prefix?: string;
  }

  let { prefix = '' }: Props = $props();
</script>

<input aria-label="Autocomplete" use:autocomplete={{ prefix }} />
