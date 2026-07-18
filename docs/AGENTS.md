# AGENTS.md — Pokémon Champions Team Sheet Generator

## Language Preference

**IMPORTANT:** Toda comunicación con el usuario DEBE ser en español. Comentarios del código, commit messages y documentación técnica se mantienen en inglés.

## Project Overview

Vanilla HTML/CSS/JS web application that generates official **Play! Pokémon VG tournament team sheet PDFs** for **Pokémon Champions**. No framework, no bundler. Web only (browser).

- **Game context:** Pokémon Champions — uses **Stat Points (SP)** instead of EVs (max 32 per stat, 66 total, 226 legal Pokémon)
- **Runtime dependency:** `pdf-lib` loaded via CDN (not bundled)
- **Runtime dependency:** PokéAPI (fetched on demand for base stats + name translations, cached in memory)
- **Dev dependency:** `pdfjs-dist` (template PDF coordinate extraction)
- **Dev dependency:** `pdf-lib` (raw PDF stream parsing for checkbox positions, etc.)

---

## Running the App

| Command | URL |
|---------|-----|
| `npm run dev` | http://localhost:8080 |

---

## Directory Structure

```
pokemon-team-sheets/
├── index.html                    # Main page — Team Sheet Generator (import from Showdown/PokePaste) + SEO content section
├── builder.html                  # Team Builder page — create teams from scratch with validation
├── calc.html                     # Damage Calculator page — full Champions damage calc matching NCP reference + SEO content section
├── README.md                     # GitHub project documentation (SEO-indexable)
├── server.js                     # Minimal Node.js static server (port 8080), /builder and /calc routes
├── package.json                  # Scripts: dev
├── package-lock.json
├── node_modules/
├── css/
│   ├── styles.css                # Main page styles, CSS variables, responsive, modal, SEO section
│   ├── builder.css               # Team Builder styles (shared CSS variables with main page, light+dark themes, SP sliders, autocomplete, validation)
│   ├── calc.css                  # Damage Calculator styles (light+dark themes, two-panel NCP layout, responsive, SEO section)
│   └── auth.css                  # Auth module styles (login/register/profile modals, user menu dropdown, dark+light themes)
├── js/
│   ├── translations.js           # PokéAPI name translations (ES↔EN) + nature/type maps + move types + type colors
│   ├── parser.js                 # Showdown/PokePaste text parser
│   ├── pdf.js                    # PDF generation (pdf-lib) + stat calculation (exported)
│   ├── app.js                    # Main page UI logic, state, localStorage, wiring, Pokemon detail modal
│   ├── regulation.js             # Regulation M-B data: 226 legal Pokémon, 148 items, 502 moves + validation
│   ├── builder-champions-api.js  # PokAPI layer for builder: sprites, learnsets, abilities, base stats
│   ├── builder.js                # Team Builder logic: slots, editor, autocomplete, SP, save/load, import/export
│   ├── auth.js                   # Auth module: register, login, logout, session, profile, user-scoped teams
│   ├── type-chart.js             # Type effectiveness chart (19×19 matrix including Stellar)
│   ├── calc-move-data.js         # Move metadata for all 502 legal moves (type, category, BP, flags, PokAPI-sourced)
│   ├── damage.js                 # Damage calculation engine (complete formula, matches NCP VGC reference)
│   └── calc.js                   # Damage Calculator UI: two panels, autocomplete, stat calc, bilingual
├── assets/                       # Static assets (placeholder)
├── play-pokemon-vg-team-list.pdf # Official reference PDF (do not modify)
├── docs/
│   ├── AGENTS.md                 # Project documentation
│   ├── STAFF.png                 # Reference image — staff sheet layout
│   ├── JUGADOR.png               # Reference image — opponent sheet layout
│   └── references/
│       └── detalle_pokemon.png   # Reference image — Pokemon detail modal
└── node_modules/                 # npm dependencies (dev only)
```

---

## Architecture

### Data Flow

#### Main Page (index.html)
```
User input (URL or text)
  → ShowdownParser.parse()          [parser.js]
  → team[] array (6 slots)          [app.js — original English names]
  → PokeTranslations.translateTeam() [translations.js]
  → translatedTeam[]                [app.js — names in selected language]
  → renderTeamGrid()                [app.js — displays translated names]
  → TeamSheetPDF.generate()         [pdf.js]
    → fetch play-pokemon-vg-team-list.pdf (template, cached)
    → _fetchBaseStats() via PokéAPI using _original?.species (English, base name only)
    → Falls back to slug-male / slug-female if base species not found
    → copy template pages into new document
    → overlay translated player data + Pokemon values at exact coordinates
  → PDF download

Pokemon Detail Modal (on card click):
  → openPokemonModal(index)         [app.js]
    → PokeTranslations.fetchPokemonSprite(species, gender) → large sprite (base name first, gender fallback)
    → PokeTranslations.fetchPokemonTypes(species, gender) → type badges (same fallback)
    → TeamSheetPDF.fetchBaseStats(species) → base stats (cached, same fallback)
    → TeamSheetPDF.getStatValues() → calculated final stats
    → PokeTranslations.fetchMoveType() → move type for color badges
    → PokeTranslations.getTypeColor() → hex color from TYPE_COLORS map
    → PokeTranslations.fetchMoveDescription() → short effect text for move tooltips
```

#### Team Builder (builder.html)
```
User creates team in Builder UI
  → TeamBuilder.team[] array (6 slots, English names)
  → RegulationMB.validateTeam() validates all rules
  → ChampionsAPI.fetchPokemonFull() fetches learnsets/abilities from PokAPI
  → On import:
    → ShowdownParser.parse() extracts species, gender, moves, EVs
    → RegulationMB.convertEVsToSP() converts EVs to SP
    → RegulationMB.getPokemonData() sets _types and _baseStats immediately
    → loadPokemonAPIData() fetches sprites/learnsets/abilities in background
  → On export:
    → PDF: TeamSheetPDF.generate() (same as main page, SP→EV conversion)
    → Showdown: exportToShowdownText() (SP→EV conversion for compatibility)
  → On save: localStorage[pokemon_champion_teams] stores full team data (with userId if logged in)
  → On load: if logged in, auto-fills player data from profile if draft is empty
```

### Module Pattern

All JS files use the **IIFE module pattern** (no ES modules, no imports):

```js
const ModuleName = (() => {
  // private
  function helper() {}
  // public API
  return { publicMethod };
})();
```

Loaded in order via `<script>` tags: `translations.js` → `parser.js` → `pdf.js` → `auth.js` → `app.js`.

**Builder page load order:** `translations.js` → `parser.js` → `pdf.js` → `regulation.js` → `auth.js` → `builder-champions-api.js` → `builder.js`.

**Calculator page load order:** `translations.js` → `parser.js` → `pdf.js` → `regulation.js` → `builder-champions-api.js` → `type-chart.js` → `calc-move-data.js` → `damage.js` → `calc.js`.

---

## Auth System (localStorage)

### Overview

User authentication and profile management using `localStorage`. No server-side component. Passwords are hashed with SHA-256 via `SubtleCrypto`.

### `js/auth.js` — PokeAuth

**Exports:** `{ register, login, logout, isLoggedIn, getCurrentUser, getProfile, updateProfile, getSavedTeams, saveTeamToStorage, deleteTeamFromStorage, loadTeamFromStorage, renderAuthButton, openLoginModal, openRegisterModal, openProfileModal }`

**localStorage keys:**
- `pokemon_users` — Array of user objects: `{ id, username, email, password (hashed), profile, createdAt }`
- `pokemon_current_user` — ID of the currently logged-in user

**User profile structure:**
```js
{
  playerName: '',
  trainerName: '',
  playerId: '',
  dobMm: '', dobDd: '', dobYyyy: '',
  teamNumber: '',
  switchProfile: '',
  supportId: '',
  ageDivision: 'Masters',
}
```

**Key functions:**
- `register(username, email, password)` → Creates user, hashes password, starts session
- `login(username, password)` → Validates credentials, starts session
- `logout()` → Clears session
- `renderAuthButton(containerId)` → Renders login button or user menu dropdown in the given container
- `getSavedTeams()` → Returns teams filtered by current user's ID
- `saveTeamToStorage(teamObj)` → Saves team with userId attached

