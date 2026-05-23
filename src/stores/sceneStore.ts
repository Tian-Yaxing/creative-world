import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export type SceneState = 'entrance' | 'lobby' | 'world'
export type EntrancePhase = 'distant' | 'approaching' | 'entering' | 'transitioning'

export const useSceneStore = defineStore('scene', () => {
  // 当前场景
  const currentScene = ref<SceneState>('entrance')

  // 入口场景阶段
  const entrancePhase = ref<EntrancePhase>('distant')

  // 当前世界ID
  const currentWorldId = ref<number | null>(null)

  // 是否正在过渡
  const isTransitioning = ref(false)

  // 计算属性
  const isInEntrance = computed(() => currentScene.value === 'entrance')
  const isInLobby = computed(() => currentScene.value === 'lobby')
  const isInWorld = computed(() => currentScene.value === 'world')

  // 方法
  function setScene(scene: SceneState) {
    currentScene.value = scene
  }

  function setEntrancePhase(phase: EntrancePhase) {
    entrancePhase.value = phase
  }

  function setWorldId(id: number) {
    currentWorldId.value = id
  }

  function startTransition() {
    isTransitioning.value = true
  }

  function endTransition() {
    isTransitioning.value = false
  }

  // 进入大厅
  async function enterLobby() {
    startTransition()
    await new Promise(resolve => setTimeout(resolve, 3000))
    setScene('lobby')
    endTransition()
  }

  // 进入世界
  async function enterWorld(worldId: number) {
    startTransition()
    await new Promise(resolve => setTimeout(resolve, 2500))
    setWorldId(worldId)
    setScene('world')
    endTransition()
  }

  // 返回大厅
  async function returnToLobby() {
    startTransition()
    await new Promise(resolve => setTimeout(resolve, 2000))
    setWorldId(null)
    setScene('lobby')
    endTransition()
  }

  // 返回入口
  async function returnToEntrance() {
    startTransition()
    await new Promise(resolve => setTimeout(resolve, 2000))
    setWorldId(null)
    setScene('entrance')
    setEntrancePhase('distant')
    endTransition()
  }

  return {
    currentScene,
    entrancePhase,
    currentWorldId,
    isTransitioning,
    isInEntrance,
    isInLobby,
    isInWorld,
    setScene,
    setEntrancePhase,
    setWorldId,
    startTransition,
    endTransition,
    enterLobby,
    enterWorld,
    returnToLobby,
    returnToEntrance,
  }
})