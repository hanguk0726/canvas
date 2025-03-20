import React, { useState } from "react";
import Timeline from "../components/timeline/Timeline";

const Home: React.FC = () => {
  const [totalTime, setTotalTime] = useState(120); // 예: 120초 타임라인
  const [isSplitEnabled, setIsSplitEnabled] = useState(false); // 쪼개기 모드 상태

  return (
    <div className="w-full" style={{ padding: "0 60px", overflow: "hidden" }}>
      <div style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
          <span>전체 타임라인 시간 (초):</span>
          <input
            type="number"
            value={totalTime}
            onChange={(e) => setTotalTime(Number(e.target.value))}
            style={{ width: "80px" }}
          />
          <button
            onClick={() => setIsSplitEnabled((prev) => !prev)}
            style={{
              padding: "5px 10px",
              backgroundColor: isSplitEnabled ? "#ff4444" : "#4444ff",
              color: "white",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            {isSplitEnabled ? "분할 모드 끄기" : "분할 모드 켜기"}
          </button>
        </div>
      </div>
      <Timeline totalTime={totalTime} isSplitEnabled={isSplitEnabled} />
    </div>
  );
};

export default Home;