**UI components:**
- Login button in header → opens login modal
- User avatar + dropdown (Profile, Logout) when logged in
- Register modal with username/email/password/confirm
- Profile modal with all player data fields (8 fields matching the team sheets)

**Integration with builder.js:**
- `getSavedTeams()` returns only the current user's teams
- `saveTeam()` adds `userId` to saved team objects
- On draft load, if logged in and no draft data, auto-fills from profile
- "Cargar perfil" button visible only when logged in with profile data

**Integration with app.js:**
- Same `renderAuthButton()` for header
- "Cargar datos del perfil" button visible only when logged in with profile data
- On page load, if logged in and no draft data, auto-fills from profile

---

## File Responsibilities

### `js/parser.js` — ShowdownParser

**Exports:** `{ parse, isPokepasteUrl, fetchPokepaste }`

- `parse(text)` → Array of Pokémon objects
- `fetchPokepaste(url)` → Fetches raw text from `pokepast.es/{id}/raw`
- Parses: species, nickname, item, gender, ability, nature, level, shiny, happiness, teraType, EVs, IVs, moves
- **Gender extraction order:** Gender `(M)`/`(F)`/`(N)` is extracted FIRST from anywhere on the line, then item, then nickname/species. This prevents `Basculegion (M) @ Item` from being parsed as species=`M`.

### `js/translations.js` — PokeTranslations

**Exports:** `{ translateSpecies, translateMove, translateItem, translateAbility, translateNature, translateType, translatePokemon, translateTeam, fetchPokemonSprite, fetchPokemonTypes, fetchMoveType, fetchMoveDescription, getTypeColor }`

- Fetches translated names from PokéAPI (`/api/v2/{category}/{name}` → `names[]`)
- **Cache:** In-memory by category (`species`, `move`, `item`, `ability`, `type`), keyed by normalized slug
- **Languages:** Supports `'es'` (Spanish) and `'en'` (English)
- **Natures:** Local mapping (25 natures, ES↔EN), no API call needed
- **Types:** Local mapping (18 types + Stellar, ES↔EN), no API call needed
- `translateTeam(team, lang)` → Returns new array with translated Pokémon objects
- Each translated Pokémon includes `_original` property with English names (used for PokéAPI lookups and stat calculations)
- API normalization: lowercase, remove accents, spaces→hyphens, strip special chars
- Falls back to English name if API call fails or translation not found
- `fetchPokemonSprite(species, gender?)` → Returns official artwork URL from PokéAPI (cached in `spriteCache`). Uses `POKEAPI_SLUG_MAP` to resolve slug mismatches (e.g., `aegislash` → `aegislash-shield`). Tries base species name first, then falls back to `species-gender` slug if gender param provided (e.g., `basculegion-male`)
- `fetchPokemonTypes(species, gender?)` → Returns array of type names (cached in `typesCache`). Delegates to `fetchPokemonSprite` for data. Same gender fallback.
- `fetchMoveType(moveName)` → Returns English type name of a move from PokéAPI (cached in `moveTypeCache`)
- `fetchMoveDescription(moveName, lang?)` → Returns short effect text of a move from PokéAPI (cached in `moveDescCache`). Tries `effect_entries` first (`short_effect` → `effect`), falls back to `flavor_text_entries` (`flavor_text`) when effect_entries is empty (common for newer Gen IX moves). Cleans `\n`/`\f` characters from flavor text. Used for move tooltips in the detail modal.
- `getTypeColor(typeName)` → Returns hex color for a type name (from `TYPE_COLORS` map)
- `TYPE_COLORS` — Map of 18 types + Stellar to hex colors for move type badges

**Pokémon object structure:**
```js
{
  species: 'Swampert',
  nickname: '',
  item: 'Swampertite',
  gender: 'Male' | 'Female' | 'NA',
  ability: 'Damp',
  nature: 'Jolly',
  level: 50,
  shiny: false,
  happiness: 255,
  teraType: 'Water',
  evs: { hp: 11, atk: 32, def: 0, spa: 0, spd: 0, spe: 23 },  // Stat Points (SP), NOT EVs
  ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 }, // Not used in Champions
  moves: ['Protect', 'Earthquake', 'Ice Punch', 'Wave Crash']
}
```
> **Note:** `evs` field contains Champions **Stat Points** (0–32 per stat, 66 total), parsed from the standard Showdown "EVs:" line. IVs are parsed but not used in stat calculation.

### `js/pdf.js` — TeamSheetPDF

**Exports:** `{ generate, downloadPdf, fetchBaseStats, getStatValues, NATURE_MAP }`

- `generate(playerData, team, mode)` → PDF bytes
- `mode`: `'staff'` | `'open'` | `'both'`
- Uses `pdf-lib` (CDN: `unpkg.com/pdf-lib@1.17.1`)
- Font: Helvetica + HelveticaBold (StandardFonts)
- Template: `play-pokemon-vg-team-list.pdf` (fetched from server, cached in memory)
- `fetchBaseStats(species)` → Fetches base stats from PokéAPI (cached in `_statCache`), used by both PDF generation and the detail modal. Uses `POKEAPI_SLUG_MAP` to resolve slug mismatches. Tries base species name first, then `slug-male`, then `slug-female` as fallback.
- `getStatValues(pokemon, baseStatsMap)` → Calculates final stat values using Champions formula
- `NATURE_MAP` — Maps 20 non-neutral natures to `{ plus, minus }` stat keys

**Template-based approach:**
- Loads the official blank form PDF as a template
- Copies template pages (page 1 = staff, page 2 = open) into new document
- Overlays ONLY the dynamic text (player data, Pokemon values) on top
- The template provides the exact layout (lines, borders, labels, checkboxes)
- `pdf.js` does NOT draw any structural elements — only fills in data

**Text overlay coordinates (extracted from reference via pdfjs-dist + raw PDF stream parsing):**
- Player info values are drawn at exact X/Y positions matching the template
- Pokemon cell values are drawn right after each label in the grid
- Age Division checkboxes are marked with 'x' at positions extracted from raw PDF `re` (rectangle) operations
- **Stats section** displays calculated stat values using **Pokémon Champions formula**:
  - `HP = Base + StatPoints + 75`
  - `Other = floor((Base + StatPoints + 20) × Alignment)`
  - Alignment = 1.1 (raised), 0.9 (lowered), 1.0 (neutral)
  - Base stats fetched from PokéAPI (`_fetchBaseStats()`) using `p._original?.species` (English name)
  - Nature multipliers: `NATURE_MAP` maps 20 non-neutral natures using `p._original?.nature` (English name)
  - IVs are NOT used in Champions stat calculation
  - Translated Pokémon objects have `_original` property with English names for API lookups

### `js/app.js` — Application Logic

**State:**
- `team[]` — Array of 6 slots (null or Pokémon objects, always in English)
- `translatedTeam[]` — Array of 6 slots (translated Pokémon objects, or English if `currentLang === 'en'`)
- `currentLang` — `'es'` or `'en'`, persisted to `localStorage.tsLang`

**Language switching:**
- `applyLanguage(lang)` → updates UI labels + calls `translateAndRender()`
- `translateAndRender()` → calls `PokeTranslations.translateTeam()` → stores result in `translatedTeam[]` → calls `renderTeamGrid()`
- `renderTeamGrid()` → displays `translatedTeam` names (or `team` if English)
- `handlePdf()` → passes `translatedTeam` to `TeamSheetPDF.generate()`
- `importTeam()` → stores parsed team in `team[]`, triggers `translateAndRender()`

**Pokemon Detail Modal:**
- Click on a filled pokemon card → `openPokemonModal(index)`
- Shows: large sprite, name, item, ability, nature, level, gender, shiny, tera type
- Stat bars with base stats (red, from PokéAPI), calculated final values, nature indicators (▲/▼), and Stat Points
- Moves displayed as colored badges (color fetched from PokéAPI by move type)
- Move tooltips: hovering over a move badge shows the move's short effect description (fetched from PokéAPI via `fetchMoveDescription()`, cached in `moveDescCache`). Tooltips overflow the modal via temporary `overflow: visible` toggle on `.modal-content` during hover.
- Closes with: X button, click outside overlay, or Escape key
- Stat calculation reuses `TeamSheetPDF.fetchBaseStats()` and `TeamSheetPDF.getStatValues()` (exported from pdf.js)
- Move type colors use `PokeTranslations.fetchMoveType()` and `PokeTranslations.getTypeColor()` (exported from translations.js)
- Move descriptions use `PokeTranslations.fetchMoveDescription()` (exported from translations.js)

