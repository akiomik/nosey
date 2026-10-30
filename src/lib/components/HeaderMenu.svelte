<script lang="ts">
  import { faBars, faSearch } from '@fortawesome/free-solid-svg-icons';
  import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
  import { Dialog, Menu, Portal } from '@skeletonlabs/skeleton-svelte';
  import type { SearchFilters } from '#lib/search/filters.ts';
  import { searchTextCodec } from '#lib/search/text.ts';
  import { goto } from '$app/navigation';
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
      <Menu.Content class="card preset-tonal-surface z-20 w-52 space-y-1 p-2 shadow">
        <Menu.Item
          value="advanced-search"
          onclick={() => (isAdvancedSearchOpen = true)}
          class="rounded-base hover:preset-tonal block w-full px-3 py-1.5 text-left"
        >
          <FontAwesomeIcon icon={faSearch} title="Open menu" class="mr-2 inline w-4" />
          Advanced search
        </Menu.Item>
      </Menu.Content>
    </Menu.Positioner>
  </Portal>

  <Dialog open={isAdvancedSearchOpen} onOpenChange={(d) => (isAdvancedSearchOpen = d.open)}>
    <Portal>
      <Dialog.Backdrop class="bg-surface-50-950/50 fixed inset-0 z-50" />
      <Dialog.Positioner class="fixed inset-0 z-50 flex items-center justify-center">
        <Dialog.Content class="mx-4 w-full max-w-md">
          <AdvancedSearchModal onClose={() => (isAdvancedSearchOpen = false)} onSubmit={handleSubmit} />
        </Dialog.Content>
      </Dialog.Positioner>
    </Portal>
  </Dialog>
</Menu>
