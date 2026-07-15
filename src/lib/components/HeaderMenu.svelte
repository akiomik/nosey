<script lang="ts">
  import { faBars, faSearch } from '@fortawesome/free-solid-svg-icons';
  import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
  import { Dialog, Menu, Portal } from '@skeletonlabs/skeleton-svelte';
  import { goto } from '$app/navigation';
  import type { SearchFilters } from '$lib/search/filters';
  import { searchTextCodec } from '$lib/search/text';
  import AdvancedSearchModal from './AdvancedSearchModal.svelte';

  let isMenuOpen = $state(false);
  let isAdvancedSearchOpen = $state(false);

  const handleSubmit = (filters: SearchFilters) => {
    const query = searchTextCodec.encode(filters);
    goto(`/?${new URLSearchParams({ q: query })}`);
    isAdvancedSearchOpen = false;
  };
</script>

<Menu
  positioning={{ placement: 'bottom' }}
  open={isMenuOpen}
  onOpenChange={(d) => (isMenuOpen = d.open)}
>
  <Menu.Trigger class="btn-icon">
    <FontAwesomeIcon icon={faBars} title="Open menu" class="w-4" />
  </Menu.Trigger>
  <Portal>
    <Menu.Positioner>
      <Menu.Content class="card preset-tonal-surface p-2 w-52 z-20 shadow space-y-1">
        <Menu.Item
          value="advanced-search"
          onclick={() => (isAdvancedSearchOpen = true)}
          class="block w-full text-left rounded-base px-3 py-1.5 hover:preset-tonal"
        >
          <FontAwesomeIcon icon={faSearch} title="Open menu" class="w-4 inline mr-2" />
          Advanced search
        </Menu.Item>
      </Menu.Content>
    </Menu.Positioner>
  </Portal>

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
</Menu>
