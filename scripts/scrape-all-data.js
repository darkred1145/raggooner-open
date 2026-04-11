/**
 * Scrapes ALL characters and unique skills from Gametora efficiently.
 * Run: node scripts/scrape-all-data.js
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

const chars = require('../raw_chars.json'); 
console.log(`Loaded ${chars.length} characters.`);

const BATCH_SIZE = 5;
const results = [];

async function run() {
    console.log('🚀 Launching browser...');
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });

    // Process in batches
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
                        const itemData = json.props?.pageProps?.itemData;
                        if (itemData && itemData.skills_unique && itemData.skills_unique.length > 0) {
                            // Extract skill name from body text
                            // It usually appears as [Skill Name]
                            const text = document.body.innerText;
                            const match = text.match(/\[([^\]]+)\]/);
                            const skillName = match ? match[1] : null;
                            
                            return {
                                id: itemData.card_id,
                                name: itemData.name_en,
                                skills: itemData.skills_unique,
                                skillName: skillName
                            };
                        }
                    }
                    return null;
                });

                if (data) {
                    results.push(data);
                    console.log(`   ✅ ${data.name} (ID: ${data.id}) -> Skills: [${data.skills.join(', ')}] (${data.skillName || 'No name found'})`);
                }
            } catch (e) {
                // Ignore timeout errors for speed
            } finally {
                await page.close();
            }
        });

        await Promise.all(promises);
        console.log(`\n🔄 Progress: ${Math.min(i + BATCH_SIZE, chars.length)} / ${chars.length}`);
    }

    await browser.close();

    console.log('\n📋 GENERATED CODE:');
    console.log('--------------------------------------------------');
    
    // Format as TS snippet
    const output = results.map(char => {
        const skillStr = char.skillName ? `${char.skillName} (ID: ${char.skills[0]})` : `ID: ${char.skills[0]}`;
        return `    '${char.name}': { // Card ID: ${char.id}\n        statBonus: '...', // TODO\n        skills: [${char.skills.join(', ')}], // ${skillStr}`;
    }).join('\n\n    },\n');

    console.log(output);
    console.log('    },');

    // Save to file
    fs.writeFileSync('scraped_skills.json', JSON.stringify(results, null, 2));
    console.log('\n💾 Saved scraped_skills.json');
}

run();
