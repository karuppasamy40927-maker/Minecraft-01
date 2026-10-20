# Global Theme Switcher Implementation Plan

A comprehensive multi-mode visual theme system allowing users to seamlessly toggle between **'Neon Cyber-Synth'**, **'Classic Minecraft'**, and **'High Contrast'** modes across both the complete application UI and the Map Canvas rendering engine.

## User Review & Critical Decisions

> [!IMPORTANT]
> The design directly incorporates your confirmed preferences:
> - **Theme Scope**: **Global (App UI + Map Canvas)** — every control panel, header, modal, sidebar, and canvas terrain layer adapts synchronously to the selected theme.
> - **UI Placement**: **Top Navigation Bar Dropdown** with real-time preview icons and active mode indicator.
> - **Supported Themes**:
>   1. **Neon Cyber-Synth**: Deep obsidian (`#050505`), electric cyan (`#00f5ff`), vibrant magenta (`#ff00ff`), and acid green (`#39ff14`) with glowing bloom borders.
>   2. **Classic Minecraft**: Authentic in-game palette — rich grass green (`#5b8e34`), deep ocean blue (`#1d3c6a`), stone brick gray (`#737373`), warm wood plank UI trims, and traditional pixel-art typography.
>   3. **High Contrast**: WCAG AAA accessibility mode — maximum luminance delta with stark monochrome bases, high-visibility bright yellow/cyan accents, bold outlines, and anti-glare terrain for bright daylight or dim environments.

---

## 1. Architecture & Theme Definitions

```
                     ┌───────────────────────────────┐
                     │          App.tsx              │
                     │  theme: 'cyber'|'classic'|'hc'│
                     │  (Stored in localStorage)     │
                     └───────────────┬───────────────┘
                                     │
      ┌──────────────────────────────┼──────────────────────────────┐
      ▼                              ▼                              ▼
┌──────────────┐              ┌──────────────┐              ┌──────────────┐
│  TopNav.tsx  │              │MapCanvas.tsx │              │Sidebar &     │
│Theme Dropdown│              │Canvas Engine │              │Modals        │
│[Cyber|Classic│              │Terrain Tiles,│              │Blueprint,    │
│|HighContrast]│              │Grid, Markers │              │Chat, Waypoint│
└──────────────┘              └──────────────┘              └──────────────┘
```

### Theme Specification

| Attribute | Neon Cyber-Synth (`cyber`) | Classic Minecraft (`classic`) | High Contrast (`high_contrast`) |
| :--- | :--- | :--- | :--- |
| **App Background** | Deep Obsidian (`#050505`) | Dark Netherite Stone (`#161922`) | Absolute Black (`#000000`) |
| **Panel Surface** | Translucent Obsidian (`#0a0a0a`) | Dark Oak / Slate (`#1f2430`) | Pure Charcoal (`#0f0f0f`) |
| **Border Accents** | Electric Cyan glow (`#00f5ff66`) | Minecraft Stone/Iron (`#3a4253`) | High-Viz White/Yellow (`#ffffff`, `#facc15`) |
| **Primary Highlight** | Magenta & Electric Cyan | Emerald Green (`#10b981`) & Gold | Stark Yellow (`#facc15`) & White |
| **Canvas Background** | Black Void (`#050505`) | World Depths (`#0b0d14` / `#120505`) | Pitch Black (`#000000`) |
| **Biome Colors** | Saturated neon synth tiles | Authentic Minecraft natural colors | High-contrast WCAG-compliant color blocks |
| **Chunk Grid** | Cyber Cyan thin lines | Muted white hairline grid (`0.08`) | Sharp high-visibility white lines (`0.25`) |
| **Shadow / Glow** | Radiant neon box-shadows | Classic subtle depth shadows | Zero-blur solid borders (no ghosting) |

---

## 2. Component & Rendering Changes

### 1. New Theme Engine Utility (`src/utils/themePalettes.ts`)
- Export `AppTheme` type: `'cyber' | 'classic' | 'high_contrast'`.
- Define unified theme configuration objects:
  - Canvas terrain background colors per dimension (`overworld`, `nether`, `the_end`).
  - Biome color transformers:
    - `classic`: Preserves full fidelity natural biome shades from `BIOMES` definition.
    - `cyber`: Applies the electric neon palette (`#39ff14`, `#ff00ff`, `#00f5ff`).
    - `high_contrast`: Maps biomes to distinct, high-contrast accessible color blocks with maximum distinction.
  - Structure marker stroke/fill styles per theme.
  - UI class helpers for background, border, text, and active badge styling.

### 2. Top Navigation Bar (`src/components/TopNav.tsx`)
- Add a theme switcher dropdown menu next to the dimension selector:
  - Button showing current theme icon (`Sparkles` for Cyber, `Box` for Classic, `Eye` for High Contrast).
  - Clean popover selector allowing quick one-click switching.
  - Keyboard shortcut hint (`[T]` to cycle themes).
  - Persist selection automatically to `localStorage` key `'mc_bedrock_theme'`.

### 3. Interactive Map Canvas (`src/components/MapCanvas.tsx`)
- Receive `theme: AppTheme` prop.
- In `renderTerrainLayer`:
  - Dynamically select terrain base background and tile palette based on `theme`.
  - In `high_contrast`: Render bold chunk grid lines and high-contrast coordinate axes for crisp visibility in harsh lighting.
  - In `classic`: Render natural Minecraft grass, sand, water, and deepslate tones.
  - In `cyber`: Retain the vibrant neon cyber-synth aesthetic with glowing overlays.
- Adapt marker pings, reticles, and dimension transition cards to match the chosen visual motif.

### 4. Supporting UI Panels & Modals (`App.tsx`, `BlueprintModal.tsx`, `StructureSidebar.tsx`, `ChatOverlay.tsx`)
- Bind root container classes dynamically to the active theme.
- Ensure the Blueprint Inspector modal, Structure Sidebar, and AI Chat Assistant adapt their borders, headers, and buttons to match the global theme.

---

## 3. Verification & Testing Plan

1. **Compilation & Static Typing**:
   - Run `lint_applet` to ensure strict TypeScript compliance (`tsc --noEmit`).
   - Run `compile_applet` to ensure clean production Vite build.
2. **Visual & Interaction Verification**:
   - Verify switching themes immediately updates the top bar, sidebar, and canvas terrain without reloading the page.
   - Verify persistent theme loading from `localStorage` on page refresh.
   - Test each theme in all three dimensions (Overworld, Nether, The End).
   - Test High Contrast mode in bright and low-light viewports for text legibility and marker contrast.
