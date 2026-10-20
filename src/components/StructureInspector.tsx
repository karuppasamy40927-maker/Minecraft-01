import React, { useState } from 'react';
import { Structure } from '../types/minecraft';
import { 
  Navigation, 
  MapPin, 
  Flame, 
  Copy, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  AlertCircle,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';

interface StructureInspectorProps {
  structure: Structure | null;
  onSetRouteToStructure: (structure: Structure) => void;
  onAddAsWaypoint: (structure: Structure) => void;
  onClose: () => void;
}

export const StructureInspector: React.FC<StructureInspectorProps> = ({
  structure,
  onSetRouteToStructure,
  onAddAsWaypoint,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const [isLootOpen, setIsLootOpen] = useState(true);

  if (!structure) return null;

  const handleCopyTp = async () => {
    try {
      await navigator.clipboard.writeText(`/tp @s ${structure.x} ${structure.y} ${structure.z}`);
      setCopied(true);
      setCopyError(false);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopyError(true);
      setTimeout(() => setCopyError(false), 2500);
    }
  };

  const distFromSpawn = Math.round(Math.hypot(structure.x, structure.z));

  return (
    <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 w-[calc(100vw-24px)] sm:w-88 md:w-96 bg-[#121520]/95 border border-[#2b3347] rounded-xl shadow-2xl p-4 text-zinc-200 backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-150 max-h-[85vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 pb-3 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: structure.color }}
            />
            <h3 className="font-pixel text-xs text-white leading-tight">
              {structure.name}
            </h3>
          </div>
          <div className="text-[11px] text-zinc-400 mt-1 flex items-center gap-2">
            <span className="capitalize">{structure.dimension.replace('_', ' ')}</span>
            <span>•</span>
            <span className="text-emerald-400">{structure.biome}</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-zinc-400 hover:text-white p-1 rounded hover:bg-white/10 transition"
          aria-label="Close Inspector"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Verification Status Badge */}
      <div className="mt-2.5 flex items-center gap-2">
        {structure.status === 'verified' ? (
          <div className="px-2 py-1 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 text-[10px] flex items-center gap-1.5 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>VERIFIED MINECRAFT LOCATION</span>
          </div>
        ) : (
          <div className="px-2 py-1 rounded bg-amber-950/80 text-amber-300 border border-amber-500/40 text-[10px] flex items-center gap-1.5 font-semibold">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>PROCEDURAL ESTIMATE (1.20+ rules)</span>
          </div>
        )}
      </div>

      {/* Main Coordinate Box */}
      <div className="my-3 p-2.5 bg-black/40 rounded-lg border border-white/5 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono-code text-zinc-400">COORDINATES:</span>
          <div className="font-mono-code font-bold text-sm text-cyan-300">
            X: {structure.x} | Y: {structure.y} | Z: {structure.z}
          </div>
        </div>
        <button
          onClick={handleCopyTp}
          title="Copy /tp command"
          aria-label="Copy Teleport Command"
          className="p-2 bg-[#212638] hover:bg-[#2d344d] text-zinc-200 rounded transition"
        >
          {copied ? (
            <Check className="w-4 h-4 text-emerald-400" />
          ) : copyError ? (
            <span className="text-[10px] text-rose-400">Failed</span>
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Distance and Description */}
      <div className="text-xs text-zinc-300 mb-3 space-y-1.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-zinc-400">Distance from Spawn:</span>
          <span className="font-mono-code font-bold text-white">{distFromSpawn} blocks</span>
        </div>
        <p className="text-[11px] text-zinc-400 leading-relaxed bg-[#161a27] p-2 rounded border border-white/5">
          {structure.description}
        </p>
      </div>

      {/* Collapsible Key Loot Section */}
      {structure.keyLoot && structure.keyLoot.length > 0 && (
        <div className="mb-3 border border-white/5 rounded-lg overflow-hidden">
          <button
            onClick={() => setIsLootOpen(!isLootOpen)}
            className="w-full px-2.5 py-1.5 bg-[#161a27] flex items-center justify-between text-[10px] font-pixel text-amber-400 uppercase"
          >
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Key Resources & Loot
            </span>
            {isLootOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          {isLootOpen && (
            <div className="p-2 bg-[#10131e] flex flex-wrap gap-1">
              {structure.keyLoot.map((loot, i) => (
                <span
                  key={i}
                  className="text-[10px] bg-[#1a1e2c] border border-amber-500/20 text-zinc-200 px-2 py-0.5 rounded"
                >
                  {loot}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Nether Travel Shortcut Info */}
      {structure.netherEquivalent && (
        <div className="mb-3 p-2.5 bg-purple-950/40 border border-purple-500/30 rounded-lg text-[11px] font-mono-code text-purple-200 flex items-center gap-2">
          <Flame className="w-4 h-4 text-purple-400 shrink-0" />
          <div>
            <div className="font-semibold text-purple-300 text-[10px]">Nether Travel Portal:</div>
            <div>X: {structure.netherEquivalent.x} | Y: {structure.netherEquivalent.y} | Z: {structure.netherEquivalent.z}</div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/10">
        <button
          onClick={() => onSetRouteToStructure(structure)}
          className="py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95 shadow-md"
        >
          <Navigation className="w-3.5 h-3.5" /> Plot Route
        </button>
        <button
          onClick={() => onAddAsWaypoint(structure)}
          className="py-2 px-3 bg-[#212638] hover:bg-[#2d344d] text-white rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition"
        >
          <MapPin className="w-3.5 h-3.5 text-purple-400" /> Save Waypoint
        </button>
      </div>
    </div>
  );
};
