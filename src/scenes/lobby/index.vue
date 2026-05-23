<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import * as THREE from "three";
import gsap from "gsap";
import ThreeCanvas from "@/components/ThreeCanvas.vue";
import BackToEntrance from "@/components/BackToEntrance.vue";
import { useSceneStore } from "@/stores/sceneStore";
import { useWorldStore } from "@/stores/worldStore";

const router = useRouter();
const sceneStore = useSceneStore();
const worldStore = useWorldStore();

// Three.js 对象引用
let scene: THREE.Scene;
let renderer: THREE.WebGLRenderer;
let doorsGroup: THREE.Group;
let particles: THREE.Points;
let raycaster: THREE.Raycaster;
let mouse: THREE.Vector2;
let doorMeshes: THREE.Mesh[] = [];

// 相机引用（用于传递给子组件）
const cameraRef = ref<THREE.PerspectiveCamera | null>(null);

// 门的状态
const hoveredDoor = ref<number | null>(null);
const openingDoor = ref<number | null>(null);
const mousePosition = ref({ x: 0, y: 0 });

// 设置场景
const setupScene = (
  threeScene: THREE.Scene,
  threeCamera: THREE.PerspectiveCamera,
  threeRenderer: THREE.WebGLRenderer,
) => {
  scene = threeScene;
  cameraRef.value = threeCamera;
  renderer = threeRenderer;

  // 初始化Raycaster
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  // 设置相机位置（在大厅内）
  cameraRef.value.position.set(0, 4, 12);
  cameraRef.value.lookAt(0, 4, 0);

  // 添加环境光
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  // 添加定向光
  const directionalLight = new THREE.DirectionalLight(0xffeedd, 0.4);
  directionalLight.position.set(5, 10, 5);
  scene.add(directionalLight);

  // 创建大厅背景
  createLobbyBackground();

  // 创建门
  createDoors();

  // 创建粒子
  createParticles();
};

// 创建大厅背景
const createLobbyBackground = () => {
  // 地面
  const floorGeometry = new THREE.PlaneGeometry(30, 30);
  const floorMaterial = new THREE.MeshPhongMaterial({
    color: 0xe8e4d9,
    transparent: true,
    opacity: 0.9,
  });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0;
  scene.add(floor);

  // 天花板
  const ceilingGeometry = new THREE.PlaneGeometry(30, 30);
  const ceilingMaterial = new THREE.MeshPhongMaterial({
    color: 0xf5f0e6,
    transparent: true,
    opacity: 0.95,
  });
  const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = 10;
  scene.add(ceiling);

  // 墙壁（书页效果）
  const wallGeometry = new THREE.PlaneGeometry(30, 10);
  const wallMaterial = new THREE.MeshPhongMaterial({
    color: 0xf5f0e6,
  });

  // 后墙
  const backWall = new THREE.Mesh(wallGeometry, wallMaterial);
  backWall.position.set(0, 5, -15);
  scene.add(backWall);

  // 左墙
  const leftWall = new THREE.Mesh(wallGeometry, wallMaterial.clone());
  leftWall.position.set(-15, 5, 0);
  leftWall.rotation.y = Math.PI / 2;
  scene.add(leftWall);

  // 右墙
  const rightWallMaterial = new THREE.MeshPhongMaterial({
    color: 0xfaf8f5,
  });
  const rightWall = new THREE.Mesh(wallGeometry, rightWallMaterial);
  rightWall.position.set(15, 5, 0);
  rightWall.rotation.y = -Math.PI / 2;
  scene.add(rightWall);
};

// 创建门
const createDoors = () => {
  doorsGroup = new THREE.Group();

  const doorConfigs = [
    { id: 1, x: -6, color: 0xe8dcc8 },
    { id: 2, x: -2, color: 0xece0cc },
    { id: 3, x: 2, color: 0xf0e4d0 },
    { id: 4, x: 6, color: 0xf4e8d4 },
  ];

  doorConfigs.forEach((config) => {
    const doorGroup = createSingleDoor(config.id, config.x, config.color);
    doorsGroup.add(doorGroup);
  });

  scene.add(doorsGroup);
};

