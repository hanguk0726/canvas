// ConstantsManager 인터페이스 정의
interface ConstantsManager {
  // Scale 관련 메서드
  getScale: () => number;
  setScale: (newScale: number) => void;
  // 상수별 get/set 메서드
  getDefaultTotalTime: () => number;
  setDefaultTotalTime: (value: number) => void;
  getTimelinePadding: () => number;
  setTimelinePadding: (value: number) => void;
  getTimeAxisHeight: () => number;
  setTimeAxisHeight: (value: number) => void;
  getTimeAxisMarginBottom: () => number;
  setTimeAxisMarginBottom: (value: number) => void;
  getTrackHeight: () => number;
  setTrackHeight: (value: number) => void;
  getTrackMarginBottom: () => number;
  setTrackMarginBottom: (value: number) => void;
  getParentTrackHeight: () => number;
  setParentTrackHeight: (value: number) => void;
  getParentTrackMarginBottom: () => number;
  setParentTrackMarginBottom: (value: number) => void;
  getBlockHeight: () => number;
  setBlockHeight: (value: number) => void;
  getMinTimelineHeight: () => number;
  setMinTimelineHeight: (value: number) => void;
  getSnapThreshold: () => number;
  setSnapThreshold: (value: number) => void;
  getMinDuration: () => number;
  setMinDuration: (value: number) => void;
  // 구독 메서드
  subscribe: (listener: () => void) => () => void;
}

// ConstantsManager 싱글톤 객체
const ConstantsManager: ConstantsManager = (() => {
  // 초기값 정의
  let scale: number = 10;
  let defaultTotalTime: number = 420;
  let timelinePadding: number = 20;
  let timeAxisHeight: number = 30;
  let timeAxisMarginBottom: number = 10;
  let trackHeight: number = 60;
  let trackMarginBottom: number = 10;
  let parentTrackHeight: number = 60;
  let parentTrackMarginBottom: number = 10;
  let blockHeight: number = 50;
  let minTimelineHeight: number = 400;
  let snapThreshold: number = 2;
  let minDuration: number = 1;

  const listeners: Array<() => void> = [];

  // 값 변경 시 모든 구독자에게 알림
  const notifyListeners = () => {
    listeners.forEach((listener) => listener());
  };

  return {
    // Scale
    getScale: (): number => scale,
    setScale: (newScale: number): void => {
      scale = Math.max(4, Math.min(20, newScale)); // 범위 제한 유지
      notifyListeners();
    },
    // DefaultTotalTime
    getDefaultTotalTime: (): number => defaultTotalTime,
    setDefaultTotalTime: (value: number): void => {
      defaultTotalTime = value;
      notifyListeners();
    },
    // TimelinePadding
    getTimelinePadding: (): number => timelinePadding,
    setTimelinePadding: (value: number): void => {
      timelinePadding = value;
      notifyListeners();
    },
    // TimeAxisHeight
    getTimeAxisHeight: (): number => timeAxisHeight,
    setTimeAxisHeight: (value: number): void => {
      timeAxisHeight = value;
      notifyListeners();
    },
    // TimeAxisMarginBottom
    getTimeAxisMarginBottom: (): number => timeAxisMarginBottom,
    setTimeAxisMarginBottom: (value: number): void => {
      timeAxisMarginBottom = value;
      notifyListeners();
    },
    // TrackHeight
    getTrackHeight: (): number => trackHeight,
    setTrackHeight: (value: number): void => {
      trackHeight = value;
      notifyListeners();
    },
    // TrackMarginBottom
    getTrackMarginBottom: (): number => trackMarginBottom,
    setTrackMarginBottom: (value: number): void => {
      trackMarginBottom = value;
      notifyListeners();
    },
    // ParentTrackHeight
    getParentTrackHeight: (): number => parentTrackHeight,
    setParentTrackHeight: (value: number): void => {
      parentTrackHeight = value;
      notifyListeners();
    },
    // ParentTrackMarginBottom
    getParentTrackMarginBottom: (): number => parentTrackMarginBottom,
    setParentTrackMarginBottom: (value: number): void => {
      parentTrackMarginBottom = value;
      notifyListeners();
    },
    // BlockHeight
    getBlockHeight: (): number => blockHeight,
    setBlockHeight: (value: number): void => {
      blockHeight = value;
      notifyListeners();
    },
    // MinTimelineHeight
    getMinTimelineHeight: (): number => minTimelineHeight,
    setMinTimelineHeight: (value: number): void => {
      minTimelineHeight = value;
      notifyListeners();
    },
    // SnapThreshold
    getSnapThreshold: (): number => snapThreshold,
    setSnapThreshold: (value: number): void => {
      snapThreshold = value;
      notifyListeners();
    },
    // MinDuration
    getMinDuration: (): number => minDuration,
    setMinDuration: (value: number): void => {
      minDuration = value;
      notifyListeners();
    },
    // 구독
    subscribe: (listener: () => void): (() => void) => {
      listeners.push(listener);
      return () => {
        const index = listeners.indexOf(listener);
        if (index > -1) listeners.splice(index, 1);
      };
    },
  } as ConstantsManager;
})();

