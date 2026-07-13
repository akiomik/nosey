<script lang="ts">
  interface Props {
    variant?: '' | 'warning' | 'error';
    icon?: import('svelte').Snippet;
    children?: import('svelte').Snippet;
  }

  let { variant = '', icon, children }: Props = $props();

  // NOTE: Dynamic class name does not seem to work
  let className = $state('variant-ghost');
  switch (variant) {
    case 'warning':
      className = 'variant-ghost-warning';
      break;
    case 'error':
      className = 'variant-ghost-error';
      break;
  }
</script>

<aside class={`alert ${className}`}>
  {@render icon?.()}

  <div class="alert-message">
    {@render children?.()}
  </div>
</aside>
