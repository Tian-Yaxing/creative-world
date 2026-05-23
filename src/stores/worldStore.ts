import { defineStore } from 'pinia'
import { ref } from 'vue'

// 世界配置
export interface WorldConfig {
  id: number
  name: string
  color: string
  backgroundColor: string
  description: string
}

// 预设的世界配置
const worldConfigs: WorldConfig[] = [
  {
    id: 1,
    name: '卷轴一',
    color: '#6B4423',
    backgroundColor: '#F0E6D8',
    description: '第一扇门的世界',
  },
  {
    id: 2,
    name: '卷轴二',
    color: '#7B5B3A',
    backgroundColor: '#E8DCC8',
    description: '第二扇门的世界',
  },
  {
    id: 3,
    name: '卷轴三',
    color: '#8B6B4A',
    backgroundColor: '#DEC8B8',
    description: '第三扇门的世界',
  },
  {
    id: 4,
    name: '卷轴四',
    color: '#9B7B5A',
    backgroundColor: '#D4B8A8',
    description: '第四扇门的世界',
  },
]

export const useWorldStore = defineStore('world', () => {
  // 世界配置列表
  const worlds = ref<WorldConfig[]>(worldConfigs)

  // 当前选中的门
  const selectedDoorId = ref<number | null>(null)

  // 门是否打开
  const doorOpenStates = ref<Record<number, boolean>>({
    1: false,
    2: false,
    3: false,
    4: false,
  })

  // 获取世界配置
  function getWorldConfig(id: number): WorldConfig | undefined {
    return worlds.value.find(w => w.id === id)
  }

  // 选中门
  function selectDoor(id: number) {
    selectedDoorId.value = id
  }

  // 打开门
  function openDoor(id: number) {
    doorOpenStates.value[id] = true
  }

  // 重置门状态
  function resetDoors() {
    selectedDoorId.value = null
    doorOpenStates.value = { 1: false, 2: false, 3: false, 4: false }
  }

  return {
    worlds,
    selectedDoorId,
    doorOpenStates,
    getWorldConfig,
    selectDoor,
    openDoor,
    resetDoors,
  }
})