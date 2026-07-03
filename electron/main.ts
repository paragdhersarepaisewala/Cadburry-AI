import { app, BrowserWindow, ipcMain, desktopCapturer } from 'electron';
import * as path from 'path';
import { testLLMConnection, sendAudioToLLM, transcribeAudio } from './apiClient';

let mainWindow: BrowserWindow | null = null;
let stealthWindow: BrowserWindow | null = null;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false, // safer to use contextBridge
      contextIsolation: true,
    },
    autoHideMenuBar: true,
  });

  if (app.isPackaged) {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  } else {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  }
}

function createStealthWindow() {
  if (stealthWindow) return;

  stealthWindow = new BrowserWindow({
    width: 550,
    height: 380,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Starts as UNLOCKED (fully interactive) so the user can drag/resize it first
  stealthWindow.setIgnoreMouseEvents(false);

  stealthWindow.setContentProtection(true);

  if (app.isPackaged) {
    stealthWindow.loadFile(path.join(__dirname, '../dist/index.html'), { hash: 'stealth' });
  } else {
    stealthWindow.loadURL('http://localhost:5173/#/stealth');
    stealthWindow.webContents.openDevTools();
  }

  stealthWindow.on('closed', () => {
    stealthWindow = null;
  });
}

app.whenReady().then(() => {
  createMainWindow();

  ipcMain.on('start-stealth-mode', () => {
    createStealthWindow();
  });

  ipcMain.on('stop-stealth-mode', () => {
    if (stealthWindow) {
      stealthWindow.close();
    }
  });

  ipcMain.on('set-ignore-mouse-events', (event, ignore, options) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    win?.setIgnoreMouseEvents(ignore, options);
  });

  ipcMain.on('lock-stealth-window', () => {
    if (stealthWindow) {
      stealthWindow.setIgnoreMouseEvents(true, { forward: true });
      stealthWindow.webContents.send('stealth-lock-status', true);
      mainWindow?.webContents.send('stealth-lock-status', true);
    }
  });

  ipcMain.on('unlock-stealth-window', () => {
    if (stealthWindow) {
      stealthWindow.setIgnoreMouseEvents(false);
      stealthWindow.webContents.send('stealth-lock-status', false);
      mainWindow?.webContents.send('stealth-lock-status', false);
    }
  });

  ipcMain.handle('get-desktop-sources', async () => {
    return await desktopCapturer.getSources({ types: ['screen', 'window'] });
  });

  ipcMain.handle('test-connection', async (event, provider, url, key) => {
    return await testLLMConnection(provider, url, key);
  });

  ipcMain.handle('call-llm-api', async (event, params) => {
    return await sendAudioToLLM(params);
  });

  ipcMain.handle('transcribe-audio', async (event, url, key, model, audioBase64) => {
    return await transcribeAudio(url, key, model, audioBase64);
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
