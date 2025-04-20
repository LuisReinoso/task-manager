// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  sendCurrentTask: (taskTitle) => ipcRenderer.send('set-current-task', taskTitle),
  sendStopReminder: () => ipcRenderer.send('stop-reminder'),
});
