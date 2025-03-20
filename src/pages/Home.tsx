import React, { useState } from "react";
import Timeline from "../components/timeline/Timeline";

const Home: React.FC = () => {
  const [totalTime, setTotalTime] = useState(120); // 예: 120초 타임라인

  return (
    <div className="w-full p-4" style={{ overflow: "hidden" }}>
      <div style={{ marginBottom: "20px" }}>
        전체 타임라인 시간 (초):{" "}
        <input
          type="number"
          value={totalTime}
          onChange={(e) => setTotalTime(Number(e.target.value))}
          style={{ width: "80px" }}
        />
      </div>
      <Timeline totalTime={totalTime} />
    </div>
  );
};

export default Home;
