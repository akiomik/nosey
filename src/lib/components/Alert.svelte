<script lang="ts">
  interface Props {
    variant?: '' | 'warning' | 'error';
    icon?: import('svelte').Snippet;
    children?: import('svelte').Snippet;
  }

  let { variant = '', icon, children }: Props = $props();

  let className = $derived.by(() => {
    switch (variant) {
      case 'warning':
        return 'preset-tonal-warning';
      case 'error':
        return 'preset-tonal-error';
      default:
        return 'preset-tonal-surface';
    }
  });
</script>

<aside class={`card p-4 flex gap-2 items-center ${className}`}>
  {@render icon?.()}

  <div class="flex-1">
    {@render children?.()}
  </div>
</aside>
