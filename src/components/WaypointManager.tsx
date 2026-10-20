import React, { useState, useEffect, useRef } from 'react';
import { Waypoint, Dimension, WaypointTag } from '../types/minecraft';
import { 
  MINECRAFT_WAYPOINT_ICONS, 
  getWaypointIconDef 
} from '../utils/waypointIcons';
import { 
  MapPin, 
  Plus, 
  Trash2, 
  Edit3, 
  Download, 
  Upload, 
  X, 
  Compass, 
  Tag, 
  Sparkles,
  Check
} from 'lucide-react';

interface WaypointManagerProps {
  waypoints: Waypoint[];
  currentDimension: Dimension;
  initialCoords?: { x: number; z: number } | null;
  onAddWaypoint: (wp: Omit<Waypoint, 'id' | 'createdAt'>) => void;
  onUpdateWaypoint?: (wp: Waypoint) => void;
  onDeleteWaypoint: (id: string) => void;
  onSelectWaypoint: (wp: Waypoint) => void;
  onClose: () => void;
}

const PRESET_COLORS = [
  '#a855f7', // Purple
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber / Gold
  '#ef4444', // Red
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#84cc16', // Lime
];

const TAG_OPTIONS: WaypointTag[] = [
  'Base', 
  'Mine', 
  'Portal', 
  'Mansion', 
  'Farm', 
  'Spawner', 
  'Custom'
];

