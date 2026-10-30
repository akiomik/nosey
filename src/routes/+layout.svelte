<script lang="ts">
  import '../app.css';

  import { Toast } from '@skeletonlabs/skeleton-svelte';
  import Footer from '#lib/components/Footer.svelte';
  import Header from '#lib/components/Header.svelte';
  import LoadingSpinner from '#lib/components/LoadingSpinner.svelte';
  import { toaster } from '#lib/stores/toaster.ts';
  import { navigating } from '$app/state';

  interface Props {
    children?: import('svelte').Snippet;
  }

  let { children }: Props = $props();

  const toastClass = (type: string | undefined) => {
    switch (type) {
      case 'success':
        return 'preset-tonal-success';
      case 'error':
        return 'preset-tonal-error';
      default:
        return 'preset-tonal-surface';
    }
  };
</script>

<div class="flex min-h-svh flex-col">
  <header>
    <Header />
  </header>

  {#if navigating.to}
    <div class="fixed inset-0 z-[15] bg-black opacity-60">
      <div class="flex h-full w-full items-center justify-center">
        <LoadingSpinner />
      </div>
    </div>
  {/if}

  <main class="flex flex-1 flex-col">
    <div class="container mx-auto mt-4 flex max-w-4xl flex-1 flex-col space-y-8 p-4">
      {@render children?.()}
    </div>
  </main>

  <footer>
    <hr />
    <Footer />
  </footer>
</div>

<Toast.Group {toaster}>
  {#snippet children(toast)}
    <Toast {toast} class="card p-4 shadow-xl {toastClass(toast.type)}">
      <Toast.Title class="font-bold">{toast.title}</Toast.Title>
    </Toast>
  {/snippet}
</Toast.Group>
