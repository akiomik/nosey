<script lang="ts">
  type Size = 'sm' | 'md';
  interface Props {
    size?: Size;
  }

  let { size = 'md' }: Props = $props();
</script>

<div class="grid place-items-center" class:h-96={size === 'md'} class:h-48={size === 'sm'}>
  <div
    class="border-primary-500 h-12 w-12 animate-spin rounded-full border-4 border-t-transparent"
></div>
</div>
