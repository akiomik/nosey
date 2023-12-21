<script lang="ts">
  import type { SvelteComponent } from 'svelte';
  import { getModalStore } from '@skeletonlabs/skeleton';

  export let parent: SvelteComponent;

  const modalStore = getModalStore();

  // TODO: Support current query
  const formData = {
    keyword: undefined,
    from: undefined,
    since: undefined,
    until: undefined,
  };

  const onFormSubmit = (e) => {
    e.preventDefault();

    if ($modalStore[0].response) {
      $modalStore[0].response(formData);
    }

    modalStore.close();
  };
</script>

{#if $modalStore[0]}
  <div class="card p-4 w-modal shadow-xl space-y-4">
    <header class="text-2xl font-bold">Advanced search</header>

    <form class="p-4 space-y-4 rounded-container-token" on:submit={onFormSubmit}>
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
        <!-- TODO: Add autocompletion support -->
        <input class="input" type="text" bind:value={formData.from} placeholder="npub1..." />
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

    <footer class="modal-footer {parent.regionFooter}">
      <button class="btn {parent.buttonNeutral}" on:click={parent.onClose}>
        {parent.buttonTextCancel}
      </button>
      <button class="btn {parent.buttonPositive}" on:click={onFormSubmit}>Search</button>
    </footer>
  </div>
{/if}
