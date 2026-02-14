<template>
  <v-container class="py-8" max-width="1200">
    <v-snackbar
      v-model="snackbarVisible"
      :color="snackbarColor"
      timeout="6000"
      location="bottom right"
    >
      {{ snackbarMessage }}
    </v-snackbar>

    <v-row justify="center">
      <v-col cols="12">
        <div class="text-h5 font-weight-medium mb-2">
          Evidence exploration workspace
        </div>
        <div class="text-body-2 text-medium-emphasis mb-4">
          Enter your thesis and supporting claims, search OpenAlex for relevant
          works, and enrich selected items into your CiteCompass workspace.
        </div>
      </v-col>

      <v-col cols="12" v-if="errorMessage">
        <v-alert
          type="error"
          variant="tonal"
          closable
          @click:close="errorMessage = null"
        >
          {{ errorMessage }}
        </v-alert>
      </v-col>

      <v-col cols="12">
        <ThesisInput
          v-model:thesis="thesis"
          v-model:claims="claimsInput"
        />
      </v-col>

      <v-col cols="12" class="mt-4">
        <v-card variant="outlined" class="bg-white mb-4">
          <v-card-title class="text-subtitle-1 font-weight-medium">
            Search OpenAlex
          </v-card-title>

          <v-card-text>
            <v-row dense>
              <v-col cols="12">
                <v-text-field
                  v-model="searchQuery"
                  label="Query"
                  variant="outlined"
                  density="comfortable"
                  hide-details="auto"
                  placeholder="e.g. ethics of AI in war"
                />
              </v-col>

              <v-col cols="6">
                <v-text-field
                  v-model="searchLimit"
                  type="number"
                  label="Limit"
                  variant="outlined"
                  density="comfortable"
                  hide-details="auto"
                  min="5"
                  max="25"
                />
              </v-col>

              <v-col cols="6" class="d-flex align-center">
                <v-checkbox
                  v-model="searchExcludePreprints"
                  label="Exclude preprints"
                  density="comfortable"
                  hide-details="auto"
                />
              </v-col>

              <v-col cols="6">
                <v-text-field
                  v-model="searchFromYear"
                  type="number"
                  label="From year (optional)"
                  variant="outlined"
                  density="comfortable"
                  hide-details="auto"
                />
              </v-col>

              <v-col cols="6">
                <v-text-field
                  v-model="searchToYear"
                  type="number"
                  label="To year (optional)"
                  variant="outlined"
                  density="comfortable"
                  hide-details="auto"
                />
              </v-col>

              <v-col cols="12" class="d-flex justify-end mt-2">
                <v-btn
                  color="primary"
                  class="me-2"
                  :loading="isSearching"
                  :disabled="!canSearch || isSearching"
                  @click="onSearchOpenAlex"
                >
                  Search
                </v-btn>

                <v-btn
                  color="secondary"
                  variant="elevated"
                  :disabled="!canAddSelectedFromSearch"
                  :loading="isEnriching"
                  @click="onAddSelectedFromSearch"
                >
                  Add selected to workspace
                </v-btn>
              </v-col>
            </v-row>

            <v-divider class="my-4" />

            <div v-if="isSearching" class="d-flex justify-center py-4">
              <v-progress-circular indeterminate color="primary" />
            </div>

            <div v-else>
              <v-table v-if="searchResults.length" density="comfortable">
                <thead>
                  <tr class="text-caption text-medium-emphasis">
                    <th class="text-left" style="width: 40px"></th>
                    <th class="text-left">Title</th>
                    <th class="text-left" style="width: 80px">Year</th>
                    <th class="text-left" style="width: 160px">Venue</th>
                    <th class="text-left" style="width: 80px">Type</th>
                    <th class="text-left" style="width: 90px">Cited by</th>
                    <th class="text-left" style="width: 90px">Review</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="result in searchResults"
                    :key="result.openalex_id"
                    class="text-body-2"
                  >
                    <td>
                      <v-checkbox
                        :model-value="isResultSelected(result)"
                        density="compact"
                        hide-details
                        @update:model-value="(val) => onToggleResultSelected(result, val)"
                      />
                    </td>
                    <td>
                      <a
                        v-if="resolvePrimaryLink(result)"
                        :href="resolvePrimaryLink(result)"
                        target="_blank"
                        rel="noopener"
                        class="text-primary"
                      >
                        {{ result.title }}
                      </a>
                      <span v-else>
                        {{ result.title }}
                      </span>
                    </td>
                    <td>{{ result.year ?? '—' }}</td>
                    <td>{{ result.venue ?? '—' }}</td>
                    <td>
                      <v-chip
                        size="x-small"
                        :color="venueBadgeColor(result.venue_badge)"
                        variant="flat"
                      >
                        {{ result.venue_badge }}
                      </v-chip>
                    </td>
                    <td>{{ result.cited_by_count }}</td>
                    <td>
                      <v-chip
                        v-if="result.needs_review"
                        color="amber"
                        size="x-small"
                        variant="flat"
                      >
                        Needs review
                      </v-chip>
                    </td>
                  </tr>
                </tbody>
              </v-table>

              <div v-else class="text-caption text-medium-emphasis">
                No search results yet. Run a query to see OpenAlex works.
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" class="mt-6" v-if="enrichedSources && enrichedSources.length">
        <div class="d-flex justify-space-between align-center mb-2">
          <div>
            <div class="text-subtitle-1 font-weight-medium">
              Workspace
            </div>
            <div class="text-body-2 text-medium-emphasis">
              Enriched sources currently in your CiteCompass workspace.
            </div>
          </div>

          <v-btn
            color="primary"
            variant="flat"
            :disabled="!canAnalyzeClaims || isAnalyzingClaims"
            :loading="isAnalyzingClaims"
            @click="onAnalyzeClaims"
          >
            Analyze Claims
          </v-btn>
        </div>

        <EnrichedTable :items="enrichedSources" />
      </v-col>

      <v-col
        cols="12"
        class="mt-6"
        v-if="claimAnalysis && claimAnalysis.results.length"
      >
        <v-card variant="outlined" class="bg-white">
          <v-card-title class="text-subtitle-1 font-weight-medium">
            Claim analysis overview
          </v-card-title>

          <v-card-subtitle class="text-body-2 text-medium-emphasis">
            Model {{ claimAnalysis.meta.model }} ·
            {{ claimAnalysis.meta.per_claim_calls }} calls ·
            {{ claimAnalysis.meta.sources_considered }} sources considered
          </v-card-subtitle>

          <v-card-text>
            <v-row dense>
              <v-col
                v-for="claimResult in claimAnalysis.results"
                :key="claimResult.claim"
                cols="12"
                class="mb-4"
              >
                <v-card variant="flat" class="mb-2">
                  <v-card-title
                    class="text-subtitle-1 font-weight-medium d-flex justify-space-between align-center"
                  >
                    <span>{{ claimResult.claim }}</span>

                    <v-btn
                      size="small"
                      variant="text"
                      color="primary"
                      @click="onCopyCourseMatePrompt(claimResult)"
                    >
                      Copy CourseMate Prompt
                    </v-btn>
                  </v-card-title>
                </v-card>

                <v-row dense>
                  <v-col cols="12" md="8">
                    <div class="text-caption text-medium-emphasis mb-1">
                      Supporting evidence
                    </div>

                    <v-row dense>
                      <v-col
                        v-for="hit in claimResult.top_supporting"
                        :key="hit.source_id + '-' + hit.stance + '-' + hit.relevance"
                        cols="12"
                        md="6"
                        class="mb-2"
                      >
                        <v-card variant="outlined" class="h-100">
                          <v-card-text>
                            <div class="d-flex justify-space-between align-center mb-2">
                              <v-chip
                                size="x-small"
                                color="green-darken-1"
                                variant="flat"
                              >
                                {{ hit.stance }}
                              </v-chip>

                              <span class="text-caption text-medium-emphasis">
                                {{ Math.round(hit.relevance * 100) }}% relevance
                              </span>
                            </div>

                            <div class="text-body-2 mb-2">
                              <span
                                v-for="(sentence, index) in hit.evidence_sentences"
                                :key="index"
                              >
                                “{{ sentence }}”<span
                                  v-if="index < hit.evidence_sentences.length - 1"
                                >
                                  &nbsp;
                                </span>
                              </span>
                            </div>

                            <div class="text-caption text-medium-emphasis mb-1">
                              APA citation
                            </div>
                            <div class="text-body-2">
                              {{ hit.apa }}
                            </div>
                          </v-card-text>
                        </v-card>
                      </v-col>
                    </v-row>
                  </v-col>

                  <v-col cols="12" md="4">
                    <div class="text-caption text-medium-emphasis mb-1">
                      Counter evidence
                    </div>

                    <v-card
                      v-if="claimResult.top_counter.length"
                      variant="outlined"
                    >
                      <v-card-text>
                        <div class="d-flex justify-space-between align-center mb-2">
                          <v-chip
                            size="x-small"
                            color="red-darken-1"
                            variant="flat"
                          >
                            {{ claimResult.top_counter[0].stance }}
                          </v-chip>

                          <span class="text-caption text-medium-emphasis">
                            {{ Math.round(
                              claimResult.top_counter[0].relevance * 100,
                            ) }}% relevance
                          </span>
                        </div>

                        <div class="text-body-2 mb-2">
                          <span
                            v-for="(sentence, index) in claimResult.top_counter[0]
                              .evidence_sentences"
                            :key="index"
                          >
                            “{{ sentence }}”<span
                              v-if="
                                index <
                                claimResult.top_counter[0].evidence_sentences
                                  .length - 1
                              "
                            >
                              &nbsp;
                            </span>
                          </span>
                        </div>

                        <div class="text-caption text-medium-emphasis mb-1">
                          APA citation
                        </div>
                        <div class="text-body-2">
                          {{ claimResult.top_counter[0].apa }}
                        </div>
                      </v-card-text>
                    </v-card>

                    <div
                      v-else
                      class="text-caption text-medium-emphasis mt-2"
                    >
                      No strong counter evidence identified.
                    </div>
                  </v-col>
                </v-row>

                <v-divider class="my-4" />
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import ThesisInput from '../components/ThesisInput.vue';
import EnrichedTable from '../components/EnrichedTable.vue';
import {
  enrichSources,
  type ParsedSource,
  type EnrichedSource,
  searchOpenAlex,
  type SearchResult,
  analyzeClaims,
  type ClaimAnalyzeResponse,
} from '../api/evidenceApi';

