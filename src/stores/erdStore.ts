import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import type { 
  Table, 
  Column, 
  Relationship, 
  CanvasSettings, 
  Position,
  RelationshipType 
} from '@/types/erd'

export const useERDStore = defineStore('erd', () => {
  // 상태
  const tables = ref<Table[]>([])
  const relationships = ref<Relationship[]>([])
  const selectedTableId = ref<string | null>(null)
  const selectedRelationshipId = ref<string | null>(null)
  
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
    tables.value.push(newTable)
    return newTable
  }

  const updateTable = (tableId: string, updates: Partial<Table>) => {
    const index = tables.value.findIndex(table => table.id === tableId)
    if (index !== -1) {
      tables.value[index] = { ...tables.value[index], ...updates }
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
    getRelationshipsByTableId
  }
})
