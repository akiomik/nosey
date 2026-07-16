const PREFIX_LENGTH = 9;
const SUFFIX_LENGTH = 8;

export const shortenNostrId = (id: string) =>
  `${id.slice(0, PREFIX_LENGTH)}:${id.slice(-SUFFIX_LENGTH)}`;
