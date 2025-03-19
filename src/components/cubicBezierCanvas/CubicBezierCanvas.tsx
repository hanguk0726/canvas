import React, { useState, useRef, useEffect, MouseEvent } from "react";

interface ControlPoint {
  x: number; // 0 ~ 1 사이의 정규화된 값
  y: number; // 0 ~ 1 사이의 정규화된 값
}

const DynamicCurveEditor: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasSize = 400; // 캔버스 크기 (400×400 픽셀)

  // 초기 컨트롤 포인트: (0,0)과 (1,1)은 고정
  const [controlPoints, setControlPoints] = useState<ControlPoint[]>([
    { x: 0, y: 0 },
    { x: 1, y: 1 },
  ]);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  // 정규화된 좌표를 캔버스 좌표로 변환
  const getCanvasX = (x: number) => x * canvasSize;
  const getCanvasY = (y: number) => y * canvasSize;

  // Catmull-Rom 스플라인 세그먼트 그리기
  const drawCatmullRomSegment = (
    ctx: CanvasRenderingContext2D,
    p0: ControlPoint,
    p1: ControlPoint,
    p2: ControlPoint,
    p3: ControlPoint
  ) => {
    const steps = 100;
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x =
        0.5 *
        (2 * p1.x +
          (-p0.x + p2.x) * t +
          (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t * t +
          (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t * t * t);
      const y =
        0.5 *
        (2 * p1.y +
          (-p0.y + p2.y) * t +
          (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t * t +
          (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t * t * t);
      const canvasX = getCanvasX(x);
      const canvasY = getCanvasY(y);
      if (i === 0) ctx.moveTo(canvasX, canvasY);
      else ctx.lineTo(canvasX, canvasY);
    }
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  // 전체 곡선 그리기
  const drawCurve = (ctx: CanvasRenderingContext2D) => {
    if (controlPoints.length < 2) return;

    if (controlPoints.length === 2) {
      // 두 점일 경우 직선
      ctx.beginPath();
      ctx.moveTo(
        getCanvasX(controlPoints[0].x),
        getCanvasY(controlPoints[0].y)
      );
      ctx.lineTo(
        getCanvasX(controlPoints[1].x),
        getCanvasY(controlPoints[1].y)
      );
      ctx.strokeStyle = "black";
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (controlPoints.length === 3) {
      // 세 점일 경우 가상 포인트 추가
      const p0 = controlPoints[0];
      const p1 = controlPoints[1];
      const p2 = controlPoints[2];
      const pNeg1 = { x: 2 * p0.x - p1.x, y: 2 * p0.y - p1.y };
      const p3 = { x: 2 * p2.x - p1.x, y: 2 * p2.y - p1.y };
      drawCatmullRomSegment(ctx, pNeg1, p0, p1, p2);
      drawCatmullRomSegment(ctx, p0, p1, p2, p3);
    } else {
      // 네 점 이상일 경우
      const pNeg1 = {
        x: 2 * controlPoints[0].x - controlPoints[1].x,
        y: 2 * controlPoints[0].y - controlPoints[1].y,
      };
      drawCatmullRomSegment(
        ctx,
        pNeg1,
        controlPoints[0],
        controlPoints[1],
        controlPoints[2]
      );

      for (let i = 1; i < controlPoints.length - 2; i++) {
        drawCatmullRomSegment(
          ctx,
          controlPoints[i - 1],
          controlPoints[i],
          controlPoints[i + 1],
          controlPoints[i + 2]
        );
      }

      const pNPlus1 = {
        x:
          2 * controlPoints[controlPoints.length - 1].x -
          controlPoints[controlPoints.length - 2].x,
        y:
          2 * controlPoints[controlPoints.length - 1].y -
          controlPoints[controlPoints.length - 2].y,
      };
      drawCatmullRomSegment(
        ctx,
        controlPoints[controlPoints.length - 3],
        controlPoints[controlPoints.length - 2],
        controlPoints[controlPoints.length - 1],
        pNPlus1
      );
    }
  };

  // 캔버스 렌더링
  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvasSize, canvasSize);

    // 곡선 그리기
    drawCurve(ctx);

    // 컨트롤 포인트 그리기
    controlPoints.forEach((p, i) => {
      const x = getCanvasX(p.x);
      const y = getCanvasY(p.y);
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, 2 * Math.PI);
      ctx.fillStyle =
        i === 0 || i === controlPoints.length - 1 ? "blue" : "red";
      ctx.fill();
      ctx.strokeStyle = "black";
      ctx.stroke();
    });
  }, [controlPoints]);

  // 마우스 다운: 드래그 시작 또는 새 포인트 추가
  const handleMouseDown = (e: MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const normalizedX = mouseX / canvasSize;
    const normalizedY = mouseY / canvasSize;

    // 기존 포인트 드래그 (시작점과 끝점 제외)
    for (let i = 1; i < controlPoints.length - 1; i++) {
      const cp = controlPoints[i];
      const cpX = getCanvasX(cp.x);
      const cpY = getCanvasY(cp.y);
      if (Math.hypot(mouseX - cpX, mouseY - cpY) < 10) {
        setDraggingIndex(i);
        return;
      }
    }

    // 곡선 근처에 새 포인트 추가
    const threshold = 10;
    let minDist = Infinity;
    let bestPoint: ControlPoint | null = null;
    let insertionIndex = -1;

    const steps = 100;
    for (let seg = 0; seg < controlPoints.length - 1; seg++) {
      const p0 =
        seg === 0
          ? {
              x: 2 * controlPoints[0].x - controlPoints[1].x,
              y: 2 * controlPoints[0].y - controlPoints[1].y,
            }
          : controlPoints[seg - 1];
      const p1 = controlPoints[seg];
      const p2 = controlPoints[seg + 1];
      const p3 =
        seg + 2 < controlPoints.length
          ? controlPoints[seg + 2]
          : {
              x:
                2 * controlPoints[controlPoints.length - 1].x -
                controlPoints[controlPoints.length - 2].x,
              y:
                2 * controlPoints[controlPoints.length - 1].y -
                controlPoints[controlPoints.length - 2].y,
            };

      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const x =
          0.5 *
          (2 * p1.x +
            (-p0.x + p2.x) * t +
            (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t * t +
            (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t * t * t);
        const y =
          0.5 *
          (2 * p1.y +
            (-p0.y + p2.y) * t +
            (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t * t +
            (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t * t * t);
        const canvasX = getCanvasX(x);
        const canvasY = getCanvasY(y);
        const dist = Math.hypot(canvasX - mouseX, canvasY - mouseY);
        if (dist < minDist) {
          minDist = dist;
          bestPoint = { x, y };
          insertionIndex = seg + 1;
        }
      }
    }

    if (minDist < threshold && bestPoint) {
      setControlPoints((prev) => {
        const newPoints = [...prev];
        newPoints.splice(insertionIndex, 0, bestPoint);
        return newPoints;
      });
      setDraggingIndex(insertionIndex);
    }
  };

  // 마우스 이동: 드래그 처리
  const handleMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
    if (draggingIndex === null || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    let newX = Math.min(1, Math.max(0, mouseX / canvasSize));
    const newY = Math.min(1, Math.max(0, mouseY / canvasSize));

    if (draggingIndex > 0 && draggingIndex < controlPoints.length - 1) {
      const leftX = controlPoints[draggingIndex - 1].x;
      const rightX = controlPoints[draggingIndex + 1].x;
      newX = Math.min(rightX, Math.max(leftX, newX));
    }

    setControlPoints((prev) => {
      const newPoints = [...prev];
      newPoints[draggingIndex] = { x: newX, y: newY };
      return newPoints;
    });
  };

  // 마우스 업: 드래그 종료
  const handleMouseUp = () => {
    setDraggingIndex(null);
  };

  return (
    <div>
      <h2>Dynamic Curve Editor (Catmull-Rom Spline)</h2>
      <canvas
        ref={canvasRef}
        width={canvasSize}
        height={canvasSize}
        style={{ border: "1px solid black", cursor: "pointer" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      <div style={{ marginTop: "10px" }}>
        <strong>Control Points:</strong>
        {controlPoints.map((p, i) => (
          <div key={i}>
            {i}: ({p.x.toFixed(2)}, {p.y.toFixed(2)})
          </div>
        ))}
      </div>
    </div>
  );
};

export default DynamicCurveEditor;
