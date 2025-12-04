import React from 'react';
import { StoryPanel } from '../types';

export const exportComicToImage = async (
  panels: StoryPanel[],
  canvasRefs: React.MutableRefObject<(any)[]>,
  title: string
) => {
  // Create a temporary canvas to assemble the final image
  const exportCanvas = document.createElement('canvas');
  const ctx = exportCanvas.getContext('2d');
  
  if (!ctx) return;

  // Configuration for layout
  const margin = 40;
  const padding = 20;
  const panelWidth = 400;
  const panelHeight = 400;
  const textHeight = 100; // Space for text below panel
  const titleHeight = 80;
  
  // Layout: 2x2 grid
  const cols = 2;
  const rows = 2;
  
  const totalWidth = margin * 2 + (panelWidth * cols) + (padding * (cols - 1));
  const totalHeight = margin * 2 + titleHeight + (panelHeight * rows) + (textHeight * rows) + (padding * (rows - 1));

  exportCanvas.width = totalWidth;
  exportCanvas.height = totalHeight;

  // Background
  ctx.fillStyle = '#fcf5e5'; // Parchment color
  ctx.fillRect(0, 0, totalWidth, totalHeight);

  // Title
  ctx.font = 'bold 40px "Comic Neue", cursive';
  ctx.fillStyle = '#2d2d2d';
  ctx.textAlign = 'center';
  ctx.fillText(title || "My Magical Comic Adventure", totalWidth / 2, margin + 40);

  // Draw Panels
  for (let i = 0; i < panels.length; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    
    const x = margin + col * (panelWidth + padding);
    const y = margin + titleHeight + row * (panelHeight + textHeight + padding);

    // Draw Panel Image (From the user's canvas)
    const panelCanvasRef = canvasRefs.current[i];
    if (panelCanvasRef) {
        // Get data URL from child component
        const dataUrl = panelCanvasRef.getDataURL();
        const img = new Image();
        img.src = dataUrl;
        await new Promise<void>((resolve) => {
            img.onload = () => {
                // Draw white background for panel first
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(x, y, panelWidth, panelHeight);
                // Draw user drawing
                ctx.drawImage(img, x, y, panelWidth, panelHeight);
                
                // Draw Border
                ctx.strokeStyle = '#2d2d2d';
                ctx.lineWidth = 4;
                ctx.strokeRect(x, y, panelWidth, panelHeight);
                resolve();
            }
        });
    }

    // Draw Text
    ctx.fillStyle = '#2d2d2d';
    ctx.font = '20px "Patrick Hand", cursive';
    ctx.textAlign = 'center';
    
    const text = panels[i].text;
    wrapText(ctx, text, x + panelWidth / 2, y + panelHeight + 30, panelWidth, 24);
  }

  // Trigger Download
  const link = document.createElement('a');
  link.download = `magic-comic-${Date.now()}.png`;
  link.href = exportCanvas.toDataURL();
  link.click();
};

// Helper to wrap text on canvas
function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(' ');
  let line = '';

  for(let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, x, y);
      line = words[n] + ' ';
      y += lineHeight;
    }
    else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, y);
}