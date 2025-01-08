import React, { useRef, useEffect, useState } from 'react';
import { ActionButtons } from './ActionButtons';
import { DrawingMode, DrawingPoint, Shape, DrawingElement } from './types';
import { maxCanvasWidth, maxCanvasHeight } from './constants';
import { ToolBar } from './Toolbar';
import { getPixelColor, redrawCanvas } from './canvasUtils';

interface CanvasProps {
    imageSrc: string;
}

const Canvas: React.FC<CanvasProps> = ({ imageSrc }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [history, setHistory] = useState<DrawingElement[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [currentPath, setCurrentPath] = useState<DrawingPoint[]>([]);
    const [drawingMode, setDrawingMode] = useState<DrawingMode>('pen');
    const [lineWidth, setLineWidth] = useState(5);
    const [currentShape, setCurrentShape] = useState<Shape | null>(null);
    const [_imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);

    const [showColorPicker, setShowColorPicker] = useState(false);
    const [currentColor, setCurrentColor] = useState('#000000');
    const [hoverColor, setHoverColor] = useState(currentColor);
    const colorPickerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => { // 바깥 클릭시 컬러피커 닫기
            if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node)) {
                setShowColorPicker(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        
        
        if (ctx && canvas) {
            // 컨텍스트의 globalCompositeOperation 초기 설정
            ctx.globalCompositeOperation = 'source-over';
            
            const img = new Image();
            img.src = imageSrc;
            img.onload = () => {
                setImageSize({ width: img.width, height: img.height });
                
                const imgWidth = img.width;
                const imgHeight = img.height;
                
                const canvasWidth = Math.min(imgWidth, maxCanvasWidth);
                const canvasHeight = Math.min(imgHeight, maxCanvasHeight);
                
                canvas.width = canvasWidth;
                canvas.height = canvasHeight;
                
                // 캔버스 초기화 시 투명 배경 설정
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                redrawCanvas(ctx, canvas, history.slice(0, historyIndex + 1), currentShape, imageSrc, currentColor);
            };
        }
    }, [imageSrc, history, historyIndex, currentShape]);
    
    const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
        if (drawingMode === 'eyedropper') {
            const ctx = canvasRef.current?.getContext('2d');
            if (!ctx) return;

            const rect = canvasRef.current?.getBoundingClientRect();
            const x = event.clientX - (rect?.left || 0);
            const y = event.clientY - (rect?.top || 0);
            const color = getPixelColor(ctx, x, y);
            setCurrentColor(color);
            setDrawingMode('pen'); // 색상 선택 후 펜 모드로 전환
        }
    };

    const draw = (event: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;

        const rect = canvasRef.current?.getBoundingClientRect();
        const newX = event.clientX - (rect?.left || 0);
        const newY = event.clientY - (rect?.top || 0);

        if (drawingMode === 'pen' || drawingMode === 'eraser') {
            const ctx = canvasRef.current?.getContext('2d');
            if (ctx && currentPath.length > 0) {  // 이전 점이 있는 경우에만 선을 그림
                const currentPoint = currentPath[currentPath.length - 1];
                ctx.beginPath();
                ctx.lineWidth = drawingMode === 'eraser' ? lineWidth * 2 : lineWidth;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';

                // 지우개 모드일 때 destination-out 사용
                if (drawingMode === 'eraser') {
                    ctx.globalCompositeOperation = 'destination-out';
                } else {
                    ctx.globalCompositeOperation = 'source-over';
                    ctx.strokeStyle = currentColor;
                }

                ctx.moveTo(currentPoint.x, currentPoint.y);
                ctx.lineTo(newX, newY);
                ctx.stroke();

                // 컴포지션 모드 복구
                ctx.globalCompositeOperation = 'source-over';
            }

            const newPoint: DrawingPoint = {
                x: newX,
                y: newY,
                isErasing: drawingMode === 'eraser',
                lineWidth: drawingMode === 'eraser' ? lineWidth * 2 : lineWidth,
                color: currentColor
            };
            setCurrentPath(prev => [...prev, newPoint]);
        } else if (currentShape) {
            setCurrentShape(prev => prev ? {
                ...prev,
                endX: newX,
                endY: newY
            } : null);
        }
    };

    const handleCanvasHover = (event: React.MouseEvent<HTMLCanvasElement>) => {
        if (drawingMode === 'eyedropper') {
            const ctx = canvasRef.current?.getContext('2d');
            if (!ctx) return;
            const rect = canvasRef.current?.getBoundingClientRect();
            const x = event.clientX - (rect?.left || 0);
            const y = event.clientY - (rect?.top || 0);
            const color = getPixelColor(ctx, x, y);
            setHoverColor(color);
        }
    };


    const startDrawing = (event: React.MouseEvent<HTMLCanvasElement>) => {
        if (drawingMode === 'eyedropper') {
            handleCanvasClick(event);
            return;
        }

        setIsDrawing(true);
        const rect = canvasRef.current?.getBoundingClientRect();
        const x = event.clientX - (rect?.left || 0);
        const y = event.clientY - (rect?.top || 0);

        if (drawingMode === 'pen' || drawingMode === 'eraser') {
            const newPoint: DrawingPoint = {
                x,
                y,
                isErasing: drawingMode === 'eraser',
                lineWidth: drawingMode === 'eraser' ? lineWidth * 2 : lineWidth
            };
            setCurrentPath([newPoint]);
        } else if (drawingMode === 'circle' || drawingMode === 'rectangle') {
            // 도형 그리기 시작
            setCurrentShape({
                type: drawingMode === 'circle' ? 'circle' : 'rectangle',
                startX: x,
                startY: y,
                endX: x,
                endY: y,
                lineWidth,
                color: currentColor
            });
        }
    };


    const finishDrawing = () => {
        if (!isDrawing) return;

        if (drawingMode === 'pen' || drawingMode === 'eraser') {
            if (currentPath.length > 0) {
                const newHistoryIndex = historyIndex + 1;
                const newHistory = [...history.slice(0, newHistoryIndex), currentPath];

                setHistory(newHistory);
                setHistoryIndex(newHistoryIndex);
                setCurrentPath([]);
            }
        } else if (currentShape) {
            // 도형 확정
            const newHistoryIndex = historyIndex + 1;
            const newHistory = [...history.slice(0, newHistoryIndex), currentShape];

            setHistory(newHistory);
            setHistoryIndex(newHistoryIndex);
            setCurrentShape(null);
        }

        setIsDrawing(false);
    };

    const undo = () => {
        if (historyIndex >= 0) {
            setHistoryIndex(historyIndex - 1);
        }
    };

    const redo = () => {
        if (historyIndex < history.length - 1) {
            setHistoryIndex(historyIndex + 1);
        }
    };

    const saveCanvasAsImage = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const imageData = canvas.toDataURL('image/png');

        const link = document.createElement('a');
        link.href = imageData;
        link.download = 'canvas-image.png'; // 다운로드 파일명 설정

        link.click();
    };

    return (
        <div className="flex flex-col items-center">
            <ToolBar
                drawingMode={drawingMode}
                setDrawingMode={setDrawingMode}
                lineWidth={lineWidth}
                setLineWidth={setLineWidth}
                currentColor={currentColor}
                setCurrentColor={setCurrentColor}
                showColorPicker={showColorPicker}
                setShowColorPicker={setShowColorPicker}
                hoverColor={hoverColor}
                colorPickerRef={colorPickerRef}
            />
            <canvas
                ref={canvasRef}
                style={{ background: 'transparent' }}
                className="border border-gray-500"
                onMouseDown={startDrawing}
                onMouseMove={(event) => {
                    draw(event);
                    handleCanvasHover(event);
                }}
                onMouseUp={finishDrawing}
                onMouseLeave={finishDrawing}
            />
            <ActionButtons
                historyIndex={historyIndex}
                historyLength={history.length}
                onUndo={undo}
                onRedo={redo}
                onSave={saveCanvasAsImage}
            />
        </div>
    );
};

export default Canvas;