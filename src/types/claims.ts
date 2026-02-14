export interface EnrichedSource {
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

export interface ProquestEvidenceItem {
  title?: string;
  doi?: string;
  url: string;
  abstract: string;
}

export interface ClaimAnalyzeRequest {
  thesis: string;
  claims: string[];
  sources: EnrichedSource[];
  proquestEvidence?: ProquestEvidenceItem[];
}

export type ClaimStance = 'supports' | 'opposes' | 'mixed' | 'irrelevant';

export interface EvidenceHit {
  source_id: string;
  apa: string;
  relevance: number;
  stance: ClaimStance;
  evidence_sentences: string[];
  source_kind?: 'openalex' | 'proquest';
}

export interface ClaimResult {
  claim: string;
  top_supporting: EvidenceHit[];
  top_counter: EvidenceHit[];
}

export interface ClaimAnalyzeResponse {
  thesis: string;
  results: ClaimResult[];
  meta: {
    model: string;
    per_claim_calls: number;
    sources_considered: number;
  };
}
