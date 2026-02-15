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
        <div class="text-h5 font-weight-medium mb-1" style="color: #004221">
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

      <v-col cols="12" class="mt-4 mb-0 pb-0">
        <v-tabs
          :model-value="activeStep"
          @update:model-value="onStepTabChange"
          density="comfortable"
          class="bg-transparent gmu-tabs"
          grow
        >
          <v-tab value="thesis">1. Thesis & claims</v-tab>
          <v-tab value="search">2. Search</v-tab>
          <v-tab value="workspace">3. Workspace</v-tab>
          <v-tab value="analysis">4. Analysis</v-tab>
        </v-tabs>
      </v-col>

      <v-col cols="12" class="mt-0 pt-0" v-if="activeStep === 'thesis'">
        <ThesisInput
          v-model:thesis="thesis"
          v-model:claims="claimsInput"
        />
      </v-col>

      <v-col cols="12" class="mt-0 pt-0" v-if="activeStep === 'search'">
        <v-card variant="outlined" class="bg-white mb-4 gmu-step-card">
          <v-card-title class="text-subtitle-1 font-weight-medium gmu-step-card-title">
            Search OpenAlex
          </v-card-title>

          <v-card-text class="gmu-step-card-subtitle">
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

              <v-col cols="12" class="mt-2">
                <v-checkbox
                  :model-value="includePatriotProquest"
                  label="Add PatriotAI ProQuest results (reading list)"
                  density="comfortable"
                  hide-details="auto"
                  @update:model-value="onTogglePatriotProquest"
                />
              </v-col>

              <v-col v-if="includePatriotProquest" cols="12">
                <v-textarea
                  v-model="patriotProquestRaw"
                  label="Paste PatriotAI output here"
                  variant="outlined"
                  auto-grow
                  rows="3"
                  hint="Saved as reading list links. You can verify items in OpenAlex later."
                  persistent-hint
                  hide-details="auto"
                />
              </v-col>
            </v-row>

            <v-divider class="my-4" />

            <div v-if="isSearching" class="d-flex justify-center py-4">
              <v-progress-circular indeterminate color="primary" />
            </div>

            <div v-else>
              <template v-if="searchResults.length || suggestedSearchResults.length">
                <div v-if="searchResults.length" class="mb-4">
                  <div class="text-subtitle-2 mb-2">Results</div>
                  <v-table density="comfortable">
                    <thead>
                      <tr class="text-caption text-medium-emphasis">
                        <th class="text-left" style="width: 40px">
                          <v-checkbox
                            :model-value="allPrimaryResultsSelected"
                            density="compact"
                            hide-details
                            @update:model-value="onToggleSelectAllPrimary"
                          />
                        </th>
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
                </div>

                <div v-if="suggestedSearchResults.length">
                  <div class="text-subtitle-2 mb-2">Suggested</div>
                  <v-table density="comfortable">
                    <thead>
                      <tr class="text-caption text-medium-emphasis">
                        <th class="text-left" style="width: 40px">
                          <v-checkbox
                            :model-value="allSuggestedResultsSelected"
                            density="compact"
                            hide-details
                            @update:model-value="onToggleSelectAllSuggested"
                          />
                        </th>
                        <th class="text-left">Title</th>
                        <th class="text-left" style="width: 80px">Year</th>
                        <th class="text-left" style="width: 160px">Venue</th>
                        <th class="text-left" style="width: 80px">Type</th>
                        <th class="text-left" style="width: 90px">Cited by</th>
                        <th class="text-left" style="width: 120px">Review</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="result in suggestedSearchResults"
                        :key="`suggested-${result.openalex_id}`"
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
                          <v-chip
                            size="x-small"
                            color="info"
                            variant="outlined"
                            class="ml-1"
                          >
                            Suggested
                          </v-chip>
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
                </div>
              </template>

              <div
                v-else
                class="text-caption text-medium-emphasis"
              >
                No search results yet. Run a query to see OpenAlex works.
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col
        cols="12"
        class="mt-6"
        v-if="activeStep === 'workspace' && enrichedSources && enrichedSources.length"
      >
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
        v-if="activeStep === 'workspace' && proquestLeads.length"
      >
        <v-card variant="outlined" class="bg-white gmu-step-card">
          <v-card-title class="text-subtitle-1 font-weight-medium gmu-step-card-title">
            PatriotAI / ProQuest Reading List
          </v-card-title>

          <v-card-text class="gmu-step-card-subtitle">
            <div class="text-body-2 text-medium-emphasis mb-3">
              Leads suggested by PatriotAI from ProQuest. These are not
              verified citations; review and verify in OpenAlex before using
              as evidence.
            </div>

            <v-expansion-panels variant="accordion">
              <v-expansion-panel
                v-for="lead in proquestLeads"
                :key="lead.url + '-' + lead.addedAt"
              >
                <v-expansion-panel-title>
                  <div class="d-flex flex-column flex-md-row align-center w-100">
                    <div class="flex-grow-1">
                      <div class="text-body-1 font-weight-medium">
                        {{ lead.title || 'ProQuest link' }}
                      </div>
                      <div class="text-caption text-medium-emphasis mt-1">
                        <span v-if="lead.doi">DOI: {{ lead.doi }}</span>
                        <span v-else>Added {{ formatLeadAddedAt(lead.addedAt) }}</span>
                      </div>
                    </div>
                  </div>
                </v-expansion-panel-title>

                <v-expansion-panel-text class="gmu-enriched-detail">
                  <div class="d-flex flex-wrap gap-2">
                    <v-btn
                      size="small"
                      variant="text"
                      color="primary"
                      :href="lead.url"
                      target="_blank"
                    >
                      Open in ProQuest
                    </v-btn>

                    <v-btn
                      size="small"
                      variant="text"
                      color="secondary"
                      @click="onSearchLeadInOpenAlex(lead)"
                    >
                      Search in OpenAlex
                    </v-btn>
                  </div>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col
        cols="12"
        class="mt-4"
        v-if="
          activeStep === 'workspace' &&
          includePatriotProquest &&
          patriotProquestRaw &&
          patriotProquestRaw.trim().length &&
          workspace.proquestLeads &&
          workspace.proquestLeads.length
        "
      >
        <v-card variant="outlined" class="bg-white gmu-step-card">
          <v-card-title class="text-subtitle-1 font-weight-medium gmu-step-card-title">
            ProQuest sources (PatriotAI)
          </v-card-title>
          <v-card-text class="gmu-step-card-subtitle">
            <div class="text-body-2 text-medium-emphasis mb-3">
              Summaries you pasted from PatriotAI / ProQuest. These are used
              alongside OpenAlex workspace sources when you analyze claims.
            </div>

            <v-expansion-panels variant="accordion">
              <v-expansion-panel
                v-for="lead in workspace.proquestLeads"
                :key="lead.title + '-' + lead.addedAt"
              >
                <v-expansion-panel-title>
                  <div class="d-flex flex-column flex-md-row align-center w-100">
                    <div class="flex-grow-1">
                      <div class="text-body-1 font-weight-medium">
                        {{ lead.title }}
                      </div>
                      <div class="text-caption text-medium-emphasis mt-1">
                        <span v-if="lead.authors">{{ lead.authors }}</span>
                        <span v-if="lead.journal">
                          <span v-if="lead.authors"> · </span>{{ lead.journal }}
                        </span>
                      </div>
                    </div>
                  </div>
                </v-expansion-panel-title>

                <v-expansion-panel-text class="gmu-enriched-detail">
                  <div v-if="lead.summary" class="text-body-2 mb-2">
                    {{ lead.summary }}
                  </div>

                  <div class="d-flex flex-wrap gap-2">
                    <v-btn
                      v-if="lead.url"
                      size="small"
                      variant="text"
                      color="primary"
                      :href="lead.url"
                      target="_blank"
                    >
                      Open in ProQuest
                    </v-btn>

                    <v-btn
                      v-else-if="lead.doi"
                      size="small"
                      variant="text"
                      color="primary"
                      :href="`https://doi.org/${lead.doi}`"
                      target="_blank"
                    >
                      Open DOI
                    </v-btn>
                  </div>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col
        cols="12"
        class="mt-6"
        v-if="activeStep === 'analysis' && claimAnalysis && claimAnalysis.results.length"
      >
        <v-card variant="outlined" class="bg-white gmu-step-card">
          <v-card-title class="text-subtitle-1 font-weight-medium gmu-step-card-title">
            Claim analysis overview
          </v-card-title>

          <v-card-subtitle class="text-body-2 text-medium-emphasis gmu-step-card-subtitle">
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
                    class="gmu-claim-title-row d-flex justify-space-between align-center"
                  >
                    <span class="gmu-claim-title">{{ claimResult.claim }}</span>

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
                        <v-card
                          variant="outlined"
                          class="h-100 gmu-article-card"
                          :class="`gmu-article-card--${hit.stance}`"
                        >
                          <v-card-text>
                            <div
                              class="gmu-article-header d-flex justify-space-between align-center mb-2"
                            >
                              <div class="d-flex align-center">
                                <v-icon
                                  size="small"
                                  color="primary"
                                  class="mr-2"
                                  icon="mdi-file-document-outline"
                                />
                                <div class="text-caption text-medium-emphasis text-uppercase">
                                  Article
                                  <span v-if="hit.source_kind === 'proquest'">
                                    · ProQuest
                                  </span>
                                  <span v-else>
                                    · OpenAlex
                                  </span>
                                </div>
                              </div>

                              <div class="d-flex align-center gmu-article-meta">
                                <v-chip
                                  size="x-small"
                                  color="green-darken-1"
                                  variant="flat"
                                  class="mr-2"
                                >
                                  {{ hit.stance }}
                                </v-chip>

                                <span class="text-caption text-medium-emphasis">
                                  {{ Math.round(hit.relevance * 100) }}% relevance
                                </span>
                              </div>
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
                              <template v-if="splitApaUrl(hit.apa)">
                                <span>{{ splitApaUrl(hit.apa)!.before }}</span>
                                <a
                                  :href="splitApaUrl(hit.apa)!.url"
                                  target="_blank"
                                  rel="noopener"
                                  class="text-primary"
                                >
                                  {{ splitApaUrl(hit.apa)!.url }}
                                </a>
                                <span>{{ splitApaUrl(hit.apa)!.after }}</span>
                              </template>
                              <template v-else>
                                {{ hit.apa }}
                              </template>
                            </div>

                            <div
                              v-if="resolveEvidenceUrl(hit)"
                              class="mt-2"
                            >
                              <a
                                :href="resolveEvidenceUrl(hit) || undefined"
                                target="_blank"
                                rel="noopener"
                                class="text-primary text-caption font-weight-medium"
                              >
                                Open article
                              </a>
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
                      :class="[
                        'gmu-article-card',
                        `gmu-article-card--${claimResult.top_counter[0].stance}`,
                      ]"
                    >
                      <v-card-text>
                        <div
                          class="gmu-article-header d-flex justify-space-between align-center mb-2"
                        >
                          <div class="d-flex align-center">
                            <v-icon
                              size="small"
                              color="primary"
                              class="mr-2"
                              icon="mdi-file-document-outline"
                            />
                            <div class="text-caption text-medium-emphasis text-uppercase">
                              Article · Counter
                              <span
                                v-if="claimResult.top_counter[0].source_kind === 'proquest'"
                              >
                                · ProQuest
                              </span>
                              <span
                                v-else
                              >
                                · OpenAlex
                              </span>
                            </div>
                          </div>

                          <div class="d-flex align-center gmu-article-meta">
                            <v-chip
                              size="x-small"
                              color="red-darken-1"
                              variant="flat"
                              class="mr-2"
                            >
                              {{ claimResult.top_counter[0].stance }}
                            </v-chip>

                            <span class="text-caption text-medium-emphasis">
                              {{ Math.round(
                                claimResult.top_counter[0].relevance * 100,
                              ) }}% relevance
                            </span>
                          </div>
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
                          <template v-if="splitApaUrl(claimResult.top_counter[0].apa)">
                            <span>
                              {{ splitApaUrl(claimResult.top_counter[0].apa)!.before }}
                            </span>
                            <a
                              :href="splitApaUrl(claimResult.top_counter[0].apa)!.url"
                              target="_blank"
                              rel="noopener"
                              class="text-primary"
                            >
                              {{ splitApaUrl(claimResult.top_counter[0].apa)!.url }}
                            </a>
                            <span>
                              {{ splitApaUrl(claimResult.top_counter[0].apa)!.after }}
                            </span>
                          </template>
                          <template v-else>
                            {{ claimResult.top_counter[0].apa }}
                          </template>
                        </div>

                        <div
                          v-if="resolveEvidenceUrl(claimResult.top_counter[0])"
                          class="mt-2"
                        >
                          <a
                            :href="
                              resolveEvidenceUrl(claimResult.top_counter[0]) ||
                              undefined
                            "
                            target="_blank"
                            rel="noopener"
                            class="text-primary text-caption font-weight-medium"
                          >
                            Open article
                          </a>
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
      
      <v-col cols="12" class="d-flex justify-space-between mt-6">
        <v-btn
          variant="outlined"
          color="primary"
          :disabled="!canGoPreviousStep"
          @click="goToPreviousStep"
        >
          <v-icon start icon="mdi-arrow-left" class="mr-1" />
          Previous
        </v-btn>

        <v-btn
          variant="flat"
          color="primary"
          :disabled="!canGoNextStep"
          @click="goToNextStep"
        >
          Next
          <v-icon end icon="mdi-arrow-right" class="ml-1" />
        </v-btn>
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
  resolveSuggestions,
} from '../api/evidenceApi';
import type { EvidenceHit } from '../types/claims';

