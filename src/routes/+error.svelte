<script>
  import Alert from '#lib/components/Alert.svelte';
  import { page } from '$app/state';
</script>

<Alert variant="error">
  <h2>Error</h2>
  <p>{JSON.stringify(page.error)}</p>
</Alert>
