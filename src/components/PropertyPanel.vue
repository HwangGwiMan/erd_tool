<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useERDStore } from '@/stores/erdStore'
import { RelationshipType } from '@/types/erd'
import type { Table, Relationship } from '@/types/erd'

const erdStore = useERDStore()

// 폼 데이터
const tableForm = ref<Partial<Table>>({})
const relationshipForm = ref<Partial<Relationship>>({})

// 선택된 테이블이 변경될 때 폼 데이터 업데이트
watch(() => erdStore.selectedTable, (newTable) => {
  if (newTable) {
    tableForm.value = {
      name: newTable.name,
      comment: newTable.comment
    }
  }
}, { immediate: true })

// 선택된 관계가 변경될 때 폼 데이터 업데이트
watch(() => erdStore.selectedRelationship, (newRelationship) => {
  if (newRelationship) {
    relationshipForm.value = {
      label: newRelationship.label,
      type: newRelationship.type
    }
  }
}, { immediate: true })

// 테이블 업데이트
const updateTable = () => {
  if (erdStore.selectedTableId && tableForm.value) {
    erdStore.updateTable(erdStore.selectedTableId, {
      name: tableForm.value.name,
      comment: tableForm.value.comment
    })
  }
}

// 컬럼 추가
const addColumn = () => {
  if (erdStore.selectedTableId) {
    erdStore.addColumn(erdStore.selectedTableId)
  }
}

// 컬럼 업데이트
const updateColumn = (columnId: string) => {
  if (erdStore.selectedTableId) {
    const column = erdStore.selectedTable?.columns.find(col => col.id === columnId)
    if (column) {
      erdStore.updateColumn(erdStore.selectedTableId, columnId, column)
    }
  }
}

// 컬럼 삭제
const deleteColumn = (columnId: string) => {
  if (erdStore.selectedTableId) {
    if (confirm('정말로 이 컬럼을 삭제하시겠습니까?')) {
      erdStore.deleteColumn(erdStore.selectedTableId, columnId)
    }
  }
}

// 테이블 삭제
const deleteTable = () => {
  if (erdStore.selectedTableId) {
    if (confirm('정말로 이 테이블을 삭제하시겠습니까? 관련된 모든 관계도 함께 삭제됩니다.')) {
      erdStore.deleteTable(erdStore.selectedTableId)
    }
  }
}

// 관계 업데이트
const updateRelationship = () => {
  if (erdStore.selectedRelationshipId && relationshipForm.value) {
    const index = erdStore.relationships.findIndex(rel => rel.id === erdStore.selectedRelationshipId)
    if (index !== -1) {
      erdStore.relationships[index] = {
        ...erdStore.relationships[index],
        label: relationshipForm.value.label,
        type: relationshipForm.value.type!
      }
    }
  }
}

// 관계 삭제
const deleteRelationship = () => {
  if (erdStore.selectedRelationshipId) {
    if (confirm('정말로 이 관계를 삭제하시겠습니까?')) {
      erdStore.deleteRelationship(erdStore.selectedRelationshipId)
    }
  }
}
</script>

