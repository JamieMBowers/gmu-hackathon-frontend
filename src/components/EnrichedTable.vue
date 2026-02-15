<template>
  <v-card variant="outlined" class="bg-white">
    <v-card-title class="text-subtitle-1 font-weight-medium">
      Enriched sources
    </v-card-title>

    <v-card-text>
      <div v-if="!items.length" class="text-body-2 text-medium-emphasis">
        No enriched sources to display yet.
      </div>

      <v-expansion-panels v-else variant="accordion">
        <v-expansion-panel v-for="item in items" :key="item.id">
          <v-expansion-panel-title>
            <div class="d-flex flex-column flex-md-row align-center w-100">
              <div class="flex-grow-1">
                <div class="text-body-1 font-weight-medium">
                  {{ item.title || 'Untitled source' }}
                </div>
                <div class="text-caption text-medium-emphasis mt-1">
                  <span v-if="item.year">
                    {{ item.year }}
                  </span>
                  <span v-if="item.year && item.venue">
                    &nbsp;•&nbsp;
                  </span>
                  <span v-if="item.venue">
                    {{ item.venue }}
                  </span>
                  <span v-if="item.citedBy !== undefined">
                    &nbsp;•&nbsp;Cited by {{ item.citedBy }}
                  </span>
                </div>
              </div>

              <div class="d-flex align-center mt-2 mt-md-0">
                <v-chip
                  v-if="item.needsReview"
                  color="amber"
                  size="small"
                  variant="flat"
                  class="me-2 text-caption"
                >
                  Needs review
                </v-chip>
              </div>
            </div>
          </v-expansion-panel-title>

          <v-expansion-panel-text class="gmu-enriched-detail">
            <div class="mb-3">
              <div class="text-caption text-medium-emphasis mb-1">
                APA citation
              </div>
              <div class="text-body-2">
                {{ item.apaCitation || 'No formatted citation available.' }}
              </div>
            </div>

            <div v-if="item.doiUrl">
              <div class="text-caption text-medium-emphasis mb-1">
                DOI
              </div>
              <a
                :href="item.doiUrl"
                target="_blank"
                rel="noopener"
                class="text-body-2 text-primary"
              >
                {{ item.doiUrl }}
              </a>
            </div>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import type { EnrichedSource } from '../api/evidenceApi';

defineProps<{
  items: EnrichedSource[];
}>();
</script>
