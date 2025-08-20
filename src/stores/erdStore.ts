import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import type { 
  Table, 
  Column, 
  Relationship, 
  CanvasSettings, 
  Position
} from '@/types/erd'
import { RelationshipType } from '@/types/erd'

export const useERDStore = defineStore('erd', () => {
  // 레이아웃 관련 상수 (TableNode와 동기화 필요)
  const headerHeight = 32
  const rowHeight = 24

  // 컬럼 수에 따른 최소 테이블 높이 보장 (자동 증가만, 축소하지 않음)
  const ensureTableHeightFitsColumns = (table: Table) => {
    const minHeight = headerHeight + table.columns.length * rowHeight
    if (table.size.height < minHeight) {
      table.size.height = minHeight
    }
  }

  // 상태
  const tables = ref<Table[]>([])
  const relationships = ref<Relationship[]>([])
  const selectedTableId = ref<string | null>(null)
  const selectedRelationshipId = ref<string | null>(null)
  
  // 연결 모드 상태
  const isConnecting = ref(false)
  const connectFrom = ref<{ tableId: string; columnId: string } | null>(null)
  const connectCursor = ref<Position>({ x: 0, y: 0 })
  
  const canvas = ref<CanvasSettings>({
    zoom: 1,
    panX: 0,
    panY: 0,
    gridSize: 20,
    showGrid: true
  })

  // 계산된 속성
  const selectedTable = computed(() => 
    tables.value.find(table => table.id === selectedTableId.value)
  )

  const selectedRelationship = computed(() =>
    relationships.value.find(rel => rel.id === selectedRelationshipId.value)
  )

  // 테이블 관련 액션
  const addTable = (position: Position) => {
    const newTable: Table = {
      id: uuidv4(),
      name: `Table_${tables.value.length + 1}`,
      position: { ...position },
      size: { width: 200, height: 100 },
      columns: [
        {
          id: uuidv4(),
          name: 'id',
          type: 'INT',
          isPrimaryKey: true,
          isForeignKey: false,
          isNotNull: true
        }
      ]
    }
    // 초기 크기도 컬럼 수에 맞춰 최소 높이 보장
    ensureTableHeightFitsColumns(newTable)
    tables.value.push(newTable)
    return newTable
  }

  const updateTable = (tableId: string, updates: Partial<Table>) => {
    const index = tables.value.findIndex(table => table.id === tableId)
    if (index !== -1) {
      const current = tables.value[index]
      const next: Table = { ...current, ...updates }
      if (updates.size && typeof updates.size.height === 'number') {
        const minHeight = headerHeight + next.columns.length * rowHeight
        next.size = { ...next.size, height: Math.max(updates.size.height, minHeight) }
      }
      tables.value[index] = next
    }
  }

  const deleteTable = (tableId: string) => {
    // 관련된 관계도 삭제
    relationships.value = relationships.value.filter(
      rel => rel.fromTableId !== tableId && rel.toTableId !== tableId
    )
    
    // 테이블 삭제
    tables.value = tables.value.filter(table => table.id !== tableId)
    
    // 선택된 테이블이 삭제된 경우 선택 해제
    if (selectedTableId.value === tableId) {
      selectedTableId.value = null
    }
  }

  const moveTable = (tableId: string, position: Position) => {
    updateTable(tableId, { position })
  }

  // 컬럼 관련 액션
  const addColumn = (tableId: string) => {
    const table = tables.value.find(t => t.id === tableId)
    if (table) {
      const newColumn: Column = {
        id: uuidv4(),
        name: `column_${table.columns.length + 1}`,
        type: 'VARCHAR(255)',
        isPrimaryKey: false,
        isForeignKey: false,
        isNotNull: false
      }
      table.columns.push(newColumn)
      // 컬럼 추가 시 높이 자동 보정 (오버플로우 방지)
      ensureTableHeightFitsColumns(table)
    }
  }

  const updateColumn = (tableId: string, columnId: string, updates: Partial<Column>) => {
    const table = tables.value.find(t => t.id === tableId)
    if (table) {
      const columnIndex = table.columns.findIndex(col => col.id === columnId)
      if (columnIndex !== -1) {
        table.columns[columnIndex] = { ...table.columns[columnIndex], ...updates }
      }
    }
  }

  const deleteColumn = (tableId: string, columnId: string) => {
    const table = tables.value.find(t => t.id === tableId)
    if (table) {
      table.columns = table.columns.filter(col => col.id !== columnId)
      
      // 관련된 관계도 삭제
      relationships.value = relationships.value.filter(
        rel => rel.fromColumnId !== columnId && rel.toColumnId !== columnId
      )

      // 컬럼 삭제 후에도 현재 높이가 너무 작지 않도록 보정 (자동 축소는 하지 않음)
      ensureTableHeightFitsColumns(table)
    }
  }

  // 관계 관련 액션
  const addRelationship = (
    fromTableId: string, 
    toTableId: string, 
    fromColumnId: string, 
    toColumnId: string, 
    type: RelationshipType
  ) => {
    const newRelationship: Relationship = {
      id: uuidv4(),
      fromTableId,
      toTableId,
      fromColumnId,
      toColumnId,
      type
    }
    relationships.value.push(newRelationship)
    return newRelationship
  }

  const deleteRelationship = (relationshipId: string) => {
    relationships.value = relationships.value.filter(rel => rel.id !== relationshipId)
    if (selectedRelationshipId.value === relationshipId) {
      selectedRelationshipId.value = null
    }
  }

  // 캔버스 관련 액션
  const updateCanvas = (updates: Partial<CanvasSettings>) => {
    canvas.value = { ...canvas.value, ...updates }
  }

  const zoomIn = () => {
    canvas.value.zoom = Math.min(canvas.value.zoom * 1.2, 3)
  }

  const zoomOut = () => {
    canvas.value.zoom = Math.max(canvas.value.zoom / 1.2, 0.1)
  }

  const resetZoom = () => {
    canvas.value.zoom = 1
  }

  // 선택 관련 액션
  const selectTable = (tableId: string | null) => {
    selectedTableId.value = tableId
    selectedRelationshipId.value = null
  }

  const selectRelationship = (relationshipId: string | null) => {
    selectedRelationshipId.value = relationshipId
    selectedTableId.value = null
  }

  const clearSelection = () => {
    selectedTableId.value = null
    selectedRelationshipId.value = null
  }

  // 유틸리티 함수
  const getTableById = (id: string) => tables.value.find(table => table.id === id)
  
  const getRelationshipsByTableId = (tableId: string) => 
    relationships.value.filter(rel => rel.fromTableId === tableId || rel.toTableId === tableId)

  // 연결 모드 액션
  const startConnect = (fromTableId: string, fromColumnId: string) => {
    isConnecting.value = true
    connectFrom.value = { tableId: fromTableId, columnId: fromColumnId }
  }

  const updateConnectCursor = (position: Position) => {
    connectCursor.value = position
  }

  const cancelConnect = () => {
    isConnecting.value = false
    connectFrom.value = null
  }

  const completeConnect = (toTableId: string, toColumnId: string) => {
    if (!isConnecting.value || !connectFrom.value) return null
    const from = connectFrom.value
    const relationship = addRelationship(
      from.tableId,
      toTableId,
      from.columnId,
      toColumnId,
      RelationshipType.ONE_TO_MANY
    )
    // 연결 종료 및 방금 생성된 관계 선택
    isConnecting.value = false
    connectFrom.value = null
    selectedRelationshipId.value = relationship.id
    selectedTableId.value = null
    return relationship
  }

  // 컬럼 유틸리티
  const getColumnIndex = (tableId: string, columnId: string) => {
    const table = getTableById(tableId)
    if (!table) return -1
    return table.columns.findIndex(c => c.id === columnId)
  }

  const getColumnCenterY = (tableId: string, columnId: string) => {
    const table = getTableById(tableId)
    if (!table) return null
    const index = getColumnIndex(tableId, columnId)
    if (index < 0) return null
    return table.position.y + headerHeight + index * rowHeight + rowHeight / 2
  }

  return {
    // 상태
    tables,
    relationships,
    selectedTableId,
    selectedRelationshipId,
    canvas,
    
    // 계산된 속성
    selectedTable,
    selectedRelationship,
    
    // 액션
    addTable,
    updateTable,
    deleteTable,
    moveTable,
    addColumn,
    updateColumn,
    deleteColumn,
    addRelationship,
    deleteRelationship,
    updateCanvas,
    zoomIn,
    zoomOut,
    resetZoom,
    selectTable,
    selectRelationship,
    clearSelection,
    getTableById,
    getRelationshipsByTableId,
    getColumnIndex,
    getColumnCenterY
    ,
    // 연결 모드 공개 API
    isConnecting,
    connectFrom,
    connectCursor,
    startConnect,
    updateConnectCursor,
    cancelConnect,
    completeConnect
  }
})
