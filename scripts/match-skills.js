/**
 * Matches scraped skill IDs from scraped_skills.json with names from skillData.ts.
 * Outputs the final formatted skills array for umaData.ts.
 * 
 * Run: node scripts/match-skills.js
 */

const fs = require('fs');
const path = require('path');

const scrapedPath = path.join(__dirname, '..', 'scraped_skills.json');
const skillDataPath = path.join(__dirname, '..', 'frontend', 'src', 'utils', 'skillData.ts');

if (!fs.existsSync(scrapedPath)) {
    console.error('❌ scraped_skills.json not found. Run scrape-all-data.js first.');
    process.exit(1);
}
if (!fs.existsSync(skillDataPath)) {
    console.error('❌ skillData.ts not found.');
    process.exit(1);
}

// 1. Load Scraped Data
const scrapedData = JSON.parse(fs.readFileSync(scrapedPath, 'utf8'));

// 2. Parse skillData.ts to get ID -> Name map
const skillText = fs.readFileSync(skillDataPath, 'utf8');
const skillMap = {};

// Regex to find: 12345: { id: 12345, name: 'Skill Name', ...
const regex = /(\d+):\s*{[^}]*name:\s*'([^']+)'/g;
let match;
while ((match = regex.exec(skillText)) !== null) {
    skillMap[match[1]] = match[2];
}

console.log(`📂 Loaded ${Object.keys(skillMap).length} skill definitions.`);

// 3. Match and Output
console.log('\n📋 UPDATED CODE:\n');

scrapedData.forEach(char => {
    if (!char.skills || char.skills.length === 0) return;
    
    // Find character in umaData.ts to update
    // We look for the key 'Character Name': { ...
    
    const skillStrs = char.skills.map(id => {
        const name = skillMap[id] || `Unknown (${id})`;
        return `${id} // ${name}`;
    });

    console.log(`// --- Update for: ${char.name} ---`);
    console.log(`skills: [${char.skills.join(', ')}], // ${skillStrs.join(', ')}`);
    console.log('');
});
