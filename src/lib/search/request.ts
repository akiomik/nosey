import { z } from 'zod';
import { hasSearchFilter, type SearchFilters, SearchFiltersSchema } from './filters';

const searchSelector = (request: SearchApiRequest): boolean =>
  hasSearchFilter(request) || request.kind !== undefined;

export const SearchApiRequestSchema = SearchFiltersSchema.extend({
  kind: z.number().int().nonnegative().optional(),
  limit: z.number().int().positive().max(100).optional(),
  sort: z.enum(['time', 'relevance']).optional(),
  page: z.number().int().positive().optional(),
}).superRefine((request, ctx) => {
  if (!searchSelector(request)) {
    ctx.addIssue({
      code: 'custom',
      message: 'At least one search parameter is required',
    });
  }
});

export type SearchApiRequest = z.output<typeof SearchApiRequestSchema>;

const RoutePageSchema = z.number().int().nonnegative();

export const createNoteSearchRequest = (filters: SearchFilters, page: number): SearchApiRequest =>
  SearchApiRequestSchema.parse({
    ...filters,
    kind: 1,
    limit: 100,
    sort: 'time',
    page: RoutePageSchema.parse(page) + 1,
  });

export const createProfileSuggestionRequest = (query: string, limit: number): SearchApiRequest =>
  SearchApiRequestSchema.parse({
    query: query.trim(),
    kind: 0,
    limit,
  });
