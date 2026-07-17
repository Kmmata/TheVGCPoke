/**
 * Pokémon Champions Damage Calculator — UI Controller.
 * Handles panel state, autocomplete, stat calculation, damage display.
 */
const CalcApp = (() => {
  'use strict';

  const TYPE_NAMES = TypeChart.TYPES;
  const NATURE_NAMES = Object.keys(RegulationMB.NATURES);

  // ─── State ──────────────────────────────────────────────────────────

  const state = {
    left: {
      species: '', types: ['Normal','Normal'], baseStats: { hp:100,atk:100,def:100,spa:100,spd:100,spe:100 },
      nature: 'Hardy', ability: '', item: '', status: 'Healthy',
      teraType: 'Normal', isTerastalized: false,
      mega: false, megaForm: '',
      origBaseStats: null, origTypes: null, origAbility: null, origWeight: 0,
      sp: { hp:0,atk:0,def:0,spa:0,spd:0,spe:0 },
      boosts: { hp:0,atk:0,def:0,spa:0,spd:0,spe:0 },
      moves: ['','','',''],
      moveData: [null,null,null,null],
      curHP: 341, maxHP: 341,
      weight: 0,
    },
    right: {
      species: '', types: ['Normal','Normal'], baseStats: { hp:100,atk:100,def:100,spa:100,spd:100,spe:100 },
      nature: 'Hardy', ability: '', item: '', status: 'Healthy',
      teraType: 'Normal', isTerastalized: false,
      mega: false, megaForm: '',
      origBaseStats: null, origTypes: null, origAbility: null, origWeight: 0,
      sp: { hp:0,atk:0,def:0,spa:0,spd:0,spe:0 },
      boosts: { hp:0,atk:0,def:0,spa:0,spd:0,spe:0 },
      moves: ['','','',''],
      moveData: [null,null,null,null],
      curHP: 341, maxHP: 341,
      weight: 0,
    },
    field: {
      format: 'Singles',
      weather: '',
      terrain: '',
      isReflect: false,
      isLightScreen: false,
      isAuroraVeil: false,
      isHelpingHand: false,
      isCharge: false,
      isBattery: false,
      isPowerSpot: false,
      isGravity: false,
      isDoubles: false,
    },
    selectedMove: { side: 'left', index: 0 },
    lang: 'es',
  };

  // ─── DOM helpers ────────────────────────────────────────────────────

  function $(sel) { return document.querySelector(sel); }
  function $$(sel) { return document.querySelectorAll(sel); }

  // ─── Initialize ─────────────────────────────────────────────────────

  function init() {
    initTheme();
    initLang();
    populateTypeSelects();
    populateNatureSelects();
    bindFieldButtons();
    bindMoveInputs();
    bindSpeciesInputs();
    bindStatInputs();
    bindAbilityInputs();
    bindItemInputs();
    bindMoveButtons();
    bindSwapButton();
    bindTeamPreview();
    bindImportButtons();
    bindMegaInputs();
    recalcAll();
  }

  // ─── Theme ──────────────────────────────────────────────────────────

  function initTheme() {
    const saved = localStorage.getItem('tsTheme');
    const prefersDark = saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    updateThemeBtn();
    $('#themeToggle').addEventListener('click', () => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
      localStorage.setItem('tsTheme', isDark ? 'light' : 'dark');
      updateThemeBtn();
    });
  }

  function updateThemeBtn() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    $('#themeToggle').textContent = isDark ? '☀' : '☾';
  }

  // ─── Language ───────────────────────────────────────────────────────

  function initLang() {
    const saved = localStorage.getItem('tsLang') || 'es';
    state.lang = saved;
    applyLang();
    $('#langToggle').addEventListener('click', () => {
      state.lang = state.lang === 'es' ? 'en' : 'es';
      localStorage.setItem('tsLang', state.lang);
      applyLang();
    });
  }

  function applyLang() {
    const lang = state.lang;
    document.documentElement.setAttribute('data-lang', lang);
    $$('[data-es]').forEach(el => {
      const text = el.getAttribute(`data-${lang}`);
      if (text) {
        if (el.tagName === 'INPUT' && el.type !== 'checkbox') {
          // don't overwrite input values
        } else {
          el.textContent = text;
        }
      }
    });
    const langBtn = $('#langToggle');
    langBtn.textContent = lang === 'es' ? 'EN' : 'ES';
  }

  // ─── Populate type selects ─────────────────────────────────────────

  function populateTypeSelects() {
    const selects = ['type1Left','type2Left','teraLeft','type1Right','type2Right','teraRight'];
    selects.forEach(id => {
      const sel = $(`#${id}`);
      sel.innerHTML = '';
      TYPE_NAMES.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t;
        opt.textContent = t;
        sel.appendChild(opt);
      });
    });

    // Also populate move type selects
    $$('.calc-move-type-select').forEach(sel => {
      sel.innerHTML = '';
      TYPE_NAMES.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t;
        opt.textContent = t;
        sel.appendChild(opt);
      });
    });

    // Bind type change events
    ['Left','Right'].forEach(side => {
      $(`#type1${side}`).addEventListener('change', () => {
        state[side.toLowerCase()].types[0] = $(`#type1${side}`).value;
        recalcAll();
      });
      $(`#type2${side}`).addEventListener('change', () => {
        state[side.toLowerCase()].types[1] = $(`#type2${side}`).value;
        recalcAll();
      });
      $(`#tera${side}`).addEventListener('change', () => {
        state[side.toLowerCase()].teraType = $(`#tera${side}`).value;
        recalcAll();
      });
      $(`#teraActive${side}`).addEventListener('change', () => {
        state[side.toLowerCase()].isTerastalized = $(`#teraActive${side}`).checked;
        recalcAll();
      });
    });
  }

  // ─── Populate nature select ────────────────────────────────────────

  function populateNatureSelects() {
    ['Left','Right'].forEach(side => {
      const sel = $(`#nature${side}`);
      sel.innerHTML = '';
      NATURE_NAMES.forEach(n => {
        const opt = document.createElement('option');
        opt.value = n;
        const data = RegulationMB.NATURES[n];
        if (data.plus && data.minus) {
          opt.textContent = `${n} (+${data.plus.toUpperCase()}, -${data.minus.toUpperCase()})`;
        } else {
          opt.textContent = n;
        }
        sel.appendChild(opt);
      });
      sel.addEventListener('change', () => {
        state[side.toLowerCase()].nature = sel.value;
        recalcStats(side.toLowerCase());
        recalcAll();
      });
    });
  }

  // ─── Field buttons ─────────────────────────────────────────────────

  function bindFieldButtons() {
    $$('.calc-btn-option').forEach(btn => {
      btn.addEventListener('click', () => {
        const field = btn.dataset.field;
        const value = btn.dataset.value;

        if (field === 'format') {
          state.field.format = value;
          state.field.isDoubles = value === 'Doubles';
          btn.closest('.calc-btn-group').querySelectorAll('.calc-btn-option').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
        } else if (field === 'weather') {
          state.field.weather = value;
          btn.closest('.calc-btn-group').querySelectorAll('.calc-btn-option').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
        } else if (field === 'terrain') {
          state.field.terrain = value;
          btn.closest('.calc-btn-group').querySelectorAll('.calc-btn-option').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
        } else if (field === 'reflect') {
          state.field.isReflect = !state.field.isReflect;
          btn.classList.toggle('active');
        } else if (field === 'lightScreen') {
          state.field.isLightScreen = !state.field.isLightScreen;
          btn.classList.toggle('active');
        } else if (field === 'auroraVeil') {
          state.field.isAuroraVeil = !state.field.isAuroraVeil;
          btn.classList.toggle('active');
        } else if (field === 'helpingHand') {
          state.field.isHelpingHand = !state.field.isHelpingHand;
          btn.classList.toggle('active');
        } else if (field === 'charge') {
          state.field.isCharge = !state.field.isCharge;
          btn.classList.toggle('active');
        } else if (field === 'battery') {
          state.field.isBattery = !state.field.isBattery;
          btn.classList.toggle('active');
        } else if (field === 'powerSpot') {
          state.field.isPowerSpot = !state.field.isPowerSpot;
          btn.classList.toggle('active');
        } else if (field === 'gravity') {
          state.field.isGravity = !state.field.isGravity;
          btn.classList.toggle('active');
        }
        recalcAll();
      });
    });
  }

  // ─── Species autocomplete ──────────────────────────────────────────

  function bindSpeciesInputs() {
    ['Left','Right'].forEach(side => {
      const input = $(`#species${side}`);
      const ac = $(`#autocomplete${side}`);
      const s = side.toLowerCase();

      input.addEventListener('input', () => {
        const q = input.value.trim();
        if (q.length < 1) { ac.classList.remove('visible'); return; }
        const results = RegulationMB.searchPokemon(q, 8);
        if (results.length === 0) { ac.classList.remove('visible'); return; }
        ac.innerHTML = '';
        results.forEach(p => {
          const div = document.createElement('div');
          div.className = 'calc-ac-item';
          const typeBadges = p.types.map(t =>
            `<span class="calc-ac-type-badge" style="background:var(--type-${t.toLowerCase()})">${t}</span>`
          ).join(' ');
          div.innerHTML = `<span>${p.name}</span> ${typeBadges}`;
          div.addEventListener('click', () => {
            input.value = p.name;
            ac.classList.remove('visible');
            selectPokemon(s, p.name);
          });
          ac.appendChild(div);
        });
        ac.classList.add('visible');
      });

      input.addEventListener('focus', () => {
        if (input.value.trim().length >= 1) {
          input.dispatchEvent(new Event('input'));
        }
      });

      document.addEventListener('click', (e) => {
        if (!ac.contains(e.target) && e.target !== input) {
          ac.classList.remove('visible');
        }
      });
    });
  }

  function selectPokemon(side, name) {
    const data = RegulationMB.getPokemonData(name);
    if (!data) return;
    const s = state[side];

    s.species = name;
    s.types = [...data.types];
    s.baseStats = { ...data.baseStats };
    s.ability = data.abilities[0] || '';

    // Update mega UI
    updateMegaUI(side);

    // Update UI
    $(`#type1${capitalize(side)}`).value = s.types[0];
    $(`#type2${capitalize(side)}`).value = s.types[1] || '';
    $(`#tera${capitalize(side)}`).value = s.types[0];
    s.teraType = s.types[0];

    // Base stats
    $(`#baseHp${capitalize(side)}`).value = s.baseStats.hp;
    $(`#baseAtk${capitalize(side)}`).value = s.baseStats.atk;
    $(`#baseDef${capitalize(side)}`).value = s.baseStats.def;
    $(`#baseSpa${capitalize(side)}`).value = s.baseStats.spa;
    $(`#baseSpd${capitalize(side)}`).value = s.baseStats.spd;
    $(`#baseSpe${capitalize(side)}`).value = s.baseStats.spe;

    // Ability
    $(`#ability${capitalize(side)}`).value = s.ability;

    // Load sprite
    loadSprite(side, name);

    // Load weight for variable-power moves
    loadWeight(side, name);

    // Auto-fill moves if empty
    autoFillMoves(side, name);

    recalcStats(side);
    recalcAll();
  }

  async function loadSprite(side, name, megaForm) {
    let spriteName = name;
    if (megaForm !== undefined) {
      spriteName = name + '-mega' + (megaForm ? '-' + megaForm.toLowerCase() : '');
    }
    const sprite = await ChampionsAPI.fetchSprite(spriteName);
    if (sprite) {
      $(`#sprite${capitalize(side)}`).src = sprite;
    }
  }

  async function loadWeight(side, name) {
    const weight = await ChampionsAPI.fetchWeight(name);
    if (weight) state[side].weight = weight;
  }

  function autoFillMoves(side, name) {
    const s = state[side];
    if (s.moves.some(m => m !== '')) return; // don't overwrite if already has moves
    // Suggest 4 common moves (empty for now — user fills manually)
  }

  // ─── Move autocomplete ─────────────────────────────────────────────

  function bindMoveInputs() {
    $$('.calc-move-input').forEach(input => {
      const idx = parseInt(input.dataset.moveidx);
      const side = input.closest('.calc-pokemon-panel').id === 'panelLeft' ? 'left' : 'right';
      const ac = input.parentElement.querySelector('.calc-autocomplete');

      input.addEventListener('input', () => {
        const q = input.value.trim();
        if (q.length < 1) { ac.classList.remove('visible'); return; }
        const results = RegulationMB.searchMoves(q, 8);
        if (results.length === 0) { ac.classList.remove('visible'); return; }
        ac.innerHTML = '';
        results.forEach(m => {
          const div = document.createElement('div');
          div.className = 'calc-ac-item';
          const moveData = CalcMoveData.getMoveData(m);
          const typeBadge = moveData ? `<span class="calc-ac-type-badge" style="background:var(--type-${moveData.type.toLowerCase()})">${moveData.type}</span>` : '';
          div.innerHTML = `<span>${m}</span> ${typeBadge}`;
          div.addEventListener('click', () => {
            input.value = m;
            ac.classList.remove('visible');
            state[side].moves[idx] = m;
            state[side].moveData[idx] = moveData;
            // Update move type and category in UI
            if (moveData) {
              const row = input.closest('.calc-move-row');
              row.querySelector('.calc-bp-input').value = moveData.bp;
              row.querySelector('.calc-move-type-select').value = moveData.type;
              row.querySelector('.calc-cat-select').value = moveData.category;
            }
            recalcAll();
          });
          ac.appendChild(div);
        });
        ac.classList.add('visible');
      });

      input.addEventListener('focus', () => {
        if (input.value.trim().length >= 1) {
          input.dispatchEvent(new Event('input'));
        }
      });

      document.addEventListener('click', (e) => {
        if (!ac.contains(e.target) && e.target !== input) {
          ac.classList.remove('visible');
        }
      });

      // Also handle manual BP/type/category changes
      const row = input.closest('.calc-move-row');
      row.querySelector('.calc-bp-input').addEventListener('change', () => {
        const base = CalcMoveData.getMoveData(state[side].moves[idx]);
        if (base) {
          state[side].moveData[idx] = { ...base, bp: parseInt(row.querySelector('.calc-bp-input').value) || 0 };
        }
        recalcAll();
      });
      row.querySelector('.calc-move-type-select').addEventListener('change', () => {
        const base = CalcMoveData.getMoveData(state[side].moves[idx]);
        if (base) {
          state[side].moveData[idx] = { ...base, type: row.querySelector('.calc-move-type-select').value };
        }
        recalcAll();
      });
      row.querySelector('.calc-cat-select').addEventListener('change', () => {
        const base = CalcMoveData.getMoveData(state[side].moves[idx]);
        if (base) {
          state[side].moveData[idx] = { ...base, category: row.querySelector('.calc-cat-select').value };
        }
        recalcAll();
      });
    });
  }

  // ─── Stat inputs ───────────────────────────────────────────────────

  function bindStatInputs() {
    ['Left','Right'].forEach(side => {
      const s = side.toLowerCase();
      const stats = ['Hp','Atk','Def','Spa','Spd','Spe'];
      const statKeys = ['hp','atk','def','spa','spd','spe'];

      stats.forEach((stat, i) => {
        const spInput = $(`#sp${stat}${side}`);
        const baseInput = $(`#base${stat}${side}`);
        const boostSelect = $(`#boost${stat}${side}`);

        if (spInput) {
          spInput.addEventListener('input', () => {
            const newVal = parseInt(spInput.value) || 0;
            const otherTotal = Object.entries(state[s].sp).reduce((sum, [k, v]) => k === statKeys[i] ? sum : sum + v, 0);
            const clamped = Math.max(0, Math.min(newVal, 66 - otherTotal));
            if (clamped !== newVal) spInput.value = clamped;
            state[s].sp[statKeys[i]] = clamped;
            recalcStats(s);
            recalcAll();
          });
        }

        if (baseInput) {
          baseInput.addEventListener('input', () => {
            state[s].baseStats[statKeys[i]] = parseInt(baseInput.value) || 0;
            recalcStats(s);
            recalcAll();
          });
        }

        if (boostSelect) {
          boostSelect.addEventListener('change', () => {
            state[s].boosts[statKeys[i]] = parseInt(boostSelect.value);
            recalcAll();
          });
        }
      });

      // Current HP
      const curHpInput = $(`#curHp${side}`);
      const pctHpInput = $(`#pctHp${side}`);
      const sliderHp = $(`#sliderHp${side}`);

      if (curHpInput) {
        curHpInput.addEventListener('input', () => {
          const max = state[s].maxHP;
          let val = parseInt(curHpInput.value) || 0;
          if (val > max) val = max;
          if (val < 0) val = 0;
          curHpInput.value = val;
          state[s].curHP = val;
          if (max > 0) {
            const pct = Math.round(val / max * 100);
            pctHpInput.value = pct;
            if (sliderHp) sliderHp.value = pct;
          }
          recalcAll();
        });
      }

      if (pctHpInput) {
        pctHpInput.addEventListener('input', () => {
          let pct = parseInt(pctHpInput.value) || 0;
          if (pct > 100) pct = 100;
          if (pct < 0) pct = 0;
          pctHpInput.value = pct;
          state[s].curHP = Math.round(state[s].maxHP * pct / 100);
          curHpInput.value = state[s].curHP;
          if (sliderHp) sliderHp.value = pct;
          recalcAll();
        });
      }

      if (sliderHp) {
        sliderHp.addEventListener('input', () => {
          let pct = parseInt(sliderHp.value) || 0;
          if (pct > 100) pct = 100;
          state[s].curHP = Math.round(state[s].maxHP * pct / 100);
          curHpInput.value = state[s].curHP;
          pctHpInput.value = pct;
          recalcAll();
        });
      }

      // Status
      const statusSelect = $(`#status${side}`);
      if (statusSelect) {
        statusSelect.addEventListener('change', () => {
          state[s].status = statusSelect.value;
          recalcAll();
        });
      }
    });
  }

  // ─── Ability autocomplete ──────────────────────────────────────────

  function bindAbilityInputs() {
    ['Left','Right'].forEach(side => {
      const input = $(`#ability${side}`);
      const ac = $(`#abilityAutocomplete${side}`);
      const s = side.toLowerCase();

      const commonAbilities = [
        'Intimidate', 'Levitate', 'Flash Fire', 'Water Absorb', 'Volt Absorb',
        'Magic Guard', 'Trace', 'Natural Cure', 'Regenerator', 'Prankster',
        'Technician', 'Sheer Force', 'Reckless', 'Iron Fist', 'Tough Claws',
        'Multiscale', 'Rough Skin', 'Sand Veil', 'Snow Cloak', 'Ice Body',
        'Chlorophyll', 'Drought', 'Drizzle', 'Sand Stream', 'Snow Warning',
        'Speed Boost', 'Moxie', 'Defiant', 'Competitive', 'Inner Focus',
        'Sturdy', 'Shell Armor', 'Battle Armor', 'Filter', 'Solid Rock',
        'Pure Power', 'Huge Power', 'Fur Coat', 'Marvel Scale', 'Unaware',
        'Protean', 'Libero', 'Adaptability', 'Hustle', 'Guts',
        'Thick Fat', 'Poison Heal', 'Magic Bounce', 'Infiltrator',
        'Sap Sipper', 'Dry Skin', 'Rain Dish', 'Ice Body',
        'Anticipation', 'Volt Absorb', 'Motor Drive', 'Lightning Rod',
        'Sand Rush', 'Slush Rush', 'Swift Swim', 'Chlorophyll',
        'Parental Bond', 'Huge Power', 'Pure Power',
        'Good as Gold', 'Purifying Salt', 'Earth Eater',
        'Zero to Hero', 'Disguise', 'Wandering Spirit',
        'Shadow Tag', 'Arena Trap', 'Magnet Pull',
        'Prankster', 'Triage', 'Psychic Surge',
        'Grassy Surge', 'Electric Surge', 'Misty Surge',
        'Protosynthesis', 'Quark Drive',
        'Supreme Overlord', 'Sharpness',
        'Costar', 'Embody Aspect',
      ];

      input.addEventListener('input', () => {
        const q = input.value.trim().toLowerCase();
        if (q.length < 1) { ac.classList.remove('visible'); return; }

        // Filter from common abilities + species abilities
        const data = RegulationMB.getPokemonData(state[s].species);
        let pool = [...commonAbilities];
        if (data && data.abilities) {
          pool = [...new Set([...data.abilities, ...pool])];
        }

        const results = pool.filter(a => a.toLowerCase().includes(q)).slice(0, 8);
        if (results.length === 0) { ac.classList.remove('visible'); return; }
        ac.innerHTML = '';
        results.forEach(a => {
          const div = document.createElement('div');
          div.className = 'calc-ac-item';
          div.textContent = a;
          div.addEventListener('click', () => {
            input.value = a;
            ac.classList.remove('visible');
            state[s].ability = a;
            recalcAll();
          });
          ac.appendChild(div);
        });
        ac.classList.add('visible');
      });

      input.addEventListener('change', () => {
        state[s].ability = input.value.trim();
        recalcAll();
      });

      document.addEventListener('click', (e) => {
        if (!ac.contains(e.target) && e.target !== input) {
          ac.classList.remove('visible');
        }
      });
    });
  }

  // ─── Item autocomplete ─────────────────────────────────────────────

  function bindItemInputs() {
    ['Left','Right'].forEach(side => {
      const input = $(`#item${side}`);
      const ac = $(`#itemAutocomplete${side}`);
      const s = side.toLowerCase();

      input.addEventListener('input', () => {
        const q = input.value.trim();
        if (q.length < 1) { ac.classList.remove('visible'); return; }
        const results = RegulationMB.searchItems(q, 8);
        if (results.length === 0) { ac.classList.remove('visible'); return; }
        ac.innerHTML = '';
        results.forEach(item => {
          const div = document.createElement('div');
          div.className = 'calc-ac-item';
          div.textContent = item;
          div.addEventListener('click', () => {
            input.value = item;
            ac.classList.remove('visible');
            state[s].item = item;
            recalcAll();
          });
          ac.appendChild(div);
        });
        ac.classList.add('visible');
      });

      input.addEventListener('change', () => {
        state[s].item = input.value.trim();
        recalcAll();
      });

      document.addEventListener('click', (e) => {
        if (!ac.contains(e.target) && e.target !== input) {
          ac.classList.remove('visible');
        }
      });
    });
  }

  // ─── Move result buttons ──────────────────────────────────────────

  function bindMoveButtons() {
    $$('.calc-move-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('.calc-move-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.selectedMove.side = btn.dataset.side;
        state.selectedMove.index = parseInt(btn.dataset.move);
        updateMainResult();
      });
    });
  }

  // ─── Swap button ───────────────────────────────────────────────────

  function bindSwapButton() {
    $('#swapPokemon').addEventListener('click', () => {
      const tmp = { ...state.left };
      state.left = { ...state.right };
      state.right = tmp;

      // Update all UI elements
      syncUIToState('left');
      syncUIToState('right');
      recalcAll();
    });
  }

  // ─── Mega Evolution ─────────────────────────────────────────────────

  function bindMegaInputs() {
    ['left','right'].forEach(side => {
      const cap = capitalize(side);
      const checkbox = $(`#megaActive${cap}`);
      const formSelect = $(`#megaForm${cap}`);

      checkbox.addEventListener('change', () => {
        toggleMega(side);
      });

      formSelect.addEventListener('change', () => {
        const s = state[side];
        s.megaForm = formSelect.value;
        if (s.mega) {
          const megaData = RegulationMB.getMegaData(s.species, s.megaForm);
          if (megaData) {
            s.baseStats = { ...megaData.baseStats };
            s.types = [...megaData.types];
            s.ability = megaData.ability;
            const megaName = s.species + '-mega-' + s.megaForm.toLowerCase();
            ChampionsAPI.fetchWeight(megaName).then(w => { if (w) s.weight = w; });
            syncUIToState(side);
            recalcAll();
            loadSprite(side, s.species, s.megaForm);
          }
        }
      });
    });
  }

  function toggleMega(side) {
    const s = state[side];
    const cap = capitalize(side);
    const checkbox = $(`#megaActive${cap}`);
    const formSelect = $(`#megaForm${cap}`);

    if (checkbox.checked) {
      const megaData = RegulationMB.getMegaData(s.species, s.megaForm);
      if (!megaData) { checkbox.checked = false; return; }

      s.origBaseStats = { ...s.baseStats };
      s.origTypes = [...s.types];
      s.origAbility = s.ability;
      s.origWeight = s.weight;
      s.baseStats = { ...megaData.baseStats };
      s.types = [...megaData.types];
      s.ability = megaData.ability;
      s.mega = true;
      // Fetch mega weight asynchronously
      const megaName = s.species + '-mega' + (s.megaForm ? '-' + s.megaForm.toLowerCase() : '');
      ChampionsAPI.fetchWeight(megaName).then(w => { if (w) s.weight = w; });
    } else {
      if (s.origBaseStats) {
        s.baseStats = { ...s.origBaseStats };
        s.types = [...s.origTypes];
        s.ability = s.origAbility;
      }
      s.weight = s.origWeight;
      s.mega = false;
      s.origBaseStats = null;
      s.origTypes = null;
      s.origAbility = null;
      s.origWeight = 0;
    }

    syncUIToState(side);
    recalcAll();

    if (s.mega) {
      loadSprite(side, s.species, s.megaForm || '');
    } else {
      loadSprite(side, s.species);
    }
  }

  function updateMegaUI(side) {
    const s = state[side];
    const cap = capitalize(side);
    const checkbox = $(`#megaActive${cap}`);
    const formSelect = $(`#megaForm${cap}`);

    // Reset mega state when species changes
    s.mega = false;
    s.megaForm = '';
    s.origBaseStats = null;
    s.origTypes = null;
    s.origAbility = null;
    checkbox.checked = false;

    const canMega = RegulationMB.canMegaEvolve(s.species);
    const isDual = RegulationMB.hasDualMega(s.species);

    if (canMega && isDual) {
      formSelect.innerHTML = '<option value="">Select Form</option><option value="X">X</option><option value="Y">Y</option>';
      formSelect.classList.remove('hidden');
      formSelect.value = 'X';
      s.megaForm = 'X';
    } else if (canMega) {
      formSelect.classList.add('hidden');
      formSelect.innerHTML = '';
    } else {
      formSelect.classList.add('hidden');
      formSelect.innerHTML = '';
    }
  }

  function syncUIToState(side) {
    const s = state[side];
    const cap = capitalize(side);

    $(`#species${cap}`).value = s.species;
    $(`#type1${cap}`).value = s.types[0];
    $(`#type2${cap}`).value = s.types[1] || '';
    $(`#tera${cap}`).value = s.teraType;
    $(`#teraActive${cap}`).checked = s.isTerastalized;
    $(`#megaActive${cap}`).checked = s.mega;
    // Populate mega form select
    const canMega = RegulationMB.canMegaEvolve(s.species);
    const isDual = RegulationMB.hasDualMega(s.species);
    const formSelect = $(`#megaForm${cap}`);
    if (canMega && isDual) {
      formSelect.innerHTML = '<option value="">Select Form</option><option value="X">X</option><option value="Y">Y</option>';
      formSelect.classList.remove('hidden');
      formSelect.value = s.megaForm || 'X';
    } else {
      formSelect.classList.add('hidden');
      formSelect.innerHTML = '';
    }
    if (s.mega && s.megaForm) {
      $(`#megaForm${cap}`).value = s.megaForm;
    }
    $(`#nature${cap}`).value = s.nature;
    $(`#ability${cap}`).value = s.ability;
    $(`#item${cap}`).value = s.item;
    $(`#status${cap}`).value = s.status;

    // Base stats
    $(`#baseHp${cap}`).value = s.baseStats.hp;
    $(`#baseAtk${cap}`).value = s.baseStats.atk;
    $(`#baseDef${cap}`).value = s.baseStats.def;
    $(`#baseSpa${cap}`).value = s.baseStats.spa;
    $(`#baseSpd${cap}`).value = s.baseStats.spd;
    $(`#baseSpe${cap}`).value = s.baseStats.spe;

    // SP
    $(`#spHp${cap}`).value = s.sp.hp;
    $(`#spAtk${cap}`).value = s.sp.atk;
    $(`#spDef${cap}`).value = s.sp.def;
    $(`#spSpa${cap}`).value = s.sp.spa;
    $(`#spSpd${cap}`).value = s.sp.spd;
    $(`#spSpe${cap}`).value = s.sp.spe;

    // Boosts
    $(`#boostAtk${cap}`).value = s.boosts.atk;
    $(`#boostDef${cap}`).value = s.boosts.def;
    $(`#boostSpa${cap}`).value = s.boosts.spa;
    $(`#boostSpd${cap}`).value = s.boosts.spd;
    $(`#boostSpe${cap}`).value = s.boosts.spe;

    // Moves
    const panel = $(`#panel${cap}`);
    panel.querySelectorAll('.calc-move-input').forEach((input, i) => {
      input.value = s.moves[i] || '';
      const moveData = CalcMoveData.getMoveData(s.moves[i]);
      if (moveData) {
        const row = input.closest('.calc-move-row');
        row.querySelector('.calc-bp-input').value = moveData.bp;
        row.querySelector('.calc-move-type-select').value = moveData.type;
        row.querySelector('.calc-cat-select').value = moveData.category;
      }
    });

    // Sprite
    if (s.species) loadSprite(side, s.species);

    recalcStats(side);
  }

  // ─── Team preview ──────────────────────────────────────────────────

  function bindTeamPreview() {
    $$('.calc-team-slot').forEach(slot => {
      slot.addEventListener('click', () => {
        const side = slot.dataset.side;
        const species = slot.dataset.species;
        if (species) {
          selectPokemon(side, species);
        }
      });
    });
  }

  function updateTeamPreview(side) {
    const s = state[side];
    if (s.species) {
      const cap = capitalize(side);
      const slots = $$(`.calc-team-slot[data-side="${side}"]`);
      // Find first empty slot
      let targetSlot = null;
      for (const slot of slots) {
        if (!slot.dataset.species) { targetSlot = slot; break; }
      }
      if (!targetSlot) {
        // Check if species already in team
        for (const slot of slots) {
          if (slot.dataset.species === s.species) { targetSlot = slot; break; }
        }
      }
      if (targetSlot) {
        targetSlot.dataset.species = s.species;
        const img = targetSlot.querySelector('img');
        if (s.species) {
          ChampionsAPI.fetchSprite(s.species).then(sprite => {
            if (sprite) img.src = sprite;
          });
        }
      }
    }
  }

  // ─── Stat calculation ──────────────────────────────────────────────

  function recalcStats(side) {
    const s = state[side];
    const cap = capitalize(side);

    const hp = DamageCalc.getHPWithBoosts(s.baseStats.hp, s.sp.hp);
    s.maxHP = hp;
    s.curHP = hp;

    const atk = DamageCalc.getStatWithBoosts(s.baseStats.atk, s.sp.atk, s.nature, 'atk');
    const def = DamageCalc.getStatWithBoosts(s.baseStats.def, s.sp.def, s.nature, 'def');
    const spa = DamageCalc.getStatWithBoosts(s.baseStats.spa, s.sp.spa, s.nature, 'spa');
    const spd = DamageCalc.getStatWithBoosts(s.baseStats.spd, s.sp.spd, s.nature, 'spd');
    const spe = DamageCalc.getStatWithBoosts(s.baseStats.spe, s.sp.spe, s.nature, 'spe');

    $(`#totalHp${cap}`).textContent = hp;
    $(`#totalAtk${cap}`).textContent = atk;
    $(`#totalDef${cap}`).textContent = def;
    $(`#totalSpa${cap}`).textContent = spa;
    $(`#totalSpd${cap}`).textContent = spd;
    $(`#totalSpe${cap}`).textContent = spe;

    $(`#curHp${cap}`).value = hp;
    $(`#maxHp${cap}`).textContent = hp;
    $(`#pctHp${cap}`).value = 100;
    const sliderEl = $(`#sliderHp${cap}`);
    if (sliderEl) sliderEl.value = 100;

    // SP total
    const spTotal = Object.values(s.sp).reduce((a, b) => a + b, 0);
    $(`#spTotal${cap}`).textContent = spTotal;
    const spCountEl = $(`#spTotal${cap}`);
    if (spTotal > 66) spCountEl.style.color = '#e53e3e';
    else spCountEl.style.color = '';
  }

  // ─── Main recalc ──────────────────────────────────────────────────

  function recalcAll() {
    // Build attacker/defender objects
    const atkSide = state.left;
    const defSide = state.right;

    const attacker = buildPokemonObj(atkSide);
    const defender = buildPokemonObj(defSide);

    // Calculate all moves for both sides
    const leftResults = DamageCalc.calcAllMoves(attacker, defender, state.field);
    const rightResults = DamageCalc.calcAllMoves(defender, attacker, state.field);

    // Update move result buttons (left side = attacker -> defender)
    updateMoveResults('left', leftResults);
    // Right side = defender -> attacker (swap perspectives)
    updateMoveResults('right', rightResults);

    updateMainResult();
    updateTeamPreview('left');
    updateTeamPreview('right');
  }

  function buildPokemonObj(s) {
    const stats = {
      hp: DamageCalc.getHPWithBoosts(s.baseStats.hp, s.sp.hp),
      atk: DamageCalc.getStatWithBoosts(s.baseStats.atk, s.sp.atk, s.nature, 'atk', s.boosts.atk),
      def: DamageCalc.getStatWithBoosts(s.baseStats.def, s.sp.def, s.nature, 'def', s.boosts.def),
      spa: DamageCalc.getStatWithBoosts(s.baseStats.spa, s.sp.spa, s.nature, 'spa', s.boosts.spa),
      spd: DamageCalc.getStatWithBoosts(s.baseStats.spd, s.sp.spd, s.nature, 'spd', s.boosts.spd),
      spe: DamageCalc.getStatWithBoosts(s.baseStats.spe, s.sp.spe, s.nature, 'spe', s.boosts.spe),
    };

    return {
      name: s.species,
      types: s.types.filter(t => t),
      stats,
      boosts: { ...s.boosts },
      ability: s.ability,
      item: s.item,
      status: s.status,
      nature: s.nature,
      teraType: s.teraType,
      isTerastalized: s.isTerastalized,
      moves: s.moves.filter(m => m),
      curHP: s.curHP,
      maxHP: s.maxHP,
      weight: s.weight || 0,
    };
  }

  function updateMoveResults(side, results) {
    const cap = capitalize(side);
    const panel = $(`#panel${cap}`);
    const moveRows = panel.querySelectorAll('.calc-result-move-row, .calc-move-btn');

    // Update in the result banner
    const resultSide = $(`#result${cap}`);
    if (!resultSide) return;

    const btns = resultSide.querySelectorAll('.calc-move-btn');
    const ranges = resultSide.querySelectorAll('.calc-damage-range');

    results.forEach((r, i) => {
      if (btns[i]) btns[i].textContent = r.name || `Move ${i + 1}`;
      if (ranges[i]) {
        if (r.isStatus || !r.percent || r.percent.every(p => p === 0)) {
          ranges[i].textContent = '—';
        } else {
          const min = Math.min(...r.percent.filter(p => p > 0));
          const max = Math.max(...r.percent);
          ranges[i].textContent = `${min}% – ${max}%`;
        }
      }
    });
  }

  function updateMainResult() {
    const { side, index } = state.selectedMove;
    const s = state[side];

    const attacker = buildPokemonObj(s);
    const defender = buildPokemonObj(side === 'left' ? state.right : state.left);

    const moveName = s.moves[index];
    if (!moveName) {
      $('#mainResultText').textContent = '— %';
      $('#mainResultDesc').textContent = state.lang === 'es' ? 'Selecciona un movimiento' : 'Select a move';
      return;
    }

    const moveData = CalcMoveData.getMoveData(moveName);
    if (!moveData || moveData.category === 'Status') {
      $('#mainResultText').textContent = 'Status';
      $('#mainResultDesc').textContent = moveData ? `${moveData.type} — Status` : moveName;
      return;
    }

    const result = DamageCalc.calcDamage(attacker, defender, moveData, state.field);
    const defHP = defender.stats.hp;

    if (result.damage[0] === 0) {
      $('#mainResultText').textContent = '0%';
      $('#mainResultDesc').textContent = result.desc;
      return;
    }

    const percents = result.damage.map(d => Math.round(d / defHP * 1000) / 10);
    const min = Math.min(...percents.filter(p => p > 0));
    const max = Math.max(...percents);
    const rolls = percents.join(' / ');

    // KO check
    let koText = '';
    const koCount = percents.filter(p => p >= 100).length;
    if (koCount === 16) koText = ' — OHKO';
    else if (koCount > 0) koText = ` — ${koCount}/16 OHKO`;

    $('#mainResultText').textContent = `${min}% – ${max}%${koText}`;
    $('#mainResultDesc').textContent = result.desc;
  }

  // ─── Import from Showdown Paste ─────────────────────────────────

  let importSide = 'left';
  let importParsedList = [];
  let importSelectedIdx = 0;

  function bindImportButtons() {
    $$('.calc-import-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        openImportModal(btn.dataset.side);
      });
    });

    // Modal tabs
    $$('.calc-modal-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        $$('.calc-modal-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const target = tab.dataset.tab;
        $('#tabText').classList.toggle('hidden', target !== 'text');
        $('#tabUrl').classList.toggle('hidden', target !== 'url');
      });
    });

    // Close modal
    $('#importModalClose').addEventListener('click', closeImportModal);
    $('#importCancel').addEventListener('click', closeImportModal);
    $('#importModal').addEventListener('click', (e) => {
      if (e.target === $('#importModal')) closeImportModal();
    });

    // Confirm import
    $('#importConfirm').onclick = () => importFromPaste();
  }

  function openImportModal(side) {
    importSide = side;
    importParsedList = [];
    importSelectedIdx = 0;
    $('#importPasteText').value = '';
    $('#importPasteUrl').value = '';
    $('#importError').classList.add('hidden');
    $('#importPokemonList').classList.add('hidden');
    $('#importPokemonItems').innerHTML = '';
    // Reset to text tab
    $$('.calc-modal-tab').forEach(t => t.classList.remove('active'));
    $$('.calc-modal-tab')[0].classList.add('active');
    $('#tabText').classList.remove('hidden');
    $('#tabUrl').classList.add('hidden');
    $('#importConfirm').onclick = () => importFromPaste();
    $('#importModal').classList.add('visible');
  }

  function closeImportModal() {
    $('#importModal').classList.remove('visible');
  }

  function showImportError(msg) {
    const el = $('#importError');
    el.textContent = msg;
    el.classList.remove('hidden');
  }

  async function importFromPaste() {
    const activeTab = $('.calc-modal-tab.active').dataset.tab;
    let text = '';

    if (activeTab === 'url') {
      const url = $('#importPasteUrl').value.trim();
      if (!url) { showImportError('Introduce una URL de pokepast.es'); return; }
      if (!ShowdownParser.isPokepasteUrl(url)) {
        showImportError('URL no válida. Debe ser de pokepast.es');
        return;
      }
      try {
        $('#importConfirm').disabled = true;
        $('#importConfirm').textContent = '...';
        text = await ShowdownParser.fetchPokepaste(url);
      } catch (e) {
        showImportError('Error al obtener el paste: ' + e.message);
        $('#importConfirm').disabled = false;
        $('#importConfirm').textContent = state.lang === 'es' ? 'Importar' : 'Import';
        return;
      }
      $('#importConfirm').disabled = false;
      $('#importConfirm').textContent = state.lang === 'es' ? 'Importar' : 'Import';
    } else {
      text = $('#importPasteText').value.trim();
    }

    if (!text) {
      showImportError('Pega un paste de Showdown');
      return;
    }

    try {
      importParsedList = ShowdownParser.parse(text);
    } catch (e) {
      showImportError('Error al parsear: ' + e.message);
      return;
    }

    if (!importParsedList || importParsedList.length === 0) {
      showImportError('No se pudo parsear ningún Pokémon');
      return;
    }

    // Handle mega normalization
    for (const p of importParsedList) {
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

    if (importParsedList.length === 1) {
      loadParsedPokemon(importSide, importParsedList[0]);
      closeImportModal();
    } else {
      // Show picker
      importSelectedIdx = 0;
      renderImportPicker();
    }
  }

  function renderImportPicker() {
    const list = $('#importPokemonItems');
    const err = $('#importError');
    err.classList.add('hidden');
    const picker = $('#importPokemonList');
    picker.classList.remove('hidden');

    list.innerHTML = importParsedList.map((p, i) => {
      const regData = RegulationMB.getPokemonData(p.species);
      const types = regData ? regData.types.join(' / ') : '';
      const moves = (p.moves || []).slice(0, 4).join(', ');
      return `
        <div class="calc-pokemon-pick ${i === importSelectedIdx ? 'selected' : ''}" data-idx="${i}">
          <span class="calc-pokemon-pick-name">${p.species}</span>
          <span class="calc-pokemon-pick-info">${types}${moves ? ' — ' + moves : ''}</span>
        </div>`;
    }).join('');

    list.querySelectorAll('.calc-pokemon-pick').forEach(el => {
      el.addEventListener('click', () => {
        importSelectedIdx = parseInt(el.dataset.idx);
        list.querySelectorAll('.calc-pokemon-pick').forEach(e => e.classList.remove('selected'));
        el.classList.add('selected');
      });
    });

    // Update confirm button
    $('#importConfirm').onclick = () => {
      loadParsedPokemon(importSide, importParsedList[importSelectedIdx]);
      closeImportModal();
      // Re-bind for next time
      $('#importConfirm').onclick = () => importFromPaste();
    };
  }

  function loadParsedPokemon(side, p) {
    const s = state[side];
    const cap = capitalize(side);

    // Set species and base data
    selectPokemon(side, p.species);

    // Nature
    if (p.nature && RegulationMB.NATURES[p.nature]) {
      s.nature = p.nature;
      $(`#nature${cap}`).value = p.nature;
    }

    // SP from EVs (Champions format)
    const sp = p.evs ? RegulationMB.convertEVsToSP(p.evs) : { hp:0, atk:0, def:0, spa:0, spd:0, spe:0 };
    s.sp = { ...sp };

    // Ability
    if (p.ability) {
      s.ability = p.ability;
      $(`#ability${cap}`).value = p.ability;
    }

    // Item
    if (p.item) {
      s.item = p.item;
      $(`#item${cap}`).value = p.item;
    }

    // Auto-detect mega from item
    const formSelect = $(`#megaForm${cap}`);
    if (p.item && RegulationMB.isMegaStoneLegal(s.species, p.item)) {
      const stones = RegulationMB.getMegaStones(s.species);
      const stoneIdx = stones.indexOf(p.item);
      if (RegulationMB.hasDualMega(s.species) && stoneIdx >= 0) {
        s.megaForm = stoneIdx === 0 ? 'X' : 'Y';
        formSelect.value = s.megaForm;
      }
      const megaData = RegulationMB.getMegaData(s.species, s.megaForm);
      if (megaData) {
        s.origBaseStats = { ...s.baseStats };
        s.origTypes = [...s.types];
        s.origAbility = s.ability;
        s.origWeight = s.weight;
        s.baseStats = { ...megaData.baseStats };
        s.types = [...megaData.types];
        s.ability = megaData.ability;
        s.mega = true;
        $(`#megaActive${cap}`).checked = true;
        loadSprite(side, s.species, s.megaForm || '');
        const megaName = s.species + '-mega' + (s.megaForm ? '-' + s.megaForm.toLowerCase() : '');
        ChampionsAPI.fetchWeight(megaName).then(w => { if (w) s.weight = w; });
      }
    }

    // Tera Type
    if (p.teraType) {
      s.teraType = p.teraType;
      $(`#tera${cap}`).value = p.teraType;
    }

    // Moves
    const moves = (p.moves || []).slice(0, 4);
    for (let i = 0; i < 4; i++) {
      s.moves[i] = moves[i] || '';
      s.moveData[i] = moves[i] ? CalcMoveData.getMoveData(moves[i]) : null;
    }

    // Sync all UI
    syncUIToState(side);
    recalcAll();
  }

  // ─── Helpers ───────────────────────────────────────────────────────

  function capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  // ─── Boot ──────────────────────────────────────────────────────────

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return { state, recalcAll };
})();
