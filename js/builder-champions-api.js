/**
 * Champions API layer — fetches Pokémon data from PokéAPI.
 * Provides: sprites, abilities, learnsets, types, base stats.
 * Caches everything in memory.
 */
const ChampionsAPI = (() => {
  'use strict';

  const BASE_URL = 'https://pokeapi.co/api/v2';
  const _cache = {
    species: {},
    ability: {},
    move: {},
    sprite: {},
  };

  function _slug(name) {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
  }

  async function _fetchJSON(url) {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      return await res.json();
    } catch { return null; }
  }

  async function fetchPokemonSpecies(speciesName) {
    const key = _slug(speciesName);
    if (_cache.species[key]) return _cache.species[key];

    const data = await _fetchJSON(`${BASE_URL}/pokemon/${key}`);
    if (!data) return null;

    const result = {
      id: data.id,
      name: data.name,
      types: data.types.map(t => t.type.name.charAt(0).toUpperCase() + t.type.name.slice(1)),
      stats: {},
      abilities: data.abilities.map(a => ({
        name: a.ability.name,
        isHidden: a.is_hidden,
      })),
      moves: data.moves.map(m => m.move.name),
      sprites: {
        front: data.sprites.front_default,
        official: data.sprites.other?.['official-artwork']?.front_default || data.sprites.front_default,
      },
      weight: data.weight,
      height: data.height,
    };

    for (const s of data.stats) {
      const statMap = {
        'hp': 'hp', 'attack': 'atk', 'defense': 'def',
        'special-attack': 'spa', 'special-defense': 'spd', 'speed': 'spe',
      };
      const k = statMap[s.stat.name];
      if (k) result.stats[k] = s.base_stat;
    }

    _cache.species[key] = result;
    return result;
  }

  async function fetchSprite(speciesName) {
    const key = _slug(speciesName);
    if (_cache.sprite[key]) return _cache.sprite[key];

    const data = await _fetchJSON(`${BASE_URL}/pokemon/${key}`);
    if (!data) return null;

    const sprite = data.sprites.other?.['official-artwork']?.front_default
      || data.sprites.front_default
      || null;

    _cache.sprite[key] = sprite;
    return sprite;
  }

  async function fetchAbility(abilityName) {
    const key = _slug(abilityName);
    if (_cache.ability[key]) return _cache.ability[key];

    const data = await _fetchJSON(`${BASE_URL}/ability/${key}`);
    if (!data) return null;

    const result = {
      name: data.name,
      effect: '',
      shortEffect: '',
    };

    const entry = data.effect_entries?.find(e => e.language.name === 'en');
    if (entry) {
      result.effect = entry.effect;
      result.shortEffect = entry.short_effect;
    } else {
      const flav = data.flavor_text_entries?.find(e => e.language.name === 'en');
      if (flav) result.shortEffect = flav.flavor_text;
    }

    _cache.ability[key] = result;
    return result;
  }

  async function fetchMove(moveName) {
    const key = _slug(moveName);
    if (_cache.move[key]) return _cache.move[key];

    const data = await _fetchJSON(`${BASE_URL}/move/${key}`);
    if (!data) return null;

    const result = {
      name: data.name,
      type: data.type.name,
      power: data.power,
      accuracy: data.accuracy,
      pp: data.pp,
      category: data.damage_class.name,
      effect: '',
      shortEffect: '',
    };

    const entry = data.effect_entries?.find(e => e.language.name === 'en');
    if (entry) {
      result.effect = entry.effect;
      result.shortEffect = entry.short_effect;
    }

    _cache.move[key] = result;
    return result;
  }

  function filterLearnsetByLegalMoves(apiMoves, legalMoves) {
    const legalSet = new Set(legalMoves.map(m => m.toLowerCase().replace(/[^a-z0-9]/g, '-')));
    return apiMoves.filter(m => legalSet.has(m.toLowerCase().replace(/[^a-z0-9]/g, '-')));
  }

  async function fetchPokemonFull(speciesName) {
    const species = await fetchPokemonSpecies(speciesName);
    if (!species) return null;

    const legalLearnset = filterLearnsetByLegalMoves(species.moves, RegulationMB.LEGAL_MOVES);

    return {
      ...species,
      legalMoves: legalLearnset,
      legalAbilities: species.abilities.filter(a =>
        RegulationMB.LEGAL_POKEMON.some(lp => {
          const lpNorm = lp.name.toLowerCase().replace(/[^a-z0-9]/g, '');
          const spNorm = species.name.toLowerCase().replace(/[^a-z0-9]/g, '');
          return lpNorm === spNorm && lp.abilities.some(la =>
            la.toLowerCase().replace(/[^a-z0-9]/g, '') === a.name.toLowerCase().replace(/[^a-z0-9]/g, '')
          );
        })
      ),
    };
  }

  function prefetchPopular(pokemonNames) {
    return Promise.allSettled(
      pokemonNames.map(name => fetchPokemonSpecies(name))
    );
  }

  return {
    fetchPokemonSpecies,
    fetchSprite,
    fetchAbility,
    fetchMove,
    fetchPokemonFull,
    filterLearnsetByLegalMoves,
    prefetchPopular,
  };
})();
