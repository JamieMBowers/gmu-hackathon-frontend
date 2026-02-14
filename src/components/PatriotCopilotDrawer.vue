<template>
  <v-navigation-drawer
    location="right"
    :width="420"
    :model-value="modelValue"
    @update:model-value="onUpdateModelValue"
    temporary
  >
    <v-sheet class="d-flex flex-column h-100 pa-4" elevation="0">
      <div class="mb-4">
        <div class="text-subtitle-1 font-weight-medium mb-1">
          PatriotAI Copilot
        </div>
        <div class="text-body-2 text-medium-emphasis">
          Use PatriotAI alongside your CiteCompass workspace.
        </div>
      </div>

      <v-card variant="outlined" class="mb-4">
        <v-card-title class="text-subtitle-2 font-weight-medium">
          Launch PatriotAI
        </v-card-title>
        <v-card-text>
          <v-btn
            color="primary"
            class="mb-3"
            block
            @click="onLaunchPatriotAi"
          >
            Launch PatriotAI
          </v-btn>

          <v-alert
            v-if="popupBlocked"
            type="warning"
            variant="tonal"
            density="comfortable"
          >
            Popup was blocked. Please allow popups for this site to use
            PatriotAI.
          </v-alert>
        </v-card-text>
      </v-card>

      <CopilotLeadsCard
        class="mb-4"
        @search-openalex="onSearchOpenalexFromCopilot"
      />

      <v-card variant="outlined" class="flex-grow-1 d-flex flex-column">
        <v-card-title class="text-subtitle-2 font-weight-medium">
          PatriotAI Insight (optional)
        </v-card-title>
        <v-card-text class="flex-grow-1 d-flex flex-column">
          <v-textarea
            v-model="patriotInsight"
            label="Notes from PatriotAI, reflections, or next steps"
            variant="outlined"
            auto-grow
            rows="3"
            hide-details="auto"
          />
        </v-card-text>
      </v-card>
    </v-sheet>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import CopilotLeadsCard from './CopilotLeadsCard.vue';

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'search-openalex', query: string): void;
}>();

const popupBlocked = ref(false);
const patriotInsight = ref('');

let patriotPopupWindow: Window | null = null;
const PATRIOT_POPUP_WINDOW_NAME = 'patriotai-docked';

function onUpdateModelValue(value: boolean): void {
  emit('update:modelValue', value);
}

function onSearchOpenalexFromCopilot(query: string): void {
  emit('search-openalex', query);
}

function onLaunchPatriotAi(): void {
  popupBlocked.value = false;

  if (typeof window === 'undefined') {
    return;
  }

  const url = 'https://patriotai.gmu.edu/';
  const width = 420;
  const maxHeight = 900;
  const availHeight = window.screen?.availHeight || window.innerHeight || maxHeight;
  const height = Math.min(availHeight, maxHeight);

  // Open aligned to the left side of the current window
  const left = window.screenX;
  const top = window.screenY;

  const features = [
    `width=${width}`,
    `height=${height}`,
    `left=${left}`,
    `top=${top}`,
    'resizable=yes',
    'scrollbars=yes',
  ].join(',');

  if (patriotPopupWindow && !patriotPopupWindow.closed) {
    try {
      patriotPopupWindow.focus();
      patriotPopupWindow.moveTo(left, top);
      patriotPopupWindow.resizeTo(width, height);
    } catch {
      // ignore cross-window restrictions
    }
    return;
  }

  const win = window.open(url, PATRIOT_POPUP_WINDOW_NAME, features);

  if (!win) {
    popupBlocked.value = true;
    return;
  }

  patriotPopupWindow = win;
}
</script>