export const WaypointManager: React.FC<WaypointManagerProps> = ({
  waypoints,
  currentDimension,
  initialCoords,
  onAddWaypoint,
  onUpdateWaypoint,
  onDeleteWaypoint,
  onSelectWaypoint,
  onClose,
}) => {
  const [isFormOpen, setIsFormOpen] = useState(Boolean(initialCoords));
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [x, setX] = useState(initialCoords?.x ?? 0);
  const [y, setY] = useState(68);
  const [z, setZ] = useState(initialCoords?.z ?? 0);
  const [dimension, setDimension] = useState<Dimension>(currentDimension);
  const [color, setColor] = useState('#a855f7');
  const [icon, setIcon] = useState('home');
  const [tag, setTag] = useState<WaypointTag>('Base');
  const [notes, setNotes] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // When initialCoords changes, open form
  useEffect(() => {
    if (initialCoords) {
      setX(initialCoords.x);
      setZ(initialCoords.z);
      setEditingId(null);
      setIsFormOpen(true);
    }
  }, [initialCoords]);

  const handleStartAdd = () => {
    setEditingId(null);
    setName('');
    setX(initialCoords?.x ?? 0);
    setY(68);
    setZ(initialCoords?.z ?? 0);
    setDimension(currentDimension);
    setColor('#a855f7');
    setIcon('home');
    setTag('Base');
    setNotes('');
    setIsFormOpen(true);
  };

  const handleStartEdit = (wp: Waypoint) => {
    setEditingId(wp.id);
    setName(wp.name);
    setX(wp.x);
    setY(wp.y);
    setZ(wp.z);
    setDimension(wp.dimension);
    setColor(wp.color || '#a855f7');
    setIcon(wp.icon || 'compass');
    setTag(wp.tag || 'Custom');
    setNotes(wp.notes || '');
    setIsFormOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingId && onUpdateWaypoint) {
      const existing = waypoints.find(w => w.id === editingId);
      if (existing) {
        onUpdateWaypoint({
          ...existing,
          name: name.trim(),
          x: Number(x),
          y: Number(y),
          z: Number(z),
          dimension,
          color,
          icon,
          tag,
          notes: notes.trim(),
        });
      }
    } else {
      onAddWaypoint({
        name: name.trim(),
        x: Number(x),
        y: Number(y),
        z: Number(z),
        dimension,
        color,
        icon,
        tag,
        notes: notes.trim(),
      });
    }

    setIsFormOpen(false);
    setEditingId(null);
    setName('');
    setNotes('');
  };

  const handleExportWaypoints = () => {
    const blob = new Blob([JSON.stringify(waypoints, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `minecraft-bedrock-waypoints-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          parsed.forEach((wp) => {
            if (wp.name && typeof wp.x === 'number' && typeof wp.z === 'number') {
              onAddWaypoint({
                name: wp.name,
                x: wp.x,
                y: wp.y ?? 68,
                z: wp.z,
                dimension: wp.dimension || 'overworld',
                color: wp.color || '#a855f7',
                icon: wp.icon || 'compass',
                tag: wp.tag || 'Custom',
                notes: wp.notes || '',
              });
            }
          });
        }
      } catch {
        alert('Invalid waypoints JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const activeIconDef = getWaypointIconDef(icon);
  const ActiveIconComponent = activeIconDef.IconComponent;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="waypoint-manager-title"
    >
      <div className="w-full max-w-2xl bg-[#121520] border border-purple-500/40 rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-zinc-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-3.5 sm:p-4 border-b border-white/10 flex items-center justify-between bg-[#171b29]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg border border-purple-500/40 text-purple-400">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 id="waypoint-manager-title" className="font-pixel text-xs sm:text-sm text-white tracking-wide">
                MINECRAFT WAYPOINT MANAGER
              </h2>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Pin bases, mines, portals, and farms with custom Minecraft icons across all dimensions.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition"
            aria-label="Close Waypoint Manager"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-4">
          {!isFormOpen ? (
            <div>
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <span className="text-xs font-semibold text-zinc-400">
                  SAVED WAYPOINTS ({waypoints.length})
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportWaypoints}
                    className="px-2.5 py-1 bg-[#1a1f2e] hover:bg-[#252c40] text-zinc-300 rounded text-xs flex items-center gap-1 border border-white/10 transition"
                    title="Export Waypoints JSON"
                  >
                    <Download className="w-3.5 h-3.5" /> Export
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1 bg-[#1a1f2e] hover:bg-[#252c40] text-zinc-300 rounded text-xs flex items-center gap-1 border border-white/10 transition"
                    title="Import Waypoints JSON"
                  >
                    <Upload className="w-3.5 h-3.5" /> Import
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImportFile}
                    accept=".json"
                    className="hidden"
                  />
                  <button
                    onClick={handleStartAdd}
                    className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-pixel flex items-center gap-1.5 transition active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" /> ADD NEW
                  </button>
                </div>
              </div>

              {waypoints.length === 0 ? (
                <div className="text-center py-12 text-zinc-500 text-xs flex flex-col items-center gap-2">
                  <Compass className="w-8 h-8 text-zinc-600 animate-pulse" />
                  <p>No custom waypoints added yet.</p>
                  <p className="text-[11px] text-zinc-600">
                    Click &quot;Add New&quot; above or right-click any coordinate on the seed map to pin a location!
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {waypoints.map((wp) => {
                    const iconDef = getWaypointIconDef(wp.icon || 'compass');
                    const IconComp = iconDef.IconComponent;

                    return (
                      <div
                        key={wp.id}
                        className="p-3 bg-[#161a27] hover:bg-[#1b2030] rounded-xl border border-white/5 flex items-center justify-between gap-3 transition"
                      >
                        <div className="flex items-center gap-3">
                          {/* Waypoint Icon Badge */}
                          <div
                            className="w-8 h-8 rounded-full border border-white/40 flex items-center justify-center text-white shrink-0 shadow-md"
                            style={{ 
                              backgroundColor: wp.color || '#a855f7',
                              boxShadow: `0 0 10px ${wp.color}40`
                            }}
                          >
                            <IconComp className="w-4 h-4" />
                          </div>

                          <div>
                            <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-2 flex-wrap">
                              <span>{wp.name}</span>
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-500/30 flex items-center gap-1 font-mono-code">
                                {iconDef.name}
                              </span>
                              {wp.tag && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/40 text-zinc-300 border border-white/10">
                                  {wp.tag}
                                </span>
                              )}
                              <span className="text-[10px] font-mono-code px-1.5 py-0.5 rounded bg-black/40 text-cyan-300">
                                X:{wp.x} Y:{wp.y} Z:{wp.z} [{wp.dimension}]
                              </span>
                            </div>
                            {wp.notes && (
                              <div className="text-[11px] text-zinc-400 mt-0.5">{wp.notes}</div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => {
                              onSelectWaypoint(wp);
                              onClose();
                            }}
                            className="px-2.5 py-1.5 bg-[#22283a] hover:bg-purple-600 text-zinc-200 hover:text-white rounded-lg text-xs font-medium transition"
                            title="Center and highlight this waypoint on the map"
                          >
                            Locate
                          </button>
                          <button
                            onClick={() => handleStartEdit(wp)}
                            className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition"
                            title="Edit waypoint"
                            aria-label={`Edit waypoint ${wp.name}`}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteWaypoint(wp.id)}
                            className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                            title="Delete waypoint"
                            aria-label={`Delete waypoint ${wp.name}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSave} className="flex flex-col gap-3.5">
              {/* Live Preview Card */}
              <div className="p-3 bg-[#171b29] rounded-xl border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full border-2 border-white flex items-center justify-center text-white shrink-0 shadow-lg transition-colors"
                    style={{ 
                      backgroundColor: color,
                      boxShadow: `0 0 14px ${color}60`
                    }}
                  >
                    <ActiveIconComponent className="w-5 h-5 drop-shadow-sm" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>{name || 'New Waypoint'}</span>
                      <span className="text-[10px] text-zinc-400 font-mono-code font-normal">
                        ({activeIconDef.name})
                      </span>
                    </div>
                    <div className="text-[11px] font-mono-code text-cyan-300 mt-0.5">
                      X: {x} | Y: {y} | Z: {z} [{dimension}]
                    </div>
                  </div>
                </div>
                <div className="text-right text-[10px] text-zinc-400 hidden sm:block">
                  <span>Icon: </span>
                  <span className="text-emerald-400 font-semibold">{activeIconDef.name}</span>
                </div>
              </div>

              {/* Minecraft-Themed Icon Selector Grid */}
              <div>
                <label className="block text-[11px] font-pixel text-purple-400 mb-1.5">
                  SELECT MINECRAFT THEMED ICON:
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {MINECRAFT_WAYPOINT_ICONS.map((opt) => {
                    const isSelected = icon === opt.id;
                    const OptIcon = opt.IconComponent;

                    return (
                      <button
                        type="button"
                        key={opt.id}
                        onClick={() => {
                          setIcon(opt.id);
                          // Auto suggest matching tag if using default tag
                          if (opt.id === 'home') setTag('Base');
                          else if (opt.id === 'pickaxe') setTag('Mine');
                          else if (opt.id === 'portal') setTag('Portal');
                          else if (opt.id === 'spawner') setTag('Spawner');
                          else if (opt.id === 'farm') setTag('Farm');
                          else if (opt.id === 'castle') setTag('Mansion');
                        }}
                        className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-center relative ${
                          isSelected
                            ? 'bg-purple-950/80 border-purple-400 text-white shadow-md scale-[1.02]'
                            : 'bg-[#161a27] border-white/5 text-zinc-400 hover:text-zinc-200 hover:bg-[#1f2538]'
                        }`}
                        title={opt.description}
                      >
                        <div 
                          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                          style={{
                            backgroundColor: isSelected ? color : 'rgba(255, 255, 255, 0.05)',
                            color: isSelected ? '#ffffff' : 'inherit'
                          }}
                        >
                          <OptIcon className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-medium leading-tight">
                          {opt.name.split('/')[0].trim()}
                        </span>
                        {isSelected && (
                          <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-400" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Waypoint Name & Tag */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-pixel text-purple-400 mb-1">
                    WAYPOINT NAME:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Main Coastal Base, Diamond Mine"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#161a27] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-pixel text-purple-400 mb-1">
                    TAG CATEGORY:
                  </label>
                  <select
                    value={tag}
                    onChange={(e) => setTag(e.target.value as WaypointTag)}
                    className="w-full bg-[#161a27] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    {TAG_OPTIONS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Coordinates */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-mono-code text-zinc-400 mb-1">X Coordinate</label>
                  <input
                    type="number"
                    value={x}
                    onChange={(e) => setX(Number(e.target.value))}
                    className="w-full bg-[#161a27] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono-code"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono-code text-zinc-400 mb-1">Y Coordinate (Height)</label>
                  <input
                    type="number"
                    value={y}
                    onChange={(e) => setY(Number(e.target.value))}
                    className="w-full bg-[#161a27] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono-code"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono-code text-zinc-400 mb-1">Z Coordinate</label>
                  <input
                    type="number"
                    value={z}
                    onChange={(e) => setZ(Number(e.target.value))}
                    className="w-full bg-[#161a27] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono-code"
                  />
                </div>
              </div>

              {/* Dimension & Marker Color */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono-code text-zinc-400 mb-1">Dimension</label>
                  <select
                    value={dimension}
                    onChange={(e) => setDimension(e.target.value as Dimension)}
                    className="w-full bg-[#161a27] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  >
                    <option value="overworld">Overworld</option>
                    <option value="nether">The Nether</option>
                    <option value="the_end">The End</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono-code text-zinc-400 mb-1">Marker Color</label>
                  <div className="flex items-center gap-2 pt-1 flex-wrap">
                    {PRESET_COLORS.map((c) => (
                      <button
                        type="button"
                        key={c}
                        onClick={() => setColor(c)}
                        className={`w-6 h-6 rounded-full border-2 transition-transform ${
                          color === c ? 'border-white scale-125 shadow-lg' : 'border-transparent opacity-80 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: c }}
                        aria-label={`Select Color ${c}`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[10px] font-mono-code text-zinc-400 mb-1">
                  Notes & Details (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Double chest room, nether portal link, sheep farm output"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-[#161a27] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setIsFormOpen(false);
                    setEditingId(null);
                  }}
                  className="px-3.5 py-2 bg-[#22283a] text-zinc-300 rounded-lg text-xs hover:bg-white/10 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-pixel text-xs transition shadow-lg active:scale-95"
                >
                  {editingId ? 'UPDATE WAYPOINT' : 'SAVE WAYPOINT'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-white/10 bg-[#121520] flex justify-between items-center text-[11px] text-zinc-400">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Icons are rendered in real time on the seed canvas</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
