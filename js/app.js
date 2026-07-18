/**
 * Main application logic: UI, language switching, localStorage, and wiring.
 */
(function () {
  'use strict';

  let currentLang = localStorage.getItem('tsLang') || 'es';
  let team = [null, null, null, null, null, null];
  let translatedTeam = [null, null, null, null, null, null];

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const els = {
    langToggle: $('#langToggle'),
    themeToggle: $('#themeToggle'),
    pokepasteUrl: $('#pokepasteUrl'),
    fetchBtn: $('#fetchBtn'),
    showdownText: $('#showdownText'),
    parseBtn: $('#parseBtn'),
    importError: $('#importError'),
    teamGrid: $('#teamGrid'),
    btnOpenSheet: $('#btnOpenSheet'),
    btnStaffSheet: $('#btnStaffSheet'),
    btnBothSheets: $('#btnBothSheets'),
    playerName: $('#playerName'),
    trainerName: $('#trainerName'),
    playerId: $('#playerId'),
    dobMm: $('#dobMm'),
    dobDd: $('#dobDd'),
    dobYyyy: $('#dobYyyy'),
    teamNumber: $('#teamNumber'),
    switchProfile: $('#switchProfile'),
    supportId: $('#supportId'),
    modal: $('#pokemonModal'),
    modalClose: $('#modalClose'),
    modalSprite: $('#modalSprite'),
    modalName: $('#modalName'),
    modalTypes: $('#modalTypes'),
    modalItem: $('#modalItem'),
    modalAbility: $('#modalAbility'),
    modalNature: $('#modalNature'),
    modalLevel: $('#modalLevel'),
    modalGender: $('#modalGender'),
    modalGenderRow: $('#modalGenderRow'),
    modalShiny: $('#modalShiny'),
    modalShinyRow: $('#modalShinyRow'),
    modalTeraType: $('#modalTeraType'),
    modalStats: $('#modalStats'),
    modalMoves: $('#modalMoves'),
  };

  /* ── Drawer Toggle ── */
  const menuToggle = $('#menuToggle');
  const drawer = $('#drawer');
  const drawerOverlay = $('#drawerOverlay');
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

  function applyLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('tsLang', lang);
    document.documentElement.setAttribute('data-lang', lang);
    els.langToggle.querySelector('.lang-flag').textContent = lang.toUpperCase();
    $$('[data-es][data-en]').forEach((el) => {
      const text = el.getAttribute(`data-${lang}`);
      if (text) el.textContent = text;
    });
    translateAndRender();
  }

  async function translateAndRender() {
    if (currentLang === 'en' || !team.some(Boolean)) {
      translatedTeam = team.slice();
      renderTeamGrid();
      return;
    }
    translatedTeam = await PokeTranslations.translateTeam(team, currentLang);
    renderTeamGrid();
  }

  els.langToggle.addEventListener('click', () => {
    applyLanguage(currentLang === 'es' ? 'en' : 'es');
  });

  /* ── Theme Toggle ── */
  function applyTheme(dark) {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    els.themeToggle.querySelector('.theme-icon').textContent = dark ? '☀' : '☾';
    localStorage.setItem('tsTheme', dark ? 'dark' : 'light');
  }

  const savedTheme = localStorage.getItem('tsTheme');
  const prefersDark = savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
  applyTheme(prefersDark);

  els.themeToggle.addEventListener('click', () => {
    applyTheme(document.documentElement.getAttribute('data-theme') !== 'dark');
  });

  $$('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      $$('.tab-btn').forEach((b) => b.classList.remove('active'));
      $$('.tab-content').forEach((c) => c.classList.remove('active'));
      btn.classList.add('active');
      $(`#tab${capitalize(btn.dataset.tab)}`).classList.add('active');
    });
  });

  function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  els.fetchBtn.addEventListener('click', async () => {
    const url = els.pokepasteUrl.value.trim();
    if (!url) return showError(currentLang === 'es' ? 'Introduce una URL.' : 'Enter a URL.');
    if (!ShowdownParser.isPokepasteUrl(url)) {
      return showError(currentLang === 'es'
        ? 'URL no válida. Debe ser de pokepast.es'
        : 'Invalid URL. Must be from pokepast.es');
    }
    hideError();
    els.fetchBtn.classList.add('loading');
    els.fetchBtn.disabled = true;
    try {
      const text = await ShowdownParser.fetchPokepaste(url);
      els.pokepasteUrl.value = '';
      importTeam(text);
    } catch (err) {
      showError(err.message);
    } finally {
      els.fetchBtn.classList.remove('loading');
      els.fetchBtn.disabled = false;
    }
  });

  els.parseBtn.addEventListener('click', () => {
    const text = els.showdownText.value.trim();
    if (!text) return showError(currentLang === 'es' ? 'Pega el texto del equipo.' : 'Paste the team text.');
    hideError();
    els.showdownText.value = '';
    importTeam(text);
  });

  function importTeam(text) {
    text = text
      .replace(/^\uFEFF/, '')
      .replace(/[\u200B\u200C\u200D\u2060\u00A0]/g, ' ')
      .replace(/\r\n?/g, '\n')
      .replace(/[ \t]+$/gm, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    const parsed = ShowdownParser.parse(text);
    if (parsed.length === 0) {
      return showError(currentLang === 'es'
        ? 'No se pudo parsear ningún Pokémon. Revisa el formato.'
        : 'No Pokémon could be parsed. Check the format.');
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
    team = [];
    for (let i = 0; i < 6; i++) {
      team.push(parsed[i] || null);
    }
    translatedTeam = team.slice();
    renderTeamGrid();
    updatePdfButtons();
    saveDraft();
    translateAndRender();
  }

  function renderTeamGrid() {
    els.teamGrid.innerHTML = '';
    const displayTeam = currentLang === 'en' ? team : translatedTeam;
    for (let i = 0; i < 6; i++) {
      const card = document.createElement('div');
      card.className = 'pokemon-card' + (team[i] ? ' filled' : '');
      if (team[i]) {
        const p = displayTeam[i] || team[i];
        const name = p.nickname ? `${p.nickname} (${p.species})` : p.species;
        const genderAttr = team[i].gender === 'Male' ? 'male' : team[i].gender === 'Female' ? 'female' : '';
        card.innerHTML = `
          <div class="poke-header">
            <img class="poke-sprite" data-species="${team[i].species}" alt="${team[i].species}" />
            <div class="poke-name">${name}</div>
          </div>
          <div class="poke-details">
            ${p.item ? `${p.item} | ` : ''}${p.nature} | Lv${p.level}<br/>
            ${p.ability ? p.ability : ''}
          </div>
          <div class="poke-moves">
            ${p.moves.map((m) => `<span>${m}</span>`).join('')}
          </div>
        `;
        const idx = i;
        card.addEventListener('click', () => openPokemonModal(idx));
      } else {
        card.textContent = `Pokémon ${i + 1}`;
      }
      els.teamGrid.appendChild(card);
    }
    _loadSprites();
  }

  async function _loadSprites() {
    const imgs = els.teamGrid.querySelectorAll('.poke-sprite[data-species]');
    for (const img of imgs) {
      const species = img.dataset.species;
      const idx = [...els.teamGrid.children].indexOf(img.closest('.pokemon-card'));
      const gender = idx >= 0 && team[idx]?.gender === 'Male' ? 'male' : idx >= 0 && team[idx]?.gender === 'Female' ? 'female' : null;
      const url = await PokeTranslations.fetchPokemonSprite(species, gender);
      if (url) img.src = url;
      else img.style.display = 'none';
    }
  }

  function updatePdfButtons() {
    const hasTeam = team.some(Boolean);
    els.btnOpenSheet.disabled = !hasTeam;
    els.btnStaffSheet.disabled = !hasTeam;
    els.btnBothSheets.disabled = !hasTeam;
  }

  /* ── Pokemon Detail Modal ── */
  const STAT_KEYS = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];
  const STAT_LABELS = { hp: 'HP', atk: 'Atk', def: 'Def', spa: 'Sp.Atk', spd: 'Sp.Def', spe: 'Speed' };
  const STAT_MAX = 255;

  function openPokemonModal(index) {
    const original = team[index];
    if (!original) return;
    const display = (currentLang === 'en' ? team : translatedTeam)[index] || original;
    const name = display.nickname ? `${display.nickname} (${display.species})` : display.species;

    els.modalName.textContent = name;
    els.modalItem.textContent = display.item ? `@ ${display.item}` : '';
    els.modalAbility.textContent = display.ability || '—';
    els.modalNature.textContent = display.nature || '—';
    els.modalLevel.textContent = display.level || 50;

    if (display.gender && display.gender !== 'NA') {
      els.modalGenderRow.classList.remove('hidden');
      els.modalGender.textContent = display.gender === 'Male' ? '♂' : '♀';
    } else {
      els.modalGenderRow.classList.add('hidden');
    }

    if (display.shiny) {
      els.modalShinyRow.classList.remove('hidden');
      els.modalShiny.textContent = '★ Yes';
    } else {
      els.modalShinyRow.classList.add('hidden');
    }

    els.modalTeraType.textContent = display.teraType || '—';

    const apiName = original._original?.species || original.species;
    const gender = original.gender === 'Male' ? 'male' : original.gender === 'Female' ? 'female' : null;

    PokeTranslations.fetchPokemonSprite(apiName, gender).then((url) => {
      if (url) {
        els.modalSprite.src = url;
        els.modalSprite.alt = p.species;
        els.modalSprite.alt = display.species;
        els.modalSprite.style.display = '';
      } else {
        els.modalSprite.style.display = 'none';
      }
    });

    els.modalTypes.innerHTML = '';
    PokeTranslations.fetchPokemonTypes(apiName, gender).then((types) => {
      types.forEach((t) => {
        const badge = document.createElement('span');
        badge.className = 'modal-type-badge';
        badge.textContent = PokeTranslations.translateType(t, currentLang);
        badge.style.backgroundColor = PokeTranslations.getTypeColor(t);
        els.modalTypes.appendChild(badge);
      });
    });

    els.modalStats.innerHTML = '<div style="text-align:center;color:var(--text-muted);padding:8px;">Cargando stats...</div>';
    els.modalMoves.innerHTML = '';

    display.moves.forEach((m, mi) => {
      const tag = document.createElement('span');
      tag.className = 'modal-move-tag';
      tag.textContent = m;

      const tooltip = document.createElement('span');
      tooltip.className = 'move-tooltip';
      tooltip.textContent = '...';
      tag.appendChild(tooltip);

      const apiMove = (display._original?.moves?.[mi]) || m;
      PokeTranslations.fetchMoveType(apiMove).then((typeName) => {
        if (typeName) {
          tag.style.backgroundColor = PokeTranslations.getTypeColor(typeName);
        }
      });
      PokeTranslations.fetchMoveDescription(apiMove, currentLang).then((desc) => {
        if (desc) tooltip.textContent = desc;
        else tooltip.textContent = m;
      });

      els.modalMoves.appendChild(tag);

      tag.addEventListener('mouseenter', () => {
        els.modal.querySelector('.modal-content').style.overflow = 'visible';
      });
      tag.addEventListener('mouseleave', () => {
        els.modal.querySelector('.modal-content').style.overflow = '';
      });
    });

    els.modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    _loadModalStats(original, display);
  }

  async function _loadModalStats(original, display) {
    const apiName = original._original?.species || original.species;
    try {
      const base = await TeamSheetPDF.fetchBaseStats(apiName);
      if (!base) {
        els.modalStats.innerHTML = '<div style="text-align:center;color:var(--text-muted);padding:8px;">No se pudieron cargar las stats</div>';
        return;
      }
      const statVals = TeamSheetPDF.getStatValues(original, { [original.species]: base });
      const nature = original._original?.nature || original.nature;
      const evs = original.evs || {};

      const statOrder = [
        { key: 'hp', baseVal: base.hp },
        { key: 'atk', baseVal: base.attack },
        { key: 'def', baseVal: base.defense },
        { key: 'spa', baseVal: base['special-attack'] },
        { key: 'spd', baseVal: base['special-defense'] },
        { key: 'spe', baseVal: base.speed },
      ];

      els.modalStats.innerHTML = '';
      statOrder.forEach((s, i) => {
        const val = statVals[i];
        const pct = Math.min((val / STAT_MAX) * 100, 100);
        const nm = TeamSheetPDF.NATURE_MAP[nature];
        let natureClass = '';
        let natureIcon = '';
        if (nm) {
          if (nm.plus === s.key) { natureClass = 'up'; natureIcon = '▲'; }
          else if (nm.minus === s.key) { natureClass = 'down'; natureIcon = '▼'; }
        }

        const row = document.createElement('div');
        row.className = 'modal-stat-row';
        row.innerHTML = `
          <span class="modal-stat-base">${s.baseVal}</span>
          <span class="modal-stat-label">${STAT_LABELS[s.key]}</span>
          <span class="modal-stat-nature ${natureClass}">${natureIcon}</span>
          <div class="modal-stat-bar-wrap">
            <div class="modal-stat-bar ${s.key}" style="width:${pct}%"></div>
          </div>
          <span class="modal-stat-value">${val}</span>
          <span class="modal-stat-sp">SP ${evs[s.key] ?? 0}</span>
        `;
        els.modalStats.appendChild(row);
      });
    } catch (_) {
      els.modalStats.innerHTML = '<div style="text-align:center;color:var(--text-muted);padding:8px;">No se pudieron cargar las stats</div>';
    }
  }

  function closePokemonModal() {
    els.modal.classList.add('hidden');
    document.body.style.overflow = '';
  }

  els.modalClose.addEventListener('click', closePokemonModal);
  els.modal.addEventListener('click', (e) => {
    if (e.target === els.modal) closePokemonModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !els.modal.classList.contains('hidden')) closePokemonModal();
  });

  function getPlayerData() {
    const mm = els.dobMm.value.trim();
    const dd = els.dobDd.value.trim();
    const yyyy = els.dobYyyy.value.trim();
    const dob = (mm && dd && yyyy) ? `${mm}/${dd}/${yyyy}` : '';
    const ageDivision = document.querySelector('input[name="ageDivision"]:checked')?.value || 'Masters';
    return {
      playerName: els.playerName.value.trim(),
      trainerName: els.trainerName.value.trim(),
      playerId: els.playerId.value.trim(),
      dob,
      teamNumber: els.teamNumber.value.trim(),
      switchProfile: els.switchProfile.value.trim(),
      supportId: els.supportId.value.trim(),
      ageDivision,
    };
  }

  async function handlePdf(mode) {
    const pd = getPlayerData();
    const pdfTeam = currentLang === 'en' ? team : translatedTeam;
    const filledTeam = pdfTeam.map((p) => p || {
      species: '', nickname: '', item: '', gender: '', ability: '',
      nature: 'Serious', level: 50, shiny: false, happiness: 255,
      teraType: '', evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
      ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 }, moves: [],
    });
    try {
      const bytes = await TeamSheetPDF.generate(pd, filledTeam, mode);
      const suffix = mode === 'both' ? 'both' : mode;
      const filename = `team-sheet-${suffix}.pdf`;
      TeamSheetPDF.downloadPdf(bytes, filename);
    } catch (err) {
      showError('PDF error: ' + err.message);
    }
  }

  els.btnOpenSheet.addEventListener('click', () => handlePdf('open'));
  els.btnStaffSheet.addEventListener('click', () => handlePdf('staff'));
  els.btnBothSheets.addEventListener('click', () => handlePdf('both'));

  function showError(msg) {
    els.importError.textContent = msg;
    els.importError.classList.remove('hidden');
  }
  function hideError() {
    els.importError.classList.add('hidden');
  }

  function saveDraft() {
    const pd = getPlayerData();
    localStorage.setItem('tsDraft', JSON.stringify({ player: pd, team }));
  }

  function loadDraft() {
    try {
      const raw = localStorage.getItem('tsDraft');
      if (!raw) return;
      const draft = JSON.parse(raw);
      if (draft.player) {
        els.playerName.value = draft.player.playerName || '';
        els.trainerName.value = draft.player.trainerName || '';
        els.playerId.value = draft.player.playerId || '';
        if (draft.player.dob) {
          const parts = draft.player.dob.split('/');
          els.dobMm.value = parts[0] || '';
          els.dobDd.value = parts[1] || '';
          els.dobYyyy.value = parts[2] || '';
        }
        els.teamNumber.value = draft.player.teamNumber || '';
        els.switchProfile.value = draft.player.switchProfile || '';
        els.supportId.value = draft.player.supportId || '';
        if (draft.player.ageDivision) {
          const radio = document.querySelector(`input[name="ageDivision"][value="${draft.player.ageDivision}"]`);
          if (radio) { radio.checked = true; radio.closest('.chip-btn')?.classList.add('active'); }
        }
      }
      if (draft.team && Array.isArray(draft.team)) {
        team = draft.team;
        translatedTeam = team.slice();
        renderTeamGrid();
        updatePdfButtons();
        translateAndRender();
      }
    } catch (e) { /* ignore corrupted draft */ }
  }

  document.querySelectorAll('.player-section input, .player-section select').forEach((el) => {
    el.addEventListener('change', saveDraft);
    el.addEventListener('input', saveDraft);
  });

  function setupAgeDivision() {
    document.querySelectorAll('[name="ageDivision"]').forEach(r => {
      r.addEventListener('change', () => {
        document.querySelectorAll('[name="ageDivision"]').forEach(l => {
          l.closest('.chip-btn')?.classList.toggle('active', l.checked);
        });
      });
    });
  }

  applyLanguage(currentLang);
  loadDraft();
  setupAgeDivision();
  renderTeamGrid();
  updatePdfButtons();

  /* ── Auth Integration ── */
  PokeAuth.renderAuthButton('authContainer');

  const $loadProfileBtn = document.getElementById('loadProfileBtn');
  if (PokeAuth.isLoggedIn()) {
    const profile = PokeAuth.getProfile();
    const hasProfileData = profile && (profile.playerName || profile.trainerName || profile.playerId);
    if (hasProfileData && !$loadProfileBtn.classList.contains('always-show')) {
      $loadProfileBtn.classList.remove('hidden');
    }
  }

  function loadProfileData() {
    const profile = PokeAuth.getProfile();
    if (!profile) return;
    if (profile.playerName) els.playerName.value = profile.playerName;
    if (profile.trainerName) els.trainerName.value = profile.trainerName;
    if (profile.playerId) els.playerId.value = profile.playerId;
    if (profile.dobMm) els.dobMm.value = profile.dobMm;
    if (profile.dobDd) els.dobDd.value = profile.dobDd;
    if (profile.dobYyyy) els.dobYyyy.value = profile.dobYyyy;
    if (profile.teamNumber) els.teamNumber.value = profile.teamNumber;
    if (profile.switchProfile) els.switchProfile.value = profile.switchProfile;
    if (profile.supportId) els.supportId.value = profile.supportId;
    if (profile.ageDivision) {
      const radio = document.querySelector(`input[name="ageDivision"][value="${profile.ageDivision}"]`);
      if (radio) {
        radio.checked = true;
        document.querySelectorAll('[name="ageDivision"]').forEach(l => {
          l.closest('.chip-btn')?.classList.toggle('active', l.checked);
        });
      }
    }
    saveDraft();
  }

  if ($loadProfileBtn) {
    $loadProfileBtn.addEventListener('click', loadProfileData);
  }

  const $clearPlayerDataBtn = document.getElementById('clearPlayerDataBtn');
  if ($clearPlayerDataBtn) {
    $clearPlayerDataBtn.addEventListener('click', () => {
      els.playerName.value = '';
      els.trainerName.value = '';
      els.playerId.value = '';
      els.dobMm.value = '';
      els.dobDd.value = '';
      els.dobYyyy.value = '';
      els.teamNumber.value = '';
      els.switchProfile.value = '';
      els.supportId.value = '';
      const defaultRadio = document.querySelector('input[name="ageDivision"][value="Masters"]');
      if (defaultRadio) {
        defaultRadio.checked = true;
        document.querySelectorAll('[name="ageDivision"]').forEach(l => {
          l.closest('.chip-btn')?.classList.add('active');
        });
      }
      saveDraft();
    });
  }

  if (PokeAuth.isLoggedIn()) {
    const profile = PokeAuth.getProfile();
    const hasAnyData = profile && Object.values(profile).some(v => v && v !== 'Masters');
    if (hasAnyData) {
      const pd = getPlayerData();
      const draftHasData = pd.playerName || pd.trainerName || pd.playerId;
      if (!draftHasData) {
        loadProfileData();
      }
    }
  }
})();
