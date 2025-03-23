import { useState, useEffect } from "react";
import {
  getScale,
  setScale,
  getDefaultTotalTime,
  setDefaultTotalTime,
  getTimelinePadding,
  setTimelinePadding,
  getTimeAxisHeight,
  setTimeAxisHeight,
  getTimeAxisMarginBottom,
  setTimeAxisMarginBottom,
  getTrackHeight,
  setTrackHeight,
  getTrackMarginBottom,
  setTrackMarginBottom,
  getParentTrackHeight,
  setParentTrackHeight,
  getParentTrackMarginBottom,
  setParentTrackMarginBottom,
  getBlockHeight,
  setBlockHeight,
  getMinTimelineHeight,
  setMinTimelineHeight,
  getSnapThreshold,
  setSnapThreshold,
  getMinDuration,
  setMinDuration,
  useConstantsSubscription,
} from "../constants";

export const useConstantsManager = () => {
  const [constants, setConstants] = useState({
    scale: getScale(),
    defaultTotalTime: getDefaultTotalTime(),
    timelinePadding: getTimelinePadding(),
    timeAxisHeight: getTimeAxisHeight(),
    timeAxisMarginBottom: getTimeAxisMarginBottom(),
    trackHeight: getTrackHeight(),
    trackMarginBottom: getTrackMarginBottom(),
    parentTrackHeight: getParentTrackHeight(),
    parentTrackMarginBottom: getParentTrackMarginBottom(),
    blockHeight: getBlockHeight(),
    minTimelineHeight: getMinTimelineHeight(),
    snapThreshold: getSnapThreshold(),
    minDuration: getMinDuration(),
  });

  useEffect(() => {
    const unsubscribe = useConstantsSubscription(() => {
      setConstants({
        scale: getScale(),
        defaultTotalTime: getDefaultTotalTime(),
        timelinePadding: getTimelinePadding(),
        timeAxisHeight: getTimeAxisHeight(),
        timeAxisMarginBottom: getTimeAxisMarginBottom(),
        trackHeight: getTrackHeight(),
        trackMarginBottom: getTrackMarginBottom(),
        parentTrackHeight: getParentTrackHeight(),
        parentTrackMarginBottom: getParentTrackMarginBottom(),
        blockHeight: getBlockHeight(),
        minTimelineHeight: getMinTimelineHeight(),
        snapThreshold: getSnapThreshold(),
        minDuration: getMinDuration(),
      });
    });
    return unsubscribe;
  }, []);

  const updateConstant = (
    key: keyof typeof constants,
    value: number | ((prev: number) => number)
  ) => {
    const newValue =
      typeof value === "function" ? value(constants[key]) : value;
    switch (key) {
      case "scale":
        setScale(newValue);
        break;
      case "defaultTotalTime":
        setDefaultTotalTime(newValue);
        break;
      case "timelinePadding":
        setTimelinePadding(newValue);
        break;
      case "timeAxisHeight":
        setTimeAxisHeight(newValue);
        break;
      case "timeAxisMarginBottom":
        setTimeAxisMarginBottom(newValue);
        break;
      case "trackHeight":
        setTrackHeight(newValue);
        break;
      case "trackMarginBottom":
        setTrackMarginBottom(newValue);
        break;
      case "parentTrackHeight":
        setParentTrackHeight(newValue);
        break;
      case "parentTrackMarginBottom":
        setParentTrackMarginBottom(newValue);
        break;
      case "blockHeight":
        setBlockHeight(newValue);
        break;
      case "minTimelineHeight":
        setMinTimelineHeight(newValue);
        break;
      case "snapThreshold":
        setSnapThreshold(newValue);
        break;
      case "minDuration":
        setMinDuration(newValue);
        break;
    }
  };

  return { constants, updateConstant };
};
