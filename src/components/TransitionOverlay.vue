<script setup lang="ts">
import { ref, watch } from 'vue'
import { useSceneStore } from '@/stores/sceneStore'
import gsap from 'gsap'

const sceneStore = useSceneStore()
const overlayRef = ref<HTMLDivElement>()
const progressRef = ref<HTMLDivElement>()

// 过渡动画
watch(() => sceneStore.isTransitioning, async (isTransitioning) => {
  if (isTransitioning && overlayRef.value && progressRef.value) {
    // 进入过渡（缓慢渐入）
    await gsap.to(overlayRef.value, {
      opacity: 1,
      duration: 1.5,
      ease: 'power2.inOut',
    })

    // 进度条动画（缓慢进度）
    gsap.to(progressRef.value, {
      width: '100%',
      duration: 2,
      ease: 'power2.inOut',
    })
  } else if (!isTransitioning && overlayRef.value && progressRef.value) {
    // 退出过渡（缓慢渐出）
    await gsap.to(progressRef.value, {
      width: '0%',
      duration: 1,
      ease: 'power2.inOut',
    })

    await gsap.to(overlayRef.value, {
      opacity: 0,
      duration: 1.5,
      ease: 'power2.inOut',
    })
  }
})
</script>

<template>
  <div ref="overlayRef" class="transition-overlay">
    <div class="transition-content">
      <div class="progress-bar">
        <div ref="progressRef" class="progress-fill"></div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.transition-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba($background, 0.95);
  z-index: 9999;
  opacity: 0;
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.transition-content {
  text-align: center;
}

.progress-bar {
  width: 200px;
  height: 4px;
  background: rgba($border, 0.3);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  width: 0%;
  height: 100%;
  background: linear-gradient(90deg, $primary, $accent);
  border-radius: 2px;
}
</style>