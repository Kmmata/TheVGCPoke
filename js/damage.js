/**
 * Pokémon Champions Damage Calculator — Full damage formula.
 * Implements the complete Gen 10 / Champions damage calculation.
 * Matches the NCP VGC Damage Calculator formula exactly.
 */
const DamageCalc = (() => {
  'use strict';

  const LEVEL = 50;
  const MIN_DMG = 1;
  const MAX_DMG = 65535;

  // ─── Utility ────────────────────────────────────────────────────────

  function pokeRound(num) {
    return (num % 1 > 0.5) ? Math.ceil(num) : Math.floor(num);
  }

  function chainMods(mods) {
    let M = 0x1000;
    for (let i = 0; i < mods.length; i++) {
      if (mods[i] !== 0x1000) {
        M = Math.round((M * mods[i]) / 0x1000);
      }
    }
    return M;
  }

  // ─── Stat Calculation (Champions) ───────────────────────────────────

  function calcHP(base, sp) {
    return Math.floor((base * 2 + 31) * LEVEL / 100) + 50 + 10 + (sp || 0);
  }

  function calcStat(base, sp, natureMult) {
    const n = natureMult || 1;
    return Math.floor((Math.floor((base * 2 + 31) * LEVEL / 100) + 5 + (sp || 0)) * n);
  }

  function getNatureMultForStat(nature, statKey) {
    const data = RegulationMB.NATURES[nature];
    if (!data || !data.plus || !data.minus) return 1;
    if (data.plus === statKey) return 1.1;
    if (data.minus === statKey) return 0.9;
    return 1;
  }

  function getModifiedStat(stat, mod) {
    if (mod > 0) return Math.floor(stat * (2 + mod) / 2);
    if (mod < 0) return Math.floor(stat * 2 / (2 - mod));
    return stat;
  }

  function getStatWithBoosts(base, sp, nature, statKey, boostStage) {
    const nm = getNatureMultForStat(nature, statKey);
    let stat = calcStat(base, sp, nm);
    if (boostStage !== undefined && boostStage !== 0) {
      stat = getModifiedStat(stat, boostStage);
    }
    return Math.max(1, stat);
  }

  function getHPWithBoosts(base, sp) {
    return Math.max(1, calcHP(base, sp));
  }

  // ─── Type effectiveness ─────────────────────────────────────────────

  function getTypeEffectiveness(attackType, defenderTypes, defenderAbility, defenderTera, isTeraActive) {
    let types = [...defenderTypes];

    if (isTeraActive && defenderTera) {
      types = [defenderTera];
    }

    let eff = 1;
    for (const t of types) {
      eff *= TypeChart.getSingleEffectiveness(attackType, t);
    }

    if (defenderAbility === 'Levitate' && attackType === 'Ground') return 0;

    return eff;
  }

  // ─── Base power modifiers ───────────────────────────────────────────

  function calcBPMods(moveData, attacker, defender, field, computedBP) {
    const mods = [];
    const atkAb = attacker.ability;
    const atkItem = attacker.item;
    const moveType = moveData.type;
    const weather = field.weather || '';

    // Terrain offensive boosts
    if (field.terrain === 'Electric' && moveType === 'Electric' && !attacker.types.includes('Ground')) {
      mods.push(0x14CD);
    }
    if (field.terrain === 'Grassy' && moveType === 'Grass') {
      mods.push(0x14CD);
    }
    if (field.terrain === 'Psychic' && moveType === 'Psychic' && !attacker.types.includes('Dark')) {
      mods.push(0x14CD);
    }

    // Defensive terrain
    if (field.terrain === 'Grassy' && (moveData.name === 'Earthquake' || moveData.name === 'Bulldoze')) {
      mods.push(0x800);
    }
    if (field.terrain === 'Misty' && moveType === 'Dragon') {
      mods.push(0x800);
    }

    // 1.2x Abilities (Reckless, Iron Fist)
    if (atkAb === 'Reckless' && (moveData.hasRecoil || moveData.hasCrash)) mods.push(0x1333);
    if (atkAb === 'Iron Fist' && moveData.isPunch) mods.push(0x1333);

    // 1.3x Abilities (Sheer Force, Sand Force, Analytic, Tough Claws, Punk Rock)
    if (atkAb === 'Sheer Force' && moveData.hasSecondaryEffect) mods.push(0x14CD);
    if (atkAb === 'Sand Force' && weather === 'Sand' && ['Rock', 'Ground', 'Steel'].includes(moveType)) mods.push(0x14CD);
    if (atkAb === 'Analytic' && !moveData.isSpread) mods.push(0x14CD);
    if (atkAb === 'Tough Claws' && moveData.makesContact) mods.push(0x14CD);
    if (atkAb === 'Punk Rock' && moveData.isSound) mods.push(0x14CD);

    // 1.5x Abilities (Technician, Flare Boost, Toxic Boost, Strong Jaw, Mega Launcher, Steely Spirit)
    if (atkAb === 'Technician' && computedBP > 0 && computedBP <= 60) mods.push(0x1800);
    if (atkAb === 'Flare Boost' && attacker.status === 'Burned' && moveData.category === 'Special') mods.push(0x1800);
    if (atkAb === 'Toxic Boost' && (attacker.status === 'Poisoned' || attacker.status === 'Badly Poisoned') && moveData.category === 'Physical') mods.push(0x1800);
    if (atkAb === 'Mega Launcher' && moveData.isPulse) mods.push(0x1800);
    if (atkAb === 'Strong Jaw' && moveData.isBite) mods.push(0x1800);
    if (atkAb === 'Steely Spirit' && moveType === 'Steel') mods.push(0x1800);

    // Item BP boosts
    if (atkItem === 'Muscle Band' && moveData.category === 'Physical') mods.push(0x1199);
    if (atkItem === 'Wise Glasses' && moveData.category === 'Special') mods.push(0x1199);
    if (atkItem === 'Punching Glove' && moveData.isPunch) mods.push(0x119A);

    // Type-boosting items
    const typeBoostItems = {
      'Black Belt': 'Fighting', 'Black Glasses': 'Dark', 'Charcoal': 'Fire',
      'Dragon Fang': 'Dragon', 'Hard Stone': 'Rock', 'Magnet': 'Electric',
      'Metal Coat': 'Steel', 'Miracle Seed': 'Grass', 'Mystic Water': 'Water',
      'Never-Melt Ice': 'Ice', 'Poison Barb': 'Poison', 'Sharp Beak': 'Flying',
      'Silk Scarf': 'Normal', 'SilverPowder': 'Bug', 'Soft Sand': 'Ground',
      'Spell Tag': 'Ghost', 'TwistedSpoon': 'Psychic', 'Fairy Feather': 'Fairy',
    };
    if (atkItem && typeBoostItems[atkItem] === moveType) {
      mods.push(0x1333);
    }

    // Gems
    if (atkItem && atkItem.endsWith(' Gem')) {
      const gemType = atkItem.replace(' Gem', '');
      if (gemType === moveType) mods.push(0x14CD);
    }

    // Field modifiers
    if (field.isHelpingHand) mods.push(0x1800);
    if (field.isCharge && moveType === 'Electric') mods.push(0x2000);
    if (field.isBattery) mods.push(0x14CD);
    if (field.isPowerSpot) mods.push(0x14CD);

    // Move-specific BP boosts
    if (moveData.name === 'Expanding Force' && field.terrain === 'Psychic') mods.push(0x1800);
    if (moveData.name === 'Psyblade' && field.terrain === 'Electric') mods.push(0x1800);
    if (moveData.name === 'Misty Explosion' && field.terrain === 'Misty') mods.push(0x1800);
    if (moveData.name === 'Grassy Glide' && field.terrain === 'Grassy') mods.push(0x14CD);
    if (moveData.name === 'Terrain Pulse' && field.terrain) mods.push(0x1800);
    if (moveData.name === 'Weather Ball' && weather) mods.push(0x2000);

    // Status-boosted moves
    if (moveData.name === 'Facade' && ['Burned', 'Paralyzed', 'Poisoned', 'Badly Poisoned'].includes(attacker.status)) {
      mods.push(0x2000);
    }
    if (moveData.name === 'Brine' && defender.curHP && defender.maxHP && defender.curHP <= defender.maxHP / 2) {
      mods.push(0x2000);
    }
    if (moveData.name === 'Venoshock' && ['Poisoned', 'Badly Poisoned'].includes(defender.status)) {
      mods.push(0x2000);
    }
    if (moveData.name === 'Hex' && defender.status && defender.status !== 'Healthy') {
      mods.push(0x2000);
    }
    if (moveData.name === 'Knock Off' && defender.item) {
      mods.push(0x1800);
    }

    // Solar Beam in non-Sun
    if ((moveData.name === 'Solar Beam' || moveData.name === 'Solar Blade') && weather !== 'Sun') {
      mods.push(0x800);
    }

    // Flail / Reversal / Water Spout / Eruption / Crush Grip / Wring Out / Stored Power / Power Trip — handled by computeVariableBP, no multiplier needed here

    // Supreme Overlord (graduated boost based on allies fainted)
    if (atkAb === 'Supreme Overlord' && attacker.supremeOverlord > 0) {
      const overlordBoosts = [0x119A, 0x1333, 0x14CD, 0x1666, 0x1800];
      mods.push(overlordBoosts[Math.min(attacker.supremeOverlord, 5) - 1]);
    }

    return mods;
  }

  // ─── Attack modifiers ───────────────────────────────────────────────

  function calcAtkMods(attacker, moveData, field, defAbility) {
    const mods = [];
    const ab = attacker.ability;
    const item = attacker.item;
    const weather = field.weather || '';

    // Tablets of Ruin / Vessel of Ruin
    if (ab === 'Tablets of Ruin' && moveData.category === 'Physical') {
      mods.push(0xC00);
    }
    if (ab === 'Vessel of Ruin' && moveData.category === 'Special') {
      mods.push(0xC00);
    }

    // 0.5x Abilities
    if ((ab === 'SlowStart' || ab === 'Slow Start') && moveData.category === 'Physical') mods.push(0x800);
    if (ab === 'Defeatist' && attacker.curHP <= attacker.maxHP / 2) mods.push(0x800);

    // 1.5x Offensive Abilities
    if (ab === 'Guts' && attacker.status !== 'Healthy' && moveData.category === 'Physical') mods.push(0x1800);
    if (ab === 'Overgrow' && attacker.curHP <= attacker.maxHP / 3 && moveData.type === 'Grass') mods.push(0x1800);
    if (ab === 'Blaze' && attacker.curHP <= attacker.maxHP / 3 && moveData.type === 'Fire') mods.push(0x1800);
    if (ab === 'Torrent' && attacker.curHP <= attacker.maxHP / 3 && moveData.type === 'Water') mods.push(0x1800);
    if (ab === 'Swarm' && attacker.curHP <= attacker.maxHP / 3 && moveData.type === 'Bug') mods.push(0x1800);
    if (ab === "Dragon's Maw" && moveData.type === 'Dragon') mods.push(0x1800);
    if (ab === 'Flash Fire' && attacker.abilityOn && moveData.type === 'Fire') mods.push(0x1800);
    if (ab === 'Steelworker' && moveData.type === 'Steel') mods.push(0x1800);
    if (ab === 'Gorilla Tactics' && moveData.category === 'Physical' && !attacker.isDynamax) mods.push(0x1800);
    if ((ab === 'Plus' || ab === 'Minus') && attacker.abilityOn) mods.push(0x1800);
    if (ab === 'Sharpness' && moveData.isSlice) mods.push(0x1800);
    if (ab === 'Rocky Payload' && moveData.type === 'Rock') mods.push(0x1800);
    if (ab === 'Solar Power' && weather.indexOf('Sun') > -1 && moveData.category === 'Special') mods.push(0x1800);
    if (ab === 'Flower Gift' && weather.indexOf('Sun') > -1 && moveData.category === 'Physical') mods.push(0x1800);

    // 1.3x Abilities (Protosynthesis / Quark Drive on highest stat)
    if (attacker.paradoxAbilityBoost && ((attacker.highestStat === 'at' && moveData.category === 'Physical') || (attacker.highestStat === 'sa' && moveData.category === 'Special'))) {
      mods.push(0x14CD);
    }

    // 2.0x Abilities
    if (ab === 'Huge Power' && moveData.category === 'Physical') mods.push(0x2000);
    if (ab === 'Pure Power' && moveData.category === 'Physical') mods.push(0x2000);
    if (ab === 'Stakeout' && attacker.abilityOn) mods.push(0x2000);

    // 0.5x Defensive Abilities (from defender)
    if (defAbility === 'Thick Fat' && (moveData.type === 'Fire' || moveData.type === 'Ice')) mods.push(0x800);
    if (defAbility === 'Water Bubble' && moveData.type === 'Fire') mods.push(0x800);
    if (defAbility === 'Purifying Salt' && moveData.type === 'Ghost') mods.push(0x800);
    if (defAbility === 'Heatproof' && moveData.type === 'Fire') mods.push(0x800);

    // 2.0x Items
    if ((item === 'Thick Club' && (attacker.name === 'Cubone' || attacker.name === 'Marowak' || attacker.name === 'Marowak-Alola') && moveData.category === 'Physical') ||
        (item === 'Deep Sea Tooth' && attacker.name === 'Clamperl' && moveData.category === 'Special') ||
        (item === 'Light Ball' && attacker.name === 'Pikachu')) {
      mods.push(0x2000);
    }

    // 1.5x Items
    if ((item === 'Choice Band' && moveData.category === 'Physical' && !attacker.isDynamax) ||
        (item === 'Choice Specs' && moveData.category === 'Special' && !attacker.isDynamax)) {
      mods.push(0x1800);
    }

    return mods;
  }

  // ─── Defense modifiers ──────────────────────────────────────────────

  function calcDefMods(defender, moveData, hitsPhysical) {
    const mods = [];
    const ab = defender.ability;
    const item = defender.item;

    // Sword of Ruin / Beads of Ruin
    if (ab === 'Sword of Ruin' && hitsPhysical) {
      mods.push(0xC00);
    }
    if (ab === 'Beads of Ruin' && !hitsPhysical) {
      mods.push(0xC00);
    }

    // 1.5x Abilities
    if (ab === 'Marvel Scale' && hitsPhysical && defender.status && defender.status !== 'Healthy') {
      mods.push(0x1800);
    }

    // 2x Abilities
    if (ab === 'Fur Coat' && hitsPhysical) {
      mods.push(0x2000);
    }

    // 1.5x Items
    if (item === 'Assault Vest' && !hitsPhysical) {
      mods.push(0x1800);
    }
    if (item === 'Eviolite' && canEvolve(defender.name)) {
      mods.push(0x1800);
    }

    // 2x Items
    if ((item === 'Deep Sea Scale' && defender.name === 'Clamperl' && !hitsPhysical) ||
        (item === 'Metal Powder' && defender.name === 'Ditto' && hitsPhysical)) {
      mods.push(0x2000);
    }

    return mods;
  }

  // ─── Final modifiers ────────────────────────────────────────────────
  // Applied AFTER STAB, type effectiveness, and burn — one per roll

  function calcFinalMods(attacker, defender, moveData, field, isCritical, typeEff) {
    const mods = [];
    const atkItem = attacker.item;

    // Reflect / Light Screen / Aurora Veil (ignored on crits)
    if (!isCritical) {
      if (field.isAuroraVeil) {
        mods.push(field.isDoubles ? 0xAAC : 0x800);
      } else if (moveData.category === 'Physical' && field.isReflect) {
        mods.push(field.isDoubles ? 0xAAC : 0x800);
      } else if (moveData.category === 'Special' && field.isLightScreen) {
        mods.push(field.isDoubles ? 0xAAC : 0x800);
      }
    }

    // Neuroforce (SE)
    if (attacker.ability === 'Neuroforce' && typeEff > 1) {
      mods.push(0x1400);
    }

    // Collision Course / Electro Drift (SE)
    if ((moveData.name === 'Collision Course' || moveData.name === 'Electro Drift') && typeEff > 1) {
      mods.push(0x1555);
    }

    // Sniper (crit)
    if (attacker.ability === 'Sniper' && isCritical) {
      mods.push(0x1800);
    }

    // Tinted Lens (NVE)
    if (attacker.ability === 'Tinted Lens' && typeEff < 1) {
      mods.push(0x2000);
    }

    // Dynamax Cannon / Behemoth Blade / Behemoth Bash (2x vs Dynamax)
    if ((moveData.name === 'Dynamax Cannon' || moveData.name === 'Behemoth Blade' || moveData.name === 'Behemoth Bash') && defender.isDynamax) {
      mods.push(0x2000);
    }

    // Multiscale / Shadow Shield (0.5x at full HP)
    if ((defender.ability === 'Multiscale' || defender.ability === 'Shadow Shield') && defender.curHP === defender.maxHP) {
      mods.push(0x800);
    }

    // Fluffy (0.5x contact)
    if (defender.ability === 'Fluffy' && moveData.makesContact) {
      mods.push(0x800);
    }

    // Punk Rock defender (0.5x sound)
    if (defender.ability === 'Punk Rock' && moveData.isSound) {
      mods.push(0x800);
    }

    // Ice Scales (0.5x special)
    if (defender.ability === 'Ice Scales' && moveData.category === 'Special') {
      mods.push(0x800);
    }

    // Friend Guard
    if (defender.allyHasFriendGuard) {
      mods.push(0xC00);
    }

    // Solid Rock / Filter / Prism Armor (0.75x SE)
    if ((defender.ability === 'Solid Rock' || defender.ability === 'Filter' || defender.ability === 'Prism Armor') && typeEff > 1) {
      mods.push(0xC00);
    }

    // Fluffy (2x Fire)
    if (defender.ability === 'Fluffy' && moveData.type === 'Fire') {
      mods.push(0x2000);
    }

    // Expert Belt (SE)
    if (atkItem === 'Expert Belt' && typeEff > 1) {
      mods.push(0x1333);
    }

    // Life Orb
    if (atkItem === 'Life Orb') {
      mods.push(0x14CC);
    }

    // Tera Shell (defender)
    if (defender.ability === 'Tera Shell' && defender.curHP === defender.maxHP && typeEff > 1) {
      mods.push(0x800);
    }

    // Resist berries
    const resistBerries = {
      'Occa Berry': 'Fire', 'Passho Berry': 'Water', 'Wacan Berry': 'Electric',
      'Rindo Berry': 'Grass', 'Yache Berry': 'Ice', 'Chople Berry': 'Fighting',
      'Kebia Berry': 'Poison', 'Shuca Berry': 'Ground', 'Coba Berry': 'Flying',
      'Payapa Berry': 'Psychic', 'Tanga Berry': 'Bug', 'Charti Berry': 'Rock',
      'Kasib Berry': 'Ghost', 'Haban Berry': 'Dragon', 'Colbur Berry': 'Dark',
      'Babiri Berry': 'Steel', 'Roseli Berry': 'Fairy',
    };
    if (defender.item && resistBerries[defender.item] === moveData.type && typeEff > 1) {
      mods.push(0x800);
    }

    return mods;
  }

  // ─── STAB calculation ───────────────────────────────────────────────

  function getSTAB(attacker, moveData) {
    const moveType = moveData.type;
    if (moveType === 'Typeless') return 0x1000;

    const hasType = attacker.types.includes(moveType);

    // Tera (non-Stellar)
    if (attacker.isTerastalized && attacker.teraType !== 'Stellar') {
      if (moveType === attacker.teraType && hasType) {
        return attacker.ability === 'Adaptability' ? 0x2400 : 0x2000;
      }
      if (hasType || moveType === attacker.teraType) {
        return 0x1800;
      }
      return 0x1000;
    }

    // Tera Stellar
    if (attacker.isTerastalized && attacker.teraType === 'Stellar') {
      if (hasType) return 0x2000;
      return 0x1333;
    }

    // Normal (non-Tera)
    if (hasType) {
      return attacker.ability === 'Adaptability' ? 0x2000 : 0x1800;
    }
    if (attacker.ability === 'Protean' || attacker.ability === 'Libero') {
      return 0x1800;
    }

    return 0x1000;
  }

  // ─── Can evolve helper ──────────────────────────────────────────────

  function canEvolve(name) {
    const noEvolve = new Set([
      'Clefable','Wigglytuff','Ninetales','Arcanine','Slowbro','Slowking',
      'Starmie','Gyarados','Espeon','Umbreon','Steelix','Scizor',
      'Kingler','Lanturn','Azumarill','Ampharos','Bellossom','Politoed',
      'Misdreavus','Girafarig','Forretress','Granbull','Qwilfish',
      'Shuckle','Heracross','Ursaring','Magcargo','Piloswine','Corsola',
      'Octillery','Delibird','Mantine','Skarmory','Kingdra','Donphan',
      'Porygon2','Hitmontop','Smeargle','Miltank','Blissey',
      'Sceptile','Blaziken','Swampert','Gardevoir','Breloom',
      'Slaking','Pelipper','Manectric','Flygon','Claydol','Walrein',
      'Cacturne','Shiftry','Camerupt','Torkoal','Grumpig',
      'Lunatone','Solrock','Whiscash','Crawdaunt','Milotic','Banette',
      'Dusclops','Chimecho','Altaria','Absol','Glalie',
      'Rhyperior','Tangrowth','Electivire','Magmortar','Togekiss',
      'Yanmega','Leafeon','Glaceon','Porygon-Z','Gallade','Probopass',
      'Dusknoir','Froslass','Hydreigon','Volcarona','Haxorus','Chandelure',
      'Golurk','Braviary','Volibear','Gothitelle','Reuniclus','Darmanitan',
      'Accelgor','Escavalier','Excadrill','Ferrothorn',
      'Cryogonal','Stunfisk','Druddigon','Beartic','Mandibuzz',
      'Cobalion','Terrakion','Virizion','Reshiram','Zekrom','Kyurem',
      'Keldeo','Meloetta','Genesect',
      'Greninja','Aegislash','Sylveon','Goodra','Klefki','Talonflame',
      'Vivillon','Pangoro','Meowstic','Malamar','Barbaracle','Dragalge',
      'Clawitzer','Heliolisk','Tyrantrum','Aurorus','Hawlucha',
      'Dedenne','Carbink','Gogoat','Pancham','Furfrou','Aromatisse',
      'Slurpuff','Skrelp','Clauncher','Skiddo','Pumpkaboo','Gourgeist',
      'Bergmite','Noivern','Zygarde','Diancie','Hoopa','Volcanion',
      'Decidueye','Incineroar','Primarina','Toucannon','Gumshoos','Vikavolt',
      'Crabominable','Oricorio','Cutiefly','Ribombee','Lycanroc','Wishiwashi',
      'Mareanie','Toxapex','Mudbray','Mudsdale','Dewpider','Araquanid',
      'Fomantis','Lurantis','Morelull','Shiinotic','Salandit','Salazzle',
      'Stufful','Bewear','Bounsweet','Steenee','Tsareena','Comfey',
      'Oranguru','Passimian','Wimpod','Golisopod','Sandygast','Palossand',
      'Pyukumuku','Type: Null','Silvally','Minior','Komala','Turtonator',
      'Togedemaru','Mimikyu','Bruxish','Drampa','Dhelmise','Jangmo-o',
      'Hakamo-o','Kommo-o','Tapu Koko','Tapu Lele','Tapu Bulu','Tapu Fini',
      'Cosmog','Cosmoem','Solgaleo','Lunala','Nihilego','Buzzwole',
      'Pheromosa','Xurkitree','Celesteela','Kartana','Guzzlord','Necrozma',
      'Magearna','Marshadow','Poipole','Naganadel','Stakataka','Blacephalon',
      'Zeraora','Meltan','Melmetal',
      'Corviknight','Barraskewda','Toxtricity','Centiskorch','Hatterene',
      'Grimmsnarl','Obstagoon','Perrserker','Cursola',"Sirfetch'd",'Mr. Rime',
      'Runerigus','Milcery','Alcremie','Falinks','Pincurchin','Snom',
      'Frosmoth','Stonjourner','Eiscue','Indeedee','Morpeko','Cufant',
      'Copperajah','Dracozolt','Arctozolt','Dracovish','Arctovish','Duraludon',
      'Dreepy','Drakloak','Dragapult','Zacian','Zamazenta','Eternatus',
      'Kubfu','Urshifu','Zarude','Regieleki','Regidrago','Glastrier',
      'Spectrier','Calyrex',
      'Meowscarada','Skeledirge','Quaquaval','Spidops','Lokix','Pawmot',
      'Rabsca','Wugtrio','Bombirdier','Finizen','Varoom','Revavroom',
      'Cyclizar','Orthworm','Glimmet','Glimmora','Greavard','Houndstone',
      'Flamigo','Cetoddle','Cetitan','Veluza','Dondozo','Tatsugiri',
      'Annihilape','Clodsire','Farigiraf','Dudunsparce','Kingambit','Great Tusk',
      'Scream Tail','Brute Bonnet','Flutter Mane','Slither Wing','Sandy Shocks',
      'Iron Treads','Iron Bundle','Iron Hands','Iron Jugulis','Iron Moth',
      'Iron Thorns','Frigibax','Arctibax','Baxcalibur','Gimmighoul','Gholdengo',
      'Wo-Chien','Chien-Pao','Ting-Lu','Chi-Yu','Roaring Moon','Iron Valiant',
      'Koraidon','Miraidon','Walking Wake','Iron Leaves','Dipplin','Poltchageist',
      'Sinistcha','Okidogi','Munkidori','Fezandipiti','Ogerpon','Archaludon',
      'Hydrapple','Gouging Fire','Raging Bolt','Iron Boulder','Iron Crown',
      'Terapagos','Pecharunt',
    ]);
    return !noEvolve.has(name);
  }

  // ─── Variable-power move BP computation ─────────────────────────────

  function computeVariableBP(moveData, attacker, defender) {
    const name = moveData.name;

    // HP-ratio moves (defender current HP / max HP)
    if (name === 'Hard Press') {
      const hp = defender.curHP || 0;
      const max = defender.maxHP || 1;
      return Math.floor(hp / max * 100) + 1;
    }
    if (name === 'Flail' || name === 'Reversal') {
      const hp = attacker.curHP || 0;
      const max = attacker.maxHP || 1;
      const ratio = hp / max;
      if (ratio > 0.5)  return 20;
      if (ratio > 0.4)  return 40;
      if (ratio > 0.3)  return 60;
      if (ratio > 0.2)  return 80;
      if (ratio > 0.1)  return 100;
      if (ratio > 0.04) return 150;
      return 200;
    }
    if (name === 'Endeavor') {
      return 1;
    }

    // Speed-ratio moves
    if (name === 'Gyro Ball') {
      const atkSpe = attacker.stats.spe || 1;
      const defSpe = defender.stats.spe || 0;
      return Math.max(1, Math.min(150, Math.floor(25 * defSpe / atkSpe) + 15));
    }
    if (name === 'Electro Ball') {
      const atkSpe = attacker.stats.spe || 1;
      const defSpe = defender.stats.spe || 0;
      const ratio = defSpe / atkSpe;
      if (ratio >= 4) return 150;
      if (ratio >= 3) return 120;
      if (ratio >= 2) return 80;
      return 60;
    }

    // Weight-based moves (weight in hectograms from PokéAPI)
    if (name === 'Grass Knot' || name === 'Low Kick') {
      const w = defender.weight || 0;
      if (name === 'Grass Knot') {
        if (w <= 100)  return 20;
        if (w <= 250)  return 30;
        if (w <= 500)  return 40;
        if (w <= 1000) return 60;
        if (w <= 2000) return 80;
        if (w <= 10000) return 100;
        return 120;
      } else {
        if (w <= 100)  return 40;
        if (w <= 250)  return 60;
        if (w <= 500)  return 80;
        if (w <= 1000) return 100;
        return 120;
      }
    }
    if (name === 'Heavy Slam' || name === 'Heat Crash') {
      const atkW = attacker.weight || 1;
      const defW = defender.weight || 1;
      const ratio = atkW / defW;
      if (ratio >= 1.2) return 120;
      if (ratio >= 1.0) return 100;
      if (ratio >= 0.8) return 80;
      if (ratio >= 0.6) return 60;
      return 40;
    }

    // HP-ratio moves (attacker current HP / max HP) — 150 BP at full
    if (name === 'Water Spout' || name === 'Eruption') {
      const hp = attacker.curHP || 0;
      const max = attacker.maxHP || 1;
      return Math.max(1, Math.floor(150 * hp / max));
    }

    // HP-ratio moves (defender current HP / max HP) — 120 BP at full
    if (name === 'Crush Grip' || name === 'Wring Out') {
      const hp = defender.curHP || 0;
      const max = defender.maxHP || 1;
      return Math.max(1, Math.floor(120 * hp / max));
    }

    // Boost-based moves — 20 + 20 per positive stat stage
    if (name === 'Stored Power' || name === 'Power Trip') {
      const boosts = attacker.boosts || {};
      const totalPositive = ['atk','def','spa','spd','spe'].reduce((sum, k) => {
        const v = boosts[k] || 0;
        return sum + (v > 0 ? v : 0);
      }, 0);
      return 20 + 20 * totalPositive;
    }

    return moveData.bp;
  }

  // ─── Main damage calculation ────────────────────────────────────────

  function calcDamage(attacker, defender, moveData, field) {
    if (!moveData || moveData.category === 'Status') {
      return { damage: [0], desc: 'Status move' };
    }

    const weather = field.weather || '';
    const isDoubles = field.isDoubles || false;
    const isCritical = field.forceCrit || false;
    const hitsPhysical = moveData.category === 'Physical';

    // Ice Face immunity (physical moves deal 0)
    if (defender.ability === 'Ice Face' && hitsPhysical) {
      return { damage: [0], desc: `${moveData.name} — Ice Face`, typeEff: 0 };
    }

    // ── Step 1: Attack stat ──
    let attack;
    if (hitsPhysical) {
      attack = attacker.stats.atk;
    } else {
      attack = attacker.stats.spa;
    }

    // Hustle: ×1.5 (applied directly, not in mod chain)
    if (attacker.ability === 'Hustle' && hitsPhysical) {
      attack = pokeRound(attack * 3 / 2);
    }

    // Attack modifiers
    const atkModChain = chainMods(calcAtkMods(attacker, moveData, field, defender.ability));
    attack = Math.max(1, pokeRound(attack * atkModChain / 0x1000));

    // ── Step 2: Defense stat ──
    let defense;
    if (hitsPhysical) {
      defense = defender.stats.def;
    } else {
      defense = defender.stats.spd;
    }

    // Sandstorm Rock SpD boost
    if (weather === 'Sand' && defender.types.includes('Rock') && !hitsPhysical) {
      defense = pokeRound(defense * 3 / 2);
    }

    // Snow Ice Def boost
    if (weather === 'Snow' && hitsPhysical && defender.types.includes('Ice')) {
      defense = pokeRound(defense * 3 / 2);
    }

    // Defense modifiers
    const defModChain = chainMods(calcDefMods(defender, moveData, hitsPhysical));
    defense = Math.max(1, pokeRound(defense * defModChain / 0x1000));

    // ── Step 3: Base power ──
    let basePower = computeVariableBP(moveData, attacker, defender);
    const bpModChain = chainMods(calcBPMods(moveData, attacker, defender, field, basePower));
    basePower = Math.max(1, pokeRound(basePower * bpModChain / 0x1000));

    // ── Step 4: Base damage ──
    let baseDamage = Math.floor(Math.floor(Math.floor((2 * LEVEL) / 5 + 2) * basePower * attack / defense) / 50 + 2);

    // ── Step 5: Spread modifier (before random) ──
    if (isDoubles && moveData.isSpread) {
      baseDamage = pokeRound(baseDamage * 0xC00 / 0x1000);
    }

    // ── Step 6: Weather modifier (before random) ──
    if (weather === 'Sun') {
      if (moveData.type === 'Fire') baseDamage = pokeRound(baseDamage * 0x1800 / 0x1000);
      if (moveData.type === 'Water') baseDamage = pokeRound(baseDamage * 0x800 / 0x1000);
    }
    if (weather === 'Rain') {
      if (moveData.type === 'Water') baseDamage = pokeRound(baseDamage * 0x1800 / 0x1000);
      if (moveData.type === 'Fire') baseDamage = pokeRound(baseDamage * 0x800 / 0x1000);
    }

    // ── Step 7: Glaive Rush (before random) ──
    if (defender.glaiveRushMod) {
      baseDamage = pokeRound(baseDamage * 0x2000 / 0x1000);
    }

    // ── Step 8: Critical hit (before random) ──
    if (isCritical) {
      baseDamage = Math.floor(baseDamage * 1.5);
    }

    // ── Step 9: Random factor loop (85–100%) ──
    const typeEff = getTypeEffectiveness(moveData.type, defender.types, defender.ability, defender.teraType, defender.isTerastalized);
    const stabMod = getSTAB(attacker, moveData);

    const damages = [];
    for (let i = 0; i < 16; i++) {
      // a. Random factor
      let dmg = Math.floor(baseDamage * (85 + i) / 100);

      // b. STAB
      dmg = pokeRound(dmg * stabMod / 0x1000);

      // c. Type effectiveness
      if (typeEff === 0) {
        damages.push(0);
        continue;
      }
      dmg = Math.floor(dmg * typeEff);

      // d. Burn
      if (attacker.status === 'Burned' && hitsPhysical && attacker.ability !== 'Guts' && !moveData.ignoresBurn) {
        dmg = Math.floor(dmg / 2);
      }

      // e. Final mods (screens, Life Orb, etc.)
      const finalModChain = chainMods(calcFinalMods(attacker, defender, moveData, field, isCritical, typeEff));
      dmg = pokeRound(dmg * finalModChain / 0x1000);

      // f. Min/max
      dmg = Math.max(MIN_DMG, Math.min(MAX_DMG, dmg));
      damages.push(dmg);
    }

    // Description
    let desc = `${moveData.name} (${moveData.type}, ${moveData.category}`;
    if (moveData.bp) desc += `, ${moveData.bp} BP`;
    desc += ')';
    if (typeEff === 0) desc += ' — 0× (immune)';
    else if (typeEff < 1) desc += ` — ${typeEff}× (NVE)`;
    else if (typeEff > 1) desc += ` — ${typeEff}× (SE)`;
    if (stabMod > 0x1000) desc += ' — STAB';

    return { damage: damages, desc, typeEff };
  }

  // ─── Calculate all moves for a matchup ──────────────────────────────

  function calcAllMoves(attacker, defender, field) {
    const results = [];
    for (const moveName of attacker.moves) {
      const moveData = CalcMoveData.getMoveData(moveName);
      if (!moveData || moveData.category === 'Status') {
        results.push({ name: moveName, damage: [0], percent: [0], desc: 'Status', isStatus: true });
        continue;
      }
      const res = calcDamage(attacker, defender, moveData, field);
      const defHP = defender.stats.hp;
      const percents = res.damage.map(d => Math.round(d / defHP * 1000) / 10);
      results.push({
        name: moveName,
        damage: res.damage,
        percent: percents,
        desc: res.desc,
        typeEff: res.typeEff,
        isStatus: false,
      });
    }
    return results;
  }

  return {
    calcHP,
    calcStat,
    getNatureMultForStat,
    getModifiedStat,
    getStatWithBoosts,
    getHPWithBoosts,
    calcDamage,
    calcAllMoves,
    getSTAB,
    getTypeEffectiveness,
  };
})();
