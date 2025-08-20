<script setup lang="ts">
import { computed } from 'vue'
import type { Relationship, Table } from '@/types/erd'
import { RelationshipType } from '@/types/erd'
import { useERDStore } from '@/stores/erdStore'

interface Props {
  relationship: Relationship
  fromTable?: Table
  toTable?: Table
  isSelected?: boolean
}

interface Emits {
  (e: 'select', relationshipId: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const erdStore = useERDStore()

// 관계선 연결점 계산 (컬럼 행 중심 정렬)
const connectionPoints = computed(() => {
  if (!props.fromTable || !props.toTable) {
    return {
      start: { x: 0, y: 0 },
      end: { x: 100, y: 100 }
    }
  }

  const fromTable = props.fromTable
  const toTable = props.toTable

  const fromCenterX = fromTable.position.x + fromTable.size.width / 2
  const toCenterX = toTable.position.x + toTable.size.width / 2
  const isLeftToRight = fromCenterX <= toCenterX

  // 컬럼 행 중심 Y 계산 (fallback: 테이블 중심)
  const fromY = erdStore.getColumnCenterY(
    fromTable.id,
    props.relationship.fromColumnId
  ) ?? (fromTable.position.y + fromTable.size.height / 2)

  const toY = erdStore.getColumnCenterY(
    toTable.id,
    props.relationship.toColumnId
  ) ?? (toTable.position.y + toTable.size.height / 2)

  const start = {
    x: isLeftToRight ? (fromTable.position.x + fromTable.size.width) : fromTable.position.x,
    y: fromY
  }

  const end = {
    x: isLeftToRight ? toTable.position.x : (toTable.position.x + toTable.size.width),
    y: toY
  }

  return { start, end }
})

// 기존 getTableEdgePoint는 사용하지 않음 (컬럼 행 중심으로 정렬하도록 단순화)

// SVG 경로 데이터 생성
const pathData = computed(() => {
  const { start, end } = connectionPoints.value
  
  // 직선 또는 곡선 경로 생성
  const controlPoint1 = {
    x: start.x + (end.x - start.x) * 0.5,
    y: start.y
  }
  
  const controlPoint2 = {
    x: start.x + (end.x - start.x) * 0.5,
    y: end.y
  }

  return `M ${start.x} ${start.y} C ${controlPoint1.x} ${controlPoint1.y} ${controlPoint2.x} ${controlPoint2.y} ${end.x} ${end.y}`
})

// 관계 타입에 따른 화살표 마커
const markerUrl = computed(() => {
  switch (props.relationship.type) {
    case RelationshipType.ONE_TO_ONE:
      return 'url(#arrow-one-to-one)'
    case RelationshipType.ONE_TO_MANY:
      return 'url(#arrow-one-to-many)'
    case RelationshipType.MANY_TO_ONE:
      return 'url(#arrow-many-to-one)'
    case RelationshipType.MANY_TO_MANY:
      return 'url(#arrow-many-to-many)'
    default:
      return 'url(#arrow-default)'
  }
})

// 관계 타입 심볼
const relationshipTypeSymbol = computed(() => {
  switch (props.relationship.type) {
    case RelationshipType.ONE_TO_ONE:
      return '1:1'
    case RelationshipType.ONE_TO_MANY:
      return '1:N'
    case RelationshipType.MANY_TO_ONE:
      return 'N:1'
    case RelationshipType.MANY_TO_MANY:
      return 'N:M'
    default:
      return ''
  }
})

// 레이블 위치
const labelPosition = computed(() => {
  const { start, end } = connectionPoints.value
  return {
    x: (start.x + end.x) / 2,
    y: (start.y + end.y) / 2 - 10
  }
})

// 타입 표시 위치
const typePosition = computed(() => {
  const { start, end } = connectionPoints.value
  return {
    x: (start.x + end.x) / 2,
    y: (start.y + end.y) / 2 + 10
  }
})

// 클릭 핸들링
const handleClick = (event: MouseEvent) => {
  event.stopPropagation()
  emit('select', props.relationship.id)
}
</script>

<template>
  <g 
    class="relationship-line"
    :class="{ selected: isSelected }"
    @click="handleClick"
  >
    <!-- 관계선 -->
    <path
      :d="pathData"
      :stroke="isSelected ? '#1d72e8' : '#90a4ae'"
      :stroke-width="isSelected ? 3 : 2"
      fill="none"
      :marker-end="markerUrl"
      filter="url(#line-shadow)"
    />

    <!-- 관계 레이블 -->
    <text
      v-if="relationship.label"
      :x="labelPosition.x"
      :y="labelPosition.y"
      text-anchor="middle"
      dominant-baseline="middle"
      class="relationship-label"
      :fill="isSelected ? '#1976d2' : '#333'"
    >
      {{ relationship.label }}
    </text>

    <!-- 관계 타입 표시 -->
    <text
      :x="typePosition.x"
      :y="typePosition.y"
      text-anchor="middle"
      dominant-baseline="middle"
      class="relationship-type"
      :fill="isSelected ? '#1976d2' : '#666'"
    >
      {{ relationshipTypeSymbol }}
    </text>
  </g>
</template>



<style scoped>
.relationship-line {
  cursor: pointer;
}

.relationship-line:hover path {
  stroke: #2196f3;
  stroke-width: 3;
}

.relationship-label {
  font-size: 11px;
  font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  font-weight: 600;
}

.relationship-type {
  font-size: 10px;
  font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  font-weight: 600;
}
</style>

