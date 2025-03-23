# 타임라인 프로젝트 README

## 주요 사항

이 프로젝트는 유연한 타임라인 구조를 목표로 설계되었으며, 블록(Block), 트랙(Track), 타임라인(Timeline) 데이터를 중심으로 동작합니다. 주요 특징은 다음과 같습니다:

- **자유로운 계층 구조**: 부모 블록(Parent Block)을 통해 하위 타임라인(Sub-Timeline)을 무제한으로 생성 가능 (자원 한도 내).
- **상태 관리**: 최상단 컴포넌트에서 `timeline-list`와 `currentTimeline` 변수를 통해 UI 전환.
- **줌 및 스냅 기능**: `Scale`과 `SnapThreshold`를 통해 동적 조절 가능.

---

## 데이터 타입

1. **`Block`**  
   - Video, Audio 등 다양한 타입을 가지는 기본 데이터 단위.
   - 타임라인 내에서 시각적 블록으로 표현.

2. **`Track`**  
   - 블록이 배치되는 트랙.
   - 각 트랙은 허용되는 블록 타입을 설정 가능.

3. **`Timeline`**  
   - `Block`과 `Track`을 함께 포함하는 상위 데이터 구조.
   - 계층적 구조를 지원.

---

## 구조

### 설계 목표
- **유연성**: 자유로운 계층 구조를 통해 확장 가능.
- **관계성**: `Block`과 `Track`은 긴밀히 연관되어 `Timeline`으로 통합.

### 주요 특징
1. **Sub-Timeline 생성**  
   - 부모 블록(Parent Block)을 지정하여 하위 타임라인(Sub-Timeline)을 계속 생성 가능.
   - 생성된 타임라인은 펼쳐서 확인 가능.

2. **Block과 Track의 통합**  
   - 긴밀한 관계로 인해 `Timeline` 객체로 묶임.

3. **트랙 설정**  
   - 트랙이 허용하는 블록 타입(`allowTypes`)은 왼쪽 위 패널에서 조절.
   - 단순히 `Track.allowTypes` 값을 변경하여 설정.

4. **모드 전환 및 디테일 확인**  
   - **선택 모드(Select Mode)**: 블록 선택 가능.
   - **핸드 모드(Hand Mode)**: 선택 후 늘리기 등 실행시 하단 디테일 섹션에서 수치 변화 확인 가능.

### 상태 관리
- **최상단 컴포넌트(Wrapper)**  
  - `timeline-list`: 전체 타임라인 목록.
  - `currentTimeline`: 현재 활성화된 타임라인.
  - `get/set` 메서드로 UI 전환 제어.

---

## API

### 1. 함수 호출 형식 (`TimelineUi.ts`)
- **`addBlock`**: 새로운 블록을 타임라인에 추가.
  ```typescript
  const addBlock = () => {
    const newBlock: Block = { id: uuidv4(), type: selectedBlockType, duration: 5, starttime: 0, trackId: "..." };
    setTimelines((prev) => ...);
  };
  ```
- 기타: `deleteBlock`, `addTrack`, `removeTrack` 등 유사한 방식으로 동작.

### 2. 전역 변수 컨트롤 (`constants.ts`)
- 모든 상수는 `ConstantsManager`를 통해 동적으로 관리.
- 주요 기능:
  1. **Zoom 기능**  
     - `Scale`: 초당 픽셀 수(pixel/second)를 나타내는 단위.
     - `getScale()`: 현재 스케일 값 반환.
     - `setScale(newScale)`: 스케일 값 설정 (4~20 범위 제한).
     - 예: `setScale(12)` → 1초 = 12px.

  2. **Snap 기능**  
     - `SnapThreshold`: 스냅 감도(단위: 초).
     - `getSnapThreshold()`: 현재 값 반환.
     - `setSnapThreshold(value)`: 값 설정.
     - 특징:
       - `0`이면 스냅 비활성화.
       - 값이 클수록 멀리서도 스냅 적용.

- **기타 상수**  
  - `getTimelinePadding()`, `setTimelinePadding()`, `getTrackHeight()`, 등.
  - 대부분 드래그 앤 드롭 계산에 사용.

---

## 사용 예시

### Zoom 조절
```typescript
import { useConstantsManager } from "./useConstantsManager";

const { constants, updateConstant } = useConstantsManager();
const zoomIn = () => updateConstant("scale", (prev) => prev + 2); // 확대
const zoomOut = () => updateConstant("scale", (prev) => prev - 2); // 축소
```

### Snap 설정
```typescript
import { setSnapThreshold } from "./constants";

setSnapThreshold(2); // 2초 이내에서 스냅 활성화
setSnapThreshold(0); // 스냅 비활성화
```

---

## 참고
- **드래그 앤 드롭**: `constants.ts`의 상수들(`timelinePadding`, `trackHeight` 등)은 주로 위치 및 크기 계산에 활용.
- **확장성**: 필요 시 `useConstantsManager`를 통해 새로운 상수 추가 가능.
