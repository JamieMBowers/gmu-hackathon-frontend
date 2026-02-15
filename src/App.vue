<template>
  <v-app>
    <v-main class="gmu-main-bg">
      <header class="gmu-header">
        <div class="gmu-header-inner">
          <div class="gmu-logo-block">
            <div class="gmu-mascot-wrap">
              <img
                src="/mascot-header.png"
                alt="Mason Patriot mascot"
                class="gmu-mascot-img"
              />
            </div>

            <div class="gmu-logo-mark">GMU</div>
            <div class="gmu-logo-text">
              <div class="gmu-app-name">
                <span class="gmu-app-name-main">CiteCompass</span>
                <span class="gmu-app-name-accent">AI</span>
              </div>
              <div class="gmu-app-tagline">Evidence workspace for Mason Patriots</div>
            </div>
          </div>
        </div>
      </header>

      <HomeView />
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import HomeView from './views/HomeView.vue';
</script>
