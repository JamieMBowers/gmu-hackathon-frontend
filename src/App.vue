<template>
  <v-app>
    <v-app-bar color="primary" flat>
      <v-app-bar-title class="text-h6 font-weight-medium">
        CiteCompass AI
      </v-app-bar-title>
      <v-spacer />
      <v-btn
        size="small"
        variant="text"
        color="white"
        class="text-none"
        prepend-icon="mdi-robot"
        @click="isPatriotDrawerOpen = !isPatriotDrawerOpen"
      >
        PatriotAI
      </v-btn>
    </v-app-bar>

    <v-main class="bg-grey-lighten-4">
      <HomeView />
    </v-main>

    <PatriotCopilotDrawer v-model="isPatriotDrawerOpen" />
  </v-app>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import HomeView from './views/HomeView.vue';
import PatriotCopilotDrawer from './components/PatriotCopilotDrawer.vue';

const isPatriotDrawerOpen = ref(false);
</script>
