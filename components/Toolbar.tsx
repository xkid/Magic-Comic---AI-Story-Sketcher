import React from 'react';
import { DrawingTool, ToolType } from '../types';
import { 
  Pencil, 
  PenTool, 
  Highlighter, 
  Eraser, 
  PaintBucket, 
  Minus, 
  Circle,
  Undo,
  Redo,
  Palette,
  Trash2,
  XSquare
} from 'lucide-react';

interface ToolbarProps {
  currentTool: DrawingTool;
  setTool: (tool: DrawingTool) => void;
  onClear: () => void;
  onClearAll: () => void;
  onUndo: () => void;
  onRedo: () => void;
  hasActivePanel: boolean;
}

const COLORS = [
  '#000000', '#2d2d2d', '#ef4444', '#f97316', '#eab308', 
  '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#8b4513', 
  '#9ca3af', '#ffffff'
];

const Toolbar: React.FC<ToolbarProps> = ({ currentTool, setTool, onClear, onClearAll, onUndo, onRedo, hasActivePanel }) => {

  const updateType = (type: ToolType) => {
    let size = currentTool.size;
    let opacity = 1;
    
    if (type === 'pencil') { size = 2; }
    if (type === 'pen') { size = 5; }
    if (type === 'marker') { size = 15; opacity = 0.5; }
    if (type === 'eraser') { size = 20; }
    
    setTool({ ...currentTool, type, size, opacity });
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t-4 border-indigo-100 p-2 md:p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] flex flex-col gap-3 z-50 max-h-[40vh] overflow-y-auto safe-area-bottom">
      
      {/* Top Row: Undo/Redo & Tools */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar w-full justify-between md:justify-center">
        
        {/* Undo/Redo Group */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl shrink-0">
            <button
                onClick={onUndo}
                disabled={!hasActivePanel}
                className="p-3 text-slate-600 hover:text-indigo-600 hover:bg-white rounded-lg disabled:opacity-30 active:scale-95 transition-transform"
                title="Undo"
            >
                <Undo size={22} />
            </button>
            <button
                onClick={onRedo}
                disabled={!hasActivePanel}
                className="p-3 text-slate-600 hover:text-indigo-600 hover:bg-white rounded-lg disabled:opacity-30 active:scale-95 transition-transform"
                title="Redo"
            >
                <Redo size={22} />
            </button>
        </div>

        {/* Tools Group */}
        <div className="flex gap-2 bg-slate-50 p-1 rounded-xl overflow-x-auto shrink-0">
            {[
              { id: 'pencil', Icon: Pencil, label: 'Pencil' },
              { id: 'pen', Icon: PenTool, label: 'Pen' },
              { id: 'marker', Icon: Highlighter, label: 'Marker' },
              { id: 'fill', Icon: PaintBucket, label: 'Fill' },
              { id: 'eraser', Icon: Eraser, label: 'Eraser' }
            ].map(({ id, Icon, label }) => (
              <button
                key={id}
                onClick={() => updateType(id as ToolType)}
                className={`p-3 rounded-xl transition-all min-w-[48px] flex justify-center items-center ${
                  currentTool.type === id 
                    ? 'bg-indigo-600 text-white shadow-md scale-105' 
                    : 'hover:bg-indigo-100 text-slate-600'
                }`}
                title={label}
              >
                <Icon size={22} />
              </button>
            ))}
        </div>

         {/* Clear Actions (Visible on larger screens in this row, hidden on small) */}
         <div className="hidden md:flex gap-2">
            <button 
                onClick={onClear}
                disabled={!hasActivePanel}
                className="px-4 py-2 flex items-center gap-2 text-sm font-bold text-red-500 hover:bg-red-50 rounded-xl border border-red-200 transition-colors disabled:opacity-50"
            >
                <Trash2 size={18} />
                Clear Active
            </button>
            <button 
                onClick={onClearAll}
                className="px-4 py-2 flex items-center gap-2 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
            >
                <XSquare size={18} />
                Clear All
            </button>
        </div>
      </div>

      {/* Bottom Row: Colors & Size */}
      <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-xl w-full overflow-x-auto no-scrollbar">
        
        {/* Colors */}
        <div className="flex items-center gap-3 shrink-0">
            <div className="flex gap-2">
                {COLORS.map((c) => (
                    <button
                        key={c}
                        onClick={() => setTool({...currentTool, color: c})}
                        className={`w-10 h-10 md:w-8 md:h-8 rounded-full border border-slate-300 shadow-sm ${currentTool.color === c ? 'ring-2 ring-indigo-500 ring-offset-2 scale-110' : ''}`}
                        style={{ backgroundColor: c }}
                        aria-label={`Color ${c}`}
                    />
                ))}
            </div>
            
            {/* Expanded Color Picker for Touch */}
            <div className="relative shrink-0">
                <div className="w-12 h-12 md:w-10 md:h-10 rounded-full border-2 border-indigo-200 shadow-sm overflow-hidden cursor-pointer hover:ring-2 hover:ring-indigo-500 flex items-center justify-center bg-white">
                    <Palette size={20} className="text-indigo-500" />
                    <input 
                        type="color" 
                        value={currentTool.color}
                        onChange={(e) => setTool({...currentTool, color: e.target.value})}
                        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer p-0 border-0"
                    />
                </div>
            </div>
        </div>

        <div className="h-8 w-px bg-slate-300 shrink-0 mx-2"></div>

        {/* Size Slider */}
        <div className="flex items-center gap-3 min-w-[160px] pr-4">
            <Minus size={16} className="text-slate-400 shrink-0" />
            <input 
                type="range" 
                min="1" 
                max="50" 
                value={currentTool.size} 
                onChange={(e) => setTool({...currentTool, size: Number(e.target.value)})}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <div 
                className="w-6 h-6 rounded-full border border-slate-200 shrink-0"
                style={{ backgroundColor: currentTool.color }}
            />
        </div>
      </div>

      {/* Mobile-only Clear Buttons (Bottom of stack) */}
      <div className="md:hidden flex gap-2 w-full">
         <button 
            onClick={onClear}
            disabled={!hasActivePanel}
            className="flex-1 py-3 flex justify-center items-center gap-2 text-sm font-bold text-red-600 bg-red-50 rounded-xl border border-red-200 active:bg-red-100 disabled:opacity-50 disabled:grayscale"
        >
            <Trash2 size={18} />
            Clear Active
        </button>
        <button 
            onClick={onClearAll}
            className="flex-1 py-3 flex justify-center items-center gap-2 text-sm font-bold text-slate-600 bg-slate-100 rounded-xl border border-slate-200 active:bg-slate-200"
        >
            <XSquare size={18} />
            Clear All
        </button>
      </div>

    </div>
  );
};

export default Toolbar;