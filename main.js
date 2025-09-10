const { app, BrowserWindow, globalShortcut, ipcMain, Menu, Tray, nativeImage, Notification } = require('electron');
const Store = require('electron-store');
const path = require('path');

// Initialize settings store
const store = new Store({
  defaults: {
    timerLength: 10, // minutes
    hotkeys: {
      start: 'CommandOrControl+Shift+S',
      stop: 'CommandOrControl+Shift+P',
      reset: 'CommandOrControl+Shift+R'
    },
    disableHotkeysWhenRunning: false,
    popupOnEnd: true,
    soundOnEnd: true,
    windowBounds: { width: 400, height: 300 }
  }
});

let mainWindow = null;
let tray = null;
let isTimerRunning = false;

function createWindow() {
  const bounds = store.get('windowBounds');
  
  mainWindow = new BrowserWindow({
    width: bounds.width,
    height: bounds.height,
    minWidth: 350,
    minHeight: 250,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'assets', 'icon.png'),
    show: false,
    titleBarStyle: 'default'
  });

  mainWindow.loadFile('index.html');
  
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Save window bounds on close
  mainWindow.on('close', () => {
    store.set('windowBounds', mainWindow.getBounds());
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Create system tray
  createTray();
  
  // Register global shortcuts
  registerGlobalShortcuts();
}

function createTray() {
  const iconPath = path.join(__dirname, 'assets', 'tray-icon.png');
  tray = new Tray(nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 }));
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Timer',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    {
      label: 'Start Timer',
      click: () => {
        if (mainWindow) {
          mainWindow.webContents.send('hotkey-action', 'start');
        }
      }
    },
    {
      label: 'Stop Timer',
      click: () => {
        if (mainWindow) {
          mainWindow.webContents.send('hotkey-action', 'stop');
        }
      }
    },
    {
      label: 'Reset Timer',
      click: () => {
        if (mainWindow) {
          mainWindow.webContents.send('hotkey-action', 'reset');
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);
  tray.setToolTip('Simple Timer');
  
  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

function registerGlobalShortcuts() {
  const hotkeys = store.get('hotkeys');
  
  // Unregister all shortcuts first
  globalShortcut.unregisterAll();
  
  // Register start shortcut
  globalShortcut.register(hotkeys.start, () => {
    if (shouldAllowHotkey()) {
      mainWindow?.webContents.send('hotkey-action', 'start');
    }
  });
  
  // Register stop shortcut
  globalShortcut.register(hotkeys.stop, () => {
    if (shouldAllowHotkey()) {
      mainWindow?.webContents.send('hotkey-action', 'stop');
    }
  });
  
  // Register reset shortcut
  globalShortcut.register(hotkeys.reset, () => {
    if (shouldAllowHotkey()) {
      mainWindow?.webContents.send('hotkey-action', 'reset');
    }
  });
}

function shouldAllowHotkey() {
  const disableWhenRunning = store.get('disableHotkeysWhenRunning');
  if (disableWhenRunning && isTimerRunning) {
    return false;
  }
  return true;
}

// IPC handlers
ipcMain.handle('get-settings', () => {
  return store.store;
});

ipcMain.handle('save-setting', (event, key, value) => {
  store.set(key, value);
  
  // Re-register shortcuts if hotkeys changed
  if (key === 'hotkeys') {
    registerGlobalShortcuts();
  }
});

ipcMain.handle('timer-status-changed', (event, running) => {
  isTimerRunning = running;
  
  // Update tray icon or tooltip to reflect timer status
  if (tray) {
    tray.setToolTip(running ? 'Simple Timer - Running' : 'Simple Timer - Stopped');
  }
});

ipcMain.handle('timer-ended', () => {
  const settings = store.store;
  
  // Show notification
  if (Notification.isSupported()) {
    new Notification({
      title: 'Timer Finished!',
      body: `Your ${settings.timerLength} minute timer has ended.`,
      silent: !settings.soundOnEnd
    }).show();
  }
  
  // Pop up window if enabled
  if (settings.popupOnEnd && mainWindow) {
    mainWindow.show();
    mainWindow.focus();
    mainWindow.setAlwaysOnTop(true);
    
    // Remove always on top after a few seconds
    setTimeout(() => {
      if (mainWindow) {
        mainWindow.setAlwaysOnTop(false);
      }
    }, 3000);
  }
});

// App event handlers
app.whenReady().then(() => {
    createWindow();

    // Remove default menu (File/Edit/Help)
    Menu.setApplicationMenu(null);
    
    app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
  });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('will-quit', () => {
    globalShortcut.unregisterAll();
});

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', () => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
                mainWindow.focus();
        }
    });
}