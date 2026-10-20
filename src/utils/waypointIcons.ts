import React from 'react';
import { 
  Home, 
  Pickaxe, 
  Swords, 
  Skull, 
  Box, 
  Wheat, 
  Gem, 
  Flame, 
  Anchor, 
  Castle, 
  Compass, 
  MapPin, 
  Sparkles 
} from 'lucide-react';

export interface MinecraftWaypointIconDef {
  id: string;
  name: string;
  category: 'survival' | 'utility' | 'combat' | 'exploration';
  description: string;
  IconComponent: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
}

export const MINECRAFT_WAYPOINT_ICONS: MinecraftWaypointIconDef[] = [
  {
    id: 'home',
    name: 'Base / Shelter',
    category: 'survival',
    description: 'Main base, cozy cottage, or starter shelter',
    IconComponent: Home,
  },
  {
    id: 'pickaxe',
    name: 'Mine / Quarry',
    category: 'utility',
    description: 'Mining shaft, strip mine, or deep cave entrance',
    IconComponent: Pickaxe,
  },
  {
    id: 'portal',
    name: 'Nether Portal',
    category: 'exploration',
    description: 'Obsidian gate or dimensional portal hub',
    IconComponent: Sparkles,
  },
  {
    id: 'chest',
    name: 'Storage / Vault',
    category: 'utility',
    description: 'Storage warehouse, hidden stash, or treasure cache',
    IconComponent: Box,
  },
  {
    id: 'sword',
    name: 'Combat / Arena',
    category: 'combat',
    description: 'Mob arena, raid outpost, or hunting ground',
    IconComponent: Swords,
  },
  {
    id: 'spawner',
    name: 'Mob Spawner',
    category: 'combat',
    description: 'Dungeon cage, skeleton/blaze grinder',
    IconComponent: Skull,
  },
  {
    id: 'farm',
    name: 'Crop / Animal Farm',
    category: 'survival',
    description: 'Automated crops, villager breeder, or animal farm',
    IconComponent: Wheat,
  },
  {
    id: 'diamond',
    name: 'Diamond Vein',
    category: 'exploration',
    description: 'Unmined diamond deposit or ancient debris site',
    IconComponent: Gem,
  },
  {
    id: 'campfire',
    name: 'Camp / Watchtower',
    category: 'survival',
    description: 'Forward outpost, scouting tower, or campfire rest',
    IconComponent: Flame,
  },
  {
    id: 'anchor',
    name: 'Harbor / Pier',
    category: 'exploration',
    description: 'Ocean port, boat pier, or coastal lighthouse',
    IconComponent: Anchor,
  },
  {
    id: 'castle',
    name: 'Fortress / Castle',
    category: 'exploration',
    description: 'Monumental citadel, stronghold, or mansion',
    IconComponent: Castle,
  },
  {
    id: 'compass',
    name: 'Navigation Point',
    category: 'exploration',
    description: 'Crucial landmark, trail marker, or route checkpoint',
    IconComponent: Compass,
  },
];

/**
 * Returns icon definition or fallback to compass/pin
 */
export function getWaypointIconDef(iconId: string): MinecraftWaypointIconDef {
  const normalized = iconId.toLowerCase().trim();
  const match = MINECRAFT_WAYPOINT_ICONS.find(
    (item) => item.id.toLowerCase() === normalized
  );
  if (match) return match;

  // Handle legacy or title-case names
  if (normalized === 'home') return MINECRAFT_WAYPOINT_ICONS[0];
  if (normalized === 'mine' || normalized === 'pickaxe') return MINECRAFT_WAYPOINT_ICONS[1];
  if (normalized === 'portal') return MINECRAFT_WAYPOINT_ICONS[2];
  if (normalized === 'storage' || normalized === 'chest') return MINECRAFT_WAYPOINT_ICONS[3];
  if (normalized === 'combat' || normalized === 'sword' || normalized === 'swords') return MINECRAFT_WAYPOINT_ICONS[4];
  if (normalized === 'spawner' || normalized === 'skull') return MINECRAFT_WAYPOINT_ICONS[5];
  if (normalized === 'farm' || normalized === 'wheat') return MINECRAFT_WAYPOINT_ICONS[6];
  if (normalized === 'diamond' || normalized === 'gem') return MINECRAFT_WAYPOINT_ICONS[7];
  if (normalized === 'campfire' || normalized === 'fire' || normalized === 'camp') return MINECRAFT_WAYPOINT_ICONS[8];
  if (normalized === 'anchor' || normalized === 'harbor' || normalized === 'pier') return MINECRAFT_WAYPOINT_ICONS[9];
  if (normalized === 'castle' || normalized === 'fortress') return MINECRAFT_WAYPOINT_ICONS[10];

  return MINECRAFT_WAYPOINT_ICONS[11]; // default navigation / compass
}

