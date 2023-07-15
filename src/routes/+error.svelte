<script>
  import { page } from '$app/stores';
  import Alert from '$lib/components/Alert.svelte';
</script>

<Alert variant="error">
  <h2>Error</h2>
  <p>{JSON.stringify($page.error)}</p>
</Alert>
