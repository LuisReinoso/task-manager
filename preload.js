// preload.js
const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  // Add any necessary APIs here
});
