const fs = require('fs');
const path = require('path');

// Function to get all files in a directory
function getFiles(dir) {
    return fs.readdirSync(dir)
      .filter((file) => fs.lstatSync(path.join(dir, file)).isFile());
}

// Get all files in the dist/assets directory
const assetsDir = path.join(__dirname, 'dist', 'assets');
const files = getFiles(assetsDir);
const jsFiles = files.filter(file => file.endsWith('.js')).map(file => `vue_frontend/dist/assets/${file}`);

// Load the manifest.json file
const manifestPath = path.join(__dirname, '..', 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

// Update the content_scripts entry in the manifest.json        
manifest.content_scripts[0].js = jsFiles;

// Write the updated manifest back to disk
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
