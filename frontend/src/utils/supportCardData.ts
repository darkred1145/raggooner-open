import type { SupportCardType } from '../types';

export interface SupportCard {
    id: string;
    name: string;
    type: SupportCardType;
    rarity: 'SSR' | 'SR' | 'R';
    cardName: string;
    /** Base power at Lv.1, max power at Lv.80 (SSR) or Lv.70 (SR) or Lv.60 (R) */
    power: number;
    /** Max power at level cap (SSR=80, SR=70, R=60) */
    maxPower: number;
}

export const SUPPORT_CARD_DICT: Record<string, SupportCard> = {
    'admire-vega-power':        { id: 'admire-vega-power',        name: 'Admire Vega',        cardName: 'Lucky Star In The Sky',                                      type: 'power',   rarity: 'SSR', power: 105, maxPower: 720 },
    'agnes-digital-power':      { id: 'agnes-digital-power',      name: 'Agnes Digital',      cardName: 'A Fan\'s Joy',                                               type: 'power',   rarity: 'SSR', power: 100, maxPower: 700 },
    'air-shakur-wit':           { id: 'air-shakur-wit',           name: 'Air Shakur',         cardName: '7 Centimeters Ahead',                                        type: 'wit',     rarity: 'SSR', power: 95,  maxPower: 680 },
    'air-shakur-speed':         { id: 'air-shakur-speed',         name: 'Air Shakur',         cardName: 'Mag!c Number',                                               type: 'speed',   rarity: 'SSR', power: 105, maxPower: 730 },
    'bamboo-memory-power':      { id: 'bamboo-memory-power',      name: 'Bamboo Memory',      cardName: 'Head-on Fight!',                                             type: 'power',   rarity: 'SSR', power: 100, maxPower: 700 },
    'curren-chan-wit':          { id: 'curren-chan-wit',          name: 'Curren Chan',        cardName: 'Cutie Pie with Shining Eyes',                                type: 'wit',     rarity: 'SSR', power: 90,  maxPower: 660 },
    'daitaku-helios-power':     { id: 'daitaku-helios-power',     name: 'Daitaku Helios',     cardName: 'Make! Some! NOISE!',                                         type: 'power',   rarity: 'SSR', power: 100, maxPower: 700 },
    'biko-pegasus-speed':       { id: 'biko-pegasus-speed',       name: 'Biko Pegasus',       cardName: 'Double Carrot Punch!',                                       type: 'speed',   rarity: 'SSR', power: 95,  maxPower: 690 },
    'daiwa-scarlet-power':      { id: 'daiwa-scarlet-power',      name: 'Daiwa Scarlet',      cardName: 'Mini☆Vacation',                                              type: 'power',   rarity: 'SSR', power: 100, maxPower: 700 },
    'el-condor-pasa-power':     { id: 'el-condor-pasa-power',     name: 'El Condor Pasa',     cardName: 'Champion\'s Passion',                                        type: 'power',   rarity: 'SSR', power: 105, maxPower: 720 },
    'fine-motion-wit':          { id: 'fine-motion-wit',          name: 'Fine Motion',        cardName: 'Wave of Gratitude',                                          type: 'wit',     rarity: 'SSR', power: 90,  maxPower: 650 },
    'gold-city-speed':          { id: 'gold-city-speed',          name: 'Gold City',          cardName: 'Run(my)way',                                                 type: 'speed',   rarity: 'SSR', power: 100, maxPower: 710 },
    'gold-ship-stamina':        { id: 'gold-ship-stamina',        name: 'Gold Ship',          cardName: 'Breakaway Battleship',                                       type: 'stamina', rarity: 'SSR', power: 95,  maxPower: 690 },
    'gold-ship-speed':          { id: 'gold-ship-speed',          name: 'Gold Ship',          cardName: 'That Time I Became The Strongest',                           type: 'speed',   rarity: 'SSR', power: 100, maxPower: 710 },
    'grass-wonder-guts':        { id: 'grass-wonder-guts',        name: 'Grass Wonder',       cardName: 'Fairest Fleur',                                              type: 'guts',    rarity: 'SSR', power: 95,  maxPower: 680 },
    'haru-urara-guts':          { id: 'haru-urara-guts',          name: 'Haru Urara',         cardName: 'Urara\'s Day Off!',                                          type: 'guts',    rarity: 'SSR', power: 90,  maxPower: 660 },
    'hishi-akebono-guts':       { id: 'hishi-akebono-guts',       name: 'Hishi Akebono',      cardName: 'Who Wants the First Bite?',                                  type: 'guts',    rarity: 'SSR', power: 90,  maxPower: 650 },
    'ikuno-dictus-guts':        { id: 'ikuno-dictus-guts',        name: 'Ikuno Dictus',       cardName: 'Warm Heart, Soft Steps',                                     type: 'guts',    rarity: 'SSR', power: 85,  maxPower: 640 },
    'ines-fujin-guts':          { id: 'ines-fujin-guts',          name: 'Ines Fujin',         cardName: 'Watch My Star Fly!',                                         type: 'guts',    rarity: 'SSR', power: 90,  maxPower: 660 },
    'kawakami-princess-speed':  { id: 'kawakami-princess-speed',  name: 'Kawakami Princess',  cardName: 'Princess Bride',                                             type: 'speed',   rarity: 'SSR', power: 100, maxPower: 700 },
    'manhattan-cafe-stamina':   { id: 'manhattan-cafe-stamina',   name: 'Manhattan Cafe',     cardName: 'My Solo Spun in Spiraling Runs',                             type: 'stamina', rarity: 'SSR', power: 95,  maxPower: 690 },
    'marvelous-sunday-power':   { id: 'marvelous-sunday-power',   name: 'Marvelous Sunday',   cardName: 'Dazzling Day in the Snow',                                   type: 'power',   rarity: 'SSR', power: 100, maxPower: 700 },
    'marvelous-sunday-guts':    { id: 'marvelous-sunday-guts',    name: 'Marvelous Sunday',   cardName: 'A MORE MARVELOUS WORLD!⭐️',                                  type: 'guts',    rarity: 'SSR', power: 95,  maxPower: 680 },
    'mayano-top-gun-speed':     { id: 'mayano-top-gun-speed',     name: 'Mayano Top Gun',     cardName: 'Party Formation',                                            type: 'speed',   rarity: 'SSR', power: 95,  maxPower: 690 },
    'king-halo-power':          { id: 'king-halo-power',          name: 'King Halo',          cardName: 'Tonight, We Waltz',                                          type: 'power',   rarity: 'SSR', power: 100, maxPower: 700 },
    'kitasan-black-speed':      { id: 'kitasan-black-speed',      name: 'Kitasan Black',      cardName: 'Fire at My Heels!',                                          type: 'speed',   rarity: 'SSR', power: 110, maxPower: 750 },
    'matikanefukukitaru-speed': { id: 'matikanefukukitaru-speed', name: 'Matikanefukukitaru', cardName: 'Touching Sleeves Is Good Luck!♪',                            type: 'speed',   rarity: 'SSR', power: 95,  maxPower: 690 },
    'matikanetannhauser-guts':  { id: 'matikanetannhauser-guts',  name: 'Matikanetannhauser', cardName: 'Just Keep Going',                                            type: 'guts',    rarity: 'SSR', power: 90,  maxPower: 660 },
    'meisho-doto-stamina':      { id: 'meisho-doto-stamina',      name: 'Meisho Doto',     cardName: 'Leaping Into The Unknown',                                      type: 'stamina', rarity: 'SSR', power: 95,  maxPower: 690 },
    'mejiro-bright-stamina':    { id: 'mejiro-bright-stamina',    name: 'Mejiro Bright',      cardName: 'Little by Little',                                           type: 'stamina', rarity: 'SSR', power: 90,  maxPower: 660 },
    'mejiro-dober-wit':         { id: 'mejiro-dober-wit',         name: 'Mejiro Dober',       cardName: 'My Thoughts, My Desires',                                    type: 'wit',     rarity: 'SSR', power: 90,  maxPower: 660 },
    'mejiro-mcqueen-stamina':   { id: 'mejiro-mcqueen-stamina',   name: 'Mejiro McQueen',     cardName: 'Your Team Ace',                                              type: 'stamina', rarity: 'SSR', power: 100, maxPower: 710 },
    'mejiro-palmer-guts':       { id: 'mejiro-palmer-guts',       name: 'Mejiro Palmer',      cardName: 'Go Ahead and Laugh',                                         type: 'guts',    rarity: 'SSR', power: 95,  maxPower: 680 },
    'mejiro-ryan-guts':         { id: 'mejiro-ryan-guts',         name: 'Mejiro Ryan',        cardName: 'Winning Pitch',                                              type: 'guts',    rarity: 'SSR', power: 95,  maxPower: 680 },
    'mihono-bourbon-wit':       { id: 'mihono-bourbon-wit',       name: 'Mihono Bourbon',     cardName: 'The Ghost Finds Halloween Magic',                            type: 'wit',     rarity: 'SSR', power: 95,  maxPower: 680 },
    'nakayama-festa-stamina':   { id: 'nakayama-festa-stamina',   name: 'Nakayama Festa',     cardName: '43, 8, 1',                                                   type: 'stamina', rarity: 'SSR', power: 90,  maxPower: 670 },
    'narita-brian-stamina':     { id: 'narita-brian-stamina',     name: 'Narita Brian',       cardName: 'The Whistling Arrow\'s Taunt',                               type: 'stamina', rarity: 'SSR', power: 100, maxPower: 710 },
    'narita-brian-speed':       { id: 'narita-brian-speed',       name: 'Narita Brian',       cardName: 'Two Pieces',                                                 type: 'speed',   rarity: 'SSR', power: 105, maxPower: 740 },
    'narita-taishin-wit':       { id: 'narita-taishin-wit',       name: 'Narita Taishin',     cardName: 'Strict Shopper',                                             type: 'wit',     rarity: 'SSR', power: 90,  maxPower: 660 },
    'narita-top-road-speed':    { id: 'narita-top-road-speed',    name: 'Narita Top Road',    cardName: 'Peachy Silhouette',                                          type: 'speed',   rarity: 'SSR', power: 95,  maxPower: 690 },
    'nice-nature-wit':          { id: 'nice-nature-wit',          name: 'Nice Nature',        cardName: 'Daring to Dream',                                            type: 'wit',     rarity: 'SSR', power: 95,  maxPower: 680 },
    'nishino-flower-wit':       { id: 'nishino-flower-wit',       name: 'Nishino Flower',     cardName: 'Little Cupcakes, Big Emotions',                              type: 'wit',     rarity: 'SSR', power: 90,  maxPower: 660 },
    'nishino-flower-speed':     { id: 'nishino-flower-speed',     name: 'Nishino Flower',     cardName: 'Even the Littlest Bud',                                      type: 'speed',   rarity: 'SSR', power: 95,  maxPower: 690 },
    'oguri-cap-power':          { id: 'oguri-cap-power',          name: 'Oguri Cap',          cardName: 'Get Lots of Hugs for Me',                                    type: 'power',   rarity: 'SSR', power: 110, maxPower: 750 },
    'rice-shower-stamina':      { id: 'rice-shower-stamina',      name: 'Rice Shower',        cardName: 'Showered In Joy',                                            type: 'stamina', rarity: 'SSR', power: 95,  maxPower: 690 },
    'rice-shower-power':        { id: 'rice-shower-power',        name: 'Rice Shower',        cardName: 'Happiness Just around the Bend',                             type: 'power',   rarity: 'SSR', power: 100, maxPower: 710 },
    'riko-kashimoto-pal':       { id: 'riko-kashimoto-pal',       name: 'Riko Kashimoto',     cardName: 'Planned Perfection',                                         type: 'pal',     rarity: 'SSR', power: 85,  maxPower: 620 },
    'sakura-bakushin-o-guts':   { id: 'sakura-bakushin-o-guts',   name: 'Sakura Bakushin O',  cardName: 'Super! Sonic! Flower Power!',                                type: 'guts',    rarity: 'SSR', power: 95,  maxPower: 680 },
    'sakura-bakushin-o-speed':  { id: 'sakura-bakushin-o-speed',  name: 'Sakura Bakushin O',  cardName: 'Eat Fast! Yum Fast!',                                        type: 'speed',   rarity: 'SSR', power: 100, maxPower: 700 },
    'sakura-chiyono-o-stamina': { id: 'sakura-chiyono-o-stamina', name: 'Sakura Chiyono O',   cardName: 'Peak Sakura Season',                                         type: 'stamina', rarity: 'SSR', power: 90,  maxPower: 670 },
    'sasami-anshinzawa-pal':    { id: 'sasami-anshinzawa-pal',    name: 'Sasami Anshinzawa',  cardName: 'This Might Sting!',                                          type: 'pal',     rarity: 'SSR', power: 85,  maxPower: 620 },
    'satono-diamond-wit':       { id: 'satono-diamond-wit',       name: 'Satono Diamond',     cardName: 'Special Dreamers!',                                          type: 'wit',     rarity: 'SSR', power: 100, maxPower: 700 },
    'satono-diamond-stamina':   { id: 'satono-diamond-stamina',   name: 'Satono Diamond',     cardName: 'The Will to Overtake',                                       type: 'stamina', rarity: 'SSR', power: 95,  maxPower: 690 },
    'seiun-sky-stamina':        { id: 'seiun-sky-stamina',        name: 'Seiun Sky',          cardName: 'Foolproof Plan',                                             type: 'stamina', rarity: 'SSR', power: 95,  maxPower: 690 },
    'seiun-sky-wit':            { id: 'seiun-sky-wit',            name: 'Seiun Sky',          cardName: 'Paint the Sky Red',                                          type: 'wit',     rarity: 'SSR', power: 95,  maxPower: 680 },
    'silence-suzuka-speed-2':   { id: 'silence-suzuka-speed-2',   name: 'Silence Suzuka',     cardName: 'Searching for Unseen Sights',                                type: 'speed',   rarity: 'SSR', power: 105, maxPower: 740 },
    'silence-suzuka-speed':     { id: 'silence-suzuka-speed',     name: 'Silence Suzuka',     cardName: 'Beyond the Shining Scenery',                                 type: 'speed',   rarity: 'SSR', power: 110, maxPower: 750 },
    'silence-suzuka-stamina':   { id: 'silence-suzuka-stamina',   name: 'Silence Suzuka',     cardName: 'Winning Dream',                                              type: 'stamina', rarity: 'SSR', power: 95,  maxPower: 690 },
    'sirius-symboli-wit':   { id: 'sirius-symboli-wit',   name: 'Sirius Symboli',     cardName: 'Escorte Étoile',                                              type: 'wit', rarity: 'SSR', power: 95,  maxPower: 680 },
    'smart-falcon-power':       { id: 'smart-falcon-power',       name: 'Smart Falcon',       cardName: 'My Umadol Way! ☆',                                           type: 'power',   rarity: 'SSR', power: 100, maxPower: 700 },
    'special-week-guts':        { id: 'special-week-guts',        name: 'Special Week',       cardName: 'The Brightest Star in Japan!',                               type: 'guts',    rarity: 'SSR', power: 100, maxPower: 700 },
    'special-week-speed':       { id: 'special-week-speed',       name: 'Special Week',       cardName: 'The Setting Sun and Rising Stars',                           type: 'speed',   rarity: 'SSR', power: 100, maxPower: 710 },
    'super-creek-stamina':      { id: 'super-creek-stamina',      name: 'Super Creek',        cardName: 'Piece of Mind',                                              type: 'stamina', rarity: 'SSR', power: 95,  maxPower: 690 },
    'sweep-tosho-speed':        { id: 'sweep-tosho-speed',        name: 'Sweep Tosho',        cardName: 'It\'s All Mine!',                                            type: 'speed',   rarity: 'SSR', power: 100, maxPower: 700 },
    'symboli-rudolf-stamina':        { id: 'symboli-rudolf-stamina',        name: 'Symboli Rudolf',        cardName: 'Enchaînement',                                            type: 'stamina',   rarity: 'SSR', power: 100, maxPower: 710 },
    'tamamo-cross-stamina':     { id: 'tamamo-cross-stamina',     name: 'Tamamo Cross',       cardName: 'Split the Sky, White Lightning!',                            type: 'stamina', rarity: 'SSR', power: 95,  maxPower: 690 },
    'tamamo-cross-power':       { id: 'tamamo-cross-power',       name: 'Tamamo Cross',       cardName: 'Beware! Halloween Night!',                                   type: 'power',   rarity: 'SSR', power: 100, maxPower: 700 },
    'tazuna-hayakawa-pal':      { id: 'tazuna-hayakawa-pal',      name: 'Tazuna Hayakawa',    cardName: 'Tracen Reception',                                           type: 'pal',     rarity: 'SSR', power: 90,  maxPower: 640 },
    'team-sirius-group':      { id: 'team-sirius-group',      name: 'Team Sirius',    cardName: 'Passing the Dream On',                                           type: 'group',     rarity: 'SSR', power: 80,  maxPower: 580 },
    'tosen-jordan-speed':       { id: 'tosen-jordan-speed',       name: 'Tosen Jordan',       cardName: 'My Way',                                                     type: 'speed',   rarity: 'SSR', power: 95,  maxPower: 690 },
    'tokai-teio-speed':         { id: 'tokai-teio-speed',         name: 'Tokai Teio',         cardName: 'Dream Big!',                                                 type: 'speed',   rarity: 'SSR', power: 105, maxPower: 730 },
    'twin-turbo-speed':         { id: 'twin-turbo-speed',         name: 'Twin Turbo',         cardName: 'Turbo Booooost',                                             type: 'speed',   rarity: 'SSR', power: 95,  maxPower: 690 },
    'vodka-power':              { id: 'vodka-power',              name: 'Vodka',              cardName: 'Wild Rider',                                                 type: 'power',   rarity: 'SSR', power: 105, maxPower: 720 },
    'winning-ticket-guts':      { id: 'winning-ticket-guts',      name: 'Winning Ticket',     cardName: 'B・N・Winner!!',                                              type: 'guts',    rarity: 'SSR', power: 95,  maxPower: 680 },
    'winning-ticket-power':     { id: 'winning-ticket-power',     name: 'Winning Ticket',     cardName: 'Dreams Do Come True!',                                       type: 'power',   rarity: 'SSR', power: 100, maxPower: 700 },
    'winning-ticket-stamina':   { id: 'winning-ticket-stamina',   name: 'Winning Ticket',     cardName: 'Full-Blown Tantrum',                                         type: 'stamina', rarity: 'SSR', power: 90,  maxPower: 670 },
    'yaeno-muteki-power':       { id: 'yaeno-muteki-power',       name: 'Yaeno Muteki',       cardName: 'Fiery Discipline',                                           type: 'power',   rarity: 'SSR', power: 100, maxPower: 700 },
    'yukino-bijin-guts':        { id: 'yukino-bijin-guts',        name: 'Yukino Bijin',       cardName: 'Dancing Light into the Night',                               type: 'guts',    rarity: 'SSR', power: 90,  maxPower: 660 },
    'yukino-bijin-wit':         { id: 'yukino-bijin-wit',         name: 'Yukino Bijin',       cardName: 'Hometown Cheers',                                            type: 'wit',     rarity: 'SSR', power: 90,  maxPower: 660 },
    'zenno-rob-roy-speed':      { id: 'zenno-rob-roy-speed',      name: 'Zenno Rob Roy',      cardName: 'Magical Heroine',                                            type: 'speed',   rarity: 'SSR', power: 100, maxPower: 710 },
};

export const SUPPORT_CARD_LIST = Object.values(SUPPORT_CARD_DICT);

export const SUPPORT_CARD_TYPE_META: Record<SupportCardType, { label: string; color: string; bg: string }> = {
    speed:   { label: 'Speed',   color: 'text-sky-400',     bg: 'bg-sky-500/15'     },
    stamina: { label: 'Stamina', color: 'text-rose-400',    bg: 'bg-rose-500/15'    },
    power:   { label: 'Power',   color: 'text-orange-400',  bg: 'bg-orange-500/15'  },
    guts:    { label: 'Guts',    color: 'text-yellow-400',  bg: 'bg-yellow-500/15'  },
    wit:     { label: 'Wit',     color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
    group:   { label: 'Group',   color: 'text-violet-400',  bg: 'bg-violet-500/15'  },
    pal:     { label: 'Pal',     color: 'text-fuchsia-400', bg: 'bg-fuchsia-500/15' },
};