type StepId = 'thesis' | 'search' | 'workspace' | 'analysis';

const thesis = ref('');
const claimsInput = ref('');

const stepsOrder: StepId[] = ['thesis', 'search', 'workspace', 'analysis'];
const activeStep = ref<StepId>('thesis');

const searchQuery = ref('');
const searchLimit = ref(15);
const searchFromYear = ref<number | null>(null);
const searchToYear = ref<number | null>(null);
const searchExcludePreprints = ref(true);
const searchResults = ref<SearchResult[]>([]);
const suggestedSearchResults = ref<SearchResult[]>([]);
const patriotResultsInput = ref('');
const patriotSuggestedWorks = ref<SearchResult[]>([]);
const patriotUnresolvedLines = ref<string[]>([]);

type ProQuestLead = {
  id: string;
  title?: string;
  doi?: string;
  url: string;
  addedAt: string;
  userAbstract?: string;
};

type WorkspaceProquestLead = {
  title: string;
  authors?: string;
  journal?: string;
  doi?: string;
  summary?: string;
  url?: string;
  addedAt: string;
};

const workspace = ref<{ proquestLeads?: WorkspaceProquestLead[] }>({});

const includePatriotProquest = ref(false);
const patriotProquestRaw = ref('');
const proquestLeads = ref<ProQuestLead[]>([]);
const selectedSearchResults = ref<SearchResult[]>([]);

