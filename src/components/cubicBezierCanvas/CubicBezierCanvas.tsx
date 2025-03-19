import React, { useState, useRef, useEffect } from "react";

interface ControlPoint {
  x: number;
  y: number;
}

const DynamicCurveEditor: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasSize = 400;
  const minXGap = 0.05;
  const proximityThreshold = 0.05;

  const [controlPoints, setControlPoints] = useState<ControlPoint[]>([
    { x: 0, y: 0 },
    { x: 1, y: 1 },
  ]);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  const getCanvasX = (x: number) => x * canvasSize;
  const getCanvasY = (y: number) => (1 - y) * canvasSize;

  const pointToLineDistance = (
    px: number,
    py: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ) => {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    const param = lenSq !== 0 ? dot / lenSq : -1;

    let xx, yy;
    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }

    const dx = px - xx;
    const dy = py - yy;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const isPointNearCurve = (x: number, y: number) => {
    if (controlPoints.length === 2) {
      return (
        pointToLineDistance(
          x,
          y,
          controlPoints[0].x,
          controlPoints[0].y,
          controlPoints[1].x,
          controlPoints[1].y
        ) < proximityThreshold
      );
    }

    const steps = 100;
    for (let i = 0; i < controlPoints.length - 1; i++) {
      const p0 =
        i === 0
          ? {
              x: 2 * controlPoints[0].x - controlPoints[1].x,
              y: 2 * controlPoints[0].y - controlPoints[1].y,
            }
          : controlPoints[i - 1];
      const p1 = controlPoints[i];
      const p2 = controlPoints[i + 1];
      const p3 =
        i + 2 < controlPoints.length
          ? controlPoints[i + 2]
          : {
              x:
                2 * controlPoints[controlPoints.length - 1].x -
                controlPoints[controlPoints.length - 2].x,
              y:
                2 * controlPoints[controlPoints.length - 1].y -
                controlPoints[controlPoints.length - 2].y,
            };

      for (let t = 0; t <= 1; t += 1 / steps) {
        const xCurve =
          0.5 *
          (2 * p1.x +
            (-p0.x + p2.x) * t +
            (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t * t +
            (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t * t * t);
        const yCurve =
          0.5 *
          (2 * p1.y +
            (-p0.y + p2.y) * t +
            (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t * t +
            (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t * t * t);

        const distance = Math.hypot(x - xCurve, y - yCurve);
        if (distance < proximityThreshold) return true;
      }
    }
    return false;
  };

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

  const drawCurve = (ctx: CanvasRenderingContext2D) => {
    if (controlPoints.length < 2) return;

    if (controlPoints.length === 2) {
      ctx.beginPath();
      ctx.moveTo(
        getCanvasX(controlPoints[0].x),
        getCanvasY(controlPoints[0].y)
      );
      ctx.lineTo(
        getCanvasX(controlPoints[1].x),
        getCanvasY(controlPoints[1].y)
      );
      ctx.stroke();
    } else {
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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasSize, canvasSize);
    drawCurve(ctx);

    controlPoints.forEach((p, i) => {
      const x = getCanvasX(p.x);
      const y = getCanvasY(p.y);
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, 2 * Math.PI);
      ctx.fillStyle =
        i === 0 || i === controlPoints.length - 1 ? "blue" : "red";
      ctx.fill();
      ctx.stroke();
    });
  }, [controlPoints]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) / canvasSize;
    const mouseY = 1 - (e.clientY - rect.top) / canvasSize;

    for (let i = 1; i < controlPoints.length - 1; i++) {
      const cp = controlPoints[i];
      if (Math.hypot(mouseX - cp.x, mouseY - cp.y) < 0.025) {
        setDraggingIndex(i);
        return;
      }
    }

    if (isPointNearCurve(mouseX, mouseY)) {
      setControlPoints((prev) => {
        const newPoint = { x: mouseX, y: mouseY };
        const newPoints = [
          ...prev.slice(0, -1),
          newPoint,
          prev[prev.length - 1],
        ];
        const sortedPoints = newPoints.sort((a, b) => a.x - b.x);
        const newIndex = sortedPoints.findIndex(
          (p) => p.x === newPoint.x && p.y === newPoint.y
        );
        setDraggingIndex(newIndex);
        return sortedPoints;
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (draggingIndex === null || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    let newX = (e.clientX - rect.left) / canvasSize;
    const newY = Math.min(
      1,
      Math.max(0, 1 - (e.clientY - rect.top) / canvasSize)
    );

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

  const getCatmullRomPoint = (
    t: number,
    p0: ControlPoint,
    p1: ControlPoint,
    p2: ControlPoint,
    p3: ControlPoint
  ) => {
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
    return { x, y };
  };

  const exportCurveData = (frameCount: number) => {
    if (controlPoints.length < 2) {
      console.error("At least 2 control points are required.");
      return [];
    }

    const curveData: { x: number; y: number }[] = [];
    const steps = frameCount - 1;

    for (let i = 0; i <= steps; i++) {
      const tGlobal = i / steps; // 0부터 1까지
      const segmentCount = controlPoints.length - 1;
      const segmentLength = 1 / segmentCount;
      let segmentIndex = Math.min(
        Math.floor(tGlobal * segmentCount),
        segmentCount - 1
      ); // segmentIndex가 segmentCount-1을 넘지 않도록 제한
      const tLocal = (tGlobal - segmentIndex * segmentLength) / segmentLength;

      // 세그먼트별 포인트 설정
      const p0 =
        segmentIndex === 0
          ? {
              x: 2 * controlPoints[0].x - controlPoints[1].x,
              y: 2 * controlPoints[0].y - controlPoints[1].y,
            }
          : controlPoints[segmentIndex - 1];
      const p1 = controlPoints[segmentIndex];
      const p2 = controlPoints[segmentIndex + 1];
      const p3 =
        segmentIndex + 2 < controlPoints.length
          ? controlPoints[segmentIndex + 2]
          : {
              x:
                2 * controlPoints[controlPoints.length - 1].x -
                controlPoints[controlPoints.length - 2].x,
              y:
                2 * controlPoints[controlPoints.length - 1].y -
                controlPoints[controlPoints.length - 2].y,
            };

      const point = getCatmullRomPoint(tLocal, p0, p1, p2, p3);
      curveData.push({ x: point.x, y: point.y });
    }

    return curveData;
  };

  const handleExportCurve = () => {
    try {
      const frameCount = 4;
      const data = exportCurveData(frameCount);
      if (!data || data.length === 0) {
        throw new Error("No curve data generated.");
      }

      console.log("Curve Data:", data);

      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "curve_data.json";

      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
      alert("파일 다운로드에 실패했습니다. 콘솔을 확인하세요.");
    }
  };

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
      <button onClick={handleExportCurve}>Export Curve Data</button>
    </div>
  );
};

export default DynamicCurveEditor;
