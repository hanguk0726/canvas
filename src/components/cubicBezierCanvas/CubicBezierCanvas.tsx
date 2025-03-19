import React, {
  useState,
  useRef,
  useEffect,
  useImperativeHandle,
  forwardRef,
} from "react";

interface ControlPoint {
  x: number;
  y: number;
}

interface Props {
  totalSteps: number;
  onCurveDataChange: (data: { x: number; y: number }[]) => void;
  onControlPointsChange: (points: ControlPoint[]) => void;
}

// ref로 노출할 메서드의 타입 정의
interface DynamicCurveEditorRef {
  getYAtTime: (targetX: number, maxX: number, maxY: number) => number;
}

const DynamicCurveEditor = forwardRef<DynamicCurveEditorRef, Props>(
  ({ totalSteps, onCurveDataChange, onControlPointsChange }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const canvasSize = 400;
    const minXGap = 0.05;
    const proximityThreshold = 0.05;

    const [controlPoints, setControlPoints] = useState<ControlPoint[]>([
      { x: 0, y: 0 },
      { x: 1, y: 1 },
    ]);
    const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

    const clamp = (value: number, min: number, max: number) =>
      Math.min(max, Math.max(min, value));

    const getCanvasX = (x: number) => clamp(x, 0, 1) * canvasSize;
    const getCanvasY = (y: number) => (1 - clamp(y, 0, 1)) * canvasSize;

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
          let xCurve =
            0.5 *
            (2 * p1.x +
              (-p0.x + p2.x) * t +
              (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t * t +
              (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t * t * t);
          let yCurve =
            0.5 *
            (2 * p1.y +
              (-p0.y + p2.y) * t +
              (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t * t +
              (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t * t * t);
          xCurve = clamp(xCurve, 0, 1);
          yCurve = clamp(yCurve, 0, 1);

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
        let y =
          0.5 *
          (2 * p1.y +
            (-p0.y + p2.y) * t +
            (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t * t +
            (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t * t * t);

        x = clamp(x, 0, 1);
        y = clamp(y, 0, 1);

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

    useEffect(() => {
      const data = exportCurveData();
      onCurveDataChange(data);
      onControlPointsChange(controlPoints);
    }, [controlPoints, totalSteps]);

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = canvasRef.current!.getBoundingClientRect();
      const mouseX = clamp((e.clientX - rect.left) / canvasSize, 0, 1);
      const mouseY = clamp(1 - (e.clientY - rect.top) / canvasSize, 0, 1);

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

          if (newIndex > 0 && newIndex < sortedPoints.length - 1) {
            const leftX = sortedPoints[newIndex - 1].x;
            const rightX = sortedPoints[newIndex + 1].x;
            if (newPoint.x - leftX < minXGap || rightX - newPoint.x < minXGap) {
              return prev;
            }
          }

          setDraggingIndex(newIndex);
          return sortedPoints;
        });
      }
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (draggingIndex === null || !canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      let newX = clamp((e.clientX - rect.left) / canvasSize, 0, 1);
      const newY = clamp(1 - (e.clientY - rect.top) / canvasSize, 0, 1);

      if (draggingIndex > 0 && draggingIndex < controlPoints.length - 1) {
        const leftX = controlPoints[draggingIndex - 1].x + minXGap;
        const rightX = controlPoints[draggingIndex + 1].x - minXGap;
        newX = clamp(newX, leftX, rightX);
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
      let x =
        0.5 *
        (2 * p1.x +
          (-p0.x + p2.x) * t +
          (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t * t +
          (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t * t * t);
      let y =
        0.5 *
        (2 * p1.y +
          (-p0.y + p2.y) * t +
          (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t * t +
          (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t * t * t);

      x = clamp(x, 0, 1);
      y = clamp(y, 0, 1);

      return { x, y };
    };

    const exportCurveData = () => {
      if (controlPoints.length < 2) {
        console.error("At least 2 control points are required.");
        return [];
      }
      const curveData: { x: number; y: number }[] = [];
      const steps = totalSteps - 1;

      for (let i = 0; i <= steps; i++) {
        const tGlobal = i / steps;
        const segmentCount = controlPoints.length - 1;
        const segmentLength = 1 / segmentCount;
        let segmentIndex = Math.min(
          Math.floor(tGlobal * segmentCount),
          segmentCount - 1
        );
        const tLocal = (tGlobal - segmentIndex * segmentLength) / segmentLength;

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

    const getYAtTime = (
      targetX: number,
      maxX: number,
      maxY: number
    ): number => {
      if (controlPoints.length < 2) {
        throw new Error("At least 2 control points are required.");
      }

      const tNormalized = clamp(targetX / maxX, 0, 1);
      const segmentCount = controlPoints.length - 1;
      const segmentLength = 1 / segmentCount;
      let segmentIndex = Math.min(
        Math.floor(tNormalized * segmentCount),
        segmentCount - 1
      );
      const tLocal =
        (tNormalized - segmentIndex * segmentLength) / segmentLength;

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

      const { y } = getCatmullRomPoint(tLocal, p0, p1, p2, p3);
      return y * maxY;
    };

    // ref로 getYAtTime 함수 노출
    useImperativeHandle(ref, () => ({
      getYAtTime,
    }));

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
        <button onClick={() => exportCurveData()}>Export Curve Data</button>
      </div>
    );
  }
);

export default DynamicCurveEditor;
