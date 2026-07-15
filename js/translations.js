/**
 * Pokémon name translations via PokéAPI.
 * Supports: species, moves, items, abilities, types, natures.
 * Caches results in memory. Natures use a local mapping.
 */
const PokeTranslations = (() => {
  'use strict';

  const cache = { species: {}, move: {}, item: {}, ability: {}, type: {} };

  const NATURES_ES = {
    'Hardy': 'Fuerte', 'Lonely': 'Huraña', 'Brave': 'Audaz', 'Adamant': 'Firme',
    'Naughty': 'Pícara', 'Bold': 'Osada', 'Docile': 'Dócil', 'Relaxed': 'Plácida',
    'Impish': 'Agitada', 'Lax': 'Floja', 'Timid': 'Miedosa', 'Hasty': 'Activa',
    'Serious': 'Seria', 'Jolly': 'Alegre', 'Naive': 'Ingenua', 'Modest': 'Modesta',
    'Mild': 'Afable', 'Quiet': 'Mansa', 'Bashful': 'Tímida', 'Rash': 'Alocada',
    'Calm': 'Serena', 'Gentle': 'Amable', 'Sassy': 'Grosera', 'Careful': 'Cauta',
    'Quirky': 'Rara',
  };

  const NATURES_EN = {};
  for (const [en, es] of Object.entries(NATURES_ES)) NATURES_EN[es] = en;

  const TYPE_ES = {
    'Normal': 'Normal', 'Fire': 'Fuego', 'Water': 'Agua', 'Electric': 'Eléctrico',
    'Grass': 'Planta', 'Ice': 'Hielo', 'Fighting': 'Lucha', 'Poison': 'Veneno',
    'Ground': 'Tierra', 'Flying': 'Volador', 'Psychic': 'Psíquico', 'Bug': 'Bicho',
    'Rock': 'Roca', 'Ghost': 'Fantasma', 'Dragon': 'Dragón', 'Dark': 'Siniestro',
    'Steel': 'Acero', 'Fairy': 'Hada', 'Stellar': 'Estelar',
  };

  const TYPE_EN = {};
  for (const [en, es] of Object.entries(TYPE_ES)) TYPE_EN[es] = en;

  function _langCode(lang) {
    return lang === 'es' ? 'es' : 'en';
  }

  async function _fetchTranslatedName(category, englishName, lang) {
    if (lang === 'en') return englishName;
    const lc = _langCode(lang);
    const key = englishName.toLowerCase().replace(/[^a-z0-9]/g, '-');

    if (cache[category][key]) {
      const entry = cache[category][key];
      if (entry[lc]) return entry[lc];
      if (entry._done) return englishName;
    }

    const slug = _normalizeForApi(category, englishName);
    try {
      const res = await fetch(`https://pokeapi.co/api/v2/${category}/${slug}`);
      if (!res.ok) { _markDone(category, key); return englishName; }
      const data = await res.json();
      const names = data.names || [];
      const entry = {};
      for (const n of names) {
        if (n.language && n.language.name) entry[n.language.name] = n.name;
      }
      entry._done = true;
      cache[category][key] = entry;
      return entry[lc] || englishName;
    } catch {
      _markDone(category, key);
      return englishName;
    }
  }

  function _markDone(category, key) {
    if (!cache[category][key]) cache[category][key] = {};
    cache[category][key]._done = true;
  }

  function _normalizeForApi(category, name) {
    let slug = name.toLowerCase().trim();
    slug = slug.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    slug = slug.replace(/[^a-z0-9\s-]/g, '');
    slug = slug.replace(/[\s]+/g, '-');
    slug = slug.replace(/-+/g, '-');
    slug = slug.replace(/^-|-$/g, '');
    return slug;
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

  function _cleanSpeciesName(name) {
    if (!name) return name;
    let clean = name.trim();
    clean = clean.replace(/\s*\(M\)\s*$/i, '');
    clean = clean.replace(/\s*\(F\)\s*$/i, '');
    clean = clean.replace(/\s*\(N\)\s*$/i, '');
    clean = clean.replace(/\s+M\s*$/, '');
    clean = clean.replace(/\s+F\s*$/, '');
    return clean.trim();
  }

  function translateNature(nature, lang) {
    if (lang === 'en') return NATURES_EN[nature] || nature;
    return NATURES_ES[nature] || nature;
  }

  function translateType(type, lang) {
    if (!type) return type;
    if (lang === 'en') return TYPE_EN[type] || type;
    return TYPE_ES[type] || type;
  }

  async function translateSpecies(name, lang) {
    if (!name || lang === 'en') return name;
    return _fetchTranslatedName('species', name, lang);
  }

  async function translateMove(name, lang) {
    if (!name || lang === 'en') return name;
    return _fetchTranslatedName('move', name, lang);
  }

  async function translateItem(name, lang) {
    if (!name || lang === 'en') return name;
    return _fetchTranslatedName('item', name, lang);
  }

  async function translateAbility(name, lang) {
    if (!name || lang === 'en') return name;
    return _fetchTranslatedName('ability', name, lang);
  }

  async function translatePokemon(p, lang) {
    if (!p || !p.species) return p;
    const translated = Object.assign({}, p);

    translated.species = await translateSpecies(p.species, lang);
    if (p.item) translated.item = await translateItem(p.item, lang);
    if (p.ability) translated.ability = await translateAbility(p.ability, lang);
    translated.nature = translateNature(p.nature, lang);
    translated.teraType = translateType(p.teraType, lang);
    translated.moves = await Promise.all(p.moves.map(m => translateMove(m, lang)));

    translated._original = {
      species: p.species, item: p.item, ability: p.ability,
      nature: p.nature, teraType: p.teraType, moves: p.moves,
    };

    return translated;
  }

  async function translateTeam(team, lang) {
    if (lang === 'en') return team;
    return Promise.all(team.map(p => p ? translatePokemon(p, lang) : null));
  }

  const spriteCache = {};
  const typesCache = {};

  async function fetchPokemonSprite(species, gender) {
    if (!species) return null;
    const clean = _cleanSpeciesName(species);
    const key = _speciesKey(clean);

    if (spriteCache[key] !== undefined) return spriteCache[key];

    const rawSlug = _normalizeForApi('species', clean);
    const slug = _resolvePokeapiSlug(rawSlug);
    let data = null;

    try {
      const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${slug}`);
      if (res.ok) data = await res.json();
    } catch {}

    if (!data && gender) {
      const genderSlug = `${slug}-${gender}`;
      try {
        const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${genderSlug}`);
        if (res.ok) data = await res.json();
      } catch {}
    }

    if (!data) {
      spriteCache[key] = null;
      typesCache[key] = null;
      return null;
    }

    const url = data.sprites?.other?.['official-artwork']?.front_default
      || data.sprites?.front_default
      || null;
    spriteCache[key] = url;
    if (data.types) {
      typesCache[key] = data.types
        .sort((a, b) => a.slot - b.slot)
        .map((t) => t.type.name.charAt(0).toUpperCase() + t.type.name.slice(1));
    }
    return url;
  }

  async function fetchPokemonTypes(species, gender) {
    if (!species) return [];
    const clean = _cleanSpeciesName(species);
    const key = _speciesKey(clean);

    if (typesCache[key] !== undefined) return typesCache[key];

    await fetchPokemonSprite(species, gender);
    return typesCache[key] || [];
  }

  function _speciesKey(name) {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '-');
  }

  function _extractGender(name) {
    if (/\(M\)/i.test(name) || /\s+M\s*$/.test(name)) return 'male';
    if (/\(F\)/i.test(name) || /\s+F\s*$/.test(name)) return 'female';
    return null;
  }

  const TYPE_COLORS = {
    'Normal': '#A8A878', 'Fire': '#F08030', 'Water': '#6890F0',
    'Electric': '#F8D030', 'Grass': '#78C850', 'Ice': '#98D8D8',
    'Fighting': '#C03028', 'Poison': '#A040A0', 'Ground': '#E0C068',
    'Flying': '#A890F0', 'Psychic': '#F85888', 'Bug': '#A8B820',
    'Rock': '#B8A038', 'Ghost': '#705898', 'Dragon': '#7038F8',
    'Dark': '#705848', 'Steel': '#B8B8D0', 'Fairy': '#EE99AC',
    'Stellar': '#4A90D9',
  };

  const moveTypeCache = {};

  async function fetchMoveType(moveName) {
    if (!moveName) return null;
    const slug = _normalizeForApi('move', moveName);
    const key = slug;
    if (moveTypeCache[key] !== undefined) return moveTypeCache[key];
    try {
      const res = await fetch(`https://pokeapi.co/api/v2/move/${slug}`);
      if (!res.ok) { moveTypeCache[key] = null; return null; }
      const data = await res.json();
      const typeName = data.type?.name;
      if (!typeName) { moveTypeCache[key] = null; return null; }
      const realName = typeName.charAt(0).toUpperCase() + typeName.slice(1);
      moveTypeCache[key] = realName;
      return realName;
    } catch {
      moveTypeCache[key] = null;
      return null;
    }
  }

  function getTypeColor(typeName) {
    return TYPE_COLORS[typeName] || '#68A090';
  }

  const moveDescCache = {};

  async function fetchMoveDescription(moveName, lang) {
    if (!moveName) return null;
    const slug = _normalizeForApi('move', moveName);
    const key = `${slug}|${lang || 'es'}`;
    if (moveDescCache[key] !== undefined) return moveDescCache[key];
    try {
      const res = await fetch(`https://pokeapi.co/api/v2/move/${slug}`);
      if (!res.ok) { moveDescCache[key] = null; return null; }
      const data = await res.json();
      const langCode = lang === 'en' ? 'en' : 'es';

      const entries = data.effect_entries || [];
      const entry = entries.find(e => e.language?.name === langCode)
        || entries.find(e => e.language?.name === 'en')
        || entries[0];
      let desc = entry?.short_effect || entry?.effect || null;

      if (!desc) {
        const flavor = data.flavor_text_entries || [];
        const fav = flavor.find(e => e.language?.name === langCode)
          || flavor.find(e => e.language?.name === 'en')
          || flavor[0];
        desc = fav?.flavor_text?.replace(/[\n\f]/g, ' ') || null;
      }

      moveDescCache[key] = desc;
      return desc;
    } catch {
      moveDescCache[key] = null;
      return null;
    }
  }

  return {
    translateSpecies, translateMove, translateItem, translateAbility,
    translateNature, translateType, translatePokemon, translateTeam,
    fetchPokemonSprite, fetchPokemonTypes, fetchMoveType, fetchMoveDescription,
    getTypeColor,
  };
})();
