/**
 * Scrapes Skill Names from Gametora.
 * Run: node scripts/scrape-skill-names.js
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

// Load our scraped skills to know which IDs we care about
const scrapedData = require('../scraped_skills.json');
const allSkillIds = new Set();
scrapedData.forEach(d => d.skills.forEach(id => allSkillIds.add(id)));

console.log(`Looking for ${allSkillIds.size} unique skills.`);

async function run() {
    console.log('🚀 Launching browser...');
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage();

    // Gametora has a skills list page
    await page.goto('https://gametora.com/umamusume/skills', { waitUntil: 'domcontentloaded', timeout: 60000 });

    // We need to find elements that link to skills.
    // Usually they are in a table or grid.
    // We will evaluate the page to find links containing the skill IDs.
    
    const skillNames = await page.evaluate((ids) => {
        const names = {};
        // Find all elements that might be skill names
        // We look for links with href="/umamusume/skills/{id}-..."
        const links = document.querySelectorAll('a');
        
        links.forEach(link => {
            const href = link.getAttribute('href');
            if (href && href.includes('/umamusume/skills/')) {
                const match = href.match(/skills\/(\d+)-/);
                if (match) {
                    const id = match[1];
                    // Try to get the name. It might be the text content or an img alt.
                    let text = link.innerText.trim();
                    if (!text) {
                        const img = link.querySelector('img');
                        if (img) text = img.getAttribute('alt');
                    }
                    // Check if the text looks like a name (not empty, not just numbers)
                    if (text && text.length > 2 && !/^\d+$/.test(text)) {
                        names[id] = text;
                    }
                }
            }
        });
        return names;
    }, Array.from(allSkillIds));

    console.log(`Found ${Object.keys(skillNames).length} names.`);
    console.log(JSON.stringify(skillNames, null, 2));

    await browser.close();
}

run();
