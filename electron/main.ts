import { app, BrowserWindow, ipcMain, desktopCapturer, globalShortcut, dialog, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { testLLMConnection, sendAudioToLLM, transcribeAudio } from './apiClient';

const mammoth = require('mammoth');
const { PDFParse } = require('pdf-parse');

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
    // mainWindow.webContents.openDevTools();
  }
}

function createStealthWindow(hideFromCapture: boolean) {
  if (stealthWindow) {
    stealthWindow.setContentProtection(hideFromCapture);
    return;
  }

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

  stealthWindow.setContentProtection(hideFromCapture);

  if (app.isPackaged) {
    stealthWindow.loadFile(path.join(__dirname, '../dist/index.html'), { hash: 'stealth' });
  } else {
    stealthWindow.loadURL('http://localhost:5173/#/stealth');
    // stealthWindow.webContents.openDevTools();
  }

  stealthWindow.on('closed', () => {
    stealthWindow = null;
  });
}

app.whenReady().then(() => {
  createMainWindow();

  // Register global hotkey for pinning the response (Ctrl+Alt+P)
  globalShortcut.register('CommandOrControl+Alt+P', () => {
    if (stealthWindow) {
      stealthWindow.webContents.send('toggle-stealth-pin');
    }
  });

  // Register global hotkey for locking/unlocking the response (Ctrl+Alt+U)
  globalShortcut.register('CommandOrControl+Alt+U', () => {
    if (stealthWindow) {
      stealthWindow.webContents.send('toggle-stealth-lock');
    }
  });

  ipcMain.on('start-stealth-mode', (_event, settings) => {
    const hideFromCapture = settings?.hideOverlayFromCapture !== false;
    console.log('Main process: start-stealth-mode hideFromCapture =', hideFromCapture);
    createStealthWindow(hideFromCapture);
  });

  ipcMain.on('stop-stealth-mode', () => {
    if (stealthWindow) {
      stealthWindow.close();
    }
  });

  ipcMain.on('set-content-protection', (_event, hideFromCapture) => {
    console.log('Main process: set-content-protection received hideFromCapture =', hideFromCapture);
    if (stealthWindow) {
      const bounds = stealthWindow.getBounds();
      stealthWindow.removeAllListeners('closed');
      stealthWindow.close();
      stealthWindow = null;
      createStealthWindow(hideFromCapture);
      const activeWin = stealthWindow as any;
      if (activeWin) {
        activeWin.setBounds(bounds);
      }
      console.log(`Main process: Recreated stealth window with content protection = ${hideFromCapture}`);
    }
  });

  ipcMain.on('set-ignore-mouse-events', (event, ignore, options) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    win?.setIgnoreMouseEvents(ignore, options);
  });

  ipcMain.on('lock-stealth-window', () => {
    console.log('Main process: lock-stealth-window event received');
    if (stealthWindow) {
      stealthWindow.setIgnoreMouseEvents(true, { forward: true });
      stealthWindow.webContents.send('stealth-lock-status', true);
      mainWindow?.webContents.send('stealth-lock-status', true);
      console.log('Main process: stealthWindow set to ignore mouse events (true)');
    } else {
      console.warn('Main process: lock-stealth-window failed, stealthWindow is null');
    }
  });

  ipcMain.on('unlock-stealth-window', () => {
    console.log('Main process: unlock-stealth-window event received');
    if (stealthWindow) {
      stealthWindow.setIgnoreMouseEvents(false);
      // Toggle visibility to force Windows OS to reset hit-testing bounds for transparency
      stealthWindow.hide();
      stealthWindow.show();
      stealthWindow.focus();
      
      stealthWindow.webContents.send('stealth-lock-status', false);
      mainWindow?.webContents.send('stealth-lock-status', false);
      console.log('Main process: stealthWindow set to ignore mouse events (false) + forced repaint');
    } else {
      console.warn('Main process: unlock-stealth-window failed, stealthWindow is null');
    }
  });

  ipcMain.handle('get-desktop-sources', async () => {
    return await desktopCapturer.getSources({ types: ['screen', 'window'] });
  });

  ipcMain.handle('test-connection', async (_event, provider, url, key, customModel) => {
    return await testLLMConnection(provider, url, key, customModel);
  });

  ipcMain.handle('call-llm-api', async (_event, params) => {
    return await sendAudioToLLM(params);
  });

  ipcMain.handle('transcribe-audio', async (_event, url, key, model, audioBase64) => {
    return await transcribeAudio(url, key, model, audioBase64);
  });

  async function parseFile(filePath: string) {
    const fileExt = path.extname(filePath).toLowerCase();
    try {
      if (fileExt === '.txt') {
        const text = fs.readFileSync(filePath, 'utf-8');
        return { text };
      } else if (fileExt === '.docx') {
        const buffer = fs.readFileSync(filePath);
        const mammothResult = await mammoth.extractRawText({ buffer });
        return { text: mammothResult.value };
      } else if (fileExt === '.pdf') {
        const buffer = fs.readFileSync(filePath);
        const uint8Array = new Uint8Array(buffer);
        const parser = new PDFParse({ data: uint8Array });
        const data = await parser.getText();
        return { text: data.text };
      } else {
        throw new Error('Unsupported file format. Please upload .pdf, .docx, or .txt files.');
      }
    } catch (error: any) {
      console.error('Error parsing resume:', error);
      return { error: error.message || 'Failed to parse resume file' };
    }
  }

  ipcMain.handle('import-resume', async (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window) return null;

    const result = await dialog.showOpenDialog(window, {
      title: 'Select Resume File',
      filters: [
        { name: 'Resumes', extensions: ['pdf', 'docx', 'txt'] },
        { name: 'PDF Documents', extensions: ['pdf'] },
        { name: 'Word Documents', extensions: ['docx'] },
        { name: 'Text Files', extensions: ['txt'] }
      ],
      properties: ['openFile']
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    return await parseFile(result.filePaths[0]);
  });

  ipcMain.handle('parse-resume-from-path', async (_event, filePath) => {
    return await parseFile(filePath);
  });

  ipcMain.handle('get-os-username', () => {
    try {
      const os = require('os');
      const name = os.userInfo().username;
      if (name) {
        return name.charAt(0).toUpperCase() + name.slice(1);
      }
      return 'User';
    } catch (e) {
      return 'User';
    }
  });

  ipcMain.on('open-external', (_event, url) => {
    shell.openExternal(url);
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

app.on('will-quit', () => {
  // Unregister all global shortcuts when application exits
  globalShortcut.unregisterAll();
});
