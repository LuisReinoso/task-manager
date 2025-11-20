// main.js
const { app, BrowserWindow, dialog, ipcMain, screen, shell } = require("electron");
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
        `Could not load file ${filePath}\n\nError code: ${err.code || "unknown"}\nDescription: ${err.message}`
      );
    });
  }

  // Handle external links - open in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  // Prevent navigation to external URLs within the app
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const appUrl = isDev ? 'http://localhost:64300' : 'file://';
    if (!url.startsWith(appUrl)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });
}

let reminderWin = null;
let reminderInterval = null;
let currentTaskTitle = '';

function createReminderWindow(taskTitle) {
  const cursorPoint = screen.getCursorScreenPoint();
  const display = screen.getDisplayNearestPoint(cursorPoint);
  const displayBounds = display.bounds;

  // Estimate width based on taskTitle length
  const baseWidth = 50;
  const charWidth = 8;
  const minWidth = 150;
  const maxWidth = 400;
  const estimatedWidth = Math.min(maxWidth, Math.max(minWidth, baseWidth + taskTitle.length * charWidth));

  // Calculate position relative to display bounds to ensure window appears on correct screen
  const x = Math.min(cursorPoint.x + 10, displayBounds.x + displayBounds.width - estimatedWidth - 10);
  const y = Math.min(cursorPoint.y + 10, displayBounds.y + displayBounds.height - 60); // 50 height + 10 margin

  if (reminderWin) {
    reminderWin.close();
    reminderWin = null;
  }
  reminderWin = new BrowserWindow({
    width: estimatedWidth,
    height: 50,
    x: x,
    y: y,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    focusable: true,
    resizable: false,
    movable: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });
  reminderWin.loadURL(`data:text/html;charset=utf-8,
    <html>
      <body style="margin:0; background:rgba(0,0,0,0.7); color:white; font-family:sans-serif; font-size:14px; display:flex; justify-content:center; align-items:center; height:100vh; -webkit-app-region: drag;">
        ${taskTitle}
      </body>
    </html>`);
  // Auto close after 5 seconds
  setTimeout(() => {
    if (reminderWin) {
      reminderWin.close();
      reminderWin = null;
    }
  }, 5000);
}

function startReminder(taskTitle) {
  currentTaskTitle = taskTitle;
  if (reminderInterval) {
    clearInterval(reminderInterval);
  }
  createReminderWindow(taskTitle);
  reminderInterval = setInterval(() => {
    createReminderWindow(currentTaskTitle);
  }, 5 * 60 * 1000); // every 5 minutes
}

function stopReminder() {
  if (reminderInterval) {
    clearInterval(reminderInterval);
    reminderInterval = null;
  }
  if (reminderWin) {
    reminderWin.close();
    reminderWin = null;
  }
}

ipcMain.on('set-current-task', (event, taskTitle) => {
  startReminder(taskTitle);
});

ipcMain.on('stop-reminder', () => {
  stopReminder();
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  app.quit();
});
