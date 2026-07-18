/**
 * Team Builder — main logic.
 * Handles: team slots, Pokémon editor, SP editor, autocomplete,
 * validation, save/load, import/export (Showdown + PDF).
 */
const TeamBuilder = (() => {
  'use strict';

  const STORAGE_KEY = 'pokemon_champion_teams';
  const TEAM_SIZE = 6;

  const STAT_KEYS = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];
  const STAT_LABELS = { hp: 'HP', atk: 'Atk', def: 'Def', spa: 'Sp.Atk', spd: 'Sp.Def', spe: 'Speed' };
  const STAT_MAX = 255;

  let currentLang = localStorage.getItem('tsLang') || 'es';

  const STR = {
    selectSlot: { es: 'Selecciona un slot para editar', en: 'Select a slot to edit' },
    clickSlot: { es: 'Haz clic en un slot del equipo para empezar a construir', en: 'Click a team slot to start building' },
    newPokemon: { es: 'Nuevo Pokémon', en: 'New Pokémon' },
    pokemon: { es: 'Pokémon', en: 'Pokémon' },
    item: { es: 'Objeto', en: 'Item' },
    ability: { es: 'Habilidad', en: 'Ability' },
    nature: { es: 'Naturaleza', en: 'Nature' },
    gender: { es: 'Género', en: 'Gender' },
    tera: { es: 'Tera', en: 'Tera' },
    none: { es: 'Ninguno', en: 'None' },
    moves: { es: 'Movimientos (4)', en: 'Moves (4)' },
    movePlaceholder: { es: 'Movimiento', en: 'Move' },
    clearSlot: { es: 'Limpiar slot', en: 'Clear slot' },
    searchPokemon: { es: 'Buscar Pokémon...', en: 'Search Pokémon...' },
    searchItem: { es: 'Buscar objeto...', en: 'Search item...' },
    searchAbility: { es: 'Buscar habilidad...', en: 'Search ability...' },
    selectPokemonStats: { es: 'Selecciona un Pokémon para ver stats', en: 'Select a Pokémon to see stats' },
    addPokemon: { es: 'Añade Pokémon al equipo para validar', en: 'Add Pokémon to the team to validate' },
    validTeam: { es: 'Equipo válido — Regulación M-B', en: 'Valid team — Regulation M-B' },
    noSaved: { es: 'No hay equipos guardados', en: 'No saved teams' },
    load: { es: 'Cargar', en: 'Load' },
    delete: { es: 'Borrar', en: 'Delete' },
    copied: { es: 'Copiado!', en: 'Copied!' },
    copy: { es: 'Copiar', en: 'Copy' },
    pasteError: { es: 'Pega un equipo de Showdown', en: 'Paste a Showdown team' },
    parseError: { es: 'No se pudo parsear ningún Pokémon', en: 'No Pokémon could be parsed' },
    parseErrorPrefix: { es: 'Error al parsear: ', en: 'Parse error: ' },
    pdfError: { es: 'Error al generar el PDF: ', en: 'PDF generation error: ' },
    statPoints: { es: 'Puntos de Stat', en: 'Stat Points' },
    validationSlot: { es: 'Slot', en: 'Slot' },
  };

  function t(key) {
    const s = STR[key];
    return s ? s[currentLang] || s.es : key;
  }
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

  let team = new Array(TEAM_SIZE).fill(null);
  let translatedTeam = new Array(TEAM_SIZE).fill(null);
  let activeSlot = -1;
  let apiCache = {};
  let importBuffer = null;

  // ─── DOM refs ───
  const $slots = document.getElementById('teamSlots');
  const $editorTitle = document.getElementById('editorTitle');
  const $editorContent = document.getElementById('editorContent');
  const $validationPanel = document.getElementById('validationPanel');
  const $savedTeamsList = document.getElementById('savedTeamsList');
  const $importModal = document.getElementById('importModal');
  const $exportModal = document.getElementById('exportModal');
  const $saveModal = document.getElementById('saveModal');

  // ─── Init ───
  function init() {
    setupDrawer();
    renderTeamSlots();
    setupAgeDivision();
    setupModals();
    setupExportButtons();
    setupPDFButtons();
    setupTheme();
    setupClearAll();
    setupLanguage();
    loadDraft();
    setupAuth();
  }

  // ─── Language Toggle ───
  function setupLanguage() {
    const btn = document.getElementById('builderLangToggle');
    if (!btn) return;
    applyLanguage(currentLang);
    btn.addEventListener('click', () => {
      currentLang = currentLang === 'es' ? 'en' : 'es';
      localStorage.setItem('tsLang', currentLang);
      applyLanguage(currentLang);
    });
  }

  function applyLanguage(lang) {
    currentLang = lang;
    document.documentElement.setAttribute('data-lang', lang);
    const langBtn = document.getElementById('builderLangToggle');
    if (langBtn) langBtn.querySelector('.lang-flag').textContent = lang.toUpperCase();
    document.querySelectorAll('[data-es][data-en]').forEach(el => {
      const text = el.getAttribute(`data-${lang}`);
      if (text) el.textContent = text;
    });
    document.querySelectorAll('input[data-placeholder-es]').forEach(el => {
      const ph = el.getAttribute(`data-placeholder-${lang}`);
      if (ph) el.placeholder = ph;
    });
    const drawerTitle = document.querySelector('.drawer-title');
    if (drawerTitle) {
      drawerTitle.textContent = lang === 'es' ? 'Menú' : 'Menu';
    }
    translateAndRender();
  }

  // ─── Game Data Translation ───
  function getDisplayPokemon(i) {
    if (currentLang === 'en' || !translatedTeam[i]) return team[i];
    return translatedTeam[i];
  }

  async function translateAndRender() {
    if (currentLang === 'en') {
      translatedTeam = new Array(TEAM_SIZE).fill(null);
    } else {
      translatedTeam = await Promise.all(
        team.map(p => p && p.species ? PokeTranslations.translatePokemon(p, currentLang) : null)
      );
    }
    renderTeamSlots();
    if (activeSlot >= 0 && team[activeSlot]) {
      renderEditor(team[activeSlot], activeSlot);
    } else {
      renderEditorEmpty();
    }
    validateTeam();
    renderSavedTeams();
  }

  // ─── Drawer Toggle ───
  function setupDrawer() {
    const menuToggle = document.getElementById('menuToggle');
    const drawer = document.getElementById('drawer');
    const drawerOverlay = document.getElementById('drawerOverlay');
    function openDrawer() {
      drawer.classList.add('open');
      drawerOverlay.classList.remove('hidden');
      menuToggle.classList.add('open');
    }
    function closeDrawer() {
      drawer.classList.remove('open');
      drawerOverlay.classList.add('hidden');
      menuToggle.classList.remove('open');
    }
    if (menuToggle) menuToggle.addEventListener('click', () => drawer.classList.contains('open') ? closeDrawer() : openDrawer());
    if (drawerOverlay) drawerOverlay.addEventListener('click', closeDrawer);
  }

  // ─── Theme Toggle ───
  function setupTheme() {
    const btn = document.getElementById('builderThemeToggle');
    function apply(dark) {
      document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
      btn.querySelector('.theme-icon').textContent = dark ? '☀' : '☾';
      localStorage.setItem('tsTheme', dark ? 'dark' : 'light');
    }
    const saved = localStorage.getItem('tsTheme');
    const prefersDark = saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    apply(prefersDark);
    btn.addEventListener('click', () => apply(document.documentElement.getAttribute('data-theme') !== 'dark'));
  }

  // ─── Age Division Radio ───
  function setupAgeDivision() {
    document.querySelectorAll('[name="ageDivision"]').forEach(r => {
      r.addEventListener('change', () => {
        document.querySelectorAll('[name="ageDivision"]').forEach(l => {
          l.closest('.chip-btn')?.classList.toggle('active', l.checked);
        });
      });
    });
  }

  // ─── Team Slots ───
  function renderTeamSlots() {
    $slots.innerHTML = '';
    for (let i = 0; i < TEAM_SIZE; i++) {
      const slot = document.createElement('div');
      slot.className = 'team-slot' + (i === activeSlot ? ' active' : '') + (team[i] ? ' filled' : '');
      slot.dataset.index = i;

      const num = document.createElement('span');
      num.className = 'slot-number';
      num.textContent = i + 1;
      slot.appendChild(num);

      if (team[i]) {
        const display = getDisplayPokemon(i);
        const sprite = document.createElement('img');
        sprite.className = 'slot-sprite';
        sprite.src = getSpriteURL(team[i].species);
        sprite.alt = team[i].species;
        sprite.onerror = () => sprite.src = '';
        slot.appendChild(sprite);

        const name = document.createElement('div');
        name.className = 'slot-name';
        name.textContent = team[i].nickname || (display ? display.species : team[i].species);
        slot.appendChild(name);

        const removeBtn = document.createElement('button');
        removeBtn.className = 'slot-remove';
        removeBtn.textContent = '✕';
        removeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          team[i] = null;
          if (activeSlot === i) { activeSlot = -1; renderEditorEmpty(); }
          saveDraft();
          translateAndRender();
        });
        slot.appendChild(removeBtn);
      } else {
        const emptyIcon = document.createElement('div');
        emptyIcon.style.cssText = 'font-size:1.5rem;color:#334155;';
        emptyIcon.textContent = '+';
        slot.appendChild(emptyIcon);
      }

      slot.addEventListener('click', () => selectSlot(i));
      $slots.appendChild(slot);
    }
  }

  function selectSlot(index) {
    activeSlot = index;
    renderTeamSlots();
    if (team[index]) {
      renderEditor(team[index], index);
    } else {
      team[index] = createEmptyPokemon();
      renderEditor(team[index], index);
    }
  }

  function createEmptyPokemon() {
    return {
      species: '',
      nickname: '',
      item: '',
      ability: '',
      nature: 'Serious',
      gender: '',
      shiny: false,
      teraType: '',
      sp: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
      moves: ['', '', '', ''],
      _spriteURL: '',
      _types: [],
      _baseStats: null,
    };
  }

  // ─── Editor ───
  function renderEditorEmpty() {
    $editorTitle.textContent = t('selectSlot');
    $editorContent.innerHTML = `
      <div class="editor-empty">
        <div class="empty-icon">🎯</div>
        <p>${t('clickSlot')}</p>
      </div>`;
  }

  function renderEditor(pokemon, slotIndex) {
    const dp = getDisplayPokemon(slotIndex) || pokemon;
    const typeArr = dp._types || pokemon._types || [];
    $editorTitle.textContent = `${t('validationSlot')} ${slotIndex + 1} — ${dp.species || t('newPokemon')}`;
    const html = `
      <div class="editor-form">
        <div class="editor-top-row">
          <div class="editor-sprite">
            <img id="editorSprite" src="${pokemon._spriteURL || ''}" alt="${pokemon.species || ''}"
                 onerror="this.src=''" style="display:${pokemon._spriteURL ? 'block' : 'none'}">
          </div>
          <div class="editor-info">
            <div class="form-row">
              <label>${t('pokemon')}</label>
              <div class="autocomplete-wrap">
                <input type="text" id="acPokemon" value="${dp.species || ''}" placeholder="${t('searchPokemon')}" autocomplete="off">
                <div class="autocomplete-list" id="acPokemonList"></div>
              </div>
            </div>
            <div id="pokemonTypes" style="display:flex;gap:4px;padding-left:92px;">
              ${typeArr.map(ty => `<span class="type-badge ${ty}">${PokeTranslations.translateType(ty, currentLang)}</span>`).join('')}
            </div>
            <div class="form-row">
              <label>${t('item')}</label>
              <div class="autocomplete-wrap">
                <input type="text" id="acItem" value="${dp.item || ''}" placeholder="${t('searchItem')}" autocomplete="off">
                <div class="autocomplete-list" id="acItemList"></div>
              </div>
            </div>
            <div class="form-row">
              <label>${t('ability')}</label>
              <div class="autocomplete-wrap">
                <input type="text" id="acAbility" value="${dp.ability || ''}" placeholder="${t('searchAbility')}" autocomplete="off">
                <div class="autocomplete-list" id="acAbilityList"></div>
              </div>
            </div>
            <div class="form-row">
              <label>${t('nature')}</label>
              <select id="selNature">
                ${Object.keys(RegulationMB.NATURES).map(n =>
                  `<option value="${n}" ${pokemon.nature === n ? 'selected' : ''}>${PokeTranslations.translateNature(n, currentLang)}${RegulationMB.NATURES[n].plus ? ` (+${RegulationMB.NATURES[n].plus.toUpperCase()}, -${RegulationMB.NATURES[n].minus.toUpperCase()})` : ''}</option>`
                ).join('')}
              </select>
            </div>
          </div>
        </div>

        <div class="detail-row">
          <label>${t('gender')}</label>
          <div class="gender-btns">
            <button class="gender-btn ${pokemon.gender === 'Male' ? 'active' : ''}" data-gender="Male">♂</button>
            <button class="gender-btn ${pokemon.gender === 'Female' ? 'active' : ''}" data-gender="Female">♀</button>
            <button class="gender-btn ${pokemon.gender === '' ? 'active' : ''}" data-gender="">—</button>
          </div>
          <div style="margin-left:16px;" class="detail-row">
            <label>${t('tera')}</label>
            <select id="selTeraType">
              <option value="">${t('none')}</option>
              ${['Normal','Fire','Water','Electric','Grass','Ice','Fighting','Poison','Ground','Flying','Psychic','Bug','Rock','Ghost','Dragon','Dark','Steel','Fairy','Stellar'].map(ty =>
                `<option value="${ty}" ${pokemon.teraType === ty ? 'selected' : ''}>${PokeTranslations.translateType(ty, currentLang)}</option>`
              ).join('')}
            </select>
          </div>
        </div>

        <div class="sp-section">
          <div class="sp-header">
            <span class="sp-title">${t('statPoints')}</span>
            <span class="sp-total ${getSPTotalClass(pokemon.sp)}" id="spTotal">${getSPTotal(pokemon.sp)} / ${RegulationMB.MAX_SP}</span>
          </div>
          ${['hp','atk','def','spa','spd','spe'].map(k => `
            <div class="sp-row">
              <span class="sp-label">${k.toUpperCase()}</span>
              <input type="range" class="sp-slider" id="sp_${k}" min="0" max="${RegulationMB.MAX_SP_PER_STAT}" value="${pokemon.sp[k] || 0}" data-stat="${k}">
              <span class="sp-value" id="spVal_${k}">${pokemon.sp[k] || 0}</span>
              <span class="sp-max">/ ${RegulationMB.MAX_SP_PER_STAT}</span>
            </div>
          `).join('')}
          <div class="stat-preview" id="statPreview"></div>
        </div>

        <div class="moves-section">
          <div class="moves-title">${t('moves')}</div>
          <div class="moves-grid" id="movesGrid">
            ${pokemon.moves.map((m, mi) => {
              const dm = dp.moves && dp.moves[mi] ? dp.moves[mi] : m;
              return `
              <div class="move-slot">
                <input type="text" id="move_${mi}" value="${dm}" placeholder="${t('movePlaceholder')} ${mi + 1}" autocomplete="off">
                <div class="autocomplete-list" id="acMoveList_${mi}"></div>
              </div>`;
            }).join('')}
          </div>
        </div>

        <div style="display:flex;gap:8px;margin-top:10px;">
          <button id="btnClearSlot" class="builder-btn builder-btn-outline" style="flex:1;">${t('clearSlot')}</button>
        </div>
      </div>`;

    $editorContent.innerHTML = html;
    setupEditorEvents(pokemon, slotIndex);
    updateStatPreview(pokemon);
  }

  function getSPTotal(sp) {
    return RegulationMB.STAT_KEYS.reduce((s, k) => s + (sp[k] || 0), 0);
  }

  function getSPTotalClass(sp) {
    const total = getSPTotal(sp);
    if (total > RegulationMB.MAX_SP) return 'error';
    if (total < RegulationMB.MAX_SP) return 'warning';
    return 'valid';
  }

  function calcFinalStat(baseStat, spVal, nature, statKey) {
    const nm = NATURE_MAP[nature];
    let mult = 1;
    if (nm) {
      if (nm.plus === statKey) mult = 1.1;
      else if (nm.minus === statKey) mult = 0.9;
    }
    if (statKey === 'hp') return baseStat + spVal + 75;
    return Math.floor((baseStat + spVal + 20) * mult);
  }

  function updateStatPreview(pokemon) {
    const $el = document.getElementById('statPreview');
    if (!$el) return;
    const base = pokemon._baseStats;
    if (!base) {
      $el.innerHTML = `<div class="stat-preview-empty">${t('selectPokemonStats')}</div>`;
      return;
    }
    const nature = pokemon.nature || '';
    const sp = pokemon.sp || {};
    const rows = STAT_KEYS.map(k => {
      const bv = base[k] || 0;
      const sv = sp[k] || 0;
      const fv = calcFinalStat(bv, sv, nature, k);
      const pct = Math.min((fv / STAT_MAX) * 100, 100);
      const nm = NATURE_MAP[nature];
      let nc = '', ni = '';
      if (nm) {
        if (nm.plus === k) { nc = 'up'; ni = '\u25B2'; }
        else if (nm.minus === k) { nc = 'down'; ni = '\u25BC'; }
      }
      return `<div class="stat-preview-row">
        <span class="sp-base">${bv}</span>
        <span class="sp-stat-label">${STAT_LABELS[k]}</span>
        <span class="sp-nature ${nc}">${ni}</span>
        <div class="sp-bar-wrap">
          <div class="sp-bar ${k}" style="width:${pct}%"></div>
        </div>
        <span class="sp-final">${fv}</span>
        <span class="sp-sp-val">SP ${sv}</span>
      </div>`;
    }).join('');
    $el.innerHTML = rows;
  }

  // ─── Editor Events ───
  function setupEditorEvents(pokemon, slotIndex) {
    // Pokemon autocomplete
    setupAutocomplete('acPokemon', 'acPokemonList', async (q) => {
      let results = RegulationMB.searchPokemon(q);
      const { base } = RegulationMB.normalizeMegaName(q);
      if (base !== q) {
        const baseResults = RegulationMB.searchPokemon(base);
        const existingNames = new Set(results.map(r => r.name));
        for (const r of baseResults) {
          if (!existingNames.has(r.name)) results.push(r);
        }
      }
      return results.map(p => ({
        label: p.name,
        sub: p.types.join(' / '),
        sprite: '',
        data: p,
      }));
    }, async (selected) => {
      const rawQuery = document.getElementById('acPokemon').value.trim();
      const genderMatch = rawQuery.match(/\((M|F|N)\)/i);
      if (genderMatch) {
        pokemon.gender = genderMatch[1].toUpperCase() === 'N' ? 'NA' : genderMatch[1].toUpperCase() === 'F' ? 'Female' : 'Male';
      }
      pokemon.species = selected.label;
      pokemon._types = selected.data.types;
      pokemon._baseStats = selected.data.baseStats;
      const { megaStone } = RegulationMB.normalizeMegaName(rawQuery);
      if (megaStone) {
        if (!pokemon.item) pokemon.item = megaStone;
        const regData = RegulationMB.getPokemonData(selected.label);
        if (regData && regData.abilities && regData.abilities.length > 0) {
          pokemon.ability = regData.abilities[0];
        }
      }
      // Load full data from API
      loadPokemonAPIData(pokemon);
      saveDraft();
      translateAndRender();
    });

    // Item autocomplete
    setupAutocomplete('acItem', 'acItemList', (q) => {
      return RegulationMB.searchItems(q).map(i => ({
        label: i,
        sub: '',
      }));
    }, (selected) => {
      pokemon.item = selected.label;
      saveDraft();
      translateAndRender();
    });

    // Ability autocomplete
    setupAutocomplete('acAbility', 'acAbilityList', (q) => {
      if (!pokemon.species || !pokemon._apiData) return [];
      const apiAbilities = pokemon._apiData.legalAbilities.length > 0
        ? pokemon._apiData.legalAbilities
        : pokemon._apiData.abilities;
      const nq = q.toLowerCase().replace(/[^a-z0-9]/g,'');
      return apiAbilities
        .filter(a => !nq || a.name.toLowerCase().replace(/[^a-z0-9]/g,'').includes(nq))
        .map(a => ({ label: a.name, sub: a.isHidden ? 'Hidden' : '' }));
    }, (selected) => {
      pokemon.ability = selected.label;
      saveDraft();
      translateAndRender();
    });

    // Nature
    document.getElementById('selNature').addEventListener('change', (e) => {
      pokemon.nature = e.target.value;
      saveDraft();
      translateAndRender();
    });

    // Gender
    document.querySelectorAll('.gender-btns .gender-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        pokemon.gender = btn.dataset.gender;
        document.querySelectorAll('.gender-btns .gender-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        saveDraft();
      });
    });

    // Tera Type
    document.getElementById('selTeraType').addEventListener('change', (e) => {
      pokemon.teraType = e.target.value;
      saveDraft();
      translateAndRender();
    });

    // SP sliders
    for (const k of RegulationMB.STAT_KEYS) {
      const slider = document.getElementById(`sp_${k}`);
      if (!slider) continue;
      slider.max = RegulationMB.MAX_SP_PER_STAT;
      slider.addEventListener('input', () => {
        const newVal = parseInt(slider.value) || 0;
        const otherTotal = getSPTotal(pokemon.sp) - (pokemon.sp[k] || 0);
        if (otherTotal + newVal > RegulationMB.MAX_SP) {
          slider.value = Math.max(0, RegulationMB.MAX_SP - otherTotal);
          pokemon.sp[k] = parseInt(slider.value) || 0;
        } else {
          pokemon.sp[k] = newVal;
        }
        document.getElementById(`spVal_${k}`).textContent = pokemon.sp[k];
        const $total = document.getElementById('spTotal');
        $total.textContent = `${getSPTotal(pokemon.sp)} / ${RegulationMB.MAX_SP}`;
        $total.className = `sp-total ${getSPTotalClass(pokemon.sp)}`;
        updateStatPreview(pokemon);
        validateTeam();
        saveDraft();
      });
    }

    // Moves autocomplete
    for (let mi = 0; mi < 4; mi++) {
      setupAutocomplete(`move_${mi}`, `acMoveList_${mi}`, (q) => {
        let moves = RegulationMB.searchMoves(q);
        if (pokemon._apiData && pokemon._apiData.legalMoves) {
          const legalSet = new Set(pokemon._apiData.legalMoves.map(m => m.toLowerCase().replace(/[^a-z0-9]/g,'')));
          moves = moves.filter(m => legalSet.has(m.toLowerCase().replace(/[^a-z0-9]/g,'')));
        }
        return moves.map(m => ({ label: m, sub: '' }));
      }, (selected) => {
        pokemon.moves[mi] = selected.label;
        saveDraft();
        translateAndRender();
      });
    }

    // Clear button
    document.getElementById('btnClearSlot')?.addEventListener('click', () => {
      team[slotIndex] = null;
      activeSlot = -1;
      renderEditorEmpty();
      saveDraft();
      translateAndRender();
    });
  }

  function setupClearAll() {
    document.getElementById('btnClearAll')?.addEventListener('click', () => {
      team = new Array(TEAM_SIZE).fill(null);
      activeSlot = -1;
      renderEditorEmpty();
      saveDraft();
      translateAndRender();
    });
  }

  // ─── Autocomplete System ───
  function setupAutocomplete(inputId, listId, fetchFn, onSelect) {
    const $input = document.getElementById(inputId);
    const $list = document.getElementById(listId);
    if (!$input || !$list) return;

    let selectedIdx = -1;
    let items = [];

    async function showList(query) {
      items = await fetchFn(query);
      if (items.length === 0) { $list.classList.remove('visible'); return; }
      selectedIdx = -1;
      $list.innerHTML = items.map((it, i) => `
        <div class="autocomplete-item" data-index="${i}">
          ${it.sprite ? `<img class="ac-sprite" src="${it.sprite}" alt="${it.name || ''}">` : ''}
          <span class="ac-name">${it.label}</span>
          ${it.sub ? `<span class="ac-types"><span class="type-badge" style="font-size:0.55rem;background:#334155;padding:1px 4px;">${it.sub}</span></span>` : ''}
        </div>`).join('');
      $list.classList.add('visible');

      $list.querySelectorAll('.autocomplete-item').forEach(el => {
        el.addEventListener('mousedown', (e) => {
          e.preventDefault();
          const idx = parseInt(el.dataset.index);
          onSelect(items[idx]);
          $list.classList.remove('visible');
          $input.value = items[idx].label;
        });
      });
    }

    $input.addEventListener('focus', () => {
      showList($input.value.trim());
    });

    $input.addEventListener('input', () => {
      showList($input.value.trim());
    });

    $input.addEventListener('keydown', (e) => {
      if (!$list.classList.contains('visible')) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedIdx = Math.min(selectedIdx + 1, items.length - 1);
        updateSelection($list, selectedIdx);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedIdx = Math.max(selectedIdx - 1, 0);
        updateSelection($list, selectedIdx);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (selectedIdx >= 0 && items[selectedIdx]) {
          onSelect(items[selectedIdx]);
          $list.classList.remove('visible');
          $input.value = items[selectedIdx].label;
        }
      } else if (e.key === 'Escape') {
        $list.classList.remove('visible');
      }
    });

    $input.addEventListener('blur', () => {
      setTimeout(() => $list.classList.remove('visible'), 150);
    });
  }

  function updateSelection($list, idx) {
    $list.querySelectorAll('.autocomplete-item').forEach((el, i) => {
      el.classList.toggle('selected', i === idx);
    });
  }

  // ─── API Data Loading ───
  async function loadPokemonAPIData(pokemon) {
    if (!pokemon.species) return;
    const key = pokemon.species.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (apiCache[key]) {
      pokemon._apiData = apiCache[key];
      pokemon._spriteURL = apiCache[key].sprites?.official || apiCache[key].sprites?.front || '';
      pokemon._types = apiCache[key].types || pokemon._types;
      pokemon._baseStats = apiCache[key].stats || pokemon._baseStats;
      return;
    }
    try {
      const data = await ChampionsAPI.fetchPokemonFull(pokemon.species);
      if (data) {
        apiCache[key] = data;
        pokemon._apiData = data;
        pokemon._spriteURL = data.sprites?.official || data.sprites?.front || '';
        pokemon._types = data.types;
        pokemon._baseStats = data.stats;
        updateStatPreview(pokemon);
        renderTeamSlots();
        if (activeSlot >= 0 && team[activeSlot] === pokemon) {
          const spriteEl = document.getElementById('editorSprite');
          if (spriteEl) {
            spriteEl.src = pokemon._spriteURL || '';
            spriteEl.style.display = pokemon._spriteURL ? 'block' : 'none';
          }
          const typesEl = document.getElementById('pokemonTypes');
          if (typesEl && pokemon._types) {
            typesEl.innerHTML = pokemon._types.map(ty => `<span class="type-badge ${ty}">${PokeTranslations.translateType(ty, currentLang)}</span>`).join('');
          }
        }
      }
    } catch (e) {
      console.warn('API fetch failed for', pokemon.species, e);
    }
  }

  function getSpriteURL(species) {
    if (!species) return '';
    const key = species.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (apiCache[key]) return apiCache[key].sprites?.official || apiCache[key].sprites?.front || '';
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${getPokemonIdByName(species)}.png`;
  }

  function getPokemonIdByName(name) {
    const data = RegulationMB.getPokemonData(name);
    if (!data) return '0';
    const allPkmn = RegulationMB.LEGAL_POKEMON;
    const idx = allPkmn.findIndex(p => p.name === data.name);
    return String(idx + 1);
  }

  // ─── Validation ───
  function validateTeam() {
    const errors = RegulationMB.validateTeam(team, currentLang);
    if (errors.length === 0 && team.every(p => !p || !p.species)) {
      $validationPanel.innerHTML = `
        <div class="validation-msg success"><span class="v-icon">✓</span> ${t('addPokemon')}</div>`;
      updatePDFButtons();
      return;
    }
    if (errors.length === 0) {
      $validationPanel.innerHTML = `
        <div class="validation-msg success"><span class="v-icon">✓</span> ${t('validTeam')}</div>`;
    } else {
      $validationPanel.innerHTML = errors.map(e =>
        `<div class="validation-msg error"><span class="v-icon">✕</span> ${t('validationSlot')} ${e.slot + 1}: ${e.msg}</div>`
      ).join('');
    }
    updatePDFButtons();
  }

  function updatePDFButtons() {
    const valid = team.some(p => p && p.species) && RegulationMB.validateTeam(team).length === 0;
    document.getElementById('btnOpenSheet').disabled = !valid;
    document.getElementById('btnStaffSheet').disabled = !valid;
    document.getElementById('btnBothSheets').disabled = !valid;
  }

  // ─── Save/Load ───
  function getSavedTeams() {
    if (PokeAuth.isLoggedIn()) {
      return PokeAuth.getSavedTeams();
    }
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]').filter(t => !t.userId); }
    catch { return []; }
  }

  function saveTeamsToStorage(teams) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(teams));
  }

  function saveDraft() {
    const draft = {
      team,
      playerData: getPlayerData(),
      activeSlot,
    };
    localStorage.setItem(STORAGE_KEY + '_draft', JSON.stringify(draft));
  }

  function loadDraft() {
    try {
      const draft = JSON.parse(localStorage.getItem(STORAGE_KEY + '_draft'));
      if (draft && draft.team) {
        team = draft.team;
        activeSlot = draft.activeSlot || -1;
        if (draft.playerData) setPlayerData(draft.playerData);
        for (const p of team) {
          if (p && p.species) {
            if (!p._types || p._types.length === 0) {
              const regData = RegulationMB.getPokemonData(p.species);
              if (regData) {
                p._types = regData.types;
                p._baseStats = regData.baseStats;
              }
            }
            loadPokemonAPIData(p);
          }
        }
        renderTeamSlots();
        if (activeSlot >= 0 && team[activeSlot]) {
          renderEditor(team[activeSlot], activeSlot);
        }
        validateTeam();
        translateAndRender();
        return;
      }
    } catch {}

    if (PokeAuth.isLoggedIn()) {
      const profile = PokeAuth.getProfile();
      if (profile) {
        const hasAnyData = Object.values(profile).some(v => v && v !== 'Masters');
        if (hasAnyData) {
          setPlayerData(profile);
          saveDraft();
        }
      }
    }
  }

  function getPlayerData() {
    return {
      playerName: document.getElementById('playerName').value,
      trainerName: document.getElementById('trainerName').value,
      playerId: document.getElementById('playerId').value,
      dobMm: document.getElementById('dobMm').value,
      dobDd: document.getElementById('dobDd').value,
      dobYyyy: document.getElementById('dobYyyy').value,
      teamNumber: document.getElementById('teamNumber').value,
      switchProfile: document.getElementById('switchProfile').value,
      ageDivision: document.querySelector('[name="ageDivision"]:checked')?.value || 'Masters',
    };
  }

  function setPlayerData(pd) {
    if (pd.playerName) document.getElementById('playerName').value = pd.playerName;
    if (pd.trainerName) document.getElementById('trainerName').value = pd.trainerName;
    if (pd.playerId) document.getElementById('playerId').value = pd.playerId;
    if (pd.dobMm) document.getElementById('dobMm').value = pd.dobMm;
    if (pd.dobDd) document.getElementById('dobDd').value = pd.dobDd;
    if (pd.dobYyyy) document.getElementById('dobYyyy').value = pd.dobYyyy;
    if (pd.teamNumber) document.getElementById('teamNumber').value = pd.teamNumber;
    if (pd.switchProfile) document.getElementById('switchProfile').value = pd.switchProfile;
    if (pd.ageDivision) {
      const radio = document.querySelector(`[name="ageDivision"][value="${pd.ageDivision}"]`);
      if (radio) { radio.checked = true; radio.closest('.chip-btn')?.classList.add('active'); }
    }
  }

  function renderSavedTeams() {
    const saved = getSavedTeams();
    if (saved.length === 0) {
      $savedTeamsList.innerHTML = `<div style="text-align:center;padding:12px;color:#475569;font-size:0.8rem;">${t('noSaved')}</div>`;
      return;
    }
    $savedTeamsList.innerHTML = saved.map((s, i) => `
      <div class="saved-team-item">
        <div>
          <div class="st-name">${s.name}</div>
          <div class="st-date">${new Date(s.date).toLocaleDateString()}</div>
        </div>
        <div class="st-actions">
          <button data-action="load" data-index="${i}">${t('load')}</button>
          <button data-action="delete" data-index="${i}" class="delete-btn">${t('delete')}</button>
        </div>
      </div>`).join('');

    $savedTeamsList.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.index);
        if (btn.dataset.action === 'load') {
          const saved = getSavedTeams()[idx];
          if (saved) {
            team = saved.team;
            if (saved.playerData) setPlayerData(saved.playerData);
            activeSlot = -1;
            for (const p of team) {
              if (p && p.species) {
                if (!p._types || p._types.length === 0) {
                  const regData = RegulationMB.getPokemonData(p.species);
                  if (regData) {
                    p._types = regData.types;
                    p._baseStats = regData.baseStats;
                  }
                }
                loadPokemonAPIData(p);
              }
            }
            saveDraft();
            translateAndRender();
          }
        } else if (btn.dataset.action === 'delete') {
          if (PokeAuth.isLoggedIn()) {
            PokeAuth.deleteTeamFromStorage(idx);
          } else {
            const saved = getSavedTeams();
            saved.splice(idx, 1);
            saveTeamsToStorage(saved);
          }
          renderSavedTeams();
        }
      });
    });
  }

  // ─── Modals ───
  function setupModals() {
    // Import
    document.getElementById('btnImportShowdown').addEventListener('click', () => {
      document.getElementById('importText').value = '';
      document.getElementById('importError').style.display = 'none';
      $importModal.classList.remove('hidden');
    });
    document.getElementById('importCancel').addEventListener('click', () => $importModal.classList.add('hidden'));
    document.getElementById('importConfirm').addEventListener('click', importFromShowdown);

    // Export
    document.getElementById('btnExportShowdown').addEventListener('click', () => {
      document.getElementById('exportText').value = exportToShowdownText();
      $exportModal.classList.remove('hidden');
    });
    document.getElementById('exportCopy').addEventListener('click', () => {
      navigator.clipboard.writeText(document.getElementById('exportText').value);
      document.getElementById('exportCopy').textContent = t('copied');
      setTimeout(() => { document.getElementById('exportCopy').textContent = t('copy'); }, 1500);
    });
    document.getElementById('exportClose').addEventListener('click', () => $exportModal.classList.add('hidden'));

    // Save
    document.getElementById('btnSaveTeam').addEventListener('click', () => {
      document.getElementById('saveTeamName').value = '';
      $saveModal.classList.remove('hidden');
    });
    document.getElementById('saveCancel').addEventListener('click', () => $saveModal.classList.add('hidden'));
    document.getElementById('saveConfirm').addEventListener('click', saveTeam);

    // Close modals on overlay click
    [$importModal, $exportModal, $saveModal].forEach(m => {
      m.addEventListener('click', (e) => {
        if (e.target === m) m.classList.add('hidden');
      });
    });
  }

  // ─── Import Showdown ───
  function importFromShowdown() {
    const text = document.getElementById('importText').value.trim();
    if (!text) {
      document.getElementById('importError').textContent = t('pasteError');
      document.getElementById('importError').style.display = 'block';
      return;
    }
    try {
      const parsed = ShowdownParser.parse(text);
      if (!parsed || parsed.length === 0) {
        document.getElementById('importError').textContent = t('parseError');
        document.getElementById('importError').style.display = 'block';
        return;
      }
      for (const p of parsed) {
        if (p._megaSuffix !== undefined) {
          const stones = RegulationMB.getMegaStones(p.species);
          if (stones.length > 0 && !p.item) {
            p.item = p._megaSuffix === 'Y' && stones.length > 1 ? stones[1] : stones[0];
          }
          const regData = RegulationMB.getPokemonData(p.species);
          if (regData && regData.abilities && regData.abilities.length > 0) {
            p.ability = regData.abilities[0];
          }
        }
        delete p._megaSuffix;
      }
      team = new Array(TEAM_SIZE).fill(null);
      for (let i = 0; i < Math.min(parsed.length, TEAM_SIZE); i++) {
        const p = parsed[i];
        const sp = p.evs ? RegulationMB.convertEVsToSP(p.evs) : { hp:0, atk:0, def:0, spa:0, spd:0, spe:0 };
        const regData = RegulationMB.getPokemonData(p.species);
        team[i] = {
          species: p.species || '',
          nickname: p.nickname || '',
          item: p.item || '',
          ability: p.ability || '',
          nature: p.nature || 'Serious',
          gender: p.gender || '',
          shiny: p.shiny || false,
          teraType: p.teraType || '',
          sp: sp,
          moves: (p.moves || []).slice(0, 4).concat(['','','','']).slice(0, 4),
          _spriteURL: '',
          _types: regData ? regData.types : [],
          _baseStats: regData ? regData.baseStats : null,
          _apiData: null,
        };
        loadPokemonAPIData(team[i]);
      }
      activeSlot = -1;
      saveDraft();
      translateAndRender();
      $importModal.classList.add('hidden');
    } catch (err) {
      document.getElementById('importError').textContent = t('parseErrorPrefix') + err.message;
      document.getElementById('importError').style.display = 'block';
    }
  }

  // ─── Export Showdown ───
  function exportToShowdownText() {
    return team.filter(p => p && p.species).map(p => {
      const evs = RegulationMB.convertSPtoEVs(p.sp || {});
      const evStr = RegulationMB.STAT_KEYS
        .filter(k => evs[k] > 0)
        .map(k => `${evs[k]} ${k.toUpperCase()}`)
        .join(' / ');
      const lines = [];
      const speciesLine = p.nickname ? `${p.nickname} (${p.species})` : p.species;
      lines.push(`${speciesLine}${p.item ? ' @ ' + p.item : ''}`);
      if (p.ability) lines.push(`Ability: ${p.ability}`);
      lines.push(`Level: 50`);
      if (evStr) lines.push(`EVs: ${evStr}`);
      if (p.nature && p.nature !== 'Serious') lines.push(`${p.nature} Nature`);
      for (const m of p.moves) {
        if (m) lines.push(`- ${m}`);
      }
      return lines.join('\n');
    }).join('\n\n');
  }

  // ─── Save Team ───
  function saveTeam() {
    const name = document.getElementById('saveTeamName').value.trim();
    if (!name) return;
    const teamData = {
      name,
      date: new Date().toISOString(),
      team: JSON.parse(JSON.stringify(team)),
      playerData: getPlayerData(),
    };
    if (PokeAuth.isLoggedIn()) {
      PokeAuth.saveTeamToStorage(teamData);
    } else {
      const saved = getSavedTeams();
      saved.push(teamData);
      saveTeamsToStorage(saved);
    }
    $saveModal.classList.add('hidden');
    renderSavedTeams();
  }

  // ─── PDF Export ───
  function setupExportButtons() {
    document.getElementById('btnExportShowdown');
  }

  function setupPDFButtons() {
    document.getElementById('btnOpenSheet').addEventListener('click', () => generatePDF('open'));
    document.getElementById('btnStaffSheet').addEventListener('click', () => generatePDF('staff'));
    document.getElementById('btnBothSheets').addEventListener('click', () => generatePDF('both'));
  }

  function generatePDF(mode) {
    const pokemonList = team.filter(p => p && p.species).map(p => {
      const evs = RegulationMB.convertSPtoEVs(p.sp || {});
      return {
        species: p.species,
        nickname: p.nickname || '',
        item: p.item || '',
        ability: p.ability || '',
        nature: p.nature || 'Serious',
        level: 50,
        gender: p.gender || '',
        shiny: p.shiny || false,
        teraType: p.teraType || '',
        evs: evs,
        ivs: { hp:31, atk:31, def:31, spa:31, spd:31, spe:31 },
        moves: p.moves.filter(m => m),
        _original: {
          species: p.species,
          item: p.item || '',
          ability: p.ability || '',
          nature: p.nature || 'Serious',
          teraType: p.teraType || '',
          moves: p.moves.filter(m => m),
        },
      };
    });

    // Pad to 6 slots (pdf.js expects exactly 6)
    while (pokemonList.length < 6) {
      pokemonList.push({
        species: '', nickname: '', item: '', gender: '', ability: '',
        nature: 'Serious', level: 50, shiny: false, happiness: 255,
        teraType: '', evs: { hp:0, atk:0, def:0, spa:0, spd:0, spe:0 },
        ivs: { hp:31, atk:31, def:31, spa:31, spd:31, spe:31 }, moves: [],
      });
    }

    if (!pokemonList.some(p => p.species)) return;

    const pd = getPlayerData();
    const mm = pd.dobMm || '';
    const dd = pd.dobDd || '';
    const yyyy = pd.dobYyyy || '';
    const dob = (mm && dd && yyyy) ? `${mm}/${dd}/${yyyy}` : '';

    const playerInfo = {
      playerName: pd.playerName,
      trainerName: pd.trainerName,
      playerId: pd.playerId,
      dob,
      teamNumber: pd.teamNumber,
      switchProfile: pd.switchProfile,
      supportId: '',
      ageDivision: pd.ageDivision,
    };

    TeamSheetPDF.generate(playerInfo, pokemonList, mode).then(bytes => {
      const names = { open: 'OpenTeamSheet', staff: 'StaffSheet', both: 'TeamSheets' };
      TeamSheetPDF.downloadPdf(bytes, `${names[mode] || 'TeamSheet'}.pdf`);
    }).catch(err => {
      console.error('PDF generation error:', err);
      alert(t('pdfError') + err.message);
    });
  }

  // ─── Auth Integration ───
  function setupAuth() {
    PokeAuth.renderAuthButton('authContainer');

    const $loadProfileBtn = document.getElementById('loadProfileBtn');
    if (PokeAuth.isLoggedIn()) {
      const profile = PokeAuth.getProfile();
      const hasProfileData = profile && (profile.playerName || profile.trainerName || profile.playerId);
      if (hasProfileData) {
        $loadProfileBtn.classList.remove('hidden');
      }
    }

    $loadProfileBtn?.addEventListener('click', loadProfileData);

    const $clearPlayerDataBtn = document.getElementById('clearPlayerDataBtn');
    if ($clearPlayerDataBtn) {
      $clearPlayerDataBtn.addEventListener('click', () => {
        document.getElementById('playerName').value = '';
        document.getElementById('trainerName').value = '';
        document.getElementById('playerId').value = '';
        document.getElementById('dobMm').value = '';
        document.getElementById('dobDd').value = '';
        document.getElementById('dobYyyy').value = '';
        document.getElementById('teamNumber').value = '';
        document.getElementById('switchProfile').value = '';
        const defaultRadio = document.querySelector('[name="ageDivision"][value="Masters"]');
        if (defaultRadio) {
          defaultRadio.checked = true;
          document.querySelectorAll('[name="ageDivision"]').forEach(l => {
            l.closest('.chip-btn')?.classList.add('active');
          });
        }
        saveDraft();
      });
    }

    renderSavedTeams();
  }

  function loadProfileData() {
    const profile = PokeAuth.getProfile();
    if (!profile) return;
    if (profile.playerName) document.getElementById('playerName').value = profile.playerName;
    if (profile.trainerName) document.getElementById('trainerName').value = profile.trainerName;
    if (profile.playerId) document.getElementById('playerId').value = profile.playerId;
    if (profile.dobMm) document.getElementById('dobMm').value = profile.dobMm;
    if (profile.dobDd) document.getElementById('dobDd').value = profile.dobDd;
    if (profile.dobYyyy) document.getElementById('dobYyyy').value = profile.dobYyyy;
    if (profile.teamNumber) document.getElementById('teamNumber').value = profile.teamNumber;
    if (profile.switchProfile) document.getElementById('switchProfile').value = profile.switchProfile;
    if (profile.ageDivision) {
      const radio = document.querySelector(`[name="ageDivision"][value="${profile.ageDivision}"]`);
      if (radio) {
        radio.checked = true;
        document.querySelectorAll('[name="ageDivision"]').forEach(l => {
          l.closest('.chip-btn')?.classList.toggle('active', l.checked);
        });
      }
    }
    saveDraft();
  }

  // ─── Init on load ───
  document.addEventListener('DOMContentLoaded', init);

  return { team, init };
})();
