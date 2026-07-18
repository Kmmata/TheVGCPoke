/**
 * PDF Team Sheet Generator — uses the official Play! Pokémon VG
 * team-list PDF as a template and overlays filled-in data.
 */
const TeamSheetPDF = (() => {
  const { PDFDocument, rgb, StandardFonts } = PDFLib;

  const TEMPLATE_URL = 'play-pokemon-vg-team-list.pdf';
  const BLACK = rgb(0, 0, 0);

  const NATURE_MAP = {
    'Adamant':  { plus: 'atk', minus: 'spa' },
    'Bold':     { plus: 'def', minus: 'atk' },
    'Brave':    { plus: 'atk', minus: 'spe' },
    'Calm':     { plus: 'spd', minus: 'atk' },
    'Careful':  { plus: 'spd', minus: 'spa' },
    'Gentle':   { plus: 'spd', minus: 'def' },
    'Hasty':    { plus: 'spe', minus: 'def' },
    'Impish':   { plus: 'def', minus: 'spa' },
    'Jolly':    { plus: 'spe', minus: 'spa' },
    'Lax':      { plus: 'def', minus: 'spd' },
    'Lonely':   { plus: 'atk', minus: 'def' },
    'Mild':     { plus: 'spa', minus: 'def' },
    'Modest':   { plus: 'spa', minus: 'atk' },
    'Naive':    { plus: 'spe', minus: 'spd' },
    'Naughty':  { plus: 'atk', minus: 'spd' },
    'Quiet':    { plus: 'spa', minus: 'spe' },
    'Rash':     { plus: 'spa', minus: 'spd' },
    'Relaxed':  { plus: 'def', minus: 'spe' },
    'Sassy':    { plus: 'spd', minus: 'spe' },
    'Timid':    { plus: 'spe', minus: 'atk' },
  };

  let _templateBytes = null;

  async function _loadTemplate() {
    if (_templateBytes) return _templateBytes;
    const res = await fetch(TEMPLATE_URL);
    if (!res.ok) throw new Error('Could not load template PDF');
    _templateBytes = await res.arrayBuffer();
    return _templateBytes;
  }

  async function generate(playerData, team, mode) {
    const baseStatsMap = {};
    for (const p of team) {
      if (p?.species && !baseStatsMap[p.species]) {
        const apiName = p._original?.species || p.species;
        try {
          baseStatsMap[p.species] = await _fetchBaseStats(apiName);
        } catch (_) {
          baseStatsMap[p.species] = null;
        }
      }
    }

    const templateBytes = await _loadTemplate();
    const templateDoc = await PDFDocument.load(templateBytes);
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const bold = await doc.embedFont(StandardFonts.HelveticaBold);

    const templatePages = templateDoc.getPages();

    if (mode === 'staff' || mode === 'both') {
      const [copied] = await doc.copyPages(templateDoc, [0]);
      const pg = doc.addPage(copied);
      _fillStaffPage(pg, font, bold, playerData, team, baseStatsMap);
    }
    if (mode === 'open' || mode === 'both') {
      const [copied] = await doc.copyPages(templateDoc, [1]);
      const pg = doc.addPage(copied);
      _fillOpenPage(pg, font, bold, playerData, team);
    }

    return doc.save();
  }

  /* ══════════════════════════════════════════════════════════ */
  /*  STAFF PAGE (page 1) — values on template                */
  /* ══════════════════════════════════════════════════════════ */
  function _fillStaffPage(pg, font, bold, pd, team, baseStatsMap) {
    /* Player info — coordinates from extracted reference */
    _val(pg, bold, pd.playerName, 149, 706.4, 13.5, 230);
    _val(pg, bold, pd.trainerName, 149, 684.3, 10.5, 240);
    _val(pg, bold, pd.playerId, 449, 684.3, 10.5, 140);
    _val(pg, bold, pd.teamNumber, 149, 664.4, 10.5, 225);
    _val(pg, bold, pd.switchProfile, 149, 639.9, 10.5, 225);
    _val(pg, bold, pd.supportId, 451, 639.9, 10.5, 140);

    /* Date of Birth */
    if (pd.dob) {
      const parts = pd.dob.split('/');
      if (parts[0]) _val(pg, bold, parts[0], 431, 664.4, 10.5, 42);
      if (parts[1]) _val(pg, bold, parts[1], 491, 664.4, 10.5, 42);
      if (parts[2]) _val(pg, bold, parts[2], 540, 664.4, 10.5, 50);
    }

    /* Age Division checkbox */
    _checkAgeDivision(pg, bold, pd.ageDivision);

    /* Pokémon grid — 3 rows × 2 columns */
    const cellTops = [610.7, 409.3, 207.9];
    const leftCellX = 20;
    const rightCellX = 306;

    for (let row = 0; row < 3; row++) {
      const top = cellTops[row];
      const pL = team[row * 2];
      const pR = team[row * 2 + 1];

      _fillStaffCell(pg, bold, leftCellX, top, pL, false, baseStatsMap);
      _fillStaffCell(pg, bold, rightCellX, top, pR, true, baseStatsMap);
    }
  }

  function _fillStaffCell(pg, bold, cellX, cellTop, p, isRight, baseStatsMap) {
    if (!p || !p.species) return;

    const lx = isRight ? 316.9 : 44.8;
    const sx = isRight ? 520.9 : 228.8;
    const rightShift = isRight ? 18 : 0;

    const lxAdjusts = [0, -19.1, -6, -6, -6, -6];
    const contentX = lx + rightShift;

    const labels = ['Ability', 'Held Item', 'Move 1', 'Move 2', 'Move 3', 'Move 4'];
    const labelXPositions = labels.map((l, i) => (lx + lxAdjusts[i] + rightShift) + bold.widthOfTextAtSize(l, 18) + 2);
    const valueX = Math.max(...labelXPositions);

    const name = p.nickname ? `${p.nickname} (${p.species})` : p.species;
    _val(pg, bold, name, valueX, cellTop, 11.5, sx - valueX - 4);

    _val(pg, bold, p.nature, valueX, cellTop - 26.1, 11, sx - valueX - 4);

    const labelYOffsets = [-50.9, -74.1, -97.3, -120.4, -143.6, -166.8];

    const values = [p.ability || '', p.item || '', p.moves[0] || '', p.moves[1] || '', p.moves[2] || '', p.moves[3] || ''];
    const statVals = _getStatValues(p, baseStatsMap);

    for (let i = 0; i < 6; i++) {
      const y = cellTop + labelYOffsets[i];

      if (values[i]) {
        const maxW = sx - valueX - 4;
        _val(pg, bold, values[i], valueX, y + 1, 11, maxW > 0 ? maxW : 120);
      }
    }

    /* Stats */
    const statLabels = ['HP', 'Atk', 'Def', 'Sp. Atk', 'Sp. Def', 'Speed'];
    const statY = [-50.9, -74.1, -97.3, -120.4, -143.6, -166.8];
    const statBaseX = isRight ? 525.9 : 233.8;
    const maxStatLabelW = Math.max(...statLabels.map(l => bold.widthOfTextAtSize(l, 9.5)));
    const statValX = statBaseX + maxStatLabelW + 2;
    for (let s = 0; s < 6; s++) {
      const y = cellTop + statY[s] + 1;
      _val(pg, bold, String(statVals[s]), statValX, y, 9.5, 40);
    }
  }

  /* ══════════════════════════════════════════════════════════ */
  /*  OPEN PAGE (page 2) — values on template                 */
  /* ══════════════════════════════════════════════════════════ */
  function _fillOpenPage(pg, font, bold, pd, team) {
    _val(pg, bold, pd.playerName, 149, 708.2, 13.5, 230);
    _val(pg, bold, pd.trainerName, 149, 686.1, 10.5, 440);
    _val(pg, bold, pd.teamNumber, 149, 664.8, 10.5, 440);
    _val(pg, bold, pd.switchProfile, 149, 641.7, 10.5, 440);

    _checkAgeDivision(pg, bold, pd.ageDivision);

    const cellTops = [612.9, 411.6, 210.1];

    for (let row = 0; row < 3; row++) {
      const top = cellTops[row];
      const pL = team[row * 2];
      const pR = team[row * 2 + 1];

      _fillOpenCell(pg, bold, 20, top, pL, false);
      _fillOpenCell(pg, bold, 306, top, pR, true);
    }
  }

  function _fillOpenCell(pg, bold, cellX, cellTop, p, isRight) {
    if (!p || !p.species) return;

    const lx = isRight ? 316.9 : 44.8;
    const sx = isRight ? 520.9 : 228.8;
    const rightShift = isRight ? 18 : 0;
    const lxAdjusts = [0, -19.1, -6, -6, -6, -6];
    const labelYOffsets = [-50.9, -74.1, -97.3, -120.4, -143.6, -166.8];
    const contentX = lx + rightShift;

    const labels = ['Ability', 'Held Item', 'Move 1', 'Move 2', 'Move 3', 'Move 4'];
    const labelXPositions = labels.map((l, i) => (lx + lxAdjusts[i] + rightShift) + bold.widthOfTextAtSize(l, 18) + 2);
    const valueX = Math.max(...labelXPositions);

    const name = p.nickname ? `${p.nickname} (${p.species})` : p.species;
    _val(pg, bold, name, valueX, cellTop, 11.5, sx - valueX - 4);

    _val(pg, bold, p.nature, valueX, cellTop - 26.1, 11, sx - valueX - 4);

    const values = [p.ability || '', p.item || '', p.moves[0] || '', p.moves[1] || '', p.moves[2] || '', p.moves[3] || ''];

    for (let i = 0; i < 6; i++) {
      const y = cellTop + labelYOffsets[i];

      if (values[i]) {
        _val(pg, bold, values[i], valueX, y + 1, 11, 120);
      }
    }
  }

  /* ── helpers ── */
  function _val(pg, font, text, x, y, size, maxW) {
    if (!text) return;
    let v = text;
    if (font.widthOfTextAtSize(v, size) > maxW) {
      while (v.length > 0 && font.widthOfTextAtSize(v + '\u2026', size) > maxW) v = v.slice(0, -1);
      v += '\u2026';
    }
    pg.drawText(v, { x, y, size, font, color: BLACK });
  }

  function _checkAgeDivision(pg, bold, selected) {
    const checks = [
      { label: 'Juniors', x: 477.7, y: 708.8 },
      { label: 'Seniors', x: 533.3, y: 709.2 },
      { label: 'Masters', x: 582.9, y: 710.2 },
    ];
    checks.forEach(c => {
      if (selected === c.label) {
        pg.drawText('x', { x: c.x + 1, y: c.y - 3, size: 7, font: bold, color: BLACK });
      }
    });
  }

  function downloadPdf(bytes, filename) {
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  /* ── Champions stat helpers ── */
  const _statCache = {};

  function _normalizeSpeciesName(species) {
    let name = species;
    name = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    name = name.replace(/\u2640/g, '-f').replace(/\u2642/g, '-m');
    name = name.toLowerCase();
    name = name.replace(/[.:,\s]+/g, '-');
    name = name.replace(/[^a-z0-9-]/g, '');
    name = name.replace(/-+/g, '-');
    name = name.replace(/^-|-$/g, '');
    return name;
  }

  const POKEAPI_SLUG_MAP = {
    'aegislash': 'aegislash-shield',
    'basculegion': 'basculegion-male',
    'basculegion-f': 'basculegion-female',
    'meowstic': 'meowstic-male',
    'pyroar': 'pyroar-male',
  };

  function _resolvePokeapiSlug(slug) {
    return POKEAPI_SLUG_MAP[slug] || slug;
  }

  function _extractGender(name) {
    if (/\(M\)/i.test(name) || /\s+M\s*$/.test(name)) return 'male';
    if (/\(F\)/i.test(name) || /\s+F\s*$/.test(name)) return 'female';
    return null;
  }

  async function _fetchBaseStats(species) {
    const clean = species.replace(/\s*\(M\)\s*$/i, '').replace(/\s*\(F\)\s*$/i, '').replace(/\s*\(N\)\s*$/i, '').replace(/\s+M\s*$/, '').replace(/\s+F\s*$/, '').trim();
    const rawSlug = _normalizeSpeciesName(clean);
    const slug = _resolvePokeapiSlug(rawSlug);

    if (_statCache[slug]) return _statCache[slug];

    let data = null;
    try {
      const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${slug}`);
      if (res.ok) data = await res.json();
    } catch {}

    if (!data) {
      try {
        const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${slug}-male`);
        if (res.ok) data = await res.json();
      } catch {}
    }
    if (!data) {
      try {
        const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${slug}-female`);
        if (res.ok) data = await res.json();
      } catch {}
    }

    if (!data) throw new Error(`No se pudieron obtener stats de ${species}`);

    const s = {};
    for (const st of data.stats) s[st.stat.name] = st.base_stat;
    _statCache[slug] = s;
    return s;
  }

  function _natureMultiplier(nature, statKey) {
    const nm = NATURE_MAP[nature];
    if (!nm) return 1;
    if (nm.plus === statKey) return 1.1;
    if (nm.minus === statKey) return 0.9;
    return 1;
  }

  function _getStatValues(p, baseStatsMap) {
    const base = baseStatsMap[p.species];
    if (!base) return [0, 0, 0, 0, 0, 0];
    const sp = p.evs || {};
    const n = p._original?.nature || p.nature;
    return [
      base.hp + (sp.hp ?? 0) + 75,
      Math.floor((base.attack + (sp.atk ?? 0) + 20) * _natureMultiplier(n, 'atk')),
      Math.floor((base.defense + (sp.def ?? 0) + 20) * _natureMultiplier(n, 'def')),
      Math.floor((base['special-attack'] + (sp.spa ?? 0) + 20) * _natureMultiplier(n, 'spa')),
      Math.floor((base['special-defense'] + (sp.spd ?? 0) + 20) * _natureMultiplier(n, 'spd')),
      Math.floor((base.speed + (sp.spe ?? 0) + 20) * _natureMultiplier(n, 'spe')),
    ];
  }

  return { generate, downloadPdf, fetchBaseStats: _fetchBaseStats, getStatValues: _getStatValues, NATURE_MAP };
})();
