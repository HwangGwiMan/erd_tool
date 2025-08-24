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
  const target = event.target as Element
  
  // SVG 캔버스 내부인지 확인 (테이블이나 관계선이 아닌 빈 공간)
  const isCanvasArea = target === svgCanvas.value || 
                      target.classList.contains('svg-canvas') ||
                      target.tagName === 'rect' // 그리드 배경
  
  // 휠 클릭(중간 버튼, button === 1) 또는 우클릭으로 패닝 시작
  if ((event.button === 1 || event.button === 2)) {
    event.preventDefault()
    isPanning.value = true
    lastPanPosition.value = { x: event.clientX, y: event.clientY }
    if (isCanvasArea) {
      erdStore.clearSelection()
    }
  }
  // 좌클릭으로 빈 캔버스 클릭 시 선택 해제
  else if (event.button === 0 && isCanvasArea) {
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
  // 연결 모드 중이면 커서 좌표 업데이트 (뷰박스 좌표계 기준)
  if (erdStore.isConnecting) {
    const pt = svgCanvas.value?.createSVGPoint()
    if (pt && svgCanvas.value) {
      pt.x = event.clientX
      pt.y = event.clientY
      const ctm = svgCanvas.value.getScreenCTM()
      if (ctm) {
        const inv = ctm.inverse()
        const svgP = pt.matrixTransform(inv)
        erdStore.updateConnectCursor({ x: svgP.x, y: svgP.y })
      }
    }
  }
}

const handleCanvasMouseUp = () => {
  isPanning.value = false
  // 캔버스에서 놓으면 연결 취소
  if (erdStore.isConnecting) {
    erdStore.cancelConnect()
  }
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

// 키보드 처리 (ESC로 연결 취소)
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && erdStore.isConnecting) {
    erdStore.cancelConnect()
  }
}

// 파일 입력용 숨김 input
const fileInput = document.createElement('input')
fileInput.type = 'file'
fileInput.accept = '.json,.erd.json,application/json'
fileInput.style.display = 'none'
fileInput.addEventListener('change', async () => {
  const file = fileInput.files?.[0]
  if (!file) return
  try {
    const text = await file.text()
    const parsed = JSON.parse(text)
    if (parsed.createdAt) parsed.createdAt = new Date(parsed.createdAt)
    if (parsed.updatedAt) parsed.updatedAt = new Date(parsed.updatedAt)
    erdStore.deserializeERD(parsed)
    alert('불러오기 완료')
  } catch (e) {
    console.error(e)
    alert('불러오기 실패: 올바른 ERD JSON 파일이 아닙니다.')
  } finally {
    fileInput.value = ''
  }
})

const handleImportClick = () => {
  fileInput.click()
}

// 내보내기 처리
const handleExport = () => {
  const doc = erdStore.serializeERD()
  const json = JSON.stringify({
    ...doc,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString()
  }, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  a.href = url
  a.download = `ERD-${timestamp}.erd.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
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
  window.addEventListener('keydown', handleKeyDown)
  
  // 전역 마우스 업 이벤트 (캔버스 밖에서 마우스를 놓았을 때)
  document.addEventListener('mouseup', handleCanvasMouseUp)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateCanvasSize)
  window.removeEventListener('keydown', handleKeyDown)
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
      <button @click="erdStore.resetZoom()" class="btn-secondary">
        리셋
      </button>
      <button @click="handleImportClick" class="btn-secondary">불러오기</button>
      <button @click="handleExport" class="btn-secondary">내보내기</button>
      <span class="zoom-info">{{ Math.round(erdStore.canvas.zoom * 100) }}%</span>
    </div>

    <!-- 메인 캔버스 -->
    <div 
      ref="canvasContainer" 
      class="canvas-container"
      :class="{ panning: isPanning }"
      @mousedown="handleCanvasMouseDown"
      @mousemove="handleCanvasMouseMove"
      @mouseup="handleCanvasMouseUp"
      @wheel="handleWheel"
      @contextmenu.prevent
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
              stroke="#e9ecef"
              stroke-width="1"
            />
          </pattern>

          <!-- 관계선 화살표 마커 정의 -->
          <marker id="arrow-default" markerWidth="10" markerHeight="10" refX="10" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L10,3 L0,6 Z" fill="#90a4ae" />
          </marker>
          <marker id="arrow-one-to-one" markerWidth="10" markerHeight="10" refX="10" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L10,3 L0,6 Z" fill="#90a4ae" />
          </marker>
          <marker id="arrow-one-to-many" markerWidth="10" markerHeight="10" refX="10" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L10,3 L0,6 Z" fill="#90a4ae" />
          </marker>
          <marker id="arrow-many-to-one" markerWidth="10" markerHeight="10" refX="10" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L10,3 L0,6 Z" fill="#90a4ae" />
          </marker>
          <marker id="arrow-many-to-many" markerWidth="10" markerHeight="10" refX="10" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L10,3 L0,6 Z" fill="#90a4ae" />
          </marker>

          <!-- 관계선 그림자 -->
          <filter id="line-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1" stdDeviation="1" flood-color="#000" flood-opacity="0.15" />
          </filter>
        </defs>
        
        <!-- 무한 그리드 배경 (뷰포트 기반 동적 크기) -->
        <rect
          v-if="erdStore.canvas.showGrid"
          :x="-erdStore.canvas.panX - canvasSize.width"
          :y="-erdStore.canvas.panY - canvasSize.height"
          :width="canvasSize.width * 3 / erdStore.canvas.zoom"
          :height="canvasSize.height * 3 / erdStore.canvas.zoom"
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
          <!-- 연결 모드 임시선 -->
          <line
            v-if="erdStore.isConnecting && erdStore.connectFrom"
            :x1="(erdStore.getTableById(erdStore.connectFrom.tableId)?.position.x ?? 0) + (erdStore.getTableById(erdStore.connectFrom.tableId)?.size.width ?? 0) - 6"
            :y1="erdStore.getColumnCenterY(erdStore.connectFrom.tableId, erdStore.connectFrom.columnId) ?? 0"
            :x2="erdStore.connectCursor.x"
            :y2="erdStore.connectCursor.y"
            stroke="#2196f3"
            stroke-dasharray="4 4"
            stroke-width="2"
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

.canvas-container.panning {
  cursor: grabbing !important;
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
