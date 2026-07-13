<script lang="ts">
  import { faSearch } from '@fortawesome/free-solid-svg-icons';
  import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
  import { Dialog, Menu, Portal } from '@skeletonlabs/skeleton-svelte';
  import { goto } from '$app/navigation';
  import { buildQuery } from '$lib/helpers/buildQuery';
  import type { AdvancedSearchFormData } from '$lib/types';
  import AdvancedSearchModal from './AdvancedSearchModal.svelte';

  let isAdvancedSearchOpen = $state(false);

  const handleSubmit = (form: AdvancedSearchFormData) => {
    console.debug('advanced search', form);

    const query = buildQuery(form);
    goto(`/?${new URLSearchParams({ q: query })}`);
    isAdvancedSearchOpen = false;
  };
</script>

<Menu.Item
  value="advanced-search"
  onclick={() => (isAdvancedSearchOpen = true)}
  class="block w-full text-left rounded-base px-3 py-1.5 hover:preset-tonal"
>
  <FontAwesomeIcon icon={faSearch} title="Open menu" class="w-4 inline mr-2" />
  Advanced search
</Menu.Item>

<Dialog open={isAdvancedSearchOpen} onOpenChange={(d) => (isAdvancedSearchOpen = d.open)}>
  <Portal>
    <Dialog.Backdrop class="fixed inset-0 z-50 bg-surface-50-950/50" />
    <Dialog.Positioner class="fixed inset-0 z-50 flex justify-center items-center">
      <Dialog.Content class="w-full max-w-md mx-4">
        <AdvancedSearchModal onClose={() => (isAdvancedSearchOpen = false)} onSubmit={handleSubmit} />
      </Dialog.Content>
    </Dialog.Positioner>
  </Portal>
</Dialog>
