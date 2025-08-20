<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Table, Position } from '@/types/erd'

interface Props {
  table: Table
  isSelected: boolean
}

interface Emits {
  (e: 'select', tableId: string): void
  (e: 'move', tableId: string, position: Position): void
  (e: 'resize', tableId: string, size: { width: number; height: number }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const headerHeight = 32
const rowHeight = 24
const hoveredColumnId = ref<string | null>(null)

const isDragging = ref(false)
const isResizing = ref(false)
const dragStart = ref<Position>({ x: 0, y: 0 })
const initialPosition = ref<Position>({ x: 0, y: 0 })
const initialSize = ref({ width: 0, height: 0 })

// 테이블 높이 계산
const tableHeight = computed(() => {
  return headerHeight + props.table.columns.length * rowHeight
})

// 마우스 다운 핸들링
const handleMouseDown = (event: MouseEvent) => {
  event.stopPropagation()
  emit('select', props.table.id)
  
  if (!isResizing.value) {
    isDragging.value = true
    dragStart.value = { x: event.clientX, y: event.clientY }
    initialPosition.value = { ...props.table.position }
    
    document.addEventListener('mousemove', handleDrag)
    document.addEventListener('mouseup', handleDragEnd)
  }
}

// 드래그 처리
const handleDrag = (event: MouseEvent) => {
  if (isDragging.value) {
    const deltaX = event.clientX - dragStart.value.x
    const deltaY = event.clientY - dragStart.value.y
    
    const newPosition: Position = {
      x: initialPosition.value.x + deltaX,
      y: initialPosition.value.y + deltaY
    }
    
    emit('move', props.table.id, newPosition)
  }
}

// 드래그 종료
const handleDragEnd = () => {
  isDragging.value = false
  document.removeEventListener('mousemove', handleDrag)
  document.removeEventListener('mouseup', handleDragEnd)
}

// 리사이즈 시작
const handleResizeStart = (event: MouseEvent) => {
  event.stopPropagation()
  isResizing.value = true
  dragStart.value = { x: event.clientX, y: event.clientY }
  initialSize.value = { ...props.table.size }
  
  document.addEventListener('mousemove', handleResize)
  document.addEventListener('mouseup', handleResizeEnd)
}

// 리사이즈 처리
const handleResize = (event: MouseEvent) => {
  if (isResizing.value) {
    const deltaX = event.clientX - dragStart.value.x
    const deltaY = event.clientY - dragStart.value.y
    
    const newSize = {
      width: Math.max(150, initialSize.value.width + deltaX),
      height: Math.max(tableHeight.value, initialSize.value.height + deltaY)
    }
    
    emit('resize', props.table.id, newSize)
  }
}

// 리사이즈 종료
const handleResizeEnd = () => {
  isResizing.value = false
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', handleResizeEnd)
}
</script>

<template>
  <g 
    class="table-node"
    :class="{ selected: isSelected }"
    @mousedown="handleMouseDown"
  >
    <!-- 테이블 배경 -->
    <rect
      :x="table.position.x"
      :y="table.position.y"
      :width="table.size.width"
      :height="table.size.height"
      :fill="isSelected ? '#e3f2fd' : 'white'"
      :stroke="isSelected ? '#2196f3' : '#ccc'"
      :stroke-width="isSelected ? 2 : 1"
      rx="4"
      ry="4"
    />

    <!-- 테이블 헤더 -->
    <rect
      :x="table.position.x"
      :y="table.position.y"
      :width="table.size.width"
      :height="headerHeight"
      fill="#f8f9fa"
      :stroke="isSelected ? '#2196f3' : '#ccc'"
      :stroke-width="isSelected ? 2 : 1"
      rx="4"
      ry="4"
    />
    
    <!-- 헤더 하단 라인 -->
    <line
      :x1="table.position.x"
      :y1="table.position.y + headerHeight"
      :x2="table.position.x + table.size.width"
      :y2="table.position.y + headerHeight"
      :stroke="isSelected ? '#2196f3' : '#ccc'"
      :stroke-width="isSelected ? 2 : 1"
    />

    <!-- 테이블 이름 -->
    <text
      :x="table.position.x + table.size.width / 2"
      :y="table.position.y + headerHeight / 2"
      text-anchor="middle"
      dominant-baseline="middle"
      class="table-title"
      :fill="isSelected ? '#1976d2' : '#333'"
    >
      {{ table.name }}
    </text>

    <!-- 컬럼 목록 -->
    <g class="columns">
      <g
        v-for="(column, index) in table.columns"
        :key="column.id"
        class="column-row"
      >
        <!-- 컬럼 배경 (호버 효과용) -->
        <rect
          :x="table.position.x"
          :y="table.position.y + headerHeight + index * rowHeight"
          :width="table.size.width"
          :height="rowHeight"
          fill="transparent"
          class="column-background"
          @mouseenter="hoveredColumnId = column.id"
          @mouseleave="hoveredColumnId = null"
        />

        <!-- PK 아이콘 -->
        <text
          v-if="column.isPrimaryKey"
          :x="table.position.x + 8"
          :y="table.position.y + headerHeight + index * rowHeight + rowHeight / 2"
          dominant-baseline="middle"
          class="pk-icon"
          fill="#ffc107"
        >
          🔑
        </text>

        <!-- FK 아이콘 -->
        <text
          v-if="column.isForeignKey"
          :x="table.position.x + (column.isPrimaryKey ? 24 : 8)"
          :y="table.position.y + headerHeight + index * rowHeight + rowHeight / 2"
          dominant-baseline="middle"
          class="fk-icon"
          fill="#6c757d"
        >
          🔗
        </text>

        <!-- 컬럼 이름 -->
        <text
          :x="table.position.x + (column.isPrimaryKey || column.isForeignKey ? 40 : 12)"
          :y="table.position.y + headerHeight + index * rowHeight + rowHeight / 2"
          dominant-baseline="middle"
          class="column-name"
          :fill="column.isPrimaryKey ? '#1976d2' : '#333'"
          :font-weight="column.isPrimaryKey ? 'bold' : 'normal'"
        >
          {{ column.name }}
        </text>

        <!-- 컬럼 타입 -->
        <text
          :x="table.position.x + table.size.width - 8"
          :y="table.position.y + headerHeight + index * rowHeight + rowHeight / 2"
          text-anchor="end"
          dominant-baseline="middle"
          class="column-type"
          fill="#666"
        >
          {{ column.type }}
        </text>

        <!-- 컬럼 구분선 -->
        <line
          v-if="index < table.columns.length - 1"
          :x1="table.position.x"
          :y1="table.position.y + headerHeight + (index + 1) * rowHeight"
          :x2="table.position.x + table.size.width"
          :y2="table.position.y + headerHeight + (index + 1) * rowHeight"
          stroke="#eee"
          stroke-width="1"
        />
      </g>
    </g>

    <!-- 리사이즈 핸들 -->
    <rect
      v-if="isSelected"
      :x="table.position.x + table.size.width - 8"
      :y="table.position.y + table.size.height - 8"
      width="8"
      height="8"
      fill="#2196f3"
      class="resize-handle"
      @mousedown.stop="handleResizeStart"
    />
  </g>
</template>

<style scoped>
.table-node {
  cursor: move;
}

.table-node.selected {
  filter: drop-shadow(0 4px 8px rgba(33, 150, 243, 0.3));
}

.table-title {
  font-size: 14px;
  font-weight: bold;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.column-name {
  font-size: 12px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.column-type {
  font-size: 11px;
  font-family: 'Courier New', monospace;
}

.pk-icon, .fk-icon {
  font-size: 12px;
}

.column-background:hover {
  fill: #f0f8ff;
}

.resize-handle {
  cursor: nw-resize;
}

.resize-handle:hover {
  fill: #1976d2;
}
</style>
