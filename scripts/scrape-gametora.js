/**
 * Scrapes Gametora for Stat Bonuses and Skills using Puppeteer.
 * Run: node scripts/scrape-gametora.js
 */

const puppeteer = require('puppeteer');

// Characters to scrape (add more as needed)
const CHARACTERS = [
    { id: '107401', name: 'Mejiro Bright' },
    { id: '106701', name: 'Satono Diamond' },
    { id: '100101', name: 'Special Week' },
];

async function run() {
    console.log('🚀 Launching browser...');
    const browser = await puppeteer.launch({ 
        headless: true, 
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });

    for (const char of CHARACTERS) {
        console.log(`\n📄 Scraping: ${char.name}`);
        const page = await browser.newPage();
        
        try {
            const url = `https://gametora.com/umamusume/characters/${char.id}-${char.name.toLowerCase().replace(/\s+/g, '-')}`;
            console.log(`   URL: ${url}`);
            
            // Go to page and wait for network to settle (important for React/Next.js sites)
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

            // 1. Scrape Stat Bonuses
            // We look for elements containing '%'
            const bonuses = await page.evaluate(() => {
                // Gametora typically uses divs with text like "+14%"
                // We look for all text on the page and filter for numbers with %
                const allText = document.body.innerText.split('\n');
                const bonuses = [];
                
                // Pattern: Number followed by %
                const percentRegex = /(\d+)%/;
                
                // We also want to look for the stat name preceding it
                // Strategy: Find all elements that contain a %, then get their previous sibling or parent text
                const percentElements = Array.from(document.querySelectorAll('*')).filter(el => {
                    return el.children.length === 0 && el.innerText && percentRegex.test(el.innerText);
                });

                percentElements.forEach(el => {
                    const val = el.innerText.trim();
                    if (val.match(percentRegex)) {
                        // Try to find the label (Stat Name)
                        // Gametora often uses a flex container: [Icon/Name] [Value]
                        let parent = el.parentElement;
                        let label = '';
                        
                        // Heuristic: Look for text in the parent that isn't the % value
                        if (parent) {
                            const parentText = parent.innerText;
                            // Simple check for common stats
                            const stats = ['Speed', 'Stamina', 'Power', 'Guts', 'Wit'];
                            for (const stat of stats) {
                                if (parentText.includes(stat)) {
                                    label = stat;
                                    break;
                                }
                            }
                        }
                        
                        bonuses.push(`${label ? label + ' ' : ''}${val}`);
                    }
                });
                return bonuses;
            });

            console.log(`   ✅ Stat Bonuses: ${bonuses.join(' | ') || 'None found'}`);

            // 2. Scrape Skills (Unique Skills)
            // Skills are usually in a grid with tooltips or titles
            const skills = await page.evaluate(() => {
                // Look for elements that look like skills
                // Common patterns: images with alt text, or divs with title attributes
                const skillElements = document.querySelectorAll('img[alt], div[title], .tooltip');
                const skillNames = [];
                
                skillElements.forEach(el => {
                    const alt = el.getAttribute('alt') || el.getAttribute('title') || '';
                    if (alt && !alt.includes('icon') && !alt.includes('status') && alt.length > 3) {
                        // Filter out non-skills
                        const lower = alt.toLowerCase();
                        if (!lower.includes('uma') && !lower.includes('character') && !lower.includes('gametora')) {
                            skillNames.push(alt);
                        }
                    }
                });
                return [...new Set(skillNames)].slice(0, 5); // Get top 5 unique
            });

            console.log(`   ✅ Skills: ${skills.length > 0 ? skills.join(', ') : 'None found'}`);

            // 3. Debug Dump (Save full text for manual check if needed)
            // const text = await page.evaluate(() => document.body.innerText);
            // console.log(text); // Uncomment to see everything

        } catch (error) {
            console.error(`   ❌ Failed: ${error.message}`);
        } finally {
            await page.close();
        }
    }

    await browser.close();
    console.log('\n🏁 Done.');
}

run();
