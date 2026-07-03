========================================================================
                      CADBURRY AI - HIDDEN INTERVIEW ASSISTANT
========================================================================

Cadburry AI is a stealthy, real-time interview assistant that listens to 
interviewer questions from your system audio, processes them locally or 
via cloud APIs, and displays instant, customized suggested answers 
derived from your Resume and Job Description.

Designed for complete discretion, Cadburry AI runs on a dual-window 
system including a main controller dashboard and a specialized stealth 
overlay window that is hidden from screen capture software.

------------------------------------------------------------------------
FEATURES
------------------------------------------------------------------------

1. STEALTH MODE WINDOW (SCREEN-SHARE PROTECTION)
   - The overlay window uses native OS content protection flags 
     (setContentProtection) to bypass screen-sharing, recording, and OBS 
     capture. It will appear blank/black or disappear completely to 
     anyone viewing your screen share.
   - Click-Through Mode: Lock the window once placed to ignore clicks, 
     allowing you to interact with windows behind it natively.

2. LOCAL SPEECH-TO-TEXT (WHISPER STT - 100% FREE & OFFLINE)
   - Transcribes system audio locally using Hugging Face's 
     Transformers.js (WebAssembly version of whisper-tiny.en, ~75MB).
   - No external APIs or subscription costs required for transcription.

3. DUAL LLM MODALITY OPTIONS
   - Local: Run local models (such as Gemma) using LM Studio's 
     OpenAI-compatible server endpoint.
   - Cloud: Run using the Gemini 1.5 API for low latency and high accuracy.

4. DYNAMIC AUDIO PIPELINE
   - Mixed system loopback audio capture so the app only transcribes 
     incoming audio (the interviewer), keeping your mic muted and 
     maintaining focus.

------------------------------------------------------------------------
PREREQUISITES & INSTALLATION
------------------------------------------------------------------------

1. Ensure you have Node.js installed (v18 or higher recommended).
2. Install dependencies:
   npm install

------------------------------------------------------------------------
HOW TO RUN
------------------------------------------------------------------------

1. Run the Vite dev server in the background:
   npm run dev

2. Launch the Electron Desktop application:
   npm run electron:dev

------------------------------------------------------------------------
CONFIGURATION & USAGE GUIDE
------------------------------------------------------------------------

1. SETUP CONTEXT:
   - Paste your Resume and the target Job Description in the main 
     controller dashboard. This context is saved automatically.

2. SET LLM PROVIDER:
   - For Local (LM Studio):
     - Open LM Studio, download and load your model (e.g. gemma-2-9b).
     - Start the Local Server in LM Studio (usually http://localhost:1234).
     - Enter the URL (e.g. http://localhost:1234/v1) and your Model 
       Identifier in the Cadburry configuration panel.
   - For Cloud (Gemini):
     - Select Google LLM Provider and enter your Gemini API Key.

3. SET SPEECH-TO-TEXT (STT):
   - Choose "Local Whisper (transformers.js - FREE)".
   - (Optional) Use "Cloud Whisper" if you want to use external Groq or 
     OpenAI transcription services (requires API key).

4. START ASSISTANT:
   - Click "Start Assistant" on the dashboard.
   - An overlay window will appear. It starts in "Setup Mode" (unlocked).
   - Position and resize the window to your liking. Drag it using the 
     header handle. Adjust opacity using the slider.
   - Check the "System Audio Level" visualizer bar. Play any audio on 
     your system (e.g., test sound) to make sure the bar bounces.
   - Click "Lock" to turn on Stealth click-through. It will fade, hide 
     all control panels, and ignore mouse clicks.
   - If you need to resize or move the window again, click "Unlock Overlay" 
     on the main Dashboard window.

------------------------------------------------------------------------
LICENSING & SOURCE CODE
------------------------------------------------------------------------
Repository: https://github.com/paragdhersarepaisewala/Cadburry-AI.git
Branch: main
========================================================================
