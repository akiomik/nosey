<script lang="ts">
  import { autocomplete } from '$lib/actions/autocomplete.svelte';
  import type { SearchFilters } from '$lib/search/filters';
  import { type AdvancedSearchFormData, AdvancedSearchFormSchema } from './AdvancedSearchModal.form';

  interface Props {
    onClose: () => void;
    onSubmit: (filters: SearchFilters) => void;
  }

  let { onClose, onSubmit }: Props = $props();

  // TODO: Support current query
  const formData: AdvancedSearchFormData = $state({
    keyword: '',
    from: '',
    since: '',
    until: '',
  });
  let fieldErrors = $state<Partial<Record<keyof AdvancedSearchFormData, string[]>>>({});

  const formFieldNames = new Set<keyof AdvancedSearchFormData>(['keyword', 'from', 'since', 'until']);
  const isFormField = (field: unknown): field is keyof AdvancedSearchFormData =>
    typeof field === 'string' && formFieldNames.has(field as keyof AdvancedSearchFormData);

  const toFieldErrors = (issues: readonly { path: PropertyKey[]; message: string }[]) => {
    const errors: Partial<Record<keyof AdvancedSearchFormData, string[]>> = {};
    for (const issue of issues) {
      const field = issue.path[0];
      if (!isFormField(field)) {
        continue;
      }

      errors[field] = [...(errors[field] ?? []), issue.message];
    }
    return errors;
  };

  const handleFormSubmit = (e: Event) => {
    e.preventDefault();
    const result = AdvancedSearchFormSchema.safeParse(formData);
    if (!result.success) {
      fieldErrors = toFieldErrors(result.error.issues);
      return;
    }

    fieldErrors = {};
    onSubmit(result.data);
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
      {#if fieldErrors.keyword}
        <span class="text-error-500 text-sm">{fieldErrors.keyword[0]}</span>
      {/if}
    </label>
    <label class="label">
      <span>Author</span>
      <div class="relative w-full">
        <input
          class="input"
          type="text"
          bind:value={formData.from}
          placeholder="npub1..."
          use:autocomplete={{ prefix: '' }}
        />
      </div>
      {#if fieldErrors.from}
        <span class="text-error-500 text-sm">{fieldErrors.from[0]}</span>
      {/if}
    </label>
    <label class="label">
      <span>Since</span>
      <input class="input" type="date" bind:value={formData.since} placeholder="YYYY-MM-DD" />
      {#if fieldErrors.since}
        <span class="text-error-500 text-sm">{fieldErrors.since[0]}</span>
      {/if}
    </label>
    <label class="label">
      <span>Until</span>
      <input class="input" type="date" bind:value={formData.until} placeholder="YYYY-MM-DD" />
      {#if fieldErrors.until}
        <span class="text-error-500 text-sm">{fieldErrors.until[0]}</span>
      {/if}
    </label>

    <button type="submit" class="hidden">Submit</button>
  </form>

  <footer class="modal-footer flex justify-end gap-2">
    <button type="button" class="btn preset-tonal" onclick={onClose}>Cancel</button>
    <button type="button" class="btn preset-filled" onclick={handleFormSubmit}>Search</button>
  </footer>
</div>
