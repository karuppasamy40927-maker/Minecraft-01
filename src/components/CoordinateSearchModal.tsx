import React, { useState, useEffect, useMemo } from 'react';
import { Dimension, Structure } from '../types/minecraft';
import { WorldGenerator } from '../utils/seedGenerator';
import { 
  Crosshair, 
  Globe2, 
  Flame, 
  Sparkles, 
  ArrowRightLeft, 
  MapPin, 
  Navigation, 
  Copy, 
  Check, 
  X, 
  ExternalLink,
  Compass,
  AlertCircle
} from 'lucide-react';

interface CoordinateSearchModalProps {
  generator: WorldGenerator;
  currentDimension: Dimension;
  onNavigateToCoords: (coords: { x: number; z: number; dimension: Dimension }) => void;
  onAddWaypoint: (coords: { x: number; z: number; dimension: Dimension }) => void;
  onPlotRoute?: (coords: { x: number; z: number; dimension: Dimension; name: string }) => void;
  onClose: () => void;
}

export const CoordinateSearchModal: React.FC<CoordinateSearchModalProps> = ({
  generator,
  currentDimension,
  onNavigateToCoords,
  onAddWaypoint,
  onPlotRoute,
  onClose,
}) => {
  const [activeDimension, setActiveDimension] = useState<Dimension>(
    currentDimension === 'the_end' ? 'overworld' : currentDimension
  );

  const [rawInput, setRawInput] = useState('');
  const [coordX, setCoordX] = useState<number>(0);
  const [coordY, setCoordY] = useState<number>(68);
  const [coordZ, setCoordZ] = useState<number>(0);

  const [copiedType, setCopiedType] = useState<string | null>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Parse raw coordinate input or teleport commands
  const parseCoordinates = (text: string) => {
    setRawInput(text);
    if (!text.trim()) return;

    // Pattern for /tp @s X Y Z or /tp X Y Z or X, Z or X Z
    const tpMatch = text.match(/\/tp(?:\s+@\w+)?\s+(-?\d+)(?:\s+(?:~|-?\d+))?\s+(-?\d+)/i);
    if (tpMatch) {
      const parsedX = parseInt(tpMatch[1], 10);
      const parsedZ = parseInt(tpMatch[2], 10);
      if (!isNaN(parsedX) && !isNaN(parsedZ)) {
        setCoordX(parsedX);
        setCoordZ(parsedZ);
        return;
      }
    }

    // Pattern for "X, Z" or "X Z" or "X, Y, Z"
    const numbers = text.match(/-?\d+/g);
    if (numbers && numbers.length >= 2) {
      if (numbers.length >= 3 && !text.includes(',')) {
        // likely X Y Z
        setCoordX(parseInt(numbers[0], 10));
        setCoordY(parseInt(numbers[1], 10));
        setCoordZ(parseInt(numbers[2], 10));
      } else {
        // likely X, Z
        setCoordX(parseInt(numbers[0], 10));
        setCoordZ(parseInt(numbers[1], 10));
      }
    }
  };

  // Dual-world conversions:
  // Overworld (X, Z) <-> Nether (X/8, Z/8)
  const dualWorldInfo = useMemo(() => {
    let overworldX: number;
    let overworldZ: number;
    let netherX: number;
    let netherZ: number;

    if (activeDimension === 'nether') {
      netherX = coordX;
      netherZ = coordZ;
      overworldX = coordX * 8;
      overworldZ = coordZ * 8;
    } else {
      overworldX = coordX;
      overworldZ = coordZ;
      netherX = Math.round(coordX / 8);
      netherZ = Math.round(coordZ / 8);
    }

    // Query biomes in both worlds
    const overworldBiome = generator.getBiome(overworldX, overworldZ, 'overworld');
    const netherBiome = generator.getBiome(netherX, netherZ, 'nether');

    const distFromOverworldSpawn = Math.round(Math.hypot(overworldX, overworldZ));
    const distFromNetherSpawn = Math.round(Math.hypot(netherX, netherZ));

    return {
      overworld: {
        x: overworldX,
        z: overworldZ,
        biome: overworldBiome?.name || 'Plains',
        color: overworldBiome?.color || '#8ab644',
        category: overworldBiome?.category || 'Temperate',
        distFromSpawn: distFromOverworldSpawn,
      },
      nether: {
        x: netherX,
        z: netherZ,
        biome: netherBiome?.name || 'Nether Wastes',
        color: netherBiome?.color || '#991515',
        category: netherBiome?.category || 'Nether',
        distFromSpawn: distFromNetherSpawn,
      },
    };
  }, [activeDimension, coordX, coordZ, generator]);

  const handleCopyCommand = async (x: number, y: number, z: number, label: string) => {
    try {
      await navigator.clipboard.writeText(`/tp @s ${x} ${y} ${z}`);
      setCopiedType(label);
      setTimeout(() => setCopiedType(null), 2000);
    } catch {
      // ignore
    }
  };

  const handleJumpToOverworld = () => {
    onNavigateToCoords({
      x: dualWorldInfo.overworld.x,
      z: dualWorldInfo.overworld.z,
      dimension: 'overworld',
    });
    onClose();
  };

  const handleJumpToNether = () => {
    onNavigateToCoords({
      x: dualWorldInfo.nether.x,
      z: dualWorldInfo.nether.z,
      dimension: 'nether',
    });
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="coord-search-title"
    >
      <div className="w-full max-w-xl bg-[#121520] border border-cyan-500/40 rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-zinc-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-3.5 sm:p-4 border-b border-white/10 flex items-center justify-between bg-[#171b29]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/20 rounded-lg border border-cyan-500/40 text-cyan-400">
              <Crosshair className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 id="coord-search-title" className="font-pixel text-xs sm:text-sm text-white tracking-wide">
                COORDINATES SEARCH & DUAL-WORLD LINK
              </h2>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Jump to any coordinate with instant 8:1 Overworld ↔ Nether portal translation.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition"
            aria-label="Close Coordinates Search"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-4">
          {/* Dimension Selector Tabs */}
          <div>
            <label className="block text-[11px] font-pixel text-cyan-400 mb-1.5">
              SEARCHING COORDINATES IN WORLD:
            </label>
            <div className="grid grid-cols-2 gap-2 bg-[#161a27] p-1 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => setActiveDimension('overworld')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition ${
                  activeDimension === 'overworld'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Globe2 className="w-4 h-4" />
                <span>Overworld (Surface)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveDimension('nether')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition ${
                  activeDimension === 'nether'
                    ? 'bg-rose-700 text-white shadow-md'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Flame className="w-4 h-4" />
                <span>The Nether (1:8 Scale)</span>
              </button>
            </div>
          </div>

          {/* Quick Paste / Smart Parse Bar */}
          <div>
            <label className="block text-[10px] font-mono-code text-zinc-400 mb-1">
              Quick Paste / Command Parse (e.g. &quot;1250, -450&quot; or &quot;/tp @s 100 64 200&quot;):
            </label>
            <input
              type="text"
              placeholder="Paste in-game coordinates or teleport command..."
              value={rawInput}
              onChange={(e) => parseCoordinates(e.target.value)}
              className="w-full bg-[#161a27] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono-code placeholder-zinc-500"
            />
          </div>

          {/* Coordinate Inputs (X, Y, Z) */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[10px] font-mono-code text-cyan-300 font-semibold mb-1">
                X Coordinate
              </label>
              <input
                type="number"
                value={coordX}
                onChange={(e) => setCoordX(Number(e.target.value))}
                className="w-full bg-[#161a27] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono-code focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono-code text-zinc-400 mb-1">
                Y (Height Level)
              </label>
              <input
                type="number"
                value={coordY}
                onChange={(e) => setCoordY(Number(e.target.value))}
                className="w-full bg-[#161a27] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono-code focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono-code text-cyan-300 font-semibold mb-1">
                Z Coordinate
              </label>
              <input
                type="number"
                value={coordZ}
                onChange={(e) => setCoordZ(Number(e.target.value))}
                className="w-full bg-[#161a27] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono-code focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Dual-World Live Calculation Cards */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between text-[11px] text-zinc-400 border-b border-white/10 pb-1">
              <span className="font-pixel text-[10px] text-amber-400">
                DUAL-WORLD TELEPORTATION & PORTAL TRANSLATION
              </span>
              <div className="flex items-center gap-1 text-[10px] text-zinc-400">
                <ArrowRightLeft className="w-3 h-3 text-cyan-400" />
                <span>Ratio 1:8</span>
              </div>
            </div>

            {/* Overworld Card */}
            <div className={`p-3.5 rounded-xl border transition-all ${
              activeDimension === 'overworld'
                ? 'bg-emerald-950/30 border-emerald-500/50 shadow-lg'
                : 'bg-[#151926] border-white/10'
            }`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: dualWorldInfo.overworld.color }}
                    />
                    <h3 className="font-bold text-xs text-white flex items-center gap-1.5">
                      <span>Overworld Coordinates</span>
                      {activeDimension === 'overworld' && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/30 text-emerald-300 border border-emerald-400/40">
                          Active Target
                        </span>
                      )}
                    </h3>
                  </div>

                  <div className="font-mono-code font-bold text-sm text-emerald-400 mt-1">
                    X: {dualWorldInfo.overworld.x} &nbsp;|&nbsp; Z: {dualWorldInfo.overworld.z}
                  </div>

                  <div className="text-[11px] text-zinc-400 mt-1 flex items-center gap-2 flex-wrap">
                    <span>Biome:</span>
                    <span className="text-emerald-300 font-semibold">{dualWorldInfo.overworld.biome}</span>
                    <span>•</span>
                    <span>Dist from (0,0): {dualWorldInfo.overworld.distFromSpawn} blocks</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 shrink-0">
                  <button
                    onClick={handleJumpToOverworld}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 shadow"
                  >
                    <Crosshair className="w-3.5 h-3.5" />
                    <span>Jump Here</span>
                  </button>
                  <button
                    onClick={() => handleCopyCommand(dualWorldInfo.overworld.x, coordY, dualWorldInfo.overworld.z, 'overworld')}
                    className="px-2.5 py-1 bg-black/40 hover:bg-white/10 border border-white/10 text-zinc-300 rounded text-[10px] font-mono-code flex items-center gap-1 transition"
                    title="Copy /tp command"
                  >
                    {copiedType === 'overworld' ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>/tp Command</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Nether Card */}
            <div className={`p-3.5 rounded-xl border transition-all ${
              activeDimension === 'nether'
                ? 'bg-rose-950/30 border-rose-500/50 shadow-lg'
                : 'bg-[#151926] border-white/10'
            }`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: dualWorldInfo.nether.color }}
                    />
                    <h3 className="font-bold text-xs text-white flex items-center gap-1.5">
                      <span>Nether Portal Location</span>
                      {activeDimension === 'nether' ? (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-500/30 text-rose-300 border border-rose-400/40">
                          Active Target
                        </span>
                      ) : (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-900/60 text-purple-300 border border-purple-500/30">
                          Linked Portal
                        </span>
                      )}
                    </h3>
                  </div>

                  <div className="font-mono-code font-bold text-sm text-rose-400 mt-1">
                    X: {dualWorldInfo.nether.x} &nbsp;|&nbsp; Z: {dualWorldInfo.nether.z}
                  </div>

                  <div className="text-[11px] text-zinc-400 mt-1 flex items-center gap-2 flex-wrap">
                    <span>Nether Biome:</span>
                    <span className="text-rose-300 font-semibold">{dualWorldInfo.nether.biome}</span>
                    <span>•</span>
                    <span>Dist in Nether: {dualWorldInfo.nether.distFromSpawn} blocks</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 shrink-0">
                  <button
                    onClick={handleJumpToNether}
                    className="px-3 py-1.5 bg-rose-700 hover:bg-rose-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 shadow"
                  >
                    <Flame className="w-3.5 h-3.5" />
                    <span>Jump to Nether</span>
                  </button>
                  <button
                    onClick={() => handleCopyCommand(dualWorldInfo.nether.x, 68, dualWorldInfo.nether.z, 'nether')}
                    className="px-2.5 py-1 bg-black/40 hover:bg-white/10 border border-white/10 text-zinc-300 rounded text-[10px] font-mono-code flex items-center gap-1 transition"
                    title="Copy Nether /tp command"
                  >
                    {copiedType === 'nether' ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>/tp Command</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Action Links: Add Waypoint & Route */}
          <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const targetCoords = activeDimension === 'nether'
                    ? { x: dualWorldInfo.nether.x, z: dualWorldInfo.nether.z, dimension: 'nether' as Dimension }
                    : { x: dualWorldInfo.overworld.x, z: dualWorldInfo.overworld.z, dimension: 'overworld' as Dimension };
                  onAddWaypoint(targetCoords);
                  onClose();
                }}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Save as Custom Waypoint</span>
              </button>

              {onPlotRoute && (
                <button
                  type="button"
                  onClick={() => {
                    const targetCoords = activeDimension === 'nether'
                      ? { x: dualWorldInfo.nether.x, z: dualWorldInfo.nether.z, dimension: 'nether' as Dimension, name: `Nether Point (${dualWorldInfo.nether.x}, ${dualWorldInfo.nether.z})` }
                      : { x: dualWorldInfo.overworld.x, z: dualWorldInfo.overworld.z, dimension: 'overworld' as Dimension, name: `Overworld Point (${dualWorldInfo.overworld.x}, ${dualWorldInfo.overworld.z})` };
                    onPlotRoute(targetCoords);
                    onClose();
                  }}
                  className="px-3 py-1.5 bg-[#1f2538] hover:bg-[#2b334d] text-emerald-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition border border-white/10"
                >
                  <Navigation className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Plot Route</span>
                </button>
              )}
            </div>

            <button
              onClick={onClose}
              className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold rounded-lg transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
