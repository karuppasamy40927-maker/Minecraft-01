import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Dimension, Structure, Waypoint, DiamondVein, TravelRoute } from '../types/minecraft';
import { WorldGenerator } from '../utils/seedGenerator';
import { drawMinecraftWaypointGlyph } from '../utils/waypointIcons';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Crosshair, 
  Compass, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  ShieldCheck, 
  AlertCircle,
  Palette,
  Thermometer,
  X as CloseIcon,
  Flame,
  Sparkles,
  Globe2,
  Target,
} from 'lucide-react';

interface MapCanvasProps {
  generator: WorldGenerator;
  dimension: Dimension;
  structures: Structure[];
  waypoints: Waypoint[];
  diamondVeins: DiamondVein[];
  activeRoute: TravelRoute | null;
  selectedStructure: Structure | null;
  onSelectStructure: (structure: Structure | null) => void;
  onAddWaypointAtCoords: (coords: { x: number; z: number }) => void;
  showChunkGrid: boolean;
  showDiamonds: boolean;
  showBiomeHeatmap?: boolean;
  visibleCategories: string[];
  selectedBiomeCategory: string;
  mapFocusSignal?: number;
  targetSearchCoord?: { x: number; z: number; dimension: Dimension; label?: string } | null;
  onClearSearchCoord?: () => void;
}

const HEATMAP_PALETTE = {
  Temperate: '#39ff14', // Acid Green
  Mountain: '#ff00ff',  // Vibrant Magenta
  Aquatic: '#00f5ff',   // Electric Cyan
  Arid: '#ff00ff',      // Vibrant Magenta
  Cold: '#00f5ff',      // Electric Cyan
  Nether: '#ff00ff',    // Vibrant Magenta
  End: '#39ff14',       // Acid Green
};