/**
 * Renders a crisp Minecraft vector glyph directly onto HTML5 Canvas
 */
export function drawMinecraftWaypointGlyph(
  ctx: CanvasRenderingContext2D,
  iconId: string,
  cx: number,
  cy: number,
  size: number
): void {
  const normalized = iconId.toLowerCase().trim();

  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#ffffff';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  switch (normalized) {
    case 'home': {
      // House gable roof
      ctx.beginPath();
      ctx.moveTo(cx - 5.5, cy + 0.5);
      ctx.lineTo(cx, cy - 5.5);
      ctx.lineTo(cx + 5.5, cy + 0.5);
      ctx.closePath();
      ctx.fill();

      // House lower walls
      ctx.fillRect(cx - 4, cy + 0.5, 8, 4.5);

      // Chimney
      ctx.fillRect(cx + 2.5, cy - 4.5, 1.8, 3);

      // Doorway cutout
      ctx.clearRect(cx - 1.2, cy + 2, 2.4, 3);
      break;
    }

    case 'pickaxe': {
      // Angled handle
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(cx - 4, cy + 4);
      ctx.lineTo(cx + 3, cy - 3);
      ctx.stroke();

      // Curved pickaxe metal blade
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(cx - 2, cy - 5);
      ctx.quadraticCurveTo(cx + 3, cy - 3, cx + 5, cy + 2);
      ctx.stroke();
      break;
    }

    case 'portal': {
      // Obsidian frame
      ctx.lineWidth = 1.5;
      ctx.strokeRect(cx - 4.5, cy - 6, 9, 12);

      // Swirling purple Nether vortex inside
      ctx.fillStyle = '#c084fc';
      ctx.fillRect(cx - 3, cy - 4.5, 6, 9);

      // Inner glow pixel
      ctx.fillStyle = '#fdf4ff';
      ctx.fillRect(cx - 1, cy - 2, 2, 4);
      break;
    }

    case 'chest': {
      // Chest body
      ctx.lineWidth = 1.2;
      ctx.strokeRect(cx - 5, cy - 4, 10, 8);

      // Split lid seam line
      ctx.beginPath();
      ctx.moveTo(cx - 5, cy - 1);
      ctx.lineTo(cx + 5, cy - 1);
      ctx.stroke();

      // Golden latch in center
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(cx - 1.2, cy - 2.2, 2.4, 2.4);
      break;
    }

    case 'sword':
    case 'swords': {
      // Diagonal sword blade
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - 4, cy + 4);
      ctx.lineTo(cx + 4.5, cy - 4.5);
      ctx.stroke();

      // Crossguard
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - 4, cy);
      ctx.lineTo(cx, cy + 4);
      ctx.stroke();

      // Sharp blade tip
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx + 3.5, cy - 5.5, 2, 2);
      break;
    }

    case 'spawner':
    case 'skull': {
      // Spawner iron cage outer box
      ctx.lineWidth = 1.2;
      ctx.strokeRect(cx - 4.5, cy - 4.5, 9, 9);

      // Inner vertical and horizontal bars
      ctx.beginPath();
      ctx.moveTo(cx - 1.5, cy - 4.5);
      ctx.lineTo(cx - 1.5, cy + 4.5);
      ctx.moveTo(cx + 1.5, cy - 4.5);
      ctx.lineTo(cx + 1.5, cy + 4.5);
      ctx.moveTo(cx - 4.5, cy);
      ctx.lineTo(cx + 4.5, cy);
      ctx.stroke();

      // Flaming core center
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(cx - 1, cy - 1, 2, 2);
      break;
    }

    case 'farm':
    case 'wheat': {
      // Center stalk
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy + 5);
      ctx.lineTo(cx, cy - 4);
      ctx.stroke();

      // Wheat grain ears
      ctx.fillStyle = '#fde047';
      ctx.fillRect(cx - 1, cy - 5, 2, 3);
      ctx.fillRect(cx - 3, cy - 2.5, 2, 2);
      ctx.fillRect(cx + 1, cy - 2.5, 2, 2);
      ctx.fillRect(cx - 2.5, cy + 0.5, 2, 2);
      ctx.fillRect(cx + 0.5, cy + 0.5, 2, 2);
      break;
    }

    case 'diamond':
    case 'gem': {
      // Classic Minecraft diamond facet geometry
      ctx.beginPath();
      ctx.moveTo(cx - 3, cy - 4.5);
      ctx.lineTo(cx + 3, cy - 4.5);
      ctx.lineTo(cx + 5.5, cy - 1.5);
      ctx.lineTo(cx, cy + 5);
      ctx.lineTo(cx - 5.5, cy - 1.5);
      ctx.closePath();
      ctx.fill();

      // Facet outline in darker cyan/black
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Inner facet reflection
      ctx.fillStyle = '#67e8f9';
      ctx.beginPath();
      ctx.moveTo(cx - 2, cy - 3.5);
      ctx.lineTo(cx + 2, cy - 3.5);
      ctx.lineTo(cx + 3.5, cy - 1.5);
      ctx.lineTo(cx, cy + 3.5);
      ctx.lineTo(cx - 3.5, cy - 1.5);
      ctx.closePath();
      ctx.fill();
      break;
    }

    case 'campfire':
    case 'fire': {
      // Crossed firewood logs
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#78350f';
      ctx.beginPath();
      ctx.moveTo(cx - 4.5, cy + 4);
      ctx.lineTo(cx + 4.5, cy + 2.5);
      ctx.moveTo(cx + 4.5, cy + 4);
      ctx.lineTo(cx - 4.5, cy + 2.5);
      ctx.stroke();

      // Campfire flame spire
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.moveTo(cx, cy - 5);
      ctx.quadraticCurveTo(cx + 3.5, cy - 1, cx + 2, cy + 2.5);
      ctx.lineTo(cx - 2, cy + 2.5);
      ctx.quadraticCurveTo(cx - 3.5, cy - 1, cx, cy - 5);
      ctx.closePath();
      ctx.fill();

      // Inner yellow core
      ctx.fillStyle = '#fde047';
      ctx.fillRect(cx - 1, cy - 1, 2, 2.5);
      break;
    }

    case 'anchor': {
      // Top eyelet
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(cx, cy - 4, 1.6, 0, Math.PI * 2);
      ctx.stroke();

      // Vertical shaft
      ctx.beginPath();
      ctx.moveTo(cx, cy - 2.4);
      ctx.lineTo(cx, cy + 3.5);
      ctx.moveTo(cx - 3, cy - 1.2);
      ctx.lineTo(cx + 3, cy - 1.2);
      ctx.stroke();

      // Bottom curved anchor arms
      ctx.beginPath();
      ctx.arc(cx, cy + 1.5, 3.8, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
      break;
    }

    case 'castle': {
      // Fortress base walls
      ctx.fillRect(cx - 4.5, cy - 0.5, 9, 5);

      // Three crenellations (towers)
      ctx.fillRect(cx - 4.5, cy - 4.5, 2.5, 4);
      ctx.fillRect(cx - 1, cy - 4.5, 2, 4);
      ctx.fillRect(cx + 2, cy - 4.5, 2.5, 4);

      // Gate archway cutout
      ctx.clearRect(cx - 1.5, cy + 1.5, 3, 3);
      break;
    }

    case 'compass':
    default: {
      // Compass circle dial
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.arc(cx, cy, 5, 0, Math.PI * 2);
      ctx.stroke();

      // North needle (red / white)
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx - 1.8, cy);
      ctx.lineTo(cx, cy - 4.2);
      ctx.closePath();
      ctx.fill();

      // South needle
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + 1.8, cy);
      ctx.lineTo(cx, cy + 4.2);
      ctx.closePath();
      ctx.fill();
      break;
    }
  }

  ctx.restore();
}
