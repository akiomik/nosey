<script lang="ts">
  import { autocomplete } from '$lib/actions/autocomplete.svelte';
  import type { AdvancedSearchFormData } from '$lib/types';

  interface Props {
    onClose: () => void;
    onSubmit: (form: AdvancedSearchFormData) => void;
  }

  let { onClose, onSubmit }: Props = $props();

  // TODO: Support current query
  const formData: AdvancedSearchFormData = $state({
    keyword: '',
    from: '',
    since: '',
    until: '',
  });

  const handleFormSubmit = (e: Event) => {
    e.preventDefault();
    onSubmit(formData);
  };
</script>

<div class="card preset-tonal-surface p-4 w-full max-w-md shadow-xl space-y-4">
  <header class="text-2xl font-bold">Advanced search</header>

  <form class="p-4 space-y-4 rounded-container" onsubmit={handleFormSubmit}>
    <label class="label">
      <span>Keywords</span>
      <input
        class="input"
        type="text"
        bind:value={formData.keyword}
        placeholder="All of these words"
      />
    </label>
    <label class="label">
      <span>Author</span>
      <div class="relative w-full">
        <input
          class="input"
          type="text"
          bind:value={formData.from}
          placeholder="npub1..."
          use:autocomplete={{
            relays: ['wss://search.nos.today', 'wss://relay.nostr.band'],
            prefix: '',
          }}
        />
      </div>
    </label>
    <label class="label">
      <span>Since</span>
      <input class="input" type="date" bind:value={formData.since} placeholder="YYYY-MM-DD" />
    </label>
    <label class="label">
      <span>Until</span>
      <input class="input" type="date" bind:value={formData.until} placeholder="YYYY-MM-DD" />
    </label>

    <button type="submit" class="hidden">Submit</button>
  </form>

  <footer class="modal-footer flex justify-end gap-2">
    <button type="button" class="btn preset-tonal" onclick={onClose}>Cancel</button>
    <button type="button" class="btn preset-filled" onclick={handleFormSubmit}>Search</button>
  </footer>
</div>
