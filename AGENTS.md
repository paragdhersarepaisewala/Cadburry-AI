# AGENTS instructions for Hidden Interview Assistant

## Project overview
- This repository is a Windows desktop interview assistant built with Vite, React, TypeScript, and Electron.
- The renderer UI lives in [src](src), while Electron main/preload logic lives in [electron](electron).
- The app combines desktop audio capture, a stealth overlay window, optional local Whisper transcription, and multiple LLM providers.
- Start with [README.md](README.md) for product context and setup steps.

## Working conventions
- Keep changes small and focused. Prefer updating the existing React components and Electron IPC flow rather than introducing new architecture.
- Preserve the current split between UI code in [src](src) and Electron-side integration in [electron](electron).
- If you add or change a bridge method, update both the preload bridge and the corresponding Electron handler.
- For LLM or STT changes, keep provider-specific request shapes compatible with [electron/apiClient.ts](electron/apiClient.ts) and [src/utils/localTranscriber.ts](src/utils/localTranscriber.ts).
- The dashboard stores user preferences in localStorage using the keys already defined in [src/components/Dashboard.tsx](src/components/Dashboard.tsx); reuse that pattern rather than inventing a new persistence approach.
- Keep stealth mode behavior consistent between [src/components/StealthMode.tsx](src/components/StealthMode.tsx) and [electron/main.ts](electron/main.ts).

## Common commands
- Install dependencies: npm install
- Build the Electron main process: npm run build:electron
- Start the Vite frontend: npm run dev
- Start the Electron app in dev mode: npm run electron:dev
- Produce a packaged build: npm run build

## Notes for agents
- This project targets Windows desktop behavior, so Electron windowing and transparency features matter.
- Audio capture and transcription are sensitive features; avoid breaking the existing startup flow or the stealth overlay lock/unlock behavior.
- There is no dedicated automated test suite in the repository yet, so verification should rely on the build commands above.
