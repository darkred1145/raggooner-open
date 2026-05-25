// umaData.ts
import type { UmaData } from '../types';

export const UMA_DICT: Record<string, UmaData> = {
    'Admire Vega': {
        id: 'admire-vega', name: 'Admire Vega', stars: 3, releaseDate: '2026-03-05T22:00:00.000Z', characterId: 103301,
        gametoraId: 103301,
        statBonus: 'SPD +10% / POW +20%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'G', mile: 'A', medium: 'A', long: 'E' }, style: { frontRunner: 'G', paceChaser: 'C', lateSurger: 'A', endCloser: 'A' } }
    },
    'Agnes Digital': {
        id: 'agnes-digital', name: 'Agnes Digital', stars: 3, releaseDate: '2025-11-19T22:00:00.000Z', characterId: 101901,
        gametoraId: 101901,
        statBonus: 'SPD +8% / STA +8% / POW +7% / WIT +7%',
        aptitudes: { surface: { turf: 'A', dirt: 'A' }, distance: { sprint: 'A', mile: 'A', medium: 'B', long: 'E' }, style: { frontRunner: 'B', paceChaser: 'A', lateSurger: 'A', endCloser: 'E' } }
    },
    'Nishino Flower': {
        id: 'nishino-flower', name: 'Nishino Flower', stars: 3, releaseDate: '2026-04-12T22:00:00.000Z', characterId: 105101,
        gametoraId: 105101,
        statBonus: 'SPD +15% / POW +15%',
        aptitudes: { surface: { turf: 'A', dirt: 'F' }, distance: { sprint: 'A', mile: 'A', medium: 'E', long: 'G' }, style: { frontRunner: 'F', paceChaser: 'A', lateSurger: 'A', endCloser: 'G' } }
    },
    'Agnes Tachyon': {
        id: 'agnes-tachyon', name: 'Agnes Tachyon', stars: 1, releaseDate: '2025-06-26T22:00:00.000Z', characterId: 103201,
        gametoraId: 103201,
        statBonus: 'SPD +20% / GUT +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'C', mile: 'A', medium: 'B', long: 'C' }, style: { frontRunner: 'G', paceChaser: 'A', lateSurger: 'A', endCloser: 'G' } }
    },
    'Air Groove': {
        id: 'air-groove', name: 'Air Groove', stars: 2, releaseDate: '2025-06-26T22:00:00.000Z', characterId: 101801,
        gametoraId: 101801,
        statBonus: 'SPD +10% / POW +20%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'C', mile: 'B', medium: 'A', long: 'E' }, style: { frontRunner: 'D', paceChaser: 'A', lateSurger: 'A', endCloser: 'G' } }
    },
    'Biwa Hayahide': {
        id: 'biwa-hayahide', name: 'Biwa Hayahide', stars: 3, releaseDate: '2025-07-10T22:00:00.000Z', characterId: 102301,
        gametoraId: 102301,
        statBonus: 'GUT +10% / WIT +20%',
        aptitudes: { surface: { turf: 'A', dirt: 'F' }, distance: { sprint: 'F', mile: 'C', medium: 'A', long: 'A' }, style: { frontRunner: 'E', paceChaser: 'A', lateSurger: 'B', endCloser: 'E' } }
    },
    'Curren Chan': {
        id: 'curren-chan', name: 'Curren Chan', stars: 3, releaseDate: '2025-07-27T22:00:00.000Z', characterId: 103801,
        gametoraId: 103801,
        statBonus: 'SPD +10% / POW +20%',
        aptitudes: { surface: { turf: 'A', dirt: 'F' }, distance: { sprint: 'A', mile: 'D', medium: 'G', long: 'G' }, style: { frontRunner: 'B', paceChaser: 'A', lateSurger: 'E', endCloser: 'G' } }
    },
    'Daiwa Scarlet': {
        id: 'daiwa-scarlet', name: 'Daiwa Scarlet', stars: 2, releaseDate: '2025-06-26T22:00:00.000Z', characterId: 100901,
        gametoraId: 100901,
        statBonus: 'SPD +10% / GUT +20%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'F', mile: 'A', medium: 'A', long: 'B' }, style: { frontRunner: 'A', paceChaser: 'A', lateSurger: 'E', endCloser: 'G' } }
    },
    'El Condor Pasa': {
        id: 'el-condor-pasa', name: 'El Condor Pasa', stars: 2, releaseDate: '2025-06-26T22:00:00.000Z', characterId: 101401,
        gametoraId: 101401,
        statBonus: 'SPD +20% / WIT +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'B' }, distance: { sprint: 'F', mile: 'A', medium: 'A', long: 'B' }, style: { frontRunner: 'E', paceChaser: 'A', lateSurger: 'A', endCloser: 'C' } }
    },
    'Eishin Flash': {
        id: 'eishin-flash', name: 'Eishin Flash', stars: 3, releaseDate: '2025-10-30T22:00:00.000Z', characterId: 103701,
        gametoraId: 103701,
        statBonus: 'POW +10% / WIT +20%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'G', mile: 'F', medium: 'A', long: 'A' }, style: { frontRunner: 'G', paceChaser: 'B', lateSurger: 'A', endCloser: 'C' } }
    },
    'Fine Motion': {
        id: 'fine-motion', name: 'Fine Motion', stars: 3, releaseDate: '2026-01-15T22:00:00.000Z', characterId: 102201,
        gametoraId: 102201,
        statBonus: 'POW +15% / WIT +15%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'F', mile: 'A', medium: 'A', long: 'C' }, style: { frontRunner: 'D', paceChaser: 'A', lateSurger: 'E', endCloser: 'C' } }
    },
    'Gold City': {
        id: 'gold-city', name: 'Gold City', stars: 3, releaseDate: '2025-10-07T22:00:00.000Z', characterId: 104001,
        gametoraId: 104001,
        statBonus: 'POW +10% / GUT +20%',
        aptitudes: { surface: { turf: 'A', dirt: 'D' }, distance: { sprint: 'F', mile: 'A', medium: 'B', long: 'B' }, style: { frontRunner: 'F', paceChaser: 'A', lateSurger: 'A', endCloser: 'F' } }
    },
    'Gold Ship': {
        id: 'gold-ship', name: 'Gold Ship', stars: 2, releaseDate: '2025-06-26T22:00:00.000Z', characterId: 100701,
        gametoraId: 100701,
        statBonus: 'STA +20% / POW +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'G', mile: 'C', medium: 'A', long: 'A' }, style: { frontRunner: 'G', paceChaser: 'B', lateSurger: 'B', endCloser: 'A' } }
    },
    'Grass Wonder': {
        id: 'grass-wonder', name: 'Grass Wonder', stars: 2, releaseDate: '2025-06-26T22:00:00.000Z', characterId: 101101,
        gametoraId: 101101,
        statBonus: 'SPD +20% / POW +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'G', mile: 'A', medium: 'B', long: 'A' }, style: { frontRunner: 'F', paceChaser: 'A', lateSurger: 'A', endCloser: 'F' } }
    },
    'Haru Urara': {
        id: 'haru-urara', name: 'Haru Urara', stars: 1, releaseDate: '2025-06-26T22:00:00.000Z', characterId: 105201,
        gametoraId: 105201,
        statBonus: 'POW +10% / GUT +20%',
        aptitudes: { surface: { turf: 'G', dirt: 'A' }, distance: { sprint: 'A', mile: 'B', medium: 'G', long: 'G' }, style: { frontRunner: 'G', paceChaser: 'G', lateSurger: 'A', endCloser: 'B' } }
    },
    'Hishi Akebono': {
        id: 'hishi-akebono', name: 'Hishi Akebono', stars: 3, releaseDate: '2025-11-11T22:00:00.000Z', characterId: 102801,
        gametoraId: 102801,
        statBonus: 'POW +20% / GUT +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'F' }, distance: { sprint: 'A', mile: 'B', medium: 'F', long: 'G' }, style: { frontRunner: 'B', paceChaser: 'A', lateSurger: 'C', endCloser: 'G' } }
    },
    'Hishi Amazon': {
        id: 'hishi-amazon', name: 'Hishi Amazon', stars: 3, releaseDate: '2025-09-17T22:00:00.000Z', characterId: 101201,
        gametoraId: 101201,
        statBonus: 'POW +20% / GUT +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'E' }, distance: { sprint: 'D', mile: 'A', medium: 'A', long: 'B' }, style: { frontRunner: 'G', paceChaser: 'B', lateSurger: 'C', endCloser: 'A' } }
    },
    'Kawakami Princess': {
        id: 'kawakami-princess', name: 'Kawakami Princess', stars: 3, releaseDate: '2025-12-01T22:00:00.000Z', characterId: 103901,
        gametoraId: 103901,
        statBonus: 'POW +10% / GUT +20%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'D', mile: 'B', medium: 'A', long: 'F' }, style: { frontRunner: 'G', paceChaser: 'C', lateSurger: 'A', endCloser: 'D' } }
    },
    'King Halo': {
        id: 'king-halo', name: 'King Halo', stars: 1, releaseDate: '2025-06-26T22:00:00.000Z', characterId: 106101,
        gametoraId: 106101,
        statBonus: 'POW +20% / GUT +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'A', mile: 'B', medium: 'B', long: 'C' }, style: { frontRunner: 'G', paceChaser: 'B', lateSurger: 'A', endCloser: 'D' } }
    },
    'Manhattan Cafe': {
        id: 'manhattan-cafe', name: 'Manhattan Cafe', stars: 3, releaseDate: '2025-12-08T22:00:00.000Z', characterId: 102501,
        gametoraId: 102501,
        statBonus: 'STA +30%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'G', mile: 'F', medium: 'B', long: 'A' }, style: { frontRunner: 'G', paceChaser: 'C', lateSurger: 'A', endCloser: 'C' } }
    },
    'Maruzensky': {
        id: 'maruzensky', name: 'Maruzensky', stars: 3, releaseDate: '2025-06-26T22:00:00.000Z', characterId: 100401,
        gametoraId: 100401,
        statBonus: 'SPD +10% / WIT +20%',
        aptitudes: { surface: { turf: 'A', dirt: 'D' }, distance: { sprint: 'B', mile: 'A', medium: 'B', long: 'C' }, style: { frontRunner: 'A', paceChaser: 'E', lateSurger: 'G', endCloser: 'G' } }
    },
    'Matikanefukukitaru': {
        id: 'matikanefukukitaru', name: 'Matikanefukukitaru', stars: 1, releaseDate: '2025-06-26T22:00:00.000Z', characterId: 105601,
        gametoraId: 105601,
        statBonus: 'STA +20% / POW +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'F' }, distance: { sprint: 'F', mile: 'C', medium: 'A', long: 'A' }, style: { frontRunner: 'G', paceChaser: 'B', lateSurger: 'A', endCloser: 'F' } }
    },
    'Matikanetannhauser': {
        id: 'matikanetannhauser', name: 'Matikanetannhauser', stars: 2, releaseDate: '2026-03-12T22:00:00.000Z', characterId: 106201,
        gametoraId: 106201,
        statBonus: 'STA +20% / GUT +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'G', mile: 'A', medium: 'A', long: 'E' }, style: { frontRunner: 'A', paceChaser: 'A', lateSurger: 'E', endCloser: 'G' } }
    },
    'Mayano Top Gun': {
        id: 'mayano-top-gun', name: 'Mayano Top Gun', stars: 2, releaseDate: '2025-06-26T22:00:00.000Z', characterId: 102401,
        gametoraId: 102401,
        statBonus: 'STA +20% / GUT +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'E' }, distance: { sprint: 'D', mile: 'D', medium: 'A', long: 'A' }, style: { frontRunner: 'A', paceChaser: 'A', lateSurger: 'B', endCloser: 'B' } }
    },
    'Meisho Doto': {
        id: 'meisho-doto', name: 'Meisho Doto', stars: 3, releaseDate: '2025-10-21T22:00:00.000Z', characterId: 105801,
        gametoraId: 105801,
        statBonus: 'STA +20% / GUT +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'E' }, distance: { sprint: 'G', mile: 'F', medium: 'A', long: 'A' }, style: { frontRunner: 'F', paceChaser: 'A', lateSurger: 'B', endCloser: 'E' } }
    },
    'Mejiro Ardan': {
        id: 'mejiro-ardan', name: 'Mejiro Ardan', stars: 3, releaseDate: '2026-02-25T22:00:00.000Z', characterId: 107101,
        gametoraId: 107101,
        statBonus: 'SPD +10% / WIT +20%',
        aptitudes: { surface: { turf: 'A', dirt: 'F' }, distance: { sprint: 'E', mile: 'B', medium: 'A', long: 'D' }, style: { frontRunner: 'C', paceChaser: 'A', lateSurger: 'D', endCloser: 'G' } }
    },
    'Mejiro Dober': {
        id: 'mejiro-dober', name: 'Mejiro Dober', stars: 3, releaseDate: '2025-12-28T22:00:00.000Z', characterId: 105901,
        gametoraId: 105901,
        statBonus: 'SPD +10% / WIT +20%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'E', mile: 'A', medium: 'A', long: 'F' }, style: { frontRunner: 'C', paceChaser: 'B', lateSurger: 'A', endCloser: 'G' } }
    },
    'Mejiro McQueen': {
        id: 'mejiro-mcqueen', name: 'Mejiro McQueen', stars: 3, releaseDate: '2025-06-26T22:00:00.000Z', characterId: 101301,
        gametoraId: 101301,
        statBonus: 'STA +20% / WIT +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'E' }, distance: { sprint: 'G', mile: 'F', medium: 'A', long: 'A' }, style: { frontRunner: 'B', paceChaser: 'A', lateSurger: 'D', endCloser: 'F' } }
    },
    'Mejiro Palmer': {
        id: 'mejiro-palmer', name: 'Mejiro Palmer', stars: 3, releaseDate: '2026-05-10T22:00:00.000Z', characterId: 106401,
        gametoraId: 106401,
        statBonus: 'SPD +10% / STA +10% / GUT +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'G', mile: 'F', medium: 'A', long: 'A' }, style: { frontRunner: 'A', paceChaser: 'E', lateSurger: 'F', endCloser: 'G' } }
    },
    'Mejiro Ryan': {
        id: 'mejiro-ryan', name: 'Mejiro Ryan', stars: 1, releaseDate: '2025-06-26T22:00:00.000Z', characterId: 102701,
        gametoraId: 102701,
        statBonus: 'POW +20% / WIT +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'E', mile: 'C', medium: 'A', long: 'B' }, style: { frontRunner: 'F', paceChaser: 'B', lateSurger: 'A', endCloser: 'F' } }
    },
    'Mihono Bourbon': {
        id: 'mihono-bourbon', name: 'Mihono Bourbon', stars: 3, releaseDate: '2025-07-02T22:00:00.000Z', characterId: 102601,
        gametoraId: 102601,
        statBonus: 'STA +20% / POW +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'C', mile: 'B', medium: 'A', long: 'B' }, style: { frontRunner: 'A', paceChaser: 'E', lateSurger: 'G', endCloser: 'G' } }
    },
    'Narita Brian': {
        id: 'narita-brian', name: 'Narita Brian', stars: 3, releaseDate: '2025-08-20T22:00:00.000Z', characterId: 101601,
        gametoraId: 101601,
        statBonus: 'SPD +10% / STA +20%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'F', mile: 'B', medium: 'A', long: 'A' }, style: { frontRunner: 'G', paceChaser: 'A', lateSurger: 'A', endCloser: 'D' } }
    },
    'Narita Taishin': {
        id: 'narita-taishin', name: 'Narita Taishin', stars: 3, releaseDate: '2025-08-03T22:00:00.000Z', characterId: 105001,
        gametoraId: 105001,
        statBonus: 'SPD +10% / GUT +20%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'F', mile: 'D', medium: 'A', long: 'A' }, style: { frontRunner: 'G', paceChaser: 'F', lateSurger: 'B', endCloser: 'A' } }
    },
    'Nice Nature': {
        id: 'nice-nature', name: 'Nice Nature', stars: 1, releaseDate: '2025-06-26T22:00:00.000Z', characterId: 106001,
        gametoraId: 106001,
        statBonus: 'POW +20% / WIT +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'G', mile: 'C', medium: 'A', long: 'B' }, style: { frontRunner: 'F', paceChaser: 'B', lateSurger: 'A', endCloser: 'D' } }
    },
    'Oguri Cap': {
        id: 'oguri-cap', name: 'Oguri Cap', stars: 3, releaseDate: '2025-06-26T22:00:00.000Z', characterId: 100601,
        gametoraId: 100601,
        statBonus: 'SPD +20% / POW +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'B' }, distance: { sprint: 'E', mile: 'A', medium: 'A', long: 'B' }, style: { frontRunner: 'F', paceChaser: 'A', lateSurger: 'A', endCloser: 'D' } }
    },
    'Rice Shower': {
        id: 'rice-shower', name: 'Rice Shower', stars: 3, releaseDate: '2025-06-26T22:00:00.000Z', characterId: 103001,
        gametoraId: 103001,
        statBonus: 'STA +10% / GUT +20%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'E', mile: 'C', medium: 'A', long: 'A' }, style: { frontRunner: 'B', paceChaser: 'A', lateSurger: 'C', endCloser: 'G' } }
    },
    'Sakura Bakushin O': {
        id: 'sakura-bakushin-o', name: 'Sakura Bakushin O', stars: 1, releaseDate: '2025-06-26T22:00:00.000Z', characterId: 104101,
        gametoraId: 104101,
        statBonus: 'SPD +20% / WIT +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'A', mile: 'B', medium: 'G', long: 'G' }, style: { frontRunner: 'A', paceChaser: 'A', lateSurger: 'F', endCloser: 'G' } }
    },
    'Sakura Chiyono O': {
        id: 'sakura-chiyono-o', name: 'Sakura Chiyono O', stars: 3, releaseDate: '2026-02-11T22:00:00.000Z', characterId: 106901,
        gametoraId: 106901,
        statBonus: 'SPD +10% / GUT +10% / WIT +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'E', mile: 'A', medium: 'A', long: 'E' }, style: { frontRunner: 'B', paceChaser: 'A', lateSurger: 'F', endCloser: 'G' } }
    },
    'Seiun Sky': {
        id: 'seiun-sky', name: 'Seiun Sky', stars: 3, releaseDate: '2025-09-07T22:00:00.000Z', characterId: 102001,
        gametoraId: 102001,
        statBonus: 'STA +10% / WIT +20%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'G', mile: 'C', medium: 'A', long: 'A' }, style: { frontRunner: 'A', paceChaser: 'B', lateSurger: 'D', endCloser: 'E' } }
    },
    'Silence Suzuka': {
        id: 'silence-suzuka', name: 'Silence Suzuka', stars: 3, releaseDate: '2025-06-26T22:00:00.000Z', characterId: 100201,
        gametoraId: 100201,
        statBonus: 'SPD +20% / GUT +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'D', mile: 'A', medium: 'A', long: 'E' }, style: { frontRunner: 'A', paceChaser: 'C', lateSurger: 'E', endCloser: 'G' } }
    },
    'Smart Falcon': {
        id: 'smart-falcon', name: 'Smart Falcon', stars: 3, releaseDate: '2025-08-11T22:00:00.000Z', characterId: 104601,
        gametoraId: 104601,
        statBonus: 'SPD +20% / POW +10%',
        aptitudes: { surface: { turf: 'E', dirt: 'A' }, distance: { sprint: 'B', mile: 'A', medium: 'A', long: 'E' }, style: { frontRunner: 'A', paceChaser: 'D', lateSurger: 'G', endCloser: 'G' } }
    },
    'Special Week': {
        id: 'special-week', name: 'Special Week', stars: 3, releaseDate: '2025-06-26T22:00:00.000Z', characterId: 100101,
        gametoraId: 100101,
        statBonus: 'STA +20% / WIT +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'F', mile: 'C', medium: 'A', long: 'A' }, style: { frontRunner: 'G', paceChaser: 'A', lateSurger: 'A', endCloser: 'C' } }
    },
    'Super Creek': {
        id: 'super-creek', name: 'Super Creek', stars: 2, releaseDate: '2025-06-26T22:00:00.000Z', characterId: 104501,
        gametoraId: 104501,
        statBonus: 'STA +10% / WIT +20%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'G', mile: 'G', medium: 'A', long: 'A' }, style: { frontRunner: 'D', paceChaser: 'A', lateSurger: 'B', endCloser: 'G' } }
    },
    'Symboli Rudolf': {
        id: 'symboli-rudolf', name: 'Symboli Rudolf', stars: 3, releaseDate: '2025-06-26T22:00:00.000Z', characterId: 101701,
        gametoraId: 101701,
        statBonus: 'STA +20% / GUT +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'E', mile: 'C', medium: 'A', long: 'A' }, style: { frontRunner: 'B', paceChaser: 'A', lateSurger: 'A', endCloser: 'C' } }
    },
    'Taiki Shuttle': {
        id: 'taiki-shuttle', name: 'Taiki Shuttle', stars: 3, releaseDate: '2025-06-26T22:00:00.000Z', characterId: 101001,
        gametoraId: 101001,
        statBonus: 'SPD +20% / WIT +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'B' }, distance: { sprint: 'A', mile: 'A', medium: 'E', long: 'G' }, style: { frontRunner: 'C', paceChaser: 'A', lateSurger: 'E', endCloser: 'G' } }
    },
    'Tamamo Cross': {
        id: 'tamamo-cross', name: 'Tamamo Cross', stars: 3, releaseDate: '2026-01-22T22:00:00.000Z', characterId: 102101,
        gametoraId: 102101,
        statBonus: 'STA +20% / POW +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'F' }, distance: { sprint: 'G', mile: 'E', medium: 'A', long: 'A' }, style: { frontRunner: 'G', paceChaser: 'A', lateSurger: 'A', endCloser: 'A' } }
    },
    'Tokai Teio': {
        id: 'tokai-teio', name: 'Tokai Teio', stars: 3, releaseDate: '2025-06-26T22:00:00.000Z', characterId: 100301,
        gametoraId: 100301,
        statBonus: 'SPD +20% / STA +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'F', mile: 'E', medium: 'A', long: 'B' }, style: { frontRunner: 'D', paceChaser: 'A', lateSurger: 'C', endCloser: 'E' } }
    },
    'Tosen Jordan': {
        id: 'tosen-jordan', name: 'Tosen Jordan', stars: 3, releaseDate: '2025-12-28T22:00:00.000Z', characterId: 104801,
        gametoraId: 104801,
        statBonus: 'SPD +10% / POW +10% / GUT +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'G', mile: 'F', medium: 'A', long: 'B' }, style: { frontRunner: 'C', paceChaser: 'A', lateSurger: 'B', endCloser: 'G' } }
    },
    'TM Opera O': {
        id: 'tm-opera-o', name: 'TM Opera O', stars: 3, releaseDate: '2025-06-26T22:00:00.000Z', characterId: 101501,
        gametoraId: 101501,
        statBonus: 'STA +20% / WIT +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'E' }, distance: { sprint: 'G', mile: 'E', medium: 'A', long: 'A' }, style: { frontRunner: 'C', paceChaser: 'A', lateSurger: 'A', endCloser: 'G' } }
    },
    'Vodka': {
        id: 'vodka', name: 'Vodka', stars: 2, releaseDate: '2025-06-26T22:00:00.000Z', characterId: 100801,
        gametoraId: 100801,
        statBonus: 'SPD +10% / POW +20%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'F', mile: 'A', medium: 'A', long: 'F' }, style: { frontRunner: 'C', paceChaser: 'B', lateSurger: 'A', endCloser: 'F' } }
    },
    'Winning Ticket': {
        id: 'winning-ticket', name: 'Winning Ticket', stars: 1, releaseDate: '2025-06-26T22:00:00.000Z', characterId: 103501,
        gametoraId: 103501,
        statBonus: 'STA +10% / POW +20%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'G', mile: 'F', medium: 'A', long: 'B' }, style: { frontRunner: 'G', paceChaser: 'B', lateSurger: 'A', endCloser: 'G' } }
    },
    'Yaeno Muteki': {
        id: 'yaeno-muteki', name: 'Yaeno Muteki', stars: 3, releaseDate: '2026-04-20T22:00:00.000Z', characterId: 107201,
        gametoraId: 107201,
        statBonus: 'POW +20% / GUT +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'E' }, distance: { sprint: 'G', mile: 'B', medium: 'A', long: 'E' }, style: { frontRunner: 'F', paceChaser: 'A', lateSurger: 'A', endCloser: 'G' } }
    },
    // --- Variant Characters ---
    'Fuji Kiseki': {
        id: 'fuji-kiseki', name: 'Fuji Kiseki', stars: 3, releaseDate: '2025-10-02T22:00:00.000Z', characterId: 100501,
        gametoraId: 100501,
        statBonus: 'POW +20% / WIT +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'F' }, distance: { sprint: 'B', mile: 'A', medium: 'B', long: 'E' }, style: { frontRunner: 'C', paceChaser: 'A', lateSurger: 'C', endCloser: 'G' } }
    },
    'Ballroom Fuji Kiseki': {
        id: 'ballroom-fuji-kiseki', name: 'Ballroom Fuji Kiseki', stars: 3, releaseDate: '2026-04-05T22:00:00.000Z', characterId: 100502,
        gametoraId: 100502,
        statBonus: 'SPD +8% / POW +14% / WIT +8%',
        aptitudes: { surface: { turf: 'A', dirt: 'F' }, distance: { sprint: 'B', mile: 'A', medium: 'B', long: 'E' }, style: { frontRunner: 'C', paceChaser: 'A', lateSurger: 'C', endCloser: 'G' } }
    },
    'Ballroom Seiun Sky': {
        id: 'ballroom-seiun-sky', name: 'Ballroom Seiun Sky', stars: 3, releaseDate: '2026-04-05T22:00:00.000Z', characterId: 102002,
        gametoraId: 102002,
        statBonus: 'SPD +8% / POW +8% / GUT +14%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'G', mile: 'C', medium: 'A', long: 'A' }, style: { frontRunner: 'A', paceChaser: 'B', lateSurger: 'D', endCloser: 'E' } }
    },
    'Mejiro Bright': {
        id: 'mejiro-bright', name: 'Mejiro Bright', stars: 3, releaseDate: '2026-03-26T22:00:00.000Z', characterId: 107401,
        gametoraId: 107401,
        statBonus: 'STA +14% / GUT +8% / WIT +8%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'F', mile: 'C', medium: 'A', long: 'A' }, style: { frontRunner: 'G', paceChaser: 'D', lateSurger: 'A', endCloser: 'A' } }
    },
    'Satono Diamond': {
        id: 'satono-diamond', name: 'Satono Diamond', stars: 3, releaseDate: '2026-03-22T22:00:00.000Z', characterId: 106701,
        gametoraId: 106701,
        statBonus: 'STA +15% / WIT +15%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'G', mile: 'C', medium: 'A', long: 'A' }, style: { frontRunner: 'G', paceChaser: 'B', lateSurger: 'A', endCloser: 'D' } }
    },
    'Kitasan Black': {
        id: 'kitasan-black', name: 'Kitasan Black', stars: 3, releaseDate: '2026-03-12T22:00:00.000Z', characterId: 106801,
        gametoraId: 106801,
        statBonus: 'SPD +20% / STA +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'E', mile: 'C', medium: 'A', long: 'A' }, style: { frontRunner: 'A', paceChaser: 'B', lateSurger: 'C', endCloser: 'G' } }
    },
    'Valentine Mihono Bourbon': {
        id: 'valentine-mihono-bourbon', name: 'Valentine Mihono Bourbon', stars: 3, releaseDate: '2026-02-18T22:00:00.000Z', characterId: 102602,
        gametoraId: 102602,
        statBonus: 'SPD +10% / STA +10% / POW +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'C', mile: 'B', medium: 'A', long: 'B' }, style: { frontRunner: 'A', paceChaser: 'E', lateSurger: 'G', endCloser: 'G' } }
    },
    'Valentine Eishin Flash': {
        id: 'valentine-eishin-flash', name: 'Valentine Eishin Flash', stars: 3, releaseDate: '2026-02-18T22:00:00.000Z', characterId: 103702,
        gametoraId: 103702,
        statBonus: 'STA +8% / POW +8% / WIT +14%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'G', mile: 'F', medium: 'A', long: 'A' }, style: { frontRunner: 'G', paceChaser: 'B', lateSurger: 'A', endCloser: 'C' } }
    },
    'New Year TM Opera O': {
        id: 'new-year-tm-opera-o', name: 'New Year TM Opera O', stars: 3, releaseDate: '2026-01-29T22:00:00.000Z', characterId: 101502,
        gametoraId: 101502,
        statBonus: 'SPD +14% / STA +8% / WIT +8%',
        aptitudes: { surface: { turf: 'A', dirt: 'E' }, distance: { sprint: 'G', mile: 'E', medium: 'A', long: 'A' }, style: { frontRunner: 'C', paceChaser: 'A', lateSurger: 'A', endCloser: 'G' } }
    },
    'New Year Haru Urara': {
        id: 'new-year-haru-urara', name: 'New Year Haru Urara', stars: 3, releaseDate: '2026-01-29T22:00:00.000Z', characterId: 105202,
        gametoraId: 105202,
        statBonus: 'POW +20% / GUT +10%',
        aptitudes: { surface: { turf: 'G', dirt: 'A' }, distance: { sprint: 'A', mile: 'A', medium: 'G', long: 'G' }, style: { frontRunner: 'G', paceChaser: 'G', lateSurger: 'A', endCloser: 'B' } }
    },
    'Christmas Oguri Cap': {
        id: 'christmas-oguri-cap', name: 'Christmas Oguri Cap', stars: 3, releaseDate: '2026-01-05T22:00:00.000Z', characterId: 100602,
        gametoraId: 100602,
        statBonus: 'SPD +15% / STA +15%',
        aptitudes: { surface: { turf: 'A', dirt: 'B' }, distance: { sprint: 'E', mile: 'A', medium: 'A', long: 'B' }, style: { frontRunner: 'F', paceChaser: 'A', lateSurger: 'A', endCloser: 'D' } }
    },
    'Christmas Biwa Hayahide': {
        id: 'christmas-biwa-hayahide', name: 'Christmas Biwa Hayahide', stars: 3, releaseDate: '2026-01-05T22:00:00.000Z', characterId: 102302,
        gametoraId: 102302,
        statBonus: 'STA +12% / POW +12% / WIT +6%',
        aptitudes: { surface: { turf: 'A', dirt: 'F' }, distance: { sprint: 'F', mile: 'C', medium: 'A', long: 'A' }, style: { frontRunner: 'E', paceChaser: 'A', lateSurger: 'B', endCloser: 'E' } }
    },
    'Festival Symboli Rudolf': {
        id: 'festival-symboli-rudolf', name: 'Festival Symboli Rudolf', stars: 3, releaseDate: '2025-12-14T22:00:00.000Z', characterId: 101702,
        gametoraId: 101702,
        statBonus: 'SPD +8% / STA +14% / WIT +8%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'E', mile: 'C', medium: 'A', long: 'A' }, style: { frontRunner: 'B', paceChaser: 'A', lateSurger: 'A', endCloser: 'C' } }
    },
    'Festival Gold City': {
        id: 'festival-gold-city', name: 'Festival Gold City', stars: 3, releaseDate: '2025-12-14T22:00:00.000Z', characterId: 104002,
        gametoraId: 104002,
        statBonus: 'SPD +8% / POW +8% / WIT +14%',
        aptitudes: { surface: { turf: 'A', dirt: 'D' }, distance: { sprint: 'F', mile: 'A', medium: 'B', long: 'B' }, style: { frontRunner: 'F', paceChaser: 'A', lateSurger: 'A', endCloser: 'F' } }
    },
    'Halloween Rice Shower': {
        id: 'halloween-rice-shower', name: 'Halloween Rice Shower', stars: 3, releaseDate: '2025-11-24T22:00:00.000Z', characterId: 103002,
        gametoraId: 103002,
        statBonus: 'STA +15% / POW +15%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'E', mile: 'C', medium: 'A', long: 'A' }, style: { frontRunner: 'B', paceChaser: 'A', lateSurger: 'C', endCloser: 'G' } }
    },
    'Halloween Super Creek': {
        id: 'halloween-super-creek', name: 'Halloween Super Creek', stars: 3, releaseDate: '2025-11-24T22:00:00.000Z', characterId: 104502,
        gametoraId: 104502,
        statBonus: 'SPD +14% / STA +8% / GUT +8%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'G', mile: 'G', medium: 'A', long: 'A' }, style: { frontRunner: 'D', paceChaser: 'A', lateSurger: 'B', endCloser: 'G' } }
    },
    'Full Armor Matikanefukukitaru': {
        id: 'full-armor-matikanefukukitaru', name: 'Full Armor Matikanefukukitaru', stars: 3, releaseDate: '2025-11-06T22:00:00.000Z', characterId: 105602,
        gametoraId: 105602,
        statBonus: 'STA +10% / GUT +10% / WIT +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'F' }, distance: { sprint: 'F', mile: 'C', medium: 'A', long: 'A' }, style: { frontRunner: 'G', paceChaser: 'B', lateSurger: 'A', endCloser: 'F' } }
    },
    'Summer Special Week': {
        id: 'summer-special-week', name: 'Summer Special Week', stars: 3, releaseDate: '2025-10-14T22:00:00.000Z', characterId: 100102,
        gametoraId: 100102,
        statBonus: 'STA +10% / POW +10% / GUT +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'F', mile: 'C', medium: 'A', long: 'A' }, style: { frontRunner: 'G', paceChaser: 'A', lateSurger: 'A', endCloser: 'C' } }
    },
    'Summer Maruzensky': {
        id: 'summer-maruzensky', name: 'Summer Maruzensky', stars: 3, releaseDate: '2025-10-14T22:00:00.000Z', characterId: 100402,
        gametoraId: 100402,
        statBonus: 'SPD +15% / WIT +15%',
        aptitudes: { surface: { turf: 'A', dirt: 'D' }, distance: { sprint: 'B', mile: 'B', medium: 'A', long: 'C' }, style: { frontRunner: 'A', paceChaser: 'E', lateSurger: 'G', endCloser: 'G' } }
    },
    'Fantasy Grass Wonder': {
        id: 'fantasy-grass-wonder', name: 'Fantasy Grass Wonder', stars: 3, releaseDate: '2025-09-21T22:00:00.000Z', characterId: 101102,
        gametoraId: 101102,
        statBonus: 'STA +15% / WIT +15%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'G', mile: 'A', medium: 'B', long: 'A' }, style: { frontRunner: 'F', paceChaser: 'A', lateSurger: 'A', endCloser: 'F' } }
    },
    'Fantasy El Condor Pasa': {
        id: 'fantasy-el-condor-pasa', name: 'Fantasy El Condor Pasa', stars: 3, releaseDate: '2025-09-21T22:00:00.000Z', characterId: 101402,
        gametoraId: 101402,
        statBonus: 'SPD +15% / GUT +15%',
        aptitudes: { surface: { turf: 'A', dirt: 'B' }, distance: { sprint: 'F', mile: 'A', medium: 'A', long: 'B' }, style: { frontRunner: 'E', paceChaser: 'A', lateSurger: 'A', endCloser: 'C' } }
    },
    'Wedding Air Groove': {
        id: 'wedding-air-groove', name: 'Wedding Air Groove', stars: 3, releaseDate: '2025-08-28T22:00:00.000Z', characterId: 101802,
        gametoraId: 101802,
        statBonus: 'SPD +10% / POW +10% / GUT +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'C', mile: 'B', medium: 'A', long: 'E' }, style: { frontRunner: 'D', paceChaser: 'A', lateSurger: 'A', endCloser: 'G' } }
    },
    'Wedding Mayano Top Gun': {
        id: 'wedding-mayano-top-gun', name: 'Wedding Mayano Top Gun', stars: 3, releaseDate: '2025-08-28T22:00:00.000Z', characterId: 102402,
        gametoraId: 102402,
        statBonus: 'SPD +10% / STA +10% / WIT +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'E' }, distance: { sprint: 'D', mile: 'D', medium: 'A', long: 'A' }, style: { frontRunner: 'A', paceChaser: 'A', lateSurger: 'B', endCloser: 'B' } }
    },
    'Cheerleader King Halo': {
        id: 'cheerleader-king-halo', name: 'Cheerleader King Halo', stars: 3, releaseDate: '2026-04-26T22:00:00.000Z', characterId: 106102,
        gametoraId: 106102,
        statBonus: 'SPD +10% / POW +10% / GUT +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'A', mile: 'B', medium: 'B', long: 'C' }, style: { frontRunner: 'G', paceChaser: 'B', lateSurger: 'A', endCloser: 'D' } }
    },
    'Cheerleader Nice Nature': {
        id: 'cheerleader-nice-nature', name: 'Cheerleader Nice Nature', stars: 3, releaseDate: '2026-04-26T22:00:00.000Z', characterId: 106002,
        gametoraId: 106002,
        statBonus: 'STA +10% / POW +10% / WIT +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'G', mile: 'C', medium: 'A', long: 'A' }, style: { frontRunner: 'F', paceChaser: 'B', lateSurger: 'A', endCloser: 'D' } }
    },
    'Anime Tokai Teio': {
        id: 'anime-tokai-teio', name: 'Anime Tokai Teio', stars: 3, releaseDate: '2025-07-16T22:00:00.000Z', characterId: 100302,
        gametoraId: 100302,
        statBonus: 'SPD +10% / STA +10% / GUT +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'F', mile: 'E', medium: 'A', long: 'B' }, style: { frontRunner: 'D', paceChaser: 'A', lateSurger: 'C', endCloser: 'E' } }
    },
    'Ines Fujin': {
        id: 'ines-fujin', name: 'Ines Fujin', stars: 3, releaseDate: '2026-04-29T22:00:00.000Z', characterId: 103101,
        gametoraId: 103101,
        statBonus: 'SPD +15% / GUT +15%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'G', mile: 'A', medium: 'A', long: 'C' }, style: { frontRunner: 'A', paceChaser: 'C', lateSurger: 'G', endCloser: 'G' } }
    },
    'Anime Mejiro McQueen': {
        id: 'anime-mejiro-mcqueen', name: 'Anime Mejiro McQueen', stars: 3, releaseDate: '2025-07-16T22:00:00.000Z', characterId: 101302,
        gametoraId: 101302,
        statBonus: 'STA +10% / POW +10% / WIT +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'E' }, distance: { sprint: 'G', mile: 'F', medium: 'A', long: 'A' }, style: { frontRunner: 'B', paceChaser: 'A', lateSurger: 'D', endCloser: 'F' } }
    },
    'Wedding Fine Motion': {
        id: 'wedding-fine-motion', name: 'Wedding Fine Motion', stars: 3, releaseDate: '2026-05-18T22:00:00.000Z', characterId: 102202,
        gametoraId: 102226,
        statBonus: 'GUT +10% / WIT +20%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'F', mile: 'A', medium: 'A', long: 'C' }, style: { frontRunner: 'D', paceChaser: 'A', lateSurger: 'E', endCloser: 'C' } }
    },
    'Wedding Curren Chan': {
        id: 'wedding-curren-chan', name: 'Wedding Curren Chan', stars: 3, releaseDate: '2026-05-18T22:00:00.000Z', characterId: 103802,
        gametoraId: 103826,
        statBonus: 'SPD +10% / POW +10% / WIT +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'F' }, distance: { sprint: 'A', mile: 'D', medium: 'G', long: 'G' }, style: { frontRunner: 'B', paceChaser: 'A', lateSurger: 'E', endCloser: 'G' } }
    },

    // --- JP-only / upcoming characters ---
    'Admire Groove': {
        id: 'admire-groove', name: 'Admire Groove', stars: 3, releaseDate: '2026-04-20T22:00:00.000Z', characterId: 111801,
        gametoraId: 111801,
        statBonus: 'SPD +10% / GUT +10% / WIT +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'G', mile: 'B', medium: 'A', long: 'G' }, style: { frontRunner: 'G', paceChaser: 'B', lateSurger: 'A', endCloser: 'C' } },
        upcoming: true
    },
    'Air Messiah': {
        id: 'air-messiah', name: 'Air Messiah', stars: 3, releaseDate: '2024-11-18T22:00:00.000Z', characterId: 111101,
        gametoraId: 111101,
        statBonus: 'POW +15% / WIT +15%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'C', mile: 'B', medium: 'A', long: 'G' }, style: { frontRunner: 'G', paceChaser: 'B', lateSurger: 'A', endCloser: 'E' } },
        upcoming: true
    },
    'Air Shakur': {
        id: 'air-shakur', name: 'Air Shakur', stars: 3, releaseDate: '2022-07-11T22:00:00.000Z', characterId: 103601,
        gametoraId: 103601,
        statBonus: 'WIT +30%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'G', mile: 'E', medium: 'A', long: 'A' }, style: { frontRunner: 'G', paceChaser: 'C', lateSurger: 'A', endCloser: 'A' } },
        upcoming: true
    },
    'Almond Eye': {
        id: 'almond-eye', name: 'Almond Eye', stars: 3, releaseDate: '2026-02-24T22:00:00.000Z', characterId: 112901,
        gametoraId: 112901,
        statBonus: 'SPD +10% / STA +10% / POW +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'G', mile: 'A', medium: 'A', long: 'F' }, style: { frontRunner: 'G', paceChaser: 'A', lateSurger: 'A', endCloser: 'D' } },
        upcoming: true
    },
    'Aston Machan': {
        id: 'aston-machan', name: 'Aston Machan', stars: 3, releaseDate: '2022-10-11T22:00:00.000Z', characterId: 108701,
        gametoraId: 108701,
        statBonus: 'SPD +20% / GUT +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'A', mile: 'B', medium: 'G', long: 'G' }, style: { frontRunner: 'A', paceChaser: 'A', lateSurger: 'G', endCloser: 'G' } },
        upcoming: true
    },
    'Bamboo Memory': {
        id: 'bamboo-memory', name: 'Bamboo Memory', stars: 3, releaseDate: '2022-08-10T22:00:00.000Z', characterId: 105301,
        gametoraId: 105301,
        statBonus: 'SPD +10% / POW +10% / GUT +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'D' }, distance: { sprint: 'A', mile: 'A', medium: 'C', long: 'G' }, style: { frontRunner: 'G', paceChaser: 'E', lateSurger: 'A', endCloser: 'C' } },
        upcoming: true
    },
    'Believe': {
        id: 'believe', name: 'Believe', stars: 3, releaseDate: '2025-09-19T22:00:00.000Z', characterId: 109501,
        gametoraId: 109501,
        statBonus: 'POW +10% / GUT +10% / WIT +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'A', mile: 'D', medium: 'G', long: 'G' }, style: { frontRunner: 'D', paceChaser: 'A', lateSurger: 'D', endCloser: 'G' } },
        upcoming: true
    },
    'Biko Pegasus': {
        id: 'biko-pegasus', name: 'Biko Pegasus', stars: 2, releaseDate: '2024-02-14T22:00:00.000Z', characterId: 105401,
        gametoraId: 105401,
        statBonus: 'SPD +10% / POW +10% / GUT +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'E' }, distance: { sprint: 'A', mile: 'B', medium: 'G', long: 'G' }, style: { frontRunner: 'G', paceChaser: 'E', lateSurger: 'A', endCloser: 'B' } },
        upcoming: true
    },
    'Bubble Gum Fellow': {
        id: 'bubble-gum-fellow', name: 'Bubble Gum Fellow', stars: 3, releaseDate: '2024-10-11T22:00:00.000Z', characterId: 112401,
        gametoraId: 112401,
        statBonus: 'SPD +20% / GUT +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'G', mile: 'A', medium: 'A', long: 'G' }, style: { frontRunner: 'E', paceChaser: 'A', lateSurger: 'B', endCloser: 'G' } },
        upcoming: true
    },
    'Buena Vista': {
        id: 'buena-vista', name: 'Buena Vista', stars: 3, releaseDate: '2025-11-19T22:00:00.000Z', characterId: 111401,
        gametoraId: 111401,
        statBonus: 'SPD +10% / POW +10% / WIT +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'F' }, distance: { sprint: 'G', mile: 'A', medium: 'A', long: 'C' }, style: { frontRunner: 'G', paceChaser: 'B', lateSurger: 'A', endCloser: 'A' } },
        upcoming: true
    },
    'Calstone Light O': {
        id: 'calstone-light-o', name: 'Calstone Light O', stars: 3, releaseDate: '2024-07-19T22:00:00.000Z', characterId: 112001,
        gametoraId: 112001,
        statBonus: 'SPD +15% / POW +15%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'A', mile: 'D', medium: 'G', long: 'G' }, style: { frontRunner: 'A', paceChaser: 'C', lateSurger: 'G', endCloser: 'G' } },
        upcoming: true
    },
    'Cesario': {
        id: 'cesario', name: 'Cesario', stars: 3, releaseDate: '2024-09-10T22:00:00.000Z', characterId: 111001,
        gametoraId: 111001,
        statBonus: 'SPD +10% / POW +10% / WIT +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'G', mile: 'A', medium: 'A', long: 'F' }, style: { frontRunner: 'G', paceChaser: 'A', lateSurger: 'A', endCloser: 'C' } },
        upcoming: true
    },
    'Cheval Grand': {
        id: 'cheval-grand', name: 'Cheval Grand', stars: 3, releaseDate: '2023-12-20T22:00:00.000Z', characterId: 108901,
        gametoraId: 108901,
        statBonus: 'STA +10% / GUT +10% / WIT +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'G', mile: 'G', medium: 'A', long: 'A' }, style: { frontRunner: 'G', paceChaser: 'A', lateSurger: 'B', endCloser: 'F' } },
        upcoming: true
    },
    'Chrono Genesis': {
        id: 'chrono-genesis', name: 'Chrono Genesis', stars: 3, releaseDate: '2025-06-13T22:00:00.000Z', characterId: 113301,
        gametoraId: 113301,
        statBonus: 'SPD +10% / STA +10% / GUT +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'G', mile: 'B', medium: 'A', long: 'A' }, style: { frontRunner: 'G', paceChaser: 'A', lateSurger: 'C', endCloser: 'E' } },
        upcoming: true
    },
    'Copano Rickey': {
        id: 'copano-rickey', name: 'Copano Rickey', stars: 3, releaseDate: '2022-08-19T22:00:00.000Z', characterId: 109801,
        gametoraId: 109801,
        statBonus: 'POW +10% / WIT +20%',
        aptitudes: { surface: { turf: 'F', dirt: 'A' }, distance: { sprint: 'C', mile: 'A', medium: 'A', long: 'G' }, style: { frontRunner: 'A', paceChaser: 'A', lateSurger: 'C', endCloser: 'G' } },
        upcoming: true
    },
    'Daiichi Ruby': {
        id: 'daiichi-ruby', name: 'Daiichi Ruby', stars: 3, releaseDate: '2023-03-10T22:00:00.000Z', characterId: 108501,
        gametoraId: 108501,
        statBonus: 'POW +20% / WIT +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'A', mile: 'A', medium: 'C', long: 'G' }, style: { frontRunner: 'E', paceChaser: 'B', lateSurger: 'A', endCloser: 'A' } },
        upcoming: true
    },
    'Daitaku Helios': {
        id: 'daitaku-helios', name: 'Daitaku Helios', stars: 3, releaseDate: '2023-01-20T22:00:00.000Z', characterId: 106501,
        gametoraId: 106501,
        statBonus: 'SPD +15% / POW +15%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'B', mile: 'A', medium: 'B', long: 'E' }, style: { frontRunner: 'A', paceChaser: 'A', lateSurger: 'G', endCloser: 'G' } },
        upcoming: true
    },
    'Dantsu Flame': {
        id: 'dantsu-flame', name: 'Dantsu Flame', stars: 3, releaseDate: '2025-10-18T22:00:00.000Z', characterId: 109201,
        gametoraId: 109201,
        statBonus: 'STA +10% / GUT +20%',
        aptitudes: { surface: { turf: 'A', dirt: 'F' }, distance: { sprint: 'E', mile: 'B', medium: 'A', long: 'D' }, style: { frontRunner: 'G', paceChaser: 'A', lateSurger: 'B', endCloser: 'D' } },
        upcoming: true
    },
    'Daring Heart': {
        id: 'daring-heart', name: 'Daring Heart', stars: 3, releaseDate: '2026-05-11T22:00:00.000Z', characterId: 111201,
        gametoraId: 111201,
        statBonus: 'GUT +20% / WIT +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'D' }, distance: { sprint: 'B', mile: 'A', medium: 'E', long: 'G' }, style: { frontRunner: 'D', paceChaser: 'A', lateSurger: 'F', endCloser: 'G' } },
        upcoming: true
    },
    'Dream Journey': {
        id: 'dream-journey', name: 'Dream Journey', stars: 3, releaseDate: '2024-06-26T22:00:00.000Z', characterId: 111901,
        gametoraId: 111901,
        statBonus: 'STA +10% / POW +10% / WIT +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'F', mile: 'C', medium: 'A', long: 'A' }, style: { frontRunner: 'G', paceChaser: 'G', lateSurger: 'A', endCloser: 'A' } },
        upcoming: true
    },
    'Duramente': {
        id: 'duramente', name: 'Duramente', stars: 3, releaseDate: '2024-02-24T22:00:00.000Z', characterId: 110801,
        gametoraId: 110801,
        statBonus: 'SPD +20% / POW +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'G', mile: 'A', medium: 'A', long: 'C' }, style: { frontRunner: 'G', paceChaser: 'C', lateSurger: 'A', endCloser: 'A' } },
        upcoming: true
    },
    'Durandal': {
        id: 'durandal', name: 'Durandal', stars: 3, releaseDate: '2024-09-20T22:00:00.000Z', characterId: 112101,
        gametoraId: 112101,
        statBonus: 'SPD +20% / POW +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'A', mile: 'A', medium: 'F', long: 'G' }, style: { frontRunner: 'G', paceChaser: 'G', lateSurger: 'C', endCloser: 'A' } },
        upcoming: true
    },
    'Espoir City': {
        id: 'espoir-city', name: 'Espoir City', stars: 3, releaseDate: '2025-09-09T22:00:00.000Z', characterId: 108101,
        gametoraId: 108101,
        statBonus: 'POW +10% / GUT +20%',
        aptitudes: { surface: { turf: 'E', dirt: 'A' }, distance: { sprint: 'A', mile: 'A', medium: 'B', long: 'G' }, style: { frontRunner: 'A', paceChaser: 'A', lateSurger: 'F', endCloser: 'G' } },
        upcoming: true
    },
    'Fenomeno': {
        id: 'fenomeno', name: 'Fenomeno', stars: 3, releaseDate: '2025-04-21T22:00:00.000Z', characterId: 112701,
        gametoraId: 112701,
        statBonus: 'STA +10% / GUT +20%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'G', mile: 'G', medium: 'A', long: 'A' }, style: { frontRunner: 'C', paceChaser: 'A', lateSurger: 'E', endCloser: 'G' } },
        upcoming: true
    },
    'Furioso': {
        id: 'furioso', name: 'Furioso', stars: 3, releaseDate: '2025-01-20T22:00:00.000Z', characterId: 107901,
        gametoraId: 107901,
        statBonus: 'SPD +20% / GUT +10%',
        aptitudes: { surface: { turf: 'G', dirt: 'A' }, distance: { sprint: 'F', mile: 'A', medium: 'A', long: 'F' }, style: { frontRunner: 'A', paceChaser: 'A', lateSurger: 'E', endCloser: 'G' } },
        upcoming: true
    },
    'Fusaichi Pandora': {
        id: 'fusaichi-pandora', name: 'Fusaichi Pandora', stars: 3, releaseDate: '2025-07-22T22:00:00.000Z', characterId: 111301,
        gametoraId: 111301,
        statBonus: 'STA +10% / GUT +10% / WIT +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'E' }, distance: { sprint: 'G', mile: 'B', medium: 'A', long: 'G' }, style: { frontRunner: 'C', paceChaser: 'A', lateSurger: 'B', endCloser: 'F' } },
        upcoming: true
    },
    'Gentildonna': {
        id: 'gentildonna', name: 'Gentildonna', stars: 3, releaseDate: '2024-08-24T22:00:00.000Z', characterId: 111601,
        gametoraId: 111601,
        statBonus: 'SPD +10% / STA +10% / POW +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'G', mile: 'A', medium: 'A', long: 'A' }, style: { frontRunner: 'E', paceChaser: 'A', lateSurger: 'A', endCloser: 'D' } },
        upcoming: true
    },
    'Gran Alegria': {
        id: 'gran-alegria', name: 'Gran Alegria', stars: 3, releaseDate: '2025-03-11T22:00:00.000Z', characterId: 113101,
        gametoraId: 113101,
        statBonus: 'POW +10% / GUT +20%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'A', mile: 'A', medium: 'C', long: 'G' }, style: { frontRunner: 'F', paceChaser: 'A', lateSurger: 'A', endCloser: 'B' } },
        upcoming: true
    },
    'Hishi Miracle': {
        id: 'hishi-miracle', name: 'Hishi Miracle', stars: 3, releaseDate: '2023-05-10T22:00:00.000Z', characterId: 110601,
        gametoraId: 110601,
        statBonus: 'SPD +7% / STA +8% / POW +7% / GUT +8%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'G', mile: 'G', medium: 'A', long: 'A' }, style: { frontRunner: 'G', paceChaser: 'C', lateSurger: 'A', endCloser: 'B' } },
        upcoming: true
    },
    'Hokko Tarumae': {
        id: 'hokko-tarumae', name: 'Hokko Tarumae', stars: 3, releaseDate: '2023-01-10T22:00:00.000Z', characterId: 109901,
        gametoraId: 109901,
        statBonus: 'SPD +10% / STA +10% / WIT +10%',
        aptitudes: { surface: { turf: 'G', dirt: 'A' }, distance: { sprint: 'F', mile: 'A', medium: 'A', long: 'E' }, style: { frontRunner: 'B', paceChaser: 'A', lateSurger: 'G', endCloser: 'G' } },
        upcoming: true
    },
    'Ikuno Dictus': {
        id: 'ikuno-dictus', name: 'Ikuno Dictus', stars: 2, releaseDate: '2024-02-24T22:00:00.000Z', characterId: 106301,
        gametoraId: 106301,
        statBonus: 'GUT +20% / WIT +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'D', mile: 'A', medium: 'A', long: 'D' }, style: { frontRunner: 'D', paceChaser: 'A', lateSurger: 'A', endCloser: 'D' } },
        upcoming: true
    },
    'Inari One': {
        id: 'inari-one', name: 'Inari One', stars: 3, releaseDate: '2022-06-10T22:00:00.000Z', characterId: 103401,
        gametoraId: 103401,
        statBonus: 'STA +10% / POW +20%',
        aptitudes: { surface: { turf: 'A', dirt: 'A' }, distance: { sprint: 'F', mile: 'B', medium: 'A', long: 'A' }, style: { frontRunner: 'G', paceChaser: 'B', lateSurger: 'B', endCloser: 'A' } },
        upcoming: true
    },
    'Jungle Pocket': {
        id: 'jungle-pocket', name: 'Jungle Pocket', stars: 3, releaseDate: '2024-06-13T22:00:00.000Z', characterId: 109401,
        gametoraId: 109401,
        statBonus: 'SPD +10% / STA +10% / POW +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'G', mile: 'C', medium: 'A', long: 'B' }, style: { frontRunner: 'G', paceChaser: 'D', lateSurger: 'A', endCloser: 'B' } },
        upcoming: true
    },
    'K.S.Miracle': {
        id: 'ksmiracle', name: 'K.S.Miracle', stars: 3, releaseDate: '2023-09-20T22:00:00.000Z', characterId: 109301,
        gametoraId: 109301,
        statBonus: 'SPD +15% / GUT +15%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'A', mile: 'B', medium: 'G', long: 'G' }, style: { frontRunner: 'E', paceChaser: 'A', lateSurger: 'B', endCloser: 'C' } },
        upcoming: true
    },
    'Katsuragi Ace': {
        id: 'katsuragi-ace', name: 'Katsuragi Ace', stars: 3, releaseDate: '2023-07-10T22:00:00.000Z', characterId: 110401,
        gametoraId: 110401,
        statBonus: 'SPD +10% / POW +10% / GUT +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'E', mile: 'B', medium: 'A', long: 'B' }, style: { frontRunner: 'A', paceChaser: 'A', lateSurger: 'E', endCloser: 'G' } },
        upcoming: true
    },
    'Kiseki': {
        id: 'kiseki', name: 'Kiseki', stars: 3, releaseDate: '2026-01-19T22:00:00.000Z', characterId: 113701,
        gametoraId: 113701,
        statBonus: 'SPD +10% / GUT +10% / WIT +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'G', mile: 'C', medium: 'A', long: 'A' }, style: { frontRunner: 'A', paceChaser: 'B', lateSurger: 'A', endCloser: 'E' } },
        upcoming: true
    },
    'Loves Only You': {
        id: 'loves-only-you', name: 'Loves Only You', stars: 3, releaseDate: '2025-05-21T22:00:00.000Z', characterId: 113201,
        gametoraId: 113201,
        statBonus: 'SPD +10% / STA +10% / GUT +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'G', mile: 'C', medium: 'A', long: 'F' }, style: { frontRunner: 'G', paceChaser: 'A', lateSurger: 'A', endCloser: 'G' } },
        upcoming: true
    },
    'Lucky Lilac': {
        id: 'lucky-lilac', name: 'Lucky Lilac', stars: 3, releaseDate: '2026-04-10T22:00:00.000Z', characterId: 113001,
        gametoraId: 113001,
        statBonus: 'POW +10% / GUT +10% / WIT +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'G', mile: 'A', medium: 'A', long: 'C' }, style: { frontRunner: 'F', paceChaser: 'A', lateSurger: 'A', endCloser: 'G' } },
        upcoming: true
    },
    'Marvelous Sunday': {
        id: 'marvelous-sunday', name: 'Marvelous Sunday', stars: 3, releaseDate: '2023-06-19T22:00:00.000Z', characterId: 105501,
        gametoraId: 105501,
        statBonus: 'POW +15% / WIT +15%',
        aptitudes: { surface: { turf: 'A', dirt: 'F' }, distance: { sprint: 'G', mile: 'C', medium: 'A', long: 'B' }, style: { frontRunner: 'G', paceChaser: 'A', lateSurger: 'A', endCloser: 'C' } },
        upcoming: true
    },
    'Mejiro Ramonu': {
        id: 'mejiro-ramonu', name: 'Mejiro Ramonu', stars: 3, releaseDate: '2023-10-19T22:00:00.000Z', characterId: 108601,
        gametoraId: 108601,
        statBonus: 'SPD +15% / WIT +15%',
        aptitudes: { surface: { turf: 'A', dirt: 'F' }, distance: { sprint: 'B', mile: 'A', medium: 'A', long: 'E' }, style: { frontRunner: 'G', paceChaser: 'A', lateSurger: 'A', endCloser: 'F' } },
        upcoming: true
    },
    'Mr. C.B.': {
        id: 'mr-cb', name: 'Mr. C.B.', stars: 3, releaseDate: '2023-02-24T22:00:00.000Z', characterId: 105701,
        gametoraId: 105701,
        statBonus: 'SPD +10% / STA +10% / WIT +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'G', mile: 'B', medium: 'A', long: 'A' }, style: { frontRunner: 'G', paceChaser: 'E', lateSurger: 'A', endCloser: 'A' } },
        upcoming: true
    },
    'Nakayama Festa': {
        id: 'nakayama-festa', name: 'Nakayama Festa', stars: 3, releaseDate: '2022-11-09T22:00:00.000Z', characterId: 104901,
        gametoraId: 104901,
        statBonus: 'SPD +10% / STA +10% / POW +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'G', mile: 'C', medium: 'A', long: 'B' }, style: { frontRunner: 'G', paceChaser: 'A', lateSurger: 'A', endCloser: 'D' } },
        upcoming: true
    },
    'Narita Top Road': {
        id: 'narita-top-road', name: 'Narita Top Road', stars: 3, releaseDate: '2023-08-24T22:00:00.000Z', characterId: 107701,
        gametoraId: 107701,
        statBonus: 'SPD +20% / STA +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'G', mile: 'C', medium: 'A', long: 'A' }, style: { frontRunner: 'F', paceChaser: 'A', lateSurger: 'B', endCloser: 'D' } },
        upcoming: true
    },
    'Neo Universe': {
        id: 'neo-universe', name: 'Neo Universe', stars: 3, releaseDate: '2023-04-19T22:00:00.000Z', characterId: 110501,
        gametoraId: 110501,
        statBonus: 'WIT +30%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'F', mile: 'B', medium: 'A', long: 'B' }, style: { frontRunner: 'F', paceChaser: 'A', lateSurger: 'A', endCloser: 'C' } },
        upcoming: true
    },
    'No Reason': {
        id: 'no-reason', name: 'No Reason', stars: 3, releaseDate: '2025-03-21T22:00:00.000Z', characterId: 109601,
        gametoraId: 109601,
        statBonus: 'STA +20% / WIT +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'G', mile: 'B', medium: 'A', long: 'C' }, style: { frontRunner: 'G', paceChaser: 'D', lateSurger: 'A', endCloser: 'F' } },
        upcoming: true
    },
    'North Flight': {
        id: 'north-flight', name: 'North Flight', stars: 3, releaseDate: '2024-05-20T22:00:00.000Z', characterId: 108201,
        gametoraId: 108201,
        statBonus: 'SPD +20% / WIT +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'C', mile: 'A', medium: 'B', long: 'G' }, style: { frontRunner: 'D', paceChaser: 'A', lateSurger: 'D', endCloser: 'C' } },
        upcoming: true
    },
    'Orfevre': {
        id: 'orfevre', name: 'Orfevre', stars: 3, releaseDate: '2025-02-24T22:00:00.000Z', characterId: 111501,
        gametoraId: 111501,
        statBonus: 'SPD +10% / STA +10% / POW +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'D' }, distance: { sprint: 'G', mile: 'C', medium: 'A', long: 'A' }, style: { frontRunner: 'G', paceChaser: 'F', lateSurger: 'A', endCloser: 'A' } },
        upcoming: true
    },
    'Red Desire': {
        id: 'red-desire', name: 'Red Desire', stars: 3, releaseDate: '2026-05-20T22:00:00.000Z', characterId: 113601,
        gametoraId: 113601,
        statBonus: 'SPD +10% / GUT +10% / WIT +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'B' }, distance: { sprint: 'G', mile: 'A', medium: 'A', long: 'F' }, style: { frontRunner: 'G', paceChaser: 'B', lateSurger: 'A', endCloser: 'F' } },
        upcoming: true
    },
    'Rhein Kraft': {
        id: 'rhein-kraft', name: 'Rhein Kraft', stars: 3, releaseDate: '2024-03-21T22:00:00.000Z', characterId: 110901,
        gametoraId: 110901,
        statBonus: 'POW +15% / GUT +15%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'A', mile: 'A', medium: 'B', long: 'G' }, style: { frontRunner: 'E', paceChaser: 'A', lateSurger: 'C', endCloser: 'G' } },
        upcoming: true
    },
    'Royce and Royce': {
        id: 'royce-and-royce', name: 'Royce and Royce', stars: 2, releaseDate: '2026-02-14T22:00:00.000Z', characterId: 110301,
        gametoraId: 110301,
        statBonus: 'POW +10% / WIT +20%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'G', mile: 'B', medium: 'A', long: 'E' }, style: { frontRunner: 'E', paceChaser: 'A', lateSurger: 'A', endCloser: 'G' } },
        upcoming: true
    },
    'Sakura Laurel': {
        id: 'sakura-laurel', name: 'Sakura Laurel', stars: 3, releaseDate: '2023-04-10T22:00:00.000Z', characterId: 107601,
        gametoraId: 107601,
        statBonus: 'STA +20% / POW +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'E' }, distance: { sprint: 'G', mile: 'C', medium: 'A', long: 'A' }, style: { frontRunner: 'G', paceChaser: 'B', lateSurger: 'A', endCloser: 'B' } },
        upcoming: true
    },
    'Satono Crown': {
        id: 'satono-crown', name: 'Satono Crown', stars: 3, releaseDate: '2023-12-11T22:00:00.000Z', characterId: 108801,
        gametoraId: 108801,
        statBonus: 'POW +15% / GUT +15%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'G', mile: 'B', medium: 'A', long: 'E' }, style: { frontRunner: 'G', paceChaser: 'B', lateSurger: 'A', endCloser: 'D' } },
        upcoming: true
    },
    'Seeking the Pearl': {
        id: 'seeking-the-pearl', name: 'Seeking the Pearl', stars: 3, releaseDate: '2022-09-20T22:00:00.000Z', characterId: 104201,
        gametoraId: 104201,
        statBonus: 'SPD +10% / WIT +20%',
        aptitudes: { surface: { turf: 'A', dirt: 'F' }, distance: { sprint: 'A', mile: 'A', medium: 'E', long: 'G' }, style: { frontRunner: 'C', paceChaser: 'A', lateSurger: 'A', endCloser: 'B' } },
        upcoming: true
    },
    'Shinko Windy': {
        id: 'shinko-windy', name: 'Shinko Windy', stars: 3, releaseDate: '2023-02-13T22:00:00.000Z', characterId: 104301,
        gametoraId: 104301,
        statBonus: 'SPD +10% / POW +10% / GUT +10%',
        aptitudes: { surface: { turf: 'F', dirt: 'A' }, distance: { sprint: 'C', mile: 'A', medium: 'B', long: 'G' }, style: { frontRunner: 'G', paceChaser: 'A', lateSurger: 'B', endCloser: 'F' } },
        upcoming: true
    },
    'Sirius Symboli': {
        id: 'sirius-symboli', name: 'Sirius Symboli', stars: 3, releaseDate: '2023-07-21T22:00:00.000Z', characterId: 107001,
        gametoraId: 107001,
        statBonus: 'POW +10% / WIT +20%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'G', mile: 'B', medium: 'A', long: 'C' }, style: { frontRunner: 'E', paceChaser: 'A', lateSurger: 'C', endCloser: 'E' } },
        upcoming: true
    },
    'Sounds of Earth': {
        id: 'sounds-of-earth', name: 'Sounds of Earth', stars: 3, releaseDate: '2024-04-19T22:00:00.000Z', characterId: 110201,
        gametoraId: 110201,
        statBonus: 'STA +10% / POW +10% / GUT +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'G', mile: 'F', medium: 'A', long: 'A' }, style: { frontRunner: 'G', paceChaser: 'B', lateSurger: 'A', endCloser: 'E' } },
        upcoming: true
    },
    'Stay Gold': {
        id: 'stay-gold', name: 'Stay Gold', stars: 3, releaseDate: '2025-12-21T22:00:00.000Z', characterId: 113501,
        gametoraId: 113501,
        statBonus: 'STA +10% / GUT +20%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'G', mile: 'G', medium: 'A', long: 'A' }, style: { frontRunner: 'G', paceChaser: 'B', lateSurger: 'A', endCloser: 'C' } },
        upcoming: true
    },
    'Still in Love': {
        id: 'still-in-love', name: 'Still in Love', stars: 3, releaseDate: '2025-08-24T22:00:00.000Z', characterId: 109701,
        gametoraId: 109701,
        statBonus: 'STA +10% / POW +10% / GUT +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'C', mile: 'A', medium: 'A', long: 'G' }, style: { frontRunner: 'G', paceChaser: 'A', lateSurger: 'A', endCloser: 'F' } },
        upcoming: true
    },
    'Sweep Tosho': {
        id: 'sweep-tosho', name: 'Sweep Tosho', stars: 3, releaseDate: '2022-06-20T22:00:00.000Z', characterId: 104401,
        gametoraId: 104401,
        statBonus: 'SPD +10% / POW +20%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'E', mile: 'A', medium: 'A', long: 'D' }, style: { frontRunner: 'G', paceChaser: 'G', lateSurger: 'A', endCloser: 'A' } },
        upcoming: true
    },
    'Symboli Kris S': {
        id: 'symboli-kris-s', name: 'Symboli Kris S', stars: 3, releaseDate: '2023-03-20T22:00:00.000Z', characterId: 108301,
        gametoraId: 108301,
        statBonus: 'STA +15% / POW +15%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'G', mile: 'E', medium: 'A', long: 'A' }, style: { frontRunner: 'G', paceChaser: 'A', lateSurger: 'A', endCloser: 'D' } },
        upcoming: true
    },
    'Tanino Gimlet': {
        id: 'tanino-gimlet', name: 'Tanino Gimlet', stars: 3, releaseDate: '2023-05-19T22:00:00.000Z', characterId: 108401,
        gametoraId: 108401,
        statBonus: 'POW +30%',
        aptitudes: { surface: { turf: 'A', dirt: 'F' }, distance: { sprint: 'F', mile: 'A', medium: 'A', long: 'F' }, style: { frontRunner: 'G', paceChaser: 'D', lateSurger: 'A', endCloser: 'A' } },
        upcoming: true
    },
    'Tap Dance City': {
        id: 'tap-dance-city', name: 'Tap Dance City', stars: 3, releaseDate: '2023-11-20T22:00:00.000Z', characterId: 110701,
        gametoraId: 110701,
        statBonus: 'SPD +10% / POW +10% / GUT +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'G', mile: 'E', medium: 'A', long: 'A' }, style: { frontRunner: 'A', paceChaser: 'B', lateSurger: 'F', endCloser: 'G' } },
        upcoming: true
    },
    'Transcend': {
        id: 'transcend', name: 'Transcend', stars: 3, releaseDate: '2024-03-12T22:00:00.000Z', characterId: 108001,
        gametoraId: 108001,
        statBonus: 'SPD +10% / POW +10% / WIT +10%',
        aptitudes: { surface: { turf: 'F', dirt: 'A' }, distance: { sprint: 'G', mile: 'A', medium: 'A', long: 'G' }, style: { frontRunner: 'A', paceChaser: 'B', lateSurger: 'F', endCloser: 'G' } },
        upcoming: true
    },
    'Tsurumaru Tsuyoshi': {
        id: 'tsurumaru-tsuyoshi', name: 'Tsurumaru Tsuyoshi', stars: 2, releaseDate: '2025-02-14T22:00:00.000Z', characterId: 107301,
        gametoraId: 107301,
        statBonus: 'POW +20% / GUT +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'F' }, distance: { sprint: 'F', mile: 'D', medium: 'A', long: 'C' }, style: { frontRunner: 'G', paceChaser: 'A', lateSurger: 'A', endCloser: 'E' } },
        upcoming: true
    },
    'Twin Turbo': {
        id: 'twin-turbo', name: 'Twin Turbo', stars: 1, releaseDate: '2023-02-24T22:00:00.000Z', characterId: 106601,
        gametoraId: 106601,
        statBonus: 'SPD +30%',
        aptitudes: { surface: { turf: 'A', dirt: 'F' }, distance: { sprint: 'G', mile: 'A', medium: 'A', long: 'E' }, style: { frontRunner: 'A', paceChaser: 'G', lateSurger: 'G', endCloser: 'G' } },
        upcoming: true
    },
    'Verxina': {
        id: 'verxina', name: 'Verxina', stars: 3, releaseDate: '2025-05-12T22:00:00.000Z', characterId: 109001,
        gametoraId: 109001,
        statBonus: 'POW +15% / GUT +15%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'D', mile: 'A', medium: 'A', long: 'G' }, style: { frontRunner: 'A', paceChaser: 'A', lateSurger: 'E', endCloser: 'G' } },
        upcoming: true
    },
    'Victoire Pisa': {
        id: 'victoire-pisa', name: 'Victoire Pisa', stars: 3, releaseDate: '2026-03-19T22:00:00.000Z', characterId: 114301,
        gametoraId: 114301,
        statBonus: 'STA +10% / GUT +10% / WIT +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'A' }, distance: { sprint: 'G', mile: 'B', medium: 'A', long: 'B' }, style: { frontRunner: 'G', paceChaser: 'A', lateSurger: 'A', endCloser: 'E' } },
        upcoming: true
    },
    'Vivlos': {
        id: 'vivlos', name: 'Vivlos', stars: 3, releaseDate: '2024-01-19T22:00:00.000Z', characterId: 109101,
        gametoraId: 109101,
        statBonus: 'SPD +10% / POW +10% / WIT +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'E', mile: 'A', medium: 'A', long: 'G' }, style: { frontRunner: 'G', paceChaser: 'D', lateSurger: 'A', endCloser: 'C' } },
        upcoming: true
    },
    'Win Variation': {
        id: 'win-variation', name: 'Win Variation', stars: 3, releaseDate: '2024-12-10T22:00:00.000Z', characterId: 111701,
        gametoraId: 111701,
        statBonus: 'SPD +10% / POW +10% / GUT +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'G', mile: 'E', medium: 'A', long: 'A' }, style: { frontRunner: 'G', paceChaser: 'E', lateSurger: 'A', endCloser: 'A' } },
        upcoming: true
    },
    'Wonder Acute': {
        id: 'wonder-acute', name: 'Wonder Acute', stars: 3, releaseDate: '2022-11-17T22:00:00.000Z', characterId: 110001,
        gametoraId: 110001,
        statBonus: 'GUT +15% / WIT +15%',
        aptitudes: { surface: { turf: 'G', dirt: 'A' }, distance: { sprint: 'D', mile: 'A', medium: 'A', long: 'E' }, style: { frontRunner: 'C', paceChaser: 'A', lateSurger: 'C', endCloser: 'E' } },
        upcoming: true
    },
    'Yamanin Zephyr': {
        id: 'yamanin-zephyr', name: 'Yamanin Zephyr', stars: 3, releaseDate: '2022-10-19T22:00:00.000Z', characterId: 107801,
        gametoraId: 107801,
        statBonus: 'SPD +10% / GUT +10% / WIT +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'D' }, distance: { sprint: 'B', mile: 'A', medium: 'A', long: 'G' }, style: { frontRunner: 'E', paceChaser: 'A', lateSurger: 'C', endCloser: 'G' } },
        upcoming: true
    },
    'Yukino Bijin': {
        id: 'yukino-bijin', name: 'Yukino Bijin', stars: 3, releaseDate: '2022-09-12T22:00:00.000Z', characterId: 102901,
        gametoraId: 102901,
        statBonus: 'SPD +10% / GUT +20%',
        aptitudes: { surface: { turf: 'A', dirt: 'B' }, distance: { sprint: 'D', mile: 'A', medium: 'A', long: 'E' }, style: { frontRunner: 'C', paceChaser: 'A', lateSurger: 'F', endCloser: 'G' } },
        upcoming: true
    },
    'Zenno Rob Roy': {
        id: 'zenno-rob-roy', name: 'Zenno Rob Roy', stars: 3, releaseDate: '2022-12-12T22:00:00.000Z', characterId: 104701,
        gametoraId: 104701,
        statBonus: 'STA +10% / WIT +20%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'G', mile: 'E', medium: 'A', long: 'A' }, style: { frontRunner: 'G', paceChaser: 'A', lateSurger: 'A', endCloser: 'E' } },
        upcoming: true
    },
    // --- JP-only / upcoming variants ---
    'Camping Taiki Shuttle': {
        id: 'camping-taiki-shuttle', name: 'Camping Taiki Shuttle', stars: 3, releaseDate: '2022-06-30T22:00:00.000Z', characterId: 101002,
        gametoraId: 101023,
        statBonus: 'POW +30%',
        aptitudes: { surface: { turf: 'A', dirt: 'B' }, distance: { sprint: 'A', mile: 'A', medium: 'E', long: 'G' }, style: { frontRunner: 'C', paceChaser: 'A', lateSurger: 'E', endCloser: 'G' } },
        upcoming: true
    },
    'Camping Mejiro Dober': {
        id: 'camping-mejiro-dober', name: 'Camping Mejiro Dober', stars: 3, releaseDate: '2022-06-30T22:00:00.000Z', characterId: 105902,
        gametoraId: 105923,
        statBonus: 'SPD +20% / WIT +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'E', mile: 'A', medium: 'A', long: 'F' }, style: { frontRunner: 'C', paceChaser: 'B', lateSurger: 'A', endCloser: 'G' } },
        upcoming: true
    },
    'Commander Special Week': {
        id: 'commander-special-week', name: 'Commander Special Week', stars: 3, releaseDate: '2022-07-20T22:00:00.000Z', characterId: 100103,
        gametoraId: 100102,
        statBonus: 'SPD +10% / STA +10% / WIT +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'F', mile: 'C', medium: 'A', long: 'A' }, style: { frontRunner: 'G', paceChaser: 'A', lateSurger: 'A', endCloser: 'C' } },
        upcoming: true
    },
    'Summer Gold Ship': {
        id: 'summer-gold-ship', name: 'Summer Gold Ship', stars: 3, releaseDate: '2022-07-29T22:00:00.000Z', characterId: 100702,
        gametoraId: 100730,
        statBonus: 'POW +20% / WIT +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'G', mile: 'C', medium: 'A', long: 'A' }, style: { frontRunner: 'G', paceChaser: 'B', lateSurger: 'B', endCloser: 'A' } },
        upcoming: true
    },
    'Summer Mejiro McQueen': {
        id: 'summer-mejiro-mcqueen', name: 'Summer Mejiro McQueen', stars: 3, releaseDate: '2022-07-29T22:00:00.000Z', characterId: 101303,
        gametoraId: 101330,
        statBonus: 'SPD +8% / STA +8% / WIT +14%',
        aptitudes: { surface: { turf: 'A', dirt: 'E' }, distance: { sprint: 'G', mile: 'F', medium: 'A', long: 'A' }, style: { frontRunner: 'B', paceChaser: 'A', lateSurger: 'D', endCloser: 'F' } },
        upcoming: true
    },
    'Grand Live Smart Falcon': {
        id: 'grand-live-smart-falcon', name: 'Grand Live Smart Falcon', stars: 3, releaseDate: '2022-08-24T22:00:00.000Z', characterId: 104602,
        gametoraId: 104602,
        statBonus: 'SPD +20% / GUT +10%',
        aptitudes: { surface: { turf: 'E', dirt: 'A' }, distance: { sprint: 'B', mile: 'A', medium: 'A', long: 'E' }, style: { frontRunner: 'A', paceChaser: 'D', lateSurger: 'G', endCloser: 'G' } },
        upcoming: true
    },
    'Steampunk Winning Ticket': {
        id: 'steampunk-winning-ticket', name: 'Steampunk Winning Ticket', stars: 3, releaseDate: '2022-08-29T22:00:00.000Z', characterId: 103502,
        gametoraId: 103516,
        statBonus: 'SPD +8% / POW +14% / GUT +8%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'G', mile: 'F', medium: 'A', long: 'B' }, style: { frontRunner: 'G', paceChaser: 'B', lateSurger: 'A', endCloser: 'G' } },
        upcoming: true
    },
    'Steampunk Narita Taishin': {
        id: 'steampunk-narita-taishin', name: 'Steampunk Narita Taishin', stars: 3, releaseDate: '2022-08-29T22:00:00.000Z', characterId: 105002,
        gametoraId: 105016,
        statBonus: 'STA +8% / GUT +8% / WIT +14%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'F', mile: 'D', medium: 'A', long: 'A' }, style: { frontRunner: 'G', paceChaser: 'F', lateSurger: 'B', endCloser: 'A' } },
        upcoming: true
    },
    'Halloween Agnes Digital': {
        id: 'halloween-agnes-digital', name: 'Halloween Agnes Digital', stars: 3, releaseDate: '2022-09-29T22:00:00.000Z', characterId: 101902,
        gametoraId: 101940,
        statBonus: 'SPD +7% / STA +7% / POW +8% / GUT +8%',
        aptitudes: { surface: { turf: 'A', dirt: 'A' }, distance: { sprint: 'F', mile: 'A', medium: 'A', long: 'G' }, style: { frontRunner: 'G', paceChaser: 'A', lateSurger: 'A', endCloser: 'B' } },
        upcoming: true
    },
    'Halloween Meisho Doto': {
        id: 'halloween-meisho-doto', name: 'Halloween Meisho Doto', stars: 3, releaseDate: '2022-09-29T22:00:00.000Z', characterId: 105802,
        gametoraId: 105840,
        statBonus: 'POW +15% / WIT +15%',
        aptitudes: { surface: { turf: 'A', dirt: 'E' }, distance: { sprint: 'G', mile: 'F', medium: 'A', long: 'A' }, style: { frontRunner: 'F', paceChaser: 'A', lateSurger: 'B', endCloser: 'E' } },
        upcoming: true
    },
    'Festival Tamamo Cross': {
        id: 'festival-tamamo-cross', name: 'Festival Tamamo Cross', stars: 3, releaseDate: '2022-10-28T22:00:00.000Z', characterId: 102102,
        gametoraId: 102143,
        statBonus: 'SPD +14% / STA +8% / GUT +8%',
        aptitudes: { surface: { turf: 'A', dirt: 'F' }, distance: { sprint: 'G', mile: 'E', medium: 'A', long: 'A' }, style: { frontRunner: 'G', paceChaser: 'A', lateSurger: 'A', endCloser: 'A' } },
        upcoming: true
    },
    'Festival Inari One': {
        id: 'festival-inari-one', name: 'Festival Inari One', stars: 3, releaseDate: '2022-10-28T22:00:00.000Z', characterId: 103402,
        gametoraId: 103443,
        statBonus: 'SPD +14% / POW +8% / WIT +8%',
        aptitudes: { surface: { turf: 'A', dirt: 'A' }, distance: { sprint: 'F', mile: 'B', medium: 'A', long: 'A' }, style: { frontRunner: 'G', paceChaser: 'B', lateSurger: 'B', endCloser: 'A' } },
        upcoming: true
    },
    'Christmas Vodka': {
        id: 'christmas-vodka', name: 'Christmas Vodka', stars: 3, releaseDate: '2022-11-28T22:00:00.000Z', characterId: 100802,
        gametoraId: 100846,
        statBonus: 'SPD +20% / GUT +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'F', mile: 'A', medium: 'A', long: 'E' }, style: { frontRunner: 'C', paceChaser: 'B', lateSurger: 'A', endCloser: 'F' } },
        upcoming: true
    },
    'Christmas Daiwa Scarlet': {
        id: 'christmas-daiwa-scarlet', name: 'Christmas Daiwa Scarlet', stars: 3, releaseDate: '2022-11-28T22:00:00.000Z', characterId: 100902,
        gametoraId: 100946,
        statBonus: 'SPD +20% / WIT +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'F', mile: 'B', medium: 'A', long: 'A' }, style: { frontRunner: 'A', paceChaser: 'A', lateSurger: 'E', endCloser: 'G' } },
        upcoming: true
    },
    'Blaze Narita Brian': {
        id: 'blaze-narita-brian', name: 'Blaze Narita Brian', stars: 3, releaseDate: '2022-12-20T22:00:00.000Z', characterId: 101602,
        gametoraId: 101602,
        statBonus: 'SPD +10% / STA +10% / GUT +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'F', mile: 'B', medium: 'A', long: 'A' }, style: { frontRunner: 'G', paceChaser: 'A', lateSurger: 'A', endCloser: 'D' } },
        upcoming: true
    },
    "New Year's Satono Diamond": {
        id: 'new-year-s-satono-diamond', name: "New Year's Satono Diamond", stars: 3, releaseDate: '2022-12-29T22:00:00.000Z', characterId: 106702,
        gametoraId: 106710,
        statBonus: 'SPD +15% / STA +15%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'G', mile: 'C', medium: 'A', long: 'A' }, style: { frontRunner: 'G', paceChaser: 'B', lateSurger: 'A', endCloser: 'D' } },
        upcoming: true
    },
    "New Year's Kitasan Black": {
        id: 'new-year-s-kitasan-black', name: "New Year's Kitasan Black", stars: 3, releaseDate: '2022-12-29T22:00:00.000Z', characterId: 106802,
        gametoraId: 106810,
        statBonus: 'SPD +10% / POW +10% / WIT +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'E', mile: 'C', medium: 'A', long: 'A' }, style: { frontRunner: 'A', paceChaser: 'B', lateSurger: 'C', endCloser: 'G' } },
        upcoming: true
    },
    'Valentine Mejiro Ryan': {
        id: 'valentine-mejiro-ryan', name: 'Valentine Mejiro Ryan', stars: 3, releaseDate: '2023-01-30T22:00:00.000Z', characterId: 102702,
        gametoraId: 102713,
        statBonus: 'SPD +20% / WIT +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'E', mile: 'C', medium: 'A', long: 'B' }, style: { frontRunner: 'F', paceChaser: 'A', lateSurger: 'A', endCloser: 'F' } },
        upcoming: true
    },
    'Valentine Ines Fujin': {
        id: 'valentine-ines-fujin', name: 'Valentine Ines Fujin', stars: 3, releaseDate: '2023-01-30T22:00:00.000Z', characterId: 103102,
        gametoraId: 103113,
        statBonus: 'SPD +14% / GUT +8% / WIT +8%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'G', mile: 'A', medium: 'A', long: 'C' }, style: { frontRunner: 'A', paceChaser: 'C', lateSurger: 'G', endCloser: 'G' } },
        upcoming: true
    },
    'Ballroom Sakura Chiyono O': {
        id: 'ballroom-sakura-chiyono-o', name: 'Ballroom Sakura Chiyono O', stars: 3, releaseDate: '2023-03-29T22:00:00.000Z', characterId: 106902,
        gametoraId: 106920,
        statBonus: 'SPD +8% / POW +14% / WIT +8%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'E', mile: 'A', medium: 'A', long: 'E' }, style: { frontRunner: 'B', paceChaser: 'A', lateSurger: 'F', endCloser: 'G' } },
        upcoming: true
    },
    'Ballroom Mejiro Ardan': {
        id: 'ballroom-mejiro-ardan', name: 'Ballroom Mejiro Ardan', stars: 3, releaseDate: '2023-03-29T22:00:00.000Z', characterId: 107102,
        gametoraId: 107120,
        statBonus: 'SPD +8% / STA +8% / WIT +14%',
        aptitudes: { surface: { turf: 'A', dirt: 'F' }, distance: { sprint: 'E', mile: 'B', medium: 'A', long: 'D' }, style: { frontRunner: 'C', paceChaser: 'A', lateSurger: 'D', endCloser: 'G' } },
        upcoming: true
    },
    'Sports Fest Sakura Bakushin O': {
        id: 'sports-fest-sakura-bakushin-o', name: 'Sports Fest Sakura Bakushin O', stars: 3, releaseDate: '2023-04-28T22:00:00.000Z', characterId: 104102,
        gametoraId: 104150,
        statBonus: 'SPD +14% / POW +8% / WIT +8%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'A', mile: 'B', medium: 'G', long: 'G' }, style: { frontRunner: 'A', paceChaser: 'A', lateSurger: 'F', endCloser: 'G' } },
        upcoming: true
    },
    'Sports Fest Matikanetannhauser': {
        id: 'sports-fest-matikanetannhauser', name: 'Sports Fest Matikanetannhauser', stars: 3, releaseDate: '2023-04-28T22:00:00.000Z', characterId: 106202,
        gametoraId: 106250,
        statBonus: 'SPD +10% / POW +20%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'G', mile: 'D', medium: 'A', long: 'A' }, style: { frontRunner: 'F', paceChaser: 'A', lateSurger: 'A', endCloser: 'E' } },
        upcoming: true
    },
    'Wedding Hishi Amazon': {
        id: 'wedding-hishi-amazon', name: 'Wedding Hishi Amazon', stars: 3, releaseDate: '2023-05-29T22:00:00.000Z', characterId: 101202,
        gametoraId: 101226,
        statBonus: 'SPD +10% / POW +10% / WIT +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'E' }, distance: { sprint: 'D', mile: 'A', medium: 'A', long: 'B' }, style: { frontRunner: 'G', paceChaser: 'B', lateSurger: 'C', endCloser: 'A' } },
        upcoming: true
    },
    'Wedding Nishino Flower': {
        id: 'wedding-nishino-flower', name: 'Wedding Nishino Flower', stars: 3, releaseDate: '2023-05-29T22:00:00.000Z', characterId: 105102,
        gametoraId: 105126,
        statBonus: 'SPD +10% / WIT +20%',
        aptitudes: { surface: { turf: 'A', dirt: 'F' }, distance: { sprint: 'A', mile: 'A', medium: 'E', long: 'G' }, style: { frontRunner: 'F', paceChaser: 'A', lateSurger: 'A', endCloser: 'G' } },
        upcoming: true
    },
    'Summer Trip Tosen Jordan': {
        id: 'summer-trip-tosen-jordan', name: 'Summer Trip Tosen Jordan', stars: 3, releaseDate: '2023-06-29T22:00:00.000Z', characterId: 104802,
        gametoraId: 104823,
        statBonus: 'SPD +8% / STA +8% / POW +14%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'G', mile: 'F', medium: 'A', long: 'B' }, style: { frontRunner: 'C', paceChaser: 'A', lateSurger: 'A', endCloser: 'G' } },
        upcoming: true
    },
    'Summer Trip Bamboo Memory': {
        id: 'summer-trip-bamboo-memory', name: 'Summer Trip Bamboo Memory', stars: 3, releaseDate: '2023-06-29T22:00:00.000Z', characterId: 105302,
        gametoraId: 105323,
        statBonus: 'SPD +14% / POW +8% / GUT +8%',
        aptitudes: { surface: { turf: 'A', dirt: 'D' }, distance: { sprint: 'A', mile: 'A', medium: 'C', long: 'G' }, style: { frontRunner: 'G', paceChaser: 'E', lateSurger: 'A', endCloser: 'C' } },
        upcoming: true
    },
    'Summer Silence Suzuka': {
        id: 'summer-silence-suzuka', name: 'Summer Silence Suzuka', stars: 3, releaseDate: '2023-07-31T22:00:00.000Z', characterId: 100202,
        gametoraId: 100230,
        statBonus: 'SPD +15% / STA +15%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'D', mile: 'A', medium: 'A', long: 'E' }, style: { frontRunner: 'A', paceChaser: 'C', lateSurger: 'E', endCloser: 'G' } },
        upcoming: true
    },
    'Summer Agnes Tachyon': {
        id: 'summer-agnes-tachyon', name: 'Summer Agnes Tachyon', stars: 3, releaseDate: '2023-07-31T22:00:00.000Z', characterId: 103202,
        gametoraId: 103230,
        statBonus: 'SPD +8% / POW +8% / WIT +14%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'G', mile: 'D', medium: 'A', long: 'B' }, style: { frontRunner: 'E', paceChaser: 'A', lateSurger: 'B', endCloser: 'F' } },
        upcoming: true
    },
    "L'Arc Gold Ship": {
        id: 'l-arc-gold-ship', name: "L'Arc Gold Ship", stars: 3, releaseDate: '2023-08-31T22:00:00.000Z', characterId: 100703,
        gametoraId: 100702,
        statBonus: 'SPD +8% / STA +14% / POW +8%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'G', mile: 'C', medium: 'A', long: 'A' }, style: { frontRunner: 'G', paceChaser: 'B', lateSurger: 'B', endCloser: 'A' } },
        upcoming: true
    },
    "L'Arc Satono Diamond": {
        id: 'l-arc-satono-diamond', name: "L'Arc Satono Diamond", stars: 3, releaseDate: '2023-09-11T22:00:00.000Z', characterId: 106703,
        gametoraId: 106702,
        statBonus: 'SPD +8% / STA +14% / GUT +8%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'G', mile: 'C', medium: 'A', long: 'A' }, style: { frontRunner: 'G', paceChaser: 'B', lateSurger: 'A', endCloser: 'D' } },
        upcoming: true
    },
    'Halloween Air Shakur': {
        id: 'halloween-air-shakur', name: 'Halloween Air Shakur', stars: 3, releaseDate: '2023-09-29T22:00:00.000Z', characterId: 103602,
        gametoraId: 103640,
        statBonus: 'STA +14% / POW +8% / WIT +8%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'G', mile: 'E', medium: 'A', long: 'A' }, style: { frontRunner: 'G', paceChaser: 'C', lateSurger: 'A', endCloser: 'A' } },
        upcoming: true
    },
    'Halloween Symboli Kris S': {
        id: 'halloween-symboli-kris-s', name: 'Halloween Symboli Kris S', stars: 3, releaseDate: '2023-09-29T22:00:00.000Z', characterId: 108302,
        gametoraId: 108340,
        statBonus: 'SPD +15% / POW +15%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'G', mile: 'E', medium: 'A', long: 'A' }, style: { frontRunner: 'G', paceChaser: 'A', lateSurger: 'A', endCloser: 'D' } },
        upcoming: true
    },
    'Festival Tokai Teio': {
        id: 'festival-tokai-teio', name: 'Festival Tokai Teio', stars: 3, releaseDate: '2023-10-30T22:00:00.000Z', characterId: 100303,
        gametoraId: 100343,
        statBonus: 'SPD +10% / STA +10% / WIT +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'F', mile: 'E', medium: 'A', long: 'A' }, style: { frontRunner: 'D', paceChaser: 'A', lateSurger: 'C', endCloser: 'E' } },
        upcoming: true
    },
    'Festival Kawakami Princess': {
        id: 'festival-kawakami-princess', name: 'Festival Kawakami Princess', stars: 3, releaseDate: '2023-10-30T22:00:00.000Z', characterId: 103902,
        gametoraId: 103943,
        statBonus: 'STA +8% / POW +8% / GUT +14%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'D', mile: 'B', medium: 'A', long: 'F' }, style: { frontRunner: 'G', paceChaser: 'C', lateSurger: 'A', endCloser: 'D' } },
        upcoming: true
    },
    'Christmas Mejiro Palmer': {
        id: 'christmas-mejiro-palmer', name: 'Christmas Mejiro Palmer', stars: 3, releaseDate: '2023-11-30T22:00:00.000Z', characterId: 106402,
        gametoraId: 106446,
        statBonus: 'SPD +10% / STA +20%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'G', mile: 'F', medium: 'A', long: 'A' }, style: { frontRunner: 'A', paceChaser: 'E', lateSurger: 'F', endCloser: 'G' } },
        upcoming: true
    },
    'Christmas Mejiro Bright': {
        id: 'christmas-mejiro-bright', name: 'Christmas Mejiro Bright', stars: 3, releaseDate: '2023-11-30T22:00:00.000Z', characterId: 107402,
        gametoraId: 107446,
        statBonus: 'STA +20% / WIT +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'F', mile: 'C', medium: 'A', long: 'A' }, style: { frontRunner: 'G', paceChaser: 'D', lateSurger: 'A', endCloser: 'A' } },
        upcoming: true
    },
    'Anime Kitasan Black': {
        id: 'anime-kitasan-black', name: 'Anime Kitasan Black', stars: 3, releaseDate: '2023-12-28T22:00:00.000Z', characterId: 106803,
        gametoraId: 106802,
        statBonus: 'SPD +10% / GUT +20%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'E', mile: 'C', medium: 'A', long: 'A' }, style: { frontRunner: 'A', paceChaser: 'B', lateSurger: 'C', endCloser: 'G' } },
        upcoming: true
    },
    "New Year's Nice Nature": {
        id: 'new-year-s-nice-nature', name: "New Year's Nice Nature", stars: 3, releaseDate: '2024-01-09T22:00:00.000Z', characterId: 106003,
        gametoraId: 106010,
        statBonus: 'SPD +14% / POW +8% / WIT +8%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'G', mile: 'C', medium: 'A', long: 'A' }, style: { frontRunner: 'F', paceChaser: 'B', lateSurger: 'A', endCloser: 'D' } },
        upcoming: true
    },
    'Valentine Manhattan Cafe': {
        id: 'valentine-manhattan-cafe', name: 'Valentine Manhattan Cafe', stars: 3, releaseDate: '2024-01-31T22:00:00.000Z', characterId: 102502,
        gametoraId: 102513,
        statBonus: 'STA +20% / POW +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'G', mile: 'F', medium: 'B', long: 'A' }, style: { frontRunner: 'G', paceChaser: 'C', lateSurger: 'A', endCloser: 'A' } },
        upcoming: true
    },
    'Valentine Yukino Bijin': {
        id: 'valentine-yukino-bijin', name: 'Valentine Yukino Bijin', stars: 3, releaseDate: '2024-01-31T22:00:00.000Z', characterId: 102902,
        gametoraId: 102913,
        statBonus: 'SPD +8% / POW +8% / GUT +14%',
        aptitudes: { surface: { turf: 'A', dirt: 'A' }, distance: { sprint: 'D', mile: 'A', medium: 'A', long: 'E' }, style: { frontRunner: 'C', paceChaser: 'A', lateSurger: 'F', endCloser: 'G' } },
        upcoming: true
    },
    'Ballroom Daitaku Helios': {
        id: 'ballroom-daitaku-helios', name: 'Ballroom Daitaku Helios', stars: 3, releaseDate: '2024-03-29T22:00:00.000Z', characterId: 106502,
        gametoraId: 106520,
        statBonus: 'SPD +8% / POW +14% / GUT +8%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'B', mile: 'A', medium: 'B', long: 'E' }, style: { frontRunner: 'A', paceChaser: 'A', lateSurger: 'G', endCloser: 'G' } },
        upcoming: true
    },
    'Ballroom Daiichi Ruby': {
        id: 'ballroom-daiichi-ruby', name: 'Ballroom Daiichi Ruby', stars: 3, releaseDate: '2024-03-29T22:00:00.000Z', characterId: 108502,
        gametoraId: 108520,
        statBonus: 'SPD +6% / POW +12% / WIT +12%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'A', mile: 'A', medium: 'C', long: 'G' }, style: { frontRunner: 'E', paceChaser: 'B', lateSurger: 'A', endCloser: 'A' } },
        upcoming: true
    },
    'UAF Winning Ticket': {
        id: 'uaf-winning-ticket', name: 'UAF Winning Ticket', stars: 3, releaseDate: '2024-04-09T22:00:00.000Z', characterId: 103503,
        gametoraId: 103502,
        statBonus: 'SPD +10% / STA +10% / POW +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'G', mile: 'F', medium: 'A', long: 'B' }, style: { frontRunner: 'G', paceChaser: 'B', lateSurger: 'A', endCloser: 'G' } },
        upcoming: true
    },
    'Warfare Super Creek': {
        id: 'warfare-super-creek', name: 'Warfare Super Creek', stars: 3, releaseDate: '2024-04-30T22:00:00.000Z', characterId: 104503,
        gametoraId: 104550,
        statBonus: 'SPD +10% / STA +13% / WIT +7%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'G', mile: 'G', medium: 'A', long: 'A' }, style: { frontRunner: 'D', paceChaser: 'A', lateSurger: 'B', endCloser: 'G' } },
        upcoming: true
    },
    'Warfare Yaeno Muteki': {
        id: 'warfare-yaeno-muteki', name: 'Warfare Yaeno Muteki', stars: 3, releaseDate: '2024-04-30T22:00:00.000Z', characterId: 107202,
        gametoraId: 107250,
        statBonus: 'STA +6% / POW +12% / GUT +12%',
        aptitudes: { surface: { turf: 'A', dirt: 'E' }, distance: { sprint: 'G', mile: 'B', medium: 'A', long: 'E' }, style: { frontRunner: 'F', paceChaser: 'A', lateSurger: 'A', endCloser: 'G' } },
        upcoming: true
    },
    'Alt Agnes Tachyon': {
        id: 'alt-agnes-tachyon', name: 'Alt Agnes Tachyon', stars: 3, releaseDate: '2024-05-10T22:00:00.000Z', characterId: 103203,
        gametoraId: 103202,
        statBonus: 'SPD +14% / POW +8% / WIT +8%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'G', mile: 'D', medium: 'A', long: 'B' }, style: { frontRunner: 'E', paceChaser: 'A', lateSurger: 'B', endCloser: 'F' } },
        upcoming: true
    },
    'Wedding Sweep Tosho': {
        id: 'wedding-sweep-tosho', name: 'Wedding Sweep Tosho', stars: 3, releaseDate: '2024-05-30T22:00:00.000Z', characterId: 104402,
        gametoraId: 104426,
        statBonus: 'SPD +10% / POW +10% / GUT +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'E', mile: 'A', medium: 'A', long: 'D' }, style: { frontRunner: 'G', paceChaser: 'G', lateSurger: 'A', endCloser: 'A' } },
        upcoming: true
    },
    'Wedding King Halo': {
        id: 'wedding-king-halo', name: 'Wedding King Halo', stars: 3, releaseDate: '2024-05-30T22:00:00.000Z', characterId: 106103,
        gametoraId: 106126,
        statBonus: 'POW +10% / GUT +10% / WIT +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'A', mile: 'A', medium: 'B', long: 'C' }, style: { frontRunner: 'G', paceChaser: 'B', lateSurger: 'A', endCloser: 'D' } },
        upcoming: true
    },
    'GFF Rice Shower': {
        id: 'gff-rice-shower', name: 'GFF Rice Shower', stars: 3, releaseDate: '2024-07-09T22:00:00.000Z', characterId: 103003,
        gametoraId: 103002,
        statBonus: 'STA +20% / GUT +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'E', mile: 'C', medium: 'A', long: 'A' }, style: { frontRunner: 'B', paceChaser: 'A', lateSurger: 'C', endCloser: 'G' } },
        upcoming: true
    },
    'Summer Trip Eishin Flash': {
        id: 'summer-trip-eishin-flash', name: 'Summer Trip Eishin Flash', stars: 3, releaseDate: '2024-07-29T22:00:00.000Z', characterId: 103703,
        gametoraId: 103730,
        statBonus: 'STA +10% / GUT +10% / WIT +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'G', mile: 'F', medium: 'A', long: 'A' }, style: { frontRunner: 'G', paceChaser: 'B', lateSurger: 'A', endCloser: 'C' } },
        upcoming: true
    },
    'Summer Trip Hokko Tarumae': {
        id: 'summer-trip-hokko-tarumae', name: 'Summer Trip Hokko Tarumae', stars: 3, releaseDate: '2024-07-29T22:00:00.000Z', characterId: 109902,
        gametoraId: 109930,
        statBonus: 'SPD +15% / STA +10% / WIT +5%',
        aptitudes: { surface: { turf: 'G', dirt: 'A' }, distance: { sprint: 'F', mile: 'A', medium: 'A', long: 'E' }, style: { frontRunner: 'B', paceChaser: 'A', lateSurger: 'G', endCloser: 'G' } },
        upcoming: true
    },
    'Autumn Zenno Rob Roy': {
        id: 'autumn-zenno-rob-roy', name: 'Autumn Zenno Rob Roy', stars: 3, releaseDate: '2024-08-30T22:00:00.000Z', characterId: 104702,
        gametoraId: 104723,
        statBonus: 'SPD +10% / POW +10% / WIT +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'G', mile: 'E', medium: 'A', long: 'A' }, style: { frontRunner: 'G', paceChaser: 'A', lateSurger: 'A', endCloser: 'E' } },
        upcoming: true
    },
    'Autumn Neo Universe': {
        id: 'autumn-neo-universe', name: 'Autumn Neo Universe', stars: 3, releaseDate: '2024-08-30T22:00:00.000Z', characterId: 110502,
        gametoraId: 110523,
        statBonus: 'POW +7% / GUT +10% / WIT +13%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'F', mile: 'B', medium: 'A', long: 'B' }, style: { frontRunner: 'F', paceChaser: 'A', lateSurger: 'A', endCloser: 'C' } },
        upcoming: true
    },
    'Halloween Mayano Top Gun': {
        id: 'halloween-mayano-top-gun', name: 'Halloween Mayano Top Gun', stars: 3, releaseDate: '2024-09-30T22:00:00.000Z', characterId: 102403,
        gametoraId: 102440,
        statBonus: 'SPD +8% / STA +15% / WIT +7%',
        aptitudes: { surface: { turf: 'A', dirt: 'E' }, distance: { sprint: 'D', mile: 'D', medium: 'A', long: 'A' }, style: { frontRunner: 'A', paceChaser: 'A', lateSurger: 'B', endCloser: 'B' } },
        upcoming: true
    },
    'Halloween Seeking the Pearl': {
        id: 'halloween-seeking-the-pearl', name: 'Halloween Seeking the Pearl', stars: 3, releaseDate: '2024-09-30T22:00:00.000Z', characterId: 104202,
        gametoraId: 104240,
        statBonus: 'SPD +10% / POW +13% / WIT +7%',
        aptitudes: { surface: { turf: 'A', dirt: 'F' }, distance: { sprint: 'A', mile: 'A', medium: 'E', long: 'G' }, style: { frontRunner: 'C', paceChaser: 'A', lateSurger: 'A', endCloser: 'B' } },
        upcoming: true
    },
    'Mecha Biwa Hayahide': {
        id: 'mecha-biwa-hayahide', name: 'Mecha Biwa Hayahide', stars: 3, releaseDate: '2024-10-29T22:00:00.000Z', characterId: 102303,
        gametoraId: 102302,
        statBonus: 'STA +10% / POW +10% / GUT +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'F' }, distance: { sprint: 'F', mile: 'C', medium: 'A', long: 'A' }, style: { frontRunner: 'E', paceChaser: 'A', lateSurger: 'B', endCloser: 'E' } },
        upcoming: true
    },
    'Mecha Narita Taishin': {
        id: 'mecha-narita-taishin', name: 'Mecha Narita Taishin', stars: 3, releaseDate: '2024-11-08T22:00:00.000Z', characterId: 105003,
        gametoraId: 105002,
        statBonus: 'POW +20% / WIT +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'F', mile: 'D', medium: 'A', long: 'A' }, style: { frontRunner: 'G', paceChaser: 'F', lateSurger: 'B', endCloser: 'A' } },
        upcoming: true
    },
    'Christmas Admire Vega': {
        id: 'christmas-admire-vega', name: 'Christmas Admire Vega', stars: 3, releaseDate: '2024-11-28T22:00:00.000Z', characterId: 103302,
        gametoraId: 103346,
        statBonus: 'SPD +10% / POW +20%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'F', mile: 'C', medium: 'A', long: 'C' }, style: { frontRunner: 'G', paceChaser: 'G', lateSurger: 'B', endCloser: 'A' } },
        upcoming: true
    },
    'Christmas Narita Top Road': {
        id: 'christmas-narita-top-road', name: 'Christmas Narita Top Road', stars: 3, releaseDate: '2024-11-28T22:00:00.000Z', characterId: 107702,
        gametoraId: 107746,
        statBonus: 'STA +10% / POW +20%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'G', mile: 'C', medium: 'A', long: 'A' }, style: { frontRunner: 'F', paceChaser: 'A', lateSurger: 'B', endCloser: 'D' } },
        upcoming: true
    },
    "New Year's Grass Wonder": {
        id: 'new-year-s-grass-wonder', name: "New Year's Grass Wonder", stars: 3, releaseDate: '2024-12-19T22:00:00.000Z', characterId: 101103,
        gametoraId: 101102,
        statBonus: 'GUT +20% / WIT +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'G', mile: 'B', medium: 'A', long: 'A' }, style: { frontRunner: 'F', paceChaser: 'A', lateSurger: 'A', endCloser: 'F' } },
        upcoming: true
    },
    "New Year's Mr. C.B.": {
        id: 'new-year-s-mr-c-b', name: "New Year's Mr. C.B.", stars: 3, releaseDate: '2024-12-27T22:00:00.000Z', characterId: 105702,
        gametoraId: 105710,
        statBonus: 'SPD +20% / POW +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'G', mile: 'B', medium: 'A', long: 'A' }, style: { frontRunner: 'G', paceChaser: 'E', lateSurger: 'A', endCloser: 'A' } },
        upcoming: true
    },
    "New Year's Katsuragi Ace": {
        id: 'new-year-s-katsuragi-ace', name: "New Year's Katsuragi Ace", stars: 3, releaseDate: '2024-12-27T22:00:00.000Z', characterId: 110402,
        gametoraId: 110410,
        statBonus: 'SPD +5% / POW +10% / GUT +15%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'E', mile: 'B', medium: 'A', long: 'B' }, style: { frontRunner: 'A', paceChaser: 'A', lateSurger: 'E', endCloser: 'G' } },
        upcoming: true
    },
    "New Year's Maruzensky": {
        id: 'new-year-s-maruzensky', name: "New Year's Maruzensky", stars: 3, releaseDate: '2025-01-10T22:00:00.000Z', characterId: 100403,
        gametoraId: 100410,
        statBonus: 'SPD +15% / POW +15%',
        aptitudes: { surface: { turf: 'A', dirt: 'D' }, distance: { sprint: 'B', mile: 'A', medium: 'B', long: 'C' }, style: { frontRunner: 'A', paceChaser: 'E', lateSurger: 'G', endCloser: 'G' } },
        upcoming: true
    },
    'Valentine Yamanin Zephyr': {
        id: 'valentine-yamanin-zephyr', name: 'Valentine Yamanin Zephyr', stars: 3, releaseDate: '2025-01-31T22:00:00.000Z', characterId: 107802,
        gametoraId: 107813,
        statBonus: 'POW +15% / GUT +15%',
        aptitudes: { surface: { turf: 'A', dirt: 'D' }, distance: { sprint: 'B', mile: 'A', medium: 'A', long: 'G' }, style: { frontRunner: 'E', paceChaser: 'A', lateSurger: 'C', endCloser: 'G' } },
        upcoming: true
    },
    'Valentine Aston Machan': {
        id: 'valentine-aston-machan', name: 'Valentine Aston Machan', stars: 3, releaseDate: '2025-01-31T22:00:00.000Z', characterId: 108702,
        gametoraId: 108713,
        statBonus: 'SPD +10% / POW +10% / GUT +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'A', mile: 'B', medium: 'G', long: 'G' }, style: { frontRunner: 'A', paceChaser: 'A', lateSurger: 'G', endCloser: 'G' } },
        upcoming: true
    },
    'Ballroom Tanino Gimlet': {
        id: 'ballroom-tanino-gimlet', name: 'Ballroom Tanino Gimlet', stars: 3, releaseDate: '2025-03-31T22:00:00.000Z', characterId: 108402,
        gametoraId: 108420,
        statBonus: 'SPD +10% / POW +10% / GUT +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'F' }, distance: { sprint: 'F', mile: 'A', medium: 'A', long: 'F' }, style: { frontRunner: 'G', paceChaser: 'D', lateSurger: 'A', endCloser: 'A' } },
        upcoming: true
    },
    'Ballroom Tap Dance City': {
        id: 'ballroom-tap-dance-city', name: 'Ballroom Tap Dance City', stars: 3, releaseDate: '2025-03-31T22:00:00.000Z', characterId: 110702,
        gametoraId: 110720,
        statBonus: 'SPD +10% / GUT +20%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'G', mile: 'E', medium: 'A', long: 'A' }, style: { frontRunner: 'A', paceChaser: 'B', lateSurger: 'F', endCloser: 'G' } },
        upcoming: true
    },
    'Twinkle Sirius Symboli': {
        id: 'twinkle-sirius-symboli', name: 'Twinkle Sirius Symboli', stars: 3, releaseDate: '2025-04-10T22:00:00.000Z', characterId: 107002,
        gametoraId: 107002,
        statBonus: 'POW +10% / GUT +20%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'G', mile: 'B', medium: 'A', long: 'C' }, style: { frontRunner: 'E', paceChaser: 'A', lateSurger: 'A', endCloser: 'E' } },
        upcoming: true
    },
    'Parade Smart Falcon': {
        id: 'parade-smart-falcon', name: 'Parade Smart Falcon', stars: 3, releaseDate: '2025-04-30T22:00:00.000Z', characterId: 104603,
        gametoraId: 104650,
        statBonus: 'STA +10% / POW +10% / GUT +10%',
        aptitudes: { surface: { turf: 'E', dirt: 'A' }, distance: { sprint: 'B', mile: 'A', medium: 'A', long: 'E' }, style: { frontRunner: 'A', paceChaser: 'D', lateSurger: 'G', endCloser: 'G' } },
        upcoming: true
    },
    'Parade Copano Rickey': {
        id: 'parade-copano-rickey', name: 'Parade Copano Rickey', stars: 3, releaseDate: '2025-04-30T22:00:00.000Z', characterId: 109802,
        gametoraId: 109850,
        statBonus: 'STA +10% / POW +5% / GUT +10% / WIT +5%',
        aptitudes: { surface: { turf: 'F', dirt: 'A' }, distance: { sprint: 'C', mile: 'A', medium: 'A', long: 'G' }, style: { frontRunner: 'A', paceChaser: 'A', lateSurger: 'C', endCloser: 'G' } },
        upcoming: true
    },
    'Wedding Mejiro Ramonu': {
        id: 'wedding-mejiro-ramonu', name: 'Wedding Mejiro Ramonu', stars: 3, releaseDate: '2025-05-30T22:00:00.000Z', characterId: 108602,
        gametoraId: 108626,
        statBonus: 'POW +15% / GUT +5% / WIT +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'F' }, distance: { sprint: 'B', mile: 'A', medium: 'A', long: 'E' }, style: { frontRunner: 'G', paceChaser: 'A', lateSurger: 'A', endCloser: 'F' } },
        upcoming: true
    },
    'Wedding Cesario': {
        id: 'wedding-cesario', name: 'Wedding Cesario', stars: 3, releaseDate: '2025-05-30T22:00:00.000Z', characterId: 111002,
        gametoraId: 111026,
        statBonus: 'POW +10% / GUT +20%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'G', mile: 'A', medium: 'A', long: 'F' }, style: { frontRunner: 'G', paceChaser: 'A', lateSurger: 'A', endCloser: 'C' } },
        upcoming: true
    },
    'Island Gold City': {
        id: 'island-gold-city', name: 'Island Gold City', stars: 3, releaseDate: '2025-06-27T22:00:00.000Z', characterId: 104003,
        gametoraId: 104002,
        statBonus: 'STA +10% / GUT +15% / WIT +5%',
        aptitudes: { surface: { turf: 'A', dirt: 'D' }, distance: { sprint: 'F', mile: 'B', medium: 'A', long: 'A' }, style: { frontRunner: 'F', paceChaser: 'A', lateSurger: 'A', endCloser: 'F' } },
        upcoming: true
    },
    'Island Ines Fujin': {
        id: 'island-ines-fujin', name: 'Island Ines Fujin', stars: 3, releaseDate: '2025-07-11T22:00:00.000Z', characterId: 103103,
        gametoraId: 103102,
        statBonus: 'SPD +12% / POW +10% / GUT +8%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'G', mile: 'A', medium: 'A', long: 'C' }, style: { frontRunner: 'A', paceChaser: 'C', lateSurger: 'G', endCloser: 'G' } },
        upcoming: true
    },
    'Alt Rhein Kraft': {
        id: 'alt-rhein-kraft', name: 'Alt Rhein Kraft', stars: 3, releaseDate: '2025-07-22T22:00:00.000Z', characterId: 110902,
        gametoraId: 110902,
        statBonus: 'SPD +5% / POW +15% / WIT +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'B', mile: 'A', medium: 'A', long: 'G' }, style: { frontRunner: 'E', paceChaser: 'A', lateSurger: 'C', endCloser: 'G' } },
        upcoming: true
    },
    'Summer Satono Crown': {
        id: 'summer-satono-crown', name: 'Summer Satono Crown', stars: 3, releaseDate: '2025-07-31T22:00:00.000Z', characterId: 108802,
        gametoraId: 108830,
        statBonus: 'STA +10% / POW +6% / GUT +14%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'G', mile: 'B', medium: 'A', long: 'E' }, style: { frontRunner: 'G', paceChaser: 'B', lateSurger: 'A', endCloser: 'D' } },
        upcoming: true
    },
    'Summer Cheval Grand': {
        id: 'summer-cheval-grand', name: 'Summer Cheval Grand', stars: 3, releaseDate: '2025-07-31T22:00:00.000Z', characterId: 108902,
        gametoraId: 108930,
        statBonus: 'STA +10% / GUT +20%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'G', mile: 'G', medium: 'A', long: 'A' }, style: { frontRunner: 'G', paceChaser: 'A', lateSurger: 'B', endCloser: 'F' } },
        upcoming: true
    },
    'Summer Vivlos': {
        id: 'summer-vivlos', name: 'Summer Vivlos', stars: 3, releaseDate: '2025-08-14T22:00:00.000Z', characterId: 109102,
        gametoraId: 109130,
        statBonus: 'SPD +10% / GUT +10% / WIT +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'E', mile: 'A', medium: 'A', long: 'G' }, style: { frontRunner: 'G', paceChaser: 'D', lateSurger: 'A', endCloser: 'C' } },
        upcoming: true
    },
    'Alt K.S.Miracle': {
        id: 'alt-k-s-miracle', name: 'Alt K.S.Miracle', stars: 3, releaseDate: '2025-08-29T22:00:00.000Z', characterId: 109302,
        gametoraId: 109323,
        statBonus: 'SPD +15% / POW +15%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'A', mile: 'B', medium: 'G', long: 'G' }, style: { frontRunner: 'E', paceChaser: 'A', lateSurger: 'B', endCloser: 'C' } },
        upcoming: true
    },
    'Alt Hishi Miracle': {
        id: 'alt-hishi-miracle', name: 'Alt Hishi Miracle', stars: 3, releaseDate: '2025-08-29T22:00:00.000Z', characterId: 110602,
        gametoraId: 110623,
        statBonus: 'STA +14% / POW +8% / GUT +8%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'G', mile: 'G', medium: 'A', long: 'A' }, style: { frontRunner: 'G', paceChaser: 'C', lateSurger: 'A', endCloser: 'B' } },
        upcoming: true
    },
    'Halloween Hishi Akebono': {
        id: 'halloween-hishi-akebono', name: 'Halloween Hishi Akebono', stars: 3, releaseDate: '2025-09-29T22:00:00.000Z', characterId: 102802,
        gametoraId: 102840,
        statBonus: 'POW +30%',
        aptitudes: { surface: { turf: 'A', dirt: 'F' }, distance: { sprint: 'A', mile: 'B', medium: 'F', long: 'G' }, style: { frontRunner: 'B', paceChaser: 'A', lateSurger: 'C', endCloser: 'G' } },
        upcoming: true
    },
    'Halloween Marvelous Sunday': {
        id: 'halloween-marvelous-sunday', name: 'Halloween Marvelous Sunday', stars: 3, releaseDate: '2025-09-29T22:00:00.000Z', characterId: 105502,
        gametoraId: 105540,
        statBonus: 'STA +16% / POW +7% / GUT +7%',
        aptitudes: { surface: { turf: 'A', dirt: 'F' }, distance: { sprint: 'G', mile: 'C', medium: 'A', long: 'B' }, style: { frontRunner: 'G', paceChaser: 'A', lateSurger: 'A', endCloser: 'C' } },
        upcoming: true
    },
    'Halloween Tosen Jordan': {
        id: 'halloween-tosen-jordan', name: 'Halloween Tosen Jordan', stars: 3, releaseDate: '2025-10-10T22:00:00.000Z', characterId: 104803,
        gametoraId: 104840,
        statBonus: 'STA +10% / POW +10% / GUT +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'G', mile: 'F', medium: 'A', long: 'B' }, style: { frontRunner: 'C', paceChaser: 'A', lateSurger: 'A', endCloser: 'G' } },
        upcoming: true
    },
    'Onsen Transcend': {
        id: 'onsen-transcend', name: 'Onsen Transcend', stars: 3, releaseDate: '2025-10-29T22:00:00.000Z', characterId: 108002,
        gametoraId: 108002,
        statBonus: 'POW +15% / WIT +15%',
        aptitudes: { surface: { turf: 'F', dirt: 'A' }, distance: { sprint: 'G', mile: 'A', medium: 'A', long: 'G' }, style: { frontRunner: 'A', paceChaser: 'B', lateSurger: 'F', endCloser: 'G' } },
        upcoming: true
    },
    'Onsen Wonder Acute': {
        id: 'onsen-wonder-acute', name: 'Onsen Wonder Acute', stars: 3, releaseDate: '2025-11-10T22:00:00.000Z', characterId: 110002,
        gametoraId: 110002,
        statBonus: 'STA +10% / POW +10% / GUT +10%',
        aptitudes: { surface: { turf: 'G', dirt: 'A' }, distance: { sprint: 'D', mile: 'A', medium: 'A', long: 'E' }, style: { frontRunner: 'C', paceChaser: 'A', lateSurger: 'B', endCloser: 'E' } },
        upcoming: true
    },
    'Christmas Nakayama Festa': {
        id: 'christmas-nakayama-festa', name: 'Christmas Nakayama Festa', stars: 3, releaseDate: '2025-11-28T22:00:00.000Z', characterId: 104902,
        gametoraId: 104946,
        statBonus: 'SPD +10% / POW +10% / GUT +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'G', mile: 'C', medium: 'A', long: 'B' }, style: { frontRunner: 'G', paceChaser: 'A', lateSurger: 'A', endCloser: 'D' } },
        upcoming: true
    },
    'Christmas Dream Journey': {
        id: 'christmas-dream-journey', name: 'Christmas Dream Journey', stars: 3, releaseDate: '2025-11-28T22:00:00.000Z', characterId: 111902,
        gametoraId: 111946,
        statBonus: 'SPD +20% / STA +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'F', mile: 'C', medium: 'A', long: 'A' }, style: { frontRunner: 'G', paceChaser: 'G', lateSurger: 'A', endCloser: 'A' } },
        upcoming: true
    },
    'Anime Oguri Cap': {
        id: 'anime-oguri-cap', name: 'Anime Oguri Cap', stars: 3, releaseDate: '2025-12-11T22:00:00.000Z', characterId: 100603,
        gametoraId: 100602,
        statBonus: 'SPD +8% / POW +8% / GUT +14%',
        aptitudes: { surface: { turf: 'A', dirt: 'B' }, distance: { sprint: 'E', mile: 'A', medium: 'B', long: 'A' }, style: { frontRunner: 'F', paceChaser: 'A', lateSurger: 'A', endCloser: 'D' } },
        upcoming: true
    },
    "New Year's Ikuno Dictus": {
        id: 'new-year-s-ikuno-dictus', name: "New Year's Ikuno Dictus", stars: 3, releaseDate: '2025-12-26T22:00:00.000Z', characterId: 106302,
        gametoraId: 106310,
        statBonus: 'STA +10% / POW +10% / GUT +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'D', mile: 'A', medium: 'A', long: 'D' }, style: { frontRunner: 'D', paceChaser: 'A', lateSurger: 'A', endCloser: 'D' } },
        upcoming: true
    },
    "New Year's Sakura Laurel": {
        id: 'new-year-s-sakura-laurel', name: "New Year's Sakura Laurel", stars: 3, releaseDate: '2025-12-26T22:00:00.000Z', characterId: 107602,
        gametoraId: 107610,
        statBonus: 'STA +10% / GUT +20%',
        aptitudes: { surface: { turf: 'A', dirt: 'E' }, distance: { sprint: 'G', mile: 'C', medium: 'A', long: 'A' }, style: { frontRunner: 'G', paceChaser: 'B', lateSurger: 'A', endCloser: 'B' } },
        upcoming: true
    },
    "New Year's Bubble Gum Fellow": {
        id: 'new-year-s-bubble-gum-fellow', name: "New Year's Bubble Gum Fellow", stars: 3, releaseDate: '2026-01-08T22:00:00.000Z', characterId: 112402,
        gametoraId: 112410,
        statBonus: 'POW +10% / GUT +20%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'G', mile: 'A', medium: 'A', long: 'G' }, style: { frontRunner: 'E', paceChaser: 'A', lateSurger: 'B', endCloser: 'G' } },
        upcoming: true
    },
    'Valentine Taiki Shuttle': {
        id: 'valentine-taiki-shuttle', name: 'Valentine Taiki Shuttle', stars: 3, releaseDate: '2026-01-30T22:00:00.000Z', characterId: 101003,
        gametoraId: 101013,
        statBonus: 'POW +10% / GUT +20%',
        aptitudes: { surface: { turf: 'A', dirt: 'B' }, distance: { sprint: 'A', mile: 'A', medium: 'E', long: 'G' }, style: { frontRunner: 'C', paceChaser: 'A', lateSurger: 'E', endCloser: 'G' } },
        upcoming: true
    },
    'Valentine Sounds of Earth': {
        id: 'valentine-sounds-of-earth', name: 'Valentine Sounds of Earth', stars: 3, releaseDate: '2026-01-30T22:00:00.000Z', characterId: 110202,
        gametoraId: 110213,
        statBonus: 'STA +14% / POW +8% / GUT +8%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'G', mile: 'F', medium: 'A', long: 'A' }, style: { frontRunner: 'G', paceChaser: 'A', lateSurger: 'A', endCloser: 'E' } },
        upcoming: true
    },
    'Beyond Dreams Loves Only You': {
        id: 'beyond-dreams-loves-only-you', name: 'Beyond Dreams Loves Only You', stars: 3, releaseDate: '2026-03-11T22:00:00.000Z', characterId: 113202,
        gametoraId: 113202,
        statBonus: 'STA +10% / GUT +10% / WIT +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'G', mile: 'C', medium: 'A', long: 'F' }, style: { frontRunner: 'G', paceChaser: 'A', lateSurger: 'A', endCloser: 'G' } },
        upcoming: true
    },
    'Ballroom Sakura Bakushin O': {
        id: 'ballroom-sakura-bakushin-o', name: 'Ballroom Sakura Bakushin O', stars: 3, releaseDate: '2026-03-30T22:00:00.000Z', characterId: 104103,
        gametoraId: 104120,
        statBonus: 'SPD +10% / POW +15% / WIT +5%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'A', mile: 'B', medium: 'G', long: 'G' }, style: { frontRunner: 'A', paceChaser: 'A', lateSurger: 'F', endCloser: 'G' } },
        upcoming: true
    },
    'Ballroom North Flight': {
        id: 'ballroom-north-flight', name: 'Ballroom North Flight', stars: 3, releaseDate: '2026-03-30T22:00:00.000Z', characterId: 108202,
        gametoraId: 108220,
        statBonus: 'SPD +15% / WIT +15%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'C', mile: 'A', medium: 'B', long: 'G' }, style: { frontRunner: 'D', paceChaser: 'A', lateSurger: 'D', endCloser: 'A' } },
        upcoming: true
    },
    'Cheerleader Fuji Kiseki': {
        id: 'cheerleader-fuji-kiseki', name: 'Cheerleader Fuji Kiseki', stars: 3, releaseDate: '2026-04-30T22:00:00.000Z', characterId: 100503,
        gametoraId: 100550,
        statBonus: 'STA +10% / GUT +13% / WIT +7%',
        aptitudes: { surface: { turf: 'A', dirt: 'F' }, distance: { sprint: 'B', mile: 'A', medium: 'A', long: 'E' }, style: { frontRunner: 'C', paceChaser: 'A', lateSurger: 'C', endCloser: 'G' } },
        upcoming: true
    },
    'Cheerleader Jungle Pocket': {
        id: 'cheerleader-jungle-pocket', name: 'Cheerleader Jungle Pocket', stars: 3, releaseDate: '2026-04-30T22:00:00.000Z', characterId: 109402,
        gametoraId: 109450,
        statBonus: 'STA +7% / POW +10% / GUT +13%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'G', mile: 'C', medium: 'A', long: 'B' }, style: { frontRunner: 'G', paceChaser: 'D', lateSurger: 'A', endCloser: 'B' } },
        upcoming: true
    },
};

export const getUmaImagePath = (name: string): string => {
    const data = UMA_DICT[name];
    if (!data) {
        return `/assets/uma/${name.toLowerCase().replace(/\s+/g, '_')}.png`;
    }

    return `https://gametora.com/images/umamusume/characters/chara_stand_${Math.floor(data.characterId / 100)}_${data.characterId}.png`;
};

export function getUmaData(name: string | undefined): UmaData | null {
    if (!name) return null;
    return UMA_DICT[name] || null;
}

export const UMA_LIST = Object.values(UMA_DICT);

export function getFilteredUmas(showUpcoming: boolean): UmaData[] {
    if (showUpcoming) return UMA_LIST;
    return UMA_LIST.filter(u => !u.upcoming);
}

export const RELEASED_UMAS = UMA_LIST.filter(u => !u.upcoming);