// 외부에서 사용할 함수 export
export const getScale = (): number => ConstantsManager.getScale();
export const setScale = (newScale: number): void =>
  ConstantsManager.setScale(newScale);
export const getDefaultTotalTime = (): number =>
  ConstantsManager.getDefaultTotalTime();
export const setDefaultTotalTime = (value: number): void =>
  ConstantsManager.setDefaultTotalTime(value);
export const getTimelinePadding = (): number =>
  ConstantsManager.getTimelinePadding();
export const setTimelinePadding = (value: number): void =>
  ConstantsManager.setTimelinePadding(value);
export const getTimeAxisHeight = (): number =>
  ConstantsManager.getTimeAxisHeight();
export const setTimeAxisHeight = (value: number): void =>
  ConstantsManager.setTimeAxisHeight(value);
export const getTimeAxisMarginBottom = (): number =>
  ConstantsManager.getTimeAxisMarginBottom();
export const setTimeAxisMarginBottom = (value: number): void =>
  ConstantsManager.setTimeAxisMarginBottom(value);
export const getTrackHeight = (): number => ConstantsManager.getTrackHeight();
export const setTrackHeight = (value: number): void =>
  ConstantsManager.setTrackHeight(value);
export const getTrackMarginBottom = (): number =>
  ConstantsManager.getTrackMarginBottom();
export const setTrackMarginBottom = (value: number): void =>
  ConstantsManager.setTrackMarginBottom(value);
export const getParentTrackHeight = (): number =>
  ConstantsManager.getParentTrackHeight();
export const setParentTrackHeight = (value: number): void =>
  ConstantsManager.setParentTrackHeight(value);
export const getParentTrackMarginBottom = (): number =>
  ConstantsManager.getParentTrackMarginBottom();
export const setParentTrackMarginBottom = (value: number): void =>
  ConstantsManager.setParentTrackMarginBottom(value);
export const getBlockHeight = (): number => ConstantsManager.getBlockHeight();
export const setBlockHeight = (value: number): void =>
  ConstantsManager.setBlockHeight(value);
export const getMinTimelineHeight = (): number =>
  ConstantsManager.getMinTimelineHeight();
export const setMinTimelineHeight = (value: number): void =>
  ConstantsManager.setMinTimelineHeight(value);
export const getSnapThreshold = (): number =>
  ConstantsManager.getSnapThreshold();
export const setSnapThreshold = (value: number): void =>
  ConstantsManager.setSnapThreshold(value);
export const getMinDuration = (): number => ConstantsManager.getMinDuration();
export const setMinDuration = (value: number): void =>
  ConstantsManager.setMinDuration(value);
export const useConstantsSubscription = (listener: () => void): (() => void) =>
  ConstantsManager.subscribe(listener);
