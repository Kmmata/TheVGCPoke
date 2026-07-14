/**
 * Showdown / PokePaste text parser
 * Parses the standard Showdown export format into structured data.
 */
const ShowdownParser = (() => {

  /**
   * Parse a full Showdown export text into an array of Pokémon objects.
   * @param {string} text - Raw Showdown export text
   * @returns {Array<Object>} Array of parsed Pokémon
   */
  function parse(text) {
    if (!text || !text.trim()) return [];
    const blocks = splitIntoBlocks(text);
    return blocks.map(parseBlock).filter(Boolean);
  }

  /**
   * Split text into Pokémon blocks (separated by blank lines).
   */
  function splitIntoBlocks(text) {
    const lines = text.split(/\r?\n/);
    const blocks = [];
    let current = [];
    for (const line of lines) {
      if (line.trim() === '') {
        if (current.length > 0) {
          blocks.push(current);
          current = [];
        }
      } else {
        current.push(line);
      }
    }
    if (current.length > 0) blocks.push(current);
    return blocks;
  }

  /**
   * Parse a single Pokémon block (array of lines) into an object.
   */
  function parseBlock(lines) {
    if (!lines || lines.length === 0) return null;

    const pokemon = {
      species: '',
      nickname: '',
      item: '',
      gender: '',
      ability: '',
      nature: 'Serious',
      level: 50,
      shiny: false,
      happiness: 255,
      teraType: '',
      evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
      ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
      moves: [],
    };

    // First line: species, nickname, item, gender
    const firstLine = lines[0].trim();
    parseFirstLine(firstLine, pokemon);

    // Remaining lines
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('- ') || line.startsWith('-')) {
        const move = line.replace(/^-\s*/, '').trim();
        if (move) pokemon.moves.push(move);
      } else if (line.startsWith('EVs:')) {
        parseStats(line.substring(4).trim(), pokemon.evs);
      } else if (line.startsWith('IVs:')) {
        parseStats(line.substring(4).trim(), pokemon.ivs);
      } else if (line.startsWith('Ability:')) {
        pokemon.ability = line.substring(8).trim();
      } else if (line.startsWith('Level:')) {
        pokemon.level = parseInt(line.substring(6).trim()) || 50;
      } else if (line.startsWith('Shiny:')) {
        pokemon.shiny = line.substring(6).trim().toLowerCase() === 'yes';
      } else if (line.startsWith('Happiness:')) {
        pokemon.happiness = parseInt(line.substring(10).trim()) || 255;
      } else if (line.startsWith('Tera Type:')) {
        pokemon.teraType = line.substring(10).trim();
      } else if (line.match(/Nature$/i)) {
        pokemon.nature = line.replace(/\s*Nature\s*$/i, '').trim();
      }
    }

    const megaMatch = pokemon.species.match(/^(.+?)\s*[-–]\s*Mega(?:\s*(X|Y))?$/i);
    if (megaMatch) {
      pokemon.species = megaMatch[1].trim();
      pokemon._megaSuffix = megaMatch[2] ? megaMatch[2].toUpperCase() : '';
    }

    return pokemon;
  }

  /**
   * Parse the first line of a Pokémon block.
   * Formats:
   *   Pokemon @ Item
   *   Nickname ( Pokemon ) @ Item
   *   Pokemon @ Item (F)
   *   Pokemon @ Item (M)
   *   Nickname ( Pokemon ) @ Item (F)
   */
  function parseFirstLine(line, pokemon) {
    let gender = '';

    // Extract gender (M), (F), (N) from anywhere on the line
    const genderMatch = line.match(/\((F|M|N)\)/);
    if (genderMatch) {
      gender = genderMatch[1] === 'N' ? 'NA' : genderMatch[1] === 'F' ? 'Female' : 'Male';
      line = line.replace(/\s*\((F|M|N)\)\s*/, ' ').replace(/\s+/g, ' ').trim();
    }

    // Extract item after @
    let item = '';
    const atIdx = line.indexOf(' @ ');
    if (atIdx !== -1) {
      item = line.substring(atIdx + 3).trim();
      line = line.substring(0, atIdx).trim();
    }

    // Extract nickname and species: "Nickname ( Species )" or just "Species"
    let species = '';
    let nickname = '';
    const parenMatch = line.match(/^(.+?)\s*\(\s*(.+?)\s*\)\s*$/);
    if (parenMatch) {
      nickname = parenMatch[1].trim();
      species = parenMatch[2].trim();
    } else {
      species = line.trim();
    }

    pokemon.species = species;
    pokemon.nickname = nickname;
    pokemon.item = item;
    pokemon.gender = gender;
  }

  /**
   * Parse an EV/IV string like "252 Atk / 4 Def / 252 Spe"
   */
  function parseStats(str, target) {
    const parts = str.split('/');
    for (const part of parts) {
      const trimmed = part.trim();
      const match = trimmed.match(/^(\d+)\s+(.+)$/);
      if (match) {
        const value = parseInt(match[1]);
        const stat = match[2].trim().toLowerCase();
        const key = normalizeStat(stat);
        if (key) target[key] = value;
      }
    }
  }

  /**
   * Normalize stat names to shorthand keys.
   */
  function normalizeStat(stat) {
    const map = {
      'hp': 'hp', 'hit points': 'hp',
      'atk': 'atk', 'attack': 'atk',
      'def': 'def', 'defense': 'def',
      'spa': 'spa', 'sp. atk': 'spa', 'spatk': 'spa', 'special attack': 'spa',
      'spd': 'spd', 'sp. def': 'spd', 'spdef': 'spd', 'special defense': 'spd',
      'spe': 'spe', 'speed': 'spe',
    };
    return map[stat] || null;
  }

  /**
   * Check if a string is a pokepast.es URL.
   */
  function isPokepasteUrl(str) {
    return /^https?:\/\/pokepast\.es\/[a-f0-9]+/i.test(str.trim());
  }

  /**
   * Extract the raw text URL from a pokepaste URL.
   * https://pokepast.es/abcdef123456  ->  https://pokepast.es/abcdef123456/raw
   */
  function toPokepasteRawUrl(url) {
    url = url.trim();
    if (url.endsWith('/raw')) return url;
    return url + '/raw';
  }

  /**
   * Fetch a pokepaste and return the raw text.
   */
  async function fetchPokepaste(url) {
    const rawUrl = toPokepasteRawUrl(url);
    const response = await fetch(rawUrl);
    if (!response.ok) throw new Error(`Error fetching pokepaste: ${response.status}`);
    return await response.text();
  }

  return { parse, isPokepasteUrl, fetchPokepaste };
})();