const enrichedSources = ref<EnrichedSource[] | null>(null);

const claimAnalysis = ref<ClaimAnalyzeResponse | null>(null);

const isEnriching = ref(false);
const isSearching = ref(false);
const errorMessage = ref<string | null>(null);
const isAnalyzingClaims = ref(false);
const isResolvingSuggestions = ref(false);

const snackbarVisible = ref(false);
const snackbarMessage = ref('');
const snackbarColor = ref<'success' | 'error'>('error');

type ClaimResult = ClaimAnalyzeResponse['results'][number];

const allPrimaryResultsSelected = computed(() => {
  if (searchResults.value.length === 0) return false;
  return searchResults.value.every((result) => isResultSelected(result));
});

const allSuggestedResultsSelected = computed(() => {
  if (suggestedSearchResults.value.length === 0) return false;
  return suggestedSearchResults.value.every((result) => isResultSelected(result));
});

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

function isThesisStepComplete(): boolean {
  if (!thesis.value.trim()) {
    return false;
  }

  const claims = buildClaimsArray(claimsInput.value);
  return claims.length > 0;
}

function isWorkspaceReady(): boolean {
  return !!enrichedSources.value && enrichedSources.value.length > 0;
}

function isAnalysisReady(): boolean {
  return canAnalyzeClaims.value;
}

