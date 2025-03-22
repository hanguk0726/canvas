import React from "react";
import { TIME_AXIS_HEIGHT, TIME_AXIS_MARGIN_BOTTOM, SCALE } from "../constants";

interface TimeAxisProps {
  totalTime: number;
}

export const TimeAxis: React.FC<TimeAxisProps> = ({ totalTime }) => {
  const ticks = Array.from(
    { length: Math.floor(totalTime / 5) + 1 },
    (_, i) => i * 5
  );

  return (
    <div
      style={{
        position: "relative",
        height: `${TIME_AXIS_HEIGHT}px`,
        borderBottom: "1px solid #ccc",
        marginBottom: `${TIME_AXIS_MARGIN_BOTTOM}px`,
      }}
    >
      {ticks.map((t) => (
        <div
          key={t}
          style={{ position: "absolute", left: `${t * SCALE}px`, top: 0 }}
        >
          <div style={{ borderLeft: "1px solid #aaa", height: "10px" }} />
          <div style={{ fontSize: "10px" }}>{t}s</div>
        </div>
      ))}
    </div>
  );
};
