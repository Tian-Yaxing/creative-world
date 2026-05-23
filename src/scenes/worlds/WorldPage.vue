<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import * as THREE from 'three'
import gsap from 'gsap'
import ThreeCanvas from '@/components/ThreeCanvas.vue'
import BackToEntrance from '@/components/BackToEntrance.vue'
import { useSceneStore } from '@/stores/sceneStore'
import { useWorldStore } from '@/stores/worldStore'

const router = useRouter()
const route = useRoute()
const sceneStore = useSceneStore()
const worldStore = useWorldStore()

// 世界ID
const worldId = computed(() => Number(route.params.id) || 1)

// 世界配置
const worldConfig = computed(() => worldStore.getWorldConfig(worldId.value))

// Three.js对象
let scene: THREE.Scene
let particles: THREE.Points

// 相机引用（用于传递给子组件）
const cameraRef = ref<THREE.PerspectiveCamera | null>(null)

// 设置场景
const setupScene = (threeScene: THREE.Scene, threeCamera: THREE.PerspectiveCamera) => {
  scene = threeScene
  cameraRef.value = threeCamera

  // 相机位置
  cameraRef.value.position.set(0, 3, 8)
  cameraRef.value.lookAt(0, 2, 0)

  // 环境光
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambientLight)

  // 定向光
  const directionalLight = new THREE.DirectionalLight(0xffeedd, 0.5)
  directionalLight.position.set(5, 10, 5)
  scene.add(directionalLight)

  // 背景色
  const bgColor = worldConfig.value?.backgroundColor || '#F0E6D8'
  scene.background = new THREE.Color(bgColor)

  // 创建简单背景
  createWorldBackground()

  // 创建粒子
  createParticles()

  // 相机入场动画（缓慢渐入）
  gsap.from(cameraRef.value.position, {
    z: 20,
    duration: 3,
    ease: 'power2.out',
  })
}

// 创建世界背景
const createWorldBackground = () => {
  // 地面
  const floorGeometry = new THREE.PlaneGeometry(50, 50)
  const floorColor = worldConfig.value?.backgroundColor || '#F0E6D8'
  const floorMaterial = new THREE.MeshPhongMaterial({
    color: floorColor,
    transparent: true,
    opacity: 0.9,
  })
  const floor = new THREE.Mesh(floorGeometry, floorMaterial)
  floor.rotation.x = -Math.PI / 2
  floor.position.y = 0
  scene.add(floor)

  // 装饰性几何体（书籍/卷轴形状）
  const decorGeometry = new THREE.BoxGeometry(15, 8, 1)
  const decorMaterial = new THREE.MeshPhongMaterial({
    color: worldConfig.value?.color || '#6B4423',
    transparent: true,
    opacity: 0.3,
  })
  const decor = new THREE.Mesh(decorGeometry, decorMaterial)
  decor.position.set(0, 4, -10)
  decor.rotation.z = 0.2
  scene.add(decor)
}

// 创建粒子
const createParticles = () => {
  const particleCount = 150
  const positions = new Float32Array(particleCount * 3)
  const particleColor = new THREE.Color(worldConfig.value?.color || '#6B4423')

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = Math.random() * 40 - 20
    positions[i * 3 + 1] = Math.random() * 15
    positions[i * 3 + 2] = Math.random() * 20 - 10
  }

  const particleGeometry = new THREE.BufferGeometry()
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

  const particleMaterial = new THREE.PointsMaterial({
    size: 0.2,
    color: particleColor,
    transparent: true,
    opacity: 0.4,
  })

  particles = new THREE.Points(particleGeometry, particleMaterial)
  scene.add(particles)
}

// 场景更新
const updateScene = (_deltaTime: number) => {
  if (!particles) return

  const positions = particles.geometry.attributes.position.array as Float32Array
  for (let i = 0; i < positions.length; i += 3) {
    positions[i + 1] += Math.sin(Date.now() * 0.001 + i) * 0.01
    positions[i] += Math.cos(Date.now() * 0.0005 + i) * 0.005
  }
  particles.geometry.attributes.position.needsUpdate = true
}

// 返回大厅
const handleReturn = async () => {
  // 退场动画（缓慢渐出）
  if (cameraRef.value) {
    await gsap.to(cameraRef.value.position, {
      z: 20,
      duration: 2.5,
      ease: 'power2.in',
    })
  }

  await sceneStore.returnToLobby()
  router.push('/lobby')
}

onMounted(() => {
  sceneStore.setScene('world')
  sceneStore.setWorldId(worldId.value)
})
</script>

<template>
  <div class="world-page">
    <ThreeCanvas
      :scene-setup="setupScene"
      :scene-update="updateScene"
    />

    <!-- 返回入口按钮 -->
    <BackToEntrance :camera="cameraRef" />

    <!-- 世界内容区域（预留） -->
    <div class="world-content">
      <h1 class="world-title">{{ worldConfig?.name || '卷轴世界' }}</h1>
      <p class="world-description">{{ worldConfig?.description || '门后的世界' }}</p>
      <p class="placeholder">内容待补充...</p>
    </div>

    <!-- 返回按钮 -->
    <div class="return-button" @click="handleReturn">
      <span>返回大厅</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.world-page {
  width: 100%;
  height: 100%;
  position: relative;
}

.world-content {
  position: absolute;
  top: 20%;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  z-index: 10;
}

.world-title {
  font-size: 2rem;
  color: $text;
  font-family: $font-serif;
  letter-spacing: 0.5em;
  margin-bottom: 1rem;
}

.world-description {
  font-size: 1rem;
  color: $text;
  opacity: 0.7;
}

.placeholder {
  font-size: 0.9rem;
  color: $border;
  margin-top: 2rem;
  opacity: 0.5;
}

.return-button {
  position: absolute;
  bottom: 15%;
  left: 50%;
  transform: translateX(-50%);
  padding: 1rem 2rem;
  border: 1px solid $border;
  border-radius: 4px;
  background: rgba($secondary, 0.9);
  cursor: pointer;
  transition: all $transition-fast;
  z-index: 10;

  &:hover {
    border-color: $accent;
    box-shadow: 0 4px 20px $shadow;
    transform: translateX(-50%) translateY(-3px);
  }

  span {
    font-size: 0.9rem;
    color: $text;
    letter-spacing: 0.2em;
  }
}
</style>