function canAdvanceFrom(step: StepId): boolean {
  switch (step) {
    case 'thesis':
      return isThesisStepComplete();
    case 'search':
      // Search step is "complete" once at least one item is in the workspace
      return isWorkspaceReady();
    case 'workspace':
      return isAnalysisReady();
    case 'analysis':
    default:
      return false;
  }
}

const canGoPreviousStep = computed(() => {
  const idx = stepsOrder.indexOf(activeStep.value);
  return idx > 0;
});

const canGoNextStep = computed(() => {
  const idx = stepsOrder.indexOf(activeStep.value);
  if (idx === -1 || idx >= stepsOrder.length - 1) {
    return false;
  }

  return canAdvanceFrom(activeStep.value);
});

function showStepGuardMessage(step: StepId): void {
  let message = '';

  if (step === 'search') {
    message = 'Add a thesis and at least one claim to continue.';
  } else if (step === 'workspace') {
    message = 'Add at least one OpenAlex work to your workspace first.';
  } else if (step === 'analysis') {
    message =
      'Provide a thesis, claims, and at least one workspace source before analyzing.';
  }

  if (message) {
    snackbarMessage.value = message;
    snackbarColor.value = 'error';
    snackbarVisible.value = true;
  }
}

function goToPreviousStep(): void {
  const idx = stepsOrder.indexOf(activeStep.value);
  if (idx > 0) {
    activeStep.value = stepsOrder[idx - 1];
  }
}

function goToNextStep(): void {
  if (!canAdvanceFrom(activeStep.value)) {
    const current = activeStep.value;
    const nextIdx = stepsOrder.indexOf(current) + 1;
    const next = stepsOrder[nextIdx] ?? current;
    showStepGuardMessage(next);
    return;
  }

  const idx = stepsOrder.indexOf(activeStep.value);
  if (idx > -1 && idx < stepsOrder.length - 1) {
    activeStep.value = stepsOrder[idx + 1];
  }
}

function openPatriotAiWindow(): void {
  if (typeof window === 'undefined') return;

  const url =
    'https://patriotai.gmu.edu/chat/5a1af569-32f9-4aaf-889f-3c74c8f71584';
  const width = 420;
  const maxHeight = 900;
  const availHeight = window.screen?.availHeight || window.innerHeight || maxHeight;
  const height = Math.min(availHeight, maxHeight);

  const padding = 16;
  const viewportWidth = window.outerWidth || window.innerWidth;
  const left = window.screenX + Math.max(viewportWidth - width - padding, 0);
  const top = window.screenY + padding;

  const features = [
    `width=${width}`,
    `height=${height}`,
    `left=${left}`,
    `top=${top}`,
    'resizable=yes',
    'scrollbars=yes',
  ].join(',');

  const win = window.open(url, 'patriotai-citecompass', features);
  if (!win) {
    snackbarMessage.value =
      'Popup was blocked. Please allow popups for PatriotAI and try again.';
    snackbarColor.value = 'error';
    snackbarVisible.value = true;
  }
}