**Player data fields** (matching official PDF):
- `playerName` — Player Name
- `trainerName` — Trainer Name in Game
- `playerId` — Player ID
- `dob` — Date of Birth (MM/DD/YYYY)
- `teamNumber` — Battle Team Number / Name
- `switchProfile` — Switch Profile Name
- `supportId` — Support ID
- `ageDivision` — 'Juniors' | 'Seniors' | 'Masters'

**localStorage:**
- `tsLang` — Language preference
- `tsDraft` — Full player data + team (auto-saved on input changes)
- `tsTheme` — Dark mode preference (`'dark'` | `'light'`, defaults to `prefers-color-scheme`)
- `pokemon_users` — Array of registered user objects (auth.js)
- `pokemon_current_user` — ID of the currently logged-in user (auth.js)

**Dark mode:**
- Toggle button in header (`#themeToggle`) next to language toggle
- `applyTheme(dark)` → toggles `data-theme` attribute on `<html>` (`'dark'` or `'light'`), updates icon (☀/☾), persists to `localStorage.tsTheme`
- On load: respects `prefers-color-scheme: dark` if no saved preference
- CSS uses `[data-theme="dark"]` / `[data-theme="light"]` attribute selectors on `<html>` to override CSS custom properties
- All three pages (index, builder, calc) use `setAttribute('data-theme', ...)` in their JS files

**Input text cleaning:**
- `importTeam(text)` cleans input before parsing: strips BOM, replaces invisible Unicode chars (zero-width, non-breaking), normalizes line endings, removes trailing whitespace per line, collapses 3+ blank lines
- After successful import, both input fields are cleared (`pokepasteUrl.value = ''`, `showdownText.value = ''`)

### `index.html`

- Bilingual via `data-es` / `data-en` attributes on elements
- Language toggle updates all matching elements
- Header contains hamburger button (`#menuToggle`) for navigation drawer, `.header-brand` (pokeball + title, centered), and `.header-actions` div with auth container (`#authContainer`), language toggle (`#langToggle`) and dark mode toggle (`#themeToggle`)
- Player section has `#loadProfileBtn` button (hidden by default, shown when logged in with profile data) to fill player fields from user profile
- Navigation drawer (`#drawer` + `#drawerOverlay`) contains links to Hojas, Builder, Calc. Slides in from left on hamburger click, closes on overlay click or re-click
- External dependency: `pdf-lib@1.17.1` from unpkg CDN
- Form fields use specific IDs that must match `app.js` els object
- Pokemon detail modal (`#pokemonModal`) — overlay with sprite, info, stat bars, and moves

### `css/styles.css`

- CSS custom properties for theming (light + dark via `data-theme` attribute on `<html>`)
- Dark mode: default (`:root` defines dark values). Light mode: `[data-theme="light"]` overrides
- Shared design system variables: `--bg-deep`, `--bg-surface`, `--bg-elevated`, `--bg-hover`, `--accent`, `--accent-hover`, `--accent-glow`, `--gold`, `--text-primary`, `--text-secondary`, `--text-muted`, `--border`, `--border-strong`, `--radius-sm/md/lg/xl`, `--shadow-sm/glow`, `--font-display`, `--font-body`, `--transition-fast`
- All three CSS files (styles.css, builder.css, calc.css) define the same shared variables
- Responsive: two-column → single-column at 900px (form) and 600px (team grid)
- Key colors: `--accent: #e63946` (red), `--gold: #f4a261`
- Pokemon detail modal styles: overlay, content card, stat bars (color-coded per stat), move badges with hover tooltips, responsive layout
- Navigation drawer styles: `.hamburger-btn` (3-bar → X animation), `.drawer-overlay` (backdrop), `.drawer` (slide-in from left), `.drawer-link` (with `.active` state). Visible on all screen sizes, replaces inline `header-nav`

### `server.js`

- Zero-dependency Node.js static file server
- Port 8080, serves from `__dirname`
- MIME types: html, css, js, json, png, jpg, svg, pdf
- Route: `/builder` → serves `builder.html`
- Route: `/calc` → serves `calc.html`

---

## Team Builder (Regulation M-B)

### Overview

The Team Builder (`builder.html`) is a **separate page** from the main Team Sheet Generator. It allows creating teams from scratch with **full Regulation M-B validation**, then exporting to PDF or Showdown text format.

**Key differences from the main page:**
- Teams are built manually (not imported from Showdown)
- Validation against Regulation M-B (226 legal Pokémon, 148 items, 502 moves)
- Stat Points (SP) system: 66 total, max 32 per stat
- Cross-reference validation: Pokémon learnsets vs legal moves
- Save/load teams to localStorage (manual save, not auto-save)

### Data Flow

```
User creates team in Builder UI
  → TeamBuilder.team[] array (6 slots, English names)
  → RegulationMB.validateTeam() validates all rules
  → ChampionsAPI.fetchPokemonFull() fetches learnsets/abilities from PokAPI
  → On load (draft/saved team):
    → Populates _types/_baseStats from RegulationMB if missing
    → loadPokemonAPIData() refreshes sprites/types/stats from PokAPI in background
  → On export:
    → PDF: TeamSheetPDF.generate() (same as main page, SP→EV conversion)
    → Showdown: exportToShowdownText() (SP→EV conversion for compatibility)
  → On save: localStorage[pokemon_champion_teams] stores full team data (with userId if logged in)
  → On load: if logged in, auto-fills player data from profile if draft is empty
```

### Regulation M-B Validation Rules

| Rule | Description |
|------|-------------|
| **Pokémon legal** | Only the 226 in `RegulationMB.LEGAL_POKEMON` |
| **Item legal** | Only the 148 in `RegulationMB.LEGAL_ITEMS` |
| **Move legal** | Only the 502 in `RegulationMB.LEGAL_MOVES` |
| **Move learnable** | Must be in PokAPI learnset AND in legal moves list |
| **Ability legal** | Must be available to the Pokémon in Champions |
| **Species clause** | No duplicate species (same National Dex number) |
| **Item clause** | No duplicate held items |
| **SP total** | Exactly 66 (warning if < 66, error if > 66) |
| **SP per stat** | Max 32 per stat |
| **4 moves** | Exactly 4 moves required |

### File Responsibilities

#### `js/regulation.js` — RegulationMB

**Exports:** `{ LEGAL_POKEMON, LEGAL_ITEMS, LEGAL_MOVES, MEGA_STONES_PER_POKEMON, NATURES, MAX_SP, MAX_SP_PER_STAT, STAT_KEYS, isLegalPokemon, isLegalItem, isLegalMove, getPokemonData, getMegaStones, isMegaStoneLegal, validateSP, validateSpeciesClause, validateItemClause, validatePokemon, validateTeam, convertSPtoEVs, convertEVsToSP, searchPokemon, searchItems, searchMoves, getNatureMultiplier, calculateStat }`

- All data hardcoded from official Regulation M-B sources (Victory Road, MetaVGC, Serebii)
- `LEGAL_POKEMON` — Array of 226 objects: `{ name, types, baseStats, abilities, mega? }`. Includes `Basculegion-F` as separate entry with female stats. Aegislash uses Shield Forme stats as default.
- `LEGAL_ITEMS` — Array of 148 item names
- `LEGAL_MOVES` — Array of 502 move names
- `MEGA_STONES_PER_POKEMON` — Map of Pokémon to their legal Mega Stones
- `searchPokemon(query, limit)` — Filtered search against legal Pokémon. Returns all when query is empty. Strips `(M)`/`(F)`/`(N)` gender markers from query before searching
- `searchItems(query, limit)` — Filtered search against legal items. Returns all when query is empty
- `searchMoves(query, limit)` — Filtered search against legal moves. Returns all when query is empty
- `validateTeam(team)` — Full team validation (species clause, item clause, per-Pokémon validation)
- `convertSPtoEVs(sp)` — Convert SP (0-32) to Showdown EVs (4-252) for export compatibility
- `convertEVsToSP(evs)` — Convert Showdown EVs to SP for import compatibility. Auto-detects: if total ≤ 66, values are already SP (used directly); if total > 66, converts from traditional EVs using formula

