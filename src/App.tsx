/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Dimension, Structure, Waypoint, DiamondVein, TravelRoute, SeedPreset, RoutePoint } from './types/minecraft';
import { WorldGenerator, PRESET_SEEDS } from './utils/seedGenerator';
import { TopNav } from './components/TopNav';
import { StructureSidebar } from './components/StructureSidebar';
import { MapCanvas } from './components/MapCanvas';
import { RoutePathfinder } from './components/RoutePathfinder';
import { DiamondScanner } from './components/DiamondScanner';
import { WaypointManager } from './components/WaypointManager';
import { ExportModal } from './components/ExportModal';
import { StructureInspector } from './components/StructureInspector';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { CoordinateSearchModal } from './components/CoordinateSearchModal';
import { BlueprintModal } from './components/BlueprintModal';
import { ChatOverlay } from './components/ChatOverlay';

import { ToastContainer, ToastMessage } from './components/Toast';

export default function App() {
  // Default verified seed: Coastal Haven God Seed (Bedrock 1.20+)
  const [seed, setSeed] = useState<string>('8624896');
  const [dimension, setDimension] = useState<Dimension>('overworld');
  
  // Toast notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((title: string, message?: string, type: 'success' | 'info' | 'warning' = 'success') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev.slice(-3), { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);
  
  // Modals & Panels
  const [showPathfinder, setShowPathfinder] = useState<boolean>(false);
  const [showDiamondScanner, setShowDiamondScanner] = useState<boolean>(false);
  const [showWaypoints, setShowWaypoints] = useState<boolean>(false);
  const [showCoordSearch, setShowCoordSearch] = useState<boolean>(false);
  const [showBlueprintModal, setShowBlueprintModal] = useState<boolean>(false);
  const [showExport, setShowExport] = useState<boolean>(false);
  const [showShortcuts, setShowShortcuts] = useState<boolean>(false);
  const [newWaypointCoords, setNewWaypointCoords] = useState<{ x: number; z: number } | null>(null);
  const [targetSearchCoord, setTargetSearchCoord] = useState<{ x: number; z: number; dimension: Dimension; label?: string } | null>(null);

  // Focus signals for hotkeys
  const [searchFocusSignal, setSearchFocusSignal] = useState<number>(0);
  const [mapFocusSignal, setMapFocusSignal] = useState<number>(0);

  // Map settings & layer toggles
  const [selectedStructure, setSelectedStructure] = useState<Structure | null>(null);
  const [activeRoute, setActiveRoute] = useState<TravelRoute | null>(null);
  const [showChunkGrid, setShowChunkGrid] = useState<boolean>(true);
  const [showDiamonds, setShowDiamonds] = useState<boolean>(true);
  const [showBiomeHeatmap, setShowBiomeHeatmap] = useState<boolean>(false);
  const [visibleCategories, setVisibleCategories] = useState<string[]>(['all']);
  const [selectedBiomeCategory, setSelectedBiomeCategory] = useState<string>('all');

  // Stored Custom Waypoints
  const [waypoints, setWaypoints] = useState<Waypoint[]>(() => {
    try {
      const saved = localStorage.getItem('mc_bedrock_waypoints');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [
      {
        id: 'wp-starter-base',
        name: 'Main Coastal Base',
        x: 110,
        y: 65,
        z: 75,
        dimension: 'overworld',
        color: '#ffaa00',
        icon: 'Home',
        tag: 'Base',
        notes: 'Ocean dock warehouse and automated crop farm',
        createdAt: Date.now(),
      },
    ];
  });

  // Save waypoints to localStorage safely
  useEffect(() => {
    try {
      localStorage.setItem('mc_bedrock_waypoints', JSON.stringify(waypoints));
    } catch {
      // ignore storage errors
    }
  }, [waypoints]);

  // World Generator for the active seed
  const generator = useMemo(() => new WorldGenerator(seed), [seed]);

  // Active Seed Preset (if matching a verified preset)
  const currentPreset = useMemo(
    () => PRESET_SEEDS.find((p) => p.seed === seed),
    [seed]
  );

  // Retrieve structures for current dimension
  const structures = useMemo(
    () => generator.getStructures(dimension),
    [generator, dimension]
  );

  // Diamond veins scanned around spawn point
  const diamondVeins = useMemo(
    () => generator.scanDiamondVeins(0, 0, 10),
    [generator]
  );

  // Clear stale state when seed changes
  const handleSeedChange = useCallback((newSeed: string) => {
    setSeed(newSeed);
    setSelectedStructure(null);
    setActiveRoute(null);
  }, []);

  // Global Keyboard Shortcuts Handler
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInputActive = 
        activeEl?.tagName === 'INPUT' || 
        activeEl?.tagName === 'TEXTAREA' || 
        activeEl?.tagName === 'SELECT' || 
        activeEl?.getAttribute('contenteditable') === 'true';

      // Always handle Escape
      if (e.key === 'Escape') {
        if (showPathfinder || showDiamondScanner || showWaypoints || showCoordSearch || showBlueprintModal || showExport || showShortcuts) {
          setShowPathfinder(false);
          setShowDiamondScanner(false);
          setShowWaypoints(false);
          setShowCoordSearch(false);
          setShowBlueprintModal(false);
          setShowExport(false);
          setShowShortcuts(false);
          return;
        }
        if (selectedStructure) {
          setSelectedStructure(null);
          return;
        }
        return;
      }

      // If user is currently typing in an input/textarea, do not trigger single-letter shortcuts
      if (isInputActive) {
        return;
      }

      // K -> Toggle Structure Blueprint Inspector & Locator
      if (e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        setShowBlueprintModal((prev) => !prev);
        setShowWaypoints(false);
        setShowDiamondScanner(false);
        setShowPathfinder(false);
        setShowCoordSearch(false);
        setShowExport(false);
        setShowShortcuts(false);
        return;
      }

      // S or / -> Focus Search bar in Structure Sidebar
      if (e.key === 's' || e.key === 'S' || e.key === '/') {
        e.preventDefault();
        setSearchFocusSignal(Date.now());
        return;
      }

      // C -> Toggle Coordinate Search & Nether Link in Both Worlds
      if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        setShowCoordSearch((prev) => !prev);
        setShowWaypoints(false);
        setShowDiamondScanner(false);
        setShowPathfinder(false);
        setShowExport(false);
        setShowShortcuts(false);
        return;
      }

      // M -> Focus & Reset Map camera to Spawn
      if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        (document.activeElement as HTMLElement)?.blur();
        setMapFocusSignal(Date.now());
        return;
      }

      // W -> Toggle Waypoints Manager
      if (e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        setShowWaypoints((prev) => !prev);
        setShowDiamondScanner(false);
        setShowPathfinder(false);
        setShowCoordSearch(false);
        setShowExport(false);
        setShowShortcuts(false);
        return;
      }

      // D -> Toggle Diamond Scanner
      if (e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        setShowDiamondScanner((prev) => !prev);
        setShowWaypoints(false);
        setShowPathfinder(false);
        setShowCoordSearch(false);
        setShowExport(false);
        setShowShortcuts(false);
        return;
      }

      // B -> Toggle Biome Heatmap
      if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        setShowBiomeHeatmap((prev) => !prev);
        return;
      }

      // R -> Toggle Route Pathfinder
      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        setShowPathfinder((prev) => !prev);
        setShowWaypoints(false);
        setShowDiamondScanner(false);
        setShowCoordSearch(false);
        setShowExport(false);
        setShowShortcuts(false);
        return;
      }

      // E -> Toggle Export Dialog
      if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        setShowExport((prev) => !prev);
        setShowWaypoints(false);
        setShowDiamondScanner(false);
        setShowPathfinder(false);
        setShowCoordSearch(false);
        setShowShortcuts(false);
        return;
      }

      // ? or H -> Toggle Keyboard Shortcuts Guide
      if (e.key === '?' || e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        setShowShortcuts((prev) => !prev);
        return;
      }

      // 1 / 2 / 3 -> Quick Dimension Switching
      if (e.key === '1') {
        e.preventDefault();
        setDimension('overworld');
        return;
      }
      if (e.key === '2') {
        e.preventDefault();
        setDimension('nether');
        return;
      }
      if (e.key === '3') {
        e.preventDefault();
        setDimension('the_end');
        return;
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [showPathfinder, showDiamondScanner, showWaypoints, showCoordSearch, showExport, showShortcuts, selectedStructure]);

  // Handle navigating to searched coordinates in either world
  const handleNavigateToCoords = useCallback((target: { x: number; z: number; dimension: Dimension }) => {
    setDimension(target.dimension);
    setTargetSearchCoord({
      x: target.x,
      z: target.z,
      dimension: target.dimension,
      label: `Target (${target.x}, ${target.z})`,
    });
    addToast('Target Focused', `Centered map at ${target.dimension.toUpperCase()} X:${target.x} Z:${target.z}`, 'info');
  }, [addToast]);

  const handleUpdateWaypoint = useCallback((updatedWp: Waypoint) => {
    setWaypoints((prev) => prev.map((w) => w.id === updatedWp.id ? updatedWp : w));
    addToast('Waypoint Updated', `Updated "${updatedWp.name}"`, 'success');
  }, [addToast]);

  // Handle setting active route to structure
  const handlePlotRouteToStructure = useCallback((target: Structure) => {
    const origin: RoutePoint = {
      id: 'spawn',
      name: 'Spawn Point',
      x: 0,
      y: 68,
      z: 0,
      dimension: 'overworld',
    };
    const dest: RoutePoint = {
      id: target.id,
      name: target.name,
      x: target.x,
      y: target.y,
      z: target.z,
      dimension: target.dimension,
    };
    const route = generator.calculateRoute(origin, dest);
    setActiveRoute(route);
    setSelectedStructure(target);
    setShowPathfinder(true);
  }, [generator]);

  // Handle adding waypoint at map coordinate
  const handleAddWaypointAtCoords = useCallback((coords: { x: number; z: number }) => {
    setNewWaypointCoords(coords);
    setShowWaypoints(true);
  }, []);

  const handleAddWaypoint = (newWp: Omit<Waypoint, 'id' | 'createdAt'>) => {
    const wp: Waypoint = {
      ...newWp,
      id: `wp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: Date.now(),
    };
    setWaypoints((prev) => [wp, ...prev]);
    setNewWaypointCoords(null);
    addToast('Waypoint Saved', `Saved "${wp.name}" to browser storage`, 'success');
  };

  const handleDeleteWaypoint = (id: string) => {
    const target = waypoints.find(w => w.id === id);
    setWaypoints((prev) => prev.filter((w) => w.id !== id));
    addToast('Waypoint Removed', target ? `Deleted "${target.name}"` : undefined, 'info');
  };

  const handleSelectWaypoint = (wp: Waypoint) => {
    setDimension(wp.dimension);
    setSelectedStructure({
      id: wp.id,
      name: wp.name,
      type: 'waypoint',
      category: 'survival_starter',
      dimension: wp.dimension,
      x: wp.x,
      y: wp.y,
      z: wp.z,
      biome: 'Custom Pin',
      icon: 'MapPin',
      color: wp.color,
      description: wp.notes || 'User marked custom waypoint',
      keyLoot: [],
      verified: false,
      status: 'user_waypoint',
    });
  };

  return (
    <div className="flex flex-col w-screen h-screen bg-[#090b10] text-white overflow-hidden select-none font-sans">
      {/* Top Navigation */}
      <TopNav
        currentSeed={seed}
        onSeedChange={handleSeedChange}
        dimension={dimension}
        onDimensionChange={(newDim) => {
          setDimension(newDim);
          setSelectedStructure(null);
        }}
        onOpenPathfinder={() => setShowPathfinder(true)}
        onOpenDiamondScanner={() => setShowDiamondScanner(true)}
        onOpenWaypoints={() => {
          setNewWaypointCoords(null);
          setShowWaypoints(true);
        }}
        onOpenCoordSearch={() => setShowCoordSearch(true)}
        onOpenBlueprints={() => setShowBlueprintModal(true)}
        onOpenExport={() => setShowExport(true)}
        onOpenShortcuts={() => setShowShortcuts(true)}
        diamondCount={diamondVeins.length}
      />

      {/* Main Workspace: Sidebar + Map Canvas */}
      <main className="flex-1 flex overflow-hidden relative">
        <StructureSidebar
          structures={structures}
          dimension={dimension}
          selectedStructure={selectedStructure}
          onSelectStructure={(s) => setSelectedStructure(s)}
          onPlotRoute={handlePlotRouteToStructure}
          showChunkGrid={showChunkGrid}
          onToggleChunkGrid={() => setShowChunkGrid(!showChunkGrid)}
          showDiamonds={showDiamonds}
          onToggleDiamonds={() => setShowDiamonds(!showDiamonds)}
          showBiomeHeatmap={showBiomeHeatmap}
          onToggleBiomeHeatmap={() => setShowBiomeHeatmap(!showBiomeHeatmap)}
          visibleCategories={visibleCategories}
          onChangeCategories={setVisibleCategories}
          selectedBiomeCategory={selectedBiomeCategory}
          onSelectBiomeCategory={setSelectedBiomeCategory}
          searchFocusSignal={searchFocusSignal}
          onOpenCoordSearch={() => setShowCoordSearch(true)}
          onOpenBlueprints={() => setShowBlueprintModal(true)}
        />

        <div className="flex-1 relative h-full">
          <MapCanvas
            generator={generator}
            dimension={dimension}
            structures={structures}
            waypoints={waypoints}
            diamondVeins={diamondVeins}
            activeRoute={activeRoute}
            selectedStructure={selectedStructure}
            onSelectStructure={setSelectedStructure}
            onAddWaypointAtCoords={handleAddWaypointAtCoords}
            showChunkGrid={showChunkGrid}
            showDiamonds={showDiamonds}
            showBiomeHeatmap={showBiomeHeatmap}
            visibleCategories={visibleCategories}
            selectedBiomeCategory={selectedBiomeCategory}
            mapFocusSignal={mapFocusSignal}
            targetSearchCoord={targetSearchCoord}
            onClearSearchCoord={() => setTargetSearchCoord(null)}
          />

          {/* Floating Structure Inspector */}
          {selectedStructure && (
            <StructureInspector
              structure={selectedStructure}
              onSetRouteToStructure={handlePlotRouteToStructure}
              onAddAsWaypoint={(s) => {
                handleAddWaypoint({
                  name: s.name,
                  x: s.x,
                  y: s.y,
                  z: s.z,
                  dimension: s.dimension,
                  color: s.color,
                  icon: s.icon || 'compass',
                  tag: 'Custom',
                  notes: s.description,
                });
              }}
              onClose={() => setSelectedStructure(null)}
            />
          )}
        </div>
      </main>

      {/* Modals & Dialogs */}
      {showCoordSearch && (
        <CoordinateSearchModal
          generator={generator}
          currentDimension={dimension}
          onNavigateToCoords={handleNavigateToCoords}
          onAddWaypoint={(coords) => {
            setDimension(coords.dimension);
            setNewWaypointCoords({ x: coords.x, z: coords.z });
            setShowWaypoints(true);
          }}
          onPlotRoute={(target) => {
            const origin: RoutePoint = {
              id: 'spawn',
              name: 'Spawn Point',
              x: 0,
              y: 68,
              z: 0,
              dimension: 'overworld',
            };
            const dest: RoutePoint = {
              id: `coord-${target.x}-${target.z}`,
              name: target.name,
              x: target.x,
              y: 68,
              z: target.z,
              dimension: target.dimension,
            };
            const route = generator.calculateRoute(origin, dest);
            setActiveRoute(route);
            setShowPathfinder(true);
          }}
          onClose={() => setShowCoordSearch(false)}
        />
      )}

      {showPathfinder && (
        <RoutePathfinder
          generator={generator}
          structures={structures}
          waypoints={waypoints}
          activeRoute={activeRoute}
          onSetRoute={setActiveRoute}
          onAddAsWaypoint={(dest) => {
            handleAddWaypoint({
              name: dest.name,
              x: dest.x,
              y: dest.y,
              z: dest.z,
              dimension: dest.dimension,
              color: '#10b981',
              icon: 'Navigation',
              tag: 'Custom',
              notes: 'Saved destination from Route Pathfinder',
            });
          }}
          onClose={() => setShowPathfinder(false)}
        />
      )}

      {showDiamondScanner && (
        <DiamondScanner
          diamondVeins={diamondVeins}
          onSelectVein={(vein) => {
            setShowDiamondScanner(false);
            setDimension('overworld');
            setSelectedStructure({
              id: vein.id,
              name: `Diamond Vein (${vein.size}x)`,
              type: 'diamond_ore',
              category: 'underground',
              dimension: 'overworld',
              x: vein.x,
              y: vein.y,
              z: vein.z,
              biome: 'Deepslate',
              icon: 'Sparkles',
              color: '#06b6d4',
              description: `Deepslate diamond cluster of ${vein.size} ores at Y=${vein.y}.${vein.exposed ? ' Located in cave chamber.' : ' Embedded in deepslate wall.'}`,
              keyLoot: [`${vein.size}x Raw Diamonds`, 'Deepslate'],
              verified: false,
              status: 'estimated',
            });
          }}
          onClose={() => setShowDiamondScanner(false)}
        />
      )}

      {showWaypoints && (
        <WaypointManager
          waypoints={waypoints}
          currentDimension={dimension}
          initialCoords={newWaypointCoords}
          onAddWaypoint={handleAddWaypoint}
          onUpdateWaypoint={handleUpdateWaypoint}
          onDeleteWaypoint={handleDeleteWaypoint}
          onSelectWaypoint={handleSelectWaypoint}
          onClose={() => {
            setShowWaypoints(false);
            setNewWaypointCoords(null);
          }}
        />
      )}

      {showExport && (
        <ExportModal
          seed={seed}
          preset={currentPreset}
          structures={structures}
          diamondVeins={diamondVeins}
          waypoints={waypoints}
          onClose={() => setShowExport(false)}
        />
      )}

      {showBlueprintModal && (
        <BlueprintModal
          isOpen={showBlueprintModal}
          onClose={() => setShowBlueprintModal(false)}
          structures={structures}
          activeDimension={dimension}
          currentSeed={seed}
          onLocateOnMap={(struct) => {
            setShowBlueprintModal(false);
            setDimension(struct.dimension);
            setSelectedStructure(struct);
            setTargetSearchCoord({
              x: struct.x,
              z: struct.z,
              dimension: struct.dimension,
              label: struct.name,
            });
            addToast('Located on Map Canvas', `Gliding camera to ${struct.name} at (${struct.x}, ${struct.y}, ${struct.z})`);
          }}
          onAddWaypoint={handleAddWaypoint}
        />
      )}

      <ChatOverlay mapContext={{ seed, dimension, structures: structures.slice(0, 10) }} />

      {showShortcuts && (
        <KeyboardShortcutsModal
          onClose={() => setShowShortcuts(false)}
        />
      )}

      {/* Smooth Toast Notification Stack */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
