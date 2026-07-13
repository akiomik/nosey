<script lang="ts">
  import { faSearch } from '@fortawesome/free-solid-svg-icons';
  import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
  import { Dialog, Portal } from '@skeletonlabs/skeleton-svelte';
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

<div class="card preset-filled-surface-100-900 p-2 w-52 z-20 shadow">
  <ul class="list-nav">
    <li>
      <Dialog open={isAdvancedSearchOpen} onOpenChange={(d) => (isAdvancedSearchOpen = d.open)}>
        <Dialog.Trigger class="w-full">
          <FontAwesomeIcon icon={faSearch} title="Open menu" class="w-4 inline mr-2" />
          Advanced search
        </Dialog.Trigger>
        <Portal>
          <Dialog.Backdrop class="fixed inset-0 z-50 bg-surface-50-950/50" />
          <Dialog.Positioner class="fixed inset-0 z-50 flex justify-center items-center">
            <Dialog.Content>
              <AdvancedSearchModal
                onClose={() => (isAdvancedSearchOpen = false)}
                onSubmit={handleSubmit}
              />
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog>
    </li>
  </ul>
</div>
