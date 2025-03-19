import DynamicAttachedBezierEditor from "../components/cubicBezierCanvas/CubicBezierCanvas";
import { useState } from "react";

const Home = () => {
  const [totalSteps, setTotalSteps] = useState(10);
  const [curveData, setCurveData] = useState<{ x: number; y: number }[]>([]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      {/* totalSteps와 curveData 콜백 전달 */}
      <DynamicAttachedBezierEditor
        totalSteps={totalSteps}
        onCurveDataChange={setCurveData}
      />

      <div className="flex p-4 gap-4">
        {/* Frame Count 입력 필드 */}
        <div className="flex flex-col gap-2">
          <label className="font-bold">Frame Count</label>
          <input
            type="number"
            value={totalSteps}
            onChange={(e) => setTotalSteps(Number(e.target.value))}
            className="border p-2 rounded w-32"
          />
        </div>

        {/* JSON 데이터 텍스트 영역 */}
      </div>

      {/* 계산된 곡선 데이터(포인트 리스트) 출력 */}
      <div className="mt-4">
        <h3 className="font-bold">Calculated Curve Data</h3>
        <ul className="border p-2 rounded bg-gray-100">
          {curveData.map((point, index) => (
            <li key={index} className="p-1 border-b last:border-none">
              {`Point ${index + 1}: (${point.x.toFixed(2)}, ${point.y.toFixed(
                2
              )})`}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Home;
