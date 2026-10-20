import React, { useState, useEffect } from 'react';
import { Structure, TravelRoute, RoutePoint, Waypoint } from '../types/minecraft';
import { WorldGenerator } from '../utils/seedGenerator';
import { 
  Navigation, 
  Flame, 
  Clock, 
  Compass, 
  Zap, 
  Check, 
  Copy, 
  Sparkles, 
  MapPin, 
  AlertCircle, 
  X 
} from 'lucide-react';

interface RoutePathfinderProps {
  generator: WorldGenerator;
  structures: Structure[];
  waypoints?: Waypoint[];
  activeRoute: TravelRoute | null;
  onSetRoute: (route: TravelRoute | null) => void;
  onAddAsWaypoint?: (dest: RoutePoint) => void;
  onClose: () => void;
}

export const RoutePathfinder: React.FC<RoutePathfinderProps> = ({
  generator,
  structures,
  waypoints = [],
  activeRoute,
  onSetRoute,
  onAddAsWaypoint,
  onClose,
}) => {
  const [originId, setOriginId] = useState<string>('spawn');
  const [destId, setDestId] = useState<string>(structures[0]?.id || 'spawn');
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Combine structures and waypoints as selectable locations
  const spawnPoint: RoutePoint = {
    id: 'spawn',
    name: 'Spawn Point (0, 0)',
    x: 0,
    y: 68,
    z: 0,
    dimension: 'overworld',
  };

  const getPointFromId = (id: string): RoutePoint => {
    if (id === 'spawn') return spawnPoint;
    const foundStruct = structures.find((s) => s.id === id);
    if (foundStruct) {
      return {
        id: foundStruct.id,
        name: foundStruct.name,
        x: foundStruct.x,
        y: foundStruct.y,
        z: foundStruct.z,
        dimension: foundStruct.dimension,
      };
    }
    const foundWp = waypoints.find((w) => w.id === id);
    if (foundWp) {
      return {
        id: foundWp.id,
        name: `[Waypoint] ${foundWp.name}`,
        x: foundWp.x,
        y: foundWp.y,
        z: foundWp.z,
        dimension: foundWp.dimension,
      };
    }
    return spawnPoint;
  };

  const calculateCurrentRoute = () => {
    const origin = getPointFromId(originId);
    const dest = getPointFromId(destId);
    const route = generator.calculateRoute(origin, dest);
    onSetRoute(route);
  };

  const copyRouteDetails = async () => {
    if (!activeRoute) return;
    try {
      const text = `🧭 MINECRAFT BEDROCK EXPEDITION ROUTE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Origin: ${activeRoute.origin.name} (${activeRoute.origin.x}, ${activeRoute.origin.y}, ${activeRoute.origin.z}) [${activeRoute.origin.dimension}]
🎯 Destination: ${activeRoute.destination.name} (${activeRoute.destination.x}, ${activeRoute.destination.y}, ${activeRoute.destination.z}) [${activeRoute.destination.dimension}]
📏 Overworld Distance: ${activeRoute.overworldBlocks} blocks
🔥 Nether Highway Distance: ${activeRoute.netherBlocks} blocks (8:1 scale shortcut)

⏱️ Estimated Travel Times (standard player velocity):
• Sprint-Jumping: ~${Math.max(1, Math.round(activeRoute.sprintJumpTimeSec / 60))} min (${activeRoute.sprintJumpTimeSec}s)
• Elytra + Rockets: ~${Math.max(1, Math.round(activeRoute.elytraTimeSec / 60))} min (${activeRoute.elytraTimeSec}s)
• Nether Portal Highway: ~${Math.max(1, Math.round(activeRoute.netherTravelTimeSec / 60))} min (${activeRoute.netherTravelTimeSec}s) - Saves ~${Math.round(activeRoute.timeSavedWithNetherSec / 60)} min!

🚪 Nether Portal Linking Calculations:
• Entry Portal (Overworld): X: ${activeRoute.origin.x}, Y: ${activeRoute.origin.y}, Z: ${activeRoute.origin.z}
• Entry Portal (Nether):    X: ${activeRoute.portalOrigin?.x}, Y: 70, Z: ${activeRoute.portalOrigin?.z}
• Exit Portal (Nether):     X: ${activeRoute.portalDest?.x}, Y: 70, Z: ${activeRoute.portalDest?.z}
• Exit Portal (Overworld):  X: ${activeRoute.destination.x}, Y: ${activeRoute.destination.y}, Z: ${activeRoute.destination.z}

📜 Turn-by-Turn Navigation Steps:
${activeRoute.directions.map((d) => `${d.step}. ${d.title}\n   ${d.detail}`).join('\n')}
`;
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setCopyError(false);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopyError(true);
      setTimeout(() => setCopyError(false), 2500);
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
      aria-labelledby="pathfinder-title"
    >
      <div className="w-full max-w-2xl bg-[#121520] border border-[#2b3347] rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-zinc-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-3.5 sm:p-4 border-b border-white/10 flex items-center justify-between bg-[#161a27]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-lg border border-emerald-500/40 text-emerald-400">
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <h2 id="pathfinder-title" className="font-pixel text-xs sm:text-sm text-white tracking-wide flex items-center gap-2 flex-wrap">
                EXPEDITION ROUTE PATHFINDER
                <span className="text-[9px] font-sans px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/40">
                  Bedrock 1.20+
                </span>
              </h2>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Calculate direct paths, estimated travel times, and exact 1:8 Nether portal coordinates.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition"
            aria-label="Close Pathfinder"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex flex-col gap-4">
          {/* Origin & Destination */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#0e1017] p-3.5 rounded-lg border border-white/5">
            <div>
              <label className="block text-[11px] font-pixel text-emerald-400 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> ORIGIN POINT:
              </label>
              <select
                value={originId}
                onChange={(e) => setOriginId(e.target.value)}
                className="w-full bg-[#181c28] border border-white/10 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                aria-label="Route Origin Point"
              >
                <option value="spawn">📍 Player Spawn (0, 68, 0)</option>
                {structures.map((s) => (
                  <option key={`orig-${s.id}`} value={s.id}>
                    {s.name} ({s.x}, {s.y}, {s.z}) - [{s.dimension}]
                  </option>
                ))}
                {waypoints.map((w) => (
                  <option key={`orig-wp-${w.id}`} value={w.id}>
                    📍 [Waypoint] {w.name} ({w.x}, {w.y}, {w.z})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-pixel text-amber-400 mb-1.5 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5" /> DESTINATION:
              </label>
              <select
                value={destId}
                onChange={(e) => setDestId(e.target.value)}
                className="w-full bg-[#181c28] border border-white/10 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                aria-label="Route Destination Point"
              >
                {structures.map((s) => (
                  <option key={`dest-${s.id}`} value={s.id}>
                    {s.name} ({s.x}, {s.y}, {s.z}) - [{s.dimension}]
                  </option>
                ))}
                {waypoints.map((w) => (
                  <option key={`dest-wp-${w.id}`} value={w.id}>
                    📍 [Waypoint] {w.name} ({w.x}, {w.y}, {w.z})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={calculateCurrentRoute}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-pixel text-xs tracking-wider rounded border border-emerald-400/50 shadow-lg flex items-center justify-center gap-2 transition"
          >
            <Sparkles className="w-4 h-4 text-emerald-200" />
            CALCULATE ROUTE & NETHER SHORTCUT
          </button>

          {/* Active Route Results */}
          {activeRoute && (
            <div className="flex flex-col gap-3">
              {/* Distance & Travel Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="bg-[#161a27] p-2.5 rounded border border-white/5 flex flex-col">
                  <span className="text-[10px] text-zinc-400 uppercase font-mono-code">Overworld Dist</span>
                  <span className="text-sm sm:text-base font-bold text-white font-mono-code mt-0.5">
                    {activeRoute.overworldBlocks} <span className="text-[10px] text-zinc-400">blocks</span>
                  </span>
                </div>

                <div className="bg-[#161a27] p-2.5 rounded border border-purple-500/30 flex flex-col">
                  <span className="text-[10px] text-purple-300 uppercase font-mono-code flex items-center gap-1">
                    <Flame className="w-3 h-3 text-red-400" /> Nether Dist
                  </span>
                  <span className="text-sm sm:text-base font-bold text-purple-200 font-mono-code mt-0.5">
                    {activeRoute.netherBlocks} <span className="text-[10px] text-purple-400">blocks</span>
                  </span>
                </div>

                <div className="bg-[#161a27] p-2.5 rounded border border-white/5 flex flex-col">
                  <span className="text-[10px] text-zinc-400 uppercase font-mono-code flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-400" /> Sprint Time
                  </span>
                  <span className="text-sm sm:text-base font-bold text-amber-300 font-mono-code mt-0.5">
                    ~{Math.max(1, Math.round(activeRoute.sprintJumpTimeSec / 60))} min
                  </span>
                </div>

                <div className="bg-[#161a27] p-2.5 rounded border border-emerald-500/30 bg-emerald-950/20 flex flex-col">
                  <span className="text-[10px] text-emerald-300 uppercase font-mono-code flex items-center gap-1">
                    <Zap className="w-3 h-3 text-emerald-400" /> Time Saved
                  </span>
                  <span className="text-sm sm:text-base font-bold text-emerald-400 font-mono-code mt-0.5">
                    +{Math.round(activeRoute.timeSavedWithNetherSec / 60)} min
                  </span>
                </div>
              </div>

              {/* Disclaimer */}
              <div className="text-[10px] text-zinc-400 italic">
                * Travel times are estimates calculated from standard player movement speeds across unobstructed terrain.
              </div>

              {/* Nether Portal Linking Callout */}
              <div className="bg-purple-950/30 border border-purple-500/40 p-3 rounded-lg flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-pixel text-[11px] text-purple-300 flex items-center gap-2">
                    <Flame className="w-4 h-4 text-purple-400" />
                    EXACT NETHER PORTAL LINKING FORMULA
                  </span>
                  <span className="text-[9px] text-purple-300 bg-purple-900/60 px-2 py-0.5 rounded border border-purple-500/30">
                    1 Nether = 8 Overworld
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs mt-1">
                  <div className="bg-black/30 p-2.5 rounded border border-purple-500/20 font-mono-code">
                    <div className="text-zinc-400 text-[10px]">🚪 Origin Portal (Overworld):</div>
                    <div className="text-white font-bold text-xs sm:text-sm">
                      X: {activeRoute.origin.x}, Y: {activeRoute.origin.y}, Z: {activeRoute.origin.z}
                    </div>
                    <div className="text-purple-300 text-[10px] mt-0.5">
                      → Emerges in Nether at: ({activeRoute.portalOrigin?.x}, 70, {activeRoute.portalOrigin?.z})
                    </div>
                  </div>
                  <div className="bg-black/30 p-2.5 rounded border border-purple-500/20 font-mono-code">
                    <div className="text-zinc-400 text-[10px]">🚪 Dest Portal (Nether Shortcut):</div>
                    <div className="text-white font-bold text-xs sm:text-sm">
                      X: {activeRoute.portalDest?.x}, Y: 70, Z: {activeRoute.portalDest?.z}
                    </div>
                    <div className="text-emerald-300 text-[10px] mt-0.5">
                      → Emerges at destination: ({activeRoute.destination.x}, {activeRoute.destination.y}, {activeRoute.destination.z})
                    </div>
                  </div>
                </div>
              </div>

              {/* Turn-by-Turn Steps */}
              <div className="flex flex-col gap-1.5 mt-1">
                <h4 className="font-pixel text-[11px] text-zinc-300">TURN-BY-TURN DIRECTIVES:</h4>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {activeRoute.directions.map((d) => (
                    <div
                      key={`step-${d.step}`}
                      className="p-2 rounded bg-[#0d1017] border border-white/5 flex items-start gap-2.5 text-xs"
                    >
                      <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-bold text-[10px] shrink-0">
                        {d.step}
                      </span>
                      <div className="flex-1">
                        <div className="font-semibold text-white flex items-center gap-2">
                          {d.title}
                          {d.coords && (
                            <span className="font-mono-code text-[9px] text-amber-300 bg-amber-950/40 px-1.5 py-0.2 rounded border border-amber-500/30">
                              ({d.coords.x}, {d.coords.y}, {d.coords.z})
                            </span>
                          )}
                        </div>
                        <div className="text-zinc-400 text-[11px] mt-0.5">{d.detail}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-white/10 bg-[#161a27] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={copyRouteDetails}
              disabled={!activeRoute}
              className="px-3 py-1.5 bg-[#222838] hover:bg-[#2d354a] disabled:opacity-50 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied Route!' : copyError ? 'Copy Failed' : 'Copy Route'}
            </button>
            {onAddAsWaypoint && activeRoute && (
              <button
                onClick={() => onAddAsWaypoint(activeRoute.destination)}
                className="px-3 py-1.5 bg-[#222838] hover:bg-[#2d354a] text-purple-300 rounded text-xs font-semibold flex items-center gap-1.5 transition hidden sm:flex"
              >
                <MapPin className="w-3.5 h-3.5 text-purple-400" /> Save Dest Waypoint
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-pixel text-xs rounded transition"
          >
            DONE
          </button>
        </div>
      </div>
    </div>
  );
};