**SP to EV conversion formula:**
- 1st SP = 4 EVs, each additional SP = 8 EVs
- Example: 32 SP → 4 + 31×8 = 252 EVs

#### `js/builder-champions-api.js` — ChampionsAPI

**Exports:** `{ fetchPokemonSpecies, fetchSprite, fetchAbility, fetchMove, fetchPokemonFull, filterLearnsetByLegalMoves, prefetchPopular }`

- Wraps PokAPI calls for builder-specific needs
- Uses `POKEAPI_SLUG_MAP` to resolve slug mismatches (e.g., `aegislash` → `aegislash-shield`)
- `fetchPokemonFull(speciesName)` — Returns species data + filtered learnset (only legal moves) + filtered abilities
- Types are capitalized from PokéAPI (e.g., `"water"` → `"Water"`) to match CSS class selectors
- `filterLearnsetByLegalMoves(apiMoves, legalMoves)` — Intersection of PokAPI learnset and legal moves
- All results cached in memory

#### `js/builder.js` — TeamBuilder

**Internal constants:**
- `STAT_KEYS`, `STAT_LABELS`, `STAT_MAX` — Stat definitions
- `NATURE_MAP` — 20 non-neutral natures (same as `pdf.js`)

**State:**
- `team[]` — Array of 6 slots (null or Pokémon objects)
- `activeSlot` — Currently selected slot index (-1 if none)
- `apiCache` — Cached PokAPI responses by species name
- `importBuffer` — Temporary storage for Showdown import

**Builder Pokémon object structure:**
```js
{
  species: 'Garchomp',
  nickname: '',
  item: 'Life Orb',
  ability: 'Rough Skin',
  nature: 'Jolly',
  gender: 'Male',
  shiny: false,
  teraType: 'Steel',
  sp: { hp: 4, atk: 32, def: 0, spa: 0, spd: 0, spe: 30 },  // 66 total
  moves: ['Earthquake', 'Dragon Claw', 'Rock Slide', 'Protect'],
  _spriteURL: '...',     // Cached from PokAPI
  _types: ['Dragon', 'Ground'],  // From RegulationMB or PokAPI
  _baseStats: { hp: 108, atk: 130, def: 95, spa: 80, spd: 85, spe: 102 },  // From RegulationMB or PokAPI
  _apiData: { ... },     // Full PokAPI response (learnsets, abilities)
}
```

**localStorage keys:**
- `pokemon_champion_teams` — Saved teams array: `{ name, date, team, playerData, userId? }` (userId added when auth is active)
- `pokemon_champion_teams_draft` — Auto-saved current working state

**Key functions:**
- `calcFinalStat(baseStat, spVal, nature, statKey)` — Calculates final stat: HP = base + sp + 75, others = floor((base + sp + 20) × natureMult)
- `updateStatPreview(pokemon)` — Renders live stat preview below SP sliders (base, nature, bar, final, SP). Called on every SP slider input and nature change
- `loadPokemonAPIData(pokemon)` — Fetches full data from PokAPI (sprites, learnsets, abilities). Populates `_apiData`, `_spriteURL`, `_types`, `_baseStats`. Calls `updateStatPreview()` and `renderTeamSlots()` after loading. Also updates editor sprite/type elements in DOM if editor is showing this Pokémon

### UI Components

1. **Team Slots** — 6 clickable slots with sprites, remove buttons
2. **Pokémon Editor** — Autocomplete inputs for species/item/ability/moves
3. **SP Editor** — Range sliders (0-32) with total counter
4. **Stat Preview** — Live stat bars below SP sliders showing base stats, final stats (with SP + nature), nature indicators (▲/▼), and SP values. Updates in real-time as sliders change
5. **Detail Row** — Nature dropdown, gender buttons, Tera Type selector
6. **Validation Panel** — Real-time error/success messages
7. **Player Data** — Same fields as main page, with "Cargar perfil" button (visible when logged in)
8. **PDF Export** — Reuses `TeamSheetPDF.generate()` from pdf.js
9. **Saved Teams** — List with load/delete actions (user-scoped when logged in)

### Autocomplete System

- **Showdown-style behavior:** Clicking/focusing an input shows ALL valid options immediately (empty query returns full list). Typing filters the results in real-time
- Uses `mousedown` (not `click`) on items to prevent blur race condition
- Keyboard navigation: ArrowUp/Down to select, Enter to confirm, Escape to close
- On Pokémon selection: extracts gender `(M)`/`(F)`/`(N)` from raw input query, fetches full data from PokAPI (types, stats, learnsets, abilities)
- **Pokemon:** `RegulationMB.searchPokemon(q)` — all 226 legal Pokémon on focus, filtered by name as you type
- **Item:** `RegulationMB.searchItems(q)` — all 148 legal items on focus, filtered as you type
- **Ability:** Filters against Pokémon's `_apiData.legalAbilities` (or `_apiData.abilities` fallback). Empty query shows all abilities for the selected Pokémon. Requires species to be selected first
- **Moves:** `RegulationMB.searchMoves(q)` filtered by legal moves ∩ Pokémon learnset. Empty query shows all learnable moves
- Search functions in `regulation.js` return full lists when query is empty (no limit parameter required)

---

## Damage Calculator (calc.html)

### Overview

