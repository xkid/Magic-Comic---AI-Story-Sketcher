import React, { useState, useRef, useCallback } from 'react';
import { generateMagicalStory } from './services/geminiService';
import DrawingCanvas from './components/DrawingCanvas';
import Toolbar from './components/Toolbar';
import { StoryPanel, DrawingTool, DrawingCanvasRef } from './types';
import { exportComicToImage } from './utils/exportUtils';
import { Sparkles, Printer, RefreshCw, Loader2, Edit3, Pencil } from 'lucide-react';

const App: React.FC = () => {
  const [panels, setPanels] = useState<StoryPanel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [storyTitle, setStoryTitle] = useState("My Magical Comic Adventure");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  
  // Drawing State
  const [currentTool, setCurrentTool] = useState<DrawingTool>({
    type: 'pencil',
    color: '#000000',
    size: 3,
    opacity: 1
  });

  const canvasRefs = useRef<(DrawingCanvasRef | null)[]>([]);
  const [activePanelId, setActivePanelId] = useState<number | null>(null);

  const handleGenerateStory = async () => {
    setLoading(true);
    setError(null);
    try {
      const story = await generateMagicalStory();
      setPanels(story);
      // Reset canvas refs
      canvasRefs.current = new Array(story.length).fill(null);
      // Reset title default
      setStoryTitle("My Magical Comic Adventure");
      setActivePanelId(null);
    } catch (err: any) {
      setError(err.message || "Failed to generate story");
    } finally {
      setLoading(false);
    }
  };

  const getActiveCanvas = useCallback(() => {
     if (activePanelId !== null) {
       return canvasRefs.current[activePanelId - 1]; // IDs are 1-based
     }
     return null;
  }, [activePanelId]);

  const handleClearActive = useCallback(() => {
    const ref = getActiveCanvas();
    if (ref) {
        if(window.confirm("Are you sure you want to clear this panel?")) {
            ref.clear();
        }
    } else {
        alert("Tap on a panel to select it first!");
    }
  }, [getActiveCanvas]);

  const handleClearAll = useCallback(() => {
    if (panels.length === 0) return;
    if (window.confirm("Are you sure you want to clear ALL panels? This cannot be undone.")) {
        canvasRefs.current.forEach(ref => {
            if (ref) ref.clear();
        });
    }
  }, [panels]);

  const handleUndo = useCallback(() => {
    const ref = getActiveCanvas();
    if (ref) ref.undo();
  }, [getActiveCanvas]);

  const handleRedo = useCallback(() => {
    const ref = getActiveCanvas();
    if (ref) ref.redo();
  }, [getActiveCanvas]);

  const handlePrint = async () => {
    if (panels.length === 0) return;
    await exportComicToImage(panels, canvasRefs, storyTitle);
  };

  return (
    <div className="min-h-screen bg-parchment font-comic pb-64 md:pb-48">
      
      {/* Header */}
      <header className="bg-indigo-600 text-white p-3 md:p-4 shadow-lg sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-3 md:gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto justify-center md:justify-start">
            <div className="bg-white/20 p-2 rounded-full hidden md:block">
              <Sparkles className="text-yellow-300 w-8 h-8" />
            </div>
            
            {panels.length > 0 ? (
                <div className="flex items-center gap-2 justify-center w-full md:w-auto">
                    {isEditingTitle ? (
                        <input 
                            type="text" 
                            value={storyTitle} 
                            onChange={(e) => setStoryTitle(e.target.value)}
                            onBlur={() => setIsEditingTitle(false)}
                            onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
                            autoFocus
                            className="bg-indigo-700 text-white border-b-2 border-white px-2 py-1 outline-none font-bold text-lg md:text-xl w-full max-w-[300px] text-center md:text-left"
                        />
                    ) : (
                        <div className="flex items-center gap-2 cursor-pointer group justify-center" onClick={() => setIsEditingTitle(true)}>
                            <h1 className="text-xl md:text-3xl font-bold tracking-wide border-b-2 border-transparent hover:border-white/50 transition-all text-center">{storyTitle}</h1>
                            <Edit3 size={16} className="text-indigo-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                    )}
                </div>
            ) : (
                <div className="text-center md:text-left">
                    <h1 className="text-2xl md:text-3xl font-bold tracking-wide">MagicComic</h1>
                    <p className="text-indigo-100 text-xs md:text-sm">AI Storyteller & Sketchpad</p>
                </div>
            )}
          </div>
          
          <div className="flex gap-2 w-full md:w-auto justify-center">
            <button 
              onClick={handleGenerateStory} 
              disabled={loading}
              className="flex-1 md:flex-none flex justify-center items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-indigo-900 px-4 py-2 rounded-full font-bold shadow-md transition-transform transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
            >
              {loading ? <Loader2 className="animate-spin" /> : <RefreshCw size={18} />}
              {panels.length > 0 ? 'New Story' : 'Generate'}
            </button>
            
            {panels.length > 0 && (
              <button 
                onClick={handlePrint}
                className="flex-1 md:flex-none flex justify-center items-center gap-2 bg-white text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-full font-bold shadow-md transition-transform transform active:scale-95 text-sm md:text-base"
              >
                <Printer size={18} />
                Save
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto p-4 md:p-8">
        
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-r shadow-sm">
            <p className="font-bold">Magic Spell Failed!</p>
            <p>{error}</p>
          </div>
        )}

        {panels.length === 0 && !loading && !error && (
          <div className="text-center py-10 md:py-20 px-4">
            <div className="bg-white rounded-3xl p-6 md:p-10 shadow-xl inline-block border-4 border-dashed border-indigo-200 max-w-lg w-full">
               <Pencil size={64} className="text-indigo-300 mx-auto mb-4" />
               <h2 className="text-2xl font-bold text-slate-700 mb-2">Ready to create?</h2>
               <p className="text-slate-500 mb-6">
                 Click "Generate" to conjure a 4-panel magical adventure. 
                 Then, use your artistic skills to draw the scenes!
               </p>
               <button 
                  onClick={handleGenerateStory}
                  className="w-full md:w-auto bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition active:scale-95"
                >
                  Start Magic
               </button>
            </div>
          </div>
        )}
        
        {loading && (
          <div className="flex flex-col items-center justify-center py-32 text-indigo-800">
            <Loader2 className="w-16 h-16 animate-spin mb-4 text-indigo-500" />
            <p className="text-xl font-hand animate-pulse">Conjuring a new adventure...</p>
          </div>
        )}

        {/* Comic Grid */}
        {panels.length > 0 && (
          <>
             {/* Scrolling Hint for Mobile */}
             <div className="md:hidden text-center text-slate-400 text-sm mb-4 animate-pulse">
                Use the edges to scroll • Tap panel to draw
             </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-8 px-2 md:px-0">
                {panels.map((panel, index) => (
                <div 
                    key={panel.id} 
                    className={`flex flex-col group transition-all duration-200 ${activePanelId === panel.id ? 'ring-4 ring-indigo-400 ring-offset-4 rounded-lg shadow-2xl z-10' : 'hover:shadow-lg opacity-90 hover:opacity-100'}`}
                    onClick={() => setActivePanelId(panel.id)}
                >
                    {/* Panel Header/Number */}
                    <div className={`flex justify-between items-center text-xs font-bold px-3 py-2 rounded-t-lg shadow-sm z-10 mx-2 transition-colors ${activePanelId === panel.id ? 'bg-indigo-600 text-white translate-y-1' : 'bg-slate-200 text-slate-600 translate-y-1'}`}>
                        <span>Panel {index + 1}</span>
                        {activePanelId === panel.id && <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider">Active</span>}
                    </div>
                    
                    {/* Drawing Area */}
                    <div className="relative border-4 border-indigo-900 bg-white shadow-xl rounded-lg overflow-hidden touch-none">
                        <div className="aspect-square w-full">
                            <DrawingCanvas
                                ref={(el) => (canvasRefs.current[index] = el)}
                                tool={currentTool}
                                width={400}
                                height={400}
                                className="w-full h-full"
                                onInteract={() => setActivePanelId(panel.id)}
                            />
                        </div>
                    </div>

                    {/* Story Description */}
                    <div className="mt-4 bg-white p-4 rounded-xl shadow-md border border-indigo-100 relative mx-1">
                        <div className="absolute -top-3 left-6 w-6 h-6 bg-white transform rotate-45 border-t border-l border-indigo-100"></div>
                        <p className="text-lg text-indigo-900 font-hand leading-relaxed">
                            {panel.text}
                        </p>
                        <div className="mt-2 pt-2 border-t border-slate-100">
                            <p className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">Scene Guide:</p>
                            <p className="text-sm text-slate-500 italic">
                            {panel.sceneDescription}
                            </p>
                        </div>
                    </div>
                </div>
                ))}
            </div>
          </>
        )}
      </main>

      {/* Toolbar */}
      {panels.length > 0 && (
        <Toolbar 
          currentTool={currentTool} 
          setTool={setCurrentTool} 
          onClear={handleClearActive}
          onClearAll={handleClearAll}
          onUndo={handleUndo}
          onRedo={handleRedo}
          hasActivePanel={activePanelId !== null}
        />
      )}
    </div>
  );
};

export default App;