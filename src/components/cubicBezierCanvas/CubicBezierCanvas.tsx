import React, { useRef, useState, useEffect, MouseEvent } from "react";

interface ControlPoint {
  x: number; // 0 ~ 1 사이의 정규화된 값 (수평)
  y: number; // 0 ~ 1 사이의 정규화된 값 (수직)
}

interface Points {
  p1: ControlPoint;
  p2: ControlPoint;
}

type DraggingPoint = "p1" | "p2" | null;

const CubicBezierCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasSize = 300; // 정사각형 캔버스 (300 x 300)

  // CSS cubic-bezier와 동일한 초기값: (0,0)에서 (1,1) 사이,
  // 캔버스 좌표에서는 y축이 반전되므로 p1.y는 낮은 값일수록 아래쪽에, p2.y 높은 값일수록 위쪽에 위치합니다.
  const [points, setPoints] = useState<Points>({
    p1: { x: 0.25, y: 0.1 },
    p2: { x: 0.75, y: 0.9 },
  });

  const [dragging, setDragging] = useState<DraggingPoint>(null);

  // 정규화된 좌표를 캔버스 좌표로 변환 (x는 그대로, y는 뒤집음)
  const getCanvasX = (x: number) => x * canvasSize;
  const getCanvasY = (y: number) => canvasSize * (1 - y);

  // 마우스 좌표와 제어점 사이의 거리가 임계값(threshold) 내에 있는지 검사
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

  // 캔버스의 실제 좌표를 기준으로 드래그할 제어점을 결정
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

  // 드래그 중일 때 캔버스 내의 마우스 좌표를 정규화하여 제어점 업데이트
  const handleMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
    if (!dragging || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // 캔버스 좌표를 0~1 범위로 정규화
    const newX = Math.min(1, Math.max(0, mouseX / canvasSize));
    // y좌표는 캔버스의 좌측상단 기준이므로 뒤집어 줍니다.
    const newY = Math.min(1, Math.max(0, 1 - mouseY / canvasSize));

    setPoints((prevPoints) => {
      if (dragging === "p1") {
        return { ...prevPoints, p1: { x: newX, y: newY } };
      } else if (dragging === "p2") {
        return { ...prevPoints, p2: { x: newX, y: newY } };
      }
      return prevPoints;
    });
  };

  const handleMouseUp = () => {
    setDragging(null);
  };

  // 캔버스에 베지어 곡선, 제어점, 그리고 제어선들을 그립니다.
  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, canvasSize, canvasSize);

      // 베지어 곡선 그리기
      ctx.beginPath();
      // 시작점은 (0,0) 정규화 좌표 → 캔버스 좌표 (0, canvasSize)
      // 종료점은 (1,1) 정규화 좌표 → 캔버스 좌표 (canvasSize, 0)
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

      // 제어점 표시 (빨간 원)
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

      // 제어선 그리기 (파란 선)
      ctx.strokeStyle = "blue";
      ctx.beginPath();
      ctx.moveTo(0, canvasSize); // 시작점
      ctx.lineTo(getCanvasX(points.p1.x), getCanvasY(points.p1.y));
      ctx.moveTo(canvasSize, 0); // 종료점
      ctx.lineTo(getCanvasX(points.p2.x), getCanvasY(points.p2.y));
      ctx.stroke();
    }
  }, [points]);

  return (
    <div>
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
      {/* <p>
        Cubic Bezier: cubic-bezier(
        {points.p1.x.toFixed(2)}, {points.p1.y.toFixed(2)},{" "}
        {points.p2.x.toFixed(2)}, {points.p2.y.toFixed(2)})
      </p> */}
    </div>
  );
};

export default CubicBezierCanvas;
