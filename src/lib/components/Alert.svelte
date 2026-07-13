<script lang="ts">
  interface Props {
    variant?: '' | 'warning' | 'error';
    icon?: import('svelte').Snippet;
    children?: import('svelte').Snippet;
  }

  let { variant = '', icon, children }: Props = $props();

  // NOTE: Dynamic class name does not seem to work
  let className = $state('preset-tonal-surface');
  switch (variant) {
    case 'warning':
      className = 'preset-tonal-warning';
      break;
    case 'error':
      className = 'preset-tonal-error';
      break;
  }
</script>

<aside class={`card p-4 flex gap-2 items-center ${className}`}>
  {@render icon?.()}

  <div class="flex-1">
    {@render children?.()}
  </div>
</aside>
