<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useERDStore } from '@/stores/erdStore'
import TableNode from './TableNode.vue'
import RelationshipLine from './RelationshipLine.vue'
import PropertyPanel from './PropertyPanel.vue'
import type { Position } from '@/types/erd'

const erdStore = useERDStore()

const canvasContainer = ref<HTMLDivElement>()
const svgCanvas = ref<SVGSVGElement>()

const canvasSize = reactive({
  width: 1200,
  height: 800
})

const isPanning = ref(false)
const lastPanPosition = ref<Position>({ x: 0, y: 0 })

// 새 테이블 추가
const addNewTable = () => {
  const centerX = (-erdStore.canvas.panX + canvasSize.width / 2) / erdStore.canvas.zoom
  const centerY = (-erdStore.canvas.panY + canvasSize.height / 2) / erdStore.canvas.zoom
  
  erdStore.addTable({ x: centerX - 100, y: centerY - 50 })
}

// 캔버스 마우스 이벤트 처리
const handleCanvasMouseDown = (event: MouseEvent) => {
  if (event.target === svgCanvas.value || (event.target as Element).classList.contains('svg-canvas')) {
    isPanning.value = true
    lastPanPosition.value = { x: event.clientX, y: event.clientY }
    erdStore.clearSelection()
  }
}

const handleCanvasMouseMove = (event: MouseEvent) => {
  if (isPanning.value) {
    const deltaX = event.clientX - lastPanPosition.value.x
    const deltaY = event.clientY - lastPanPosition.value.y
    
    erdStore.updateCanvas({
      panX: erdStore.canvas.panX + deltaX,
      panY: erdStore.canvas.panY + deltaY
    })
    
    lastPanPosition.value = { x: event.clientX, y: event.clientY }
  }
}

const handleCanvasMouseUp = () => {
  isPanning.value = false
}

// 휠 이벤트로 줌 처리
const handleWheel = (event: WheelEvent) => {
  event.preventDefault()
  
  if (event.deltaY < 0) {
    erdStore.zoomIn()
  } else {
    erdStore.zoomOut()
  }
}

// 테이블 이동 처리
const handleTableMove = (tableId: string, position: Position) => {
  erdStore.moveTable(tableId, position)
}

// 테이블 리사이즈 처리
const handleTableResize = (tableId: string, size: { width: number; height: number }) => {
  erdStore.updateTable(tableId, { size })
}

// 캔버스 크기 조정
const updateCanvasSize = () => {
  if (canvasContainer.value) {
    const rect = canvasContainer.value.getBoundingClientRect()
    canvasSize.width = rect.width
    canvasSize.height = rect.height
  }
}

onMounted(() => {
  updateCanvasSize()
  window.addEventListener('resize', updateCanvasSize)
  
  // 전역 마우스 업 이벤트 (캔버스 밖에서 마우스를 놓았을 때)
  document.addEventListener('mouseup', handleCanvasMouseUp)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateCanvasSize)
  document.removeEventListener('mouseup', handleCanvasMouseUp)
})
</script>

<template>
  <div class="erd-canvas-container">
    <!-- 툴바 -->
    <div class="toolbar">
      <button @click="addNewTable" class="btn-primary">
        테이블 추가
      </button>
      <button @click="erdStore.zoomIn()" class="btn-secondary">
        확대
      </button>
      <button @click="erdStore.zoomOut()" class="btn-secondary">
        축소
      </button>
      <button @click="erdStore.resetZoom()" class="btn-secondary">
        리셋
      </button>
      <span class="zoom-info">{{ Math.round(erdStore.canvas.zoom * 100) }}%</span>
    </div>

    <!-- 메인 캔버스 -->
    <div 
      ref="canvasContainer" 
      class="canvas-container"
      @mousedown="handleCanvasMouseDown"
      @mousemove="handleCanvasMouseMove"
      @mouseup="handleCanvasMouseUp"
      @wheel="handleWheel"
    >
      <svg
        ref="svgCanvas"
        class="svg-canvas"
        :viewBox="`${-erdStore.canvas.panX} ${-erdStore.canvas.panY} ${canvasSize.width / erdStore.canvas.zoom} ${canvasSize.height / erdStore.canvas.zoom}`"
        :width="canvasSize.width"
        :height="canvasSize.height"
      >
        <!-- 그리드 배경 -->
        <defs>
          <pattern
            id="grid"
            :width="erdStore.canvas.gridSize"
            :height="erdStore.canvas.gridSize"
            patternUnits="userSpaceOnUse"
          >
            <path
              :d="`M ${erdStore.canvas.gridSize} 0 L 0 0 0 ${erdStore.canvas.gridSize}`"
              fill="none"
              stroke="#e0e0e0"
              stroke-width="1"
            />
          </pattern>
        </defs>
        
        <rect
          v-if="erdStore.canvas.showGrid"
          width="100%"
          height="100%"
          fill="url(#grid)"
        />

        <!-- 관계선들 -->
        <g class="relationships">
          <RelationshipLine
            v-for="relationship in erdStore.relationships"
            :key="relationship.id"
            :relationship="relationship"
            :from-table="erdStore.getTableById(relationship.fromTableId)"
            :to-table="erdStore.getTableById(relationship.toTableId)"
            @select="erdStore.selectRelationship(relationship.id)"
          />
        </g>

        <!-- 테이블들 -->
        <g class="tables">
          <TableNode
            v-for="table in erdStore.tables"
            :key="table.id"
            :table="table"
            :is-selected="erdStore.selectedTableId === table.id"
            @select="erdStore.selectTable(table.id)"
            @move="handleTableMove"
            @resize="handleTableResize"
          />
        </g>
      </svg>
    </div>

    <!-- 속성 패널 -->
    <PropertyPanel
      v-if="erdStore.selectedTable || erdStore.selectedRelationship"
      class="property-panel"
    />
  </div>
</template>

<style scoped>
.erd-canvas-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f5f5f5;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  background-color: white;
  border-bottom: 1px solid #e0e0e0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.btn-primary {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-primary:hover {
  background-color: #0056b3;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-secondary:hover {
  background-color: #545b62;
}

.zoom-info {
  font-size: 14px;
  color: #666;
  margin-left: 10px;
}

.canvas-container {
  flex: 1;
  position: relative;
  overflow: hidden;
  cursor: grab;
}

.canvas-container:active {
  cursor: grabbing;
}

.svg-canvas {
  display: block;
  background-color: white;
}

.property-panel {
  position: absolute;
  top: 70px;
  right: 20px;
  width: 300px;
  z-index: 1000;
}
</style>
