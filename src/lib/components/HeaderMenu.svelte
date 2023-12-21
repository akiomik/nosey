<script lang="ts">
  import { getModalStore } from '@skeletonlabs/skeleton';
  import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
  import { faSearch } from '@fortawesome/free-solid-svg-icons';
  import { goto } from '$app/navigation';
  import { buildQuery } from '$lib/helpers/buildQuery';

  export let popupId: string;

  const modalStore = getModalStore();
  const showAdvancedSearchModal = () => {
    modalStore.trigger({
      type: 'component',
      component: 'advancedSearch',
      response: (form) => {
        console.debug('advanced search', form);

        if (!form) {
          return;
        }

        const query = buildQuery(form);
        goto(`/?${new URLSearchParams({ q: query })}`);
      },
    });
  };
</script>

<div class="card p-2 w-52 z-10 shadow" data-popup={popupId}>
  <ul class="list-nav">
    <li>
      <button class="w-full" on:click={showAdvancedSearchModal}>
        <FontAwesomeIcon icon={faSearch} title="Open menu" class="w-4 inline mr-2" />
        Advanced search
      </button>
    </li>
  </ul>
</div>
