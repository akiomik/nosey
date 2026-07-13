<script lang="ts">
  import '../app.css';

  import { navigating } from '$app/state';
  import Footer from '$lib/components/Footer.svelte';
  import Header from '$lib/components/Header.svelte';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';

  interface Props {
    children?: import('svelte').Snippet;
  }

  let { children }: Props = $props();
</script>

<div class="h-full overflow-hidden flex flex-col">
  <header class="sticky top-0 z-10">
    <Header />
  </header>

  {#if navigating.to}
    <div class="fixed inset-0 z-[15] bg-black opacity-60">
      <div class="flex justify-center items-center w-full h-full">
        <LoadingSpinner />
      </div>
    </div>
  {/if}

  <main class="flex-1 overflow-y-auto">
    <div class="container mx-auto max-w-4xl p-4 space-y-8 mt-4">
      {@render children?.()}
    </div>
  </main>

  <footer>
    <hr />
    <Footer />
  </footer>
</div>
