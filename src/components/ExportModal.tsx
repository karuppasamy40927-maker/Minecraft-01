import React, { useState, useEffect } from 'react';
import { Structure, DiamondVein, SeedPreset, Waypoint } from '../types/minecraft';
import { Download, Copy, Check, FileText, CheckCircle2, ShieldCheck, AlertCircle, X } from 'lucide-react';

interface ExportModalProps {
  seed: string;
  preset: SeedPreset | undefined;
  structures: Structure[];
  diamondVeins: DiamondVein[];
  waypoints?: Waypoint[];
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  seed,
  preset,
  structures,
  diamondVeins,
  waypoints = [],
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const [exportFormat, setExportFormat] = useState<'text' | 'markdown' | 'json'>('text');

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Generate plain text report based PURELY on current state
  const generateTextReport = (): string => {
    const divider = '========================================================================';
    const subDivider = '------------------------------------------------------------------------';

    let out = `${divider}\n`;
    out += `MINECRAFT BEDROCK EDITION (v1.20+) - SEED MAP FINDINGS\n`;
    out += `Data Status: ${preset ? 'VERIFIED PRESET' : 'PROCEDURAL ESTIMATION (Bedrock 1.20+ rules)'}\n`;
    out += `${divider}\n\n`;

    out += `[1] WORLD CONFIGURATION\n`;
    out += `• World Seed:       ${seed}\n`;
    out += `• Target Platform:  Minecraft Bedrock Edition 1.20+\n`;
    out += `• Initial Spawn:    X: 0, Y: 68, Z: 0 (Plains Biome)\n`;
    if (preset) {
      out += `• Preset Info:      ${preset.name} (${preset.tagline})\n`;
    }
    out += `• Generation Date:  ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}\n\n`;

    out += `${subDivider}\n`;
    out += `[2] STRUCTURES & POINTS OF INTEREST\n`;
    out += `${subDivider}\n\n`;

    structures.forEach((s, idx) => {
      const statusBadge = s.status === 'verified' ? '[VERIFIED]' : s.status === 'user_waypoint' ? '[USER WAYPOINT]' : '[ESTIMATED]';
      out += `[${idx + 1}] ${statusBadge} ${s.name.toUpperCase()}\n`;
      out += `    Coordinates:   X: ${s.x}, Y: ${s.y}, Z: ${s.z}  [Dimension: ${s.dimension.toUpperCase()}]\n`;
      out += `    Biome:         ${s.biome}\n`;
      out += `    Description:   ${s.description}\n`;
      if (s.keyLoot && s.keyLoot.length > 0) {
        out += `    Key Loot:      ${s.keyLoot.join(', ')}\n`;
      }
      if (s.netherEquivalent) {
        out += `    Nether Portal: X: ${s.netherEquivalent.x}, Y: ${s.netherEquivalent.y}, Z: ${s.netherEquivalent.z} (Nether Shortcut: X/8, Z/8)\n`;
      }
      if (s.tips) {
        out += `    Note/Tip:      ${s.tips}\n`;
      }
      out += `    Command:       /tp @s ${s.x} ${s.y} ${s.z}\n\n`;
    });

    out += `${subDivider}\n`;
    out += `[3] PROCEDURAL DIAMOND LOCATOR (REPRESENTATIVE CLUSTERS NEAR SPAWN)\n`;
    out += `Notice: Procedural simulation based on Bedrock 1.20+ rules (Y: -52 to -59).\n`;
    out += `${subDivider}\n\n`;

    diamondVeins.slice(0, 20).forEach((v, idx) => {
      const num = (idx + 1).toString().padStart(2);
      const coords = `X: ${v.x.toString().padStart(4)}, Y: ${v.y.toString().padStart(3)}, Z: ${v.z.toString().padStart(4)}`;
      const note = v.surroundNote ? `| ${v.surroundNote}` : '';
      out += `• Vein #${num}: ${coords} | ${v.size} ores | Chunk: (${v.chunkX}, ${v.chunkZ}) ${note}\n`;
    });

    if (waypoints.length > 0) {
      out += `\n${subDivider}\n`;
      out += `[4] CUSTOM USER WAYPOINTS\n`;
      out += `${subDivider}\n\n`;
      waypoints.forEach((wp) => {
        out += `• [${wp.tag || 'Custom'}] ${wp.name}: X: ${wp.x}, Y: ${wp.y}, Z: ${wp.z} [${wp.dimension}] ${wp.notes ? `- ${wp.notes}` : ''}\n`;
      });
    }

    out += `\n${divider}\n`;
    return out;
  };

