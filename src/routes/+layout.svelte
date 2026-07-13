<script lang="ts">
  import '../app.postcss';

  import { arrow, autoUpdate, computePosition, flip, offset, shift } from '@floating-ui/dom';
  import { AppShell, initializeStores, Modal, storePopup } from '@skeletonlabs/skeleton';
  import { navigating } from '$app/stores';
  import AdvancedSearchModal from '$lib/components/AdvancedSearchModal.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import Header from '$lib/components/Header.svelte';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';

  initializeStores();
  storePopup.set({ computePosition, autoUpdate, offset, shift, flip, arrow });

  const modalRegistry = {
    advancedSearch: { ref: AdvancedSearchModal },
  };
</script>

<Modal components={modalRegistry} />

<AppShell>
  <svelte:fragment slot="pageHeader">
    <Header />
  </svelte:fragment>

  {#if $navigating}
    <div class="fixed inset-0 z-[15] bg-black opacity-60">
      <div class="flex justify-center items-center w-full h-full">
        <LoadingSpinner />
      </div>
    </div>
  {/if}

  <div class="container mx-auto max-w-4xl p-4 space-y-8 mt-4 h-full">
    <slot />
  </div>

  <svelte:fragment slot="pageFooter">
    <hr />

    <Footer />
  </svelte:fragment>
</AppShell>
