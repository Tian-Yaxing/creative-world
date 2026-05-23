<script setup lang="ts">
import { useRouter } from 'vue-router'
import gsap from 'gsap'
import { useSceneStore } from '@/stores/sceneStore'

const router = useRouter()
const sceneStore = useSceneStore()

// Props: 可选的相机引用（用于退场动画）
const props = defineProps<{
  camera?: THREE.PerspectiveCamera | null
}>()

// 返回入口
const handleReturn = async () => {
  // 如果有相机引用，执行退场动画
  if (props.camera) {
    await gsap.to(props.camera.position, {
      z: 20,
      duration: 2,
      ease: 'power2.in',
    })
  }

  await sceneStore.returnToEntrance()
  router.push('/entrance')
}
</script>

<template>
  <div class="back-to-entrance" @click="handleReturn">
    <span>返回入口</span>
  </div>
</template>

<style lang="scss" scoped>
.back-to-entrance {
  position: absolute;
  top: 20px;
  right: 20px;
  padding: 0.8rem 1.5rem;
  border: 1px solid $border;
  border-radius: 4px;
  background: rgba($secondary, 0.9);
  cursor: pointer;
  transition: all $transition-fast;
  z-index: 10;

  &:hover {
    border-color: $accent;
    box-shadow: 0 4px 20px $shadow;
    transform: translateY(-3px);
  }

  span {
    font-size: 0.85rem;
    color: $text;
    letter-spacing: 0.15em;
  }
}
</style>