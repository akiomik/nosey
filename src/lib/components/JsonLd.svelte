<script lang="ts">
  import { jsonLdTag } from '#lib/helpers/jsonLdTag.ts';

  interface Props {
    jsonLd: object;
  }

  let { jsonLd }: Props = $props();
</script>

<!-- eslint-disable-next-line svelte/no-at-html-tags -->
{@html jsonLdTag(jsonLd)}