function onTogglePatriotProquest(value: boolean): void {
  includePatriotProquest.value = value;

  if (value) {
    openPatriotAiWindow();
  }
}

function onStepTabChange(next: StepId): void {
  if (next === activeStep.value) {
    return;
  }

  const currentIdx = stepsOrder.indexOf(activeStep.value);
  const nextIdx = stepsOrder.indexOf(next);

  if (nextIdx === -1) {
    return;
  }

  // Always allow moving backwards
  if (nextIdx < currentIdx) {
    activeStep.value = next;
    return;
  }

  // Moving forwards: enforce per-step completion
  let allowed = false;
  switch (next) {
    case 'search':
      allowed = isThesisStepComplete();
      break;
    case 'workspace':
      allowed = isWorkspaceReady();
      break;
    case 'analysis':
      allowed = isAnalysisReady();
      break;
    default:
      allowed = true;
  }

  if (!allowed) {
    showStepGuardMessage(next);
    return;
  }

  activeStep.value = next;
}

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
  suggestedSearchResults.value = [];
  patriotSuggestedWorks.value = [];
  patriotUnresolvedLines.value = [];

  try {
    const limit = normaliseLimit(searchLimit.value);

    const response = await searchOpenAlex({
      query: searchQuery.value.trim(),
      limit,
      exclude_preprints: searchExcludePreprints.value,
      from_year: searchFromYear.value === null ? undefined : searchFromYear.value,
      to_year: searchToYear.value === null ? undefined : searchToYear.value,
    });

    const primary = response.results ?? [];
    const suggested = response.suggested ?? [];

    // Prefer backend de-dupe; only remove obvious overlaps by openalex_id
    const primaryIds = new Set(primary.map((item) => item.openalex_id));
    const dedupedSuggested = suggested.filter(
      (item) => !primaryIds.has(item.openalex_id),
    );

    searchResults.value = primary;
    suggestedSearchResults.value = dedupedSuggested;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to search OpenAlex.';
    errorMessage.value = message;
    searchResults.value = [];
    suggestedSearchResults.value = [];
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

    if (includePatriotProquest.value && patriotProquestRaw.value.trim().length) {
      console.log('includePatriotProquest', includePatriotProquest.value);
      console.log('patriotProquestRaw length', patriotProquestRaw.value.length);
      console.log(
        'patriotProquestRaw preview',
        patriotProquestRaw.value.slice(0, 100),
      );

      const leads = parsePatriotAiProQuest(patriotProquestRaw.value);
      if (leads.length) {
        proquestLeads.value = [...proquestLeads.value, ...leads];
      }

      const workspaceLeads = parsePatriotPaste(patriotProquestRaw.value);
      if (workspaceLeads.length) {
        if (!workspace.value.proquestLeads) {
          workspace.value.proquestLeads = [];
        }
        workspace.value.proquestLeads.push(...workspaceLeads);
      }
    }

    // Move to the Workspace step after successfully enriching
    activeStep.value = 'workspace';
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

function parsePatriotAiProQuest(text: string): ProQuestLead[] {
  const trimmed = text.trim();
  if (!trimmed) {
    return [];
  }

  const lines = trimmed
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const urlRegex = /https?:\/\/[^\s]*proquest\.com\/openview[^\s]*/i;
  const doiRegex = /10\.\d{4,9}\/[^\s"')]+/i;

  const urls: string[] = [];
  const titles: (string | undefined)[] = [];
  const dois: (string | undefined)[] = [];

  for (const line of lines) {
    const urlMatch = line.match(urlRegex);
    if (urlMatch && urlMatch[0]) {
      const cleanedUrl = urlMatch[0].replace(/[).,;]+$/, '');
      urls.push(cleanedUrl);
    }

    const titleMatch = line.match(/^\d+\.\s+(.+)/);
    if (titleMatch && titleMatch[1]) {
      titles.push(titleMatch[1].trim());
    }

    const doiMatch = line.match(doiRegex);
    if (doiMatch && doiMatch[0]) {
      const cleanedDoi = doiMatch[0].replace(/[).,;]+$/, '');
      dois.push(cleanedDoi);
    }
  }

  if (!urls.length) {
    return [];
  }

  const now = new Date().toISOString();
  const leads: ProQuestLead[] = [];

  for (let i = 0; i < urls.length; i += 1) {
    const lead: ProQuestLead = {
      id: `${now}-${i}-${urls[i]}`,
      url: urls[i],
      addedAt: now,
    };

    if (titles.length === urls.length) {
      lead.title = titles[i];
    }

    if (dois.length === urls.length) {
      lead.doi = dois[i];
    }

    leads.push(lead);
  }

  return leads;
}

