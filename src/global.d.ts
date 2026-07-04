export {};

declare global {
  interface Window {
    electronAPI: {
      startStealthMode: () => void;
      stopStealthMode: () => void;
      setIgnoreMouseEvents: (ignore: boolean, options?: { forward: boolean }) => void;
      getDesktopSources: () => Promise<Array<{ id: string; name: string; thumbnail: any }>>;
      testConnection: (provider: string, url: string, key: string, customModel?: string) => Promise<string>;
      callLLM: (params: any) => Promise<string>;
      transcribeAudio: (url: string, key: string, model: string, audioBase64: string) => Promise<string>;
      lockStealthWindow: () => void;
      unlockStealthWindow: () => void;
      onStealthLockStatus: (callback: (locked: boolean) => void) => () => void;
      onTogglePin: (callback: () => void) => () => void;
      importResume: () => Promise<{ text: string; error?: string } | null>;
      parseResumeFromPath: (filePath: string) => Promise<{ text: string; error?: string } | null>;
      getOSUsername: () => Promise<string>;
      openExternal: (url: string) => void;
    };
  }
}