export const MapCanvas: React.FC<MapCanvasProps> = ({
  generator,
  dimension,
  structures,
  waypoints,
  diamondVeins,
  activeRoute,
  selectedStructure,
  onSelectStructure,
  onAddWaypointAtCoords,
  showChunkGrid,
  showDiamonds,
  showBiomeHeatmap = false,
  visibleCategories,
  selectedBiomeCategory,
  mapFocusSignal,
  targetSearchCoord,
  onClearSearchCoord,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);

  // Memoized Offscreen Canvas for heavy Biome & Terrain layer caching
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isTerrainDirtyRef = useRef(true);
  const isOverlayDirtyRef = useRef(true);
  const rafIdRef = useRef<number | null>(null);

  // Camera State with Smooth Interpolation & Momentum Physics
  const [displayCamera, setDisplayCamera] = useState({ x: 0, z: 0, zoom: 0.8 });
  const currentCameraRef = useRef({ x: 0, z: 0, zoom: 0.8 });
  const targetCameraRef = useRef({ x: 0, z: 0, zoom: 0.8 });
  const velocityRef = useRef({ vx: 0, vz: 0 });
  const lastDragTimeRef = useRef(0);
  const lastDragPosRef = useRef({ x: 0, y: 0 });

  // Animation Timers & Marching Ants Offset
  const animTimeRef = useRef(0);
  const routeDashOffsetRef = useRef(0);

  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);
  isDraggingRef.current = isDragging;

  const dragStartRef = useRef({ x: 0, y: 0 });
  const hasMovedDragRef = useRef(false);
  const pointerDownPosRef = useRef({ x: 0, y: 0 });
  const touchDistanceRef = useRef<number | null>(null);

  // Throttled HUD coordinates
  const [hoverCoords, setHoverCoords] = useState<{ 
    x: number; 
    z: number; 
    biome: string; 
    color: string;
    category: string;
    temperature: number;
    humidity: number;
  } | null>(null);
  
  const [hoveredStructure, setHoveredStructure] = useState<Structure | null>(null);
  const hoveredStructureRef = useRef<Structure | null>(null);
  hoveredStructureRef.current = hoveredStructure;

  const [showLegend, setShowLegend] = useState(false);
  const [isHeatmapLegendCollapsed, setIsHeatmapLegendCollapsed] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  // Smooth Dimension Transition Animation State
  const [dimensionTransition, setDimensionTransition] = useState<{
    active: boolean;
    to: Dimension;
    from: Dimension | null;
  }>({
    active: false,
    to: dimension,
    from: null,
  });
  const prevDimensionRef = useRef<Dimension>(dimension);

  // Smooth Target Coordinate Lock-On Reticle & Ambient Glow State
  const [targetLockOn, setTargetLockOn] = useState<{
    active: boolean;
    label: string;
    coords: { x: number; z: number };
    id: number;
  } | null>(null);

  // Trigger smooth dimension warp animation on dimension switch
  useEffect(() => {
    if (prevDimensionRef.current !== dimension) {
      const fromDim = prevDimensionRef.current;
      prevDimensionRef.current = dimension;
      setDimensionTransition({
        active: true,
        to: dimension,
        from: fromDim,
      });

      const timer = setTimeout(() => {
        setDimensionTransition((prev) => ({ ...prev, active: false }));
      }, 750);

      return () => clearTimeout(timer);
    }
  }, [dimension]);

  // Mark terrain as dirty when visual terrain properties change
  useEffect(() => {
    isTerrainDirtyRef.current = true;
    isOverlayDirtyRef.current = true;
  }, [
    dimension, 
    generator, 
    showChunkGrid, 
    showBiomeHeatmap, 
    selectedBiomeCategory
  ]);

  // Mark overlay as dirty when lightweight UI elements/waypoints change
  useEffect(() => {
    isOverlayDirtyRef.current = true;
  }, [
    structures, 
    waypoints, 
    diamondVeins, 
    activeRoute, 
    selectedStructure, 
    hoveredStructure, 
    showDiamonds, 
    visibleCategories,
    targetSearchCoord
  ]);

  // Handle external Map Focus Signal (Hot-key 'M') with smooth glide and target lock-on
  useEffect(() => {
    if (mapFocusSignal && mapFocusSignal > 0) {
      targetCameraRef.current = { x: 0, z: 0, zoom: 0.8 };
      canvasRef.current?.focus();

      setTargetLockOn({
        active: true,
        label: 'World Spawn (0, 0)',
        coords: { x: 0, z: 0 },
        id: Date.now(),
      });
      const timer = setTimeout(() => {
        setTargetLockOn((prev) => (prev ? { ...prev, active: false } : null));
      }, 1400);
      return () => clearTimeout(timer);
    }
  }, [mapFocusSignal]);

  // Smoothly glide camera and trigger lock-on when selected structure changes
  useEffect(() => {
    if (selectedStructure && selectedStructure.dimension === dimension) {
      targetCameraRef.current = {
        ...targetCameraRef.current,
        x: selectedStructure.x,
        z: selectedStructure.z,
        zoom: 2.0, // Tighter zoom for structure focus
      };

      setTargetLockOn({
        active: true,
        label: selectedStructure.name,
        coords: { x: selectedStructure.x, z: selectedStructure.z },
        id: Date.now(),
      });
      const timer = setTimeout(() => {
        setTargetLockOn((prev) => (prev ? { ...prev, active: false } : null));
      }, 1400);
      return () => clearTimeout(timer);
    }
  }, [selectedStructure, dimension]);

  // Smoothly glide camera and trigger lock-on when target search coordinates change
  useEffect(() => {
    if (targetSearchCoord && targetSearchCoord.dimension === dimension) {
      targetCameraRef.current = {
        ...targetCameraRef.current,
        x: targetSearchCoord.x,
        z: targetSearchCoord.z,
      };
      isTerrainDirtyRef.current = true;
      isOverlayDirtyRef.current = true;

      setTargetLockOn({
        active: true,
        label: targetSearchCoord.label || 'Target Location',
        coords: { x: targetSearchCoord.x, z: targetSearchCoord.z },
        id: Date.now(),
      });
      const timer = setTimeout(() => {
        setTargetLockOn((prev) => (prev ? { ...prev, active: false } : null));
      }, 1400);
      return () => clearTimeout(timer);
    }
  }, [targetSearchCoord, dimension]);

  // Convert screen mouse coordinates to Minecraft block coordinates
  const screenToWorld = useCallback((screenX: number, screenY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, z: 0 };
    const rect = canvas.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const blockX = Math.round(currentCameraRef.current.x + (screenX - cx) / currentCameraRef.current.zoom);
    const blockZ = Math.round(currentCameraRef.current.z + (screenY - cy) / currentCameraRef.current.zoom);
    return { x: blockX, z: blockZ };
  }, []);

  // Convert Minecraft block coordinates to screen coordinates
  const worldToScreen = useCallback((blockX: number, blockZ: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const sx = cx + (blockX - currentCameraRef.current.x) * currentCameraRef.current.zoom;
    const sy = cy + (blockZ - currentCameraRef.current.z) * currentCameraRef.current.zoom;
    return { x: sx, y: sy };
  }, []);

  // Render Heavy Biome Terrain & Chunk Grid to Offscreen Canvas Buffer
  const renderTerrainLayer = useCallback((width: number, height: number, dpr: number) => {
    if (width <= 0 || height <= 0) return;

    if (!offscreenCanvasRef.current) {
      offscreenCanvasRef.current = document.createElement('canvas');
    }
    const offCanvas = offscreenCanvasRef.current;
    const targetW = Math.max(1, Math.round(width * dpr));
    const targetH = Math.max(1, Math.round(height * dpr));

    if (offCanvas.width !== targetW || offCanvas.height !== targetH) {
      offCanvas.width = targetW;
      offCanvas.height = targetH;
    }

    const ctx = offCanvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    ctx.save();
    ctx.scale(dpr, dpr);

    // Clear background
    ctx.fillStyle = dimension === 'nether' ? '#120505' : dimension === 'the_end' ? '#090712' : '#0b0d14';
    ctx.fillRect(0, 0, width, height);

    const cam = currentCameraRef.current;
    const cx = width / 2;
    const cy = height / 2;
    const camX = cam.x;
    const camZ = cam.z;
    const zoom = cam.zoom;

    // Adaptive resolution step based on zoom level for higher detail
    let blockSize = 16;
    if (zoom > 3.0) blockSize = 2; // Extra detail
    else if (zoom > 1.5) blockSize = 4;
    else if (zoom > 0.5) blockSize = 8;
    else blockSize = 16;

    const startWorldX = Math.round(camX - cx / zoom);
    const endWorldX = Math.round(camX + cx / zoom);
    const startWorldZ = Math.round(camZ - cy / zoom);
    const endWorldZ = Math.round(camZ + cy / zoom);

    const startX = Math.floor(startWorldX / blockSize) * blockSize;
    const endX = Math.ceil(endWorldX / blockSize) * blockSize;
    const startZ = Math.floor(startWorldZ / blockSize) * blockSize;
    const endZ = Math.ceil(endWorldZ / blockSize) * blockSize;

    const pixelScreenSize = Math.max(1, Math.ceil(blockSize * zoom) + 1);

    // Render Biome Tiles
    for (let x = startX; x <= endX; x += blockSize) {
      const sx = cx + (x - camX) * zoom;
      for (let z = startZ; z <= endZ; z += blockSize) {
        const biome = generator.getBiome(x, z, dimension);
        const sy = cy + (z - camZ) * zoom;
        const defaultColor = biome?.color || '#8ab644';
        const biomeCat = biome?.category || 'Temperate';

        let tileColor = defaultColor;
        if (showBiomeHeatmap) {
          tileColor = HEATMAP_PALETTE[biomeCat as keyof typeof HEATMAP_PALETTE] || defaultColor;
        }

        const isMatchedCategory = selectedBiomeCategory === 'all' || biomeCat === selectedBiomeCategory;

        if (isMatchedCategory) {
          ctx.fillStyle = tileColor;
          ctx.globalAlpha = 0.8; 
        } else {
          ctx.fillStyle = tileColor;
          ctx.globalAlpha = 0.15; 
        }

        ctx.fillRect(sx, sy, pixelScreenSize, pixelScreenSize);
        ctx.globalAlpha = 1.0;
      }
    }

    // Grid overlays (Chunk Grid 16x16)
    if (showChunkGrid && zoom >= 0.35) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;

      const chunkStartX = Math.floor(startWorldX / 16) * 16;
      const chunkEndX = Math.ceil(endWorldX / 16) * 16;
      const chunkStartZ = Math.floor(startWorldZ / 16) * 16;
      const chunkEndZ = Math.ceil(endWorldZ / 16) * 16;

      const topY = cy + (startWorldZ - camZ) * zoom;
      const bottomY = cy + (endWorldZ - camZ) * zoom;
      const leftX = cx + (startWorldX - camX) * zoom;
      const rightX = cx + (endWorldX - camX) * zoom;

      ctx.beginPath();
      for (let chX = chunkStartX; chX <= chunkEndX; chX += 16) {
        const lineX = cx + (chX - camX) * zoom;
        ctx.moveTo(lineX, topY);
        ctx.lineTo(lineX, bottomY);
      }
      for (let chZ = chunkStartZ; chZ <= chunkEndZ; chZ += 16) {
        const lineY = cy + (chZ - camZ) * zoom;
        ctx.moveTo(leftX, lineY);
        ctx.lineTo(rightX, lineY);
      }
      ctx.stroke();
    }

    // Major Coordinate Axes (X=0, Z=0)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1.5;
    const axisX = cx - camX * zoom;
    const axisY = cy - camZ * zoom;
    ctx.beginPath();
    ctx.moveTo(axisX, 0);
    ctx.lineTo(axisX, height);
    ctx.moveTo(0, axisY);
    ctx.lineTo(width, axisY);
    ctx.stroke();

    ctx.restore();
    isTerrainDirtyRef.current = false;
  }, [
    dimension, 
    generator, 
    showChunkGrid, 
    showBiomeHeatmap, 
    selectedBiomeCategory
  ]);

  // Main RAF Render Loop: Combines Cached Terrain Blit + Animated Overlays
  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = container.clientWidth;
    const height = container.clientHeight;

    if (width <= 0 || height <= 0) return;

    const targetWidth = Math.max(1, Math.round(width * dpr));
    const targetHeight = Math.max(1, Math.round(height * dpr));

    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      isTerrainDirtyRef.current = true;
    }

    // 1. Redraw offscreen terrain buffer if camera moved or settings changed
    if (isTerrainDirtyRef.current || !offscreenCanvasRef.current) {
      renderTerrainLayer(width, height, dpr);
    }

    // 2. Blit offscreen terrain canvas onto main canvas (<0.05ms GPU transfer)
    ctx.save();
    ctx.scale(dpr, dpr);

    if (
      offscreenCanvasRef.current &&
      offscreenCanvasRef.current.width > 0 &&
      offscreenCanvasRef.current.height > 0
    ) {
      ctx.drawImage(offscreenCanvasRef.current, 0, 0, width, height);
    }

    const cam = currentCameraRef.current;
    const cx = width / 2;
    const cy = height / 2;
    const camX = cam.x;
    const camZ = cam.z;
    const zoom = cam.zoom;
    const time = animTimeRef.current;

    // 3. Render Procedural Diamond Veins with subtle glimmer pulse
    if (showDiamonds && dimension === 'overworld') {
      const diamondGlow = Math.sin(time * 3) * 0.2 + 0.8;
      diamondVeins.forEach((vein) => {
        const sx = cx + (vein.x - camX) * zoom;
        const sy = cy + (vein.z - camZ) * zoom;
        if (sx < -30 || sx > width + 30 || sy < -30 || sy > height + 30) return;

        ctx.save();
        ctx.fillStyle = '#06b6d4';
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 8 * diamondGlow;
        ctx.beginPath();
        ctx.arc(sx, sy, Math.max(3, 4 * Math.min(2, zoom)) * diamondGlow, 0, Math.PI * 2);
        ctx.fill();

        if (zoom >= 1.2) {
          ctx.font = '10px "JetBrains Mono", monospace';
          ctx.fillStyle = '#55ffff';
          ctx.fillText(`Y:${vein.y} (${vein.size}x)`, sx + 8, sy + 3);
        }
        ctx.restore();
      });
    }

    // 4. Render Active Route with Animated Marching Ants & Traveling Pulse Particle
    if (activeRoute) {
      const isRouteInThisDim = 
        activeRoute.origin.dimension === dimension && 
        activeRoute.destination.dimension === dimension;

      if (isRouteInThisDim) {
        const originX = cx + (activeRoute.origin.x - camX) * zoom;
        const originY = cy + (activeRoute.origin.z - camZ) * zoom;
        const destX = cx + (activeRoute.destination.x - camX) * zoom;
        const destY = cy + (activeRoute.destination.z - camZ) * zoom;

        // Animated dashed line (marching ants effect)
        ctx.save();
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 3;
        ctx.lineDashOffset = -routeDashOffsetRef.current;
        ctx.setLineDash([8, 6]);
        ctx.beginPath();
        ctx.moveTo(originX, originY);
        ctx.lineTo(destX, destY);
        ctx.stroke();
        ctx.restore();

        // Traveling particle along route
        const routeProgress = (time * 0.4) % 1;
        const travelPx = originX + (destX - originX) * routeProgress;
        const travelPy = originY + (destY - originY) * routeProgress;

        ctx.save();
        ctx.fillStyle = '#6ee7b7';
        ctx.shadowColor = '#10b981';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(travelPx, travelPy, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Origin & Destination Rings
        ctx.save();
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(originX, originY, 8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        ctx.save();
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(destX, destY, 12, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }

    // 5. Render Structures with Animated Radar Rings on Selection
    const filteredStructures = structures.filter((s) => {
      if (s.dimension !== dimension) return false;
      if (visibleCategories.includes('all')) return true;
      return visibleCategories.includes(s.category);
    });

    filteredStructures.forEach((struct) => {
      const sx = cx + (struct.x - camX) * zoom;
      const sy = cy + (struct.z - camZ) * zoom;
      if (sx < -80 || sx > width + 80 || sy < -80 || sy > height + 80) return;

      const isSelected = selectedStructure?.id === struct.id;
      const isHovered = hoveredStructureRef.current?.id === struct.id;

      ctx.save();

      // Animated Expanding Radar Ping for Selected Structure
      if (isSelected) {
        const pingProgress = (time * 1.5) % 1;
        const pingRadius = 15 + pingProgress * 28;
        const pingOpacity = 1 - pingProgress;

        ctx.save();
        ctx.strokeStyle = `rgba(16, 185, 129, ${pingOpacity * 0.8})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(sx, sy, pingRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Pin badge
      const baseRadius = isSelected ? 15 : isHovered ? 13 : 11;
      const radius = isSelected ? baseRadius + Math.sin(time * 4) * 1 : baseRadius;

      ctx.beginPath();
      ctx.arc(sx, sy, radius, 0, Math.PI * 2);
      ctx.fillStyle = struct.color || '#ffaa00';
      ctx.shadowColor = isSelected ? '#10b981' : 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = isSelected ? 16 : 6;
      ctx.fill();

      // Inner border
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.strokeStyle = isSelected ? '#ffffff' : '#0c0d12';
      ctx.stroke();

      // Initial Letter
      ctx.font = 'bold 10px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#0c0d12';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(struct.name.charAt(0).toUpperCase(), sx, sy);

      // Label on hover or high zoom or selection
      if (isSelected || isHovered || zoom >= 0.7) {
        ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
        const label = struct.name;
        const textWidth = ctx.measureText(label).width;

        ctx.fillStyle = 'rgba(12, 14, 20, 0.95)';
        ctx.strokeStyle = isSelected ? '#10b981' : struct.color || '#ffaa00';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(sx - textWidth / 2 - 6, sy + radius + 4, textWidth + 12, 20, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, sx, sy + radius + 14);

        if (isSelected || isHovered) {
          const coordText = `X:${struct.x}, Y:${struct.y}, Z:${struct.z}`;
          const cWidth = ctx.measureText(coordText).width;
          ctx.fillStyle = 'rgba(12, 14, 20, 0.95)';
          ctx.beginPath();
          ctx.roundRect(sx - cWidth / 2 - 6, sy + radius + 26, cWidth + 12, 18, 4);
          ctx.fill();

          ctx.font = '9px "JetBrains Mono", monospace';
          ctx.fillStyle = '#38bdf8';
          ctx.fillText(coordText, sx, sy + radius + 35);
        }
      }

      ctx.restore();
    });

    // 6. Render Custom Waypoints with Minecraft-Themed Vector Glyphs
    waypoints.filter(w => w.dimension === dimension).forEach((wp) => {
      const sx = cx + (wp.x - camX) * zoom;
      const sy = cy + (wp.z - camZ) * zoom;
      if (sx < -60 || sx > width + 60 || sy < -60 || sy > height + 60) return;

      const isSelected = selectedStructure?.id === wp.id;
      const isHovered = hoveredStructureRef.current?.id === wp.id;

      ctx.save();

      // Pulsing Radar Ping on Selection
      if (isSelected) {
        const pingProgress = (time * 1.5) % 1;
        const pingRadius = 16 + pingProgress * 26;
        const pingOpacity = 1 - pingProgress;

        ctx.save();
        ctx.strokeStyle = `rgba(168, 85, 247, ${pingOpacity * 0.8})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(sx, sy, pingRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Pin badge circle
      const baseRadius = isSelected ? 15 : isHovered ? 14 : 12;
      const radius = isSelected ? baseRadius + Math.sin(time * 4) * 1 : baseRadius;

      ctx.beginPath();
      ctx.arc(sx, sy, radius, 0, Math.PI * 2);
      ctx.fillStyle = wp.color || '#a855f7';
      ctx.shadowColor = isSelected ? '#a855f7' : 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = isSelected ? 16 : 8;
      ctx.fill();

      // White or metallic border
      ctx.lineWidth = isSelected ? 2.5 : 1.8;
      ctx.strokeStyle = isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.9)';
      ctx.stroke();

      // Draw the crisp Minecraft vector glyph inside the badge!
      drawMinecraftWaypointGlyph(ctx, wp.icon || 'compass', sx, sy, radius);

      // Label below badge on hover, selection, or reasonable zoom
      if (isSelected || isHovered || zoom >= 0.6) {
        ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
        const label = wp.tag ? `[${wp.tag}] ${wp.name}` : wp.name;
        const textWidth = ctx.measureText(label).width;

        ctx.fillStyle = 'rgba(12, 14, 20, 0.95)';
        ctx.strokeStyle = isSelected ? '#a855f7' : wp.color || '#a855f7';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(sx - textWidth / 2 - 6, sy + radius + 4, textWidth + 12, 20, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, sx, sy + radius + 14);

        if (isSelected || isHovered) {
          const coordText = `X:${wp.x}, Y:${wp.y}, Z:${wp.z}`;
          const cWidth = ctx.measureText(coordText).width;
          ctx.fillStyle = 'rgba(12, 14, 20, 0.95)';
          ctx.beginPath();
          ctx.roundRect(sx - cWidth / 2 - 6, sy + radius + 26, cWidth + 12, 18, 4);
          ctx.fill();

          ctx.font = '9px "JetBrains Mono", monospace';
          ctx.fillStyle = '#c084fc';
          ctx.fillText(coordText, sx, sy + radius + 35);
        }
      }

      ctx.restore();
    });

    // 7. Render Searched Target Coordinates Beacon (if active in this dimension)
    if (targetSearchCoord && targetSearchCoord.dimension === dimension) {
      const targetSx = cx + (targetSearchCoord.x - camX) * zoom;
      const targetSy = cy + (targetSearchCoord.z - camZ) * zoom;

      if (targetSx >= -100 && targetSx <= width + 100 && targetSy >= -100 && targetSy <= height + 100) {
        ctx.save();

        // Expanding beacon rings
        const ringProgress = (time * 1.2) % 1;
        const ringRadius = 14 + ringProgress * 32;
        const ringOpacity = 1 - ringProgress;

        ctx.strokeStyle = `rgba(6, 182, 212, ${ringOpacity * 0.9})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(targetSx, targetSy, ringRadius, 0, Math.PI * 2);
        ctx.stroke();

        // Second trailing ring
        const ringProgress2 = ((time * 1.2) + 0.5) % 1;
        const ringRadius2 = 14 + ringProgress2 * 32;
        const ringOpacity2 = 1 - ringProgress2;

        ctx.strokeStyle = `rgba(6, 182, 212, ${ringOpacity2 * 0.6})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(targetSx, targetSy, ringRadius2, 0, Math.PI * 2);
        ctx.stroke();

        // Center crosshair reticle
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(targetSx, targetSy, 9, 0, Math.PI * 2);
        ctx.stroke();

        // Cross lines
        ctx.beginPath();
        ctx.moveTo(targetSx - 18, targetSy);
        ctx.lineTo(targetSx - 11, targetSy);
        ctx.moveTo(targetSx + 11, targetSy);
        ctx.lineTo(targetSx + 18, targetSy);
        ctx.moveTo(targetSx, targetSy - 18);
        ctx.lineTo(targetSx, targetSy - 11);
        ctx.moveTo(targetSx, targetSy + 11);
        ctx.lineTo(targetSx, targetSy + 18);
        ctx.stroke();

        // Center dot
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(targetSx, targetSy, 3, 0, Math.PI * 2);
        ctx.fill();

        // Target Label
        const targetLabel = targetSearchCoord.label || `Target: (${targetSearchCoord.x}, ${targetSearchCoord.z})`;
        ctx.font = 'bold 10px "JetBrains Mono", monospace';
        const labelW = ctx.measureText(targetLabel).width;

        ctx.fillStyle = 'rgba(6, 30, 45, 0.95)';
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(targetSx - labelW / 2 - 8, targetSy - 34, labelW + 16, 20, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#22d3ee';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(targetLabel, targetSx, targetSy - 24);

        ctx.restore();
      }
    }

    // 8. Spawn Point Indicator with Animated Halo (at 0, 0)
    if (dimension === 'overworld') {
      const spawnSx = cx - camX * zoom;
      const spawnSy = cy - camZ * zoom;
      const spawnPulse = Math.sin(time * 3) * 2;

      ctx.save();
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(spawnSx, spawnSy, 11 + spawnPulse, 0, Math.PI * 2);
      ctx.stroke();

      ctx.font = 'bold 9px "JetBrains Mono", monospace';
      ctx.fillStyle = '#10b981';
      ctx.textAlign = 'center';
      ctx.fillText('SPAWN (0,0)', spawnSx, spawnSy - 16);
      ctx.restore();
    }

    ctx.restore();
    isOverlayDirtyRef.current = false;
  }, [
    dimension, 
    structures, 
    waypoints, 
    diamondVeins, 
    activeRoute, 
    selectedStructure, 
    showDiamonds, 
    visibleCategories, 
    targetSearchCoord,
    renderTerrainLayer
  ]);

  // Decoupled Smooth Animation Loop with Lerp & Momentum Physics
  useEffect(() => {
    let active = true;
    let lastTime = performance.now();

    const tick = (currentTime: number) => {
      if (!active) return;

      const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;
      animTimeRef.current += dt;
      routeDashOffsetRef.current = (routeDashOffsetRef.current + dt * 18) % 30;

      // Handle Inertia / Momentum physics after drag release
      if (!isDraggingRef.current) {
        const vel = velocityRef.current;
        if (Math.abs(vel.vx) > 0.05 || Math.abs(vel.vz) > 0.05) {
          targetCameraRef.current.x += vel.vx * dt * 60;
          targetCameraRef.current.z += vel.vz * dt * 60;
          vel.vx *= 0.94; // Smoother friction
          vel.vz *= 0.94;
        } else {
          vel.vx = 0;
          vel.vz = 0;
        }
      }

      // Smooth Camera Lerp Interpolation
      const cur = currentCameraRef.current;
      const target = targetCameraRef.current;
      const LERP_SPEED = 0.18; // More "weighty" glide

      const diffX = target.x - cur.x;
      const diffZ = target.z - cur.z;
      const diffZoom = target.zoom - cur.zoom;

      let hasCameraMoved = false;

      if (Math.abs(diffX) > 0.01 || Math.abs(diffZ) > 0.01 || Math.abs(diffZoom) > 0.001) {
        cur.x += diffX * LERP_SPEED;
        cur.z += diffZ * LERP_SPEED;
        cur.zoom += diffZoom * LERP_SPEED;
        hasCameraMoved = true;
        isTerrainDirtyRef.current = true;
        isOverlayDirtyRef.current = true;

        // Keep display HUD state synced smoothly
        setDisplayCamera({
          x: Math.round(cur.x),
          z: Math.round(cur.z),
          zoom: cur.zoom,
        });
      }

      // If active route is present, animated dashed path requires continuous overlay refresh
      const isRouteActive = Boolean(activeRoute);
      const isSelectionActive = Boolean(selectedStructure);

      if (
        isTerrainDirtyRef.current || 
        isOverlayDirtyRef.current || 
        isDraggingRef.current || 
        hasCameraMoved || 
        isRouteActive || 
        isSelectionActive
      ) {
        drawFrame();
      }

      rafIdRef.current = requestAnimationFrame(tick);
    };

    rafIdRef.current = requestAnimationFrame(tick);

    return () => {
      active = false;
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [drawFrame, activeRoute, selectedStructure]);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      isTerrainDirtyRef.current = true;
      isOverlayDirtyRef.current = true;
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Keyboard navigation (WASD / Arrows to pan, +/- to zoom)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return;

      const PAN_STEP = 60 / currentCameraRef.current.zoom;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        targetCameraRef.current.z -= PAN_STEP;
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        targetCameraRef.current.z += PAN_STEP;
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        targetCameraRef.current.x -= PAN_STEP;
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        targetCameraRef.current.x += PAN_STEP;
      } else if (e.key === '+' || e.key === '=') {
        targetCameraRef.current.zoom = Math.min(8.0, targetCameraRef.current.zoom * 1.3);
      } else if (e.key === '-' || e.key === '_') {
        targetCameraRef.current.zoom = Math.max(0.08, targetCameraRef.current.zoom / 1.3);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Mouse & Touch Handlers with Velocity Momentum
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 0) {
      setIsDragging(true);
      hasMovedDragRef.current = false;
      pointerDownPosRef.current = { x: e.clientX, y: e.clientY };
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      lastDragPosRef.current = { x: e.clientX, y: e.clientY };
      lastDragTimeRef.current = performance.now();
      velocityRef.current = { vx: 0, vz: 0 };
    }
  };

  const lastCoordsUpdateRef = useRef(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    if (!isHovering) setIsHovering(true);

    // Direct hardware-accelerated tooltip positioning via CSS translate3d
    if (overlayRef.current && containerRef.current) {
      const cWidth = containerRef.current.clientWidth;
      const cHeight = containerRef.current.clientHeight;
      const overlayWidth = 196;
      const overlayHeight = 92;
      const offset = 18;

      let left = screenX + offset;
      let top = screenY + offset;

      if (left + overlayWidth > cWidth - 12) {
        left = screenX - overlayWidth - offset;
      }
      if (top + overlayHeight > cHeight - 12) {
        top = screenY - overlayHeight - offset;
      }

      left = Math.max(12, left);
      top = Math.max(12, top);

      overlayRef.current.style.transform = `translate3d(${left}px, ${top}px, 0)`;
    }

    // Throttle POS state update
    const now = performance.now();
    if (now - lastCoordsUpdateRef.current > 32) {
      lastCoordsUpdateRef.current = now;
      const world = screenToWorld(screenX, screenY);
      const biome = generator.getBiome(world.x, world.z, dimension);

      setHoverCoords({ 
        x: world.x, 
        z: world.z, 
        biome: biome?.name || 'Plains', 
        color: biome?.color || '#8ab644',
        category: biome?.category || 'Temperate',
        temperature: biome?.temperature ?? 0.5,
        humidity: biome?.humidity ?? 0.5,
      });

      // Check hovered structure or custom waypoint
      let hovered: Structure | null = structures.find((s) => {
        if (s.dimension !== dimension) return false;
        const sPos = worldToScreen(s.x, s.z);
        const dist = Math.hypot(screenX - sPos.x, screenY - sPos.y);
        return dist <= 20;
      }) || null;

      if (!hovered) {
        const hoveredWp = waypoints.find((w) => {
          if (w.dimension !== dimension) return false;
          const wPos = worldToScreen(w.x, w.z);
          const dist = Math.hypot(screenX - wPos.x, screenY - wPos.y);
          return dist <= 18;
        });

        if (hoveredWp) {
          hovered = {
            id: hoveredWp.id,
            name: hoveredWp.name,
            type: 'waypoint',
            category: 'survival_starter',
            dimension: hoveredWp.dimension,
            x: hoveredWp.x,
            y: hoveredWp.y,
            z: hoveredWp.z,
            biome: 'Custom Pin',
            icon: hoveredWp.icon || 'compass',
            color: hoveredWp.color,
            description: hoveredWp.notes || 'User marked custom waypoint',
            keyLoot: [],
            verified: false,
            status: 'user_waypoint',
          };
        }
      }

      if (hoveredStructureRef.current?.id !== hovered?.id) {
        setHoveredStructure(hovered || null);
        isOverlayDirtyRef.current = true;
      }
    }

    // Camera Pan Dragging with Momentum tracking
    if (isDraggingRef.current) {
      const movedDist = Math.hypot(
        e.clientX - pointerDownPosRef.current.x, 
        e.clientY - pointerDownPosRef.current.y
      );
      if (movedDist >= 5) {
        hasMovedDragRef.current = true;
      }

      const dx = (e.clientX - dragStartRef.current.x) / currentCameraRef.current.zoom;
      const dz = (e.clientY - dragStartRef.current.y) / currentCameraRef.current.zoom;

      targetCameraRef.current.x -= dx;
      targetCameraRef.current.z -= dz;
      currentCameraRef.current.x -= dx;
      currentCameraRef.current.z -= dz;
      isTerrainDirtyRef.current = true;
      isOverlayDirtyRef.current = true;

      // Track drag release velocity
      const dt = Math.max(1, now - lastDragTimeRef.current);
      const instantVx = -(e.clientX - lastDragPosRef.current.x) / currentCameraRef.current.zoom / (dt / 16.6);
      const instantVz = -(e.clientY - lastDragPosRef.current.y) / currentCameraRef.current.zoom / (dt / 16.6);

      velocityRef.current = {
        vx: instantVx * 0.8,
        vz: instantVz * 0.8,
      };

      lastDragPosRef.current = { x: e.clientX, y: e.clientY };
      lastDragTimeRef.current = now;
      dragStartRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    setIsHovering(false);
    setHoveredStructure(null);
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(false);

    // Click selection only if moved distance < 5px
    const movedDist = Math.hypot(
      e.clientX - pointerDownPosRef.current.x, 
      e.clientY - pointerDownPosRef.current.y
    );
    if (movedDist < 5 && !hasMovedDragRef.current) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;

      let clickedStruct = structures.find((s) => {
        if (s.dimension !== dimension) return false;
        const sPos = worldToScreen(s.x, s.z);
        const dist = Math.hypot(screenX - sPos.x, screenY - sPos.y);
        return dist <= 20;
      });

      if (!clickedStruct) {
        const clickedWp = waypoints.find((w) => {
          if (w.dimension !== dimension) return false;
          const wPos = worldToScreen(w.x, w.z);
          const dist = Math.hypot(screenX - wPos.x, screenY - wPos.y);
          return dist <= 20;
        });

        if (clickedWp) {
          clickedStruct = {
            id: clickedWp.id,
            name: clickedWp.name,
            type: 'waypoint',
            category: 'survival_starter',
            dimension: clickedWp.dimension,
            x: clickedWp.x,
            y: clickedWp.y,
            z: clickedWp.z,
            biome: 'Custom Pin',
            icon: clickedWp.icon || 'compass',
            color: clickedWp.color,
            description: clickedWp.notes || 'User marked custom waypoint',
            keyLoot: [],
            verified: false,
            status: 'user_waypoint',
          };
        }
      }

      onSelectStructure(clickedStruct || null);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const world = screenToWorld(screenX, screenY);

    targetCameraRef.current = {
      x: world.x,
      z: world.z,
      zoom: Math.min(8.0, targetCameraRef.current.zoom * 1.6),
    };
  };

  // Touch handlers for Mobile / Tablet support
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      hasMovedDragRef.current = false;
      pointerDownPosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      lastDragPosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      lastDragTimeRef.current = performance.now();
      velocityRef.current = { vx: 0, vz: 0 };
      touchDistanceRef.current = null;
    } else if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchDistanceRef.current = dist;
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1 && isDraggingRef.current) {
      const clientX = e.touches[0].clientX;
      const clientY = e.touches[0].clientY;
      const movedDist = Math.hypot(
        clientX - pointerDownPosRef.current.x, 
        clientY - pointerDownPosRef.current.y
      );
      if (movedDist >= 5) hasMovedDragRef.current = true;

      const dx = (clientX - dragStartRef.current.x) / currentCameraRef.current.zoom;
      const dz = (clientY - dragStartRef.current.y) / currentCameraRef.current.zoom;
      targetCameraRef.current.x -= dx;
      targetCameraRef.current.z -= dz;
      currentCameraRef.current.x -= dx;
      currentCameraRef.current.z -= dz;
      isTerrainDirtyRef.current = true;
      isOverlayDirtyRef.current = true;

      const now = performance.now();
      const dt = Math.max(1, now - lastDragTimeRef.current);
      velocityRef.current = {
        vx: -(clientX - lastDragPosRef.current.x) / currentCameraRef.current.zoom / (dt / 16.6),
        vz: -(clientY - lastDragPosRef.current.y) / currentCameraRef.current.zoom / (dt / 16.6),
      };

      lastDragPosRef.current = { x: clientX, y: clientY };
      lastDragTimeRef.current = now;
      dragStartRef.current = { x: clientX, y: clientY };
    } else if (e.touches.length === 2 && touchDistanceRef.current !== null) {
      const newDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = newDist / touchDistanceRef.current;
      if (Math.abs(factor - 1) > 0.02) {
        targetCameraRef.current.zoom = Math.min(8.0, Math.max(0.08, targetCameraRef.current.zoom * factor));
        touchDistanceRef.current = newDist;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    setIsDragging(false);
    touchDistanceRef.current = null;
    if (e.changedTouches.length === 1 && !hasMovedDragRef.current) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const screenX = e.changedTouches[0].clientX - rect.left;
      const screenY = e.changedTouches[0].clientY - rect.top;

      let clickedStruct = structures.find((s) => {
        if (s.dimension !== dimension) return false;
        const sPos = worldToScreen(s.x, s.z);
        const dist = Math.hypot(screenX - sPos.x, screenY - sPos.y);
        return dist <= 24;
      });

      if (!clickedStruct) {
        const clickedWp = waypoints.find((w) => {
          if (w.dimension !== dimension) return false;
          const wPos = worldToScreen(w.x, w.z);
          const dist = Math.hypot(screenX - wPos.x, screenY - wPos.y);
          return dist <= 24;
        });

        if (clickedWp) {
          clickedStruct = {
            id: clickedWp.id,
            name: clickedWp.name,
            type: 'waypoint',
            category: 'survival_starter',
            dimension: clickedWp.dimension,
            x: clickedWp.x,
            y: clickedWp.y,
            z: clickedWp.z,
            biome: 'Custom Pin',
            icon: clickedWp.icon || 'compass',
            color: clickedWp.color,
            description: clickedWp.notes || 'User marked custom waypoint',
            keyLoot: [],
            verified: false,
            status: 'user_waypoint',
          };
        }
      }

      if (clickedStruct) {
        onSelectStructure(clickedStruct);
      }
    }
  };

  const handleContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const world = screenToWorld(screenX, screenY);
    onAddWaypointAtCoords(world);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const cursorWorldBefore = screenToWorld(screenX, screenY);

    const zoomFactor = e.deltaY < 0 ? 1.25 : 0.8;
    const newZoom = Math.min(8.0, Math.max(0.08, targetCameraRef.current.zoom * zoomFactor));

    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const newCameraX = cursorWorldBefore.x - (screenX - cx) / newZoom;
    const newCameraZ = cursorWorldBefore.z - (screenY - cy) / newZoom;

    targetCameraRef.current = {
      x: Math.round(newCameraX),
      z: Math.round(newCameraZ),
      zoom: Number(newZoom.toFixed(3)),
    };
  };

  const zoomToFitAll = () => {
    const container = containerRef.current;
    if (!container) return;

    const points: { x: number; z: number }[] = [{ x: 0, z: 0 }]; // spawn

    structures.filter(s => s.dimension === dimension).forEach(s => points.push({ x: s.x, z: s.z }));
    waypoints.filter(w => w.dimension === dimension).forEach(w => points.push({ x: w.x, z: w.z }));
    if (activeRoute && activeRoute.origin.dimension === dimension && activeRoute.destination.dimension === dimension) {
      points.push({ x: activeRoute.origin.x, z: activeRoute.origin.z });
      points.push({ x: activeRoute.destination.x, z: activeRoute.destination.z });
    }

    if (points.length === 0) return;

    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    points.forEach(p => {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minZ = Math.min(minZ, p.z);
      maxZ = Math.max(maxZ, p.z);
    });

    const padding = 200;
    const spanX = Math.max(400, (maxX - minX) + padding * 2);
    const spanZ = Math.max(400, (maxZ - minZ) + padding * 2);

    const centerX = Math.round((minX + maxX) / 2);
    const centerZ = Math.round((minZ + maxZ) / 2);

    const fitZoomX = container.clientWidth / spanX;
    const fitZoomZ = container.clientHeight / spanZ;
    const calculatedZoom = Math.min(2.0, Math.max(0.08, Math.min(fitZoomX, fitZoomZ)));

    targetCameraRef.current = {
      x: centerX,
      z: centerZ,
      zoom: Number(calculatedZoom.toFixed(3)),
    };
  };

  const zoomIn = () => {
    targetCameraRef.current.zoom = Math.min(8.0, targetCameraRef.current.zoom * 1.35);
  };
  const zoomOut = () => {
    targetCameraRef.current.zoom = Math.max(0.08, targetCameraRef.current.zoom / 1.35);
  };
  const resetToSpawn = () => {
    targetCameraRef.current = { x: 0, z: 0, zoom: 0.8 };
    setTargetLockOn({
      active: true,
      label: 'World Spawn (0, 0)',
      coords: { x: 0, z: 0 },
      id: Date.now(),
    });
    setTimeout(() => {
      setTargetLockOn((prev) => (prev ? { ...prev, active: false } : null));
    }, 1400);
  };

  return (
    <div 
      ref={containerRef} 
      className={`relative w-full h-full overflow-hidden select-none bg-[#090b10] transition-all duration-700 ease-out ${
        targetLockOn?.active 
          ? 'ring-2 ring-cyan-400/50 shadow-[inset_0_0_80px_rgba(6,182,212,0.18)]' 
          : 'ring-0 shadow-none'
      }`}
    >
      <canvas
        ref={canvasRef}
        className={`w-full h-full block ${isDragging ? 'cursor-grabbing' : 'cursor-crosshair'} transition-all duration-500 ease-out motion-reduce:transition-none ${
          dimensionTransition.active 
            ? 'scale-[1.02] filter blur-[0.8px] opacity-90' 
            : 'scale-100 filter-none opacity-100'
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onContextMenu={handleContextMenu}
        onWheel={handleWheel}
        aria-label="Minecraft Interactive Seed Map"
        role="region"
      />

      {/* Smooth Dimension Transition Portal Warp Overlay */}
      <div
        className={`absolute inset-0 pointer-events-none z-20 flex flex-col items-center justify-center transition-all duration-700 ease-out motion-reduce:transition-opacity ${
          dimensionTransition.active
            ? 'opacity-100 scale-100'
            : 'opacity-0 scale-105 pointer-events-none'
        }`}
        aria-hidden={!dimensionTransition.active}
      >
        {/* Dimension-Themed Radial Portal Vignette */}
        <div 
          className={`absolute inset-0 transition-opacity duration-700 ${
            dimension === 'nether'
              ? 'bg-[radial-gradient(circle_at_center,_rgba(185,28,28,0.45)_0%,_rgba(107,33,168,0.4)_50%,_rgba(10,5,15,0.95)_100%)]'
              : dimension === 'the_end'
              ? 'bg-[radial-gradient(circle_at_center,_rgba(168,85,247,0.45)_0%,_rgba(49,46,129,0.4)_50%,_rgba(6,5,15,0.95)_100%)]'
              : 'bg-[radial-gradient(circle_at_center,_rgba(16,185,129,0.35)_0%,_rgba(2,132,199,0.25)_50%,_rgba(11,13,20,0.9)_100%)]'
          }`}
        />

        {/* Portal Warp Center Announcement Card */}
        <div className="relative z-10 flex flex-col items-center text-center p-6 rounded-2xl bg-slate-950/85 border border-white/15 shadow-2xl backdrop-blur-md transform transition-all duration-500 animate-in fade-in zoom-in-95">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 shadow-lg ${
            dimension === 'nether'
              ? 'bg-rose-500/20 border border-rose-500/40 text-rose-400'
              : dimension === 'the_end'
              ? 'bg-purple-500/20 border border-purple-500/40 text-purple-400'
              : 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
          }`}>
            {dimension === 'nether' && <Flame className="w-7 h-7 animate-pulse" />}
            {dimension === 'the_end' && <Sparkles className="w-7 h-7 animate-pulse" />}
            {dimension === 'overworld' && <Globe2 className="w-7 h-7 animate-pulse" />}
          </div>

          <div className="flex items-center gap-2 mb-1">
            <span className="font-pixel text-xs tracking-wider uppercase text-white">
              {dimension === 'nether'
                ? 'Entering The Nether'
                : dimension === 'the_end'
                ? 'Entering The End'
                : 'Returning to Overworld'}
            </span>
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          </div>

          <p className="text-[11px] font-mono text-slate-300 max-w-xs">
            {dimension === 'nether'
              ? '1 Nether block = 8 Overworld blocks (Spatial warp active)'
              : dimension === 'the_end'
              ? 'Outer End Highlands & Purpur Citadels active'
              : 'Overworld surface terrain & biomes loaded'}
          </p>
        </div>
      </div>

      {/* Smooth Target Lock-On HUD Banner & Center Reticle Overlay */}
      {targetLockOn && (
        <div
          className={`absolute inset-0 pointer-events-none z-20 flex items-center justify-center transition-all duration-500 ease-out motion-reduce:transition-opacity ${
            targetLockOn.active
              ? 'opacity-100 scale-100'
              : 'opacity-0 scale-95 pointer-events-none'
          }`}
          aria-hidden={!targetLockOn.active}
        >
          {/* Center Reticle Bloom Animation */}
          <div className="relative flex items-center justify-center">
            {/* Outer pulsing ring */}
            <div className="absolute w-28 h-28 rounded-full border border-cyan-400/40 animate-ping" />
            {/* Middle rotating dash ring */}
            <div className="w-20 h-20 rounded-full border-2 border-dashed border-cyan-400/80 animate-spin" style={{ animationDuration: '6s' }} />
            {/* Inner crosshair reticle */}
            <div className="absolute w-8 h-8 flex items-center justify-center">
              <Target className="w-8 h-8 text-cyan-400 animate-pulse" />
            </div>
          </div>

          {/* Top-Center Floating Target Lock-On Banner */}
          <div className="absolute top-5 left-1/2 -translate-x-1/2 flex items-center gap-2.5 px-4 py-2 rounded-xl bg-slate-950/90 border border-cyan-500/50 shadow-2xl backdrop-blur-md text-white transition-all duration-300">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping shrink-0" />
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-pixel text-[10px] text-cyan-400 tracking-wider">TARGET LOCKED</span>
                <span className="text-xs font-semibold text-white line-clamp-1">
                  {targetLockOn.label}
                </span>
              </div>
              <span className="text-[11px] font-mono text-cyan-300">
                X: {targetLockOn.coords.x} · Z: {targetLockOn.coords.z}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Floating HUD: Top Left (Seed Info & Cursor) */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 pointer-events-none max-w-[calc(100vw-32px)] transition-all duration-300">
        <div className="px-3 py-2 rounded-lg flex items-center gap-3 backdrop-blur-md bg-[#10131d]/90 text-xs border border-white/10 shadow-xl pointer-events-auto transition-transform duration-200 hover:scale-[1.01]">
          <Compass className="w-4 h-4 text-emerald-400 shrink-0 animate-pulse" />
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-pixel text-[10px] text-amber-400">POS:</span>
              <span className="font-mono-code font-bold text-white tracking-wide">
                X: {hoverCoords?.x ?? displayCamera.x} | Z: {hoverCoords?.z ?? displayCamera.z}
              </span>
              {generator.isPreset ? (
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                  <ShieldCheck className="w-2.5 h-2.5" /> VERIFIED
                </span>
              ) : (
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-950/80 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                  <AlertCircle className="w-2.5 h-2.5" /> ESTIMATED
                </span>
              )}
            </div>
            <div className="text-[11px] text-zinc-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
              <span>Biome:</span>
              <span className="font-semibold text-emerald-300">{hoverCoords?.biome ?? 'Plains'}</span>
              <span className="text-zinc-600">•</span>
              <span className="text-zinc-400 capitalize">{dimension.replace('_', ' ')}</span>
              {showBiomeHeatmap && hoverCoords && (
                <>
                  <span className="text-zinc-600">•</span>
                  <span className="text-amber-300 text-[10px] flex items-center gap-0.5">
                    <Thermometer className="w-2.5 h-2.5" /> T: {hoverCoords.temperature.toFixed(2)} | H: {hoverCoords.humidity.toFixed(2)}
                  </span>
                </>
              )}
              {selectedBiomeCategory !== 'all' && (
                <>
                  <span className="text-zinc-600">•</span>
                  <span className="text-amber-300 text-[10px]">Filter: {selectedBiomeCategory}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Target Search Coordinate Active Banner */}
        {targetSearchCoord && (
          <div className="px-3 py-1.5 rounded-lg flex items-center justify-between gap-3 backdrop-blur-md bg-cyan-950/90 text-xs border border-cyan-500/50 shadow-xl pointer-events-auto text-cyan-200">
            <div className="flex items-center gap-2">
              <Crosshair className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
              <span className="font-mono-code font-bold text-white text-[11px]">
                Target: X:{targetSearchCoord.x} Z:{targetSearchCoord.z} [{targetSearchCoord.dimension}]
              </span>
            </div>
            {onClearSearchCoord && (
              <button
                onClick={onClearSearchCoord}
                className="p-1 text-cyan-400 hover:text-white rounded hover:bg-cyan-500/20 transition"
                title="Clear Search Target"
                aria-label="Clear Search Target"
              >
                <CloseIcon className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {/* Tip / Shortcut banner */}
        <div className="text-[10px] text-zinc-400 px-2.5 py-1 bg-black/60 rounded border border-white/5 backdrop-blur-xs hidden sm:block transition-opacity duration-300">
          💡 Right-click map to drop waypoint • WASD / Arrow keys to pan • Scroll to zoom
        </div>
      </div>

      {/* Dynamic Hovering Coordinate Tooltip Overlay */}
      <div 
        ref={overlayRef}
        className={`absolute top-0 left-0 z-30 pointer-events-none will-change-transform ${
          isHovering && !isDragging && hoverCoords ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        } transition-all duration-150 ease-out`}
        style={{ transform: 'translate3d(-999px, -999px, 0)' }}
      >
        {hoverCoords && (
          <div className="bg-[#10131d]/95 backdrop-blur-md border border-cyan-500/40 rounded-lg p-2 shadow-2xl text-white flex flex-col gap-1 w-48 text-[11px]">
            {/* Header: Biome + Dot */}
            <div className="flex items-center justify-between border-b border-white/10 pb-1">
              <div className="flex items-center gap-1.5">
                <span 
                  className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm transition-colors duration-200"
                  style={{ backgroundColor: hoverCoords.color }}
                />
                <span className="font-semibold text-xs text-zinc-100 line-clamp-1">
                  {hoverCoords.biome}
                </span>
              </div>
              <span className="text-[9px] px-1 py-0.2 rounded bg-black/40 text-zinc-400 font-mono-code uppercase">
                {dimension === 'the_end' ? 'End' : dimension}
              </span>
            </div>

            {/* Block & Chunk Coordinates */}
            <div className="flex items-center justify-between font-mono-code">
              <span className="text-cyan-300 font-bold text-xs">
                X: {hoverCoords.x} &nbsp;Z: {hoverCoords.z}
              </span>
              <span className="text-[9px] text-zinc-400">
                c({Math.floor(hoverCoords.x / 16)}, {Math.floor(hoverCoords.z / 16)})
              </span>
            </div>

            {/* Distance Info */}
            <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-0.5 border-t border-white/5">
              <span>Dist from (0,0):</span>
              <span className="font-mono-code text-zinc-200">
                {Math.round(Math.hypot(hoverCoords.x, hoverCoords.z))}b
              </span>
            </div>

            {/* Portal Conversion Shortcut */}
            {dimension === 'overworld' && (
              <div className="flex items-center justify-between text-[9px] text-purple-300 font-mono-code">
                <span>Nether portal:</span>
                <span>({Math.round(hoverCoords.x / 8)}, {Math.round(hoverCoords.z / 8)})</span>
              </div>
            )}
            {dimension === 'nether' && (
              <div className="flex items-center justify-between text-[9px] text-emerald-300 font-mono-code">
                <span>Overworld exit:</span>
                <span>({hoverCoords.x * 8}, {hoverCoords.z * 8})</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating HUD: Top Right (Quick Map Actions & Layers) */}
      <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-2">
        <div className="flex items-center gap-1 bg-[#10131d]/90 backdrop-blur-md p-1 rounded-lg border border-white/10 shadow-lg transition-transform duration-200">
          <button
            onClick={zoomIn}
            title="Zoom In (+)"
            aria-label="Zoom In"
            className="p-2 hover:bg-white/10 text-zinc-200 rounded transition active:scale-90"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={zoomOut}
            title="Zoom Out (-)"
            aria-label="Zoom Out"
            className="p-2 hover:bg-white/10 text-zinc-200 rounded transition active:scale-90"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={resetToSpawn}
            title="Center on Spawn (0, 0) [M]"
            aria-label="Center on Spawn"
            className="p-2 hover:bg-emerald-500/20 text-emerald-400 rounded transition active:scale-90"
          >
            <Crosshair className="w-4 h-4" />
          </button>
          <button
            onClick={zoomToFitAll}
            title="Fit All Structures & Waypoints"
            aria-label="Fit All Structures"
            className="p-2 hover:bg-white/10 text-zinc-200 rounded transition active:scale-90"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        {/* Biome Heatmap Legend Overlay */}
        {showBiomeHeatmap && (
          <div className="w-64 sm:w-72 bg-[#10131d]/95 border border-amber-500/30 rounded-xl shadow-2xl p-3 text-xs text-zinc-200 backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-1.5 font-pixel text-[10px] text-amber-400">
                <Palette className="w-3.5 h-3.5" />
                <span>BIOME HEATMAP LEGEND</span>
              </div>
              <button
                onClick={() => setIsHeatmapLegendCollapsed(!isHeatmapLegendCollapsed)}
                className="text-zinc-400 hover:text-white text-xs p-0.5 rounded hover:bg-white/10 transition-colors"
                title={isHeatmapLegendCollapsed ? "Expand" : "Collapse"}
              >
                {isHeatmapLegendCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
              </button>
            </div>

            {!isHeatmapLegendCollapsed && (
              <div className="mt-2 space-y-2">
                {/* Category Color Grid */}
                <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                  <div className="flex items-center gap-1.5 p-1 bg-[#151926] rounded border border-white/5">
                    <span className="w-3 h-3 rounded bg-[#10b981] shrink-0" />
                    <span className="text-zinc-300">Temperate</span>
                  </div>
                  <div className="flex items-center gap-1.5 p-1 bg-[#151926] rounded border border-white/5">
                    <span className="w-3 h-3 rounded bg-[#cbd5e1] shrink-0" />
                    <span className="text-zinc-300">Mountain</span>
                  </div>
                  <div className="flex items-center gap-1.5 p-1 bg-[#151926] rounded border border-white/5">
                    <span className="w-3 h-3 rounded bg-[#0284c7] shrink-0" />
                    <span className="text-zinc-300">Aquatic</span>
                  </div>
                  <div className="flex items-center gap-1.5 p-1 bg-[#151926] rounded border border-white/5">
                    <span className="w-3 h-3 rounded bg-[#f59e0b] shrink-0" />
                    <span className="text-zinc-300">Arid</span>
                  </div>
                  <div className="flex items-center gap-1.5 p-1 bg-[#151926] rounded border border-white/5">
                    <span className="w-3 h-3 rounded bg-[#06b6d4] shrink-0" />
                    <span className="text-zinc-300">Cold / Ice</span>
                  </div>
                  <div className="flex items-center gap-1.5 p-1 bg-[#151926] rounded border border-white/5">
                    <span className="w-3 h-3 rounded bg-[#ef4444] shrink-0" />
                    <span className="text-zinc-300">Nether</span>
                  </div>
                </div>

                {/* Thermal Temperature Scale */}
                <div className="pt-1.5 border-t border-white/10 flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[9px] text-zinc-400">
                    <span>❄️ Frozen (-0.7)</span>
                    <span>🌿 Moderate (0.0)</span>
                    <span>☀️ Arid (+0.8)</span>
                  </div>
                  <div className="h-2 rounded-full w-full bg-gradient-to-r from-[#06b6d4] via-[#10b981] to-[#f59e0b] shadow-inner" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating HUD: Bottom Left (Zoom & Nether Scale) */}
      <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2 pointer-events-none">
        <div className="px-2.5 py-1 rounded bg-[#10131d]/90 text-[11px] font-mono-code text-zinc-300 border border-white/10 shadow-md transition-all">
          {Math.round(displayCamera.zoom * 100)}%
        </div>
        {dimension === 'nether' && (
          <div className="px-2.5 py-1 rounded bg-purple-950/80 text-[11px] font-mono-code text-purple-200 border border-purple-500/40 shadow-md animate-pulse">
            1 Nether block = 8 Overworld blocks
          </div>
        )}
      </div>

      {/* Floating HUD: Bottom Right (Collapsible Map Legend) */}
      <div className="absolute bottom-3 right-3 z-10 flex flex-col items-end">
        {showLegend ? (
          <div className="w-64 bg-[#10131d]/95 border border-white/15 rounded-xl shadow-2xl p-3 text-xs text-zinc-200 backdrop-blur-md mb-1 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between pb-2 border-b border-white/10 font-pixel text-[10px] text-emerald-400">
              <span>STRUCTURE LEGEND</span>
              <button
                onClick={() => setShowLegend(false)}
                className="text-zinc-400 hover:text-white text-xs transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="mt-2 space-y-1.5 text-[11px]">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#ffaa00] shrink-0" />
                <span>Villages & Ports</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#1a3818] shrink-0" />
                <span>Woodland Mansions</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#05c7c7] shrink-0" />
                <span>Ancient Cities & Deep Dark</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#991515] shrink-0" />
                <span>Nether Fortresses & Bastions</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#a855f7] shrink-0" />
                <span>End Cities & Elytra Ships</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#06b6d4] shrink-0" />
                <span>Procedural Diamond Ore (Y: -58)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#22c55e] border border-white shrink-0" />
                <span>Player Spawn Point (0,0)</span>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowLegend(true)}
            className="px-2.5 py-1.5 bg-[#10131d]/90 hover:bg-[#181d2c] border border-white/10 text-zinc-300 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 backdrop-blur-md shadow-md transition-all active:scale-95"
          >
            <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px]">Legend</span>
          </button>
        )}
      </div>
    </div>
  );
};
