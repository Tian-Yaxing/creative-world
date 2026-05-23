<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import * as THREE from 'three'
import gsap from 'gsap'
import ThreeCanvas from '@/components/ThreeCanvas.vue'
import { useSceneStore } from '@/stores/sceneStore'

const router = useRouter()
const sceneStore = useSceneStore()

// 相机位置
const cameraDistance = ref(30)
const isAnimating = ref(false)
const showHint = ref(true)

// Three.js对象引用
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let houseGroup: THREE.Group
let particles: THREE.Points
let skyGeometry: THREE.BufferGeometry

// 设置场景
const setupScene = (threeScene: THREE.Scene, threeCamera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer) => {
  scene = threeScene
  camera = threeCamera

  // 设置相机初始位置（远景）
  camera.position.set(0, 5, cameraDistance.value)
  camera.lookAt(0, 0, 0)

  // 添加环境光
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambientLight)

  // 添加定向光
  const directionalLight = new THREE.DirectionalLight(0xffeedd, 0.8)
  directionalLight.position.set(5, 10, 5)
  scene.add(directionalLight)

  // 创建天空/星空背景
  createSkyBox()

  // 创建房子轮廓
  createHouse()

  // 创建漂浮粒子
  createParticles()

  // 添加雾效果（远景朦胧感）
  scene.fog = new THREE.Fog(0xE8E4D9, cameraDistance.value - 10, cameraDistance.value + 20)
}

