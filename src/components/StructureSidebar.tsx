import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Structure, Dimension, StructureCategory } from '../types/minecraft';
import { BIOME_CATEGORIES } from '../utils/biomeData';
import { 
  Search, 
  Filter, 
  MapPin, 
  Layers, 
  Sparkles, 
  Navigation, 
  ChevronRight, 
  ChevronLeft,
  Flame,
  Home,
  Mountain,
  Anchor,
  Castle,
  Skull,
  Key,
  Zap,
  ShieldCheck,
  AlertCircle,
  Palette,
  Crosshair
} from 'lucide-react';

interface StructureSidebarProps {
  structures: Structure[];
  dimension: Dimension;
  selectedStructure: Structure | null;
  onSelectStructure: (s: Structure) => void;
  onPlotRoute: (s: Structure) => void;
  showChunkGrid: boolean;
  onToggleChunkGrid: () => void;
  showDiamonds: boolean;
  onToggleDiamonds: () => void;
  showBiomeHeatmap: boolean;
  onToggleBiomeHeatmap: () => void;
  visibleCategories: string[];
  onChangeCategories: (cats: string[]) => void;
  selectedBiomeCategory: string;
  onSelectBiomeCategory: (cat: string) => void;
  searchFocusSignal?: number;
  onOpenCoordSearch?: () => void;
  onOpenBlueprints?: () => void;
}

const CATEGORY_TABS: { id: string; label: string; icon: any }[] = [
  { id: 'all', label: 'All', icon: Layers },
  { id: 'survival_starter', label: 'Starter', icon: Home },
  { id: 'rare_dungeon', label: 'Mansions', icon: Castle },
  { id: 'underground', label: 'Underground', icon: Skull },
  { id: 'nether_endgame', label: 'Nether', icon: Flame },
  { id: 'end_endgame', label: 'The End', icon: Zap },
];

