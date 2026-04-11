/**
 * Debug script to find skill text.
 * Run: node scripts/debug-skill.js
 */

const puppeteer = require('puppeteer');

async function run() {
    console.log('🚀 Launching browser...');
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage();

    const url = 'https://gametora.com/umamusume/characters/107401-mejiro-bright';
    console.log(`Visiting ${url}...`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });

    const content = await page.evaluate(() => {
        // Search for "Brunissage" in the page text
        const bodyText = document.body.innerText;
        const index = bodyText.indexOf('Brunissage');
        
        if (index !== -1) {
            return bodyText.substring(index - 50, index + 50);
        }
        return 'Not found';
    });

    console.log('Result:', content);
    await browser.close();
}

run();
