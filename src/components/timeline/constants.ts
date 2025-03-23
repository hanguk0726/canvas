export const DEFAULT_TOTAL_TIME = 420;
export const TIMELINE_PADDING = 20;
export const TIME_AXIS_HEIGHT = 30;
export const TIME_AXIS_MARGIN_BOTTOM = 10;
export const TRACK_HEIGHT = 60;
export const TRACK_MARGIN_BOTTOM = 10;
export const PARENT_TRACK_HEIGHT = 60;
export const PARENT_TRACK_MARGIN_BOTTOM = 10;
export const BLOCK_HEIGHT = 50;
export const MIN_TIMELINE_HEIGHT = 400;
export const SNAP_THRESHOLD = 2;
export const MIN_DURATION = 1;

// ScaleManager 인터페이스 정의
interface ScaleManager {
  getScale: () => number;
  setScale: (newScale: number) => void;
  subscribe: (listener: () => void) => () => void;
}

// ScaleManager 싱글톤 객체
const ScaleManager: ScaleManager = (() => {
  let scale: number = 10; // 명시적 타입 지정
  const listeners: Array<() => void> = [];

  return {
    getScale: (): number => scale, // 반환 타입 명시
    setScale: (newScale: number): void => {
      scale = Math.max(4, Math.min(20, newScale));
      listeners.forEach((listener) => listener());
    },
    subscribe: (listener: () => void): (() => void) => {
      listeners.push(listener);
      return () => {
        const index = listeners.indexOf(listener);
        if (index > -1) listeners.splice(index, 1);
      };
    },
  } as ScaleManager; // 타입 캐스팅으로 강제 보장
})();

// 동적 값 반환 함수로 변경
export const getScale = (): number => ScaleManager.getScale();
export const setScale = (newScale: number): void =>
  ScaleManager.setScale(newScale);
export const useScaleSubscription = (listener: () => void): (() => void) =>
  ScaleManager.subscribe(listener);

