## ERD_TOOL

브라우저에서 간단하게 ERD(Entity–Relationship Diagram)를 설계·시각화하기 위한 경량 웹 도구입니다. 로컬 개발 환경에서 테이블과 관계선을 직관적으로 구성하고, 빠르게 데이터 모델을 구상할 수 있도록 하는 데 목적이 있습니다.

### 개발 목적과 배경
- 복잡한 설치 없이도 가벼운 ERD 스케치가 가능한 도구가 필요했습니다.
- 테이블과 관계(1:N 등)를 직관적으로 연결하며, 설계 초안을 팀과 공유하기 위한 최소 기능에 집중했습니다.

### 주요 기능(초안)
- 테이블 노드 관리: 생성/이동/삭제, 기본 속성 편집(`TableNode`, `PropertyPanel`).
- 관계선 표현: 테이블 간 연결선, 방향/표기 처리(`RelationshipLine`).
- 캔버스 인터랙션: 드래그, 선택 등 기본 조작(`ERDCanvas`).
- 상태 관리: `Pinia` 기반 전역 상태(`erdStore`), `uuid`를 통한 안정적 식별자 부여.

## 기술 스택 및 사용된 라이브러리
- 애플리케이션: **Vue 3** (`vue`)
- 상태 관리: **Pinia** (`pinia`)
- 유틸리티: **@vueuse/core** (`@vueuse/core`)
- 식별자: **uuid** (`uuid`)
- 번들러/개발 서버: **Vite** (`vite`)
- 언어/타입: **TypeScript** (`typescript`, `vue-tsc`)
- 개발 편의: **Vite Vue Plugin** (`@vitejs/plugin-vue`), **Vue Devtools 플러그인** (`vite-plugin-vue-devtools`), **npm-run-all2**

## 시작하기
사전 요구사항: Node.js 20.x 이상(권장: 20 LTS 이상).

### 설치
```sh
npm install
```

### 개발 서버 실행
```sh
npm run dev
```

### 프로덕션 빌드
```sh
npm run build
```

### 빌드 결과 미리보기
```sh
npm run preview
```

## 프로젝트 구조(요약)
```text
ERD_TOOL/
  ├─ src/
  │  ├─ components/
  │  │  ├─ ERDCanvas.vue
  │  │  ├─ PropertyPanel.vue
  │  │  ├─ RelationshipLine.vue
  │  │  └─ TableNode.vue
  │  ├─ stores/
  │  │  └─ erdStore.ts
  │  ├─ types/
  │  │  └─ erd.ts
  │  ├─ App.vue
  │  └─ main.ts
  ├─ index.html
  └─ vite.config.ts
```

## 라이선스
추후 명시 예정.
