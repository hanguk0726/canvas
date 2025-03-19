import DynamicAttachedBezierEditor from "../components/cubicBezierCanvas/CubicBezierCanvas";
import { useState } from "react";

const Home = () => {
  const [totalSteps, setTotalSteps] = useState(10);
  const [curveData, setCurveData] = useState<{ x: number; y: number }[]>([]);

  return (
    <div className="flex min-h-screen p-4 gap-4 items-start">
      {/* Left Section: Canvas */}
      <div className="flex-1 flex items-start justify-center">
        <DynamicAttachedBezierEditor
          totalSteps={totalSteps}
          onCurveDataChange={setCurveData}
        />
      </div>

      {/* Right Section: Controls and Data */}
      <div className="flex-1 flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className="font-bold">Step</label>
          <input
            type="number"
            value={totalSteps}
            onChange={(e) => setTotalSteps(Number(e.target.value))}
            className="border p-2 rounded w-32"
          />
        </div>

        {/* Calculated Curve Data */}
        <div className="mt-4">
          <h3 className="font-bold">Calculated Curve Data</h3>
          <ul className="border p-2 rounded bg-gray-100 max-h-[500px] overflow-auto">
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
    </div>
  );
};

export default Home;
