<script lang="ts">
  import { Avatar } from '@skeletonlabs/skeleton';
  import type { Profile } from '$lib/types';

  export let profile: Profile | undefined = undefined;
  export let pubkey: string;

  const shorten = (id: string) => `${id.substring(0, 9)}:${id.substring(id.length - 8, id.length)}`;
  const name = profile ? profile?.display_name ?? profile?.name ?? 'nostrich' : shorten(pubkey);
</script>

<div class="flex items-center">
  <div class="mr-2">
    <Avatar initials="NO" alt="Profile picture of {name}" />
  </div>

  <div class="text-ellipsis overflow-hidden">
    <p class="font-bold text-ellipsis overflow-hidden">
      {name}
    </p>
  </div>
</div>