// 创建天空盒
const createSkyBox = () => {
  // 使用渐变色背景（模拟天空）
  skyGeometry = new THREE.PlaneGeometry(100, 100)
  const skyMaterial = new THREE.ShaderMaterial({
    uniforms: {
      topColor: { value: new THREE.Color(0xE8E4D9) },
      bottomColor: { value: new THREE.Color(0xF5F0E6) },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 topColor;
      uniform vec3 bottomColor;
      varying vec2 vUv;
      void main() {
        gl_FragColor = vec4(mix(bottomColor, topColor, vUv.y), 1.0);
      }
    `,
    side: THREE.DoubleSide,
  })
  const sky = new THREE.Mesh(skyGeometry, skyMaterial)
  sky.position.z = -50
  scene.add(sky)

  // 添加一些"云"的形状（书籍形状的云）
  createCloudShapes()
}

// 创建云形状
const createCloudShapes = () => {
  const cloudGeometry = new THREE.BoxGeometry(8, 2, 1)
  const cloudMaterial = new THREE.MeshBasicMaterial({
    color: 0xF5F0E6,
    transparent: true,
    opacity: 0.7,
  })

  for (let i = 0; i < 5; i++) {
    const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial.clone())
    cloud.position.set(
      Math.random() * 40 - 20,
      Math.random() * 10 + 5,
      -30 - Math.random() * 10
    )
    cloud.rotation.z = Math.random() * 0.3
    cloud.scale.set(1 + Math.random() * 0.5, 1, 1)
    scene.add(cloud)
  }
}

// 创建房子（书卷风格）
const createHouse = () => {
  houseGroup = new THREE.Group()

  // 房子主体（像一本大书）
  const bodyGeometry = new THREE.BoxGeometry(12, 8, 6)
  const bodyMaterial = new THREE.MeshPhongMaterial({
    color: 0x5D4037, // 深棕色
    transparent: true,
    opacity: 0.9,
  })
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
  body.position.y = 4
  houseGroup.add(body)

  // 房顶（像书页展开）
  const roofGeometry = new THREE.BoxGeometry(14, 1, 8)
  const roofMaterial = new THREE.MeshPhongMaterial({
    color: 0x7B5B3A,
  })
  const roof = new THREE.Mesh(roofGeometry, roofMaterial)
  roof.position.y = 8.5
  roof.rotation.z = 0.1
  houseGroup.add(roof)

  // 门（书签形状）
  const doorGeometry = new THREE.BoxGeometry(3, 5, 0.5)
  const doorMaterial = new THREE.MeshPhongMaterial({
    color: 0xC9A961, // 金色书签
    transparent: true,
    opacity: 0.9,
  })
  const door = new THREE.Mesh(doorGeometry, doorMaterial)
  door.position.set(0, 2.5, 3.5)
  door.name = 'door'
  houseGroup.add(door)

  // 门框
  const frameGeometry = new THREE.BoxGeometry(3.5, 5.5, 0.2)
  const frameMaterial = new THREE.MeshPhongMaterial({
    color: 0xB8A88A,
  })
  const frame = new THREE.Mesh(frameGeometry, frameMaterial)
  frame.position.set(0, 2.5, 3.2)
  houseGroup.add(frame)

  scene.add(houseGroup)
}

// 创建漂浮粒子（尘埃效果）
const createParticles = () => {
  const particleCount = 200
  const positions = new Float32Array(particleCount * 3)
  const colors = new Float32Array(particleCount * 3)

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = Math.random() * 60 - 30
    positions[i * 3 + 1] = Math.random() * 20
    positions[i * 3 + 2] = Math.random() * 40 - 20

    // 柔和的米白色粒子
    colors[i * 3] = 0.96 // R
    colors[i * 3 + 1] = 0.94 // G
    colors[i * 3 + 2] = 0.90 // B
  }

  const particleGeometry = new THREE.BufferGeometry()
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

  const particleMaterial = new THREE.PointsMaterial({
    size: 0.15,
    vertexColors: true,
    transparent: true,
    opacity: 0.6,
  })

  particles = new THREE.Points(particleGeometry, particleMaterial)
  scene.add(particles)
}

// 场景更新（粒子动画）
const updateScene = (deltaTime: number) => {
  if (!particles) return

  // 粒子漂浮动画
  const positions = particles.geometry.attributes.position.array as Float32Array
  for (let i = 0; i < positions.length; i += 3) {
    positions[i + 1] += Math.sin(Date.now() * 0.001 + i) * 0.01
    positions[i] += Math.cos(Date.now() * 0.0005 + i) * 0.005
  }
  particles.geometry.attributes.position.needsUpdate = true

  // 房子轻微旋转（远景时）
  if (houseGroup && cameraDistance.value > 20) {
    houseGroup.rotation.y = Math.sin(Date.now() * 0.0005) * 0.05
  }
}

// 用户点击进入
const handleEnter = async () => {
  if (isAnimating.value) return
  isAnimating.value = true
  showHint.value = false

  sceneStore.setEntrancePhase('approaching')

  // 相机推进动画（缓慢推进）
  await gsap.to(camera.position, {
    z: 15,
    y: 4,
    duration: 4,
    ease: 'power2.inOut',
  })

  // 更新雾效果（房子更清晰）
  scene.fog = new THREE.Fog(0xE8E4D9, 5, 25)

  sceneStore.setEntrancePhase('entering')

  // 等待一下
  await new Promise(resolve => setTimeout(resolve, 1200))

  // 门打开动画（缓慢展开）
  const door = houseGroup.getObjectByName('door') as THREE.Mesh
  if (door) {
    await gsap.to(door.position, {
      z: 4.5,
      duration: 2,
      ease: 'power2.out',
    })

    // 门消失（缓慢消失）
    await gsap.to(door.material, {
      opacity: 0,
      duration: 1.5,
      ease: 'power2.inOut',
    })
  }

  sceneStore.setEntrancePhase('transitioning')

  // 进入房子过渡（缓慢进入）
  await gsap.to(camera.position, {
    z: 0,
    y: 4,
    duration: 2.5,
    ease: 'power2.in',
  })

  // 跳转到大厅
  await sceneStore.enterLobby()
  router.push('/lobby')
}

onMounted(() => {
  sceneStore.setScene('entrance')
  sceneStore.setEntrancePhase('distant')
})
</script>

<template>
  <div class="entrance-scene">
    <ThreeCanvas
      :scene-setup="setupScene"
      :scene-update="updateScene"
    />

    <!-- 互动提示 -->
    <div
      v-if="showHint"
      class="interaction-hint"
      @click="handleEnter"
    >
      走进房子 · 探索门的世界
    </div>

    <!-- 装饰文字 -->
    <div class="decoration-text">
      <p class="subtitle">一段关于门的旅程</p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.entrance-scene {
  width: 100%;
  height: 100%;
  position: relative;
}

.decoration-text {
  position: absolute;
  top: 10%;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  opacity: 0.7;
}

.subtitle {
  font-size: 1rem;
  color: $text;
  font-family: $font-serif;
  letter-spacing: 0.5em;
}
</style>