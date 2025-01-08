import { DrawingElement, Shape } from './types';

export const drawShape = (ctx: CanvasRenderingContext2D, shape: Shape) => {
    ctx.beginPath();
    ctx.lineWidth = shape.lineWidth;
    ctx.strokeStyle = shape.color;

    if (shape.type === 'rectangle') {
        const width = shape.endX - shape.startX;
        const height = shape.endY - shape.startY;
        ctx.strokeRect(shape.startX, shape.startY, width, height);
    } else if (shape.type === 'circle') {
        const centerX = (shape.startX + shape.endX) / 2;
        const centerY = (shape.startY + shape.endY) / 2;
        const radius = Math.sqrt(
            Math.pow(shape.endX - shape.startX, 2) +
            Math.pow(shape.endY - shape.startY, 2)
        ) / 2;
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.stroke();
    }
};

export const getPixelColor = (ctx: CanvasRenderingContext2D, x: number, y: number): string => {
    const pixelData = ctx.getImageData(x, y, 1, 1).data;
    return `#${((1 << 24) + (pixelData[0] << 16) + (pixelData[1] << 8) + pixelData[2]).toString(16).slice(1)}`;
};

export const redrawCanvas = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    elements: DrawingElement[],
    shapeInProgress: Shape | null,
    imageSrc: string,
    currentColor: string
) => {
    console.log("redraw")
    // 캔버스를 완전히 투명하게 지우기
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 원본 이미지 그리기
    const img = new Image();
    img.src = imageSrc;
    ctx.drawImage(img, 0, 0);

    elements.forEach(element => {
        if (Array.isArray(element)) {
            if (element.length > 0) {
                ctx.beginPath();
                element.forEach(({ x, y, isErasing, lineWidth: pointLineWidth, color }, index) => {
                    ctx.lineWidth = pointLineWidth || 5;
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';

                    if (isErasing) {
                        ctx.globalCompositeOperation = 'destination-out';
                    } else {
                        ctx.globalCompositeOperation = 'source-over';
                        ctx.strokeStyle = color || currentColor;
                    }

                    if (index === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                });
                ctx.stroke();
                ctx.globalCompositeOperation = 'source-over';
            }
        } else {
            drawShape(ctx, element);
        }
    });

    // 현재 그리고 있는 도형 미리보기
    if (shapeInProgress) {
        drawShape(ctx, shapeInProgress);
    }
};