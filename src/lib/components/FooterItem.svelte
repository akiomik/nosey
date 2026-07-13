<script lang="ts">
  interface Props {
    last?: boolean;
    children?: import('svelte').Snippet;
  }

  let { last = false, children }: Props = $props();

  let className = $derived(
    last
      ? 'inline'
      : "inline after:content-['・'] after:text-surface-300 after:dark:text-surface-600 after:ml-1"
  );
</script>

<li class={className}>
  {@render children?.()}
</li>
