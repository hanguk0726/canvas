import React from 'react';
import { SketchPicker } from 'react-color';
import { DrawingMode } from './types';

interface ToolBarProps {
    drawingMode: DrawingMode;
    setDrawingMode: (mode: DrawingMode) => void;
    lineWidth: number;
    setLineWidth: (width: number) => void;
    currentColor: string;
    setCurrentColor: (color: string) => void;
    showColorPicker: boolean;
    setShowColorPicker: (show: boolean) => void;
    hoverColor: string;
    colorPickerRef: React.RefObject<HTMLDivElement>;
}

export const ToolBar: React.FC<ToolBarProps> = ({
    drawingMode,
    setDrawingMode,
    lineWidth,
    setLineWidth,
    currentColor,
    setCurrentColor,
    showColorPicker,
    setShowColorPicker,
    hoverColor,
    colorPickerRef
}) => {
    return (
        <div className="mb-4 space-x-2 flex items-center" draggable="false">
            <button
                className={`px-4 py-2 rounded ${drawingMode === 'pen' ? 'bg-black text-white' : 'bg-gray-300'}`}
                onClick={() => setDrawingMode('pen')}
                draggable="false"
                style={{ userSelect: 'none' }}
            >
                펜
            </button>
            <button
                className={`px-4 py-2 rounded ${drawingMode === 'eraser' ? 'bg-black text-white' : 'bg-gray-300'}`}
                onClick={() => setDrawingMode('eraser')}
                draggable="false"
                style={{ userSelect: 'none' }}
            >
                지우개
            </button>
            <button
                className={`px-4 py-2 rounded ${drawingMode === 'circle' ? 'bg-black text-white' : 'bg-gray-300'}`}
                onClick={() => setDrawingMode('circle')}
                draggable="false"
                style={{ userSelect: 'none' }}
            >
                원
            </button>
            <button
                className={`px-4 py-2 rounded ${drawingMode === 'rectangle' ? 'bg-black text-white' : 'bg-gray-300'}`}
                onClick={() => setDrawingMode('rectangle')}
                draggable="false"
                style={{ userSelect: 'none' }}
            >
                사각형
            </button>
            <input
                type="range"
                min="1"
                max="20"
                value={lineWidth}
                onChange={(e) => setLineWidth(Number(e.target.value))}
                className="align-middle"
                draggable="false"
            />
            <span className="ml-2" draggable="false" style={{ userSelect: 'none' }} >{lineWidth}px</span>
            <div className="relative inline-block" ref={colorPickerRef} draggable="false">
                <button
                    className="px-4 py-2 rounded border border-gray-300 min-w-[56px] min-h-[40px]"
                    onClick={() => setShowColorPicker(!showColorPicker)}
                    style={{ backgroundColor: drawingMode === 'eyedropper' && hoverColor ? hoverColor : currentColor }}
                    draggable="false"
                />
                {showColorPicker && (
                    <div className="absolute z-10 mt-2" draggable="false">
                        <SketchPicker
                            color={currentColor}
                            onChange={(color) => {
                                setCurrentColor(color.hex);
                                setShowColorPicker(false);
                            }}
                        />
                    </div>
                )}
            </div>
            <button
                className={`px-4 py-2 rounded ${drawingMode === 'eyedropper' ? 'bg-black text-white' : 'bg-gray-300'}`}
                onClick={() => drawingMode !== 'eyedropper' ? setDrawingMode('eyedropper') : setDrawingMode('pen')}
                draggable="false"
                style={{ userSelect: 'none' }}
            >
                스포이드
            </button>
        </div>
    );
};