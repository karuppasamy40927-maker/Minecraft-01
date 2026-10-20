import React, { useState, useEffect } from 'react';
import { DiamondVein } from '../types/minecraft';
import { Sparkles, MapPin, Copy, Check, Info, AlertCircle, X } from 'lucide-react';

interface DiamondScannerProps {
  diamondVeins: DiamondVein[];
  onSelectVein: (vein: DiamondVein) => void;
  onClose: () => void;
}

export const DiamondScanner: React.FC<DiamondScannerProps> = ({
  diamondVeins,
  onSelectVein,
  onClose,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copyError, setCopyError] = useState(false);
  const [filterMinSize, setFilterMinSize] = useState<number>(2);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const filteredVeins = diamondVeins.filter((v) => v.size >= filterMinSize);
  const totalDiamonds = filteredVeins.reduce((acc, v) => acc + v.size, 0);

  const handleCopy = async (vein: DiamondVein) => {
    try {
      await navigator.clipboard.writeText(`/tp @s ${vein.x} ${vein.y} ${vein.z}`);
      setCopiedId(vein.id);
      setCopyError(false);
      setTimeout(() => setCopiedId(null), 1800);
    } catch {
      setCopyError(true);
      setTimeout(() => setCopyError(false), 2000);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="diamond-scanner-title"
    >
      <div className="w-full max-w-2xl bg-[#121520] border border-cyan-500/40 rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-zinc-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-3.5 sm:p-4 border-b border-white/10 flex items-center justify-between bg-[#111c28]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/20 rounded-lg border border-cyan-500/40 text-cyan-400">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 id="diamond-scanner-title" className="font-pixel text-xs sm:text-sm text-cyan-300 tracking-wide flex items-center gap-2 flex-wrap">
                PROCEDURAL DIAMOND LOCATOR
                <span className="text-[9px] font-sans px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                  Deepslate Y=-58 Layer
                </span>
              </h2>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Representative simulation of deepslate diamond ore clusters near spawn.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition"
            aria-label="Close Diamond Locator"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Procedural Disclaimer Notice */}
        <div className="px-4 py-2.5 bg-amber-950/40 border-b border-amber-500/30 flex items-start gap-2 text-[11px] text-amber-200">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span>
            <strong>Simulation Notice:</strong> Diamond locations are generated using standard Bedrock 1.20+ ore distribution rules (peak frequency at Y=-58). This is a procedural locator tool and not a real-time game file scanner.
          </span>
        </div>

        {/* Stats & Filters */}
        <div className="p-3.5 bg-[#0e111a] border-b border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-400">Clusters:</span>
              <span className="font-mono-code font-bold text-cyan-300">{filteredVeins.length}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-400">Estimated Ores:</span>
              <span className="font-mono-code font-bold text-emerald-400">{totalDiamonds} diamonds</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-zinc-400 text-[11px]">Min Vein Size:</label>
            <select
              value={filterMinSize}
              onChange={(e) => setFilterMinSize(Number(e.target.value))}
              className="bg-[#181c28] border border-white/10 rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-cyan-500"
              aria-label="Minimum Vein Size"
            >
              <option value={2}>All Veins (2+)</option>
              <option value={4}>Medium+ (4+)</option>
              <option value={6}>Large Veins (6+)</option>
            </select>
          </div>
        </div>

        {/* Veins List */}
        <div className="p-3 sm:p-4 overflow-y-auto space-y-2 flex-1">
          {filteredVeins.map((vein) => (
            <div
              key={vein.id}
              className="p-3 rounded-lg bg-[#151926] hover:bg-[#1a2030] border border-white/5 hover:border-cyan-500/40 flex items-center justify-between gap-3 transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex flex-col items-center justify-center text-cyan-300 font-pixel text-xs shrink-0">
                  <span>{vein.size}x</span>
                  <span className="text-[8px] text-cyan-400/80">ORE</span>
                </div>
                <div>
                  <div className="font-mono-code font-bold text-xs sm:text-sm text-white flex items-center gap-2 flex-wrap">
                    <span>X: {vein.x}, Y: {vein.y}, Z: {vein.z}</span>
                    {vein.exposed && (
                      <span className="text-[9px] font-sans px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Cave Exposed
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-0.5 flex items-center gap-2 flex-wrap">
                    <span>Chunk: ({vein.chunkX}, {vein.chunkZ})</span>
                    <span>•</span>
                    <span>Distance: {vein.distance} blocks</span>
                  </div>
                  {vein.surroundNote && (
                    <div className="text-[10px] text-zinc-500 mt-0.5 italic">
                      {vein.surroundNote}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => onSelectVein(vein)}
                  className="px-2.5 py-1.5 bg-[#212738] hover:bg-cyan-600 hover:text-white text-zinc-200 rounded text-xs font-semibold flex items-center gap-1 transition"
                  aria-label={`Locate vein at ${vein.x}, ${vein.y}, ${vein.z}`}
                >
                  <MapPin className="w-3.5 h-3.5" /> Locate
                </button>
                <button
                  onClick={() => handleCopy(vein)}
                  className="p-1.5 bg-[#212738] hover:bg-white/10 text-zinc-300 rounded text-xs transition"
                  title="Copy teleport command"
                  aria-label="Copy teleport command"
                >
                  {copiedId === vein.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-white/10 bg-[#121520] flex items-center justify-between">
          <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-cyan-400" />
            <span>Optimal Bedrock strip mining layer: Y=-58</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-black font-pixel text-xs rounded transition"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
