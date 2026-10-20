export type Dimension = 'overworld' | 'nether' | 'the_end';

export type BiomeCategory = 
  | 'Temperate' 
  | 'Cold' 
  | 'Arid' 
  | 'Aquatic' 
  | 'Mountain' 
  | 'Nether' 
  | 'End';

export interface BiomeDefinition {
  id: string;
  name: string;
  category: BiomeCategory;
  color: string;
  foliageColor?: string;
  temperature: number;
  humidity: number;
  minHeight: number;
  maxHeight: number;
  dimension: Dimension;
}

export type StructureCategory = 
  | 'survival_starter'
  | 'rare_dungeon'
  | 'nether_endgame'
  | 'end_endgame'
  | 'village'
  | 'underground';

export type VerificationStatus = 'verified' | 'estimated' | 'user_waypoint';

export interface Structure {
  id: string;
  name: string;
  type: string;
  category: StructureCategory;
  dimension: Dimension;
  x: number;
  y: number;
  z: number;
  biome: string;
  icon: string;
  color: string;
  description: string;
  keyLoot: string[];
  tips?: string;
  verified: boolean;
  status: VerificationStatus;
  distanceFromSpawn?: number;
  netherEquivalent?: { x: number; y: number; z: number };
}

export interface DiamondVein {
  id: string;
  x: number;
  y: number;
  z: number;
  size: number;
  chunkX: number;
  chunkZ: number;
  exposed: boolean;
  distance?: number;
  surroundNote?: string;
}

export type WaypointTag = 'Base' | 'Mine' | 'Portal' | 'Mansion' | 'Farm' | 'Spawner' | 'Custom';

export interface Waypoint {
  id: string;
  name: string;
  x: number;
  y: number;
  z: number;
  dimension: Dimension;
  color: string;
  icon: string;
  tag?: WaypointTag;
  notes?: string;
  createdAt: number;
}

export interface RoutePoint {
  id?: string;
  name: string;
  x: number;
  y: number;
  z: number;
  dimension: Dimension;
}

export interface TravelRoute {
  origin: RoutePoint;
  destination: RoutePoint;
  overworldBlocks: number;
  netherBlocks: number;
  portalOrigin?: { x: number; y: number; z: number };
  portalDest?: { x: number; y: number; z: number };
  walkingTimeSec: number;
  sprintJumpTimeSec: number;
  elytraTimeSec: number;
  netherTravelTimeSec: number;
  timeSavedWithNetherSec: number;
  directions: {
    step: number;
    title: string;
    detail: string;
    coords?: { x: number; y: number; z: number };
    dimension: Dimension;
  }[];
}

export interface SeedPreset {
  id: string;
  seed: string;
  name: string;
  tagline: string;
  version: string;
  spawnCoords: { x: number; y: number; z: number };
  spawnBiome: string;
  description: string;
  highlights: string[];
  structures: Structure[];
}

export interface BlueprintRoom {
  id: string;
  name: string;
  type: 'portal' | 'vault' | 'library' | 'spawner' | 'loot' | 'corridor' | 'secret' | 'entrance';
  xOffset: number; // Block offset relative to structure center
  zOffset: number;
  width: number;
  height: number;
  floorLevel: number;
  description: string;
  threatLevel: 'safe' | 'low' | 'moderate' | 'high' | 'extreme';
  keyLoot: string[];
  hazards?: string[];
  secretTip?: string;
  iconName?: string;
}

export interface BlueprintLevel {
  id: number;
  name: string;
  elevationDelta: string; // e.g. "Y = -20 to -35"
  description: string;
}

export interface StructureBlueprint {
  structureType: string;
  name: string;
  dimension: Dimension;
  levels: BlueprintLevel[];
  rooms: BlueprintRoom[];
  overallThreat: 'Low' | 'Moderate' | 'High' | 'Extreme';
  primaryAttractions: string[];
  architecturalOverview: string;
  recommendedGear: string[];
}

