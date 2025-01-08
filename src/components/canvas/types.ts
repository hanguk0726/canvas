export type DrawingMode = 'pen' | 'eraser' | 'circle' | 'rectangle' | 'eyedropper';

export interface DrawingPoint {
   x: number;
   y: number;
   isErasing: boolean;
   lineWidth?: number;
   color?: string;
}

export interface Shape {
   type: 'circle' | 'rectangle';
   startX: number;
   startY: number;
   endX: number;
   endY: number;
   lineWidth: number;
   color: string;
}

export type DrawingElement = DrawingPoint[] | Shape;
