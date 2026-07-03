import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  startStealthMode: () => ipcRenderer.send('start-stealth-mode'),
  stopStealthMode: () => ipcRenderer.send('stop-stealth-mode'),
  setIgnoreMouseEvents: (ignore: boolean, options?: { forward: boolean }) => 
    ipcRenderer.send('set-ignore-mouse-events', ignore, options),
  getDesktopSources: () => ipcRenderer.invoke('get-desktop-sources'),
  testConnection: (provider: string, url: string, key: string, customModel?: string) => 
    ipcRenderer.invoke('test-connection', provider, url, key, customModel),
  callLLM: (params: any) => ipcRenderer.invoke('call-llm-api', params),
  transcribeAudio: (url: string, key: string, model: string, audioBase64: string) =>
    ipcRenderer.invoke('transcribe-audio', url, key, model, audioBase64),
  lockStealthWindow: () => ipcRenderer.send('lock-stealth-window'),
  unlockStealthWindow: () => ipcRenderer.send('unlock-stealth-window'),
  onStealthLockStatus: (callback: (locked: boolean) => void) => {
    const listener = (event: any, locked: boolean) => callback(locked);
    ipcRenderer.on('stealth-lock-status', listener);
    return () => ipcRenderer.removeListener('stealth-lock-status', listener);
  },
  onTogglePin: (callback: () => void) => {
    const listener = () => callback();
    ipcRenderer.on('toggle-stealth-pin', listener);
    return () => ipcRenderer.removeListener('toggle-stealth-pin', listener);
  }
});
