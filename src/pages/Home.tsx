import { useState, useRef, useEffect } from "react";
import DynamicCurveEditor from "../components/cubicBezierCanvas/CubicBezierCanvas";

// DynamicCurveEditor가 노출하는 메서드 타입 정의
interface DynamicCurveEditorRef {
  getYAtTime: (targetX: number, maxX: number, maxY: number) => number;
}

const Home = () => {
  const [totalSteps, setTotalSteps] = useState(10);
  const [curveData, setCurveData] = useState<{ x: number; y: number }[]>([]);
  const [controlPoints, setControlPoints] = useState<
    { x: number; y: number }[]
  >([]);
  const [targetX, setTargetX] = useState<number>(0);
  const [maxX, setMaxX] = useState<number>(1);
  const [maxY, setMaxY] = useState<number>(1);
  const [yValue, setYValue] = useState<number | null>(null);
  const editorRef = useRef<DynamicCurveEditorRef>(null);

  // getYAtTime 자동 계산
  useEffect(() => {
    if (editorRef.current && editorRef.current.getYAtTime) {
      try {
        const calculatedY = editorRef.current.getYAtTime(targetX, maxX, maxY);
        setYValue(calculatedY);
      } catch (error) {
        setYValue(null);
        console.error("Error calculating Y value:", (error as Error).message);
      }
    }
  }, [targetX, maxX, maxY, controlPoints]);

  return (
    <div className="min-h-screen flex items-start justify-center p-4 gap-8">
      {/* Main Container */}
      <div className="flex gap-8 max-w-[1200px] w-full">
        {/* Left Section: Canvas (고정 크기) */}
        <div className="w-[400px] h-[450px] flex-shrink-0 flex items-start justify-center">
          <DynamicCurveEditor
            totalSteps={totalSteps}
            onCurveDataChange={setCurveData}
            onControlPointsChange={setControlPoints}
            ref={editorRef}
          />
        </div>

        {/* Right Section: Controls and Data */}
        <div className="flex-1 flex flex-col gap-6 max-w-[400px] min-w-[300px]">
          {/* getYAtTime Inputs */}
          <div className="flex flex-col gap-4">
            <h3 className="font-bold text-lg">Calculate Y at Time</h3>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <label className="w-20">Target X</label>
                <input
                  type="number"
                  value={targetX}
                  onChange={(e) => setTargetX(Number(e.target.value))}
                  className="border p-2 rounded w-32"
                  step="0.1"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="w-20">Max X</label>
                <input
                  type="number"
                  value={maxX}
                  onChange={(e) => setMaxX(Number(e.target.value))}
                  className="border p-2 rounded w-32"
                  step="0.1"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="w-20">Max Y</label>
                <input
                  type="number"
                  value={maxY}
                  onChange={(e) => setMaxY(Number(e.target.value))}
                  className="border p-2 rounded w-32"
                  step="0.1"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="w-20 font-bold">Y Value</label>
                <span className="p-2 bg-gray-100 rounded w-32 text-center">
                  {yValue !== null ? yValue.toFixed(2) : "N/A"}
                </span>
              </div>
            </div>
          </div>

          {/* Control Points */}
          <div className="mt-4">
            <h3 className="font-bold text-lg">Control Points</h3>
            <ul className="border p-3 rounded bg-gray-100 max-h-[300px] overflow-auto">
              {controlPoints.map((point, index) => (
                <li key={index} className="p-2 border-b last:border-none">
                  {`Control Point ${index + 1}: (${point.x.toFixed(
                    2
                  )}, ${point.y.toFixed(2)})`}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
