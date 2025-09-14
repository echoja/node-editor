# node-editor — React DOM 데모 (Engine Port Ready)

이 저장소는 순수 React로 노드 기반 에디터의 핵심 개념을 구현한 최소한의 데모입니다. 엔진 경계(Port)를 엄격히 유지하여, 현재 TypeScript 엔진을 향후 Rust/wasm 코어로 손쉽게 교체할 수 있도록 설계되어 있습니다.

## 목표

- 단순한 스택으로 에디터 모델/인터랙션을 입증
- 렌더링은 React+DOM(div 등), 수학/측정은 엔진 Port 뒤로 캡슐화(TS ↔ wasm 교체 용이)
- 읽기 쉽고 실험/포크가 쉬운 코드 유지

## 목표가 아닌 것

- 초대형 문서의 완전한 운영 성능(DOM 한계 존재)
- 픽셀 정밀 텍스트/타이포그래피
- 모든 도구(리사이즈/회전/패스 등) 완비

## 포함된 기능

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

## 좌표계

- Parent-local: 부모 기준 `x/y`
- World: 조상들의 `x/y` 누적 값
- Screen: camera를 적용한 화면 좌표
- 구현: 월드 컨테이너 div에 CSS `transform: translate(-camera.x, -camera.y) scale(camera.scale)` 적용
- `screenToWorld(p) = { x: p.x / scale + x, y: p.y / scale + y }`

## 히트 테스트 규칙

- Frame은 자식을 역순(최상위부터)으로 우선 검사
- `clipsContent`가 true면 프레임 내부에서만 히트 인정
- 아니면 프레임 밖이라도 자식 히트를 허용(클릭 스루)

## 상태/이벤트 흐름

- 포인터 이벤트는 `Viewport`의 루트 div에 바인딩
- down: 보조키로 `pan`/`move` 결정, `engine.hitTest`로 선택
- move: `screenToWorld` + 조상 오프셋으로 카메라/노드 위치 갱신
- wheel: 지수 줌, 커서 고정점 유지
- 선택 테두리: `engine.worldRectOf` → 화면 좌표로 변환 후 div에 1px dashed border

## 왜 DOM부터?

- Canvas/WebGL 보일러플레이트 없이 UX/데이터 모델 반복 속도↑
- wasm 표면을 작게 유지 — 수학(히트/바운즈/레이아웃)만 교체
- 중간 규모 문서의 MVP에 충분

## 제한사항

- 현재 UI는 단일 항목 선택(스토어는 배열 지원)
- 텍스트 폭은 근사치(향후 DOM 측정 또는 wasm shaping로 대체 가능)
- 대형 문서는 가상화/별도 레이어/워커가 필요

## 타입 단언 최소화

- 전반적으로 `as Type` 사용을 줄였습니다. 유니언 타입은 `type` 식별자(Discriminated Union)로 분기해 협소화하며, 초기 상태는 명시 타입 변수(`FrameNode`, `RectNode`, `TextNode`)를 별도로 선언해 `as`를 제거했습니다.

## 로드맵

1. 리사이즈 핸들/변형 도구
2. Undo/Redo(커맨드 패턴 + 단축키)
3. JSON 저장/불러오기(버전 포함)
4. 레이어 패널(자식 순서→z-order)
5. 텍스트 측정 정밀도(svg 측정 또는 wasm shaping)
6. 성능(가상 스크롤, 오버레이 레이어)

## 프로젝트 규칙

- 2스페이스 들여쓰기(`.editorconfig`), LF 줄바꿈(`.gitattributes`)
- `package-lock.json` 커밋 유지, ESLint/Prettier는 의도적으로 미사용

## 트러블 슈팅

- Mac에서 중클릭 팬: Alt/Option(또는 Ctrl/Command) + 드래그 사용
- 트랙패드 줌 방향이 어색할 때: OS 설정 변경 또는 `Viewport`의 휠 델타 부호 반전

## Acknowledgements

- Vite + React + TypeScript, Zustand로 구축
