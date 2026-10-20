import React, { useState, useEffect, useRef } from 'react';
import { Dimension, SeedPreset } from '../types/minecraft';
import { PRESET_SEEDS } from '../utils/seedGenerator';
import { 
  Sparkles, 
  Navigation, 
  MapPin, 
  Download, 
  Globe2, 
  Flame, 
  RefreshCw, 
  Dices, 
  ChevronDown, 
  Menu, 
  X, 
  ShieldCheck, 
  Compass, 
  Keyboard,
  Crosshair
} from 'lucide-react';

interface TopNavProps {
  currentSeed: string;
  onSeedChange: (newSeed: string) => void;
  dimension: Dimension;
  onDimensionChange: (dim: Dimension) => void;
  onOpenPathfinder: () => void;
  onOpenDiamondScanner: () => void;
  onOpenWaypoints: () => void;
  onOpenCoordSearch?: () => void;
  onOpenBlueprints?: () => void;
  onOpenExport: () => void;
  onOpenShortcuts?: () => void;
  diamondCount: number;
}

export const TopNav: React.FC<TopNavProps> = ({
  currentSeed,
  onSeedChange,
  dimension,
  onDimensionChange,
  onOpenPathfinder,
  onOpenDiamondScanner,
  onOpenWaypoints,
  onOpenCoordSearch,
  onOpenBlueprints,
  onOpenExport,
  onOpenShortcuts,
  diamondCount,
}) => {
  const [inputVal, setInputVal] = useState(currentSeed);
  const [isPresetOpen, setIsPresetOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const presetDropdownRef = useRef<HTMLDivElement | null>(null);

  // Sync input value if currentSeed changes externally
  useEffect(() => {
    setInputVal(currentSeed);
  }, [currentSeed]);

  // Close preset dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (presetDropdownRef.current && !presetDropdownRef.current.contains(e.target as Node)) {
        setIsPresetOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSeedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputVal.trim()) {
      onSeedChange(inputVal.trim());
      setIsPresetOpen(false);
    }
  };

  const handleSelectPreset = (p: SeedPreset) => {
    setInputVal(p.seed);
    onSeedChange(p.seed);
    setIsPresetOpen(false);
  };

  const handleGenerateRandom = () => {
    const randomSeed = Math.floor(Math.random() * 2000000000) - 1000000000;
    const seedStr = randomSeed.toString();
    setInputVal(seedStr);
    onSeedChange(seedStr);
    setIsPresetOpen(false);
  };

  return (
    <header className="h-14 bg-[#050505] border-b border-[#00f5ff]/30 px-3 sm:px-4 flex items-center justify-between gap-2 text-white z-30 select-none shadow-[0_0_15px_rgba(0,0,0,0.5)]">
      {/* Brand & Logo */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-emerald-600 border border-emerald-400 flex items-center justify-center font-pixel text-xs text-white shadow-md">
          MC
        </div>
        <div className="hidden sm:block">
          <div className="flex items-center gap-1.5">
            <h1 className="font-pixel text-xs tracking-wider text-white">
              BEDROCK SEED MAP
            </h1>
            <span className="text-[9px] font-mono-code px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30">
              1.20+
            </span>
          </div>
          <div className="text-[10px] text-zinc-400 font-mono-code">
            Interactive Navigator
          </div>
        </div>
      </div>

      {/* Center: Seed Input & Presets */}
      <div className="relative flex-1 max-w-md mx-1 sm:mx-2" ref={presetDropdownRef}>
        <form onSubmit={handleSeedSubmit} className="flex items-center w-full">
          <div className="flex items-center w-full bg-[#151824] border border-white/15 rounded-lg px-2.5 py-1 focus-within:border-emerald-500 shadow-inner">
            <span className="text-[10px] font-pixel text-amber-400 mr-1.5 hidden md:inline">
              SEED:
            </span>
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Enter seed..."
              className="flex-1 min-w-0 bg-transparent text-xs font-mono-code text-white focus:outline-none placeholder-zinc-500"
              aria-label="Minecraft World Seed"
            />
            <button
              type="submit"
              title="Apply Seed"
              className="ml-1 p-1 text-zinc-400 hover:text-emerald-400 transition"
              aria-label="Generate Seed"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleGenerateRandom}
              title="Generate Random Seed"
              className="ml-1 p-1 text-zinc-400 hover:text-amber-400 transition"
              aria-label="Random Seed"
            >
              <Dices className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setIsPresetOpen(!isPresetOpen)}
              className="ml-1 text-[10px] bg-[#222838] hover:bg-[#2c344a] px-2 py-0.5 rounded text-zinc-300 font-pixel transition flex items-center gap-1"
              aria-expanded={isPresetOpen}
              aria-label="Select Preset Seeds"
            >
              <span>PRESETS</span>
              <ChevronDown className="w-2.5 h-2.5" />
            </button>
          </div>
        </form>

        {/* Preset Worlds Dropdown */}
        {isPresetOpen && (
          <div className="absolute top-11 left-0 w-full sm:w-88 bg-[#141724] border border-[#2b3347] rounded-xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
            <div className="text-[10px] font-pixel text-zinc-400 px-2 py-1 uppercase border-b border-white/10 mb-1 flex items-center justify-between">
              <span>Verified Bedrock 1.20+ Presets</span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="space-y-1">
              {PRESET_SEEDS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSelectPreset(p)}
                  className={`w-full text-left p-2 rounded-lg transition flex flex-col gap-0.5 ${
                    currentSeed === p.seed
                      ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-200'
                      : 'hover:bg-white/5 text-zinc-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold text-white">
                    <span>{p.name}</span>
                    <span className="text-[10px] font-mono-code text-amber-400">
                      {p.seed}
                    </span>
                  </div>
                  <div className="text-[10px] text-zinc-400 line-clamp-1">
                    {p.tagline}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right Controls: Dimension Selector (Desktop) */}
      <div className="hidden lg:flex items-center bg-[#151824] p-1 rounded-lg border border-white/10">
        <button
          onClick={() => onDimensionChange('overworld')}
          title="Switch to Overworld [1]"
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold transition ${
            dimension === 'overworld'
              ? 'bg-emerald-600 text-white shadow'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Globe2 className="w-3.5 h-3.5" />
          <span>Overworld</span>
          <span className="text-[9px] opacity-60 font-mono-code">[1]</span>
        </button>
        <button
          onClick={() => onDimensionChange('nether')}
          title="Switch to Nether [2]"
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold transition ${
            dimension === 'nether'
              ? 'bg-rose-700 text-white shadow'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          <span>Nether</span>
          <span className="text-[9px] opacity-60 font-mono-code">[2]</span>
        </button>
        <button
          onClick={() => onDimensionChange('the_end')}
          title="Switch to The End [3]"
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold transition ${
            dimension === 'the_end'
              ? 'bg-purple-700 text-white shadow'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>The End</span>
          <span className="text-[9px] opacity-60 font-mono-code">[3]</span>
        </button>
      </div>

      {/* Quick Action Buttons (Desktop) */}
      <div className="hidden md:flex items-center gap-1.5">
        <button
          onClick={onOpenDiamondScanner}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-cyan-950/50 hover:bg-cyan-900/70 border border-cyan-500/40 text-cyan-300 rounded-lg text-xs font-semibold shadow-sm transition active:scale-95"
          title="Procedural Diamond Locator [D]"
          aria-label="Diamond Locator (Hot-key: D)"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Diamonds</span>
          <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-[10px] font-mono-code font-bold">
            {diamondCount}
          </span>
          <span className="text-[9px] text-cyan-400/60 font-mono-code font-bold">[D]</span>
        </button>

        <button
          onClick={onOpenPathfinder}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#1a1e2c] hover:bg-[#23293c] border border-white/10 text-emerald-300 rounded-lg text-xs font-semibold transition active:scale-95"
          title="Route & Nether Highway Pathfinder [R]"
          aria-label="Route Pathfinder (Hot-key: R)"
        >
          <Navigation className="w-3.5 h-3.5 text-emerald-400" />
          <span>Route</span>
          <span className="text-[9px] text-emerald-400/60 font-mono-code font-bold">[R]</span>
        </button>

        <button
          onClick={onOpenWaypoints}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#1a1e2c] hover:bg-[#23293c] border border-white/10 text-purple-300 rounded-lg text-xs font-semibold transition active:scale-95"
          title="Manage Custom Waypoints [W]"
          aria-label="Waypoints (Hot-key: W)"
        >
          <MapPin className="w-3.5 h-3.5 text-purple-400" />
          <span>Waypoints</span>
          <span className="text-[9px] text-purple-400/60 font-mono-code font-bold">[W]</span>
        </button>

        {onOpenCoordSearch && (
          <button
            onClick={onOpenCoordSearch}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/40 text-cyan-300 rounded-lg text-xs font-semibold transition active:scale-95"
            title="Coordinate Search & Nether Link [C]"
            aria-label="Coordinate Search (Hot-key: C)"
          >
            <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
            <span>Coords</span>
            <span className="text-[9px] text-cyan-400/60 font-mono-code font-bold">[C]</span>
          </button>
        )}

        {onOpenBlueprints && (
          <button
            onClick={onOpenBlueprints}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/40 text-amber-300 rounded-lg text-xs font-semibold transition active:scale-95"
            title="Endgame Structure Blueprints & Locator [K]"
            aria-label="Structure Blueprints (Hot-key: K)"
          >
            <Compass className="w-3.5 h-3.5 text-amber-400" />
            <span>Blueprints</span>
            <span className="text-[9px] text-amber-400/60 font-mono-code font-bold">[K]</span>
          </button>
        )}

        <button
          onClick={onOpenExport}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-pixel tracking-wider shadow-md transition active:scale-95"
          title="Export Findings for In-Game Reference [E]"
          aria-label="Export Findings (Hot-key: E)"
        >
          <Download className="w-3.5 h-3.5" />
          <span>EXPORT</span>
          <span className="text-[9px] text-emerald-200 font-mono-code">[E]</span>
        </button>

        {onOpenShortcuts && (
          <button
            onClick={onOpenShortcuts}
            className="p-2 bg-[#1a1e2c] hover:bg-[#23293c] border border-white/10 text-zinc-300 hover:text-white rounded-lg transition"
            title="Keyboard Shortcuts [?]"
            aria-label="View Keyboard Shortcuts"
          >
            <Keyboard className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Mobile Burger Menu Button */}
      <div className="flex md:hidden items-center gap-1">
        <button
          onClick={onOpenExport}
          className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition"
          aria-label="Export"
        >
          <Download className="w-4 h-4" />
        </button>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 bg-[#1a1e2c] hover:bg-[#23293c] border border-white/10 text-zinc-200 rounded-lg transition"
          aria-label="Toggle Mobile Menu"
        >
          {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>

      {/* Mobile Dropdown Panel */}
      {isMobileMenuOpen && (
        <div className="absolute top-14 left-0 w-full bg-[#121520] border-b border-white/10 p-4 z-40 flex flex-col gap-3 shadow-2xl md:hidden animate-in fade-in slide-in-from-top-2">
          <div className="text-[10px] font-pixel text-zinc-400 uppercase">Dimension:</div>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={() => {
                onDimensionChange('overworld');
                setIsMobileMenuOpen(false);
              }}
              className={`py-1.5 rounded text-xs font-semibold flex items-center justify-center gap-1 ${
                dimension === 'overworld' ? 'bg-emerald-600 text-white' : 'bg-[#1b2030] text-zinc-300'
              }`}
            >
              <Globe2 className="w-3.5 h-3.5" /> Overworld
            </button>
            <button
              onClick={() => {
                onDimensionChange('nether');
                setIsMobileMenuOpen(false);
              }}
              className={`py-1.5 rounded text-xs font-semibold flex items-center justify-center gap-1 ${
                dimension === 'nether' ? 'bg-rose-700 text-white' : 'bg-[#1b2030] text-zinc-300'
              }`}
            >
              <Flame className="w-3.5 h-3.5" /> Nether
            </button>
            <button
              onClick={() => {
                onDimensionChange('the_end');
                setIsMobileMenuOpen(false);
              }}
              className={`py-1.5 rounded text-xs font-semibold flex items-center justify-center gap-1 ${
                dimension === 'the_end' ? 'bg-purple-700 text-white' : 'bg-[#1b2030] text-zinc-300'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" /> The End
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/10">
            <button
              onClick={() => {
                onOpenDiamondScanner();
                setIsMobileMenuOpen(false);
              }}
              className="py-2 bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 rounded text-xs font-semibold flex items-center justify-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" /> Diamonds
            </button>
            <button
              onClick={() => {
                onOpenPathfinder();
                setIsMobileMenuOpen(false);
              }}
              className="py-2 bg-[#1b2030] text-emerald-300 rounded text-xs font-semibold flex items-center justify-center gap-1"
            >
              <Navigation className="w-3.5 h-3.5" /> Route
            </button>
            <button
              onClick={() => {
                onOpenWaypoints();
                setIsMobileMenuOpen(false);
              }}
              className="py-2 bg-[#1b2030] text-purple-300 rounded text-xs font-semibold flex items-center justify-center gap-1"
            >
              <MapPin className="w-3.5 h-3.5" /> Waypoints
            </button>
            {onOpenCoordSearch && (
              <button
                onClick={() => {
                  onOpenCoordSearch();
                  setIsMobileMenuOpen(false);
                }}
                className="py-2 bg-cyan-950/40 border border-cyan-500/40 text-cyan-300 rounded text-xs font-semibold flex items-center justify-center gap-1"
              >
                <Crosshair className="w-3.5 h-3.5" /> Coords
              </button>
            )}
          </div>

          {onOpenShortcuts && (
            <div className="pt-2 border-t border-white/10">
              <button
                onClick={() => {
                  onOpenShortcuts();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full py-2 bg-[#1b2030] text-zinc-300 rounded text-xs font-semibold flex items-center justify-center gap-2"
              >
                <Keyboard className="w-4 h-4 text-emerald-400" /> Keyboard Shortcuts Guide
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
