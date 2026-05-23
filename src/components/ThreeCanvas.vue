<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { useSceneStore } from '@/stores/sceneStore'

const props = defineProps<{
  sceneSetup: (scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer) => void
  sceneUpdate?: (deltaTime: number) => void
}>()

const sceneStore = useSceneStore()
const containerRef = ref<HTMLDivElement>()

// Three.js 核心对象
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let animationId: number
let clock: THREE.Clock

// 初始化Three.js场景
const initThree = () => {
  if (!containerRef.value) return

  // 创建场景
  scene = new THREE.Scene()

  // 创建相机
  camera = new THREE.PerspectiveCamera(
    60,
    containerRef.value.clientWidth / containerRef.value.clientHeight,
    0.1,
    1000
  )

  // 创建渲染器
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
  })
  renderer.setSize(containerRef.value.clientWidth, containerRef.value.clientHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setClearColor(0xE8E4D9, 1) // 书卷风背景色

  containerRef.value.appendChild(renderer.domElement)

  // 创建时钟
  clock = new THREE.Clock()

  // 调用外部场景设置
  props.sceneSetup(scene, camera, renderer)
}

// 动画循环
const animate = () => {
  animationId = requestAnimationFrame(animate)

  const deltaTime = clock.getDelta()

  // 调用外部更新函数
  if (props.sceneUpdate) {
    props.sceneUpdate(deltaTime)
  }

  renderer.render(scene, camera)
}

// 窗口大小变化处理
const handleResize = () => {
  if (!containerRef.value) return

  camera.aspect = containerRef.value.clientWidth / containerRef.value.clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(containerRef.value.clientWidth, containerRef.value.clientHeight)
}

// 监听过渡状态
watch(() => sceneStore.isTransitioning, (isTransitioning) => {
  if (isTransitioning) {
    // 过渡时可以暂停某些动画
  }
})

onMounted(() => {
  initThree()
  animate()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  cancelAnimationFrame(animationId)
  window.removeEventListener('resize', handleResize)

  // 清理Three.js资源
  renderer.dispose()
  scene.clear()
})
</script>

<template>
  <div ref="containerRef" class="three-canvas"></div>
</template>