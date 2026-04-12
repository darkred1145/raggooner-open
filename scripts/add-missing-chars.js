/**
 * Adds missing Global characters to umaData.ts.
 * Run: node scripts/add-missing-chars.js
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'frontend', 'src', 'utils', 'umaData.ts');
let content = fs.readFileSync(filePath, 'utf8');

const missingChars = [
    { key: 'Curren Chan', name: 'Curren Chan', id: 103801, slug: 'curren-chan', stars: 3, date: '2025-07-27', stats: 'SPD +10% / PWR +20%', turf: 'A', dirt: 'G', s: 'B', m: 'A', d: 'B', l: 'E', f: 'A', p: 'B', ls: 'G', e: 'G' },
    { key: 'Daiwa Scarlet', name: 'Daiwa Scarlet', id: 100901, slug: 'daiwa-scarlet', stars: 2, date: '2025-06-26', stats: 'SPD +10% / GUT +20%', turf: 'A', dirt: 'G', s: 'C', m: 'A', d: 'A', l: 'B', f: 'C', p: 'B', ls: 'A', e: 'G' },
    { key: 'El Condor Pasa', name: 'El Condor Pasa', id: 101401, slug: 'el-condor-pasa', stars: 2, date: '2025-06-26', stats: 'SPD +20% / WIT +10%', turf: 'A', dirt: 'G', s: 'G', m: 'A', d: 'A', l: 'F', f: 'G', p: 'A', ls: 'A', e: 'G' },
    { key: 'Eishin Flash', name: 'Eishin Flash', id: 103701, slug: 'eishin-flash', stars: 3, date: '2025-10-30', stats: 'PWR +10% / WIT +20%', turf: 'A', dirt: 'G', s: 'F', m: 'C', d: 'A', l: 'A', f: 'G', p: 'B', ls: 'A', e: 'B' },
    { key: 'Gold City', name: 'Gold City', id: 104001, slug: 'gold-city', stars: 3, date: '2025-10-07', stats: 'PWR +10% / GUT +20%', turf: 'A', dirt: 'G', s: 'E', m: 'C', d: 'A', l: 'A', f: 'G', p: 'B', ls: 'A', e: 'B' },
    { key: 'Grass Wonder', name: 'Grass Wonder', id: 101101, slug: 'grass-wonder', stars: 2, date: '2025-06-26', stats: 'SPD +20% / PWR +10%', turf: 'A', dirt: 'G', s: 'G', m: 'A', d: 'A', l: 'B', f: 'G', p: 'A', ls: 'A', e: 'G' },
    { key: 'Hishi Amazon', name: 'Hishi Amazon', id: 101201, slug: 'hishi-amazon', stars: 3, date: '2025-09-17', stats: 'PWR +20% / GUT +10%', turf: 'A', dirt: 'D', s: 'A', m: 'A', d: 'B', l: 'C', f: 'A', p: 'B', ls: 'E', e: 'G' },
    { key: 'Kawakami Princess', name: 'Kawakami Princess', id: 103901, slug: 'kawakami-princess', stars: 3, date: '2025-12-01', stats: 'PWR +10% / GUT +20%', turf: 'A', dirt: 'G', s: 'E', m: 'C', d: 'A', l: 'A', f: 'G', p: 'C', ls: 'A', e: 'A' },
    { key: 'Manhattan Cafe', name: 'Manhattan Cafe', id: 102501, slug: 'manhattan-cafe', stars: 3, date: '2025-12-08', stats: 'STA +30%', turf: 'A', dirt: 'G', s: 'F', m: 'F', d: 'A', l: 'S', f: 'G', p: 'F', ls: 'A', e: 'A' },
    { key: 'Matikanefukukitaru', name: 'Matikanefukukitaru', id: 105601, slug: 'matikanefukukitaru', stars: 1, date: '2025-06-26', stats: 'STA +20% / PWR +10%', turf: 'A', dirt: 'E', s: 'G', m: 'C', d: 'A', l: 'A', f: 'E', p: 'C', ls: 'A', e: 'G' },
    { key: 'Matikanetannhauser', name: 'Matikanetannhauser', id: 106201, slug: 'matikanetannhauser', stars: 2, date: '2026-03-12', stats: 'STA +20% / GUT +10%', turf: 'A', dirt: 'G', s: 'G', m: 'A', d: 'A', l: 'E', f: 'A', p: 'A', ls: 'E', e: 'G' },
    { key: 'Mayano Top Gun', name: 'Mayano Top Gun', id: 102401, slug: 'mayano-top-gun', stars: 2, date: '2025-06-26', stats: 'STA +20% / GUT +10%', turf: 'A', dirt: 'E', s: 'G', m: 'C', d: 'A', l: 'A', f: 'G', p: 'C', ls: 'A', e: 'A' },
    { key: 'Meisho Doto', name: 'Meisho Doto', id: 105801, slug: 'meisho-doto', stars: 3, date: '2025-10-21', stats: 'STA +20% / GUT +10%', turf: 'A', dirt: 'D', s: 'G', m: 'G', d: 'A', l: 'A', f: 'G', p: 'F', ls: 'A', e: 'A' },
    { key: 'Mejiro Ardan', name: 'Mejiro Ardan', id: 107101, slug: 'mejiro-ardan', stars: 3, date: '2026-02-25', stats: 'SPD +10% / WIT +20%', turf: 'A', dirt: 'D', s: 'C', m: 'C', d: 'A', l: 'A', f: 'G', p: 'C', ls: 'A', e: 'A' },
    { key: 'Mejiro McQueen', name: 'Mejiro McQueen', id: 101301, slug: 'mejiro-mcqueen', stars: 3, date: '2025-06-26', stats: 'STA +20% / WIT +10%', turf: 'A', dirt: 'G', s: 'E', m: 'C', d: 'A', l: 'S', f: 'G', p: 'B', ls: 'A', e: 'A' },
    { key: 'Mejiro Ryan', name: 'Mejiro Ryan', id: 102701, slug: 'mejiro-ryan', stars: 1, date: '2025-06-26', stats: 'PWR +20% / WIT +10%', turf: 'A', dirt: 'G', s: 'G', m: 'A', d: 'A', l: 'E', f: 'G', p: 'A', ls: 'A', e: 'G' },
    { key: 'Mihono Bourbon', name: 'Mihono Bourbon', id: 102601, slug: 'mihono-bourbon', stars: 3, date: '2025-07-02', stats: 'STA +20% / PWR +10%', turf: 'A', dirt: 'G', s: 'F', m: 'C', d: 'A', l: 'A', f: 'A', p: 'B', ls: 'E', e: 'G' },
    { key: 'Narita Brian', name: 'Narita Brian', id: 101601, slug: 'narita-brian', stars: 3, date: '2025-08-20', stats: 'SPD +10% / STA +20%', turf: 'A', dirt: 'G', s: 'E', m: 'C', d: 'A', l: 'A', f: 'C', p: 'A', ls: 'A', e: 'G' },
    { key: 'Narita Taishin', name: 'Narita Taishin', id: 105001, slug: 'narita-taishin', stars: 3, date: '2025-08-03', stats: 'SPD +10% / GUT +20%', turf: 'A', dirt: 'F', s: 'C', m: 'A', d: 'B', l: 'C', f: 'C', p: 'B', ls: 'A', e: 'G' },
    { key: 'Nice Nature', name: 'Nice Nature', id: 106001, slug: 'nice-nature', stars: 1, date: '2025-06-26', stats: 'PWR +20% / WIT +10%', turf: 'A', dirt: 'E', s: 'G', m: 'C', d: 'A', l: 'A', f: 'G', p: 'C', ls: 'A', e: 'A' },
    { key: 'Sakura Bakushin O', name: 'Sakura Bakushin O', id: 104101, slug: 'sakura-bakushin-o', stars: 1, date: '2025-06-26', stats: 'SPD +20% / WIT +10%', turf: 'A', dirt: 'E', s: 'B', m: 'A', d: 'B', l: 'E', f: 'A', p: 'A', ls: 'G', e: 'G' },
    { key: 'Seiun Sky', name: 'Seiun Sky', id: 102001, slug: 'seiun-sky', stars: 3, date: '2025-09-07', stats: 'STA +10% / WIT +20%', turf: 'A', dirt: 'G', s: 'F', m: 'C', d: 'A', l: 'A', f: 'A', p: 'B', ls: 'E', e: 'G' },
    { key: 'Smart Falcon', name: 'Smart Falcon', id: 104601, slug: 'smart-falcon', stars: 3, date: '2025-08-11', stats: 'SPD +20% / PWR +10%', turf: 'D', dirt: 'S', s: 'A', m: 'A', d: 'A', l: 'B', f: 'B', p: 'A', ls: 'A', e: 'G' },
    { key: 'Super Creek', name: 'Super Creek', id: 104501, slug: 'super-creek', stars: 2, date: '2025-06-26', stats: 'STA +10% / WIT +20%', turf: 'A', dirt: 'G', s: 'F', m: 'C', d: 'A', l: 'A', f: 'G', p: 'A', ls: 'A', e: 'G' },
    { key: 'Symboli Rudolf', name: 'Symboli Rudolf', id: 101701, slug: 'symboli-rudolf', stars: 3, date: '2025-06-26', stats: 'STA +20% / GUT +10%', turf: 'A', dirt: 'G', s: 'E', m: 'C', d: 'A', l: 'A', f: 'C', p: 'A', ls: 'A', e: 'G' },
    { key: 'Symboli Rudolf (Festival)', name: 'Symboli Rudolf', id: 101702, slug: 'festival-symboli-rudolf', stars: 3, date: '2025-12-14', stats: 'SPD +8% / STA +14% / WIT +8%', turf: 'A', dirt: 'G', s: 'F', m: 'C', d: 'A', l: 'A', f: 'B', p: 'A', ls: 'A', e: 'G' },
    { key: 'Tamamo Cross', name: 'Tamamo Cross', id: 102101, slug: 'tamamo-cross', stars: 3, date: '2026-01-22', stats: 'STA +20% / PWR +10%', turf: 'A', dirt: 'G', s: 'B', m: 'A', d: 'A', l: 'B', f: 'A', p: 'A', ls: 'C', e: 'G' },
    { key: 'Tosen Jordan', name: 'Tosen Jordan', id: 104801, slug: 'tosen-jordan', stars: 3, date: '2025-12-18', stats: 'SPD +10% / PWR +10% / GUT +10%', turf: 'A', dirt: 'G', s: 'E', m: 'C', d: 'A', l: 'A', f: 'G', p: 'C', ls: 'A', e: 'A' },
    { key: 'Winning Ticket', name: 'Winning Ticket', id: 103501, slug: 'winning-ticket', stars: 1, date: '2025-06-26', stats: 'STA +10% / PWR +20%', turf: 'A', dirt: 'G', s: 'G', m: 'A', d: 'A', l: 'E', f: 'A', p: 'A', ls: 'G', e: 'G' },
    { key: 'Gold City (Festival)', name: 'Gold City', id: 104002, slug: 'festival-gold-city', stars: 3, date: '2025-12-14', stats: 'SPD +8% / PWR +8% / WIT +14%', turf: 'A', dirt: 'G', s: 'F', m: 'C', d: 'A', l: 'A', f: 'C', p: 'B', ls: 'A', e: 'G' }
];

const generatedCode = missingChars.map(char => {
    return `    '${char.key}': {
        id: '${char.slug}', name: '${char.name}', stars: ${char.stars}, releaseDate: '${char.date}T22:00:00.000Z', characterId: ${char.id},
        gametoraId: ${char.id},
        statBonus: '${char.stats}',
        aptitudes: {
            surface: { turf: '${char.turf}', dirt: '${char.dirt}' },
            distance: { sprint: '${char.s}', mile: '${char.m}', medium: '${char.d}', long: '${char.l}' },
            style: { frontRunner: '${char.f}', paceChaser: '${char.p}', lateSurger: '${char.ls}', endCloser: '${char.e}' }
        }
    },`;
}).join('\n');

// Insert after the first character definition (Air Groove)
const firstEntryEnd = content.indexOf("    'Air Groove':");
if (firstEntryEnd === -1) {
    console.error('Could not find insertion point');
    process.exit(1);
}

const endOfFirstEntry = content.indexOf('    },', firstEntryEnd) + 5;

content = content.slice(0, endOfFirstEntry) + '\n' + generatedCode + '\n' + content.slice(endOfFirstEntry);

fs.writeFileSync(filePath, content);
console.log('✅ Added 30 missing Global characters to umaData.ts');