const thesis = ref('');
const claimsInput = ref('');

const searchQuery = ref('');
const searchLimit = ref(15);
const searchFromYear = ref<number | null>(null);
const searchToYear = ref<number | null>(null);
const searchExcludePreprints = ref(true);
const searchResults = ref<SearchResult[]>([]);
const selectedSearchResults = ref<SearchResult[]>([]);

const enrichedSources = ref<EnrichedSource[] | null>(null);

const claimAnalysis = ref<ClaimAnalyzeResponse | null>(null);

const isEnriching = ref(false);
const isSearching = ref(false);
const errorMessage = ref<string | null>(null);
const isAnalyzingClaims = ref(false);

const snackbarVisible = ref(false);
const snackbarMessage = ref('');
const snackbarColor = ref<'success' | 'error'>('error');

type ClaimResult = ClaimAnalyzeResponse['results'][number];

const canSearch = computed(() => searchQuery.value.trim().length > 0);

const canAddSelectedFromSearch = computed(
  () => selectedSearchResults.value.length > 0 && !isEnriching.value,
);

const canAnalyzeClaims = computed(() => {
  if (!thesis.value.trim()) {
    return false;
  }

  const claims = buildClaimsArray(claimsInput.value);
  if (claims.length === 0) {
    return false;
  }

  return !!enrichedSources.value && enrichedSources.value.length > 0;
});

