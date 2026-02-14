<template>
  <v-card variant="outlined" class="bg-white">
    <v-card-title class="text-subtitle-1 font-weight-medium">
      Thesis and claims
    </v-card-title>

    <v-card-text>
      <v-text-field
        v-model="thesisModel"
        label="Thesis statement"
        variant="outlined"
        density="comfortable"
        hide-details="auto"
        class="mb-4"
      />

      <v-textarea
        v-model="claimsModel"
        label="Claims (one per line)"
        variant="outlined"
        density="comfortable"
        rows="5"
        auto-grow
        hide-details="auto"
      />
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  thesis: string;
  claims: string;
}>();

const emit = defineEmits<{
  (e: 'update:thesis', value: string): void;
  (e: 'update:claims', value: string): void;
}>();

const thesisModel = computed({
  get: () => props.thesis,
  set: (value: string) => emit('update:thesis', value),
});

const claimsModel = computed({
  get: () => props.claims,
  set: (value: string) => emit('update:claims', value),
});
</script>
