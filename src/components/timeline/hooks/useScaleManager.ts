import { useState, useEffect } from "react";
import { getScale, setScale, useScaleSubscription } from "../ScaleManager";

export const useScaleManager = () => {
  const [scale, setLocalScale] = useState<number>(getScale()); // 초기값 설정

  useEffect(() => {
    const unsubscribe = useScaleSubscription(() => {
      setLocalScale(getScale());
    });
    return unsubscribe;
  }, []);

  const updateScale = (newScale: number | ((prev: number) => number)) => {
    const value =
      typeof newScale === "function" ? newScale(getScale()) : newScale;
    setScale(value);
  };

  return { scale, updateScale };
};
