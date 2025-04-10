// main.js
const { app, BrowserWindow, dialog } = require("electron");
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
  // Use app.isPackaged to determine environment reliably
  const isDev = !app.isPackaged;

  if (isDev) {
    // Development: Load from dev server
    mainWindow.loadURL("http://localhost:64300").catch((err) => {
      dialog.showErrorBox(
        "Failed to Load UI",
        `Could not connect to http://localhost:64300\n\nError code: ${err.code || "unknown"}\nDescription: ${err.message}\n\nPlease ensure the Angular dev server is running at http://localhost:64300.`
      );
    });
  } else {
    // Production: Load from dist directory
    const indexPath = path.join(__dirname, "dist", "task-manager", "browser");
    // Log the path for debugging
    console.log("Loading from:", indexPath);

    // Set the base directory for the application
    const filePath = path.join(indexPath, "index.html");
    mainWindow.loadFile(filePath, {
      baseURLForDataURL: `file://${indexPath}`,
    }).catch((err) => {
      dialog.showErrorBox(
        "Failed to Load UI",
        `Could not load file: ${filePath}\n\nError code: ${err.code || "unknown"}\nDescription: ${err.message}\n\nPlease check that the Angular build output exists at:\n${filePath}\nand is accessible.`
      );
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
  const { dialog } = require("electron");
  contents.on("did-fail-load", (event, errorCode, errorDescription) => {
    console.error("Failed to load:", errorCode, errorDescription);
    dialog.showErrorBox(
      "Failed to Load UI",
      `Error code: ${errorCode}
Description: ${errorDescription}

process.env.NODE_ENV: ${process.env.NODE_ENV}
app.isPackaged: ${require("electron").app.isPackaged}

Please check that the Angular build output exists and is accessible.`
    );
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