// 创建单个门
const createSingleDoor = (id: number, x: number, color: number) => {
  const group = new THREE.Group();
  group.name = `door-${id}`;
  group.userData.doorId = id;
  group.position.set(x, 4, -14);

  // 边框颜色
  const borderColor = 0xffffff;

  // 门板（像书页）- 用于Raycaster检测
  const doorGeometry = new THREE.BoxGeometry(3, 5.5, 0.2);
  const doorMaterial = new THREE.MeshPhongMaterial({
    color: color,
    transparent: true,
    opacity: 0.9,
  });
  const door = new THREE.Mesh(doorGeometry, doorMaterial);
  door.name = `door-panel-${id}`;
  door.userData.doorId = id;
  door.position.z = 0;
  group.add(door);

  // 保存门Mesh用于Raycaster检测
  doorMeshes.push(door);

  // 边框材质
  const borderMaterial = new THREE.MeshPhongMaterial({
    color: borderColor,
  });

  // 上边框
  const topBorderGeometry = new THREE.BoxGeometry(3.2, 0.2, 0.3);
  const topBorder = new THREE.Mesh(topBorderGeometry, borderMaterial);
  topBorder.position.set(0, 2.85, 0.05);
  group.add(topBorder);

  // 下边框
  const bottomBorderGeometry = new THREE.BoxGeometry(3.2, 0.2, 0.3);
  const bottomBorder = new THREE.Mesh(bottomBorderGeometry, borderMaterial);
  bottomBorder.position.set(0, -2.85, 0.05);
  group.add(bottomBorder);

  // 左边框
  const leftBorderGeometry = new THREE.BoxGeometry(0.2, 5.9, 0.3);
  const leftBorder = new THREE.Mesh(leftBorderGeometry, borderMaterial);
  leftBorder.position.set(-1.6, 0, 0.05);
  group.add(leftBorder);

  // 右边框
  const rightBorderGeometry = new THREE.BoxGeometry(0.2, 5.9, 0.3);
  const rightBorder = new THREE.Mesh(rightBorderGeometry, borderMaterial);
  rightBorder.position.set(1.6, 0, 0.05);
  group.add(rightBorder);

  // 门把手（书签装饰）
  const handleGeometry = new THREE.BoxGeometry(0.5, 1, 0.1);
  const handleMaterial = new THREE.MeshPhongMaterial({
    color: 0xd4c4a8,
    emissive: 0xd4c4a8,
    emissiveIntensity: 0.1,
  });
  const handle = new THREE.Mesh(handleGeometry, handleMaterial);
  handle.position.set(1, 0, 0.25);
  door.add(handle);

  // 门上的装饰线
  const titleGeometry = new THREE.BoxGeometry(2, 0.1, 0.05);
  const titleMaterial = new THREE.MeshPhongMaterial({
    color: 0xd4c4a8,
  });
  const title = new THREE.Mesh(titleGeometry, titleMaterial);
  title.position.set(0, 2, 0.25);
  door.add(title);

  return group;
};

// 创建粒子
const createParticles = () => {
  const particleCount = 100;
  const positions = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = Math.random() * 30 - 15;
    positions[i * 3 + 1] = Math.random() * 10;
    positions[i * 3 + 2] = Math.random() * 30 - 15;
  }

  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(positions, 3),
  );

  const particleMaterial = new THREE.PointsMaterial({
    size: 0.1,
    color: 0xf5f0e6,
    transparent: true,
    opacity: 0.4,
  });

  particles = new THREE.Points(particleGeometry, particleMaterial);
  scene.add(particles);
};

// 场景更新
const updateScene = (_deltaTime: number) => {
  if (!particles) return;

  // 粒子漂浮
  const positions = particles.geometry.attributes.position
    .array as Float32Array;
  for (let i = 0; i < positions.length; i += 3) {
    positions[i + 1] += Math.sin(Date.now() * 0.001 + i) * 0.005;
  }
  particles.geometry.attributes.position.needsUpdate = true;

  // 门hover效果
  updateDoorHoverEffect();
};

// 更新门hover效果
const updateDoorHoverEffect = () => {
  if (!doorsGroup) return;

  for (let i = 1; i <= 4; i++) {
    const doorGroup = doorsGroup.getObjectByName(`door-${i}`) as THREE.Group;
    if (!doorGroup) continue;

    const panel = doorGroup.getObjectByName(`door-panel-${i}`) as THREE.Mesh;
    if (!panel) continue;

    const material = panel.material as THREE.MeshPhongMaterial;

    if (hoveredDoor.value === i && !openingDoor.value) {
      // hover效果：发光、轻微前移（缓慢柔和）
      material.emissive = new THREE.Color(0xc9a961);
      material.emissiveIntensity = 0.3;
      gsap.to(doorGroup.position, {
        z: -13,
        duration: 1.2,
        ease: "power2.out",
      });
    } else if (!openingDoor.value || openingDoor.value !== i) {
      // 恢复（缓慢退回）
      material.emissive = new THREE.Color(0x000000);
      material.emissiveIntensity = 0;
      gsap.to(doorGroup.position, {
        z: -14,
        duration: 1.2,
        ease: "power2.out",
      });
    }
  }
};

// 鼠标移动检测
const handleMouseMove = (event: MouseEvent) => {
  if (openingDoor.value) return;

  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  mousePosition.value = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };

  // 计算鼠标在 normalized device coordinates 中的位置
  mouse.x = (mousePosition.value.x / rect.width) * 2 - 1;
  mouse.y = -(mousePosition.value.y / rect.height) * 2 + 1;

  // 使用Raycaster检测
  raycaster.setFromCamera(mouse, cameraRef.value!);
  const intersects = raycaster.intersectObjects(doorMeshes);

  if (intersects.length > 0) {
    const doorMesh = intersects[0].object as THREE.Mesh;
    const doorId = doorMesh.userData.doorId as number;
    if (hoveredDoor.value !== doorId) {
      hoveredDoor.value = doorId;
    }
  } else {
    hoveredDoor.value = null;
  }
};