  // Generate markdown report based PURELY on current state
  const generateMarkdownReport = (): string => {
    let out = `# Minecraft Bedrock 1.20+ Seed Expedition Report\n\n`;
    out += `**World Seed:** \`${seed}\`  \n`;
    out += `**Platform:** Minecraft Bedrock Edition 1.20+  \n`;
    out += `**Data Status:** ${preset ? '**Verified Preset Locations**' : '*Procedural Estimation (1.20+ Rules)*'}  \n`;
    out += `**Spawn Point:** \`X: 0, Y: 68, Z: 0\` (Plains)  \n\n`;

    out += `## Structures & Key Locations\n\n`;
    out += `| Structure | Status | Coordinates | Dimension | Biome | Key Loot |\n`;
    out += `| :--- | :--- | :--- | :--- | :--- | :--- |\n`;

    structures.forEach((s) => {
      const statusLabel = s.status === 'verified' ? 'Verified' : 'Estimated';
      out += `| **${s.name}** | ${statusLabel} | \`${s.x}, ${s.y}, ${s.z}\` | ${s.dimension} | ${s.biome} | ${s.keyLoot.slice(0, 2).join(', ')} |\n`;
    });

    out += `\n## Procedural Diamond Ore Locations (Spawn Area)\n\n`;
    out += `| Cluster | Coordinates | Vein Size | Chunk | Type |\n`;
    out += `| :--- | :--- | :--- | :--- | :--- |\n`;
    diamondVeins.slice(0, 16).forEach((v, i) => {
      out += `| #${i + 1} | \`${v.x}, ${v.y}, ${v.z}\` | ${v.size} ores | (${v.chunkX}, ${v.chunkZ}) | ${v.exposed ? 'Cave Exposed' : 'Deepslate'} |\n`;
    });

    if (waypoints.length > 0) {
      out += `\n## Custom Waypoints\n\n`;
      out += `| Name | Tag | Coordinates | Dimension | Notes |\n`;
      out += `| :--- | :--- | :--- | :--- | :--- |\n`;
      waypoints.forEach((w) => {
        out += `| **${w.name}** | ${w.tag || 'Custom'} | \`${w.x}, ${w.y}, ${w.z}\` | ${w.dimension} | ${w.notes || '-'} |\n`;
      });
    }

    return out;
  };

  const getExportContent = () => {
    if (exportFormat === 'markdown') return generateMarkdownReport();
    if (exportFormat === 'json') {
      return JSON.stringify({
        seed,
        version: 'Bedrock 1.20+',
        dataStatus: preset ? 'verified' : 'estimated',
        spawn: { x: 0, y: 68, z: 0, biome: 'Plains' },
        structures,
        diamondVeins: diamondVeins.slice(0, 32),
        waypoints,
      }, null, 2);
    }
    return generateTextReport();
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getExportContent());
      setCopied(true);
      setCopyError(false);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopyError(true);
      setTimeout(() => setCopyError(false), 2500);
    }
  };

  const handleDownload = () => {
    const content = getExportContent();
    const ext = exportFormat === 'markdown' ? 'md' : exportFormat === 'json' ? 'json' : 'txt';
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `minecraft-bedrock-seed-${seed}-findings.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
    >
      <div className="w-full max-w-3xl bg-[#121520] border border-[#2b3347] rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-zinc-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-3.5 sm:p-4 border-b border-white/10 flex items-center justify-between bg-[#161a27]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-lg border border-emerald-500/40 text-emerald-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 id="export-modal-title" className="font-pixel text-xs sm:text-sm text-white tracking-wide flex items-center gap-2 flex-wrap">
                EXPORT FINDINGS FOR GAMEPLAY
                <span className="text-[9px] font-sans px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                  Offline Usable Log
                </span>
              </h2>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Download or copy real state coordinates for quick in-game reference.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition"
            aria-label="Close Export Modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Format Selector Tabs */}
        <div className="px-4 py-2 bg-[#0e1017] border-b border-white/5 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400 mr-1">Format:</span>
            <button
              onClick={() => setExportFormat('text')}
              className={`px-3 py-1 text-xs rounded transition ${
                exportFormat === 'text'
                  ? 'bg-emerald-600 text-white font-semibold'
                  : 'bg-[#181c28] text-zinc-400 hover:text-white'
              }`}
            >
              Plain Text (.txt)
            </button>
            <button
              onClick={() => setExportFormat('markdown')}
              className={`px-3 py-1 text-xs rounded transition ${
                exportFormat === 'markdown'
                  ? 'bg-emerald-600 text-white font-semibold'
                  : 'bg-[#181c28] text-zinc-400 hover:text-white'
              }`}
            >
              Markdown (.md)
            </button>
            <button
              onClick={() => setExportFormat('json')}
              className={`px-3 py-1 text-xs rounded transition ${
                exportFormat === 'json'
                  ? 'bg-emerald-600 text-white font-semibold'
                  : 'bg-[#181c28] text-zinc-400 hover:text-white'
              }`}
            >
              JSON (.json)
            </button>
          </div>
          <span className="text-[11px] text-zinc-400 font-mono-code">
            Seed: {seed}
          </span>
        </div>

        {/* Text Preview Box */}
        <div className="p-3 sm:p-4 flex-1 overflow-hidden flex flex-col bg-[#0a0c10]">
          <textarea
            readOnly
            value={getExportContent()}
            className="w-full flex-1 bg-[#10131d] border border-white/10 rounded-lg p-3 text-xs font-mono-code text-zinc-300 focus:outline-none resize-none leading-relaxed select-text"
            aria-label="Export Content Preview"
          />
        </div>

        {/* Actions Footer */}
        <div className="p-3.5 border-t border-white/10 bg-[#161a27] flex items-center justify-between flex-wrap gap-2">
          <div className="text-xs text-zinc-400 flex items-center gap-1.5">
            {preset ? (
              <>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Verified real Bedrock 1.20+ locations</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <span>Procedural simulation estimate</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3.5 py-1.5 bg-[#222838] hover:bg-[#2d354a] text-white rounded text-xs font-semibold flex items-center gap-1.5 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : copyError ? 'Copy Failed' : 'Copy to Clipboard'}
            </button>
            <button
              onClick={handleDownload}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-pixel text-xs rounded flex items-center gap-1.5 shadow-lg transition"
            >
              <Download className="w-3.5 h-3.5" />
              DOWNLOAD
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
