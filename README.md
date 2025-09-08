# Simple Timer - Electron App

A simple, customizable timer application with global hotkeys and system notifications.

## Features

- ✅ Customizable timer length
- ✅ Global hotkeys that work even when app is not focused
- ✅ Option to disable hotkeys when timer is running
- ✅ Pop-up window when timer ends (optional)
- ✅ Notification sound when timer ends (optional)
- ✅ Settings persistence
- ✅ System tray integration
- ✅ Single instance (prevents multiple copies)

## Setup Instructions

### 1. Initialize the Project

```bash
# Create a new directory
mkdir simple-timer
cd simple-timer

# Initialize npm and install dependencies
npm init -y
npm install electron electron-store --save
npm install electron-builder --save-dev
```

### 2. Create the Files

Copy all the provided files into your project directory:
- `package.json`
- `main.js`
- `preload.js`
- `index.html`
- `style.css`
- `renderer.js`

### 3. Create Assets Directory

```bash
mkdir assets
```

You'll need to add these icon files to the `assets` folder:
- `icon.png` (256x256px) - Main app icon
- `icon.ico` (Windows icon)
- `icon.icns` (macOS icon)
- `tray-icon.png` (16x16px) - System tray icon

For quick testing, you can use any small PNG images temporarily.

### 4. Update package.json

Replace your `package.json` with the provided one, or copy the important parts:
- Scripts section
- Dependencies
- Build configuration

### 5. Run the App

```bash
# Development mode
npm start

# Or with dev flag for debugging
npm run dev
```

### 6. Build for Distribution

```bash
# Build for current platform
npm run build

# Build and create installer
npm run dist
```

## Default Controls

### Mouse Controls
- **Start/Stop/Reset**: Use the buttons in the interface
- **Settings**: Modify timer length, hotkey behavior, and end-of-timer actions
- **Hotkeys**: Click "Change" buttons to set custom global hotkeys

### Default Global Hotkeys
- **Ctrl+Shift+S**: Start timer
- **Ctrl+Shift+P**: Stop timer  
- **Ctrl+Shift+R**: Reset timer

### System Tray
- Right-click the tray icon for quick actions
- Double-click to show/hide the main window

## Usage Flow

1. **Launch**: App opens with default 10-minute timer
2. **Customize**: Set your preferred timer length and behaviors
3. **Set Hotkeys**: Change global hotkeys if desired
4. **Start Timer**: Use button or hotkey to start
5. **Timer Runs**: Use hotkeys to control (unless disabled)
6. **Timer Ends**: Window pops up (optional) and sound plays (optional)
7. **Repeat**: Reset and start again, or modify settings

## Configuration

All settings are automatically saved and restored:
- Timer length (1-999 minutes)
- Global hotkeys (fully customizable)
- Hotkey behavior when running
- End-of-timer popup behavior
- Notification sound preference
- Window position and size

## Troubleshooting

### Global Hotkeys Not Working
- Make sure no other app is using the same key combination
- Try different key combinations
- Check if the app has necessary permissions

### App Won't Start
- Ensure all dependencies are installed: `npm install`
- Check that all files are in the correct locations
- Try running with: `npm run dev` for debugging output

### Build Issues
- Make sure you have the required icon files
- Check that `electron-builder` is installed
- Try deleting `node_modules` and running `npm install` again

## Development Notes

- The app uses Electron with context isolation for security
- Settings are stored using `electron-store`
- Global shortcuts use Electron's built-in `globalShortcut` API
- Notifications use both Electron notifications and Web Audio API for sounds

## Customization

You can easily modify:
- **Colors/Theme**: Edit `style.css`
- **Default Settings**: Change defaults in `main.js` store initialization
- **Additional Features**: Add new IPC handlers and UI elements
- **Sounds**: Modify the `playNotificationSound()` function in `renderer.js`