<script lang="ts">
  import { faCircleCheck, faCircleXmark } from '@fortawesome/free-solid-svg-icons';
  import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
  import { splitIdentifier, verifyNip05 } from '$lib/nip05';

  interface Props {
    pubkey: string;
    nip05: string;
  }

  let { pubkey, nip05 }: Props = $props();

  type Status = 'pending' | 'verified' | 'failed';
  let status = $state<Status>('pending');
  let domain = $derived(nip05 ? splitIdentifier(nip05).domain : '');

  $effect(() => {
    // Re-read here (not just in the async callback below) so `$effect`
    // re-runs whenever `pubkey`/`nip05` change.
    const currentPubkey = pubkey;
    const currentNip05 = nip05;
    status = 'pending';

    if (!currentNip05) {
      return;
    }

    let cancelled = false;
    verifyNip05(currentPubkey, currentNip05).then((verified) => {
      if (!cancelled) {
        status = verified ? 'verified' : 'failed';
      }
    });

    return () => {
      cancelled = true;
    };
  });
</script>

{#if status === 'verified'}
  <span title="Verified: this account owns {domain}">
    <FontAwesomeIcon icon={faCircleCheck} class="text-primary-500 shrink-0" />
  </span>
{:else if status === 'failed'}
  <span title="Could not verify this account owns {domain}">
    <FontAwesomeIcon icon={faCircleXmark} class="text-error-500 shrink-0" />
  </span>
{/if}
