<script setup lang="ts">
import { computed } from 'vue'
import type { Relationship, Table } from '@/types/erd'
import { RelationshipType } from '@/types/erd'

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

// 관계선 연결점 계산
const connectionPoints = computed(() => {
  if (!props.fromTable || !props.toTable) {
    return {
      start: { x: 0, y: 0 },
      end: { x: 100, y: 100 }
    }
  }

  const fromTable = props.fromTable
  const toTable = props.toTable

  // 테이블 중심점 계산
  const fromCenter = {
    x: fromTable.position.x + fromTable.size.width / 2,
    y: fromTable.position.y + fromTable.size.height / 2
  }

  const toCenter = {
    x: toTable.position.x + toTable.size.width / 2,
    y: toTable.position.y + toTable.size.height / 2
  }

  // 테이블 경계와의 교점 찾기
  const start = getTableEdgePoint(fromTable, toCenter)
  const end = getTableEdgePoint(toTable, fromCenter)

  return { start, end }
})

// 테이블 경계와의 교점 계산
const getTableEdgePoint = (table: Table, targetPoint: { x: number; y: number }) => {
  const tableLeft = table.position.x
  const tableRight = table.position.x + table.size.width
  const tableTop = table.position.y
  const tableBottom = table.position.y + table.size.height
  const tableCenterX = table.position.x + table.size.width / 2
  const tableCenterY = table.position.y + table.size.height / 2

  // 방향 벡터
  const dx = targetPoint.x - tableCenterX
  const dy = targetPoint.y - tableCenterY

  // 어느 변과 교차하는지 판단
  const absX = Math.abs(dx)
  const absY = Math.abs(dy)

  if (absX / table.size.width > absY / table.size.height) {
    // 좌우 변과 교차
    if (dx > 0) {
      // 오른쪽 변
      return {
        x: tableRight,
        y: tableCenterY + (dy * table.size.width) / (2 * absX)
      }
    } else {
      // 왼쪽 변
      return {
        x: tableLeft,
        y: tableCenterY + (dy * table.size.width) / (2 * absX)
      }
    }
  } else {
    // 상하 변과 교차
    if (dy > 0) {
      // 아래쪽 변
      return {
        x: tableCenterX + (dx * table.size.height) / (2 * absY),
        y: tableBottom
      }
    } else {
      // 위쪽 변
      return {
        x: tableCenterX + (dx * table.size.height) / (2 * absY),
        y: tableTop
      }
    }
  }
}

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
      :stroke="isSelected ? '#2196f3' : '#666'"
      :stroke-width="isSelected ? 3 : 2"
      fill="none"
      :marker-end="markerUrl"
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
  font-size: 12px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  font-weight: bold;
}

.relationship-type {
  font-size: 10px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  font-weight: bold;
}
</style>