function parsePatriotPaste(text: string): WorkspaceProquestLead[] {
  const trimmed = text.trim();
  if (!trimmed) {
    return [];
  }

  const lines = trimmed
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const results: WorkspaceProquestLead[] = [];
  const now = new Date().toISOString();

  const isTitleLine = (raw: string): boolean => {
    const line = raw.trim();
    if (!line) return false;

    const lower = line.toLowerCase();
    const bannedStarts = [
      'author:',
      'authors:',
      'journal:',
      'published',
      'publication',
      'date',
      'doi:',
      'summary:',
      'publisher:',
      'publication date:',
      'volume:',
      'abstract:',
      'read more',
      'http',
      '[',
    ];

    return !bannedStarts.some((prefix) => lower.startsWith(prefix));
  };

  let current: WorkspaceProquestLead | null = null;
  let inSummary = false;

  const cleanSummary = (text: string | undefined): string | undefined => {
    if (!text) return text;
    const cleaned = text
      .replace(/\s*Read more\s+\d+\s*\.\s*$/i, '')
      .trim();
    return cleaned || undefined;
  };

  const commitCurrent = () => {
    if (!current) return;

    if (current.summary) {
      current.summary = cleanSummary(current.summary) ?? current.summary;
    }

    if (
      current.title ||
      current.authors ||
      current.journal ||
      current.doi ||
      current.summary ||
      current.url
    ) {
      results.push(current);
    }

    current = null;
    inSummary = false;
  };

  for (const rawLine of lines) {
    let line = rawLine.trim();
    if (!line) {
      continue;
    }

    // Handle cases where summary and next title are merged via "Read more N ."
    const readMoreWithTitleMatch = line.match(/Read more\s+\d+\s*\.\s*(.+)$/i);
    if (readMoreWithTitleMatch) {
      const matchIndex = line.toLowerCase().indexOf('read more');
      const before = matchIndex >= 0 ? line.slice(0, matchIndex).trim() : '';
      const nextTitleRaw = readMoreWithTitleMatch[1].trim();

      if (before && current) {
        current.summary = current.summary
          ? `${current.summary} ${before}`
          : before;
      }

      // Finish current item before starting the next one
      if (current) {
        commitCurrent();
      }

      const cleanedTitle = nextTitleRaw.replace(/^\d+\.\s+/, '');
      current = {
        title: cleanedTitle,
        addedAt: now,
      };
      inSummary = false;
      continue;
    }

    // Ignore pure "Read more" lines
    if (/^read more\b/i.test(line)) {
      continue;
    }

    // Ignore standalone section labels like "Publication" or "Date"
    if (/^(publication:?|date:?)$/i.test(line)) {
      continue;
    }

    // Metadata lines attach to current item
    if (/^authors?:/i.test(line)) {
      if (current) {
        const value = line.replace(/^authors?:/i, '').trim();
        if (value) {
          current.authors = value;
        }
      }
      continue;
    }

    if (/^(journal:|published in:)/i.test(line)) {
      if (current) {
        const value = line.replace(/^(journal:|published in:)/i, '').trim();
        if (value) {
          current.journal = value;
        }
      }
      continue;
    }

    if (/^doi:/i.test(line)) {
      if (current) {
        const value = line.replace(/^doi:/i, '').trim();
        if (value) {
          current.doi = value.replace(/[).,;]+$/, '');
        }
      }
      continue;
    }

    // Additional metadata lines from PatriotAI outputs that we want to
    // treat as details on the current item rather than new titles.
    if (/^publisher:/i.test(line)) {
      if (current) {
        const value = line.replace(/^publisher:/i, '').trim();
        if (value) {
          const fragment = `Publisher: ${value}`;
          current.summary = current.summary
            ? `${current.summary} ${fragment}`
            : fragment;
        }
      }
      continue;
    }

    if (/^publication date:/i.test(line)) {
      if (current) {
        const value = line.replace(/^publication date:/i, '').trim();
        if (value) {
          const fragment = `Publication date: ${value}`;
          current.summary = current.summary
            ? `${current.summary} ${fragment}`
            : fragment;
        }
      }
      continue;
    }

    if (/^volume:/i.test(line)) {
      if (current) {
        const value = line.replace(/^volume:/i, '').trim();
        if (value) {
          const fragment = `Volume: ${value}`;
          current.summary = current.summary
            ? `${current.summary} ${fragment}`
            : fragment;
        }
      }
      continue;
    }

    if (/^abstract:/i.test(line)) {
      if (current) {
        const value = line.replace(/^abstract:/i, '').trim();
        if (value) {
          current.summary = current.summary
            ? `${current.summary} ${value}`
            : value;
        }
        inSummary = true;
      }
      continue;
    }

    if (/^summary:/i.test(line)) {
      if (current) {
        const value = line.replace(/^summary:/i, '').trim();
        if (value) {
          current.summary = current.summary
            ? `${current.summary} ${value}`
            : value;
        }
        inSummary = true;
      }
      continue;
    }

    // URL line
    if (/^https?:\/\//i.test(line)) {
      if (current && !current.url) {
        current.url = line;
      }
      continue;
    }

    // Title line starts a new item
    if (isTitleLine(line)) {
      // Commit any existing item first
      if (current) {
        commitCurrent();
      }

      let cleanedTitle = line.replace(/^\d+\.\s+/, '');
      let inlineSummary: string | undefined;

      // Handle single-line "Title: summary" patterns
      const colonIndex = cleanedTitle.indexOf(':');
      if (colonIndex > 0 && colonIndex < cleanedTitle.length - 1) {
        const before = cleanedTitle.slice(0, colonIndex).trim();
        const after = cleanedTitle.slice(colonIndex + 1).trim();
        if (before && after) {
          cleanedTitle = before;
          inlineSummary = cleanSummary(after);
        }
      }

      current = {
        title: cleanedTitle,
        addedAt: now,
      };

      if (inlineSummary) {
        current.summary = inlineSummary;
        inSummary = true;
      } else {
        inSummary = false;
      }

      continue;
    }

    // Non-metadata, non-title lines extend summary if present
    if (current) {
      if (inSummary || current.summary) {
        current.summary = current.summary
          ? `${current.summary} ${line}`
          : line;
      }
    }
  }

  // Commit any final item
  if (current) {
    commitCurrent();
  }

  return results;
}