// 点击门
const handleClick = async (event: MouseEvent) => {
  if (openingDoor.value) return;

  // 计算点击位置
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  // Raycaster检测点击
  raycaster.setFromCamera(mouse, cameraRef.value!);
  const intersects = raycaster.intersectObjects(doorMeshes);

  if (intersects.length > 0) {
    const doorMesh = intersects[0].object as THREE.Mesh;
    const doorId = doorMesh.userData.doorId as number;
    await handleDoorClick(doorId);
  }
};

// 点击门处理
const handleDoorClick = async (doorId: number) => {
  openingDoor.value = doorId;

  const doorGroup = doorsGroup.getObjectByName(`door-${doorId}`) as THREE.Group;
  if (!doorGroup) return;

  const panel = doorGroup.getObjectByName(`door-panel-${doorId}`) as THREE.Mesh;
  if (!panel) return;

  // 门打开动画
  worldStore.openDoor(doorId);

  // 门向两侧展开（缓慢展开）
  await gsap.to(panel.position, {
    x: 2,
    duration: 2,
    ease: "power2.out",
  });

  // 粒子扩散效果
  createDoorParticles(doorId);

  // 进入世界（等待过渡完成）
  await sceneStore.enterWorld(doorId);
  router.push(`/world/${doorId}`);
};

// 创建门打开时的粒子效果
const createDoorParticles = (doorId: number) => {
  const doorGroup = doorsGroup.getObjectByName(`door-${doorId}`) as THREE.Group;
  if (!doorGroup) return;

  const burstParticleCount = 50;
  const positions = new Float32Array(burstParticleCount * 3);

  for (let i = 0; i < burstParticleCount; i++) {
    positions[i * 3] = doorGroup.position.x + Math.random() * 4 - 2;
    positions[i * 3 + 1] = 4 + Math.random() * 4;
    positions[i * 3 + 2] = -14 + Math.random() * 2;
  }

  const burstGeometry = new THREE.BufferGeometry();
  burstGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(positions, 3),
  );

  const burstMaterial = new THREE.PointsMaterial({
    size: 0.15,
    color: 0xc9a961,
    transparent: true,
    opacity: 0.8,
  });

  const burstParticles = new THREE.Points(burstGeometry, burstMaterial);
  scene.add(burstParticles);

  // 粒子消散动画（缓慢消散）
  gsap.to(burstMaterial, {
    opacity: 0,
    duration: 3,
    ease: "power2.inOut",
    onComplete: () => {
      scene.remove(burstParticles);
    },
  });
};

onMounted(() => {
  sceneStore.setScene("lobby");
  worldStore.resetDoors();
});

onUnmounted(() => {
  doorMeshes = [];
});
</script>

<template>
  <div
    class="lobby-scene"
    :class="{ 'cursor-pointer': hoveredDoor && !openingDoor }"
    @mousemove="handleMouseMove"
    @click="handleClick"
  >
    <ThreeCanvas :scene-setup="setupScene" :scene-update="updateScene" />

    <!-- 返回入口按钮 -->
    <BackToEntrance :camera="cameraRef" />

    <!-- 门名称悬浮提示（跟随鼠标） -->
    <div
      v-if="hoveredDoor && !openingDoor"
      class="door-label-tooltip"
      :style="{
        left: mousePosition.x + 'px',
        top: mousePosition.y - 40 + 'px',
      }"
    >
      卷轴{{ hoveredDoor }}
    </div>

    <!-- 提示文字 -->
    <div class="hint-text">选择一扇门，开启新世界</div>
  </div>
</template>

<style lang="scss" scoped>
.lobby-scene {
  width: 100%;
  height: 100%;
  position: relative;
  cursor: default;

  &.cursor-pointer {
    cursor: pointer;
  }
}

.door-label-tooltip {
  position: absolute;
  padding: 8px 16px;
  background: rgba($secondary, 0.95);
  border: 1px solid $accent;
  border-radius: 4px;
  font-size: 0.9rem;
  color: $text;
  font-family: $font-serif;
  letter-spacing: 0.2em;
  pointer-events: none;
  z-index: 100;
  box-shadow: 0 4px 20px $shadow;
  transform: translateX(-50%);
  animation: fadeIn 0.2s ease;
  cursor: pointer;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

.hint-text {
  position: absolute;
  top: 15%;
  left: 50%;
  transform: translateX(-50%);
  font-size: 1rem;
  color: $text;
  opacity: 0.6;
  letter-spacing: 0.3em;
  pointer-events: none;
}
</style>
