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
    'Anime Tokai Teio': {
        id: 'anime-tokai-teio', name: 'Anime Tokai Teio', stars: 3, releaseDate: '2025-07-16T22:00:00.000Z', characterId: 100302,
        gametoraId: 100302,
        statBonus: 'SPD +10% / STA +10% / GUT +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'G' }, distance: { sprint: 'F', mile: 'E', medium: 'A', long: 'B' }, style: { frontRunner: 'D', paceChaser: 'A', lateSurger: 'C', endCloser: 'E' } }
    },
    'Anime Mejiro McQueen': {
        id: 'anime-mejiro-mcqueen', name: 'Anime Mejiro McQueen', stars: 3, releaseDate: '2025-07-16T22:00:00.000Z', characterId: 101302,
        gametoraId: 101302,
        statBonus: 'STA +10% / POW +10% / WIT +10%',
        aptitudes: { surface: { turf: 'A', dirt: 'E' }, distance: { sprint: 'G', mile: 'F', medium: 'A', long: 'A' }, style: { frontRunner: 'B', paceChaser: 'A', lateSurger: 'D', endCloser: 'F' } }
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
