import type * as Nostr from 'nostr-typedef';
import {
  catchError,
  distinctUntilChanged,
  EMPTY,
  map,
  Observable,
  retry,
  Subject,
  switchMap,
  TimeoutError,
  timeout,
  timer,
} from 'rxjs';
import { type Readable, writable } from 'svelte/store';
import { HttpTooManyRequestsError } from '$lib/errors';
import {
  formatNip05Identifier,
  NostrProfileContentSchema,
  type NostrProfileMetadata,
} from '$lib/search/nostr';
import { rateLimitedSearch } from '$lib/search/rate-limited';
import { createProfileSuggestionRequest } from '$lib/search/request';
import type { SearchResult } from '$lib/search/result';
import type { MentionItem } from '$lib/types';

const MENU_ITEM_LIMIT = 10;
const SEARCH_DEBOUNCE_MS = 250;
const RATE_LIMIT_MAX_RETRIES = 3;
const RATE_LIMIT_RETRY_DELAY_MS = 1_000;
const SEARCH_TIMEOUT_MS = 5_000;
const emptyProfileMetadata: NostrProfileMetadata = {
  name: '',
  display_name: '',
  picture: '',
  nip05: '',
};

export type ProfileSuggestionsState = {
  loading: boolean;
  items: MentionItem[];
  error: 'timeout' | 'unavailable' | null;
};

export type ProfileSuggestions = Readable<ProfileSuggestionsState> & {
  search: (query: string) => void;
  cancel: () => void;
  destroy: () => void;
};

type ProfileSearch = (query: string, signal: AbortSignal) => Promise<SearchResult>;

type Options = Partial<{
  search: ProfileSearch;
  debounceMs: number;
  maxRetries: number;
  timeoutMs: number;
}>;

const initialState: ProfileSuggestionsState = { loading: false, items: [], error: null };

const retryOnRateLimit = (error: unknown): Observable<number> => {
  if (error instanceof HttpTooManyRequestsError) {
    return timer(
      Math.max(error.retryAfterMs ?? RATE_LIMIT_RETRY_DELAY_MS, RATE_LIMIT_RETRY_DELAY_MS)
    );
  }

  throw error;
};

const parseMentionItem = (pubkey: string, content: string): MentionItem => {
  const profile = NostrProfileContentSchema.safeParse(content);
  const {
    name,
    display_name: displayName,
    picture,
    nip05,
  } = profile.success ? profile.data : emptyProfileMetadata;

  return {
    pubkey,
    content,
    name: name || displayName || pubkey,
    picture,
    nip05: formatNip05Identifier(nip05),
  };
};

const defaultSearch: ProfileSearch = (query, signal) =>
  rateLimitedSearch(createProfileSuggestionRequest(query, MENU_ITEM_LIMIT), signal);

const fetchProfiles = (query: string, search: ProfileSearch): Observable<SearchResult> =>
  new Observable<SearchResult>((subscriber) => {
    const controller = new AbortController();

    search(query, controller.signal)
      .then((result) => {
        subscriber.next(result);
        subscriber.complete();
      })
      .catch((error) => subscriber.error(error));

    return () => controller.abort();
  });

export const profileSuggestions = (options: Options = {}): ProfileSuggestions => {
  const search = options.search ?? defaultSearch;
  const debounceMs = options.debounceMs ?? SEARCH_DEBOUNCE_MS;
  const maxRetries = options.maxRetries ?? RATE_LIMIT_MAX_RETRIES;
  const timeoutMs = options.timeoutMs ?? SEARCH_TIMEOUT_MS;
  const state = writable<ProfileSuggestionsState>(initialState);
  const query$ = new Subject<string | null>();

  const subscription = query$
    .pipe(
      distinctUntilChanged(),
      switchMap((query) => {
        if (query === null) {
          state.set(initialState);
          return EMPTY;
        }

        if (query === '') {
          state.set(initialState);
          return EMPTY;
        }

        state.set({ loading: true, items: [], error: null });
        return timer(debounceMs).pipe(
          switchMap(() =>
            fetchProfiles(query, search).pipe(
              timeout({ first: timeoutMs }),
              retry({ count: maxRetries, delay: retryOnRateLimit })
            )
          ),
          map((result) =>
            result.data
              .map(({ pubkey, content }: Nostr.Event) => parseMentionItem(pubkey, content))
              .slice(0, MENU_ITEM_LIMIT)
          ),
          catchError((error: unknown) => {
            state.set({
              loading: false,
              items: [],
              error: error instanceof TimeoutError ? 'timeout' : 'unavailable',
            });
            return EMPTY;
          })
        );
      })
    )
    .subscribe((items) => state.set({ loading: false, items, error: null }));

  return {
    subscribe: state.subscribe,
    search: (query) => query$.next(query),
    cancel: () => query$.next(null),
    destroy: () => {
      query$.complete();
      subscription.unsubscribe();
    },
  };
};