export const StructureSidebar: React.FC<StructureSidebarProps> = ({
  structures,
  dimension,
  selectedStructure,
  onSelectStructure,
  onPlotRoute,
  showChunkGrid,
  onToggleChunkGrid,
  showDiamonds,
  onToggleDiamonds,
  showBiomeHeatmap,
  onToggleBiomeHeatmap,
  visibleCategories,
  onChangeCategories,
  selectedBiomeCategory,
  onSelectBiomeCategory,
  searchFocusSignal,
  onOpenCoordSearch,
  onOpenBlueprints,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Focus search input when triggered via shortcut 'S' or '/'
  useEffect(() => {
    if (searchFocusSignal && searchFocusSignal > 0) {
      setCollapsed(false);
      setTimeout(() => {
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }, 50);
    }
  }, [searchFocusSignal]);

  // Filter structures by dimension, search query, and category
  const filtered = useMemo(() => {
    return structures.filter((s) => {
      if (s.dimension !== dimension) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = s.name.toLowerCase().includes(q);
        const matchBiome = s.biome.toLowerCase().includes(q);
        const matchCoords = `${s.x} ${s.y} ${s.z}`.includes(q);
        if (!matchName && !matchBiome && !matchCoords) return false;
      }

      // Category filter
      if (!visibleCategories.includes('all') && !visibleCategories.includes(s.category)) {
        return false;
      }

      return true;
    });
  }, [structures, dimension, searchQuery, visibleCategories]);

  const handleCategoryClick = (catId: string) => {
    if (catId === 'all') {
      onChangeCategories(['all']);
    } else {
      if (visibleCategories.includes('all')) {
        onChangeCategories([catId]);
      } else if (visibleCategories.includes(catId)) {
        const next = visibleCategories.filter((c) => c !== catId);
        onChangeCategories(next.length === 0 ? ['all'] : next);
      } else {
        onChangeCategories([...visibleCategories, catId]);
      }
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      searchInputRef.current?.blur();
    }
  };

  return (
    <aside
      className={`relative h-full bg-[#10131d] border-r border-white/10 transition-all duration-300 flex flex-col z-20 ${
        collapsed ? 'w-12' : 'w-72 sm:w-80 md:w-88'
      }`}
      aria-label="Structure Sidebar"
    >
      {/* Collapse / Expand Toggle Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-4 z-30 w-6 h-6 rounded-full bg-[#222838] border border-white/20 text-zinc-300 hover:text-white flex items-center justify-center shadow-lg transition"
        title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        aria-label={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
      >
        {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>

      {collapsed ? (
        <div className="flex flex-col items-center py-6 gap-6 text-zinc-400">
          <button 
            onClick={() => setCollapsed(false)}
            title="Expand Search [S]"
            className="hover:text-emerald-400 transition"
          >
            <Search className="w-5 h-5 text-emerald-400" />
          </button>
          {onOpenCoordSearch && (
            <button
              onClick={onOpenCoordSearch}
              title="Search Coordinates & Nether Link [C]"
              className="hover:text-cyan-400 text-zinc-400 transition"
            >
              <Crosshair className="w-5 h-5 text-cyan-400" />
            </button>
          )}
          <Layers className="w-5 h-5 text-emerald-400" />
          <MapPin className="w-5 h-5 text-purple-400" />
          <Sparkles className="w-5 h-5 text-cyan-400" />
          <button
            onClick={onToggleBiomeHeatmap}
            title={`Toggle Biome Heatmap [B] (${showBiomeHeatmap ? 'ON' : 'OFF'})`}
            className={`transition ${showBiomeHeatmap ? 'text-amber-400' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            <Palette className="w-5 h-5" />
          </button>
        </div>
      ) : (
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header & Search */}
          <div className="p-3 border-b border-white/10 bg-[#131622] flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-pixel text-[11px] text-zinc-200 tracking-wider">
                STRUCTURE DIRECTORY
              </span>
              <span className="text-[10px] font-mono-code text-emerald-400 bg-emerald-950/70 px-2 py-0.5 rounded border border-emerald-500/30">
                {filtered.length} found
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search structures... [S]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="w-full bg-[#181c28] border border-white/10 rounded-lg pl-8 pr-8 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                aria-label="Search Structures"
              />
              {searchQuery ? (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-zinc-500 hover:text-white text-xs"
                >
                  ✕
                </button>
              ) : (
                <kbd className="absolute right-2.5 top-2 text-[9px] font-mono-code px-1 rounded bg-[#222738] text-zinc-400 border border-white/10 pointer-events-none hidden sm:inline">
                  S
                </kbd>
              )}
            </div>

            {/* Quick Coordinate Search Launcher Button */}
            {onOpenCoordSearch && (
              <button
                onClick={onOpenCoordSearch}
                className="w-full py-1.5 px-2.5 bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/30 rounded-lg text-cyan-300 text-[11px] font-semibold flex items-center justify-between transition group shadow-sm"
                title="Search coordinates with Nether portal conversion"
              >
                <div className="flex items-center gap-1.5">
                  <Crosshair className="w-3.5 h-3.5 text-cyan-400 group-hover:rotate-45 transition-transform" />
                  <span>Search Coordinates (Both Worlds)</span>
                </div>
                <span className="text-[9px] font-mono-code px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-200">
                  [C]
                </span>
              </button>
            )}

            {/* Structure Blueprints & Sketches Launcher Button */}
            {onOpenBlueprints && (
              <button
                onClick={onOpenBlueprints}
                className="w-full py-1.5 px-2.5 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/30 rounded-lg text-amber-300 text-[11px] font-semibold flex items-center justify-between transition group shadow-sm"
                title="Interactive 2D Structure Blueprints, Chambers & Locator"
              >
                <div className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
                  <span>Structure Blueprints & Sketches</span>
                </div>
                <span className="text-[9px] font-mono-code px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-200">
                  [K]
                </span>
              </button>
            )}

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
              {CATEGORY_TABS.map((tab) => {
                const isActive = visibleCategories.includes(tab.id);
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleCategoryClick(tab.id)}
                    className={`px-2 py-1 rounded text-[10px] font-pixel shrink-0 transition flex items-center gap-1 ${
                      isActive
                        ? 'bg-emerald-600 text-white font-bold'
                        : 'bg-[#1c2130] text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Biome Filter Dropdown & Layer Toggles */}
          <div className="px-3 py-2 bg-[#0d1017] border-b border-white/10 flex flex-col gap-2 text-xs">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-zinc-400">Biome Filter:</span>
              <select
                value={selectedBiomeCategory}
                onChange={(e) => onSelectBiomeCategory(e.target.value)}
                className="bg-[#181c28] text-zinc-200 border border-white/10 rounded px-2 py-1 text-xs focus:outline-none focus:border-emerald-500"
                aria-label="Filter Map by Biome Category"
              >
                {BIOME_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Map Layers Checklist */}
            <div className="flex flex-wrap items-center justify-between gap-y-1.5 pt-1 border-t border-white/5">
              <label className="flex items-center gap-1.5 cursor-pointer text-zinc-300 hover:text-white select-none">
                <input
                  type="checkbox"
                  checked={showChunkGrid}
                  onChange={onToggleChunkGrid}
                  className="rounded border-zinc-600 bg-zinc-800 text-emerald-500 focus:ring-0 w-3.5 h-3.5"
                />
                <span className="text-[10px]">Chunk Grid</span>
              </label>

              {dimension === 'overworld' && (
                <label className="flex items-center gap-1.5 cursor-pointer text-cyan-300 hover:text-cyan-200 select-none">
                  <input
                    type="checkbox"
                    checked={showDiamonds}
                    onChange={onToggleDiamonds}
                    className="rounded border-cyan-600 bg-zinc-800 text-cyan-400 focus:ring-0 w-3.5 h-3.5"
                  />
                  <span className="text-[10px] font-semibold flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" /> Diamonds
                  </span>
                </label>
              )}

              {/* Show Biome Heatmap Toggle */}
              <label className="flex items-center gap-1.5 cursor-pointer text-amber-300 hover:text-amber-200 select-none">
                <input
                  type="checkbox"
                  checked={showBiomeHeatmap}
                  onChange={onToggleBiomeHeatmap}
                  className="rounded border-amber-500/50 bg-zinc-800 text-amber-500 focus:ring-0 w-3.5 h-3.5"
                />
                <span className="text-[10px] font-semibold flex items-center gap-1">
                  <Palette className="w-2.5 h-2.5 text-amber-400" /> Biome Heatmap
                </span>
              </label>
            </div>
          </div>

          {/* Structures List */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-zinc-500 text-xs">
                No matching structures found. Adjust search or category filters.
              </div>
            ) : (
              filtered.map((struct) => {
                const isSelected = selectedStructure?.id === struct.id;
                const distFromSpawn = Math.round(Math.hypot(struct.x, struct.z));

                return (
                  <div
                    key={struct.id}
                    onClick={() => onSelectStructure(struct)}
                    className={`p-2.5 rounded-lg border cursor-pointer transition text-left relative ${
                      isSelected
                        ? 'bg-[#181f2f] border-emerald-400 shadow-md ring-1 ring-emerald-500/50'
                        : 'bg-[#141724] hover:bg-[#1a1f2e] border-white/5'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: struct.color }}
                        />
                        <h4 className="font-semibold text-xs text-white line-clamp-1">
                          {struct.name}
                        </h4>
                      </div>
                      {struct.status === 'verified' ? (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30 shrink-0 flex items-center gap-0.5">
                          <ShieldCheck className="w-2.5 h-2.5" /> VERIFIED
                        </span>
                      ) : (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-950/70 text-amber-300 border border-amber-500/30 shrink-0 flex items-center gap-0.5">
                          <AlertCircle className="w-2.5 h-2.5" /> ESTIMATED
                        </span>
                      )}
                    </div>

                    <div className="mt-1 flex items-center justify-between text-[11px] font-mono-code">
                      <span className="text-cyan-300 font-bold">
                        X: {struct.x} Y: {struct.y} Z: {struct.z}
                      </span>
                      <span className="text-zinc-400 text-[10px]">{distFromSpawn} blocks</span>
                    </div>

                    <div className="mt-2 pt-1.5 border-t border-white/5 flex items-center justify-between text-[10px]">
                      <span className="text-zinc-400">{struct.biome}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onPlotRoute(struct);
                        }}
                        className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 transition"
                      >
                        <Navigation className="w-3 h-3" /> Route
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </aside>
  );
};
