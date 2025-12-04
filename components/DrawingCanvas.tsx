import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { DrawingTool, Point, DrawingCanvasRef } from '../types';

interface DrawingCanvasProps {
  tool: DrawingTool;
  width?: number;
  height?: number;
  className?: string;
  onInteract?: () => void;
}

const DrawingCanvas = forwardRef<DrawingCanvasRef, DrawingCanvasProps>(({ tool, width = 400, height = 400, className, onInteract }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPos, setLastPos] = useState<Point | null>(null);
  
  // History State for Undo/Redo
  const historyRef = useRef<ImageData[]>([]);
  const historyStepRef = useRef<number>(-1);

  const saveState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // If we are not at the end of history (did some undos), truncate the future
    if (historyStepRef.current < historyRef.current.length - 1) {
      historyRef.current = historyRef.current.slice(0, historyStepRef.current + 1);
    }

    historyRef.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    historyStepRef.current++;
  };

  const restoreState = (step: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageData = historyRef.current[step];
    if (imageData) {
      ctx.putImageData(imageData, 0, 0);
    }
  };

  useImperativeHandle(ref, () => ({
    getDataURL: () => {
      return canvasRef.current?.toDataURL('image/png') || '';
    },
    clear: () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        saveState();
      }
    },
    undo: () => {
      if (historyStepRef.current > 0) {
        historyStepRef.current--;
        restoreState(historyStepRef.current);
      }
    },
    redo: () => {
      if (historyStepRef.current < historyRef.current.length - 1) {
        historyStepRef.current++;
        restoreState(historyStepRef.current);
      }
    }
  }));

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // Initial white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Save initial blank state
        if (historyRef.current.length === 0) {
            saveState();
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  // --- FLOOD FILL ALGORITHM ---
  const hexToRgba = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
      a: 255
    } : { r: 0, g: 0, b: 0, a: 255 };
  };

  const floodFill = (startX: number, startY: number, fillColorHex: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    
    // Get image data
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data; // Uint8ClampedArray

    // Get color at start position
    const startPos = (Math.floor(startY) * width + Math.floor(startX)) * 4;
    const startR = data[startPos];
    const startG = data[startPos + 1];
    const startB = data[startPos + 2];
    const startA = data[startPos + 3];

    const fillColor = hexToRgba(fillColorHex);

    // If color is same, return
    if (startR === fillColor.r && startG === fillColor.g && startB === fillColor.b && startA === fillColor.a) {
        return;
    }

    const stack = [[Math.floor(startX), Math.floor(startY)]];
    
    // Helper to check match
    const matchStartColor = (pos: number) => {
        return data[pos] === startR && data[pos + 1] === startG && data[pos + 2] === startB && data[pos + 3] === startA;
    };

    // Helper to set color
    const colorPixel = (pos: number) => {
        data[pos] = fillColor.r;
        data[pos + 1] = fillColor.g;
        data[pos + 2] = fillColor.b;
        data[pos + 3] = fillColor.a;
    };

    while (stack.length) {
        const pop = stack.pop();
        if(!pop) continue;
        let [x, y] = pop;

        let pixelPos = (y * width + x) * 4;
        
        // Move up as long as we match start color
        while (y-- >= 0 && matchStartColor(pixelPos)) {
            pixelPos -= width * 4;
        }
        
        pixelPos += width * 4;
        y++;

        let reachLeft = false;
        let reachRight = false;

        // Move down
        while (y++ < height - 1 && matchStartColor(pixelPos)) {
            colorPixel(pixelPos);

            if (x > 0) {
                if (matchStartColor(pixelPos - 4)) {
                    if (!reachLeft) {
                        stack.push([x - 1, y]);
                        reachLeft = true;
                    }
                } else if (reachLeft) {
                    reachLeft = false;
                }
            }

            if (x < width - 1) {
                if (matchStartColor(pixelPos + 4)) {
                    if (!reachRight) {
                        stack.push([x + 1, y]);
                        reachRight = true;
                    }
                } else if (reachRight) {
                    reachRight = false;
                }
            }

            pixelPos += width * 4;
        }
    }

    ctx.putImageData(imageData, 0, 0);
    saveState();
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault(); 
    if (onInteract) onInteract(); // Notify parent which panel is active

    const pos = getCoordinates(e);
    if (!pos) return;

    // Handle Fill Tool
    if (tool.type === 'fill') {
      floodFill(pos.x, pos.y, tool.color);
      return; 
    }

    setIsDrawing(true);
    setLastPos(pos);
    draw(pos, pos); // Dot
  };

  const draw = (from: Point, to: Point) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);

    if (tool.type === 'eraser') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = tool.size;
      ctx.globalAlpha = 1.0;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = tool.color;
      ctx.lineWidth = tool.size;
      
      if (tool.type === 'marker') {
        ctx.globalAlpha = 0.5;
      } else {
        ctx.globalAlpha = 1.0;
      }
    }

    ctx.stroke();
    ctx.closePath();
    ctx.globalAlpha = 1.0;
  };

  const drawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing || !lastPos || tool.type === 'fill') return;

    const currentPos = getCoordinates(e);
    if (!currentPos) return;

    draw(lastPos, currentPos);
    setLastPos(currentPos);
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      setLastPos(null);
      saveState(); // Save to history on stroke end
    }
  };

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={`bg-white shadow-inner cursor-crosshair touch-none ${className}`}
      onMouseDown={startDrawing}
      onMouseMove={drawing}
      onMouseUp={stopDrawing}
      onMouseLeave={stopDrawing}
      onTouchStart={startDrawing}
      onTouchMove={drawing}
      onTouchEnd={stopDrawing}
    />
  );
});

DrawingCanvas.displayName = 'DrawingCanvas';
export default DrawingCanvas;