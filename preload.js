const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSetting: (key, value) => ipcRenderer.invoke('save-setting', key, value),
  timerStatusChanged: (running) => ipcRenderer.invoke('timer-status-changed', running),
  timerEnded: () => ipcRenderer.invoke('timer-ended'),
  
  // Listen for hotkey actions
  onHotkeyAction: (callback) => {
    ipcRenderer.on('hotkey-action', (event, action) => callback(action));
  },
  
  // Remove listeners
  removeAllListeners: () => {
    ipcRenderer.removeAllListeners('hotkey-action');
  }
});