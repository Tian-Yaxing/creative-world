<script setup lang="ts">
import { RouterView } from 'vue-router'
import TransitionOverlay from './components/TransitionOverlay.vue'
</script>

<template>
  <div class="app-container">
    <RouterView v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </RouterView>
    <TransitionOverlay />
  </div>
</template>

<style lang="scss">
.app-container {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: $background;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>