The Damage Calculator (`calc.html`) is a **separate page** that provides full Champions damage calculation matching the [NCP VGC Damage Calculator](https://nerd-of-now.github.io/NCP-VGC-Damage-Calculator/) reference. It features a two-panel NCP-style UI with bilingual support (ES/EN).

**Key characteristics:**
- Champions format: level 50, fixed 31 IVs, SP (Stat Points 0–32) instead of EVs
- Complete damage formula: all modifiers, spread, weather, terrain, abilities, items, STAB, type effectiveness
- Two Pokémon panels (attacker vs defender)
- Real-time damage ranges (min% – max%) for all 4 moves
- Bilingual ES/EN via `data-es` / `data-en` attributes
- Dark mode support (synced with main page/builder)

### Data Flow

```
User selects Pokémon on either panel
  → ChampionsAPI.fetchPokemonFull() fetches data from PokAPI
  → CalcMoveData.getMoveData() provides move metadata (type, BP, flags)
  → DamageCalc.calcAllMoves(attacker, defender, field) calculates all 4 moves
  → Results displayed as damage ranges (min% – max%)
```

### File Responsibilities

#### `js/type-chart.js` — TypeChart

**Exports:** `{ getTypeEffectiveness, getSingleEffectiveness, TYPES }`

- 19×19 type effectiveness matrix (18 types + Stellar)
- `getSingleEffectiveness(attackType, defenseType)` → returns 0, 0.5, 1, or 2
- `getTypeEffectiveness(attackType, defenseTypes)` → combined effectiveness across multiple types
- Hardcoded from official Pokémon type chart data

#### `js/calc-move-data.js` — CalcMoveData

**Exports:** `{ getMoveData, MOVES }`

- Move metadata for all 502+ legal moves in Regulation M-B
- Each move includes: `name`, `type`, `category`, `bp`, `flags`
- Flags: `makesContact`, `isSpread`, `hasSecondaryEffect`, `hasRecoil`, `isPunch`, `isSound`, `isPulse`, `isSlice`, `isBullet`, `isBall`
- **Variable BP moves** have `bp: 0` — actual BP is computed at runtime by `computeVariableBP()` in `damage.js` based on user/defender stats
- Data sourced from PokAPI and cross-referenced with NCP calculator

#### `js/damage.js` — DamageCalc

**Exports:** `{ calcHP, calcStat, getNatureMultForStat, getModifiedStat, getStatWithBoosts, getHPWithBoosts, calcDamage, calcAllMoves, getSTAB, getTypeEffectiveness }`

- Complete damage calculation engine matching NCP VGC formula exactly
- **Stat formulas (Champions):**
  - HP: `floor((base * 2 + 31) * 50 / 100) + 50 + 10 + SP`
  - Other: `floor(((floor((base * 2 + 31) * 50 / 100) + 5) + SP) * natureMult)`
- **Damage formula steps:**
  1. Attack stat (with Hustle, ability modifiers)
  2. Defense stat (with weather boosts, ability modifiers)
  3. Base power (with item/ability/terrain/field modifiers)
  4. Base damage: `floor(floor(floor((2*level/5+2) * BP * Atk / Def) / 50 + 2)`
  5. Spread modifier (before random)
  6. Weather modifier (before random)
  7. Glaive Rush modifier (before random)
  8. Critical hit modifier (before random)
  9. Random factor loop (85%–100%) with STAB, type effectiveness, burn, final mods
- **Rounding:** Uses `pokeRound` (round .5 down) and `Math.round` in `chainMods` to match NCP
- **STAB logic:** Handles Terastal (non-Stellar, Stellar), Adaptability, Protean/Libero
- **Type effectiveness:** Single-type and dual-type calculations with ability overrides (Levitate)
- **Variable BP:** `computeVariableBP(moveData, attacker, defender)` computes BP for moves whose power depends on stats at runtime:
  - **Attacker HP ratio** (150 BP at full): Water Spout, Eruption
  - **Defender HP ratio** (120 BP at full): Crush Grip, Wring Out, Hard Press
  - **Attacker HP low** (20–200 BP): Flail, Reversal
  - **Attacker HP at 1**: Endeavor
  - **Speed ratio**: Gyro Ball, Electro Ball
  - **Weight ratio**: Grass Knot, Low Kick, Heavy Slam, Heat Crash
  - **Stat boosts** (20 + 20 × positive stages): Stored Power, Power Trip

#### `js/calc.js` — DamageCalcUI

**Exports:** `{ init }`

- Main UI controller for the damage calculator
- **State:**
  - `state.left` / `state.right` — Pokémon data for each panel
  - `state.field` — Field conditions (weather, terrain, screens, format)
  - `state.selectedMove` — Currently selected move for detailed view
  - `state.lang` — Language preference (ES/EN)
- **Features:**
  - Autocomplete inputs for species, item, ability, moves (uses RegulationMB search functions)
  - Stat display with SP sliders and nature selection
  - Field condition toggles (weather, terrain, screens, format)
  - Real-time damage calculation on any input change
  - Bilingual UI labels via `data-es` / `data-en`
  - Dark mode support (synced with `localStorage.tsTheme`)

### UI Components

1. **Two-panel layout** — Left panel (attacker) vs Right panel (defender), each with Pokémon selection, stats, moves
2. **Pokémon autocomplete** — Species, item, ability, 4 move inputs with autocomplete
3. **Stat display** — HP, Atk, Def, Spa, Spd, Spe with SP sliders and nature dropdown
4. **Field conditions** — Weather, terrain, screens, format (Singles/Doubles) with toggle buttons
5. **Result banner** — Shows damage ranges for all 4 moves (min% – max%) with selected move highlighted
6. **Language toggle** — ES/EN switch for all UI labels
7. **Dark mode toggle** — Synced with main page/builder preference

### Damage Formula Reference

The damage calculation follows the complete NCP VGC formula:

```
damage = floor(floor(floor((2×level/5+2) × BP × Atk / Def) / 50 + 2) × modifiers)
```

Where modifiers are applied in this order:
1. **Spread** (Doubles): ×0.75
2. **Weather**: ×1.5 (boosted type) or ×0.5 (reduced type)
3. **Glaive Rush**: ×2.0
4. **Critical hit**: ×1.5
5. **Random**: ×(85+i)/100 for i=0..15
6. **STAB**: ×1.5 or ×2.0 (with Tera/Adaptability/Protean)
7. **Type effectiveness**: ×0, ×0.25, ×0.5, ×1, ×2, ×4
8. **Burn**: ×0.5 (physical only, non-Guts)
9. **Final mods**: Screens, Life Orb, Expert Belt, Tinted Lens, resist berries, etc.

**Rounding rules:**
- `pokeRound`: Rounds .5 down (not always up)
- `chainMods`: Uses `Math.round` (not `Math.floor`)
- Type effectiveness and burn use `Math.floor`

---

## Known Issues / Bug History

### 1. PDF Black Background (FIXED — no longer applicable)
**Problem:** Old approach drew `drawRectangle()` which fills with black by default.
**Fix:** New template-based approach doesn't draw any rectangles — the template provides all structural elements.

### 2. Opponent Page Data Duplication (FIXED — no longer applicable)
**Problem:** Old approach drew labels in both columns.
**Fix:** Template approach only overlays values. Open page right column is simply not drawn on.

### 3. Wrong Player Info Fields (FIXED)
**Problem:** Original form had First Name, Surname, Event Name, Event Dates, Game, Format.
**Fix:** Replaced with official fields: Player Name, Trainer Name in Game, Battle Team Number/Name, Switch Profile Name, Support ID.

### 4. PDF Layout Not Matching Reference (FIXED)
**Problem:** Hand-coded coordinates never matched the official PDF exactly.
**Fix:** Switched to template-based approach — the official PDF IS the layout, we only overlay data.

### 5. Pokemon Name & Nature X Misalignment (FIXED)
**Problem:** Pokemon name and nature were drawn at `contentX` (label column base), while ability/item/moves values were drawn at a computed `valueX` (after label text). All values should share the same left X.
**Fix:** Compute `valueX = contentX + width("Ability", 13.9) + 2` and use it for pokemon name, nature, and all values. Applied in both `_fillStaffCell` and `_fillOpenCell`.

### 6. Staff Stats Drawn On Top of Template Labels (FIXED)
**Problem:** Stats used `sx` (228.8/520.9) as base X, but template labels are at 248.8/540.9. Values were drawn 20pt to the left of where they should be, overlapping the template labels.
**Fix:** Use `statBaseX` (248.8/540.9) matching the template label positions. Values placed at `statBaseX + labelWidth + 2`.

### 7. Staff Stats Showing Raw EVs Instead of Calculated Stats (FIXED)
**Problem:** Stats section displayed raw EV values (0-252) instead of actual calculated stat values at the Pokémon's level.
**Fix:** Added Champions stat formula: `HP = Base + SP + 75`, `Other = floor((Base + SP + 20) × Alignment)`. Added `_fetchBaseStats()` using PokéAPI with in-memory cache. Added `NATURE_MAP` for nature multiplier calculation. Stats now computed from base stats (PokéAPI) + Stat Points + nature alignment.

### 8. Age Division Checkbox 'x' Outside Box (FIXED)
**Problem:** The 'x' mark for Age Division was drawn below the checkbox labels instead of inside the checkbox squares.
**Fix:** Extracted exact checkbox positions from raw PDF content stream (`re` rectangle operations). Checkboxes are at: Juniors (477.7, 708.8), Seniors (533.3, 709.2), Masters (582.9, 710.2). Note: checkboxes are positioned AFTER their labels (to the right), not before them.

### 9. `fetchPokemonSprite` Lost After Adding Move Type Colors (FIXED)
**Problem:** When adding `TYPE_COLORS`, `moveTypeCache`, `fetchMoveType()`, and `getTypeColor()` to `translations.js`, the edit accidentally replaced the `fetchPokemonSprite` function definition (it was in the same block of code). This broke both sprites in the team grid and the detail modal.
**Fix:** Restored `fetchPokemonSprite` function definition before `TYPE_COLORS`. Always verify that existing functions are not removed when adding new code via edit operations.

### 10. Gendered Pokémon API Lookups Fetch Wrong Slug (FIXED)
**Problem:** Species like `Basculegion (M)` and `Floette-Eternal (F)` failed PokéAPI lookups. The parser extracts `(M)`/`(F)` markers but the Showdown format `Species (M) @ Item` caused the parser to misidentify gender as species. The parser's `parseFirstLine` regex `^(.+?)\s*\(\s*(.+?)\s*\)\s*$` matched `Basculegion (M)` as nickname=`Basculegion`, species=`M`, resulting in API call to `/pokemon/m`.
**Fix (parser):** Extract gender `(M)`/`(F)`/`(N)` FIRST from anywhere on the line before extracting item or nickname/species. This correctly handles both `Species (M) @ Item` and `Species @ Item (M)` formats.
**Fix (API strategy):** Always query PokéAPI with base species name first (e.g., `basculegion`, `floette-eternal`). Only fall back to gendered slug (`basculegion-male`) if the base name returns 404. This works because most Pokémon share base stats across genders. Applies to `fetchPokemonSprite`, `fetchPokemonTypes`, and `_fetchBaseStats`.

### 11. Move Tooltips Clipped by Modal Overflow (FIXED)
**Problem:** Move tooltips (`.move-tooltip`) used `position: absolute` relative to `.modal-move-tag`, but `.modal-content` had `overflow-y: auto` which clipped tooltips that extended above the modal viewport.
**Fix:** On `mouseenter` of a move tag, temporarily set `.modal-content` overflow to `visible` so the tooltip can escape. On `mouseleave`, restore the original overflow. This preserves the original CSS/JS tooltip design with zero visual changes.

### 12. Some Moves Missing Tooltips (e.g., Kowtow Cleave, Trailblaze) (FIXED)
**Problem:** Newer Gen IX moves like Kowtow Cleave and Trailblaze have `effect_entries: []` (empty) in PokéAPI, so `fetchMoveDescription()` returned `null`.
**Fix:** Added fallback to `flavor_text_entries` — when `effect_entries` has no entries, the function now checks `flavor_text_entries` for `flavor_text` in the same language priority (requested → English → first available). Also cleans `\n`/`\f` characters from flavor text.

### 13. Builder PDF Export Buttons Not Working (FIXED)
**Problem:** The three PDF export buttons (Open Sheet, Staff Sheet, Both Sheets) in the builder did nothing when clicked. `TeamSheetPDF.generate()` is async and returns PDF bytes, but `generatePDF()` called it without awaiting the result or triggering the download.
**Fix:** Chained `.then()` on `TeamSheetPDF.generate()` to call `TeamSheetPDF.downloadPdf(bytes, filename)` with the generated bytes.

### 14. Autocomplete Dropdown Bars Visible in Builder (FIXED)
**Problem:** Below each autocomplete input (Pokémon, Item, Ability, Moves) in the builder, a visible bar/div appeared. The `autocomplete-list` elements used a `hidden` CSS class to hide them, but `builder.html` only loads `builder.css` — not `styles.css` where `.hidden { display: none }` was defined. So the class had no effect.
**Fix:** Added `.autocomplete-list { display: none; }` as default in `builder.css` and a `.autocomplete-list.visible { display: block; ... }` rule. Changed all JS autocomplete logic from toggling `hidden` class to toggling `visible` class. Removed `hidden` class from HTML templates.

### 15. SP Sliders Allow Exceeding Maximum (FIXED)
**Problem:** When the total SP exceeded 66, the validation showed an error but the sliders could still be moved further, allowing arbitrarily high SP values.
**Fix:** Added clamping in the SP slider `input` event handler: before applying the new value, the handler calculates `otherTotal + newVal`. If it exceeds `MAX_SP` (66), the slider value is clamped to `MAX_SP - otherTotal` instead. This prevents the total from ever exceeding 66 while keeping other sliders unaffected.

### 16. Mega Pokémon Names Normalized on Import (ADDED)
**Feature:** When importing a Showdown paste or typing in the builder, names like "Gardevoir-Mega" are automatically normalized: the "-Mega" suffix is stripped from the species name, and the corresponding mega stone is auto-assigned as the held item (if not already set). Also supports "-Mega X" / "-Mega Y" suffixes for Charizard.
**Implementation:**
- `parser.js`: Strips `-Mega` suffix from species and stores `_megaSuffix` flag
- `regulation.js`: `normalizeMegaName(species)` returns `{ base, megaStone }` using `MEGA_STONES_PER_POKEMON`
- `app.js` and `builder.js`: After parsing, if a Pokémon has a mega suffix and no item, auto-assign the mega stone via `getMegaStones()`
- Builder autocomplete: Searching "Gardevoir-Mega" also finds "Gardevoir"; selecting it auto-assigns Gardevoirite

### 17. Index Page Import Fails Silently for Mega Pokémon (FIXED)
**Problem:** `index.html` did not load `regulation.js`, so `RegulationMB` was `undefined` when `app.js` tried to call `RegulationMB.getMegaStones()` / `RegulationMB.getPokemonData()` during mega Pokémon normalization in `importTeam()`. This threw a ReferenceError that silently blocked the entire paste import — no Pokémon loaded at all.
**Fix:** Added `<script src="js/regulation.js?v=1"></script>` to `index.html` before `app.js`.

### 18. Rotom Forms Not Recognized as Legal (FIXED)
**Problem:** Only base `Rotom` (Electric/Ghost) was in `LEGAL_POKEMON`. Alternate forms like `Rotom-Fan`, `Rotom-Wash`, etc. failed species validation because `_pokemonByName()` couldn't match `rotomfan` to `rotom`.
**Fix:** Added all 5 alternate Rotom forms to `LEGAL_POKEMON` with their correct typings: Rotom-Heat (Electric/Fire), Rotom-Wash (Electric/Water), Rotom-Frost (Electric/Ice), Rotom-Fan (Electric/Flying), Rotom-Mow (Electric/Grass).

### 19. Delphox Wrong Hidden Ability (FIXED)
**Problem:** `regulation.js` listed Delphox's abilities as `['Blaze','Magic Guard']`. `Magic Guard` is Clefable's ability — Delphox's hidden ability is `Magician`.
**Fix:** Changed to `['Blaze','Magician']` in `regulation.js`.

### 20. Builder Team Slots Overflow and Row Spacing (FIXED)
**Problem:** On mobile, the 6 team slots (3-column grid) had two issues: the second row was visually stuck to the first row (insufficient gap), and the grid overflowed the bottom of the `.builder-card` container.
**Fix:** Increased `.team-slots` grid gap from `8px` to `12px` in the `max-width: 500px` media query in `builder.css`. Added `overflow: hidden` to `.builder-card` to contain visual overflow.

### 21. Aegislash & Froslass Broken BaseStats (FIXED)
**Problem:** `LEGAL_POKEMON` entries for Aegislash and Froslass had duplicate keys in `baseStats` objects. In JavaScript, duplicate keys resolve to the last value, producing incorrect stats. Aegislash had `{atk:50,atk:140,spa:50,spa:140,spd:50,spd:140,spe:60,spe:60}` which resolved to `{atk:140,spa:140,spd:140,spe:60}` — a mix of Shield and Blade Forme stats.
**Fix:** Removed duplicate keys. Aegislash now uses Shield Forme stats (`60/50/140/50/140/60`) as the default. Froslass stats were actually correct by coincidence (both duplicate values matched), but cleaned up anyway.

### 22. Basculegion Missing Female Form (FIXED)
**Problem:** Only one `Basculegion` entry existed with male stats (`120/112/65/80/75/78`). Female Basculegion has different stats (`120/85/65/110/75/88`) and is a distinct competitive form.
**Fix:** Added `Basculegion-F` as a separate entry in `LEGAL_POKEMON` with correct female stats. Total legal Pokémon is now 226.

### 23. PokéAPI Slug Mismatches for Aegislash, Basculegion, Meowstic, Pyroar (FIXED)
**Problem:** PokéAPI uses form-specific slugs that don't match the generic normalized names. `aegislash` → 404 (needs `aegislash-shield`), `basculegion` → 404 (needs `basculegion-male`), `basculegion-f` → 404 (needs `basculegion-female`), `meowstic` → 404 (needs `meowstic-male`), `pyroar` → 404 (needs `pyroar-male`). This caused sprites, types, and base stats to fail loading for these Pokémon.
**Fix:** Added `POKEAPI_SLUG_MAP` constant and `_resolvePokeapiSlug()` helper function in all 3 files that fetch from PokéAPI: `translations.js` (sprite fetching), `builder-champions-api.js` (builder API layer), and `pdf.js` (base stats fetching). The mapping is applied after slug normalization, before the API fetch call.

### 24. Calc Autocomplete Dropdowns Positioned Incorrectly (FIXED)
**Problem:** Ability and Item autocomplete dropdowns in the damage calculator appeared displaced to the bottom-left of the page instead of directly below their input fields. Species autocomplete worked fine because its wrapper (`.calc-species-input-wrap`) had `position: relative`, but `.calc-field` did not.
**Fix:** Added `position: relative` to `.calc-field` in `calc.css`.

### 25. Calc Autocomplete Dropdowns Clipped by Panel Overflow (FIXED)
**Problem:** Autocomplete dropdowns for Ability and Item were cut off when the list extended beyond the `.calc-panel` container. The panel had `overflow: hidden` which clipped absolutely-positioned children.
**Fix:** Changed `.calc-panel` from `overflow: hidden` to `overflow: visible`. Added `border-radius` to `.calc-panel-header` directly since it was previously relying on the parent's overflow clipping for rounded top corners.

### 26. Calc SP Inputs Allow Exceeding Maximum (FIXED)
**Problem:** In the damage calculator, SP inputs had no validation — users could set values that made the total exceed 66.
**Fix:** Added clamping logic in the SP input event handler: before applying the new value, the handler calculates the sum of all other stats and limits the current input to `66 - otherTotal`. This prevents the total from ever exceeding 66.

### 27. Water Spout / Eruption Damage Ignored HP (FIXED)
**Problem:** Water Spout and Eruption had their base power hardcoded as `150` in `calc-move-data.js`. Their actual BP should scale with the user's current HP: `BP = floor(150 × currentHP / maxHP)`. Changing the attacker's HP in the calculator had no effect on their damage. Similarly, Stored Power and Power Trip had fixed BP instead of scaling with stat boosts (`BP = 20 + 20 × sum(positive boost stages)`).
**Fix:**
- `calc-move-data.js`: Set BP to `0` for eruption, waterspout, storedpower, powertrip (marking them as variable). Added `crushgrip` (Physical) and `wringout` (Special) entries with BP 0.
- `damage.js` `computeVariableBP()`: Added 3 new cases:
  - **Water Spout / Eruption**: `floor(150 × attacker.curHP / attacker.maxHP)`
  - **Crush Grip / Wring Out**: `floor(120 × defender.curHP / defender.maxHP)`
  - **Stored Power / Power Trip**: `20 + 20 × sum(positive boost stages on attacker)`

### 28. Frontend Design System Redesign (FIXED)
**Problem:** All three pages had different visual designs, CSS variable naming, header structures, and theming approaches. The calc page used completely different class names (`calc-header`, `calc-nav-link`, `--bg`, `--card-bg`, `--primary`) instead of the shared design system.
**Fix:**
- Applied the `frontend-design` skill across all pages with a cohesive dark-first design system
- **Theme system**: Changed from `.dark` class to `data-theme="dark"` / `data-theme="light"` attribute selectors on `<html>`
- **Shared design system variables**: All three CSS files now define the same `:root` variables (`--bg-deep`, `--bg-surface`, `--accent`, `--gold`, `--text-primary`, `--border`, `--radius-lg`, `--shadow-glow`, etc.)
- **Shared header**: All three pages use `app-header` > `header-content` > `header-brand` (pokeball icon) + `header-nav` (nav-link) + `header-actions` (icon-btn)
- **Calc page**: Full CSS rewrite (~1000 lines) — replaced custom variables with design system names, changed panel headers from colored bars to border-bottom pattern, increased border radii/spacing, added focus glow, card hover shadows, font-smoothing, modal animations, improved responsive breakpoints
- **Builder page**: Fixed age-division chip active state (`.gender-btn` → `.chip-btn`), added `--transition-slow` variable
- **Calc page**: Fixed theme persistence bug (light theme not restored from localStorage)

---

## Bilingual System

### UI Labels
All translatable UI elements use dual attributes:
```html
<span data-es="Texto en español" data-en="English text">Default text</span>
```

`applyLanguage(lang)` in `app.js` iterates all `[data-es][data-en]` elements and sets `textContent` from the matching attribute.

### Pokémon Data
- Species, moves, items, abilities are translated via **PokéAPI** (`translations.js`)
- Natures and types use **local mapping** (no API calls)
- `team[]` always stores English names (from Showdown parser)
- `translatedTeam[]` stores translated names (fetched on demand)
- Translated objects include `_original` property with English names for:
  - PokéAPI base stats lookup (`_fetchBaseStats`)
  - Nature multiplier lookup (`NATURE_MAP`)
- Language toggle triggers `translateAndRender()` which fetches translations and updates both web UI and PDF output

---

## Conventions

- **IIFE module pattern** for all JS files
- **No ES modules** — global scope via `<script>` tag order
- **PDF generation** uses template-based approach: load official PDF → copy pages → overlay text
- **Template coordinates** were extracted via `pdfjs-dist` (dev dependency) and raw PDF content stream parsing (for shapes like checkboxes) and hardcoded in `pdf.js`
- **Form IDs** in HTML must match `els` object keys in `app.js` (main page) or `getElementById` calls in `builder.js` (builder page)
- **localStorage keys** prefixed with `ts` for main page (e.g., `tsLang`, `tsDraft`, `tsTheme`), `pokemon_champion_teams` for builder, `pokemon_users` / `pokemon_current_user` for auth
- **CSS variables** for all colors — shared between main page, builder, and calculator via `:root` + `[data-theme="light"]` attribute selector. All three CSS files define the same shared design system variables (`--bg-deep`, `--accent`, `--text-primary`, etc.) plus page-specific variables (type colors, stat colors, builder slot colors). `auth.css` uses the same design system variables for modals, forms, and buttons
- **Shared header structure** — All three pages use `app-header` > `header-content` > `hamburger-btn` (menu toggle) + `header-brand` (pokeball icon + title, centered) + `header-actions` (auth container + lang toggle + theme toggle). Navigation links are in a slide-in drawer (`drawer-overlay` + `drawer`) instead of inline nav. Each CSS file defines these shared classes
- **SEO sections** — `index.html` has `.seo-content` with 6 cards describing the tool. `calc.html` has `.seo-content` with 4 cards focused on "calculadora de daños" keywords. Both use `.seo-content-grid` > `.seo-card` layout with responsive CSS
- **Builder dark mode** uses same pattern as main page: reads `localStorage('tsTheme')`, sets `data-theme` attribute, persists choice. Syncs with main page preference
- **Calculator dark mode** uses same pattern: reads `localStorage('tsTheme')`, sets `data-theme` attribute, persists choice. Syncs with main page and builder preference
- **Runtime has zero npm dependencies** — `pdf-lib` is loaded via CDN, `pdfjs-dist` and `pdf-lib` are dev-only
- **Regulation data** is hardcoded in `regulation.js` — update when new regulation sets release
- **Builder uses SP (Stat Points)** — 66 total, max 32 per stat. Convert to/from EVs for Showdown compatibility
- **PokéAPI** is called at runtime for:
  - Base stats for stat calculation (cached in memory per session)
  - Name translations for species, moves, items, abilities (cached in memory per session)
  - Pokemon sprites / official artwork (cached in memory per session)
  - Move types for colored move badges in detail modal (cached in memory per session)
  - Move short effect descriptions for move tooltips in detail modal (cached in memory per session, falls back to `flavor_text_entries` if `effect_entries` is empty)
  - Learnsets and abilities for builder Pokémon (cached in memory per session)
  - Move metadata for damage calculator (cached in `calc-move-data.js` at build time)

---

## How to Continue Development

1. **Run as web:** `npm run dev` → http://localhost:8080
2. **Test PDF output (main page):** Import a team → click each PDF button → verify in browser PDF viewer
3. **Test PDF output (builder):** Build a team → click PDF buttons → verify stats use SP formula
4. **Test detail modal:** Import a team → click any Pokemon card → verify modal shows sprite, stats, moves with type colors
5. **Test dark mode:** Toggle via header button → verify all elements render correctly (cards, inputs, tabs, buttons, modal) across all three pages
6. **Test light mode:** Toggle to light theme → verify all elements render correctly (no white-on-white, proper contrast)
7. **Test builder validation:** Create invalid team (duplicate species, illegal moves) → verify error messages
7. **Test builder save/load:** Save a team → reload page → verify team loads from saved list with sprites and type badges
8. **Test import/export:** Import Showdown text → verify SP conversion → export back → verify EV values match
9. **Test stat preview:** Select a Pokémon in builder → adjust SP sliders → verify base stats, final stats, nature indicators update in real-time
10. **Test import types/stats:** Import a full paste → verify type badges and stat preview load correctly (from RegulationMB data immediately, PokAPI data in background)
11. **Test gendered species:** Import or type "Basculegion (M)" in builder → verify species recognized, gender set to Male
12. **Test F5 reload:** Build a team → press F5 → verify sprites, types, and stat preview all load correctly after page reload
13. **Test damage calculator:** Go to /calc → select Pokémon on both panels → verify damage ranges match NCP reference calculator
14. **Test calc autocomplete:** Type species/item/ability/moves → verify autocomplete shows legal options from RegulationMB
15. **Test calc stat display:** Select a Pokémon → verify HP, Atk, Def, Spa, Spd, Spe match expected values (SP + nature)
16. **Test calc field conditions:** Toggle weather/terrain/screens → verify damage ranges update correctly
17. **Test calc bilingual:** Toggle ES/EN → verify all UI labels translate correctly
18. **Test calc dark mode:** Toggle dark mode → verify calculator renders correctly (synced with main page preference)
19. **Test calc light mode:** Toggle to light theme → verify calculator renders correctly (no white-on-white)
20. **Template PDF:** `play-pokemon-vg-team-list.pdf` is the source of truth for layout. It's loaded at runtime and used as a background. **Do not modify this file.**
21. **Auth system:** `auth.js` exposes `PokeAuth` global. All auth logic (register, login, profile, session) goes through this module. CSS in `auth.css`. Auth container `#authContainer` in both page headers.
22. **Reference images:** `docs/STAFF.png`, `docs/JUGADOR.png` are visual references only
15. **Parser changes:** Only modify `parser.js` if the Showdown export format changes
16. **PDF value positions:** Modify `_fillStaffPage()`, `_fillOpenPage()`, `_fillStaffCell()`, `_fillOpenCell()` in `pdf.js`. Coordinates are hardcoded from extracted reference.
17. **New form fields:** Add HTML in `index.html` or `builder.html`, add to `els` object and `getPlayerData()` in respective JS files, add `_val()` call in `pdf.js`
18. **New languages:** Add `data-xx` attributes to HTML elements, extend `applyLanguage()` logic, and add PokéAPI language code to `translations.js` (`_langCode()` + local mappings)
19. **New translations categories:** Add fetch function in `translations.js` (e.g., for items, abilities) and integrate into `translatePokemon()`
20. **If template PDF changes:** Extract new coordinates with `pdfjs-dist` (text items) or raw PDF stream parsing (shapes/rectangles) and update positions in `pdf.js`
21. **Regulation updates:** When a new regulation set releases (M-C, M-D, etc.), update `regulation.js` with new legal lists, or create a new `regulation-mc.js` and select in builder UI
22. **Builder validation changes:** Modify validation functions in `regulation.js` (validateTeam, validatePokemon, etc.)
23. **Damage calculator formula:** Modify `damage.js` — must match NCP VGC reference exactly. Test with known matchups (e.g., Garchomp Dragon Claw Hardy nature)
24. **Damage calculator moves:** Update `calc-move-data.js` when new moves are added to Regulation M-B. Data sourced from PokAPI
25. **Damage calculator UI:** Modify `calc.js` and `calc.css` for calculator interface changes. Uses same bilingual pattern as main page/builder

### Design System Guidelines

When making UI changes across pages, follow these rules:

1. **Theme attribute**: Always use `data-theme="dark"` / `data-theme="light"` on `<html>`. Never use `.dark` class
2. **CSS variables**: Use the shared design system variable names (`--bg-deep`, `--bg-surface`, `--accent`, `--text-primary`, etc.). Do not introduce new color variables without adding them to all three `:root` blocks
3. **Shared header**: All pages must use `app-header` > `header-content` > `hamburger-btn` + `header-brand` (centered) + `header-actions`. The `header-actions` contains `#authContainer` (login button or user menu), language toggle, and theme toggle. Navigation is in a slide-in drawer from the left (`drawer-overlay` + `drawer` with `drawer-link` items). The active page link is highlighted with `.active` class
4. **Font smoothing**: All pages must have `-webkit-font-smoothing: antialiased` on `body`
5. **Focus glow**: Inputs must have `box-shadow: 0 0 0 3px var(--accent-glow)` on focus
6. **Cards/panels**: Use `var(--bg-surface)` background, `var(--radius-lg)` border-radius, `var(--shadow-sm)` shadow, `border: 1px solid var(--border)`
7. **Buttons**: Primary buttons use `var(--accent)` background with `var(--shadow-glow)`. All buttons use `font-family: var(--font-display)`
8. **Light theme**: Test all changes in both dark and light themes. Verify no white-on-white or invisible text
9. **SEO sections**: Use `.seo-content` > `.seo-content-grid` > `.seo-card` pattern for SEO content blocks. Cards use same surface/border/radius as other cards. Defined in `styles.css` and `calc.css`

---

## SEO Status

### Completed ✓
- `<meta name="description">` — Descripción de la herramienta (3 páginas)
- `<meta name="robots">` — Index, follow (3 páginas)
- `<link rel="canonical">` — `kmmata.github.io/TheVGCPoke/` (3 páginas)
- **Open Graph** — `og:title`, `og:description`, `og:type`, `og:url`, `og:image`, `og:locale` (3 páginas)
- **Twitter Card** — `summary_large_image` con título, descripción, imagen (3 páginas)
- **Favicon SVG** — Pokeball en `favicon.svg`
- **Apple touch icon** — Referenciado (pendiente crear PNG 180x180)
- **`theme-color`** — `#0b1120` (dark theme primary background)
- **JSON-LD** — Schema `SoftwareApplication` con features, pricing, browserRequirements
- **`robots.txt`** — Allow all, sitemap reference a `kmmata.github.io/TheVGCPoke/sitemap.xml`
- **`sitemap.xml`** — 3 URLs (index, builder, calc) con `kmmata.github.io/TheVGCPoke`
- **server.js** — MIME types para `.ico`, `.xml`, `.txt`
- **Builder page** — `builder.html` accessible at `/builder` route
- **Calculator page** — `calc.html` accessible at `/calc` route
- **Preconnect** — `fonts.googleapis.com`, `fonts.gstatic.com`, `unpkg.com` (3 páginas)
- **SEO content sections** — Contenido estático indexable en `index.html` (6 tarjetas) y `calc.html` (4 tarjetas)
- **README.md** — Documentación completa del proyecto en GitHub (indexable por Google)
- **Títulos optimizados** — Keywords en titles y h1 de cada página
- **Google Search Console** — Propiedad verificada, página principal indexada
- **Accessibility** — `aria-label` en botones, `role="dialog"` + `aria-modal` en modales, `alt` en sprites

### Pendiente
1. **Crear `og-image.png`** (1200x630px) — Imagen para redes sociales con logo/nombre de la app
2. **Crear `apple-touch-icon.png`** (180x180px) — Icono para dispositivos Apple
3. **Bing Webmaster Tools** — Registrar sitio y enviar sitemap
4. **Backlinks** — Compartir en comunidades Pokémon para mejorar autoridad de dominio
5. **Considerar bilingual SEO real** — Si se quiere posicionar en ES y EN, crear rutas `/es/` y `/en/` con hreflang tags (actualmente solo JS language switching, no indexable por buscadores)

---

## UI Reference Images Workflow

Cuando el usuario quiera redesignar pantallas:
1. Guarda las imágenes de referencia en `docs/references/`
2. Me dice qué imagen corresponde a qué pantalla/elemento
3. Yo las analizo (herramienta Read soporta imágenes) y creo el CSS/HTML para replicar el diseño
4. Si hay varias opciones de diseño, pregunto cuál prefieren antes de implementar

**Formato esperado:** PNG, JPG o SVG en `docs/references/`
