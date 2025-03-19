import React, { useState, useRef, useEffect } from "react";

interface ControlPoint {
  x: number; // 0 ~ 1 사이
  y: number; // 0 ~ 1 사이
}

const DynamicCurveEditor: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasSize = 400; // 캔버스 크기
  const minXGap = 0.05; // 컨트롤 포인트 간 최소 x 간격

  const [controlPoints, setControlPoints] = useState<ControlPoint[]>([
    { x: 0, y: 0 }, // 시작점 (고정)
    { x: 1, y: 1 }, // 끝점 (고정)
  ]);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  // 정규화된 좌표를 캔버스 좌표로 변환
  const getCanvasX = (x: number) => x * canvasSize;
  const getCanvasY = (y: number) => y * canvasSize;

  // Catmull-Rom 곡선 세그먼트 그리기
  const drawCatmullRomSegment = (
    ctx: CanvasRenderingContext2D,
    p0: ControlPoint,
    p1: ControlPoint,
    p2: ControlPoint,
    p3: ControlPoint
  ) => {
    const steps = 100;
    ctx.beginPath();
    let prevX = -1;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      let x =
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

      // x값 단조 증가 보장
      if (prevX >= 0 && x < prevX) x = prevX;
      prevX = x;

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
      ctx.beginPath();
      ctx.moveTo(getCanvasX(controlPoints[0].x), getCanvasY(controlPoints[0].y));
      ctx.lineTo(getCanvasX(controlPoints[1].x), getCanvasY(controlPoints[1].y));
      ctx.stroke();
    } else {
      const pNeg1 = { x: 2 * controlPoints[0].x - controlPoints[1].x, y: 2 * controlPoints[0].y - controlPoints[1].y };
      drawCatmullRomSegment(ctx, pNeg1, controlPoints[0], controlPoints[1], controlPoints[2]);

      for (let i = 1; i < controlPoints.length - 2; i++) {
        drawCatmullRomSegment(ctx, controlPoints[i - 1], controlPoints[i], controlPoints[i + 1], controlPoints[i + 2]);
      }

      const pNPlus1 = {
        x: 2 * controlPoints[controlPoints.length - 1].x - controlPoints[controlPoints.length - 2].x,
        y: 2 * controlPoints[controlPoints.length - 1].y - controlPoints[controlPoints.length - 2].y,
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
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasSize, canvasSize);
    drawCurve(ctx);

    // 컨트롤 포인트 표시
    controlPoints.forEach((p, i) => {
      const x = getCanvasX(p.x);
      const y = getCanvasY(p.y);
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, 2 * Math.PI);
      ctx.fillStyle = i === 0 || i === controlPoints.length - 1 ? "blue" : "red";
      ctx.fill();
      ctx.stroke();
    });
  }, [controlPoints]);

  // 마우스 이벤트 핸들러
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) / canvasSize;
    const mouseY = (e.clientY - rect.top) / canvasSize;

    for (let i = 1; i < controlPoints.length - 1; i++) {
      const cp = controlPoints[i];
      if (Math.hypot(mouseX - cp.x, mouseY - cp.y) < 0.025) {
        setDraggingIndex(i);
        return;
      }
    }

    // 새 포인트 추가
    setControlPoints((prev) => [...prev.slice(0, -1), { x: mouseX, y: mouseY }, prev[prev.length - 1]]);
    setDraggingIndex(controlPoints.length - 1);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (draggingIndex === null || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    let newX = (e.clientX - rect.left) / canvasSize;
    const newY = Math.min(1, Math.max(0, (e.clientY - rect.top) / canvasSize));

    // x값 간격 제한
    if (draggingIndex > 0 && draggingIndex < controlPoints.length - 1) {
      const leftX = controlPoints[draggingIndex - 1].x + minXGap;
      const rightX = controlPoints[draggingIndex + 1].x - minXGap;
      newX = Math.min(rightX, Math.max(leftX, newX));
    }

    setControlPoints((prev) => {
      const newPoints = [...prev];
      newPoints[draggingIndex] = { x: newX, y: newY };
      return newPoints;
    });
  };

  const handleMouseUp = () => setDraggingIndex(null);

  return (
    <div>
      <h2>Dynamic Curve Editor</h2>
      <canvas
        ref={canvasRef}
        width={canvasSize}
        height={canvasSize}
        style={{ border: "1px solid black" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
    </div>
  );
};

export default DynamicCurveEditor;