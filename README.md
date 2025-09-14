# node-editor — React DOM 데모 (Engine Port Ready)

이 저장소는 순수 React로 노드 기반 에디터의 핵심 개념을 구현한 최소한의 데모입니다. 엔진 경계(Port)를 엄격히 유지하여, 현재 TypeScript 엔진을 향후 Rust/wasm 코어로 손쉽게 교체할 수 있도록 설계되어 있습니다.

## 목표

- 단순한 스택으로 에디터 모델/인터랙션 입증
- 렌더링은 React+DOM(div 등)

## 목표가 아닌 것

- 초대형 문서의 완전한 운영 성능(DOM 한계 존재)
- 픽셀 정밀 텍스트/타이포그래피
- 모든 도구(리사이즈/회전/패스 등) 완비

## 사용법 및 기능

- 자식/클립 옵션이 있는 Frame 노드, Rect/Text 노드
- 선택 테두리(화면 고정 1px), 드래그 이동, 커서 기준 팬/줌, CSS 그리드 배경
- 선택 노드의 X/Y를 편집하는 Inspector
- 작은 Port 뒤의 순수 TS 엔진(hit-test, world bounds)

## 빠른 시작

- Node: `.tool-versions` 또는 `.nvmrc` 사용 → Node 20.18.3
- 설치: `npm install`
- 개발: `npm run dev`
- 타입 검사: `npm run typecheck`
- 빌드: `npm run build` 후 `npm run preview`

## 조작 방법

- 선택: 좌클릭
- 이동: 선택 후 드래그
- 팬: 마우스 휠/트랙패드 스크롤로 이동(가로/세로),
  Space 꾹 + 드래그, Alt/Option(또는 Ctrl/Command) + 드래그, 또는 휠 버튼 드래그
- 줌: Cmd+스크롤(Win/Linux는 Ctrl+스크롤), 또는 우상단 +/− 버튼

## 레포 구조

- `src/types.ts` — 문서/노드/카메라 타입(Frame은 `children`, `clipsContent` 포함)
- `src/engine/port.ts` — 엔진 Port 인터페이스(`hitTest`, `worldRectOf`)
- `src/engine/pure.ts` — 순수 TS 엔진(수학만; DOM/Canvas 미사용)
- `src/store.ts` — Zustand 상태: `doc`, `camera`, `selection`, actions
- `src/components/DivScene.tsx` — Doc → DOM 렌더러(absolute 레이아웃, overflow:hidden으로 clip)
- `src/components/Viewport.tsx` — 팬/줌/선택/이동, 선택 테두리 오버레이
- `src/App.tsx`, `src/main.tsx`, `index.html` — 앱 스캐폴딩
- 메타: `.tool-versions`, `.nvmrc`, `.editorconfig`, `.gitattributes`, `.gitignore`

## 

(추가예정)

## 데이터 모델

- 좌표: 각 노드의 `x/y`는 부모 기준. `FrameNode`/`RectNode`는 `w/h` 보유
- 루트: 최상위 노드를 담는 보이지 않는 월드 프레임
- 타입: `FrameNode | RectNode | TextNode`

### 예시

```json
{
  "version": 1,
  "rootId": "root",
  "nodes": {
    "root": {
      "id": "root",
      "type": "frame",
      "parentId": null,
      "x": 0,
      "y": 0,
      "w": 8000,
      "h": 6000,
      "clipsContent": false,
      "children": ["frame_A"]
    },
    "frame_A": {
      "id": "frame_A",
      "type": "frame",
      "parentId": "root",
      "x": 200,
      "y": 160,
      "w": 600,
      "h": 400,
      "clipsContent": true,
      "children": ["rect_1", "text_1"]
    },
    "rect_1": {
      "id": "rect_1",
      "type": "rect",
      "parentId": "frame_A",
      "x": 60,
      "y": 60,
      "w": 220,
      "h": 140,
      "fill": "#dbeafe"
    },
    "text_1": {
      "id": "text_1",
      "type": "text",
      "parentId": "frame_A",
      "x": 80,
      "y": 240,
      "text": "Hello, Frame!",
      "fontSize": 18
    }
  }
}
```

## 제한사항

본 데모 버전에서는 고급 기능을 구현하지 않습니다.

- 스냅 기능 미포함: 개체 드래그 시 맞춰 붙는 기능. 예를 들어, 사각형을 이동할 때 다른 도형의 모서리에 정확히 달라붙게 하여 정렬을 쉽게 하기.
- 현재 UI는 단일 항목 선택이며 다중 선택 기능은 없음.
- 버전 관리, 다양한 사용자와의 협업 구조(예: CRDT)는 고려하지 않음
- 텍스트 관련 고급 처리: 텍스트 폭은 근사치(향후 DOM 측정 또는 wasm shaping로 대체 가능), 텍스트 에디터 등

## TODO

- 리사이즈 핸들/변형 도구
- Contraints 기능
- Real View 기능 (에디터 상의 렌더링이 아니라 실제 HTML 렌더링)
- Undo/Redo(커맨드 패턴 + 단축키)
- 복사/붙여넣기 기능 (cmd/ctrl+C/V), JSON 저장/불러오기(버전 포함)
- Root Document 보여주기
- 레이어 패널(트리뷰)

## 프로젝트 규칙 및 코딩 컨벤션

- 2스페이스 들여쓰기(`.editorconfig`), LF 줄바꿈(`.gitattributes`)
- `package-lock.json` 커밋 유지, ESLint/Prettier는 의도적으로 미사용
- `as Type` 사용 최소화

## 엔진 포트

```ts
export interface EnginePort {
  hitTest(
    doc: Doc,
    camera: Camera,
    screenPt: { x: number; y: number }
  ): Hit | null;
  worldRectOf(
    doc: Doc,
    id: NodeID
  ): { x: number; y: number; w: number; h: number };
}
```

- React/DOM 계층은 이 Port만 호출합니다(현재 `pureEngine` 바인딩).
- wasm 코어는 동일 API를 노출하여 교체(예: wasm-bindgen + 얇은 glue).

## 트러블 슈팅

- Mac에서 중클릭 팬: Alt/Option(또는 Ctrl/Command) + 드래그 사용
- 트랙패드 줌 방향이 어색할 때: OS 설정 변경 또는 `Viewport`의 휠 델타 부호 반전

## Acknowledgements

- Vite + React + TypeScript, Zustand로 구축
