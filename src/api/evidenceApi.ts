export const API_BASE_URL = 'https://gmu-hack-functions2.azurewebsites.net';

// Types aligned with backend models (see backend/src/models/types.ts)

export interface ParsedSource {
  id: string;
  raw: string;
  title_guess: string;
  doi?: string;
  url?: string;
}


// UI-focused enriched source shape (superset of backend fields we care about)
export interface EnrichedSource {
  id: string;
  title: string;
  year?: number;
  venue?: string;
  citedBy: number;
  needsReview: boolean;
  apaCitation: string;
  doiUrl: string | null;

  // Additional metadata used for claims analysis and display
  openalexId?: string;
  doi?: string;
  url?: string;
  authors: string[];
  abstract: string | null;
  apaIncomplete: boolean;
  apaMissing: string[];
}

// Backend enriched source returned by the API
interface BackendEnrichedSource {
  id: string;
  openalex_id?: string;
  doi?: string;
  url?: string;
  title: string;
  authors: string[];
  year?: number;
  venue?: string;
  cited_by_count: number;
  abstract: string | null;
  needs_review: boolean;
  apa: string;
  apa_incomplete: boolean;
  apa_missing: string[];
}

interface EnrichStats {
  input_count: number;
  enriched_count: number;
  with_abstract: number;
  needs_review_count: number;
}

interface EnrichResult {
  enriched: BackendEnrichedSource[];
  stats: EnrichStats;
}

// Claims analysis types
export type {
  ClaimAnalyzeRequest,
  ClaimAnalyzeResponse,
} from '../types/claims';

// Search types
export type SearchResult = {
  openalex_id: string;
  title: string;
  year?: number;
  venue?: string;
  venue_badge: 'Journal/Conference' | 'Preprint' | 'Unknown';
  doi?: string;
  url?: string;
  authors: string[];
  cited_by_count: number;
  abstract: string | null;
  needs_review: boolean;
};

export type SearchResponse = {
  results: SearchResult[];
  suggested?: SearchResult[];
  meta?: any;
  stats: {
    query: string;
    returned: number;
  };
};

// Suggestions resolve types
export interface SuggestionsResolveResponse {
  suggested: SearchResult[];
  unresolved_lines: string[];
}

async function request<TResponse>(path: string, body: unknown): Promise<TResponse> {
  const url = new URL(path, API_BASE_URL).toString();

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let message = 'Request failed.';
    let body: unknown;
    try {
      body = (await response.json()) as { error?: string; message?: string };
      const data = body as { error?: string; message?: string };
      if (data.error) {
        message = data.error;
      } else if (data.message) {
        message = data.message;
      }
    } catch {
      message = `Request failed with status ${response.status}`;
    }
    const error = new Error(message) as Error & { status?: number; body?: unknown };
    error.status = response.status;
    error.body = body;
    throw error;
  }

  return (await response.json()) as TResponse;
}

export async function enrichSources(
  parsedSources: ParsedSource[],
): Promise<EnrichedSource[]> {
  const backendBody = {
    sources: parsedSources,
  };

  const result = await request<EnrichResult>('/api/sources/enrich', backendBody);

  return result.enriched.map((item) => mapBackendEnrichedToUi(item));
}

export async function searchOpenAlex(params: {
  query: string;
  limit?: number;
  exclude_preprints?: boolean;
  from_year?: number;
  to_year?: number;
}): Promise<SearchResponse> {
  return await request<SearchResponse>('/api/search/openalex', params);
}

export async function resolveSuggestions(body: {
  items: string[];
}): Promise<SuggestionsResolveResponse> {
  return await request<SuggestionsResolveResponse>(
    '/api/suggestions/resolve',
    body,
  );
}

export async function analyzeClaims(
  payload: import('../types/claims').ClaimAnalyzeRequest,
): Promise<import('../types/claims').ClaimAnalyzeResponse> {
  return await request<import('../types/claims').ClaimAnalyzeResponse>(
    '/api/claims/analyze',
    payload,
  );
}

function mapBackendEnrichedToUi(item: BackendEnrichedSource): EnrichedSource {
  let doiUrl: string | null = null;
  if (item.url && item.url.trim().length > 0) {
    doiUrl = item.url;
  } else if (item.doi && item.doi.trim().length > 0) {
    doiUrl = `https://doi.org/${item.doi}`;
  }

  return {
    id: item.id,
    title: item.title,
    year: item.year,
    venue: item.venue,
    citedBy: item.cited_by_count,
    needsReview: item.needs_review,
    apaCitation: item.apa,
    doiUrl,
    openalexId: item.openalex_id,
    doi: item.doi,
    url: item.url,
    authors: item.authors,
    abstract: item.abstract,
    apaIncomplete: item.apa_incomplete,
    apaMissing: item.apa_missing,
  };
}
