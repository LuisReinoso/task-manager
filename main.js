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

  // Check if we're in development or production
  const isDev = process.env.NODE_ENV !== "production";

  if (isDev) {
    // Development: Load from dev server
    mainWindow.loadURL("http://localhost:64300");
  } else {
    // Production: Load from dist directory
    const indexPath = path.join(__dirname, "dist", "task-manager", "browser");
    // Log the path for debugging
    console.log("Loading from:", indexPath);

    // Set the base directory for the application
    mainWindow.loadFile(path.join(indexPath, "index.html"), {
      baseURLForDataURL: `file://${indexPath}`,
    });
  }

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    require("electron").shell.openExternal(url);
    return { action: "deny" };
  });
}

// Add error handling
app.on("web-contents-created", (event, contents) => {
  contents.on("did-fail-load", (event, errorCode, errorDescription) => {
    console.error("Failed to load:", errorCode, errorDescription);
  });
});

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
