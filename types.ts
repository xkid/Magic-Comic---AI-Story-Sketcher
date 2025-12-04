export interface StoryPanel {
  id: number;
  text: string;
  sceneDescription: string;
}

export type ToolType = 'pencil' | 'pen' | 'marker' | 'eraser' | 'fill';

export interface DrawingTool {
  type: ToolType;
  color: string;
  size: number;
  opacity: number;
}

export interface DrawingCanvasRef {
  getDataURL: () => string;
  clear: () => void;
  undo: () => void;
  redo: () => void;
}

export interface Point {
  x: number;
  y: number;
}