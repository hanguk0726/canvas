import React, { useRef, useState, useEffect, MouseEvent } from "react";

interface ControlPoint {
  x: number; // 0 ~ 1 사이의 값 (수평)
  y: number; // 0 ~ 1 사이의 값 (수직)
}

interface Points {
  p1: ControlPoint;
  p2: ControlPoint;
}

type DraggingPoint = "p1" | "p2" | null;
type EasingPreset = "ease" | "linear" | "ease-in" | "ease-out" | "ease-in-out";

const presetBezier: Record<EasingPreset, string> = {
  ease: "cubic-bezier(0.25, 0.1, 0.25, 1.0)",
  linear: "cubic-bezier(0, 0, 1, 1)",
  "ease-in": "cubic-bezier(0.42, 0, 1, 1)",
  "ease-out": "cubic-bezier(0, 0, 0.58, 1)",
  "ease-in-out": "cubic-bezier(0.42, 0, 0.58, 1)",
};

const BezierCarSimulator: React.FC = () => {
  // 커스텀 큐빅‑비지어 에디터용 캔버스
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasSize = 300;
  const [points, setPoints] = useState<Points>({
    p1: { x: 0.25, y: 0.1 },
    p2: { x: 0.75, y: 0.9 },
  });
  const [dragging, setDragging] = useState<DraggingPoint>(null);

  // 커스텀 자동차 시뮬레이션 상태
  const [customCarAtEnd, setCustomCarAtEnd] = useState<boolean>(false);
  // 프리셋 자동차 시뮬레이션 상태
  const [presetCarAtEnd, setPresetCarAtEnd] = useState<boolean>(false);
  // 선택된 프리셋 (preset 버튼을 통해 설정)
  const [selectedPreset, setSelectedPreset] = useState<EasingPreset>("ease");

  // 정규화된 좌표를 캔버스 좌표로 변환 (y축은 뒤집어서)
  const getCanvasX = (x: number) => x * canvasSize;
  const getCanvasY = (y: number) => canvasSize * (1 - y);

  // 마우스 좌표와 제어점이 가까운지 판단 (임계값 10px)
  const isNearPoint = (
    mouseX: number,
    mouseY: number,
    pointX: number,
    pointY: number,
    threshold = 10
  ) => {
    const dx = mouseX - pointX;
    const dy = mouseY - pointY;
    return Math.sqrt(dx * dx + dy * dy) < threshold;
  };

  const handleMouseDown = (e: MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const p1CanvasX = getCanvasX(points.p1.x);
    const p1CanvasY = getCanvasY(points.p1.y);
    const p2CanvasX = getCanvasX(points.p2.x);
    const p2CanvasY = getCanvasY(points.p2.y);

    if (isNearPoint(mouseX, mouseY, p1CanvasX, p1CanvasY)) {
      setDragging("p1");
      return;
    }
    if (isNearPoint(mouseX, mouseY, p2CanvasX, p2CanvasY)) {
      setDragging("p2");
      return;
    }
  };

  const handleMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
    if (!dragging || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const newX = Math.min(1, Math.max(0, mouseX / canvasSize));
    const newY = Math.min(1, Math.max(0, 1 - mouseY / canvasSize));

    setPoints((prev) => {
      if (dragging === "p1") {
        return { ...prev, p1: { x: newX, y: newY } };
      } else if (dragging === "p2") {
        return { ...prev, p2: { x: newX, y: newY } };
      }
      return prev;
    });
  };

  const handleMouseUp = () => {
    setDragging(null);
  };

  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, canvasSize, canvasSize);
      // 큐빅‑비지어 곡선 그리기
      ctx.beginPath();
      ctx.moveTo(0, canvasSize);
      ctx.bezierCurveTo(
        getCanvasX(points.p1.x),
        getCanvasY(points.p1.y),
        getCanvasX(points.p2.x),
        getCanvasY(points.p2.y),
        canvasSize,
        0
      );
      ctx.strokeStyle = "black";
      ctx.stroke();

      // 제어점 그리기
      ctx.fillStyle = "red";
      ctx.beginPath();
      ctx.arc(
        getCanvasX(points.p1.x),
        getCanvasY(points.p1.y),
        5,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.beginPath();
      ctx.arc(
        getCanvasX(points.p2.x),
        getCanvasY(points.p2.y),
        5,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // 제어선 그리기
      ctx.strokeStyle = "blue";
      ctx.beginPath();
      ctx.moveTo(0, canvasSize);
      ctx.lineTo(getCanvasX(points.p1.x), getCanvasY(points.p1.y));
      ctx.moveTo(canvasSize, 0);
      ctx.lineTo(getCanvasX(points.p2.x), getCanvasY(points.p2.y));
      ctx.stroke();
    }
  }, [points]);

  // 커스텀 큐빅‑비지어 문자열
  const customBezierString = `cubic-bezier(${points.p1.x.toFixed(
    2
  )}, ${points.p1.y.toFixed(2)}, ${points.p2.x.toFixed(
    2
  )}, ${points.p2.y.toFixed(2)})`;

  // Run 핸들러
  const handleRunCustom = () => {
    setCustomCarAtEnd((prev) => !prev);
  };

  const handleRunPreset = () => {
    setPresetCarAtEnd((prev) => !prev);
  };

  // 시뮬레이션 트랙 너비 (px)
  const trackWidth = 300;
  // 프리셋 시뮬레이션에 적용할 transition timing function
  const presetTransitionTimingFunction = presetBezier[selectedPreset];

  // 프리셋 버튼 옵션 배열 (가로로 나열)
  const presetOptions: EasingPreset[] = [
    "ease",
    "linear",
    "ease-in",
    "ease-out",
    "ease-in-out",
  ];

  return (
    <div style={{ display: "flex", gap: "30px" }}>
      {/* 왼쪽: 커스텀 큐빅‑비지어 에디터 */}
      <div style={{ flex: "1" }}>
        <h2>Bezier Curve Editor</h2>
        <canvas
          ref={canvasRef}
          width={canvasSize}
          height={canvasSize}
          style={{
            border: "1px solid black",
            display: "block",
            marginBottom: "10px",
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>

      {/* 오른쪽: 시뮬레이션 영역 */}
      <div style={{ flex: "1" }}>
        <h2>Car Animation Simulation</h2>
        {/* 1. 커스텀 자동차 시뮬레이션 (🚗, 좌우 반전 적용) */}
        <div style={{ marginBottom: "30px" }}>
          <h3>Custom Easing Simulation</h3>
          <div>Custom: {customBezierString}</div>
          <div
            style={{
              position: "relative",
              width: `${trackWidth}px`,
              height: "60px",
              border: "1px solid gray",
              overflow: "hidden",
              background: "#f0f0f0",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "50%",
                transform: "translateY(-50%) scaleX(-1)",
                left: customCarAtEnd ? `calc(100% - 40px)` : "0",
                transition: `left 0.5s ${customBezierString}`,
                fontSize: "2rem",
              }}
            >
              🚗
            </div>
          </div>
          <button onClick={handleRunCustom} style={{ marginTop: "10px" }}>
            Run Custom
          </button>
        </div>

        {/* 2. 프리셋 자동차 시뮬레이션 (🚙, 파란색, 좌우 반전) */}
        <div>
          <h3>Preset Easing Simulation</h3>
          {/* 프리셋 버튼 나열 */}
          <div style={{ marginBottom: "10px", display: "flex", gap: "10px" }}>
            {presetOptions.map((preset) => (
              <button
                key={preset}
                onClick={() => setSelectedPreset(preset)}
                style={{
                  padding: "5px 10px",
                  border:
                    selectedPreset === preset
                      ? "2px solid blue"
                      : "1px solid gray",
                  background: "white",
                  cursor: "pointer",
                }}
              >
                {preset}
              </button>
            ))}
          </div>
          <div
            style={{
              position: "relative",
              width: `${trackWidth}px`,
              height: "60px",
              border: "1px solid gray",
              overflow: "hidden",
              background: "#f0f0f0",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "50%",
                transform: "translateY(-50%) scaleX(-1)", // 좌우 반전
                left: presetCarAtEnd ? `calc(100% - 40px)` : "0",
                transition: `left 0.5s ${presetTransitionTimingFunction}`,
                fontSize: "2rem",
                color: "blue",
              }}
            >
              🚙
            </div>
          </div>
          <button onClick={handleRunPreset} style={{ marginTop: "10px" }}>
            Run Preset
          </button>
          <div style={{ marginTop: "5px", fontSize: "14px" }}>
            Transition: left 0.5s {presetTransitionTimingFunction}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BezierCarSimulator;
