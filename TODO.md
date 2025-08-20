## ERD_TOOL TODO

본 문서는 앞으로 진행할 기능 계획을 정리합니다. 1차 목표는 ERD 파일의 내보내기/불러오기입니다.

### 목표
- **내보내기(Export)**: 현재 캔버스 상태를 파일로 저장한다.
- **불러오기(Import)**: 저장된 파일을 열어 동일한 상태로 복원한다.

### 파일 형식
- **형식**: JSON (확장자 제안: `.erd.json`)
- **루트 스키마**: `ERDDocument` (이미 `src/types/erd.ts`에 정의)
- **권장 필드**:
  - `id: string`
  - `name: string`
  - `tables: Table[]`
  - `relationships: Relationship[]`
  - `canvas: CanvasSettings`
  - `createdAt: string` (ISO8601)
  - `updatedAt: string` (ISO8601)
  - `schemaVersion: number` (마이그레이션 대비)

예시(요약):
```json
{
  "id": "doc-uuid",
  "name": "My ERD",
  "schemaVersion": 1,
  "tables": [ { "id": "t1", "name": "Table_1", "position": {"x": 0, "y": 0}, "size": {"width": 200, "height": 100}, "columns": [ {"id": "c1", "name": "id", "type": "INT", "isPrimaryKey": true, "isForeignKey": false, "isNotNull": true} ] } ],
  "relationships": [ { "id": "r1", "fromTableId": "t1", "toTableId": "t2", "fromColumnId": "c1", "toColumnId": "c2", "type": "one-to-many" } ],
  "canvas": { "zoom": 1, "panX": 0, "panY": 0, "gridSize": 20, "showGrid": true },
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z"
}
```

### 설계 요약
- 직렬화는 스토어 스냅샷 기반(`useERDStore`)으로 구현
- 역직렬화는 유효성 검사 + ID/참조 무결성 확인 + 필요 시 마이그레이션 수행
- 문서 버전(`schemaVersion`)을 포함하여 추후 호환성 보장
- 오류는 사용자 친화적 메시지로 안내, 실패 시 기존 상태 보존

### UI/UX
- 툴바 버튼 추가
  - 내보내기: "내보내기" → "ERD JSON(.erd.json)"
  - 불러오기: "불러오기" 버튼(파일 선택), 드래그앤드롭 지원(옵션)
- 작업 완료 후 Toast/스낵바로 성공/실패 피드백

### 기술 구현
- 내보내기
  - 스토어에 `serializeERD(): ERDDocument` 추가
  - `Blob` + `URL.createObjectURL` + 가상 `<a download>`로 파일 저장
  - 기본 파일명: `${documentName || 'ERD'}-${yyyyMMdd_HHmm}.erd.json`
- 불러오기
  - 파일 선택/드롭 → 텍스트 읽기 → JSON 파싱
  - 스키마 유효성 검사(필수 필드 존재/타입 검사)
  - `deserializeERD(doc: ERDDocument)` 추가: 
    - ID 중복/누락 보정(`uuidv4`)
    - `relationships`가 참조하는 `table/column` 존재성 확인, 불일치 시 필터링 또는 사용자 확인
    - `canvas` 기본값 보정
  - 스토어 상태 교체 및 선택 상태 초기화

### 작업 목록
- [ ] 툴바 UI
  - [ ] `ERDCanvas.vue` 툴바에 "불러오기", "내보내기" 버튼 추가
  - [ ] 드래그앤드롭(옵션) 지원
- [ ] 스토어 직렬화/역직렬화
  - [ ] `serializeERD()` 구현
  - [ ] `deserializeERD(doc)` 구현
  - [ ] `schemaVersion` 도입 및 기본값 1
  - [ ] 무결성/마이그레이션 유틸 추가
- [ ] 파일 I/O 유틸
  - [ ] `downloadJson(filename, data)` 헬퍼
  - [ ] `openJsonFile()`(input[type=file]) 헬퍼
- [ ] 에러 처리/피드백
  - [ ] try/catch와 사용자 메시지(스낵바/알럿)
  - [ ] 실패 시 상태 롤백
- [ ] 테스트
  - [ ] 간단한 e2e 시나리오: 생성→내보내기→새로고침→불러오기→동등성 확인
  - [ ] 잘못된 JSON/스키마 버전 미스매치 케이스

### 향후 확장
- [ ] 이미지 내보내기(PNG/SVG) – 현재 뷰박스 반영, 고해상도 스냅샷
- [ ] 자동 저장/자동 복구(LocalStorage)
- [ ] 최근 문서 목록 및 메타데이터 관리


