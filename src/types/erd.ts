// ERD 관련 타입 정의

export interface Position {
  x: number
  y: number
}

export interface Size {
  width: number
  height: number
}

export interface Column {
  id: string
  name: string
  type: string
  isPrimaryKey: boolean
  isForeignKey: boolean
  isNotNull: boolean
  defaultValue?: string
  comment?: string
}

export interface Table {
  id: string
  logicalName: string    // 논리명 (한글 등 사용자 친화적 이름)
  physicalName: string   // 물리명 (영문 등 실제 DB 테이블명)
  position: Position
  size: Size
  columns: Column[]
  comment?: string
}

export interface Relationship {
  id: string
  fromTableId: string
  toTableId: string
  fromColumnId: string
  toColumnId: string
  type: RelationshipType
  label?: string
}

export enum RelationshipType {
  ONE_TO_ONE = 'one-to-one',
  ONE_TO_MANY = 'one-to-many',
  MANY_TO_ONE = 'many-to-one',
  MANY_TO_MANY = 'many-to-many'
}

export interface CanvasSettings {
  zoom: number
  panX: number
  panY: number
  gridSize: number
  showGrid: boolean
}

export interface ERDDocument {
  id: string
  name: string
  tables: Table[]
  relationships: Relationship[]
  canvas: CanvasSettings
  createdAt: Date
  updatedAt: Date
}
