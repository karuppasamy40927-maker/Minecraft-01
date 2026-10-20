import React, { useState, useMemo } from 'react';
import { 
  X, 
  Search, 
  MapPin, 
  Layers, 
  Compass, 
  Copy, 
  Check, 
  ShieldAlert, 
  Key, 
  Box, 
  Sparkles, 
  Skull, 
  Eye, 
  Flame, 
  Zap, 
  Bookmark, 
  Target,
  ArrowRight,
  Info
} from 'lucide-react';
import { Structure, Dimension, Waypoint } from '../types/minecraft';
import { STRUCTURE_BLUEPRINTS } from '../data/structureBlueprints';
import { BlueprintRoom } from '../types/minecraft';

interface BlueprintModalProps {
  isOpen: boolean;
  onClose: () => void;
  structures: Structure[];
  activeDimension: Dimension;
  currentSeed: string;
  onLocateOnMap: (structure: Structure) => void;
  onAddWaypoint: (waypoint: Omit<Waypoint, 'id' | 'createdAt'>) => void;
}

export const BlueprintModal: React.FC<BlueprintModalProps> = ({
  isOpen,
  onClose,
  structures,
  activeDimension,
  currentSeed,
  onLocateOnMap,
  onAddWaypoint,
}) => {
  const [selectedDimension, setSelectedDimension] = useState<Dimension | 'all'>(activeDimension);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStructureId, setSelectedStructureId] = useState<string | null>(null);
  const [activeLevelId, setActiveLevelId] = useState<number>(1);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [bookmarkedId, setBookmarkedId] = useState<string | null>(null);

  // Filter structures by dimension and search term
  const filteredStructures = useMemo(() => {
    return structures.filter((s) => {
      const matchDim = selectedDimension === 'all' || s.dimension === selectedDimension;
      const matchQuery =
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.keyLoot.some((l) => l.toLowerCase().includes(searchQuery.toLowerCase())) ||
        s.biome.toLowerCase().includes(searchQuery.toLowerCase());
      return matchDim && matchQuery;
    });
  }, [structures, selectedDimension, searchQuery]);

  // Set default selected structure when list changes or modal opens
  const activeStructure = useMemo(() => {
    if (selectedStructureId) {
      const found = structures.find((s) => s.id === selectedStructureId);
      if (found) return found;
    }
    return filteredStructures[0] || structures[0] || null;
  }, [selectedStructureId, filteredStructures, structures]);

  // Lookup blueprint definition for active structure
  const blueprint = useMemo(() => {
    if (!activeStructure) return null;
    return STRUCTURE_BLUEPRINTS[activeStructure.type] || STRUCTURE_BLUEPRINTS.trial_chamber || null;
  }, [activeStructure]);

  // Active level rooms
  const currentLevelRooms = useMemo(() => {
    if (!blueprint) return [];
    return blueprint.rooms.filter((r) => r.floorLevel === activeLevelId);
  }, [blueprint, activeLevelId]);

  // Active room selection
  const activeRoom = useMemo(() => {
    if (selectedRoomId) {
      const found = blueprint?.rooms.find((r) => r.id === selectedRoomId);
      if (found) return found;
    }
    return currentLevelRooms[0] || blueprint?.rooms[0] || null;
  }, [selectedRoomId, currentLevelRooms, blueprint]);

  if (!isOpen) return null;

  const handleCopyTp = (struct: Structure) => {
    const tpCmd = `/tp @s ${struct.x} ${struct.y} ${struct.z}`;
    navigator.clipboard.writeText(tpCmd);
    setCopiedId(struct.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleBookmark = (struct: Structure) => {
    onAddWaypoint({
      name: `${struct.name}`,
      x: struct.x,
      y: struct.y,
      z: struct.z,
      dimension: struct.dimension,
      color: struct.color || '#38bdf8',
      icon: struct.icon || 'Box',
      tag: 'Custom',
      notes: `Blueprint landmark: ${struct.description}`,
    });
    setBookmarkedId(struct.id);
    setTimeout(() => setBookmarkedId(null), 2000);
  };

  const getThreatColor = (threat: string) => {
    switch (threat.toLowerCase()) {
      case 'safe':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'low':
        return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
      case 'moderate':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'high':
        return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
      case 'extreme':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      default:
        return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  const getRoomFill = (type: BlueprintRoom['type'], isSelected: boolean) => {
    switch (type) {
      case 'portal':
        return isSelected ? '#38bdf8' : 'rgba(56, 189, 248, 0.25)';
      case 'vault':
        return isSelected ? '#f59e0b' : 'rgba(245, 158, 11, 0.25)';
      case 'spawner':
        return isSelected ? '#f43f5e' : 'rgba(244, 63, 94, 0.25)';
      case 'library':
        return isSelected ? '#10b981' : 'rgba(16, 185, 129, 0.25)';
      case 'secret':
        return isSelected ? '#c084fc' : 'rgba(192, 132, 252, 0.25)';
      case 'entrance':
        return isSelected ? '#60a5fa' : 'rgba(96, 165, 250, 0.25)';
      default:
        return isSelected ? '#64748b' : 'rgba(100, 116, 139, 0.25)';
    }
  };

  const getRoomStroke = (type: BlueprintRoom['type']) => {
    switch (type) {
      case 'portal': return '#38bdf8';
      case 'vault': return '#f59e0b';
      case 'spawner': return '#f43f5e';
      case 'library': return '#10b981';
      case 'secret': return '#c084fc';
      case 'entrance': return '#60a5fa';
      default: return '#94a3b8';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="flex flex-col w-full max-w-6xl h-[90vh] bg-[#050505] border border-[#00f5ff]/40 rounded-2xl shadow-[0_0_30px_rgba(0,245,255,0.2)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#00f5ff]/30 bg-[#0a0a0a]/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#00f5ff]/10 border border-[#00f5ff]/30 text-[#00f5ff] shadow-[0_0_15px_rgba(0,245,255,0.3)]">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight text-[#00f5ff] drop-shadow-[0_0_5px_rgba(0,245,255,0.6)]">
                  Structure Blueprint Inspector & Locator
                </h2>
                <span className="px-2 py-0.5 text-xs font-mono font-medium text-[#ff00ff] bg-[#ff00ff]/10 border border-[#ff00ff]/30 rounded">
                  Bedrock 1.20 - 1.21+
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Architectural floor plan sketches, chamber rooms, loot distribution & coordinate depth radar
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-[#00f5ff] rounded-lg hover:bg-[#00f5ff]/10 transition-colors"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 min-h-0 overflow-hidden">
          
          {/* Left Column: Structure Directory & Fast Search (4 cols) */}
          <div className="lg:col-span-4 flex flex-col border-r border-slate-800 bg-slate-900/50 min-h-0 overflow-hidden">
            
            {/* Dimension Filter Tabs */}
            <div className="p-3 border-b border-slate-800 bg-slate-900/80 shrink-0">
              <div className="flex p-1 bg-slate-950 rounded-lg border border-slate-800">
                {(['all', 'overworld', 'nether', 'the_end'] as const).map((dim) => (
                  <button
                    key={dim}
                    onClick={() => setSelectedDimension(dim)}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors capitalize ${
                      selectedDimension === dim
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {dim === 'all' ? 'All' : dim === 'the_end' ? 'The End' : dim}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative mt-2">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search structures, loot, biomes..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                />
              </div>
            </div>

            {/* Structure List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {filteredStructures.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  No matching structures found for this dimension filter.
                </div>
              ) : (
                filteredStructures.map((struct) => {
                  const isSelected = activeStructure?.id === struct.id;
                  const dist = struct.distanceFromSpawn 
                    ? Math.round(struct.distanceFromSpawn)
                    : Math.round(Math.hypot(struct.x, struct.z));

                  return (
                    <div
                      key={struct.id}
                      onClick={() => {
                        setSelectedStructureId(struct.id);
                        setActiveLevelId(1);
                        setSelectedRoomId(null);
                      }}
                      className={`group relative p-3 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-cyan-950/30 border-cyan-500/50 shadow-md shadow-cyan-950/20'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: struct.color || '#38bdf8' }}
                          />
                          <h3 className="text-xs font-semibold text-white group-hover:text-cyan-300 transition-colors line-clamp-1">
                            {struct.name}
                          </h3>
                        </div>

                        {struct.verified && (
                          <span className="shrink-0 px-1.5 py-0.5 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded">
                            Verified
                          </span>
                        )}
                      </div>

                      {/* Coordinates & Depth */}
                      <div className="flex items-center justify-between mt-2 text-[11px] font-mono text-slate-400">
                        <span className="text-cyan-400">
                          X: {struct.x} · Z: {struct.z}
                        </span>
                        <span className="text-amber-400">
                          Y = {struct.y}
                        </span>
                      </div>

                      {/* Distance & Biome */}
                      <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500">
                        <span>{struct.biome}</span>
                        <span className="font-mono tabular-nums">{dist.toLocaleString()} blocks away</span>
                      </div>

                      {/* Quick Action Bar on Card */}
                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-800/80">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyTp(struct);
                          }}
                          className="flex items-center gap-1 px-2 py-1 text-[10px] font-mono font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded transition-colors"
                          title="Copy /tp Command"
                        >
                          {copiedId === struct.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-slate-400" />
                              <span>/tp</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onLocateOnMap(struct);
                            onClose();
                          }}
                          className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded transition-colors ml-auto"
                        >
                          <Target className="w-3 h-3" />
                          <span>Locate</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Interactive Blueprint Canvas & Room Inspector (8 cols) */}
          <div className="lg:col-span-8 flex flex-col min-h-0 bg-slate-950/60 overflow-hidden">
            {activeStructure && blueprint ? (
              <div className="flex flex-col h-full overflow-hidden">
                
                {/* Structure Header Bar */}
                <div className="p-4 border-b border-slate-800 bg-slate-900/80 shrink-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h1 className="text-base font-bold text-white">
                          {activeStructure.name}
                        </h1>
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded border capitalize ${getThreatColor(blueprint.overallThreat)}`}>
                          Threat: {blueprint.overallThreat}
                        </span>
                        <span className="px-2 py-0.5 text-xs font-mono text-slate-400 bg-slate-800 rounded">
                          Y = {activeStructure.y}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                        {blueprint.architecturalOverview}
                      </p>
                    </div>

                    {/* Quick Locate & Bookmark Buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleBookmark(activeStructure)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
                      >
                        {bookmarkedId === activeStructure.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Bookmarked</span>
                          </>
                        ) : (
                          <>
                            <Bookmark className="w-3.5 h-3.5 text-amber-400" />
                            <span>Save Waypoint</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => {
                          onLocateOnMap(activeStructure);
                          onClose();
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg shadow-md shadow-cyan-950 transition-colors"
                      >
                        <Target className="w-3.5 h-3.5" />
                        <span>Locate on Map</span>
                      </button>
                    </div>
                  </div>

                  {/* Key Loot Pills */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t border-slate-800/80">
                    <span className="text-xs font-medium text-slate-400">Primary Loot:</span>
                    {blueprint.primaryAttractions.map((loot, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 text-xs font-medium text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-md"
                      >
                        {loot}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Level / Elevation Layer Tabs */}
                <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-800 bg-slate-900/40 shrink-0 overflow-x-auto">
                  <span className="text-xs font-medium text-slate-400 shrink-0 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-cyan-400" /> Floor Level:
                  </span>
                  {blueprint.levels.map((lvl) => (
                    <button
                      key={lvl.id}
                      onClick={() => {
                        setActiveLevelId(lvl.id);
                        const firstRoom = blueprint.rooms.find((r) => r.floorLevel === lvl.id);
                        if (firstRoom) setSelectedRoomId(firstRoom.id);
                      }}
                      className={`flex items-center gap-2 px-3 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                        activeLevelId === lvl.id
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                          : 'text-slate-400 hover:text-slate-200 bg-slate-800/40 hover:bg-slate-800'
                      }`}
                    >
                      <span>{lvl.name}</span>
                      <span className="text-[10px] font-mono text-slate-400">({lvl.elevationDelta})</span>
                    </button>
                  ))}
                </div>

                {/* Main Draftsman Blueprint SVG Canvas */}
                <div className="flex-1 relative p-4 min-h-[220px] bg-[#070b14] overflow-hidden flex items-center justify-center border-b border-slate-800">
                  {/* Subtle Blueprint Grid Background */}
                  <div
                    className="absolute inset-0 opacity-20 pointer-events-none"
                    style={{
                      backgroundImage: `
                        linear-gradient(to right, #38bdf8 1px, transparent 1px),
                        linear-gradient(to bottom, #38bdf8 1px, transparent 1px)
                      `,
                      backgroundSize: '24px 24px',
                    }}
                  />

                  {/* Blueprint Scale & Compass Legend */}
                  <div className="absolute top-3 left-3 flex items-center gap-3 text-[10px] font-mono text-slate-400 bg-slate-900/80 px-2.5 py-1 rounded border border-slate-800">
                    <div className="flex items-center gap-1 text-cyan-400">
                      <Compass className="w-3 h-3" /> N
                    </div>
                    <span>Draftsman Scale: 1 Grid = 10 Blocks</span>
                  </div>

                  {/* SVG Rendered Floor Plan */}
                  <div className="w-full h-full max-h-[280px] flex items-center justify-center">
                    <svg
                      viewBox="-100 -80 200 160"
                      className="w-full h-full max-w-[500px]"
                    >
                      {/* Blueprint Outer Structure Perimeter */}
                      <rect
                        x="-80"
                        y="-60"
                        width="160"
                        height="120"
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="1"
                        strokeDasharray="4 2"
                        opacity="0.4"
                      />

                      {/* Render Rooms for Active Level */}
                      {currentLevelRooms.map((room) => {
                        const isSelected = activeRoom?.id === room.id;
                        const fill = getRoomFill(room.type, isSelected);
                        const stroke = getRoomStroke(room.type);

                        return (
                          <g
                            key={room.id}
                            onClick={() => setSelectedRoomId(room.id)}
                            className="cursor-pointer group"
                          >
                            {/* Room Perimeter Box */}
                            <rect
                              x={room.xOffset}
                              y={room.zOffset}
                              width={room.width}
                              height={room.height}
                              fill={fill}
                              stroke={stroke}
                              strokeWidth={isSelected ? '2' : '1'}
                              rx="2"
                              className="transition-all hover:opacity-90"
                            />

                            {/* Selection Pulse Ring */}
                            {isSelected && (
                              <rect
                                x={room.xOffset - 2}
                                y={room.zOffset - 2}
                                width={room.width + 4}
                                height={room.height + 4}
                                fill="none"
                                stroke={stroke}
                                strokeWidth="0.75"
                                opacity="0.6"
                                strokeDasharray="2 2"
                              />
                            )}

                            {/* Room Label */}
                            <text
                              x={room.xOffset + room.width / 2}
                              y={room.zOffset + room.height / 2 + 1}
                              textAnchor="middle"
                              dominantBaseline="middle"
                              fill={isSelected ? '#ffffff' : '#cbd5e1'}
                              fontSize="5.5"
                              fontWeight={isSelected ? 'bold' : 'normal'}
                              fontFamily="monospace"
                              pointerEvents="none"
                            >
                              {room.name.length > 18 ? `${room.name.slice(0, 16)}...` : room.name}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                </div>

                {/* Selected Chamber Detail Drawer */}
                {activeRoom ? (
                  <div className="p-4 bg-slate-900/90 shrink-0 border-t border-slate-800">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                            <Box className="w-4 h-4 text-cyan-400" />
                            {activeRoom.name}
                          </h3>
                          <span className={`px-2 py-0.5 text-[10px] font-semibold rounded border uppercase tracking-wide ${getThreatColor(activeRoom.threatLevel)}`}>
                            {activeRoom.threatLevel} threat
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-1">
                          {activeRoom.description}
                        </p>
                      </div>

                      <div className="text-right text-[11px] font-mono text-slate-400 shrink-0">
                        <span>Offset: ({activeRoom.xOffset}, {activeRoom.zOffset})</span>
                      </div>
                    </div>

                    {/* Room Loot, Hazards & Secret Tips Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-800">
                      
                      {/* Loot Items */}
                      <div>
                        <span className="text-xs font-semibold text-amber-400 flex items-center gap-1 mb-1">
                          <Sparkles className="w-3.5 h-3.5" /> Chamber Loot Drops:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {activeRoom.keyLoot.map((loot, i) => (
                            <span key={i} className="text-[11px] text-slate-200 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                              {loot}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Hazards & Secret Tips */}
                      <div>
                        {activeRoom.hazards && activeRoom.hazards.length > 0 && (
                          <div className="mb-1.5">
                            <span className="text-xs font-semibold text-rose-400 flex items-center gap-1 mb-1">
                              <ShieldAlert className="w-3.5 h-3.5" /> Mob Hazards:
                            </span>
                            <span className="text-xs text-slate-300">
                              {activeRoom.hazards.join(' · ')}
                            </span>
                          </div>
                        )}

                        {activeRoom.secretTip && (
                          <div>
                            <span className="text-xs font-semibold text-cyan-400 flex items-center gap-1 mb-1">
                              <Info className="w-3.5 h-3.5" /> Secret Guide:
                            </span>
                            <p className="text-xs text-cyan-200/90 italic">
                              "{activeRoom.secretTip}"
                            </p>
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                ) : null}

              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 text-xs p-8 text-center">
                <Layers className="w-8 h-8 mb-2 opacity-50" />
                Select a structure from the left directory to inspect its 2D floor plan blueprint.
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
