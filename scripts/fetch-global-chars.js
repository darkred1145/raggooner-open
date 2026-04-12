/**
 * Fetches all Global characters from Gametora and prints their umaData.ts entries.
 * Run: node scripts/fetch-global-chars.js
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

async function run() {
    console.log('🚀 Launching browser...');
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage();

    // 1. Get Character List
    console.log('📄 Scraping Character List...');
    await page.goto('https://gametora.com/umamusume/characters', { waitUntil: 'networkidle2', timeout: 60000 });

    const chars = await page.evaluate(() => {
        // Fallback: Extract from DOM
        const links = Array.from(document.querySelectorAll('a[href*="/umamusume/characters/"]'));
        const chars = [];
        const seen = new Set();
        links.forEach(a => {
            const match = a.href.match(/characters\/(\d+)-([a-z0-9-]+)/);
            if (match && !seen.has(match[1])) {
                seen.add(match[1]);
                chars.push({ card_id: match[1], name_en: match[2] });
            }
        });
        return chars;
    });

    console.log(`Found ${chars.length} characters in list.`);

    // We will check release_en inside the detail loop
    const results = [];
    
    // 2. Fetch Details for each (Batching)
    const BATCH_SIZE = 5; // Reduced batch size to avoid timeouts
    
    for (let i = 0; i < chars.length; i += BATCH_SIZE) {
        const batch = chars.slice(i, i + BATCH_SIZE);
        const pages = await Promise.all(batch.map(async () => browser.newPage()));
        
        const promises = batch.map(async (char, idx) => {
            const page = pages[idx];
            try {
                const url = `https://gametora.com/umamusume/characters/${char.card_id}-${char.name_en}`;
                await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
                
                const data = await page.evaluate(() => {
                    const script = document.getElementById('__NEXT_DATA__');
                    if (script) {
                        const json = JSON.parse(script.textContent);
                        return json.props?.pageProps?.itemData;
                    }
                    return null;
                });

                if (data && data.release_en) {
                    // It's a Global character!
                    results.push({
                        id: data.card_id,
                        name: data.name_en,
                        release_en: data.release_en,
                        stat_bonus: data.stat_bonus,
                        skills_unique: data.skills_unique,
                        aptitude: data.aptitude,
                        rarity: data.rarity
                    });
                }
            } catch (e) {
                // console.error(`   ❌ ${char.name_en}: ${e.message}`);
            } finally {
                await page.close();
            }
        });

        await Promise.all(promises);
        console.log(`\n🔄 Progress: ${Math.min(i + BATCH_SIZE, chars.length)} / ${chars.length} (${results.length} Global found so far)`);
    }

    await browser.close();

    // 3. Generate Code
    console.log('\n📋 GENERATED CODE:\n');

    // Sort by rarity then name
    results.sort((a, b) => (b.rarity || 0) - (a.rarity || 0) || a.name.localeCompare(b.name));

    const aptMap = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
    // Gametora aptitude order: Turf, Dirt, Sprint, Mile, Medium, Long, Front, Pace, Late, End

    for (const char of results) {
        // Skip ones we already have (rough check)
        // Just outputting all for completeness
        
        const [turf, dirt, sprint, mile, medium, long, front, pace, late, end] = char.aptitude.map(i => aptMap[i]);
        
        const [spd, sta, pwr, gut, wit] = char.stat_bonus;
        let bonusStr = [];
        if (spd) bonusStr.push(`SPD +${spd}%`);
        if (sta) bonusStr.push(`STA +${sta}%`);
        if (pwr) bonusStr.push(`PWR +${pwr}%`);
        if (gut) bonusStr.push(`GUT +${gut}%`);
        if (wit) bonusStr.push(`WIT +${wit}%`);

        const statBonusStr = bonusStr.length > 0 ? `'${bonusStr.join(' / ')}'` : '';
        const skillsStr = char.skills && char.skills.length > 0 ? `skills: [${char.skills.join(', ')}], ` : '';
        
        const slug = char.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        console.log(`    '${char.name}': {`);
        console.log(`        id: '${slug}', name: '${char.name}', stars: ${char.rarity}, releaseDate: '${char.release_en}T22:00:00.000Z', characterId: ${char.id},`);
        console.log(`        gametoraId: ${char.id},`);
        if (statBonusStr) console.log(`        statBonus: ${statBonusStr},`);
        if (skillsStr) console.log(`        ${skillsStr.trim()}`);
        console.log(`        aptitudes: {`);
        console.log(`            surface: { turf: '${turf}', dirt: '${dirt}' },`);
        console.log(`            distance: { sprint: '${sprint}', mile: '${mile}', medium: '${medium}', long: '${long}' },`);
        console.log(`            style: { frontRunner: '${front}', paceChaser: '${pace}', lateSurger: '${late}', endCloser: '${end}' }`);
        console.log(`        }`);
        console.log(`    },\n`);
    }
}

run();
