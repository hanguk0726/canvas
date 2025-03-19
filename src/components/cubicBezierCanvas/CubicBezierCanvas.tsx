import React, { useState, useRef, useEffect, MouseEvent } from "react";

interface ControlPoint {
  x: number; // normalized 0 ~ 1
  y: number; // normalized 0 ~ 1
}

const DynamicBezierEditor: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasSize = 400; // 정사각형 캔버스 (400×400)

  // 초기 control point: (0,0)와 (1,1)은 고정되어 있음.
  const [controlPoints, setControlPoints] = useState<ControlPoint[]>([
    { x: 0, y: 0 },
    { x: 1, y: 1 },
  ]);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  // normalized -> canvas 좌표 변환 (y는 뒤집음)
  const getCanvasX = (x: number) => x * canvasSize;
  const getCanvasY = (y: number) => canvasSize * y; // 여기서는 (0,0)이 왼쪽 상단, (1,1)이 오른쪽 하단

  // 두 점 (x1,y1)와 (x2,y2)를 잇는 선분과 점 (px,py) 사이의 거리를 구하는 함수
  const distanceToSegment = (
    px: number,
    py: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): number => {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    if (lenSq !== 0) {
      param = dot / lenSq;
    }
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
    return Math.hypot(dx, dy);
  };

  // De Casteljau 알고리즘으로 t에 따른 베지어 곡선상의 점을 구함.
  const deCasteljau = (t: number, points: ControlPoint[]): ControlPoint => {
    let temp = points.map((p) => ({ ...p }));
    while (temp.length > 1) {
      temp = temp.slice(0, temp.length - 1).map((_, i) => ({
        x: (1 - t) * temp[i].x + t * temp[i + 1].x,
        y: (1 - t) * temp[i].y + t * temp[i + 1].y,
      }));
    }
    return temp[0];
  };

  // 캔버스에 베지어 곡선과 제어선, 제어점들을 그림.
  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvasSize, canvasSize);

    // control polygon (점선)
    ctx.beginPath();
    ctx.strokeStyle = "gray";
    ctx.setLineDash([5, 5]);
    controlPoints.forEach((p, i) => {
      const x = getCanvasX(p.x);
      const y = getCanvasY(p.y);
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();
    ctx.setLineDash([]);

    // 베지어 곡선 그리기 (De Casteljau 알고리즘으로 100개의 샘플)
    ctx.beginPath();
    const steps = 100;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const pt = deCasteljau(t, controlPoints);
      const x = getCanvasX(pt.x);
      const y = getCanvasY(pt.y);
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.stroke();

    // control point 그리기
    controlPoints.forEach((p, i) => {
      const x = getCanvasX(p.x);
      const y = getCanvasY(p.y);
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, 2 * Math.PI);
      // 시작/종료점은 파란색으로 고정, 나머지는 빨간색
      ctx.fillStyle =
        i === 0 || i === controlPoints.length - 1 ? "blue" : "red";
      ctx.fill();
      ctx.strokeStyle = "black";
      ctx.stroke();
    });
  }, [controlPoints]);

  // 마우스 다운: control point 근처면 dragging, 아니라면 선분 근처면 새 점 추가
  const handleMouseDown = (e: MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const normalizedX = mouseX / canvasSize;
    const normalizedY = mouseY / canvasSize;

    // 기존 control point들 중 가까운게 있으면 (끝점은 고정시켜 드래그 불가)
    for (let i = 1; i < controlPoints.length - 1; i++) {
      const cp = controlPoints[i];
      const cpX = getCanvasX(cp.x);
      const cpY = getCanvasY(cp.y);
      const dist = Math.hypot(mouseX - cpX, mouseY - cpY);
      if (dist < 10) {
        setDraggingIndex(i);
        return;
      }
    }
    // 없다면 각 선분에 대해 클릭 위치와의 거리를 체크
    const threshold = 8;
    let closestIndex: number | null = null;
    let minDist = Infinity;
    for (let i = 0; i < controlPoints.length - 1; i++) {
      const p1 = controlPoints[i];
      const p2 = controlPoints[i + 1];
      const dist = distanceToSegment(
        mouseX,
        mouseY,
        getCanvasX(p1.x),
        getCanvasY(p1.y),
        getCanvasX(p2.x),
        getCanvasY(p2.y)
      );
      if (dist < minDist) {
        minDist = dist;
        closestIndex = i;
      }
    }
    // 선분과의 거리가 임계값 이내이면 새 control point를 해당 선분 사이에 추가
    if (minDist < threshold && closestIndex !== null) {
      const newPoint: ControlPoint = { x: normalizedX, y: normalizedY };
      // 새로운 점은 기존 점 사이에 삽입 (인덱스 closestIndex + 1)
      setControlPoints((prev) => {
        const newPoints = [...prev];
        newPoints.splice(closestIndex! + 1, 0, newPoint);
        return newPoints;
      });
      // 추가한 새 control point를 바로 드래그할 수 있도록
      setDraggingIndex(closestIndex! + 1);
    }
  };

  const handleMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
    if (draggingIndex === null || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const newX = Math.min(1, Math.max(0, mouseX / canvasSize));
    const newY = Math.min(1, Math.max(0, mouseY / canvasSize));
    setControlPoints((prev) => {
      const newPoints = [...prev];
      newPoints[draggingIndex] = { x: newX, y: newY };
      return newPoints;
    });
  };

  const handleMouseUp = () => {
    setDraggingIndex(null);
  };

  return (
    <div>
      <h2>Dynamic Bezier Curve Editor</h2>
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

export default DynamicBezierEditor;
