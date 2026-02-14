<template>
  <v-card variant="outlined">
    <v-card-title class="text-subtitle-2 font-weight-medium">
      Copilot Leads
    </v-card-title>
    <v-card-text>
      <v-textarea
        v-model="rawText"
        label="Paste PatriotAI output (ProQuest links, titles, DOIs)"
        variant="outlined"
        auto-grow
        rows="4"
        hide-details="auto"
        class="mb-3"
      />

      <v-btn color="primary" @click="onUseInSearch">
        Use in OpenAlex search
      </v-btn>

      <v-alert
        v-if="infoMessage"
        type="info"
        variant="tonal"
        density="comfortable"
        class="mt-3"
      >
        {{ infoMessage }}
      </v-alert>

      <v-alert
        v-if="errorMessage"
        type="error"
        variant="tonal"
        density="comfortable"
        class="mt-3"
      >
        {{ errorMessage }}
      </v-alert>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const emit = defineEmits<{
  (e: 'search-openalex', query: string): void;
}>();

const rawText = ref('');
const infoMessage = ref('');
const errorMessage = ref('');

function resetMessages(): void {
  infoMessage.value = '';
  errorMessage.value = '';
}

interface ExtractResult {
  query: string | null;
  explanation: string;
}

function extractQueryFromText(text: string): ExtractResult {
  const trimmed = text.trim();
  if (!trimmed) {
    return { query: null, explanation: 'No content provided.' };
  }

  // 1) Try to find a DOI (simple best-effort regex)
  const doiMatch = trimmed.match(/10\.\d{4,9}\/[^\s"'>)]+/);
  if (doiMatch && doiMatch[0]) {
    const doi = doiMatch[0].replace(/[).,;]+$/, '');
    return {
      query: doi,
      explanation: `Detected DOI: ${doi}. Using this as the OpenAlex query.`,
    };
  }

  // 2) Fallback: best-effort title line
  const lines = trimmed
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const titleCandidate = lines.find((line) => {
    if (/^https?:\/\//i.test(line)) {
      return false;
    }
    return line.length >= 10 && line.split(/\s+/).length >= 3;
  });

  if (titleCandidate) {
    return {
      query: titleCandidate,
      explanation:
        'No DOI detected. Using a best-effort title line as the OpenAlex query.',
    };
  }

  return {
    query: null,
    explanation:
      'Could not detect a DOI or suitable title line. Please paste a clearer excerpt.',
  };
}

function onUseInSearch(): void {
  resetMessages();

  const { query, explanation } = extractQueryFromText(rawText.value);

  if (!query) {
    errorMessage.value = explanation;
    return;
  }

  emit('search-openalex', query);
  infoMessage.value = explanation;
}
</script>
