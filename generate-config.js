// generate-config.js
/**
 * BUILD SCRIPT: Configuration Generator (Local PWA)
 * ------------------------------------------------------------------
 * Extracts environment variables for the Local PWA.
 * Unlike the Cloud version, this does NOT inject Supabase keys.
 * * Usage: node generate-config.js
 */

const fs = require('fs');
const path = require('path');

// 1. Define the content
// Only includes personalization config, no database keys needed.
const configContent = `
window.SITE_CONFIG = {
    SpouseName: "${process.env.SPOUSE_NAME || 'My Love'}",
    // Fallback to 'default' if no theme is provided
    theme: "${process.env.THEME || 'default'}", 
    // Optional: Hash for the secondary "App Password" lock screen
    appPasswordHash: "${process.env.APP_PASSWORD_HASH || ''}"
};
`;

// 2. Ensure the "secret" folder exists
const secretDir = path.join(__dirname, 'secret');
if (!fs.existsSync(secretDir)){
    fs.mkdirSync(secretDir);
}

// 3. Write the file
fs.writeFileSync(path.join(secretDir, 'config.js'), configContent);

console.log("✅ Local Configuration file generated successfully.");