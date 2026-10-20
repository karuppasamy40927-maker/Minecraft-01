import React, { useEffect } from 'react';
import { Keyboard, X, Search, Compass, MapPin, Sparkles, Navigation, Download, Globe2, Flame, Palette, Crosshair } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ onClose }) => {
  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const shortcuts = [
    { key: 'S', desc: 'Focus Structure Search bar', icon: Search, color: 'text-emerald-400' },
    { key: 'C', desc: 'Coordinate Search & Dual-World Link', icon: Crosshair, color: 'text-cyan-400' },
    { key: 'M', desc: 'Center & Focus Map on Spawn', icon: Compass, color: 'text-amber-400' },
    { key: 'B', desc: 'Toggle Biome Heatmap & Thermal Legend', icon: Palette, color: 'text-amber-300' },
    { key: 'W', desc: 'Open Custom Waypoint Manager', icon: MapPin, color: 'text-purple-400' },
    { key: 'D', desc: 'Open Procedural Diamond Locator', icon: Sparkles, color: 'text-cyan-400' },
    { key: 'R', desc: 'Open Expedition Route Pathfinder', icon: Navigation, color: 'text-emerald-400' },
    { key: 'E', desc: 'Open Export Findings Dialog', icon: Download, color: 'text-zinc-200' },
    { key: '1 / 2 / 3', desc: 'Switch Dimension (Overworld / Nether / End)', icon: Globe2, color: 'text-blue-400' },
    { key: '+ / -', desc: 'Zoom In / Out on Map', icon: Compass, color: 'text-zinc-300' },
    { key: 'WASD / Arrows', desc: 'Pan Camera across map', icon: Compass, color: 'text-zinc-300' },
    { key: 'ESC', desc: 'Close open dialogs / Deselect', icon: X, color: 'text-rose-400' },
  ];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-modal-title"
    >
      <div className="w-full max-w-lg bg-[#121520] border border-emerald-500/40 rounded-xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden text-zinc-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-3.5 sm:p-4 border-b border-white/10 flex items-center justify-between bg-[#161a27]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-lg border border-emerald-500/40 text-emerald-400">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h2 id="shortcuts-modal-title" className="font-pixel text-xs sm:text-sm text-white tracking-wide">
                KEYBOARD SHORTCUTS
              </h2>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Quickly navigate tools and controls from anywhere.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition"
            aria-label="Close Shortcuts Dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="p-4 overflow-y-auto space-y-2 flex-1">
          {shortcuts.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div
                key={idx}
                className="p-2.5 bg-[#161a27] rounded-lg border border-white/5 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${s.color} shrink-0`} />
                  <span className="text-zinc-300">{s.desc}</span>
                </div>
                <kbd className="px-2 py-1 bg-[#222838] border border-white/15 rounded text-[11px] font-mono-code font-bold text-amber-300 shadow-sm shrink-0">
                  {s.key}
                </kbd>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-white/10 bg-[#121520] flex items-center justify-between text-xs text-zinc-400">
          <span>Press <kbd className="px-1.5 py-0.5 bg-[#1e2333] rounded text-white font-mono-code">?</kbd> to toggle this guide</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-pixel text-xs rounded transition"
          >
            GOT IT
          </button>
        </div>
      </div>
    </div>
  );
};
