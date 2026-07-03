import React, { useEffect, useState, useRef } from 'react';
import { X, GripHorizontal, Activity, AlertCircle, Download, Monitor, Lock, Pin } from 'lucide-react';
import { SlidingAudioBuffer } from '../utils/audioBuffer';
import { initLocalWhisper, transcribeLocalAudio } from '../utils/localTranscriber';

// Helper to convert Float32Array to 16kHz
function resampleBuffer(input: Float32Array, fromSampleRate: number, toSampleRate: number): Float32Array {
  if (fromSampleRate === toSampleRate) {
    return input;
  }
  const ratio = fromSampleRate / toSampleRate;
  const newLength = Math.round(input.length / ratio);
  const result = new Float32Array(newLength);
  for (let i = 0; i < newLength; i++) {
    const nextIndex = Math.min(input.length - 1, Math.round(i * ratio));
    result[i] = input[nextIndex];
  }
  return result;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64data = (reader.result as string).split(',')[1];
      resolve(base64data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export default function StealthMode() {
  const [transcript, setTranscript] = useState('Initializing audio capture...');
  const [aiResponse, setAiResponse] = useState('');
  const [opacity, setOpacity] = useState(0.85);
  const [isRecording, setIsRecording] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [downloadProgress, setDownloadProgress] = useState('');
  
  // Audio volume visualizers
  const [systemVol, setSystemVol] = useState(0);
  const [hasSystemAudioTrack, setHasSystemAudioTrack] = useState(false);

  // Stateful Stealth Lock & Pinning
  const [isLocked, setIsLocked] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  
  const isPinnedRef = useRef(false);

  // Audio nodes and refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamsRef = useRef<MediaStream[]>([]);
  const slidingBufferRef = useRef<SlidingAudioBuffer>(new SlidingAudioBuffer(30, 16000));
  const volumeRef = useRef({ system: 0 });

  // Voice Activity Detection (VAD) state
  const vadState = useRef({
    isSpeaking: false,
    lastActiveTime: 0,
    hasSpeechHappened: false
  });
  const processingRef = useRef(false);

  useEffect(() => {
    startAudioPipeline();

    // Listen to Lock/Unlock status
    if (window.electronAPI && window.electronAPI.onStealthLockStatus) {
      const unsubscribe = window.electronAPI.onStealthLockStatus((locked) => {
        setIsLocked(locked);
      });
      return () => {
        unsubscribe();
      };
    }
  }, []);

  useEffect(() => {
    // Listen to Global Pin shortcut status
    if (window.electronAPI && window.electronAPI.onTogglePin) {
      const unsubscribe = window.electronAPI.onTogglePin(() => {
        const nextPin = !isPinnedRef.current;
        isPinnedRef.current = nextPin;
        setIsPinned(nextPin);
        console.log('Stealth Lock Pin state:', nextPin ? 'PINNED' : 'UNPINNED');
      });
      return () => {
        unsubscribe();
      };
    }
  }, []);

  useEffect(() => {
    let animationFrameId: number;
    const updateVolumes = () => {
      setSystemVol(volumeRef.current.system);
      animationFrameId = requestAnimationFrame(updateVolumes);
    };
    updateVolumes();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const cleanupAudioPipeline = () => {
    streamsRef.current.forEach(stream => {
      stream.getTracks().forEach(track => track.stop());
    });
    streamsRef.current = [];
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
  };

  const startAudioPipeline = async () => {
    try {
      const sttProvider = localStorage.getItem('sttProvider') || 'none';
      
      if (sttProvider === 'local') {
        setTranscript('Loading local Whisper model...');
        await initLocalWhisper((msg) => {
          setDownloadProgress(msg);
        });
        setDownloadProgress('');
      }

      setTranscript('Listing screen share audio sources...');
      
      if (!window.electronAPI || !window.electronAPI.getDesktopSources) {
        throw new Error('Electron APIs not detected. Are you running in Electron?');
      }

      const sources = await window.electronAPI.getDesktopSources();
      const screenSource = sources.find(s => s.id.startsWith('screen:')) || sources[0];
      if (!screenSource) {
        throw new Error('No screen capture sources found.');
      }

      setTranscript('Requesting system audio access...');

      let systemStream: MediaStream;
      try {
        systemStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            mandatory: {
              chromeMediaSource: 'desktop',
              chromeMediaSourceId: screenSource.id
            }
          },
          video: {
            mandatory: {
              chromeMediaSource: 'desktop',
              chromeMediaSourceId: screenSource.id,
              maxFrameRate: 1,
              maxWidth: 100,
              maxHeight: 100
            }
          }
        } as any);
      } catch (e) {
        console.warn('Mandatory constraints failed, trying fallback...', e);
        systemStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: screenSource.id
          },
          video: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: screenSource.id,
            maxFrameRate: 1,
            maxWidth: 100,
            maxHeight: 100
          }
        } as any);
      }

      streamsRef.current.push(systemStream);

      const systemAudioTracks = systemStream.getAudioTracks();
      if (systemAudioTracks.length > 0) {
        setHasSystemAudioTrack(true);
        systemAudioTracks[0].enabled = true;
        console.log('Successfully bound System Audio Track:', systemAudioTracks[0].label);
      } else {
        setHasSystemAudioTrack(false);
        console.warn('System capture succeeded but contains no audio tracks.');
      }

      setTranscript('Initializing Audio Context...');

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioCtx;

      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }
      console.log('AudioContext running. State:', audioCtx.state);

      const systemSourceNode = audioCtx.createMediaStreamSource(systemStream);
      
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) {
          sum += inputData[i] * inputData[i];
        }

        const rms = Math.sqrt(sum / inputData.length);
        volumeRef.current = { system: rms };

        // Do not process audio if responses are pinned/locked
        if (isPinnedRef.current) {
          volumeRef.current = { system: 0 };
          return;
        }

        const threshold = 0.008;
        const now = Date.now();

        if (rms > threshold) {
          if (!vadState.current.isSpeaking) {
            console.log('VAD: Speech detected. Recording session...');
            vadState.current.isSpeaking = true;
            vadState.current.hasSpeechHappened = true;
            slidingBufferRef.current.clear();
          }
          vadState.current.lastActiveTime = now;
        }

        if (vadState.current.isSpeaking) {
          const resampled = resampleBuffer(inputData, audioCtx.sampleRate, 16000);
          slidingBufferRef.current.append(resampled);

          if (rms <= threshold && (now - vadState.current.lastActiveTime) > 1500) {
            console.log('VAD: Silence detected. Triggering question processing...');
            vadState.current.isSpeaking = false;
            
            setTimeout(() => {
              processQuestion();
            }, 0);
          }
        }
      };

      systemSourceNode.connect(processor);
      processor.connect(audioCtx.destination);

      setIsRecording(true);
      setTranscript('Waiting for interviewer to speak...');

    } catch (err: any) {
      console.error('Audio capture error:', err);
      setErrorMsg(err.message || 'Error configuring audio capture.');
      setTranscript('Failed to capture audio.');
    }
  };

  const processQuestion = async () => {
    if (isPinnedRef.current) {
      console.log('VAD loop ignored: response is pinned.');
      return;
    }
    if (processingRef.current || slidingBufferRef.current.isEmpty()) return;
    processingRef.current = true;

    const provider = localStorage.getItem('model') || 'lmstudio';
    const lmStudioUrl = localStorage.getItem('lmStudioUrl') || 'http://localhost:1234';
    const lmStudioModel = localStorage.getItem('lmStudioModel') || 'google/gemma-4-e2b';
    const geminiApiKey = localStorage.getItem('geminiApiKey') || '';
    const geminiModel = localStorage.getItem('geminiModel') || 'gemini-2.5-flash';
    const openaiApiKey = localStorage.getItem('openaiApiKey') || '';
    const openaiModel = localStorage.getItem('openaiModel') || 'gpt-4o-mini';
    const anthropicApiKey = localStorage.getItem('anthropicApiKey') || '';
    const anthropicModel = localStorage.getItem('anthropicModel') || 'claude-3-5-sonnet-20240620';
    const nvidiaApiKey = localStorage.getItem('nvidiaApiKey') || '';
    const nvidiaUrl = localStorage.getItem('nvidiaUrl') || 'https://integrate.api.nvidia.com/v1';
    const nvidiaModel = localStorage.getItem('nvidiaModel') || 'meta/llama-3.1-70b-instruct';
    const resumeText = localStorage.getItem('resumeText') || '';
    const jobDescription = localStorage.getItem('jobDescription') || '';

    const sttProvider = localStorage.getItem('sttProvider') || 'none';
    const whisperUrl = localStorage.getItem('whisperUrl') || '';
    const whisperApiKey = localStorage.getItem('whisperApiKey') || '';
    const whisperModel = localStorage.getItem('whisperModel') || 'whisper-large-v3';

    try {
      let currentTranscript = '';
      const samples = slidingBufferRef.current.getRawSamples();
      
      let maxAmp = 0;
      for (let i = 0; i < samples.length; i++) {
        const abs = Math.abs(samples[i]);
        if (abs > maxAmp) maxAmp = abs;
      }

      console.log(`VAD processing: ${samples.length} samples. Max amplitude: ${maxAmp.toFixed(4)}`);

      if (maxAmp < 0.001) {
        console.log('Processing skipped: session audio is silent.');
        setTranscript('Waiting for interviewer to speak...');
        processingRef.current = false;
        return;
      }

      // Step 1: Transcribe
      if (sttProvider === 'local') {
        setTranscript('Transcribing...');
        const t0 = performance.now();
        currentTranscript = await transcribeLocalAudio(samples);
        const t1 = performance.now();
        console.log(`Local Whisper transcribed: "${currentTranscript}" in ${Math.round(t1 - t0)}ms`);
      } else if (sttProvider === 'whisper') {
        setTranscript('Transcribing...');
        const wavBlob = slidingBufferRef.current.getWavBlob();
        const base64Audio = await blobToBase64(wavBlob);
        currentTranscript = await window.electronAPI.transcribeAudio(
          whisperUrl,
          whisperApiKey,
          whisperModel,
          base64Audio
        );
        console.log(`Whisper API transcribed: "${currentTranscript}"`);
      }

      // Filter out short noise/feedback from triggering LLM queries (e.g. less than 4 words)
      if (sttProvider !== 'none') {
        const words = currentTranscript.trim().split(/\s+/).filter(w => w.length > 0);
        if (words.length < 4) {
          console.log(`LLM query skipped: text "${currentTranscript}" is too short (${words.length} words) to be an interview query.`);
          setTranscript(currentTranscript || 'Listening...');
          processingRef.current = false;
          return;
        }
      }

      setTranscript(currentTranscript);

      // Step 2: Request suggestions
      if (sttProvider === 'none' || currentTranscript.trim()) {
        setAiResponse('Thinking of response...');
        
        const wavBlob = slidingBufferRef.current.getWavBlob();
        const base64Audio = await blobToBase64(wavBlob);

        if (window.electronAPI && window.electronAPI.callLLM) {
          const params = {
            provider,
            lmStudioUrl,
            lmStudioModel,
            geminiApiKey,
            geminiModel,
            openaiApiKey,
            openaiModel,
            anthropicApiKey,
            anthropicModel,
            nvidiaApiKey,
            nvidiaModel,
            nvidiaUrl,
            resumeText,
            jobDescription,
            audioBase64: base64Audio,
            textTranscript: sttProvider !== 'none' ? currentTranscript : undefined,
          };

          const response = await window.electronAPI.callLLM(params);
          // Only parse/update suggestions if it hasn't been pinned in the meantime
          if (!isPinnedRef.current) {
            parseResponse(response);
          }
        }
      }
    } catch (err: any) {
      console.error('Question processing pipeline error:', err);
      setAiResponse(`Inference error: ${err.message}`);
      setTranscript('Error in speech analysis.');
    } finally {
      processingRef.current = false;
      slidingBufferRef.current.clear();
    }
  };

  const parseResponse = (rawResponse: string) => {
    const questionMatch = rawResponse.match(/TRANSCRIBED QUESTION:?([\s\S]*?)(?=SUGGESTED ANSWER:?|$)/i);
    const answerMatch = rawResponse.match(/SUGGESTED ANSWER:?([\s\S]*?)$/i);

    if (questionMatch || answerMatch) {
      if (questionMatch && questionMatch[1].trim()) {
        setTranscript(`Interviewer: ${questionMatch[1].trim()}`);
      }
      if (answerMatch && answerMatch[1].trim()) {
        setAiResponse(answerMatch[1].trim());
      }
    } else {
      setAiResponse(rawResponse);
    }
  };

  const handleClose = () => {
    cleanupAudioPipeline();
    if (window.electronAPI) {
      window.electronAPI.stopStealthMode();
    }
  };

  const toggleLock = () => {
    if (window.electronAPI) {
      if (isLocked) {
        window.electronAPI.unlockStealthWindow();
      } else {
        window.electronAPI.lockStealthWindow();
      }
    }
  };

  const togglePin = () => {
    const nextPin = !isPinned;
    isPinnedRef.current = nextPin;
    setIsPinned(nextPin);
  };

  return (
    <div 
      className={`w-screen h-screen flex flex-col p-4 text-white overflow-hidden transition-all duration-300 ${
        isLocked 
          ? 'bg-black/10 border-0 pointer-events-none' 
          : 'bg-slate-950/95 border border-indigo-500/30 rounded-2xl shadow-2xl shadow-indigo-500/10'
      }`}
      style={{ opacity: isLocked ? opacity : 1 }}
    >
      
      {/* Control Header: Only visible when UNLOCKED */}
      {!isLocked ? (
        <div 
          className="flex justify-between items-center mb-3 p-2 rounded-xl bg-gray-900/90 border border-gray-800 shadow-md"
          style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
        >
          {/* Drag Handle & Status */}
          <div className="flex items-center gap-2 bg-black/40 px-2.5 py-1.5 rounded-lg select-none">
            <GripHorizontal size={16} className="text-indigo-400 cursor-move" />
            <span className="text-[10px] text-gray-300 font-bold tracking-wider uppercase">Setup mode</span>
          </div>

          {/* Volume Meter */}
          <div className="flex items-center gap-2 bg-black/30 px-3 py-1.5 rounded-lg text-[10px] text-gray-400 font-bold uppercase tracking-wider select-none">
            <Monitor size={12} className={hasSystemAudioTrack ? "text-blue-400 animate-pulse" : "text-gray-600"} />
            <div className="w-16 h-2 bg-gray-800 rounded-sm overflow-hidden relative border border-gray-700">
              <div 
                className="h-full bg-blue-500 transition-all duration-75"
                style={{ width: `${Math.min(100, Math.round(systemVol * 500))}%` }}
              ></div>
            </div>
          </div>

          {/* Controls */}
          <div 
            className="flex items-center gap-3"
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          >
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 font-medium">Stealth Opacity</span>
              <input 
                type="range" 
                min="0.2" 
                max="1" 
                step="0.05" 
                value={opacity} 
                onChange={(e) => setOpacity(parseFloat(e.target.value))}
                className="w-20 accent-indigo-500 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Manual Pin Toggle */}
            <button 
              onClick={togglePin}
              className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
                isPinned 
                  ? 'bg-amber-600 text-white' 
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <Pin size={12} />
              {isPinned ? 'Pinned' : 'Pin'}
            </button>

            <button 
              onClick={toggleLock}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
            >
              <Lock size={12} />
              Lock
            </button>
            
            <button 
              onClick={handleClose}
              className="hover:bg-red-500/80 p-1.5 rounded-lg transition-colors text-gray-400 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      ) : (
        /* Locked minimal indicators (faint, click-through) */
        <div className="flex justify-between items-center mb-1 select-none opacity-40 text-[9px] font-bold text-gray-400 tracking-wider">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
            <span>ASSISTANT ACTIVE</span>
            {isPinned && <span className="bg-amber-950/80 text-amber-400 border border-amber-500/20 px-1 py-0.5 rounded ml-1 text-[8px]">PINNED 📌</span>}
          </div>
          <div>LOCKED (SHORTCUT: CTRL+ALT+P TO PIN/UNPIN)</div>
        </div>
      )}

      {/* Warnings & Model downloads (only shown when Unlocked) */}
      {!isLocked && (
        <>
          {downloadProgress && (
            <div className="bg-indigo-950/50 border border-indigo-500/30 p-2.5 rounded-xl text-xs text-indigo-300 mb-2 flex items-center gap-3 animate-pulse">
              <Download size={14} className="text-indigo-400" />
              <p>{downloadProgress}</p>
            </div>
          )}
          {!hasSystemAudioTrack && isRecording && (
            <div className="bg-amber-950/50 border border-amber-500/30 p-2.5 rounded-xl text-xs text-amber-300 mb-2 flex items-start gap-2">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              <p>No audio track detected. Make sure you share screen audio when running.</p>
            </div>
          )}
          {errorMsg && (
            <div className="bg-rose-950/50 border border-rose-500/30 p-2.5 rounded-xl text-xs text-rose-300 mb-2 flex items-start gap-2">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              <p>{errorMsg}</p>
            </div>
          )}
          <div className="text-[10px] text-indigo-300/80 bg-indigo-950/20 border border-indigo-500/10 p-2 rounded-xl text-center mb-2">
            💡 Position this window, resize it, then click <b>Lock</b>. Toggle pin status using <b>Ctrl+Alt+P</b>.
          </div>
        </>
      )}

      {/* Transcript Area */}
      <div 
        className={`flex-1 overflow-y-auto mb-2 text-sm text-gray-300 p-1 select-none pointer-events-none transition-all ${
          isLocked ? 'text-gray-400 font-medium' : 'text-gray-300'
        }`}
      >
        <p className="italic">{transcript}</p>
      </div>

      {/* AI Suggestion Area */}
      <div 
        className={`bg-gradient-to-r transition-all duration-350 ${
          isLocked 
            ? 'h-40 from-indigo-950/40 to-purple-950/40 border-indigo-500/10 rounded-xl p-3 border' 
            : 'h-48 from-indigo-950/70 to-purple-950/70 border-indigo-500/30 rounded-2xl p-4 border overflow-y-auto'
        } ${isPinned ? 'border-amber-500/30 ring-1 ring-amber-500/10' : ''}`}
      >
        {aiResponse ? (
          <p className="text-sm font-semibold text-blue-100 leading-relaxed whitespace-pre-line">
            {aiResponse}
          </p>
        ) : (
          <div className="flex items-center gap-3 h-full justify-center opacity-50 select-none">
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-ping"></div>
            <span className="text-xs uppercase tracking-widest font-semibold">Waiting for interviewer questions...</span>
          </div>
        )}
      </div>

    </div>
  );
}
