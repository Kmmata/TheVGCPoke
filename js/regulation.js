/**
 * Regulation M-B data and validation for Pokémon Champions.
 * Contains: legal Pokémon, items, moves, mega evolutions, and validation logic.
 * Current regulation: June 17 – September 2, 2026.
 */
const RegulationMB = (() => {
  'use strict';

  const LEGAL_POKEMON = [
    { name: 'Abomasnow', types: ['Grass','Ice'], baseStats: {hp:90,atk:92,def:75,spa:92,spd:85,spe:60}, abilities: ['Snow Warning','Soundproof'], mega: 'Abomasnow-Mega' },
    { name: 'Absol', types: ['Dark'], baseStats: {hp:65,atk:130,def:60,spa:75,spd:60,spe:75}, abilities: ['Pressure','Super Luck','Justified'], mega: 'Absol-Mega' },
    { name: 'Aegislash', types: ['Steel','Ghost'], baseStats: {hp:60,atk:50,def:140,spa:50,spd:140,spe:60}, abilities: ['Stance Change'] },
    { name: 'Aerodactyl', types: ['Rock','Flying'], baseStats: {hp:80,atk:105,def:65,spa:60,spd:75,spe:130}, abilities: ['Rock Head','Pressure','Unnerve'], mega: 'Aerodactyl-Mega' },
    { name: 'Aggron', types: ['Steel','Rock'], baseStats: {hp:70,atk:110,def:180,spa:60,spd:60,spe:50}, abilities: ['Sturdy','Rock Head','Heavy Metal'], mega: 'Aggron-Mega' },
    { name: 'Alakazam', types: ['Psychic'], baseStats: {hp:55,atk:50,def:45,spa:135,spd:95,spe:120}, abilities: ['Synchronize','Inner Focus','Magic Guard'], mega: 'Alakazam-Mega' },
    { name: 'Alcremie', types: ['Fairy'], baseStats: {hp:51,atk:60,def:75,spa:110,spd:121,spe:64}, abilities: ['Sweet Veil','Aroma Veil'] },
    { name: 'Altaria', types: ['Dragon','Flying'], baseStats: {hp:75,atk:70,def:90,spa:70,spd:105,spe:80}, abilities: ['Natural Cure','Cloud Nine'], mega: 'Altaria-Mega' },
    { name: 'Ampharos', types: ['Electric'], baseStats: {hp:90,atk:75,def:85,spa:115,spd:90,spe:55}, abilities: ['Static','Plus'], mega: 'Ampharos-Mega' },
    { name: 'Annihilape', types: ['Fighting','Ghost'], baseStats: {hp:110,atk:115,def:80,spa:50,spd:90,spe:90}, abilities: ['Vital Spirit','Inner Focus','Defiant'] },
    { name: 'Appletun', types: ['Grass','Dragon'], baseStats: {hp:86,atk:80,def:100,spa:85,spd:100,spe:30}, abilities: ['Ripen','Gluttony','Thick Fat'] },
    { name: 'Araquanid', types: ['Water','Bug'], baseStats: {hp:70,atk:70,def:92,spa:50,spd:132,spe:42}, abilities: ['Water Bubble','Water Absorb'] },
    { name: 'Arbok', types: ['Poison'], baseStats: {hp:60,atk:95,def:69,spa:65,spd:79,spe:80}, abilities: ['Intimidate','Shed Skin','Unnerve'] },
    { name: 'Arcanine', types: ['Fire'], baseStats: {hp:90,atk:110,def:80,spa:100,spd:80,spe:95}, abilities: ['Intimidate','Flash Fire','Justified'] },
    { name: 'Archaludon', types: ['Steel','Dragon'], baseStats: {hp:90,atk:105,def:130,spa:60,spd:80,spe:85}, abilities: ['Stamina','Stalwart','Sturdy'] },
    { name: 'Ariados', types: ['Bug','Poison'], baseStats: {hp:70,atk:90,def:70,spa:60,spd:60,spe:40}, abilities: ['Swarm','Insomnia',' Sniper'] },
    { name: 'Armarouge', types: ['Fire','Psychic'], baseStats: {hp:85,atk:60,def:100,spa:125,spd:80,spe:75}, abilities: ['Flash Fire','Weak Armor','Armor Tail'] },
    { name: 'Aromatisse', types: ['Fairy'], baseStats: {hp:101,atk:72,def:72,spa:99,spd:89,spe:29}, abilities: ['Healer','Aroma Veil'] },
    { name: 'Audino', types: ['Fairy'], baseStats: {hp:103,atk:60,def:86,spa:60,spd:86,spe:50}, abilities: ['Healer','Regenerator','Klutz'], mega: 'Audino-Mega' },
    { name: 'Aurorus', types: ['Rock','Ice'], baseStats: {hp:123,atk:77,def:72,spa:99,spd:92,spe:58}, abilities: ['Refrigerate','Snow Warning'] },
    { name: 'Avalugg', types: ['Ice'], baseStats: {hp:95,atk:117,def:184,spa:44,spd:46,spe:28}, abilities: ['Own Tempo','Ice Body','Sturdy'] },
    { name: 'Azumarill', types: ['Water','Fairy'], baseStats: {hp:100,atk:50,def:80,spa:60,spd:80,spe:50}, abilities: ['Huge Power','Sap Sipper','Thick Fat'] },
    { name: 'Banette', types: ['Ghost'], baseStats: {hp:64,atk:115,def:65,spa:83,spd:63,spe:65}, abilities: ['Insomnia','Frisk','Cursed Body'], mega: 'Banette-Mega' },
    { name: 'Barbaracle', types: ['Rock','Water'], baseStats: {hp:72,atk:105,def:115,spa:54,spd:86,spe:68}, abilities: ['Tough Claws','Sniper','Pickpocket'], mega: 'Barbaracle-Mega' },
    { name: 'Basculegion', types: ['Water','Ghost'], baseStats: {hp:120,atk:112,def:65,spa:80,spd:75,spe:78}, abilities: ['Rattled','Adaptability','Mold Breaker'] },
    { name: 'Basculegion-F', types: ['Water','Ghost'], baseStats: {hp:120,atk:85,def:65,spa:110,spd:75,spe:88}, abilities: ['Rattled','Adaptability','Mold Breaker'] },
    { name: 'Bastiodon', types: ['Steel','Rock'], baseStats: {hp:60,atk:52,def:168,spa:47,spd:138,spe:30}, abilities: ['Sturdy','Soundproof'] },
    { name: 'Beartic', types: ['Ice'], baseStats: {hp:95,atk:110,def:80,spa:70,spd:80,spe:50}, abilities: ['Snow Cloak','Slush Rush','Swift Swim'] },
    { name: 'Beedrill', types: ['Bug','Poison'], baseStats: {hp:65,atk:90,def:40,spa:45,spd:80,spe:75}, abilities: ['Swarm','Sniper'], mega: 'Beedrill-Mega' },
    { name: 'Bellibolt', types: ['Electric'], baseStats: {hp:109,atk:64,def:91,spa:103,spd:93,spe:45}, abilities: ['Electromorphosis','Vanishing Rush','Static'] },
    { name: 'Blastoise', types: ['Water'], baseStats: {hp:79,atk:83,def:100,spa:85,spd:105,spe:78}, abilities: ['Torrent','Rain Dish'], mega: 'Blastoise-Mega' },
    { name: 'Blaziken', types: ['Fire','Fighting'], baseStats: {hp:80,atk:120,def:70,spa:110,spd:70,spe:80}, abilities: ['Blaze','Speed Boost'], mega: 'Blaziken-Mega' },
    { name: 'Camerupt', types: ['Fire','Ground'], baseStats: {hp:70,atk:100,def:70,spa:105,spd:75,spe:40}, abilities: ['Magma Armor','Solid Rock','Anger Point'], mega: 'Camerupt-Mega' },
    { name: 'Castform', types: ['Normal'], baseStats: {hp:70,atk:70,def:70,spa:70,spd:70,spe:70}, abilities: ['Forecast'] },
    { name: 'Ceruledge', types: ['Fire','Ghost'], baseStats: {hp:75,atk:125,def:80,spa:60,spd:100,spe:85}, abilities: ['Flash Fire','Weak Armor','Flash Fire'] },
    { name: 'Chandelure', types: ['Ghost','Fire'], baseStats: {hp:60,atk:55,def:90,spa:145,spd:90,spe:80}, abilities: ['Flash Fire','Flame Body','Infiltrator'] },
    { name: 'Charizard', types: ['Fire','Flying'], baseStats: {hp:78,atk:84,def:78,spa:109,spd:85,spe:100}, abilities: ['Blaze','Solar Power'], megaX: 'Charizard-Mega-X', megaY: 'Charizard-Mega-Y' },
    { name: 'Chesnaught', types: ['Grass','Fighting'], baseStats: {hp:88,atk:107,def:122,spa:74,spd:75,spe:64}, abilities: ['Overgrow','Bulletproof'], mega: 'Chesnaught-Mega' },
    { name: 'Chimecho', types: ['Psychic'], baseStats: {hp:65,atk:50,def:70,spa:95,spd:80,spe:65}, abilities: ['Levitate'] },
    { name: 'Clawitzer', types: ['Water'], baseStats: {hp:71,atk:73,def:88,spa:120,spd:89,spe:59}, abilities: ['Mega Launcher'] },
    { name: 'Clefable', types: ['Fairy'], baseStats: {hp:95,atk:70,def:73,spa:95,spd:90,spe:60}, abilities: ['Cute Charm','Magic Guard','Unaware'] },
    { name: 'Cofagrigus', types: ['Ghost'], baseStats: {hp:58,atk:50,def:145,spa:95,spd:105,spe:30}, abilities: ['Mummy'] },
    { name: 'Conkeldurr', types: ['Fighting'], baseStats: {hp:105,atk:140,def:95,spa:55,spd:65,spe:45}, abilities: ['Guts','Iron Fist','Sheer Force'] },
    { name: 'Corviknight', types: ['Flying','Steel'], baseStats: {hp:98,atk:87,def:105,spa:53,spd:85,spe:67}, abilities: ['Pressure','Unnerve','Mirror Armor'] },
    { name: 'Crabominable', types: ['Fighting','Ice'], baseStats: {hp:97,atk:132,def:77,spa:62,spd:67,spe:43}, abilities: ['Iron Fist','Hyper Cutter','Shell Armor'] },
    { name: 'Decidueye', types: ['Grass','Ghost'], baseStats: {hp:78,atk:107,def:75,spa:100,spd:100,spe:70}, abilities: ['Overgrow','Long Reach'], mega: 'Decidueye-Mega' },
    { name: 'Dedenne', types: ['Electric','Fairy'], baseStats: {hp:67,atk:58,def:57,spa:81,spd:67,spe:101}, abilities: ['Cheek Pouch','Pickup','Plus'] },
    { name: 'Delphox', types: ['Fire','Psychic'], baseStats: {hp:75,atk:69,def:72,spa:114,spd:100,spe:104}, abilities: ['Blaze','Magician'] },
    { name: 'Diggersby', types: ['Normal','Ground'], baseStats: {hp:85,atk:56,def:77,spa:50,spd:77,spe:78}, abilities: ['Pickup','Cheek Pouch','Huge Power'] },
    { name: 'Ditto', types: ['Normal'], baseStats: {hp:48,atk:48,def:48,spa:48,spd:48,spe:48}, abilities: ['Imposter'] },
    { name: 'Dragalge', types: ['Poison','Dragon'], baseStats: {hp:65,atk:75,def:90,spa:97,spd:123,spe:44}, abilities: ['Poison Touch','Adaptability','Hydration'], mega: 'Dragalge-Mega' },
    { name: 'Dragapult', types: ['Dragon','Ghost'], baseStats: {hp:88,atk:120,def:75,spa:100,spd:75,spe:142}, abilities: ['Clear Body','Infiltrator','Cursed Body'] },
    { name: 'Dragonite', types: ['Dragon','Flying'], baseStats: {hp:91,atk:134,def:95,spa:100,spd:100,spe:80}, abilities: ['Inner Focus','Multiscale'] },
    { name: 'Drampa', types: ['Normal','Dragon'], baseStats: {hp:78,atk:60,def:85,spa:135,spd:91,spe:36}, abilities: ['Berserk','Sap Sipper','Cloud Nine'] },
    { name: 'Eelektross', types: ['Electric'], baseStats: {hp:85,atk:115,def:80,spa:105,spd:80,spe:50}, abilities: ['Levitate'], mega: 'Eelektross-Mega' },
    { name: 'Emboar', types: ['Fire','Fighting'], baseStats: {hp:110,atk:123,def:65,spa:100,spd:65,spe:65}, abilities: ['Blaze','Reckless','Sheer Force'], mega: 'Emboar-Mega' },
    { name: 'Emolga', types: ['Electric','Flying'], baseStats: {hp:55,atk:75,def:60,spa:75,spd:60,spe:103}, abilities: ['Static','Motor Drive'] },
    { name: 'Empoleon', types: ['Water','Steel'], baseStats: {hp:84,atk:86,def:88,spa:111,spd:101,spe:60}, abilities: ['Torrent','Defiant'], mega: 'Empoleon-Mega' },
    { name: 'Espathra', types: ['Psychic'], baseStats: {hp:70,atk:45,def:65,spa:105,spd:85,spe:100}, abilities: ['Speed Boost','Opportunist','Frisk'] },
    { name: 'Espeon', types: ['Psychic'], baseStats: {hp:65,atk:65,def:60,spa:130,spd:95,spe:110}, abilities: ['Synchronize','Magic Bounce'] },
    { name: 'Excadrill', types: ['Ground','Steel'], baseStats: {hp:110,atk:135,def:60,spa:50,spd:65,spe:88}, abilities: ['Sand Rush','Sand Force','Mold Breaker'] },
    { name: 'Falinks', types: ['Fighting'], baseStats: {hp:65,atk:100,def:100,spa:70,spd:60,spe:75}, abilities: ['Battle Armor','Defiant','Inner Focus'], mega: 'Falinks-Mega' },
    { name: 'Farigiraf', types: ['Normal','Psychic'], baseStats: {hp:120,atk:90,def:70,spa:110,spd:70,spe:60}, abilities: ['Cud Chew','Armor Tail','Sap Sipper'] },
    { name: 'Feraligatr', types: ['Water'], baseStats: {hp:85,atk:105,def:100,spa:79,spd:83,spe:78}, abilities: ['Torrent','Sheer Force','Moxie'] },
    { name: 'Flapple', types: ['Grass','Dragon'], baseStats: {hp:70,atk:110,def:80,spa:95,spd:60,spe:70}, abilities: ['Ripen','Gluttony','Hustle'] },
    { name: 'Flareon', types: ['Fire'], baseStats: {hp:65,atk:130,def:60,spa:95,spd:110,spe:65}, abilities: ['Flash Fire','Guts','Quick Feet'] },
    { name: 'Floette', types: ['Fairy'], baseStats: {hp:54,atk:45,def:47,spa:75,spd:98,spe:52}, abilities: ['Flower Veil','Symbiosis'] },
    { name: 'Floette-Eternal', types: ['Fairy'], baseStats: {hp:74,atk:65,def:67,spa:105,spd:128,spe:92}, abilities: ['Flower Veil'] },
    { name: 'Florges', types: ['Fairy'], baseStats: {hp:78,atk:65,def:68,spa:95,spd:154,spe:75}, abilities: ['Flower Veil','Symbiosis'] },
    { name: 'Forretress', types: ['Bug','Steel'], baseStats: {hp:80,atk:90,def:140,spa:60,spd:80,spe:40}, abilities: ['Sturdy','Shell Armor'] },
    { name: 'Froslass', types: ['Ice','Ghost'], baseStats: {hp:70,atk:80,def:70,spa:80,spd:70,spe:110}, abilities: ['Snow Cloak','Cursed Body'] },
    { name: 'Furfrou', types: ['Normal'], baseStats: {hp:75,atk:80,def:60,spa:65,spd:90,spe:102}, abilities: ['Fur Coat'] },
    { name: 'Gallade', types: ['Psychic','Fighting'], baseStats: {hp:68,atk:125,def:65,spa:65,spd:115,spe:80}, abilities: ['Steadfast','Inner Focus','Justified'], mega: 'Gallade-Mega' },
    { name: 'Garbodor', types: ['Poison'], baseStats: {hp:80,atk:95,def:82,spa:60,spd:82,spe:75}, abilities: ['Stench','Sticky Hold','Aftermath'] },
    { name: 'Garchomp', types: ['Dragon','Ground'], baseStats: {hp:108,atk:130,def:95,spa:80,spd:85,spe:102}, abilities: ['Sand Veil','Rough Skin'] },
    { name: 'Gardevoir', types: ['Psychic','Fairy'], baseStats: {hp:68,atk:65,def:65,spa:125,spd:115,spe:80}, abilities: ['Synchronize','Trace','Telepathy'], mega: 'Gardevoir-Mega' },
    { name: 'Garganacl', types: ['Rock'], baseStats: {hp:100,atk:100,def:130,spa:45,spd:90,spe:35}, abilities: ['Purifying Salt','Sturdy','Clear Body'] },
    { name: 'Gengar', types: ['Ghost','Poison'], baseStats: {hp:60,atk:65,def:60,spa:130,spd:75,spe:110}, abilities: ['Cursed Body'], mega: 'Gengar-Mega' },
    { name: 'Gholdengo', types: ['Steel','Ghost'], baseStats: {hp:87,atk:60,def:95,spa:133,spd:91,spe:84}, abilities: ['Good as Gold'] },
    { name: 'Glaceon', types: ['Ice'], baseStats: {hp:65,atk:60,def:110,spa:130,spd:95,spe:65}, abilities: ['Snow Cloak','Ice Body'] },
    { name: 'Glalie', types: ['Ice'], baseStats: {hp:80,atk:80,def:80,spa:80,spd:80,spe:80}, abilities: ['Inner Focus','Ice Body','Moody'], mega: 'Glalie-Mega' },
    { name: 'Glimmora', types: ['Rock','Poison'], baseStats: {hp:83,atk:55,def:90,spa:130,spd:81,spe:86}, abilities: ['Toxic Debris','Corrosion','Sturdy'] },
    { name: 'Gliscor', types: ['Ground','Flying'], baseStats: {hp:75,atk:95,def:125,spa:45,spd:75,spe:95}, abilities: ['Hyper Cutter','Sand Veil','Poison Heal'] },
    { name: 'Golurk', types: ['Ground','Ghost'], baseStats: {hp:89,atk:124,def:80,spa:55,spd:80,spe:55}, abilities: ['Iron Fist','Klutz','No Guard'] },
    { name: 'Goodra', types: ['Dragon'], baseStats: {hp:90,atk:100,def:70,spa:110,spd:150,spe:80}, abilities: ['Sap Sipper','Hydration','Gooey'] },
    { name: 'Gourgeist', types: ['Ghost','Grass'], baseStats: {hp:65,atk:90,def:122,spa:58,spd:75,spe:84}, abilities: ['Pickup','Frisk','Insomnia'] },
    { name: 'Greninja', types: ['Water','Dark'], baseStats: {hp:72,atk:95,def:67,spa:103,spd:71,spe:122}, abilities: ['Torrent','Protean','Battle Bond'] },
    { name: 'Grimmsnarl', types: ['Dark','Fairy'], baseStats: {hp:95,atk:120,def:65,spa:95,spd:75,spe:60}, abilities: ['Prankster','Frisk','Pickpocket'] },
    { name: 'Gyarados', types: ['Water','Flying'], baseStats: {hp:95,atk:125,def:79,spa:60,spd:100,spe:81}, abilities: ['Intimidate','Moxie'], mega: 'Gyarados-Mega' },
    { name: 'Hatterene', types: ['Psychic','Fairy'], baseStats: {hp:57,atk:90,def:95,spa:136,spd:103,spe:29}, abilities: ['Anticipation','Sweet Veil','Magic Bounce'] },
    { name: 'Hawlucha', types: ['Fighting','Flying'], baseStats: {hp:78,atk:107,def:75,spa:87,spd:63,spe:123}, abilities: ['Limber','Unburden','Mold Breaker'], mega: 'Hawlucha-Mega' },
    { name: 'Heliolisk', types: ['Electric','Normal'], baseStats: {hp:62,atk:55,def:52,spa:109,spd:94,spe:109}, abilities: ['Dry Skin','Solar Power','Sand Veil'] },
    { name: 'Heracross', types: ['Bug','Fighting'], baseStats: {hp:80,atk:125,def:75,spa:40,spd:95,spe:85}, abilities: ['Swarm','Guts','Moxie'], mega: 'Heracross-Mega' },
    { name: 'Hippowdon', types: ['Ground'], baseStats: {hp:108,atk:112,def:118,spa:68,spd:72,spe:47}, abilities: ['Sand Stream','Sand Force'] },
    { name: 'Houndoom', types: ['Fire','Dark'], baseStats: {hp:75,atk:90,def:50,spa:110,spd:80,spe:95}, abilities: ['Early Bird','Flash Fire','Unnerve'], mega: 'Houndoom-Mega' },
    { name: 'Houndstone', types: ['Ghost'], baseStats: {hp:72,atk:101,def:100,spa:50,spd:97,spe:68}, abilities: ['Sand Rush','Fluffy'] },
    { name: 'Hydrapple', types: ['Grass','Dragon'], baseStats: {hp:106,atk:80,def:100,spa:120,spd:80,spe:44}, abilities: ['Ripen','Regenerator','Stamina'] },
    { name: 'Hydreigon', types: ['Dark','Dragon'], baseStats: {hp:92,atk:105,def:90,spa:125,spd:90,spe:98}, abilities: ['Levitate'] },
    { name: 'Incineroar', types: ['Fire','Dark'], baseStats: {hp:95,atk:115,def:90,spa:80,spd:90,spe:60}, abilities: ['Blaze','Intimidate'] },
    { name: 'Infernape', types: ['Fire','Fighting'], baseStats: {hp:76,atk:104,def:71,spa:104,spd:71,spe:108}, abilities: ['Blaze','Iron Fist'] },
    { name: 'Jolteon', types: ['Electric'], baseStats: {hp:65,atk:65,def:60,spa:130,spd:95,spe:130}, abilities: ['Volt Absorb','Quick Feet'] },
    { name: 'Kangaskhan', types: ['Normal'], baseStats: {hp:105,atk:95,def:80,spa:40,spd:80,spe:90}, abilities: ['Early Bird','Scrappy','Inner Focus'], mega: 'Kangaskhan-Mega' },
    { name: 'Kingambit', types: ['Dark','Steel'], baseStats: {hp:100,atk:135,def:120,spa:60,spd:85,spe:50}, abilities: ['Defiant','Supreme Overlord','Pressure'] },
    { name: 'Kleavor', types: ['Bug','Rock'], baseStats: {hp:70,atk:135,def:95,spa:30,spd:70,spe:85}, abilities: ['Swarm','Sheer Force','Sharpness'] },
    { name: 'Klefki', types: ['Steel','Fairy'], baseStats: {hp:57,atk:80,def:91,spa:80,spd:87,spe:75}, abilities: ['Prankster','Magician'] },
    { name: 'Kommo-o', types: ['Dragon','Fighting'], baseStats: {hp:75,atk:110,def:125,spa:100,spd:105,spe:85}, abilities: ['Bulletproof','Soundproof','Overcoat'] },
    { name: 'Krookodile', types: ['Ground','Dark'], baseStats: {hp:95,atk:117,def:80,spa:65,spd:70,spe:92}, abilities: ['Intimidate','Moxie','Anger Point'] },
    { name: 'Leafeon', types: ['Grass'], baseStats: {hp:65,atk:110,def:130,spa:60,spd:95,spe:95}, abilities: ['Leaf Guard','Chlorophyll'] },
    { name: 'Liepard', types: ['Dark'], baseStats: {hp:64,atk:88,def:50,spa:77,spd:50,spe:106}, abilities: ['Limber','Unburden','Prankster'] },
    { name: 'Lopunny', types: ['Normal'], baseStats: {hp:65,atk:76,def:84,spa:54,spd:96,spe:105}, abilities: ['Cute Charm','Klutz','Limber'], mega: 'Lopunny-Mega' },
    { name: 'Lucario', types: ['Fighting','Steel'], baseStats: {hp:70,atk:110,def:70,spa:115,spd:70,spe:90}, abilities: ['Steadfast','Inner Focus','Justified'], mega: 'Lucario-Mega' },
    { name: 'Luxray', types: ['Electric'], baseStats: {hp:80,atk:120,def:79,spa:95,spd:79,spe:70}, abilities: ['Rivalry','Intimidate','Guts'] },
    { name: 'Lycanroc', types: ['Rock'], baseStats: {hp:75,atk:115,def:65,spa:55,spd:65,spe:112}, abilities: ['Keen Eye','Sand Rush','Steadfast'] },
    { name: 'Machamp', types: ['Fighting'], baseStats: {hp:90,atk:130,def:80,spa:65,spd:85,spe:55}, abilities: ['Guts','No Guard','Steadfast'] },
    { name: 'Malamar', types: ['Dark','Psychic'], baseStats: {hp:86,atk:92,def:88,spa:68,spd:75,spe:73}, abilities: ['Contrary','Suction Cups','Infiltrator'], mega: 'Malamar-Mega' },
    { name: 'Mamoswine', types: ['Ice','Ground'], baseStats: {hp:110,atk:130,def:80,spa:70,spd:60,spe:80}, abilities: ['Oblivious','Snow Cloak','Thick Fat'] },
    { name: 'Manectric', types: ['Electric'], baseStats: {hp:70,atk:75,def:60,spa:105,spd:60,spe:105}, abilities: ['Static','Lightning Rod','Minus'], mega: 'Manectric-Mega' },
    { name: 'Maushold', types: ['Normal'], baseStats: {hp:75,atk:75,def:75,spa:65,spd:75,spe:115}, abilities: ['Friend Guard','Cheek Pouch','Technician'] },
    { name: 'Mawile', types: ['Steel','Fairy'], baseStats: {hp:50,atk:85,def:85,spa:55,spd:55,spe:50}, abilities: ['Hyper Cutter','Intimidate','Sheer Force'], mega: 'Mawile-Mega' },
    { name: 'Medicham', types: ['Fighting','Psychic'], baseStats: {hp:60,atk:60,def:75,spa:60,spd:75,spe:80}, abilities: ['Pure Power','Telepathy'], mega: 'Medicham-Mega' },
    { name: 'Meganium', types: ['Grass'], baseStats: {hp:80,atk:82,def:100,spa:83,spd:100,spe:80}, abilities: ['Overgrow','Triage'], mega: 'Meganium-Mega' },
    { name: 'Meowscarada', types: ['Grass','Dark'], baseStats: {hp:76,atk:110,def:70,spa:81,spd:70,spe:123}, abilities: ['Overgrow','Protean'] },
    { name: 'Meowstic', types: ['Psychic'], baseStats: {hp:74,atk:48,def:76,spa:83,spd:81,spe:104}, abilities: ['Keen Eye','Infiltrator','Prankster'] },
    { name: 'Metagross', types: ['Steel','Psychic'], baseStats: {hp:80,atk:135,def:130,spa:95,spd:90,spe:70}, abilities: ['Clear Body','Light Metal'], mega: 'Metagross-Mega' },
    { name: 'Milotic', types: ['Water'], baseStats: {hp:95,atk:60,def:79,spa:100,spd:125,spe:81}, abilities: ['Marvel Scale','Competitive','Cute Charm'] },
    { name: 'Mimikyu', types: ['Ghost','Fairy'], baseStats: {hp:55,atk:90,def:80,spa:50,spd:105,spe:96}, abilities: ['Disguise'] },
    { name: 'Morpeko', types: ['Electric','Dark'], baseStats: {hp:58,atk:95,def:58,spa:70,spd:58,spe:97}, abilities: ['Hungry Switch'] },
    { name: 'Mr. Rime', types: ['Ice','Psychic'], baseStats: {hp:80,atk:85,def:75,spa:110,spd:100,spe:70}, abilities: ['Tangled Feet','Screen Cleaner','Ice Body'] },
    { name: 'Mudsdale', types: ['Ground'], baseStats: {hp:100,atk:125,def:100,spa:55,spd:85,spe:35}, abilities: ['Stamina','Inner Focus','Own Tempo'] },
    { name: 'Musharna', types: ['Psychic'], baseStats: {hp:116,atk:55,def:85,spa:95,spd:110,spe:29}, abilities: ['Forewarn','Synchronize','Telepathy'] },
    { name: 'Ninetales', types: ['Fire'], baseStats: {hp:73,atk:76,def:75,spa:81,spd:100,spe:100}, abilities: ['Flash Fire','Drought'] },
    { name: 'Noivern', types: ['Flying','Dragon'], baseStats: {hp:85,atk:70,def:80,spa:97,spd:80,spe:123}, abilities: ['Infiltrator','Telepathy'] },
    { name: 'Oranguru', types: ['Normal','Psychic'], baseStats: {hp:110,atk:60,def:80,spa:90,spd:110,spe:60}, abilities: ['Inner Focus','Telepathy','Symbiosis'] },
    { name: 'Orthworm', types: ['Steel'], baseStats: {hp:70,atk:85,def:145,spa:60,spd:55,spe:65}, abilities: ['Earth Eater','Sturdy'] },
    { name: 'Overqwil', types: ['Dark','Poison'], baseStats: {hp:85,atk:115,def:95,spa:60,spd:65,spe:85}, abilities: ['Swift Swim','Intimidate','Poison Point'] },
    { name: 'Palafin', types: ['Water'], baseStats: {hp:100,atk:70,def:72,spa:53,spd:62,spe:100}, abilities: ['Zero to Hero'] },
    { name: 'Pangoro', types: ['Fighting','Dark'], baseStats: {hp:95,atk:124,def:78,spa:69,spd:71,spe:58}, abilities: ['Iron Fist','Mold Breaker','Scrappy'] },
    { name: 'Passimian', types: ['Fighting'], baseStats: {hp:100,atk:120,def:90,spa:40,spd:60,spe:80}, abilities: ['Receiver','Defiant'] },
    { name: 'Patrat', types: ['Normal'], baseStats: {hp:45,atk:55,def:39,spa:35,spd:39,spe:42}, abilities: ['Run Away','Keen Eye','Analytic'] },
    { name: 'Pelipper', types: ['Water','Flying'], baseStats: {hp:60,atk:50,def:100,spa:85,spd:70,spe:65}, abilities: ['Keen Eye','Drizzle'] },
    { name: 'Pidgeot', types: ['Normal','Flying'], baseStats: {hp:83,atk:80,def:75,spa:70,spd:70,spe:91}, abilities: ['Keen Eye','Tangled Feet','Big Pecks'], mega: 'Pidgeot-Mega' },
    { name: 'Pikachu', types: ['Electric'], baseStats: {hp:35,atk:55,def:40,spa:50,spd:50,spe:90}, abilities: ['Static','Lightning Rod','Iron Tail'] },
    { name: 'Pinsir', types: ['Bug'], baseStats: {hp:65,atk:125,def:100,spa:55,spd:70,spe:85}, abilities: ['Hyper Cutter','Mold Breaker','Moxie'], mega: 'Pinsir-Mega' },
    { name: 'Politoed', types: ['Water'], baseStats: {hp:90,atk:75,def:75,spa:90,spd:100,spe:70}, abilities: ['Water Absorb','Drizzle','Hydration'] },
    { name: 'Polteageist', types: ['Ghost'], baseStats: {hp:60,atk:65,def:65,spa:134,spd:114,spe:70}, abilities: ['Weak Armor','Cursed Body'] },
    { name: 'Primarina', types: ['Water','Fairy'], baseStats: {hp:80,atk:74,def:74,spa:126,spd:116,spe:60}, abilities: ['Torrent','Liquid Voice'] },
    { name: 'Pyroar', types: ['Fire','Normal'], baseStats: {hp:86,atk:110,def:76,spa:102,spd:65,spe:106}, abilities: ['Unnerve','Moxie','Intimidate'], mega: 'Pyroar-Mega' },
    { name: 'Quaquaval', types: ['Water','Fighting'], baseStats: {hp:85,atk:120,def:80,spa:85,spd:75,spe:85}, abilities: ['Torrent','Moxie','Sap Sipper'] },
    { name: 'Qwilfish', types: ['Water','Poison'], baseStats: {hp:65,atk:95,def:75,spa:55,spd:55,spe:85}, abilities: ['Poison Point','Swift Swim','Intimidate'] },
    { name: 'Raichu', types: ['Electric'], baseStats: {hp:60,atk:90,def:55,spa:90,spd:80,spe:110}, abilities: ['Static','Lightning Rod'], megaX: 'Raichu-Mega-X', megaY: 'Raichu-Mega-Y' },
    { name: 'Rampardos', types: ['Rock'], baseStats: {hp:97,atk:165,def:60,spa:65,spd:50,spe:58}, abilities: ['Mold Breaker','Sheer Force','Reckless'] },
    { name: 'Reuniclus', types: ['Psychic'], baseStats: {hp:110,atk:65,def:75,spa:125,spd:85,spe:30}, abilities: ['Overcoat','Magic Guard','Regenerator'] },
    { name: 'Rhyperior', types: ['Ground','Rock'], baseStats: {hp:115,atk:140,def:130,spa:55,spd:55,spe:40}, abilities: ['Lightning Rod','Solid Rock','Reckless'] },
    { name: 'Roserade', types: ['Grass','Poison'], baseStats: {hp:60,atk:70,def:65,spa:125,spd:105,spe:90}, abilities: ['Natural Cure','Poison Point','Technician'] },
    { name: 'Rotom', types: ['Electric','Ghost'], baseStats: {hp:50,atk:50,def:77,spa:95,spd:77,spe:91}, abilities: ['Levitate'] },
    { name: 'Rotom-Heat', types: ['Electric','Fire'], baseStats: {hp:50,atk:50,def:77,spa:95,spd:77,spe:91}, abilities: ['Levitate'] },
    { name: 'Rotom-Wash', types: ['Electric','Water'], baseStats: {hp:50,atk:50,def:77,spa:95,spd:77,spe:91}, abilities: ['Levitate'] },
    { name: 'Rotom-Frost', types: ['Electric','Ice'], baseStats: {hp:50,atk:50,def:77,spa:95,spd:77,spe:91}, abilities: ['Levitate'] },
    { name: 'Rotom-Fan', types: ['Electric','Flying'], baseStats: {hp:50,atk:50,def:77,spa:95,spd:77,spe:91}, abilities: ['Levitate'] },
    { name: 'Rotom-Mow', types: ['Electric','Grass'], baseStats: {hp:50,atk:50,def:77,spa:95,spd:77,spe:91}, abilities: ['Levitate'] },
    { name: 'Runerigus', types: ['Ground','Ghost'], baseStats: {hp:58,atk:95,def:145,spa:50,spd:105,spe:30}, abilities: ['Wandering Spirit'] },
    { name: 'Sableye', types: ['Dark','Ghost'], baseStats: {hp:50,atk:75,def:75,spa:65,spd:65,spe:50}, abilities: ['Keen Eye','Stall','Prankster'], mega: 'Sableye-Mega' },
    { name: 'Salazzle', types: ['Poison','Fire'], baseStats: {hp:60,atk:30,def:40,spa:110,spd:60,spe:117}, abilities: ['Corrosion','Oblivious'] },
    { name: 'Samurott', types: ['Water'], baseStats: {hp:95,atk:100,def:85,spa:108,spd:70,spe:85}, abilities: ['Torrent','Shell Armor','Sharpness'] },
    { name: 'Sandaconda', types: ['Ground'], baseStats: {hp:72,atk:100,def:125,spa:45,spd:69,spe:65}, abilities: ['Sand Spit','Shed Skin','Intimidate'] },
    { name: 'Sceptile', types: ['Grass'], baseStats: {hp:70,atk:85,def:65,spa:105,spd:85,spe:120}, abilities: ['Overgrow','Unburden'], mega: 'Sceptile-Mega' },
    { name: 'Scizor', types: ['Bug','Steel'], baseStats: {hp:70,atk:130,def:100,spa:55,spd:80,spe:65}, abilities: ['Swarm','Technician','Light Metal'], mega: 'Scizor-Mega' },
    { name: 'Scolipede', types: ['Bug','Poison'], baseStats: {hp:60,atk:100,def:89,spa:55,spd:69,spe:112}, abilities: ['Poison Point','Swarm','Speed Boost'], mega: 'Scolipede-Mega' },
    { name: 'Scovillain', types: ['Grass','Fire'], baseStats: {hp:65,atk:108,def:65,spa:108,spd:65,spe:75}, abilities: ['Chlorophyll','Insomnia','Anger Point'] },
    { name: 'Scrafty', types: ['Dark','Fighting'], baseStats: {hp:65,atk:90,def:115,spa:45,spd:115,spe:58}, abilities: ['Shed Skin','Moxie','Intimidate'], mega: 'Scrafty-Mega' },
    { name: 'Serperior', types: ['Grass'], baseStats: {hp:75,atk:75,def:95,spa:75,spd:95,spe:113}, abilities: ['Overgrow','Contrary'] },
    { name: 'Sharpedo', types: ['Water','Dark'], baseStats: {hp:70,atk:120,def:40,spa:95,spd:40,spe:95}, abilities: ['Rough Skin','Speed Boost'], mega: 'Sharpedo-Mega' },
    { name: 'Simipour', types: ['Water'], baseStats: {hp:75,atk:98,def:63,spa:98,spd:63,spe:101}, abilities: ['Gluttony','Torrent'] },
    { name: 'Simisage', types: ['Grass'], baseStats: {hp:75,atk:98,def:63,spa:98,spd:63,spe:101}, abilities: ['Gluttony','Overgrow'] },
    { name: 'Simisear', types: ['Fire'], baseStats: {hp:75,atk:98,def:63,spa:98,spd:63,spe:101}, abilities: ['Gluttony','Blaze'] },
    { name: 'Sinistcha', types: ['Grass','Ghost'], baseStats: {hp:71,atk:60,def:106,spa:106,spd:80,spe:44}, abilities: ['Hospitality','Stamina'] },
    { name: 'Skarmory', types: ['Steel','Flying'], baseStats: {hp:65,atk:80,def:140,spa:40,spd:70,spe:70}, abilities: ['Keen Eye','Sturdy','Weak Armor'] },
    { name: 'Skeledirge', types: ['Fire','Ghost'], baseStats: {hp:104,atk:75,def:100,spa:110,spd:75,spe:66}, abilities: ['Blaze','Unaware'] },
    { name: 'Slowbro', types: ['Water','Psychic'], baseStats: {hp:95,atk:75,def:110,spa:100,spd:80,spe:30}, abilities: ['Oblivious','Own Tempo','Regenerator'], mega: 'Slowbro-Mega' },
    { name: 'Slowking', types: ['Water','Psychic'], baseStats: {hp:95,atk:75,def:80,spa:100,spd:110,spe:30}, abilities: ['Oblivious','Own Tempo','Regenerator'] },
    { name: 'Slurpuff', types: ['Fairy'], baseStats: {hp:82,atk:80,def:86,spa:85,spd:75,spe:72}, abilities: ['Sweet Veil','Unburden'] },
    { name: 'Sneasler', types: ['Fighting','Poison'], baseStats: {hp:80,atk:130,def:60,spa:40,spd:80,spe:120}, abilities: ['Unburden','Poison Touch','Inner Focus'] },
    { name: 'Snorlax', types: ['Normal'], baseStats: {hp:160,atk:110,def:65,spa:65,spd:110,spe:30}, abilities: ['Immunity','Thick Fat','Gluttony'] },
    { name: 'Spiritomb', types: ['Ghost','Dark'], baseStats: {hp:50,atk:92,def:108,spa:92,spd:108,spe:35}, abilities: ['Pressure','Infiltrator'] },
    { name: 'Staraptor', types: ['Normal','Flying'], baseStats: {hp:85,atk:120,def:70,spa:50,spd:60,spe:100}, abilities: ['Keen Eye','Reckless','Intimidate'], mega: 'Staraptor-Mega' },
    { name: 'Starmie', types: ['Water','Psychic'], baseStats: {hp:60,atk:75,def:85,spa:100,spd:85,spe:115}, abilities: ['Illuminate','Natural Cure','Analytic'] },
    { name: 'Steelix', types: ['Steel','Ground'], baseStats: {hp:75,atk:85,def:200,spa:55,spd:65,spe:30}, abilities: ['Rock Head','Sturdy','Sheer Force'], mega: 'Steelix-Mega' },
    { name: 'Stunfisk', types: ['Ground','Electric'], baseStats: {hp:109,atk:66,def:84,spa:81,spd:99,spe:32}, abilities: ['Static','Limber','Sand Veil'] },
    { name: 'Swampert', types: ['Water','Ground'], baseStats: {hp:100,atk:110,def:90,spa:85,spd:90,spe:60}, abilities: ['Torrent','Damp'], mega: 'Swampert-Mega' },
    { name: 'Sylveon', types: ['Fairy'], baseStats: {hp:95,atk:65,def:65,spa:110,spd:130,spe:60}, abilities: ['Cute Charm','Pixilate'] },
    { name: 'Talonflame', types: ['Fire','Flying'], baseStats: {hp:78,atk:81,def:71,spa:74,spd:69,spe:126}, abilities: ['Flame Body','Gale Wings'] },
    { name: 'Tauros', types: ['Normal'], baseStats: {hp:75,atk:100,def:95,spa:40,spd:70,spe:110}, abilities: ['Intimidate','Anger Point','Sheer Force'] },
    { name: 'Tinkaton', types: ['Fairy','Steel'], baseStats: {hp:85,atk:110,def:85,spa:45,spd:85,spe:94}, abilities: ['Mold Breaker','Own Tempo','Pickup'] },
    { name: 'Torkoal', types: ['Fire'], baseStats: {hp:70,atk:85,def:140,spa:85,spd:70,spe:20}, abilities: ['White Smoke','Drought','Shell Armor'] },
    { name: 'Torterra', types: ['Grass','Ground'], baseStats: {hp:95,atk:109,def:105,spa:75,spd:85,spe:56}, abilities: ['Overgrow','Shell Armor'] },
    { name: 'Toucannon', types: ['Normal','Flying'], baseStats: {hp:80,atk:120,def:75,spa:75,spd:75,spe:60}, abilities: ['Keen Eye','Skill Link','Sheer Force'] },
    { name: 'Toxapex', types: ['Poison','Water'], baseStats: {hp:50,atk:63,def:152,spa:53,spd:142,spe:35}, abilities: ['Merciless','Limber','Regenerator'] },
    { name: 'Toxicroak', types: ['Poison','Fighting'], baseStats: {hp:83,atk:106,def:65,spa:86,spd:65,spe:85}, abilities: ['Anticipation','Dry Skin','Poison Touch'] },
    { name: 'Trevenant', types: ['Ghost','Grass'], baseStats: {hp:85,atk:110,def:76,spa:65,spd:82,spe:56}, abilities: ['Natural Cure','Frisk','Harvest'] },
    { name: 'Tsareena', types: ['Grass'], baseStats: {hp:72,atk:120,def:98,spa:50,spd:98,spe:72}, abilities: ['Queenly Majesty','Ripen','Sweet Veil'] },
    { name: 'Typhlosion', types: ['Fire'], baseStats: {hp:78,atk:84,def:78,spa:109,spd:85,spe:100}, abilities: ['Blaze','Flash Fire'] },
    { name: 'Tyranitar', types: ['Rock','Dark'], baseStats: {hp:100,atk:134,def:110,spa:95,spd:100,spe:61}, abilities: ['Sand Stream','Unnerve'], mega: 'Tyranitar-Mega' },
    { name: 'Tyrantrum', types: ['Rock','Dragon'], baseStats: {hp:82,atk:121,def:119,spa:69,spd:69,spe:71}, abilities: ['Strong Jaw','Rock Head'] },
    { name: 'Umbreon', types: ['Dark'], baseStats: {hp:95,atk:65,def:110,spa:60,spd:130,spe:65}, abilities: ['Synchronize','Inner Focus'] },
    { name: 'Vanilluxe', types: ['Ice'], baseStats: {hp:71,atk:95,def:85,spa:110,spd:95,spe:79}, abilities: ['Ice Body','Moody'] },
    { name: 'Vaporeon', types: ['Water'], baseStats: {hp:130,atk:65,def:60,spa:110,spd:95,spe:65}, abilities: ['Water Absorb','Hydration'] },
    { name: 'Venusaur', types: ['Grass','Poison'], baseStats: {hp:80,atk:82,def:83,spa:100,spd:100,spe:80}, abilities: ['Overgrow','Chlorophyll'], mega: 'Venusaur-Mega' },
    { name: 'Victreebel', types: ['Grass','Poison'], baseStats: {hp:80,atk:105,def:65,spa:100,spd:60,spe:70}, abilities: ['Chlorophyll','Gluttony'] },
    { name: 'Vileplume', types: ['Grass','Poison'], baseStats: {hp:75,atk:80,def:85,spa:100,spd:90,spe:50}, abilities: ['Chlorophyll','Effect Spore'], mega: 'Vileplume-Mega' },
    { name: 'Vivillon', types: ['Bug','Flying'], baseStats: {hp:80,atk:52,def:50,spa:90,spd:50,spe:89}, abilities: ['Shield Dust','Compound Eyes','Friend Guard'] },
    { name: 'Volcarona', types: ['Bug','Fire'], baseStats: {hp:85,atk:60,def:65,spa:135,spd:105,spe:100}, abilities: ['Flame Body','Swarm'] },
    { name: 'Weavile', types: ['Dark','Ice'], baseStats: {hp:70,atk:120,def:65,spa:45,spd:85,spe:125}, abilities: ['Pressure','Pickpocket'] },
    { name: 'Whimsicott', types: ['Grass','Fairy'], baseStats: {hp:60,atk:67,def:85,spa:77,spd:75,spe:116}, abilities: ['Prankster','Infiltrator','Chlorophyll'] },
    { name: 'Wyrdeer', types: ['Normal','Psychic'], baseStats: {hp:103,atk:105,def:72,spa:105,spd:75,spe:65}, abilities: ['Intimidate','Sap Sipper','Scrappy'] },
    { name: 'Zoroark', types: ['Dark'], baseStats: {hp:60,atk:105,def:60,spa:120,spd:60,spe:105}, abilities: ['Illusion'] },
  ];

  const LEGAL_ITEMS = [
    'Abomasite','Absolite','Aerodactylite','Aggronite','Alakazite','Altarianite',
    'Ampharosite','Aspear Berry','Audinite','Babiri Berry','Banettite',
    'Barbaracleite','Beedrillite','Big Root','Black Belt','Black Glasses',
    'Blastoisinite','Blazikenite','BrightPowder','Cameruptite','Chandelurite',
    'Charcoal','Charizardite X','Charizardite Y','Charti Berry','Cheri Berry',
    'Chesnaughtite','Chesto Berry','Chilan Berry','Chimechite','Choice Scarf',
    'Chople Berry','Clefablite','Coba Berry','Colbur Berry','Crabominite',
    'Damp Rock','Delphoxite','Dragalgeite','Dragon Fang','Dragoniteite',
    'Drampanite','Eelektrossite','Emboarite','Excadrite','Expert Belt',
    'Fairy Feather','Falinksite','Feraligite','Floettite','Focus Band',
    'Focus Sash','Froslassite','Galladite','Garchompite','Gardevoirite',
    'Gengarite','Glalitite','Glimmoranite','Golurkite','Greninjite',
    'Gyaradosite','Haban Berry','Hard Stone','Hawluchanite','Heat Rock',
    'Heracronite','Houndoominite','Icy Rock','Iron Ball','Kangaskhanite',
    'Kasib Berry','Kebia Berry',"King's Rock",'Leftovers','Leppa Berry',
    'Life Orb','Light Ball','Light Clay','Lopunnite','Lucarionite',
    'Lum Berry','Magnet','Malamarite','Manectite','Mawileite',
    'Medichamite','Meganiumite','Mental Herb','Meowsticite','Metagrossite',
    'Metal Coat','Metronome','Miracle Seed','Muscle Band','Mystic Water',
    'Never-Melt Ice','Occa Berry','Oran Berry','Passho Berry','Payapa Berry',
    'Pecha Berry','Persim Berry','Pidgeotite','Pinsirite','Poison Barb',
    'Pyroarite','Quick Claw','Raichunite X','Raichunite Y','Rawst Berry',
    'Rindo Berry','Roseli Berry','Sablenite','Sceptileite','Scizorite',
    'Scolipedeite','Scope Lens','Scovillainite','Scraftyite','Sharp Beak',
    'Sharpedonite','Shed Shell','Shell Bell','Shuca Berry','Silk Scarf',
    'SilverPowder','Sitrus Berry','Skarmorite','Slowbronite','Smooth Rock',
    'Soft Sand','Spell Tag','Staraptorite','Starminite','Steelixite',
    'Swampertite','Tanga Berry','TwistedSpoon','Tyranitarite','Venusaurite',
    'Victreebelite','Wacan Berry','White Herb','Wide Lens','Wise Glasses',
    'Yache Berry','Zoom Lens',
  ];

  const LEGAL_MOVES = [
    'Accelerock','Acid Armor','Acid Spray','Acrobatics','Acupressure','Aerial Ace',
    'After You','Agility','Air Cutter','Air Slash','Alluring Voice','Ally Switch',
    'Amnesia','Ancient Power','Apple Acid','Aqua Cutter','Aqua Jet','Aqua Ring',
    'Aqua Step','Aqua Tail','Armor Cannon','Aromatic Mist','Assurance','Attract',
    'Aura Sphere','Aura Wheel','Aurora Veil','Avalanche','Axe Kick',
    'Baby-Doll Eyes','Baneful Bunker','Barb Barrage','Baton Pass','Beak Blast',
    'Beat Up','Belch','Belly Drum','Bind','Bite','Bitter Blade','Bitter Malice',
    'Blast Burn','Blaze Kick','Blizzard','Block','Body Press','Body Slam',
    'Bone Rush','Boomburst','Bounce','Brave Bird','Breaking Swipe','Brick Break',
    'Brutal Swing','Bug Bite','Bug Buzz','Bulk Up','Bulldoze','Bullet Punch',
    'Bullet Seed','Burn Up','Burning Jealousy','Calm Mind','Ceaseless Edge',
    'Charge','Charge Beam','Charm','Chilling Water','Chilly Reception',
    'Circle Throw','Clanging Scales','Clangorous Soul','Clear Smog',
    'Close Combat','Coaching','Coil','Comeuppance','Confuse Ray','Copycat',
    'Corrosive Gas','Cosmic Power','Cotton Guard','Cotton Spore','Counter',
    'Covet','Crabhammer','Cross Chop','Cross Poison','Crunch','Crush Claw',
    'Curse','Dark Pulse','Darkest Lariat','Dazzling Gleam','Decorate','Defog',
    'Destiny Bond','Detect','Dig','Dire Claw','Disable','Discharge','Dive',
    'Double Hit','Double Shock','Double Team','Double-Edge','Draco Meteor',
    'Dragon Cheer','Dragon Claw','Dragon Dance','Dragon Darts','Dragon Pulse',
    'Dragon Rush','Dragon Tail','Drain Punch','Draining Kiss','Drill Peck',
    'Drill Run','Dual Wingbeat','Dynamic Punch','Earth Power','Earthquake',
    'Eerie Impulse','Eerie Spell','Electric Terrain','Electrify','Electro Ball',
    'Electro Shot','Electroweb','Encore','Endeavor','Endure','Energy Ball',
    'Entrainment','Eruption','Expanding Force','Explosion','Extrasensory',
    'Extreme Speed','Facade','Fairy Lock','Fake Out','Fake Tears',
    'Feather Dance','Feint','Fell Stinger','Fickle Beam','Fiery Dance',
    'Final Gambit','Fire Blast','Fire Fang','Fire Lash','Fire Punch',
    'Fire Spin','First Impression','Fissure','Flail','Flame Charge',
    'Flamethrower','Flare Blitz','Flash Cannon','Flatter','Fling','Flip Turn',
    'Flower Trick','Fly','Flying Press','Focus Blast','Focus Energy',
    'Focus Punch','Follow Me',"Forest's Curse",'Foul Play','Freeze-Dry',
    'Frenzy Plant','Frost Breath','Future Sight','Gastro Acid','Giga Drain',
    'Giga Impact','Gigaton Hammer','Glare','Grass Knot','Grassy Glide',
    'Grassy Terrain','Grav Apple','Gravity','Growth','Guard Split',
    'Guard Swap','Guillotine','Gunk Shot','Gyro Ball','Hammer Arm',
    'Hard Press','Haze','Head Smash','Headlong Rush','Heal Bell','Heal Pulse',
    'Healing Wish','Heat Crash','Heat Wave','Heavy Slam','Helping Hand','Hex',
    'High Horsepower','High Jump Kick','Horn Drill','Horn Leech','Howl',
    'Hurricane','Hydro Cannon','Hydro Pump','Hyper Beam','Hyper Voice',
    'Hypnosis','Ice Beam','Ice Fang','Ice Hammer','Ice Punch','Ice Shard',
    'Ice Spinner','Icicle Crash','Icicle Spear','Icy Wind','Imprison',
    'Infernal Parade','Inferno','Infestation','Ingrain','Instruct',
    'Iron Defense','Iron Head','Iron Tail','Jet Punch',"King's Shield",
    'Knock Off','Kowtow Cleave','Lash Out','Last Resort','Last Respects',
    'Lava Plume','Leaf Blade','Leaf Storm','Leech Life','Leech Seed',
    'Life Dew','Light of Ruin','Light Screen','Liquidation','Lock-On',
    'Low Kick','Low Sweep','Lumina Crash','Lunge','Mach Punch',
    'Magic Powder','Magic Room','Magnet Rise','Magnetic Flux','Make It Rain',
    'Matcha Gotcha','Mean Look','Mega Kick','Megahorn','Memento',
    'Metal Burst','Metal Sound','Meteor Beam','Meteor Mash','Milk Drink',
    'Minimize','Mirror Coat','Misty Explosion','Misty Terrain','Moonblast',
    'Moonlight','Morning Sun','Mortal Spin','Mountain Gale','Mud Shot',
    'Mud-Slap','Muddy Water','Mystical Fire','Nasty Plot','Night Daze',
    'Night Shade','Night Slash','No Retreat','Noble Roar','Nuzzle','Outrage',
    'Overheat','Pain Split','Parabolic Charge','Parting Shot','Payback',
    'Perish Song','Petal Blizzard','Petal Dance','Phantom Force','Pin Missile',
    'Play Rough','Pluck','Poison Fang','Poison Jab','Poison Powder',
    'Pollen Puff','Poltergeist','Population Bomb','Pounce','Power Gem',
    'Power Shift','Power Split','Power Swap','Power Trick','Power Trip',
    'Power Whip','Protect','Psych Up','Psychic','Psychic Fangs',
    'Psychic Noise','Psychic Terrain','Psycho Cut','Psyshield Bash',
    'Psyshock','Quash','Quick Attack','Quick Guard','Quiver Dance',
    'Rage Fist','Rage Powder','Raging Bull','Raging Fury','Rain Dance',
    'Rapid Spin','Razor Shell','Recover','Recycle','Reflect','Reflect Type',
    'Rest','Reversal','Revival Blessing','Rising Voltage','Roar','Rock Blast',
    'Rock Polish','Rock Slide','Rock Tomb','Rock Wrecker','Role Play','Roost',
    'Round','Sacred Sword','Safeguard','Salt Cure','Sand Tomb','Sandstorm',
    'Scald','Scale Shot','Scary Face','Scorching Sands','Screech','Seed Bomb',
    'Seismic Toss','Self-Destruct','Shadow Ball','Shadow Claw','Shadow Punch',
    'Shadow Sneak','Shed Tail','Sheer Cold','Shell Side Arm','Shell Smash',
    'Shelter','Simple Beam','Sing','Skill Swap','Skitter Smack','Sky Attack',
    'Slack Off','Sleep Powder','Sleep Talk','Sludge Bomb','Sludge Wave',
    'Smack Down','Smart Strike','Snap Trap','Snarl','Snore','Snowscape',
    'Soak','Soft-Boiled','Solar Beam','Solar Blade','Sparkling Aria',
    'Speed Swap','Spicy Extract','Spikes','Spiky Shield','Spirit Break',
    'Spirit Shackle','Spit Up','Spite','Spore','Stealth Rock','Steel Beam',
    'Steel Roller','Steel Wing','Sticky Web','Stockpile','Stomping Tantrum',
    'Stone Axe','Stone Edge','Stored Power','Storm Throw','Strength Sap',
    'String Shot','Struggle','Struggle Bug','Stuff Cheeks','Stun Spore',
    'Substitute','Sucker Punch','Sunny Day','Super Fang','Supercell Slam',
    'Superpower','Surf','Swagger','Swallow','Sweet Kiss','Sweet Scent',
    'Switcheroo','Swords Dance','Synthesis','Syrup Bomb','Tail Slap',
    'Tailwind','Taunt','Tearful Look','Teatime','Teeter Dance','Temper Flare',
    'Terrain Pulse','Thief','Thrash','Throat Chop','Thunder','Thunder Fang',
    'Thunder Punch','Thunder Wave','Thunderbolt','Tickle','Tidy Up',
    'Topsy-Turvy','Torch Song','Torment','Toxic','Toxic Spikes',
    'Toxic Thread','Trailblaze','Transform','Tri Attack','Trick',
    'Trick Room','Trick-or-Treat','Triple Arrows','Triple Axel','Trop Kick',
    'Twin Beam','U-turn','Upper Hand','Uproar','Vacuum Wave','Venoshock',
    'Volt Switch','Volt Tackle','Water Pulse','Water Shuriken','Water Spout',
    'Waterfall','Wave Crash','Weather Ball','Whirlpool','Whirlwind',
    'Wide Guard','Wild Charge','Will-O-Wisp','Wish','Wonder Room',
    'Wood Hammer','Worry Seed','Wrap','X-Scissor','Yawn','Zap Cannon',
    'Zen Headbutt',
  ];

  const MEGA_STONES_PER_POKEMON = {
    'Abomasnow': ['Abomasite'],
    'Absol': ['Absolite'],
    'Aerodactyl': ['Aerodactylite'],
    'Aggron': ['Aggronite'],
    'Alakazam': ['Alakazite'],
    'Altaria': ['Altarianite'],
    'Ampharos': ['Ampharosite'],
    'Audino': ['Audinite'],
    'Banette': ['Banettite'],
    'Barbaracle': ['Barbaracleite'],
    'Beedrill': ['Beedrillite'],
    'Blastoise': ['Blastoisinite'],
    'Blaziken': ['Blazikenite'],
    'Camerupt': ['Cameruptite'],
    'Charizard': ['Charizardite X','Charizardite Y'],
    'Chesnaught': ['Chesnaughtite'],
    'Decidueye': ['Decidueye-Mega Stone'],
    'Dragalge': ['Dragalgeite'],
    'Eelektross': ['Eelektrossite'],
    'Emboar': ['Emboarite'],
    'Empoleon': ['Empoleonite'],
    'Falinks': ['Falinksite'],
    'Gallade': ['Galladite'],
    'Gardevoir': ['Gardevoirite'],
    'Gengar': ['Gengarite'],
    'Glalie': ['Glalitite'],
    'Gyarados': ['Gyaradosite'],
    'Hawlucha': ['Hawluchanite'],
    'Heracross': ['Heracronite'],
    'Houndoom': ['Houndoominite'],
    'Kangaskhan': ['Kangaskhanite'],
    'Lucario': ['Lucarionite'],
    'Lopunny': ['Lopunnite'],
    'Mawile': ['Mawileite'],
    'Medicham': ['Medichamite'],
    'Meganium': ['Meganiumite'],
    'Meowstic': ['Meowsticite'],
    'Metagross': ['Metagrossite'],
    'Pidgeot': ['Pidgeotite'],
    'Pinsir': ['Pinsirite'],
    'Pyroar': ['Pyroarite'],
    'Raichu': ['Raichunite X','Raichunite Y'],
    'Sableye': ['Sablenite'],
    'Sceptile': ['Sceptileite'],
    'Scizor': ['Scizorite'],
    'Scolipede': ['Scolipedeite'],
    'Scrafty': ['Scraftyite'],
    'Sharpedo': ['Sharpedonite'],
    'Slowbro': ['Slowbronite'],
    'Staraptor': ['Staraptorite'],
    'Steelix': ['Steelixite'],
    'Swampert': ['Swampertite'],
    'Tyranitar': ['Tyranitarite'],
    'Venusaur': ['Venusaurite'],
    'Vileplume': ['Vileplume-Mega Stone'],
    'Manectric': ['Manectricite'],
  };

  const MEGA_DATA = {
    'Abomasnow':  { types:['Ice','Grass'], ability:'Snow Warning',    baseStats:{hp:90,atk:132,def:105,spa:132,spd:105,spe:30} },
    'Absol':      { types:['Dark'],         ability:'Magic Bounce',   baseStats:{hp:65,atk:150,def:60,spa:115,spd:60,spe:115} },
    'Aerodactyl': { types:['Rock','Flying'], ability:'Tough Claws',  baseStats:{hp:80,atk:135,def:85,spa:70,spd:95,spe:150} },
    'Aggron':     { types:['Steel'],         ability:'Filter',        baseStats:{hp:70,atk:140,def:230,spa:60,spd:80,spe:50} },
    'Alakazam':   { types:['Psychic'],       ability:'Trace',         baseStats:{hp:55,atk:50,def:65,spa:175,spd:105,spe:150} },
    'Altaria':    { types:['Dragon','Fairy'], ability:'Pixilate',     baseStats:{hp:75,atk:110,def:110,spa:110,spd:105,spe:80} },
    'Ampharos':   { types:['Electric','Dragon'], ability:'Mold Breaker', baseStats:{hp:90,atk:95,def:105,spa:165,spd:110,spe:45} },
    'Audino':     { types:['Normal','Fairy'], ability:'Healer',       baseStats:{hp:103,atk:60,def:126,spa:80,spd:126,spe:50} },
    'Banette':    { types:['Ghost'],          ability:'Prankster',    baseStats:{hp:64,atk:165,def:75,spa:93,spd:83,spe:75} },
    'Barbaracle': { types:['Fighting','Rock'], ability:'Tough Claws', baseStats:{hp:72,atk:140,def:130,spa:64,spd:106,spe:88} },
    'Beedrill':   { types:['Bug','Poison'],  ability:'Adaptability',  baseStats:{hp:65,atk:150,def:40,spa:15,spd:80,spe:145} },
    'Blastoise':  { types:['Water'],          ability:'Mega Launcher', baseStats:{hp:79,atk:103,def:120,spa:135,spd:115,spe:78} },
    'Blaziken':   { types:['Fire','Fighting'], ability:'Speed Boost',  baseStats:{hp:80,atk:160,def:80,spa:130,spd:80,spe:100} },
    'Camerupt':   { types:['Fire','Ground'],  ability:'Sheer Force',  baseStats:{hp:70,atk:120,def:100,spa:145,spd:105,spe:20} },
    'Charizard': {
      X: { types:['Fire','Dragon'], ability:'Tough Claws', baseStats:{hp:78,atk:130,def:111,spa:130,spd:85,spe:100} },
      Y: { types:['Fire','Flying'], ability:'Drought',     baseStats:{hp:78,atk:104,def:78,spa:159,spd:115,spe:100} },
    },
    'Chesnaught': { types:['Grass','Fighting'], ability:'Bulletproof', baseStats:{hp:88,atk:137,def:172,spa:74,spd:115,spe:44} },
    'Chimecho':   { types:['Psychic','Steel'], ability:'Levitate',    baseStats:{hp:75,atk:50,def:110,spa:135,spd:120,spe:65} },
    'Clefable':   { types:['Fairy','Flying'],  ability:'Magic Bounce', baseStats:{hp:95,atk:80,def:93,spa:135,spd:110,spe:70} },
    'Crabominable': { types:['Fighting','Ice'], ability:'Iron Fist',  baseStats:{hp:97,atk:157,def:122,spa:62,spd:107,spe:33} },
    'Delphox':    { types:['Fire','Psychic'],  ability:'Levitate',    baseStats:{hp:75,atk:69,def:72,spa:159,spd:125,spe:134} },
    'Dragalge':   { types:['Poison','Dragon'], ability:'Regenerator', baseStats:{hp:65,atk:85,def:105,spa:132,spd:163,spe:44} },
    'Dragonite':  { types:['Dragon','Flying'], ability:'Multiscale',  baseStats:{hp:91,atk:124,def:115,spa:145,spd:125,spe:100} },
    'Drampa':     { types:['Normal','Dragon'], ability:'Berserk',     baseStats:{hp:78,atk:85,def:110,spa:160,spd:116,spe:36} },
    'Eelektross': { types:['Electric'],        ability:'Eelevate',    baseStats:{hp:85,atk:145,def:80,spa:135,spd:90,spe:80} },
    'Emboar':     { types:['Fire','Fighting'], ability:'Mold Breaker', baseStats:{hp:110,atk:148,def:75,spa:110,spd:110,spe:75} },
    'Excadrill':  { types:['Ground','Steel'],  ability:'Piercing Drill', baseStats:{hp:110,atk:165,def:100,spa:65,spd:65,spe:103} },
    'Falinks':    { types:['Fighting'],        ability:'Defiant',     baseStats:{hp:65,atk:135,def:135,spa:70,spd:65,spe:100} },
    'Feraligatr': { types:['Water','Dragon'],  ability:'Dragonize',   baseStats:{hp:85,atk:160,def:125,spa:89,spd:93,spe:78} },
    'Floette':    { types:['Fairy'],           ability:'Fairy Aura',  baseStats:{hp:74,atk:85,def:87,spa:155,spd:148,spe:102} },
    'Froslass':   { types:['Ice','Ghost'],     ability:'Snow Warning', baseStats:{hp:70,atk:80,def:70,spa:140,spd:100,spe:120} },
    'Gallade':    { types:['Psychic','Fighting'], ability:'Inner Focus', baseStats:{hp:68,atk:165,def:95,spa:65,spd:115,spe:110} },
    'Gardevoir':  { types:['Psychic','Fairy'], ability:'Pixilate',    baseStats:{hp:68,atk:85,def:65,spa:165,spd:135,spe:100} },
    'Garchomp':   { types:['Dragon','Ground'], ability:'Sand Force',  baseStats:{hp:108,atk:170,def:115,spa:120,spd:95,spe:92} },
    'Gengar':     { types:['Ghost','Poison'],  ability:'Shadow Tag',  baseStats:{hp:60,atk:65,def:80,spa:170,spd:95,spe:130} },
    'Glalie':     { types:['Ice'],             ability:'Refrigerate',  baseStats:{hp:80,atk:120,def:80,spa:120,spd:80,spe:100} },
    'Glimmora':   { types:['Rock','Poison'],   ability:'Adaptability', baseStats:{hp:83,atk:90,def:105,spa:150,spd:96,spe:101} },
    'Golurk':     { types:['Ground','Ghost'],  ability:'Unseen Fist', baseStats:{hp:89,atk:159,def:105,spa:70,spd:105,spe:55} },
    'Greninja':   { types:['Water','Dark'],    ability:'Protean',     baseStats:{hp:72,atk:125,def:77,spa:133,spd:81,spe:142} },
    'Gyarados':   { types:['Water','Dark'],    ability:'Mold Breaker', baseStats:{hp:95,atk:155,def:109,spa:70,spd:130,spe:81} },
    'Hawlucha':   { types:['Fighting','Flying'], ability:'No Guard',   baseStats:{hp:78,atk:137,def:100,spa:74,spd:93,spe:118} },
    'Heracross':  { types:['Bug','Fighting'],  ability:'Skill Link',  baseStats:{hp:80,atk:185,def:115,spa:40,spd:105,spe:75} },
    'Houndoom':   { types:['Fire','Dark'],     ability:'Solar Power', baseStats:{hp:75,atk:90,def:90,spa:140,spd:90,spe:115} },
    'Kangaskhan': { types:['Normal'],          ability:'Parental Bond', baseStats:{hp:105,atk:125,def:100,spa:60,spd:100,spe:100} },
    'Lopunny':    { types:['Normal','Fighting'], ability:'Scrappy',    baseStats:{hp:65,atk:136,def:94,spa:54,spd:96,spe:135} },
    'Lucario':    { types:['Fighting','Steel'], ability:'Adaptability', baseStats:{hp:70,atk:145,def:88,spa:140,spd:70,spe:112} },
    'Manectric':  { types:['Electric'],        ability:'Intimidate',  baseStats:{hp:70,atk:75,def:80,spa:135,spd:80,spe:135} },
    'Mawile':     { types:['Steel','Fairy'],   ability:'Huge Power',  baseStats:{hp:50,atk:105,def:125,spa:55,spd:95,spe:50} },
    'Medicham':   { types:['Fighting','Psychic'], ability:'Pure Power', baseStats:{hp:60,atk:100,def:85,spa:80,spd:85,spe:100} },
    'Meganium':   { types:['Grass','Fairy'],   ability:'Mega Sol',    baseStats:{hp:80,atk:92,def:115,spa:143,spd:115,spe:80} },
    'Meowstic':   { types:['Psychic'],         ability:'Trace',       baseStats:{hp:74,atk:48,def:76,spa:143,spd:101,spe:124} },
    'Metagross':  { types:['Steel','Psychic'], ability:'Tough Claws', baseStats:{hp:80,atk:145,def:150,spa:105,spd:110,spe:110} },
    'Pidgeot':    { types:['Normal','Flying'],  ability:'No Guard',    baseStats:{hp:83,atk:80,def:80,spa:135,spd:80,spe:121} },
    'Pinsir':     { types:['Bug','Flying'],    ability:'Aerilate',    baseStats:{hp:65,atk:155,def:120,spa:65,spd:90,spe:105} },
    'Pyroar':     { types:['Normal','Fire'],   ability:'Fire Mane',   baseStats:{hp:86,atk:88,def:92,spa:129,spd:86,spe:126} },
    'Raichu': {
      X: { types:['Electric'], ability:'Electric Surge', baseStats:{hp:60,atk:135,def:95,spa:90,spd:95,spe:110} },
      Y: { types:['Electric'], ability:'No Guard',       baseStats:{hp:60,atk:100,def:55,spa:160,spd:80,spe:130} },
    },
    'Sableye':    { types:['Dark','Ghost'],    ability:'Magic Bounce', baseStats:{hp:50,atk:85,def:125,spa:85,spd:115,spe:20} },
    'Sceptile':   { types:['Grass','Dragon'],  ability:'Lightning Rod', baseStats:{hp:70,atk:110,def:75,spa:145,spd:85,spe:145} },
    'Scizor':     { types:['Bug','Steel'],     ability:'Technician',  baseStats:{hp:70,atk:150,def:140,spa:65,spd:100,spe:75} },
    'Scolipede':  { types:['Poison','Bug'],    ability:'Shell Armor', baseStats:{hp:60,atk:140,def:149,spa:75,spd:99,spe:62} },
    'Scrafty':    { types:['Fighting','Dark'],  ability:'Intimidate',  baseStats:{hp:65,atk:130,def:135,spa:55,spd:135,spe:68} },
    'Sharpedo':   { types:['Water','Dark'],    ability:'Strong Jaw',  baseStats:{hp:70,atk:140,def:70,spa:110,spd:65,spe:105} },
    'Skarmory':   { types:['Steel','Flying'],  ability:'Stalwart',    baseStats:{hp:65,atk:140,def:110,spa:40,spd:100,spe:110} },
    'Slowbro':    { types:['Water','Psychic'], ability:'Shell Armor',  baseStats:{hp:95,atk:75,def:180,spa:130,spd:80,spe:30} },
    'Starmie':    { types:['Water','Psychic'], ability:'Huge Power',   baseStats:{hp:60,atk:100,def:105,spa:130,spd:105,spe:120} },
    'Staraptor':  { types:['Fighting','Flying'], ability:'Contrary',   baseStats:{hp:85,atk:140,def:100,spa:60,spd:90,spe:110} },
    'Steelix':    { types:['Steel','Ground'],  ability:'Sand Force',  baseStats:{hp:75,atk:125,def:230,spa:55,spd:95,spe:30} },
    'Swampert':   { types:['Water','Ground'],  ability:'Swift Swim',  baseStats:{hp:100,atk:150,def:110,spa:95,spd:110,spe:70} },
    'Tyranitar':  { types:['Rock','Dark'],     ability:'Sand Stream', baseStats:{hp:100,atk:164,def:150,spa:95,spd:120,spe:71} },
    'Venusaur':   { types:['Grass','Poison'],  ability:'Thick Fat',   baseStats:{hp:80,atk:100,def:123,spa:122,spd:120,spe:80} },
    'Victreebel': { types:['Grass','Poison'],  ability:'Innards Out', baseStats:{hp:80,atk:125,def:85,spa:135,spd:95,spe:70} },
  };

  const NATURES = {
    'Hardy':   { plus: null,    minus: null    },
    'Lonely':  { plus: 'atk',   minus: 'def'   },
    'Brave':   { plus: 'atk',   minus: 'spe'   },
    'Adamant': { plus: 'atk',   minus: 'spa'   },
    'Naughty': { plus: 'atk',   minus: 'spd'   },
    'Bold':    { plus: 'def',   minus: 'atk'   },
    'Docile':  { plus: null,    minus: null    },
    'Relaxed': { plus: 'def',   minus: 'spe'   },
    'Impish':  { plus: 'def',   minus: 'spa'   },
    'Lax':     { plus: 'def',   minus: 'spd'   },
    'Timid':   { plus: 'spe',   minus: 'atk'   },
    'Hasty':   { plus: 'spe',   minus: 'def'   },
    'Serious': { plus: null,    minus: null    },
    'Jolly':   { plus: 'spe',   minus: 'spa'   },
    'Naive':   { plus: 'spe',   minus: 'spd'   },
    'Modest':  { plus: 'spa',   minus: 'atk'   },
    'Mild':    { plus: 'spa',   minus: 'def'   },
    'Quiet':   { plus: 'spa',   minus: 'spe'   },
    'Bashful': { plus: null,    minus: null    },
    'Rash':    { plus: 'spa',   minus: 'spd'   },
    'Calm':    { plus: 'spd',   minus: 'atk'   },
    'Gentle':  { plus: 'spd',   minus: 'def'   },
    'Sassy':   { plus: 'spd',   minus: 'spe'   },
    'Careful': { plus: 'spd',   minus: 'spa'   },
    'Quirky':  { plus: null,    minus: null    },
  };

  const MAX_SP = 66;
  const MAX_SP_PER_STAT = 32;
  const STAT_KEYS = ['hp','atk','def','spa','spd','spe'];

  function _norm(s) {
    return s.toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  function _pokemonByName(name) {
    const n = _norm(name);
    return LEGAL_POKEMON.find(p => _norm(p.name) === n);
  }

  function isLegalPokemon(name) {
    return !!_pokemonByName(name);
  }

  function isLegalItem(name) {
    const n = _norm(name);
    return LEGAL_ITEMS.some(i => _norm(i) === n);
  }

  function isLegalMove(name) {
    const n = _norm(name);
    return LEGAL_MOVES.some(m => _norm(m) === n);
  }

  function getPokemonData(name) {
    return _pokemonByName(name) || null;
  }

  function getMegaStones(pokemonName) {
    return MEGA_STONES_PER_POKEMON[pokemonName] || [];
  }

  function isMegaStoneLegal(pokemonName, itemName) {
    const stones = getMegaStones(pokemonName);
    const iname = _norm(itemName);
    return stones.some(s => _norm(s) === iname);
  }

  function validateSP(sp) {
    const errors = [];
    const total = STAT_KEYS.reduce((s, k) => s + (sp[k] || 0), 0);
    if (total > MAX_SP) errors.push(`SP total ${total} excede el máximo de ${MAX_SP}`);
    for (const k of STAT_KEYS) {
      if ((sp[k] || 0) > MAX_SP_PER_STAT) {
        errors.push(`${k.toUpperCase()} tiene ${sp[k]} SP, máximo ${MAX_SP_PER_STAT}`);
      }
      if ((sp[k] || 0) < 0) {
        errors.push(`${k.toUpperCase()} no puede ser negativo`);
      }
    }
    return errors;
  }

  function validateSpeciesClause(team) {
    const seen = {};
    const errors = [];
    for (let i = 0; i < team.length; i++) {
      const p = team[i];
      if (!p || !p.species) continue;
      const data = getPokemonData(p.species);
      if (!data) continue;
      const key = _norm(data.name);
      if (seen[key] !== undefined) {
        errors.push(`Cláusula de especie: "${p.species}" duplicado (slots ${seen[key]+1} y ${i+1})`);
      } else {
        seen[key] = i;
      }
    }
    return errors;
  }

  function validateItemClause(team) {
    const seen = {};
    const errors = [];
    for (let i = 0; i < team.length; i++) {
      const p = team[i];
      if (!p || !p.item) continue;
      const key = _norm(p.item);
      if (seen[key] !== undefined) {
        errors.push(`Cláusula de objeto: "${p.item}" duplicado (slots ${seen[key]+1} y ${i+1})`);
      } else {
        seen[key] = i;
      }
    }
    return errors;
  }

  function validatePokemon(pokemon, team, slotIndex) {
    const errors = [];
    if (!pokemon || !pokemon.species) {
      errors.push({ slot: slotIndex, field: 'species', msg: 'Pokémon sin especificar' });
      return errors;
    }
    if (!isLegalPokemon(pokemon.species)) {
      errors.push({ slot: slotIndex, field: 'species', msg: `"${pokemon.species}" no es legal en Regulación M-B` });
    }
    if (pokemon.item && !isLegalItem(pokemon.item)) {
      errors.push({ slot: slotIndex, field: 'item', msg: `"${pokemon.item}" no es un objeto legal en M-B` });
    }
    if (pokemon.item && pokemon.species) {
      const data = getPokemonData(pokemon.species);
      if (data && data.mega) {
        const stones = getMegaStones(pokemon.species);
        if (stones.length > 0 && !isMegaStoneLegal(pokemon.species, pokemon.item)) {
          const legalItems = LEGAL_ITEMS.filter(i => !i.includes('ite') || i.includes('Berry') || i.includes('Orb'));
        }
      }
    }
    if (pokemon.ability) {
      const data = getPokemonData(pokemon.species);
      if (data && data.abilities) {
        const abilityNorm = _norm(pokemon.ability);
        const legal = data.abilities.some(a => _norm(a) === abilityNorm);
        if (!legal) {
          errors.push({ slot: slotIndex, field: 'ability', msg: `"${pokemon.ability}" no es una habilidad legal para ${pokemon.species} en Champions` });
        }
      }
    }
    if (!pokemon.moves || pokemon.moves.length !== 4) {
      errors.push({ slot: slotIndex, field: 'moves', msg: `Exactamente 4 movimientos requeridos (actual: ${pokemon.moves ? pokemon.moves.length : 0})` });
    }
    for (let m = 0; m < (pokemon.moves || []).length; m++) {
      const move = pokemon.moves[m];
      if (!move) continue;
      if (!isLegalMove(move)) {
        errors.push({ slot: slotIndex, field: 'moves', msg: `"${move}" no es un movimiento legal en M-B` });
      }
    }
    const spErrors = validateSP(pokemon.sp || {});
    for (const msg of spErrors) {
      errors.push({ slot: slotIndex, field: 'sp', msg });
    }
    return errors;
  }

  function validateTeam(team) {
    let errors = [];
    for (let i = 0; i < team.length; i++) {
      if (team[i]) {
        errors = errors.concat(validatePokemon(team[i], team, i));
      }
    }
    errors = errors.concat(validateSpeciesClause(team));
    errors = errors.concat(validateItemClause(team));
    return errors;
  }

  function convertSPtoEVs(sp) {
    const evs = {};
    for (const k of STAT_KEYS) {
      const val = sp[k] || 0;
      if (val === 0) { evs[k] = 0; continue; }
      evs[k] = 4 + (val - 1) * 8;
    }
    return evs;
  }

  function convertEVsToSP(evs) {
    const sp = {};
    const evTotal = STAT_KEYS.reduce((s, k) => s + (evs[k] || 0), 0);

    if (evTotal <= MAX_SP) {
      for (const k of STAT_KEYS) {
        sp[k] = Math.min(MAX_SP_PER_STAT, Math.max(0, evs[k] || 0));
      }
    } else {
      for (const k of STAT_KEYS) {
        const val = evs[k] || 0;
        if (val === 0) { sp[k] = 0; }
        else if (val <= 4) { sp[k] = 1; }
        else { sp[k] = Math.min(MAX_SP_PER_STAT, Math.floor((val - 4) / 8) + 1); }
      }
      let spTotal = STAT_KEYS.reduce((s, k) => s + sp[k], 0);
      while (spTotal > MAX_SP) {
        for (let i = STAT_KEYS.length - 1; i >= 0 && spTotal > MAX_SP; i--) {
          if (sp[STAT_KEYS[i]] > 0) { sp[STAT_KEYS[i]]--; spTotal--; }
        }
      }
    }
    return sp;
  }

  function searchPokemon(query, limit) {
    let q = (query || '').replace(/\s*\(M\)\s*$/i, '').replace(/\s*\(F\)\s*$/i, '').replace(/\s*\(N\)\s*$/i, '').trim();
    q = _norm(q);
    const results = LEGAL_POKEMON
      .filter(p => !q || _norm(p.name).includes(q))
      .map(p => ({ name: p.name, types: p.types, baseStats: p.baseStats }));
    return limit ? results.slice(0, limit) : results;
  }

  function searchItems(query, limit) {
    const q = _norm(query || '');
    const results = LEGAL_ITEMS.filter(i => !q || _norm(i).includes(q));
    return limit ? results.slice(0, limit) : results;
  }

  function searchMoves(query, limit) {
    const q = _norm(query || '');
    const results = LEGAL_MOVES.filter(m => !q || _norm(m).includes(q));
    return limit ? results.slice(0, limit) : results;
  }

  function getNatureMultiplier(nature) {
    const n = NATURES[nature];
    if (!n || !n.plus || !n.minus) return {};
    return { [n.plus]: 1.1, [n.minus]: 0.9 };
  }

  function calculateStat(baseStat, nature, sp) {
    const mult = getNatureMultiplier(nature);
    let natureMult = 1;
    return baseStat + (sp || 0);
  }

  function normalizeMegaName(species) {
    if (!species) return { base: species, megaStone: '' };
    const megaMatch = species.match(/^(.+?)\s*[-–]\s*Mega(?:\s*(X|Y))?$/i);
    if (!megaMatch) return { base: species, megaStone: '' };
    const base = megaMatch[1].trim();
    const suffix = megaMatch[2] ? megaMatch[2].toUpperCase() : '';
    let stone = '';
    const stones = MEGA_STONES_PER_POKEMON[base];
    if (stones) {
      if (suffix === 'X' && stones.length > 1) stone = stones[0];
      else if (suffix === 'Y' && stones.length > 1) stone = stones[1];
      else stone = stones[0];
    }
    return { base, megaStone: stone };
  }

  function hasDualMega(species) {
    const data = MEGA_DATA[species];
    return !!(data && data.X && data.Y);
  }

  function getMegaData(species, form) {
    const data = MEGA_DATA[species];
    if (!data) return null;
    if (hasDualMega(species)) {
      if (!form) return null;
      return data[form] || null;
    }
    return data;
  }

  function canMegaEvolve(species) {
    return !!MEGA_DATA[species];
  }

  return {
    LEGAL_POKEMON,
    LEGAL_ITEMS,
    LEGAL_MOVES,
    MEGA_STONES_PER_POKEMON,
    NATURES,
    MAX_SP,
    MAX_SP_PER_STAT,
    STAT_KEYS,
    isLegalPokemon,
    isLegalItem,
    isLegalMove,
    getPokemonData,
    getMegaStones,
    isMegaStoneLegal,
    validateSP,
    validateSpeciesClause,
    validateItemClause,
    validatePokemon,
    validateTeam,
    convertSPtoEVs,
    convertEVsToSP,
    searchPokemon,
    searchItems,
    searchMoves,
    getNatureMultiplier,
    calculateStat,
    normalizeMegaName,
    MEGA_DATA,
    hasDualMega,
    getMegaData,
    canMegaEvolve,
  };
})();
