<script lang="ts">
  interface Props {
    href: string;
    class?: string;
    children?: import('svelte').Snippet;
  }

  let { href, class: className = '', children }: Props = $props();

  
</script>

<a {href} rel="external noreferrer" target="_blank" class={className}>
  {@render children?.()}
</a>
