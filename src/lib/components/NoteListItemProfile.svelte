<script lang="ts">
  import { Avatar } from '@skeletonlabs/skeleton';
  import type * as Nostr from 'nostr-typedef';

  export let profile: Nostr.Event | undefined = undefined;
  export let pubkey: string;

  const shorten = (id: string) => `${id.substring(0, 9)}:${id.substring(id.length - 8, id.length)}`;

  $: content = profile ? JSON.parse(profile.content) : undefined;
  $: name = content?.display_name ?? content?.name ?? shorten(pubkey);
</script>

<div class="flex items-center">
  <div class="mr-2">
    <Avatar src={content?.picture} initials="NO" alt="Profile picture of {name}" />
  </div>

  <div class="text-ellipsis overflow-hidden">
    <p class="font-bold text-ellipsis overflow-hidden">
      {name}
    </p>
  </div>
</div>