// Dev-only sanity check for parsePatriotPaste
if (import.meta.env.DEV) {
  const examplePatriotOutput = `AI in Higher Education: An Overview
Authors: Jane Doe; John Smith
Published in: Journal of Educational Technology
DOI: 10.1234/abcd.5678
Summary: This paper explores applications of AI in higher education.
Read more 1 .

AI Integration in Higher Education: Case Studies
Author: Alice Jones
Journal: Higher Education Review
DOI: 10.5678/wxyz.1234
Summary: Read more 2 . AI and Student Success: A Multi-Campus Study`;

  const parsedLeads = parsePatriotPaste(examplePatriotOutput);
  // Expect titles array like [
  //   'AI in Higher Education: An Overview',
  //   'AI Integration in Higher Education: Case Studies',
  //   'AI and Student Success: A Multi-Campus Study',
  // ] and no 'Authors:' entries.
  // eslint-disable-next-line no-console
  console.log('parsePatriotPaste dev example titles',
    parsedLeads.map((lead) => lead.title),
  );
}

async function onResolvePatriotSuggestions(): Promise<void> {
  const lines = patriotResultsInput.value
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return;
  }

  isResolvingSuggestions.value = true;
  patriotSuggestedWorks.value = [];
  patriotUnresolvedLines.value = [];

  try {
    const response = await resolveSuggestions({ items: lines });
    patriotSuggestedWorks.value = response.suggested ?? [];
    patriotUnresolvedLines.value = response.unresolved_lines ?? [];
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Failed to resolve PatriotAI suggestions.';
    snackbarMessage.value = message;
    snackbarColor.value = 'error';
    snackbarVisible.value = true;
  } finally {
    isResolvingSuggestions.value = false;
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

    const proquestEvidence = proquestLeads.value
      .filter((lead) => lead.userAbstract && lead.userAbstract.trim().length > 0)
      .map((lead) => ({
        title: lead.title,
        doi: lead.doi,
        url: lead.url,
        abstract: lead.userAbstract!.trim(),
      }));

    const response = await analyzeClaims({
      thesis: thesis.value.trim(),
      claims,
      sources: sourcesPayload,
      proquestEvidence: proquestEvidence.length ? proquestEvidence : undefined,
    });

    claimAnalysis.value = response;

    // Move to the Analysis step after a successful response
    activeStep.value = 'analysis';
  } catch (error) {
    const err = error as Error & { status?: number; body?: unknown };
    if (
      err.status === 400 &&
      err.message === 'Request body failed validation.'
    ) {
      console.error('Claims analyze validation error', {
        thesis: thesis.value.trim(),
        claims: buildClaimsArray(claimsInput.value),
        // Log the exact payload we attempted to send
        sources: enrichedSources.value?.map((source) => ({
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
        })),
        error: err,
      });
      snackbarMessage.value =
        'Claim analysis request is invalid. Please check your thesis, claims (max 6), and selected sources.';
    } else if (
      err.status === 500 &&
      err.message ===
        'An unexpected error occurred while analyzing claims.'
    ) {
      snackbarMessage.value =
        'Analysis failed, please try again.';
    } else {
      snackbarMessage.value =
        err instanceof Error ? err.message : 'Failed to analyze claims.';
    }
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

async function onCopyPatriotPrompt(): Promise<void> {
  const claims = buildClaimsArray(claimsInput.value);

  const lines: string[] = [];
  lines.push(`Thesis: ${thesis.value.trim() || '(none provided)'}`);
  lines.push('');
  lines.push('Claims:');
  if (claims.length === 0) {
    lines.push('- (no explicit claims provided)');
  } else {
    for (const claim of claims) {
      lines.push(`- ${claim}`);
    }
  }
  lines.push('');
  lines.push(`Current OpenAlex search query: ${searchQuery.value.trim() || '(none)'}`);
  lines.push('');
  lines.push(
    'Instruction: Suggest additional academic works relevant to this thesis and these claims. Output one item per line. For each item, prefer a bare DOI (e.g., 10.xxxx/...), or if DOI is unknown, output the exact paper title (optionally with a link).',
  );

  const prompt = lines.join('\n');

  try {
    if (!navigator.clipboard || !navigator.clipboard.writeText) {
      throw new Error('Clipboard API is not available in this browser.');
    }

    await navigator.clipboard.writeText(prompt);
    snackbarMessage.value = 'PatriotAI prompt copied to clipboard.';
    snackbarColor.value = 'success';
    snackbarVisible.value = true;
  } catch (error) {
    snackbarMessage.value =
      error instanceof Error
        ? error.message
        : 'Failed to copy PatriotAI prompt to clipboard.';
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

function resolveEvidenceUrl(hit: EvidenceHit): string | null {
  // Try to resolve against enriched OpenAlex sources first
  if (hit.source_kind === 'openalex' && enrichedSources.value) {
    const source = enrichedSources.value.find((item) => {
      return (
        item.id === hit.source_id ||
        item.openalexId === hit.source_id ||
        (item.doi && hit.source_id && hit.source_id.includes(item.doi))
      );
    });

    if (source) {
      if (source.url && source.url.trim().length > 0) {
        return source.url;
      }
      if (source.doi && source.doi.trim().length > 0) {
        return `https://doi.org/${source.doi}`;
      }
      if (source.doiUrl && source.doiUrl.trim().length > 0) {
        return source.doiUrl;
      }
    }
  }

  // For ProQuest evidence, try to match back to user-provided leads
  if (hit.source_kind === 'proquest') {
    const allLeads: { url?: string; doi?: string }[] = [
      ...proquestLeads.value,
      ...(workspace.value.proquestLeads ?? []),
    ];

    const lead = allLeads.find((item) => {
      return (
        (item.url && hit.source_id && hit.source_id.includes(item.url)) ||
        (item.doi && hit.source_id && hit.source_id.includes(item.doi))
      );
    });

    if (lead) {
      if (lead.url && lead.url.trim().length > 0) {
        return lead.url;
      }
      if (lead.doi && lead.doi.trim().length > 0) {
        return `https://doi.org/${lead.doi}`;
      }
    }
  }

  return null;
}

function splitApaUrl(apa: string):
  | { before: string; url: string; after: string }
  | null {
  if (!apa) {
    return null;
  }

  const match = apa.match(/https?:\/\/\S+/);
  if (!match) {
    return null;
  }

  const url = match[0];
  const index = match.index ?? 0;
  const before = apa.slice(0, index).trimEnd();
  const after = apa.slice(index + url.length).trimStart();

  return { before, url, after };
}

function formatLeadAddedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
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

function onToggleSelectAllPrimary(selected: boolean): void {
  if (selected) {
    const merged = new Map<string, SearchResult>();
    for (const item of selectedSearchResults.value) {
      merged.set(item.openalex_id, item);
    }
    for (const item of searchResults.value) {
      merged.set(item.openalex_id, item);
    }
    selectedSearchResults.value = Array.from(merged.values());
  } else {
    const ids = new Set(searchResults.value.map((r) => r.openalex_id));
    selectedSearchResults.value = selectedSearchResults.value.filter(
      (item) => !ids.has(item.openalex_id),
    );
  }
}

function onToggleSelectAllSuggested(selected: boolean): void {
  if (selected) {
    const merged = new Map<string, SearchResult>();
    for (const item of selectedSearchResults.value) {
      merged.set(item.openalex_id, item);
    }
    for (const item of suggestedSearchResults.value) {
      merged.set(item.openalex_id, item);
    }
    selectedSearchResults.value = Array.from(merged.values());
  } else {
    const ids = new Set(suggestedSearchResults.value.map((r) => r.openalex_id));
    selectedSearchResults.value = selectedSearchResults.value.filter(
      (item) => !ids.has(item.openalex_id),
    );
  }
}

function onSearchLeadInOpenAlex(lead: ProQuestLead): void {
  const query = lead.doi ?? lead.title;
  if (!query) {
    return;
  }

  searchQuery.value = query;
  void onSearchOpenAlex();

  window.scrollTo({ top: 0, behavior: 'smooth' });
}
</script>
