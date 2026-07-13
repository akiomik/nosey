<script lang="ts">
  interface Props {
    href: string;
    class?: string;
    onclick?: () => void;
    children?: import('svelte').Snippet;
  }

  let { href, class: className = '', onclick, children }: Props = $props();
</script>

<a {href} rel="external noreferrer" target="_blank" class={className} {onclick}>
  {@render children?.()}
</a>
