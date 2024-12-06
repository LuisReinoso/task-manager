// main.js
const { app, BrowserWindow } = require("electron");
const path = require("path");

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 300,
    height: 600,
    frame: false,
    transparent: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.loadURL("http://localhost:64300");
}

app.on("ready", createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