<template>
  <div class="property-panel">
    <div class="panel-header">
      <h3>속성</h3>
      <button @click="erdStore.clearSelection()" class="close-btn">×</button>
    </div>

    <!-- 테이블 속성 편집 -->
    <div v-if="erdStore.selectedTable" class="panel-content">
      <div class="section">
        <h4>테이블 정보</h4>
        <div class="form-group">
          <label>테이블명</label>
          <input
            v-model="tableForm.name"
            @blur="updateTable"
            type="text"
            class="form-input"
            placeholder="테이블명을 입력하세요"
          />
        </div>
        <div class="form-group">
          <label>설명</label>
          <textarea
            v-model="tableForm.comment"
            @blur="updateTable"
            class="form-textarea"
            placeholder="테이블 설명을 입력하세요"
            rows="2"
          />
        </div>
      </div>

      <div class="section">
        <div class="section-header">
          <h4>컬럼</h4>
          <button @click="addColumn" class="btn-add">+ 컬럼 추가</button>
        </div>
        
        <div class="columns-list">
          <div
            v-for="(column, index) in erdStore.selectedTable.columns"
            :key="column.id"
            class="column-item"
          >
            <div class="column-header">
              <span class="column-index">{{ index + 1 }}</span>
              <input
                v-model="column.name"
                @blur="updateColumn(column.id)"
                class="column-name-input"
                placeholder="컬럼명"
              />
              <button @click="deleteColumn(column.id)" class="btn-delete">×</button>
            </div>
            
            <div class="column-details">
              <div class="form-row">
                <div class="form-col">
                  <label>타입</label>
                  <select v-model="column.type" @change="updateColumn(column.id)" class="form-select">
                    <option value="INT">INT</option>
                    <option value="VARCHAR(255)">VARCHAR(255)</option>
                    <option value="TEXT">TEXT</option>
                    <option value="DATETIME">DATETIME</option>
                    <option value="DATE">DATE</option>
                    <option value="TIME">TIME</option>
                    <option value="BOOLEAN">BOOLEAN</option>
                    <option value="DECIMAL(10,2)">DECIMAL(10,2)</option>
                    <option value="FLOAT">FLOAT</option>
                    <option value="DOUBLE">DOUBLE</option>
                  </select>
                </div>
                <div class="form-col">
                  <label>기본값</label>
                  <input
                    v-model="column.defaultValue"
                    @blur="updateColumn(column.id)"
                    type="text"
                    class="form-input"
                    placeholder="기본값"
                  />
                </div>
              </div>
              
              <div class="form-checkboxes">
                <label class="checkbox-label">
                  <input
                    v-model="column.isPrimaryKey"
                    @change="updateColumn(column.id)"
                    type="checkbox"
                  />
                  기본키 (PK)
                </label>
                <label class="checkbox-label">
                  <input
                    v-model="column.isForeignKey"
                    @change="updateColumn(column.id)"
                    type="checkbox"
                  />
                  외래키 (FK)
                </label>
                <label class="checkbox-label">
                  <input
                    v-model="column.isNotNull"
                    @change="updateColumn(column.id)"
                    type="checkbox"
                  />
                  NOT NULL
                </label>
              </div>
              
              <div class="form-group">
                <label>설명</label>
                <input
                  v-model="column.comment"
                  @blur="updateColumn(column.id)"
                  type="text"
                  class="form-input"
                  placeholder="컬럼 설명"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-header">
          <h4>테이블 액션</h4>
        </div>
        <button @click="deleteTable" class="btn-danger">테이블 삭제</button>
      </div>
    </div>

    <!-- 관계 속성 편집 -->
    <div v-else-if="erdStore.selectedRelationship" class="panel-content">
      <div class="section">
        <h4>관계 정보</h4>
        <div class="form-group">
          <label>관계명</label>
          <input
            v-model="relationshipForm.label"
            @blur="updateRelationship"
            type="text"
            class="form-input"
            placeholder="관계명을 입력하세요"
          />
        </div>
        <div class="form-group">
          <label>관계 타입</label>
          <select v-model="relationshipForm.type" @change="updateRelationship" class="form-select">
            <option :value="RelationshipType.ONE_TO_ONE">1:1 (일대일)</option>
            <option :value="RelationshipType.ONE_TO_MANY">1:N (일대다)</option>
            <option :value="RelationshipType.MANY_TO_ONE">N:1 (다대일)</option>
            <option :value="RelationshipType.MANY_TO_MANY">N:M (다대다)</option>
          </select>
        </div>
      </div>

      <div class="section">
        <div class="section-header">
          <h4>관계 액션</h4>
        </div>
        <button @click="deleteRelationship" class="btn-danger">관계 삭제</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.property-panel {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  max-height: calc(100vh - 100px);
  overflow-y: auto;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
  background-color: #f8f9fa;
  border-radius: 8px 8px 0 0;
}

.panel-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #333;
  background-color: #e9ecef;
  border-radius: 50%;
}

.panel-content {
  padding: 20px;
}

.section {
  margin-bottom: 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #333;
  border-bottom: 2px solid #007bff;
  padding-bottom: 4px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 4px;
  font-weight: 500;
  color: #555;
  font-size: 14px;
}

.form-input, .form-select, .form-textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-input:focus, .form-select:focus, .form-textarea:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.form-textarea {
  resize: vertical;
  min-height: 60px;
}

.btn-add {
  background-color: #28a745;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.btn-add:hover {
  background-color: #218838;
}

.btn-danger {
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  width: 100%;
}

.btn-danger:hover {
  background-color: #c82333;
}

.columns-list {
  space-y: 12px;
}

.column-item {
  border: 1px solid #eee;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 12px;
  background-color: #fafafa;
}

.column-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.column-index {
  background-color: #007bff;
  color: white;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
}

.column-name-input {
  flex: 1;
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-weight: 500;
}

.btn-delete {
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-delete:hover {
  background-color: #c82333;
}

.column-details {
  space-y: 12px;
}

.form-row {
  display: flex;
  gap: 12px;
}

.form-col {
  flex: 1;
}

.form-col label {
  font-size: 12px;
  margin-bottom: 4px;
}

.form-checkboxes {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin: 12px 0;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: auto;
  margin: 0;
}
</style>

