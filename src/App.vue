<template>
  <v-app>
    <v-app-bar color="primary" flat>
      <v-app-bar-title class="text-h6 font-weight-medium">
        CiteCompass AI
      </v-app-bar-title>
    </v-app-bar>

    <v-main class="bg-grey-lighten-4">
      <HomeView />
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import HomeView from './views/HomeView.vue';
</script>