function normaliseLimit(value: number): number {
  if (!Number.isFinite(value)) {
    return 15;
  }
  return Math.min(25, Math.max(5, Math.trunc(value)));
}

async function onSearchOpenAlex(): Promise<void> {
  if (!canSearch.value) {
    return;
  }

  errorMessage.value = null;
  isSearching.value = true;
  selectedSearchResults.value = [];

  try {
    const limit = normaliseLimit(searchLimit.value);

    const response = await searchOpenAlex({
      query: searchQuery.value.trim(),
      limit,
      exclude_preprints: searchExcludePreprints.value,
      from_year: searchFromYear.value === null ? undefined : searchFromYear.value,
      to_year: searchToYear.value === null ? undefined : searchToYear.value,
    });

    searchResults.value = response.results;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to search OpenAlex.';
    errorMessage.value = message;
    searchResults.value = [];
  } finally {
    isSearching.value = false;
  }
}

function buildClaimsArray(raw: string): string[] {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function mapSearchResultToParsedSource(result: SearchResult): ParsedSource {
  return {
    id: result.openalex_id,
    raw: result.title,
    title_guess: result.title,
    doi: result.doi,
    url: result.url,
  };
}

async function onAddSelectedFromSearch(): Promise<void> {
  if (selectedSearchResults.value.length === 0) {
    return;
  }

  errorMessage.value = null;
  isEnriching.value = true;

  try {
    const parsedFromSearch = selectedSearchResults.value.map((result) =>
      mapSearchResultToParsedSource(result),
    );

    const newlyEnriched = await enrichSources(parsedFromSearch);

    const existing = enrichedSources.value ?? [];
    const merged: EnrichedSource[] = [...existing];

    for (const item of newlyEnriched) {
      if (!merged.some((existingItem) => existingItem.id === item.id)) {
        merged.push(item);
      }
    }

    enrichedSources.value = merged;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Failed to enrich selected OpenAlex results.';
    errorMessage.value = message;
  } finally {
    isEnriching.value = false;
  }
}

async function onAnalyzeClaims(): Promise<void> {
  if (!canAnalyzeClaims.value || !enrichedSources.value) {
    return;
  }

  isAnalyzingClaims.value = true;
  claimAnalysis.value = null;

  try {
    const claims = buildClaimsArray(claimsInput.value);

    const sourcesPayload = enrichedSources.value.map((source) => ({
      id: source.id,
      openalex_id: source.openalexId,
      doi: source.doi,
      url: source.url ?? undefined,
      title: source.title,
      authors: source.authors,
      year: source.year,
      venue: source.venue,
      cited_by_count: source.citedBy,
      abstract: source.abstract,
      needs_review: source.needsReview,
      apa: source.apaCitation,
      apa_incomplete: source.apaIncomplete,
      apa_missing: source.apaMissing,
    }));

    const response = await analyzeClaims({
      thesis: thesis.value.trim(),
      claims,
      sources: sourcesPayload,
    });

    claimAnalysis.value = response;
  } catch (error) {
    snackbarMessage.value =
      error instanceof Error ? error.message : 'Failed to analyze claims.';
    snackbarColor.value = 'error';
    snackbarVisible.value = true;
  } finally {
    isAnalyzingClaims.value = false;
  }
}

async function onCopyCourseMatePrompt(result: ClaimResult): Promise<void> {
  if (!claimAnalysis.value) {
    return;
  }

  const lines: string[] = [];

  lines.push('Thesis:');
  lines.push(thesis.value.trim());
  lines.push('');
  lines.push('Claim:');
  lines.push(result.claim);
  lines.push('');

  lines.push('Supporting evidence:');
  if (result.top_supporting.length === 0) {
    lines.push('- (no supporting evidence found)');
  } else {
    for (const hit of result.top_supporting) {
      lines.push(`- APA: ${hit.apa}`);
      lines.push('  Evidence sentences:');
      for (const sentence of hit.evidence_sentences) {
        lines.push(`    - "${sentence}"`);
      }
      lines.push('');
    }
  }

  lines.push('Counter evidence:');
  if (result.top_counter.length === 0) {
    lines.push('- (no counter evidence found)');
  } else {
    const hit = result.top_counter[0];
    lines.push(`- APA: ${hit.apa}`);
    lines.push('  Evidence sentences:');
    for (const sentence of hit.evidence_sentences) {
      lines.push(`    - "${sentence}"`);
    }
  }

  lines.push('');
  lines.push(
    'Instruction: Explain to a student whether the claim is supported using ONLY the quoted evidence sentences. Do not invent citations.',
  );

  const prompt = lines.join('\n');

  try {
    if (!navigator.clipboard || !navigator.clipboard.writeText) {
      throw new Error('Clipboard API is not available in this browser.');
    }

    await navigator.clipboard.writeText(prompt);
    snackbarMessage.value = 'CourseMate prompt copied to clipboard.';
    snackbarColor.value = 'success';
    snackbarVisible.value = true;
  } catch (error) {
    snackbarMessage.value =
      error instanceof Error
        ? error.message
        : 'Failed to copy prompt to clipboard.';
    snackbarColor.value = 'error';
    snackbarVisible.value = true;
  }
}

function resolvePrimaryLink(result: SearchResult): string | null {
  if (result.doi && result.doi.trim().length > 0) {
    return `https://doi.org/${result.doi}`;
  }

  if (result.url && result.url.trim().length > 0) {
    return result.url;
  }

  return null;
}

function venueBadgeColor(badge: SearchResult['venue_badge']): string {
  switch (badge) {
    case 'Journal/Conference':
      return 'primary';
    case 'Preprint':
      return 'purple';
    default:
      return 'grey';
  }
}

function isResultSelected(result: SearchResult): boolean {
  return selectedSearchResults.value.some(
    (item) => item.openalex_id === result.openalex_id,
  );
}

function onToggleResultSelected(result: SearchResult, selected: boolean): void {
  if (selected) {
    if (!isResultSelected(result)) {
      selectedSearchResults.value = [...selectedSearchResults.value, result];
    }
  } else {
    selectedSearchResults.value = selectedSearchResults.value.filter(
      (item) => item.openalex_id !== result.openalex_id,
    );
  }
}
</script>
