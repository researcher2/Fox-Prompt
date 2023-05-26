# FoxPrompt 

Firefox extension for ChatGPT. Adds a helper window that features a prompt library, quick prompts, and the ability to hide the chat history and settings window.

## To Do

- Different behaviour with sidebar for small screens.
- CSV Import/Export

## Development Quick Start
Open two command lines:

**NPM install and Vite Build Watcher**
```
C:\.....\Fox-Prompt\extension\vue_frontend>npm install
C:\.....\Fox-Prompt\extension\vue_frontend>npm run watch
```

**Extension Watcher**
```
C:\.....\Fox-Prompt\extension>web-ext run
```

`web-ext run` will open an isolated Firefox window for you to develop in and auto reload the extension if any file changes are detected. Assuming you have the Vite watcher running too then any changes to the Vue files should be visible in the extension after the few seconds required by Vite builds.

## Architecture Overview

FoxPrompt uses both a background script (for saving the prompts to Firefox's browser.storage.local), and a content script script (for interacting with the ChatGPT DOM). The content script sends a message to the background script to load or store prompts. This was required because content scripts don't have access to storage. I tried experimenting with dexie.js in the content script with no luck, maybe it works in background scripts but at that point I had already given up and was using browser.storage.local.

The background script is vanilla JS, while the content script is a compiled Vue3 SFC - integration guide below.

Firefox Extensions don't seems to support animation with GSAP, so some manual work was done.

## Integrating Vue3 SFC With Firefox Extension

This was somewhat tedious to setup with limited resources available.

The initial steps were:

1. Install into vue_frontend directory `npm init vue@latest`
2. Clean out the `vue_frontend/src` directory.
3. Add a directory for our component `vue_frontend/src/page_interaction`
4. Create `vue_frontend/src/page_interaction.js` to create a <div id="app">element in the page, import the
vue component and mount it in the div.
5. Create the Vue3 SFC `vue_frontend/src/PageInteraction.vue`

To develop you would normally use the Vite dev server and load the file as a module like:

```javascript
<script type="module" src="http://localhost:3001/src/page_interaction.js"></script>
```

Unfortunately Firefox Extensions can't load modules, so instead we must build each time a file is saved.

To enable builds, we configure `vue_frontend/vite.config.js` with custom rollupOptions, adding the js file as input and setting format "iife" for output options. One benefit of "iife" is the css gets compiled in - no need to worry about loading it in the extension.

At this point you can manually do `npm run build` and copy the file name and path into the Firefox Extensions's manifest.js. Then go into about:debugging and reload the extension.

But this isn't good enough! We need two more things to make development somewhat pleasant:

1. Watcher to trigger auto Vite builds and update the Firefox Extension's manifest.json with the new compiled file name.
2. Watcher to trigger auto reload of Firefox Extension.

**Watcher For Builds**

I was developing on Windows and Nodemon doesn't work particularly well so I used chokidar to watch for file reloads and run a script. 

1. `npm install chokidar-cli`. 
2. Update your package.json to modify your build command and a watch command to scripts:

```json
  "scripts": {
    "dev": "vite",
    "build": "vite build && node update_manifest.js",
    "watch": "chokidar \"src/**/*.js\" \"src/**/*.vue\" -c \"npm run build\"",
    "preview": "vite preview"
  },
```

3. Create the `vue_frontend/update_manifest.js` script that gets the path of all js files in the `vue_frontend/dist/assets` directory and adds them to the manifest.json.

**Watcher For Overall Extension**

I was originally loading the temporary extension in about:debugging, but Firefox has a development tool that provides watching and auto reloads called "web-ext": https://github.com/mozilla/web-ext

```
npm install --global web-ext
web-ext run
```

This opens an isolated Firefox in a new profile, meaning you will have to enter your Chat GPT credentials during each development session.

**Summary**

After all this, we now have reasonably fast hot reloads, though the build does take a few seconds. Please be aware that the extension reloads twice because the web-ext watcher is triggered before the chokidar build is done.


