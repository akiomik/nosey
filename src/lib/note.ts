const LONG_CONTENT_THRESHOLD = 500;
const IMAGE_URL_PATTERN = /https?:\/\/\S+\.(?:jpe?g|png|gif|webp)\b/i;

export const transformNoteContent = (content: string | undefined) =>
  content
    ?.replaceAll(/nostr:npub1([a-z0-9]{58})/g, '@npub1$1')
    ?.replaceAll(/nostr:nprofile1([a-z0-9]{61,})/g, '@nprofile1$1')
    ?.replaceAll(/nostr:note1([a-z0-9]{58})/g, '@note1$1')
    ?.replaceAll(/nostr:nevent1([a-z0-9]{70,})/g, '@nevent1$1');

export const isNoteContentDefinitelyLong = (content: string | undefined) =>
  (transformNoteContent(content)?.length ?? 0) > LONG_CONTENT_THRESHOLD;

export const hasInlineImageUrl = (content: string | undefined) =>
  IMAGE_URL_PATTERN.test(content ?? '');
