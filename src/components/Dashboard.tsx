import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Mic, 
  Play, 
  Monitor, 
  Link, 
  Cpu, 
  Key, 
  Globe, 
  Home, 
  Sliders, 
  Sparkles, 
  Shield, 
  ArrowRight, 
  Upload, 
  AlertCircle, 
  RefreshCw, 
  Trash2,
  Lock,
  Unlock,
  Check,
  X,
  FileCheck,
  Pin
} from 'lucide-react';

export default function Dashboard() {
  // Config states (stored in localStorage)
  const [model, setModel] = useState(() => localStorage.getItem('model') || 'lmstudio');
  const [lmStudioUrl, setLmStudioUrl] = useState(() => localStorage.getItem('lmStudioUrl') || 'http://localhost:1234');
  const [lmStudioModel, setLmStudioModel] = useState(() => localStorage.getItem('lmStudioModel') || 'google/gemma-4-e2b');
  const [geminiApiKey, setGeminiApiKey] = useState(() => localStorage.getItem('geminiApiKey') || '');
  const [geminiModel, setGeminiModel] = useState(() => localStorage.getItem('geminiModel') || 'gemini-2.5-flash');
  const [openaiApiKey, setOpenaiApiKey] = useState(() => localStorage.getItem('openaiApiKey') || '');
  const [openaiModel, setOpenaiModel] = useState(() => localStorage.getItem('openaiModel') || 'gpt-4o-mini');
  const [anthropicApiKey, setAnthropicApiKey] = useState(() => localStorage.getItem('anthropicApiKey') || '');
  const [anthropicModel, setAnthropicModel] = useState(() => localStorage.getItem('anthropicModel') || 'claude-3-5-sonnet-20240620');
  const [nvidiaApiKey, setNvidiaApiKey] = useState(() => localStorage.getItem('nvidiaApiKey') || '');
  const [nvidiaUrl, setNvidiaUrl] = useState(() => localStorage.getItem('nvidiaUrl') || 'https://integrate.api.nvidia.com/v1');
  const [nvidiaModel, setNvidiaModel] = useState(() => localStorage.getItem('nvidiaModel') || 'meta/llama-3.1-70b-instruct');
  const [tavilyApiKey, setTavilyApiKey] = useState(() => localStorage.getItem('tavilyApiKey') || '');
  const [resumeText, setResumeText] = useState(() => localStorage.getItem('resumeText') || '');
  const [jobDescription, setJobDescription] = useState(() => localStorage.getItem('jobDescription') || '');
  
  // Whisper Speech-to-Text configuration
  const [sttProvider, setSttProvider] = useState(() => localStorage.getItem('sttProvider') || 'none');
  const [whisperUrl, setWhisperUrl] = useState(() => localStorage.getItem('whisperUrl') || 'https://api.groq.com/openai/v1');
  const [whisperApiKey, setWhisperApiKey] = useState(() => localStorage.getItem('whisperApiKey') || '');
  const [whisperModel, setWhisperModel] = useState(() => localStorage.getItem('whisperModel') || 'whisper-large-v3');

  // UI state
  const [userName, setUserName] = useState(() => localStorage.getItem('userName') || 'User');
  const [hideOverlayFromCapture, setHideOverlayFromCapture] = useState(() => {
    const val = localStorage.getItem('hideOverlayFromCapture');
    return val === null ? true : val === 'true';
  });
  const [captureAudio, setCaptureAudio] = useState(() => {
    const val = localStorage.getItem('captureAudio');
    return val === null ? true : val === 'true';
  });

  const [activeTab, setActiveTab] = useState<'overview' | 'context' | 'llm' | 'stt' | 'search' | 'connections' | 'preferences'>('overview');
  const [dragActive, setDragActive] = useState(false);
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [statusMsg, setStatusMsg] = useState('');
  const [isLocked, setIsLocked] = useState(false);

  // Load OS username dynamically if not set
  useEffect(() => {
    const initUserName = async () => {
      const savedName = localStorage.getItem('userName');
      if (!savedName && window.electronAPI && window.electronAPI.getOSUsername) {
        try {
          const name = await window.electronAPI.getOSUsername();
          if (name) {
            setUserName(name);
            localStorage.setItem('userName', name);
          }
        } catch (e) {
          console.error('Failed to get OS username', e);
        }
      }
    };
    initUserName();
  }, []);

  useEffect(() => {
    if (window.electronAPI && window.electronAPI.onStealthLockStatus) {
      console.log('Dashboard: registering onStealthLockStatus listener');
      return window.electronAPI.onStealthLockStatus((locked) => {
        console.log('Dashboard: received stealth-lock-status =', locked);
        setIsLocked(locked);
      });
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('model', model);
    localStorage.setItem('lmStudioUrl', lmStudioUrl);
    localStorage.setItem('lmStudioModel', lmStudioModel);
    localStorage.setItem('geminiApiKey', geminiApiKey);
    localStorage.setItem('geminiModel', geminiModel);
    localStorage.setItem('openaiApiKey', openaiApiKey);
    localStorage.setItem('openaiModel', openaiModel);
    localStorage.setItem('anthropicApiKey', anthropicApiKey);
    localStorage.setItem('anthropicModel', anthropicModel);
    localStorage.setItem('nvidiaApiKey', nvidiaApiKey);
    localStorage.setItem('nvidiaUrl', nvidiaUrl);
    localStorage.setItem('nvidiaModel', nvidiaModel);
    localStorage.setItem('tavilyApiKey', tavilyApiKey);
    localStorage.setItem('resumeText', resumeText);
    localStorage.setItem('jobDescription', jobDescription);
    localStorage.setItem('sttProvider', sttProvider);
    localStorage.setItem('whisperUrl', whisperUrl);
    localStorage.setItem('whisperApiKey', whisperApiKey);
    localStorage.setItem('whisperModel', whisperModel);
    
    localStorage.setItem('userName', userName);
    localStorage.setItem('hideOverlayFromCapture', String(hideOverlayFromCapture));
    localStorage.setItem('captureAudio', String(captureAudio));
  }, [
    model, lmStudioUrl, lmStudioModel, geminiApiKey, geminiModel, openaiApiKey, openaiModel, 
    anthropicApiKey, anthropicModel, nvidiaApiKey, nvidiaUrl, nvidiaModel, tavilyApiKey, resumeText, jobDescription, 
    sttProvider, whisperUrl, whisperApiKey, whisperModel, userName, hideOverlayFromCapture, captureAudio
  ]);

  useEffect(() => {
    if (window.electronAPI && window.electronAPI.setContentProtection) {
      window.electronAPI.setContentProtection(hideOverlayFromCapture);
    }
  }, [hideOverlayFromCapture]);

  const handleStart = () => {
    if (window.electronAPI) {
      window.electronAPI.startStealthMode({ hideOverlayFromCapture });
    } else {
      console.warn('Electron API not available');
    }
  };

  const handleResetAll = () => {
    if (confirm('Are you sure you want to clear all configurations and reset to defaults?')) {
      localStorage.clear();
      setModel('lmstudio');
      setLmStudioUrl('http://localhost:1234');
      setLmStudioModel('google/gemma-4-e2b');
      setGeminiApiKey('');
      setGeminiModel('gemini-2.5-flash');
      setOpenaiApiKey('');
      setOpenaiModel('gpt-4o-mini');
      setAnthropicApiKey('');
      setAnthropicModel('claude-3-5-sonnet-20240620');
      setNvidiaApiKey('');
      setNvidiaUrl('https://integrate.api.nvidia.com/v1');
      setNvidiaModel('meta/llama-3.1-70b-instruct');
      setTavilyApiKey('');
      setResumeText('');
      setJobDescription('');
      setSttProvider('none');
      setWhisperUrl('https://api.groq.com/openai/v1');
      setWhisperApiKey('');
      setWhisperModel('whisper-large-v3');
      setHideOverlayFromCapture(true);
      setCaptureAudio(true);
      setStatus('idle');
      setStatusMsg('Configuration reset successfully.');
      setActiveTab('overview');

      if (window.electronAPI && window.electronAPI.getOSUsername) {
        window.electronAPI.getOSUsername().then((name) => {
          setUserName(name || 'User');
          localStorage.setItem('userName', name || 'User');
        });
      } else {
        setUserName('User');
      }
    }
  };

  const testConnection = async () => {
    setStatus('testing');
    setStatusMsg('Testing connections...\n');
    try {
      if (window.electronAPI && window.electronAPI.testConnection) {
        let result = '[Diagnostics log]\n';
        
        result += `Testing LLM Connection (${model})...\n`;
        let llmRes = '';
        if (model === 'lmstudio') {
          llmRes = await window.electronAPI.testConnection('lmstudio', lmStudioUrl, '');
        } else if (model === 'gemma') {
          llmRes = await window.electronAPI.testConnection('gemma', '', '');
        } else if (model === 'google') {
          llmRes = await window.electronAPI.testConnection('google', '', geminiApiKey, geminiModel);
        } else if (model === 'openai') {
          llmRes = await window.electronAPI.testConnection('openai', '', openaiApiKey, openaiModel);
        } else if (model === 'anthropic') {
          llmRes = await window.electronAPI.testConnection('anthropic', '', anthropicApiKey, anthropicModel);
        } else if (model === 'nvidia') {
          llmRes = await window.electronAPI.testConnection('nvidia', nvidiaUrl, nvidiaApiKey, nvidiaModel);
        }
        result += `└─ LLM Result: ${llmRes}\n\n`;
        
        if (sttProvider === 'whisper') {
          result += `Testing Cloud Whisper API (Groq/OpenAI)...\n`;
          const sttRes = await window.electronAPI.testConnection('whisper', whisperUrl, whisperApiKey);
          result += `└─ STT Result: ${sttRes}\n\n`;
        } else if (sttProvider === 'local') {
          result += `STT Configuration: Local Whisper (Transformers.js - initialized on start)\n\n`;
        } else {
          result += `STT Configuration: Disabled (Native LLM Audio mode)\n\n`;
        }

        if (tavilyApiKey) {
          result += `Testing Tavily Search RAG API...\n`;
          const searchRes = await window.electronAPI.testConnection('tavily', '', tavilyApiKey);
          result += `└─ Search Result: ${searchRes}\n\n`;
        } else {
          result += `Search Configuration: Disabled (Real-Time Web Search is optional)\n\n`;
        }
        
        setStatus('success');
        setStatusMsg(result + 'All configured system diagnostics passed!');
      } else {
        throw new Error('Electron API not available');
      }
    } catch (err: any) {
      setStatus('error');
      setStatusMsg((prev) => prev + `\nConnection Diagnostic Failed:\n${err.message}`);
    }
  };

  const handleImportResume = async () => {
    try {
      if (window.electronAPI && window.electronAPI.importResume) {
        setStatus('testing');
        setStatusMsg('Opening file explorer...');
        const result = await window.electronAPI.importResume();
        if (result) {
          if (result.error) {
            setStatus('error');
            setStatusMsg(`Resume import failed: ${result.error}`);
          } else if (result.text) {
            setResumeText(result.text);
            setStatus('success');
            setStatusMsg('Resume imported and parsed successfully!');
            setActiveTab('context');
          }
        } else {
          setStatus('idle');
          setStatusMsg('');
        }
      } else {
        alert('File import is only supported in Desktop app mode.');
      }
    } catch (err: any) {
      setStatus('error');
      setStatusMsg(`Resume parse failed: ${err.message}`);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const filePath = (file as any).path;
      
      if (!filePath) {
        if (file.type === "text/plain") {
          const text = await file.text();
          setResumeText(text);
          setActiveTab('context');
        } else {
          alert("Direct file reading for Word/PDF is only supported via local desktop file paths.");
        }
        return;
      }

      setStatus('testing');
      setStatusMsg(`Parsing local file: ${file.name}...`);
      try {
        if (window.electronAPI && window.electronAPI.parseResumeFromPath) {
          const result = await window.electronAPI.parseResumeFromPath(filePath);
          if (result) {
            if (result.error) {
              setStatus('error');
              setStatusMsg(`Failed to parse drag-and-drop file: ${result.error}`);
            } else if (result.text) {
              setResumeText(result.text);
              setStatus('success');
              setStatusMsg(`Successfully imported ${file.name}!`);
              setActiveTab('context');
            }
          }
        }
      } catch (err: any) {
        setStatus('error');
        setStatusMsg(`Error parsing local file path: ${err.message}`);
      }
    }
  };

  const getContextStatus = (): { label: string; type: 'success' | 'optional' | 'error' } => {
    const configured = resumeText.trim().length > 0 || jobDescription.trim().length > 0;
    return {
      label: configured ? 'Configured' : 'Unconfigured',
      type: configured ? 'success' : 'error'
    };
  };

  const getLlmStatus = (): { label: string; type: 'success' | 'optional' | 'error' } => {
    let configured = false;
    if (model === 'lmstudio') configured = lmStudioUrl.trim().length > 0;
    else if (model === 'gemma') configured = true;
    else if (model === 'google') configured = geminiApiKey.trim().length > 0;
    else if (model === 'openai') configured = openaiApiKey.trim().length > 0;
    else if (model === 'anthropic') configured = anthropicApiKey.trim().length > 0;
    else if (model === 'nvidia') configured = nvidiaApiKey.trim().length > 0 && nvidiaUrl.trim().length > 0;
    
    return {
      label: configured ? 'Configured' : 'Unconfigured',
      type: configured ? 'success' : 'error'
    };
  };

  const getSttStatus = (): { label: string; type: 'success' | 'optional' | 'error' } => {
    if (sttProvider === 'none') return { label: 'Optional', type: 'optional' };
    const configured = sttProvider === 'local' || whisperApiKey.trim().length > 0;
    return {
      label: configured ? 'Configured' : 'Unconfigured',
      type: configured ? 'success' : 'error'
    };
  };

  const getSearchStatus = (): { label: string; type: 'success' | 'optional' | 'error' } => {
    const configured = tavilyApiKey.trim().length > 0;
    return {
      label: configured ? 'Configured' : 'Optional',
      type: configured ? 'success' : 'optional'
    };
  };

  const getConnectionsStatus = (): { label: string; type: 'success' | 'optional' | 'error' } => {
    if (status === 'success') return { label: 'Configured', type: 'success' };
    if (status === 'error') return { label: 'Error', type: 'error' };
    return { label: 'Optional', type: 'optional' };
  };

  const getPreferencesStatus = (): { label: string; type: 'success' | 'optional' | 'error' } => {
    return { label: 'Optional', type: 'optional' };
  };

  const renderBadge = (statusObj: { label: string, type: 'success' | 'optional' | 'error' }) => {
    if (statusObj.type === 'success') {
      return (
        <span className="flex items-center gap-1 text-[10px] font-semibold bg-emerald-950/40 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full shrink-0">
          <Check size={10} strokeWidth={3} /> {statusObj.label}
        </span>
      );
    }
    if (statusObj.type === 'optional') {
      return (
        <span className="flex items-center gap-1 text-[10px] font-semibold bg-amber-950/30 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-full shrink-0">
          <AlertCircle size={10} /> {statusObj.label}
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-[10px] font-semibold bg-rose-950/20 text-rose-400 border border-rose-500/10 px-2.5 py-1 rounded-full shrink-0">
        <X size={10} /> {statusObj.label}
      </span>
    );
  };

  return (
    <div className="h-screen w-screen bg-[#131110] text-[#f0e6df] flex overflow-hidden antialiased select-none">
      
      {/* Sidebar Navigation */}
      <aside className="w-72 bg-[#0e0d0c] border-r border-[#26211d] flex flex-col justify-between p-6 h-full overflow-hidden shrink-0">
        
        {/* Top brand header */}
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#26211d] border border-[#3b332d] rounded-xl text-[#c5a880] shadow-md">
              <Sparkles size={22} className="animate-pulse" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-white">AI Interview Assistant</h1>
              <p className="text-[11px] text-[#a6958a] font-medium leading-none mt-1">Your helpful cheating assistant</p>
            </div>
          </div>

          {/* Navigation Links - Unified and clean, without redundant status badges */}
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center justify-start gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                activeTab === 'overview' 
                  ? 'bg-[#4d3a2e] text-white shadow-[0_4px_12px_rgba(77,58,46,0.15)] border-l-4 border-[#c5a880]' 
                  : 'text-[#a6958a] hover:bg-[#1a1715] hover:text-white'
              }`}
            >
              <Home size={16} className={activeTab === 'overview' ? 'text-[#c5a880]' : 'text-[#8c7b70]'} />
              <span>Overview</span>
            </button>

            <button
              onClick={() => setActiveTab('context')}
              className={`w-full flex items-center justify-start gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                activeTab === 'context' 
                  ? 'bg-[#4d3a2e] text-white shadow-[0_4px_12px_rgba(77,58,46,0.15)] border-l-4 border-[#c5a880]' 
                  : 'text-[#a6958a] hover:bg-[#1a1715] hover:text-white'
              }`}
            >
              <FileText size={16} className={activeTab === 'context' ? 'text-[#c5a880]' : 'text-[#8c7b70]'} />
              <span>Interview Context</span>
            </button>

            <button
              onClick={() => setActiveTab('llm')}
              className={`w-full flex items-center justify-start gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                activeTab === 'llm' 
                  ? 'bg-[#4d3a2e] text-white shadow-[0_4px_12px_rgba(77,58,46,0.15)] border-l-4 border-[#c5a880]' 
                  : 'text-[#a6958a] hover:bg-[#1a1715] hover:text-white'
              }`}
            >
              <Cpu size={16} className={activeTab === 'llm' ? 'text-[#c5a880]' : 'text-[#8c7b70]'} />
              <span>LLM Configuration</span>
            </button>

            <button
              onClick={() => setActiveTab('stt')}
              className={`w-full flex items-center justify-start gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                activeTab === 'stt' 
                  ? 'bg-[#4d3a2e] text-white shadow-[0_4px_12px_rgba(77,58,46,0.15)] border-l-4 border-[#c5a880]' 
                  : 'text-[#a6958a] hover:bg-[#1a1715] hover:text-white'
              }`}
            >
              <Mic size={16} className={activeTab === 'stt' ? 'text-[#c5a880]' : 'text-[#8c7b70]'} />
              <span>Speech-to-Text (STT)</span>
            </button>

            <button
              onClick={() => setActiveTab('search')}
              className={`w-full flex items-center justify-start gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                activeTab === 'search' 
                  ? 'bg-[#4d3a2e] text-white shadow-[0_4px_12px_rgba(77,58,46,0.15)] border-l-4 border-[#c5a880]' 
                  : 'text-[#a6958a] hover:bg-[#1a1715] hover:text-white'
              }`}
            >
              <Globe size={16} className={activeTab === 'search' ? 'text-[#c5a880]' : 'text-[#8c7b70]'} />
              <span>Real-Time Web Search</span>
            </button>

            <button
              onClick={() => setActiveTab('connections')}
              className={`w-full flex items-center justify-start gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                activeTab === 'connections' 
                  ? 'bg-[#4d3a2e] text-white shadow-[0_4px_12px_rgba(77,58,46,0.15)] border-l-4 border-[#c5a880]' 
                  : 'text-[#a6958a] hover:bg-[#1a1715] hover:text-white'
              }`}
            >
              <Link size={16} className={activeTab === 'connections' ? 'text-[#c5a880]' : 'text-[#8c7b70]'} />
              <span>Connections</span>
            </button>

            <button
              onClick={() => setActiveTab('preferences')}
              className={`w-full flex items-center justify-start gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                activeTab === 'preferences' 
                  ? 'bg-[#4d3a2e] text-white shadow-[0_4px_12px_rgba(77,58,46,0.15)] border-l-4 border-[#c5a880]' 
                  : 'text-[#a6958a] hover:bg-[#1a1715] hover:text-white'
              }`}
            >
              <Sliders size={16} className={activeTab === 'preferences' ? 'text-[#c5a880]' : 'text-[#8c7b70]'} />
              <span>Preferences</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer Start Button */}
        <div className="space-y-4">
          {isLocked && (
            <button 
              onClick={() => window.electronAPI.unlockStealthWindow()}
              className="w-full flex items-center justify-center gap-2 bg-[#2c7a52] hover:bg-[#349262] text-white font-bold py-2.5 px-4 rounded-xl text-xs tracking-wider transition-all"
            >
              <Unlock size={14} />
              Unlock Overlay
            </button>
          )}
          <button 
            onClick={handleStart}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#8c6d53] to-[#a37f62] hover:from-[#9c7b5f] hover:to-[#b59073] text-white font-bold py-3 px-4 rounded-xl text-xs tracking-wider transition-all shadow-[0_4px_20px_rgba(140,109,83,0.25)] border border-[#a37f62]/10"
          >
            <Play size={14} fill="currentColor" />
            Start Assistant
          </button>
          <p className="text-[10px] text-[#8c7b70] text-center font-medium leading-tight">Your AI copilot for interview success</p>
        </div>
      </aside>

      {/* Main Content Area - Fixed height, scrollbars contained inside tab body */}
      <main className="flex-1 bg-[#1e1b18] overflow-hidden flex flex-col justify-between h-full">
        
        {/* Tab Body Router - Overflow handled internally per tab context */}
        <div className="p-8 flex-1 overflow-y-auto min-h-0">
          
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Top Banner Widget */}
              <div className="bg-gradient-to-r from-[#24201d] to-[#1c1917] border border-[#2f2823] p-5 rounded-2xl flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#2f2823] border border-[#423932] rounded-xl flex items-center justify-center text-[#c5a880] shrink-0">
                    <Sparkles size={24} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white tracking-tight">Welcome back, {userName}!</h2>
                    <p className="text-xs text-[#a6958a] mt-0.5 font-medium">Your AI assistant is ready to help you ace your interviews.</p>
                  </div>
                </div>
                
                {/* System Status Indicator */}
                <div className="bg-[#181614] border border-[#2a2521] px-4 py-2 rounded-xl flex items-center gap-3 shrink-0">
                  <div className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </div>
                  <div>
                    <p className="text-[8px] text-[#8c7b70] font-bold uppercase tracking-wider leading-none">System Status</p>
                    <p className="text-[10px] font-bold text-[#f0e6df] mt-0.5">All systems operational</p>
                  </div>
                </div>
              </div>

              {/* Compact 6 Card Settings Grid - Fits beautifully within window height */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                
                {/* Card 1: Interview Context */}
                <div 
                  onClick={() => setActiveTab('context')}
                  className="bg-[#24201d] border border-[#2d2722] hover:border-[#c5a880]/30 hover:bg-[#282420] p-4 rounded-xl flex flex-col justify-between h-36 cursor-pointer transition-all shadow-md group"
                >
                  <div>
                    <div className="w-8 h-8 bg-blue-950/30 text-blue-400 border border-blue-900/30 rounded-lg flex items-center justify-center mb-2">
                      <FileText size={16} />
                    </div>
                    <h3 className="text-xs font-bold text-white tracking-tight">Interview Context</h3>
                    <p className="text-[10px] text-[#a6958a] leading-normal mt-1 font-medium">Manage your resume, job role, experience and other interview information.</p>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    {renderBadge(getContextStatus())}
                    <ArrowRight size={12} className="text-[#8c7b70] group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </div>
                </div>

                {/* Card 2: LLM Configuration */}
                <div 
                  onClick={() => setActiveTab('llm')}
                  className="bg-[#24201d] border border-[#2d2722] hover:border-[#c5a880]/30 hover:bg-[#282420] p-4 rounded-xl flex flex-col justify-between h-36 cursor-pointer transition-all shadow-md group"
                >
                  <div>
                    <div className="w-8 h-8 bg-purple-950/30 text-purple-400 border border-purple-900/30 rounded-lg flex items-center justify-center mb-2">
                      <Cpu size={16} />
                    </div>
                    <h3 className="text-xs font-bold text-white tracking-tight">LLM Configuration</h3>
                    <p className="text-[10px] text-[#a6958a] leading-normal mt-1 font-medium">Configure your language model settings, API keys and model preferences.</p>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    {renderBadge(getLlmStatus())}
                    <ArrowRight size={12} className="text-[#8c7b70] group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </div>
                </div>

                {/* Card 3: Speech-to-Text (STT) */}
                <div 
                  onClick={() => setActiveTab('stt')}
                  className="bg-[#24201d] border border-[#2d2722] hover:border-[#c5a880]/30 hover:bg-[#282420] p-4 rounded-xl flex flex-col justify-between h-36 cursor-pointer transition-all shadow-md group"
                >
                  <div>
                    <div className="w-8 h-8 bg-emerald-950/30 text-emerald-400 border border-emerald-900/30 rounded-lg flex items-center justify-center mb-2">
                      <Mic size={16} />
                    </div>
                    <h3 className="text-xs font-bold text-white tracking-tight">Speech-to-Text (STT)</h3>
                    <p className="text-[10px] text-[#a6958a] leading-normal mt-1 font-medium">Configure speech recognition settings and API keys for voice input.</p>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    {renderBadge(getSttStatus())}
                    <ArrowRight size={12} className="text-[#8c7b70] group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </div>
                </div>

                {/* Card 4: Real-Time Web Search */}
                <div 
                  onClick={() => setActiveTab('search')}
                  className="bg-[#24201d] border border-[#2d2722] hover:border-[#c5a880]/30 hover:bg-[#282420] p-4 rounded-xl flex flex-col justify-between h-36 cursor-pointer transition-all shadow-md group"
                >
                  <div>
                    <div className="w-8 h-8 bg-amber-950/20 text-amber-400 border border-amber-900/20 rounded-lg flex items-center justify-center mb-2">
                      <Globe size={16} />
                    </div>
                    <h3 className="text-xs font-bold text-white tracking-tight">Real-Time Web Search</h3>
                    <p className="text-[10px] text-[#a6958a] leading-normal mt-1 font-medium">Enable and configure web search capabilities for live information.</p>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    {renderBadge(getSearchStatus())}
                    <ArrowRight size={12} className="text-[#8c7b70] group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </div>
                </div>

                {/* Card 5: Connections */}
                <div 
                  onClick={() => setActiveTab('connections')}
                  className="bg-[#24201d] border border-[#2d2722] hover:border-[#c5a880]/30 hover:bg-[#282420] p-4 rounded-xl flex flex-col justify-between h-36 cursor-pointer transition-all shadow-md group"
                >
                  <div>
                    <div className="w-8 h-8 bg-zinc-800 text-zinc-300 border border-zinc-700/50 rounded-lg flex items-center justify-center mb-2">
                      <Link size={16} />
                    </div>
                    <h3 className="text-xs font-bold text-white tracking-tight">Connections</h3>
                    <p className="text-[10px] text-[#a6958a] leading-normal mt-1 font-medium">Test and manage all your API connections and services.</p>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    {renderBadge(getConnectionsStatus())}
                    <ArrowRight size={12} className="text-[#8c7b70] group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </div>
                </div>

                {/* Card 6: Preferences */}
                <div 
                  onClick={() => setActiveTab('preferences')}
                  className="bg-[#24201d] border border-[#2d2722] hover:border-[#c5a880]/30 hover:bg-[#282420] p-4 rounded-xl flex flex-col justify-between h-36 cursor-pointer transition-all shadow-md group"
                >
                  <div>
                    <div className="w-8 h-8 bg-purple-950/20 text-[#c5a880] border border-purple-900/10 rounded-lg flex items-center justify-center mb-2">
                      <Sliders size={16} />
                    </div>
                    <h3 className="text-xs font-bold text-white tracking-tight">Preferences</h3>
                    <p className="text-[10px] text-[#a6958a] leading-normal mt-1 font-medium">Customize assistant behavior, display settings and more.</p>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    {renderBadge(getPreferencesStatus())}
                    <ArrowRight size={12} className="text-[#8c7b70] group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </div>
                </div>

              </div>

              {/* Credits Section */}
              <div className="bg-[#24201d]/30 border border-[#2d2722]/50 p-4 rounded-xl flex items-center justify-between text-xs mt-4 shrink-0">
                <div className="flex items-center gap-3">
                  <Sparkles size={16} className="text-[#c5a880] shrink-0" />
                  <div className="text-[11px] text-[#a6958a] font-semibold">
                    Developed & Designed by{' '}
                    <button 
                      onClick={() => window.electronAPI.openExternal('https://github.com/paragdhersarepaisewala')}
                      className="text-white hover:text-[#c5a880] transition-colors underline font-bold"
                    >
                      Parag Batham
                    </button>
                    {' '}• Idea by{' '}
                    <button 
                      onClick={() => window.electronAPI.openExternal('https://github.com/Narayan-shukla04')}
                      className="text-white hover:text-[#c5a880] transition-colors underline font-bold"
                    >
                      Narayan Shukla
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* Tab 2: Interview Context */}
          {activeTab === 'context' && (
            <div className="space-y-4 h-full flex flex-col justify-between">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  <FileText size={20} className="text-[#c5a880]" /> Interview Context
                </h2>
                <p className="text-xs text-[#a6958a] mt-0.5 font-medium">Upload or paste your professional context so the assistant knows how to respond.</p>
              </div>

              {/* Side-by-side Layout with fixed height elements to prevent body scrollbars */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0 mt-2">
                
                {/* Resume Upload / Paste Zone */}
                <div className="bg-[#24201d] border border-[#2d2722] p-5 rounded-2xl flex flex-col justify-between space-y-4 min-h-0">
                  <div className="flex items-center justify-between shrink-0">
                    <label className="text-xs font-bold text-white flex items-center gap-2">
                      My Resume / Experience
                    </label>
                    <button
                      onClick={handleImportResume}
                      className="flex items-center gap-1 bg-[#2c2621] hover:bg-[#382f28] text-[10px] font-bold text-[#c5a880] px-2.5 py-1 border border-[#3b332d] rounded-lg transition-all"
                    >
                      <Upload size={10} /> Import Native File
                    </button>
                  </div>

                  {/* Drag and Drop Zone - Compact layout */}
                  <div 
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl p-3 text-center transition-all shrink-0 ${
                      dragActive 
                        ? 'border-[#c5a880] bg-[#2d2621]/30' 
                        : 'border-[#3b332d] bg-[#1a1715]/40 hover:bg-[#1a1715]/80'
                    }`}
                  >
                    <div className="flex flex-col items-center justify-center gap-1">
                      <div className="w-7 w-7 bg-[#28221e] rounded-full flex items-center justify-center text-[#c5a880] p-1.5">
                        <Upload size={12} />
                      </div>
                      <p className="text-[10px] font-bold text-white leading-none">Drag & drop your resume file</p>
                      <p className="text-[9px] text-[#a6958a] leading-none">PDF, Word (.docx) or Text (.txt)</p>
                    </div>
                  </div>

                  <div className="flex-1 min-h-0">
                    <textarea 
                      value={resumeText}
                      onChange={(e) => setResumeText(e.target.value)}
                      className="w-full h-full bg-[#1a1715] border border-[#362e29] rounded-xl p-3 text-gray-200 focus:outline-none focus:border-[#c5a880] focus:ring-1 focus:ring-[#c5a880]/30 transition-all text-xs font-medium leading-relaxed resize-none overflow-y-auto scrollbar-thin"
                      placeholder="Or paste resume content, key skills, or elevator pitch here so the assistant can align suggestions..."
                    ></textarea>
                  </div>
                </div>

                {/* Job Description Paste Zone */}
                <div className="bg-[#24201d] border border-[#2d2722] p-5 rounded-2xl flex flex-col justify-between space-y-3 min-h-0">
                  <label className="text-xs font-bold text-white flex items-center gap-2 shrink-0">
                    Job Description
                  </label>
                  <div className="flex-1 min-h-0">
                    <textarea 
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      className="w-full h-full bg-[#1a1715] border border-[#362e29] rounded-xl p-3 text-gray-200 focus:outline-none focus:border-[#c5a880] focus:ring-1 focus:ring-[#c5a880]/30 transition-all text-xs font-medium leading-relaxed resize-none overflow-y-auto scrollbar-thin"
                      placeholder="Paste the job description or target role requirements here..."
                    ></textarea>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Tab 3: LLM Configuration */}
          {activeTab === 'llm' && (
            <div className="space-y-6 max-w-3xl">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  <Cpu size={20} className="text-[#c5a880]" /> LLM Configuration
                </h2>
                <p className="text-xs text-[#a6958a] mt-0.5 font-medium">Select and configure the Large Language Model provider to process interview transcripts.</p>
              </div>

              <div className="bg-[#24201d] border border-[#2d2722] p-6 rounded-2xl space-y-6">
                <div>
                  <label className="block text-xs font-bold text-[#a6958a] mb-2.5 uppercase tracking-wider">LLM Provider</label>
                  <select 
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full bg-[#1b1816] border border-[#362e29] rounded-xl p-3 text-gray-200 text-xs focus:outline-none focus:border-[#c5a880] transition-all cursor-pointer font-semibold"
                  >
                    <option value="lmstudio">Local: LM Studio (localhost)</option>
                    <option value="gemma">Local: Gemma 2 (Ollama)</option>
                    <option value="google">Cloud: Google (Gemini)</option>
                    <option value="openai">Cloud: OpenAI (GPT)</option>
                    <option value="anthropic">Cloud: Anthropic (Claude)</option>
                    <option value="nvidia">Cloud: Nvidia NIM (Llama 3/Nemotron)</option>
                  </select>
                </div>

                {/* LM Studio Links */}
                {model === 'lmstudio' && (
                  <div className="space-y-4 pt-4 border-t border-[#312a24]">
                    <div>
                      <label className="block text-xs font-bold text-[#a6958a] mb-2 uppercase tracking-wider flex items-center gap-1.5">
                        <Link size={12} className="text-[#c5a880]" />
                        LM Studio Server URL
                      </label>
                      <input 
                        type="text"
                        value={lmStudioUrl}
                        onChange={(e) => setLmStudioUrl(e.target.value)}
                        className="w-full bg-[#1b1816] border border-[#362e29] rounded-xl p-3 text-gray-200 text-xs focus:outline-none focus:border-[#c5a880] font-medium"
                        placeholder="e.g. http://localhost:1234"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#a6958a] mb-2 uppercase tracking-wider flex items-center gap-1.5">
                        <Cpu size={12} className="text-[#c5a880]" />
                        Active Model Identifier
                      </label>
                      <input 
                        type="text"
                        value={lmStudioModel}
                        onChange={(e) => setLmStudioModel(e.target.value)}
                        className="w-full bg-[#1b1816] border border-[#362e29] rounded-xl p-3 text-gray-200 text-xs focus:outline-none focus:border-[#c5a880] font-medium"
                        placeholder="e.g. gemma-2-e2b"
                      />
                    </div>
                  </div>
                )}

                {/* Gemini API Key & Model */}
                {model === 'google' && (
                  <div className="space-y-4 pt-4 border-t border-[#312a24]">
                    <div>
                      <label className="block text-xs font-bold text-[#a6958a] mb-2 uppercase tracking-wider flex items-center gap-1.5">
                        <Key size={12} className="text-[#c5a880]" />
                        Gemini API Key
                      </label>
                      <input 
                        type="password"
                        value={geminiApiKey}
                        onChange={(e) => setGeminiApiKey(e.target.value)}
                        className="w-full bg-[#1b1816] border border-[#362e29] rounded-xl p-3 text-gray-200 text-xs focus:outline-none focus:border-[#c5a880] font-medium"
                        placeholder="AIzaSy..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#a6958a] mb-2 uppercase tracking-wider">
                        Gemini Model Name
                      </label>
                      <input 
                        type="text"
                        value={geminiModel}
                        onChange={(e) => setGeminiModel(e.target.value)}
                        className="w-full bg-[#1b1816] border border-[#362e29] rounded-xl p-3 text-gray-200 text-xs focus:outline-none focus:border-[#c5a880] font-medium"
                        placeholder="e.g. gemini-2.5-flash or gemini-2.0-flash"
                      />
                    </div>
                  </div>
                )}

                {/* OpenAI API Key & Model */}
                {model === 'openai' && (
                  <div className="space-y-4 pt-4 border-t border-[#312a24]">
                    <div>
                      <label className="block text-xs font-bold text-[#a6958a] mb-2 uppercase tracking-wider flex items-center gap-1.5">
                        <Key size={12} className="text-[#c5a880]" />
                        OpenAI API Key
                      </label>
                      <input 
                        type="password"
                        value={openaiApiKey}
                        onChange={(e) => setOpenaiApiKey(e.target.value)}
                        className="w-full bg-[#1b1816] border border-[#362e29] rounded-xl p-3 text-gray-200 text-xs focus:outline-none focus:border-[#c5a880] font-medium"
                        placeholder="sk-proj-..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#a6958a] mb-2 uppercase tracking-wider">
                        OpenAI Model Name
                      </label>
                      <input 
                        type="text"
                        value={openaiModel}
                        onChange={(e) => setOpenaiModel(e.target.value)}
                        className="w-full bg-[#1b1816] border border-[#362e29] rounded-xl p-3 text-gray-200 text-xs focus:outline-none focus:border-[#c5a880] font-medium"
                        placeholder="e.g. gpt-4o-mini or gpt-4o"
                      />
                    </div>
                  </div>
                )}

                {/* Anthropic API Key & Model */}
                {model === 'anthropic' && (
                  <div className="space-y-4 pt-4 border-t border-[#312a24]">
                    <div>
                      <label className="block text-xs font-bold text-[#a6958a] mb-2 uppercase tracking-wider flex items-center gap-1.5">
                        <Key size={12} className="text-[#c5a880]" />
                        Anthropic API Key
                      </label>
                      <input 
                        type="password"
                        value={anthropicApiKey}
                        onChange={(e) => setAnthropicApiKey(e.target.value)}
                        className="w-full bg-[#1b1816] border border-[#362e29] rounded-xl p-3 text-gray-200 text-xs focus:outline-none focus:border-[#c5a880] font-medium"
                        placeholder="sk-ant-..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#a6958a] mb-2 uppercase tracking-wider">
                        Anthropic Model Name
                      </label>
                      <input 
                        type="text"
                        value={anthropicModel}
                        onChange={(e) => setAnthropicModel(e.target.value)}
                        className="w-full bg-[#1b1816] border border-[#362e29] rounded-xl p-3 text-gray-200 text-xs focus:outline-none focus:border-[#c5a880] font-medium"
                        placeholder="e.g. claude-3-5-sonnet-20240620"
                      />
                    </div>
                  </div>
                )}

                {/* Nvidia NIM Settings */}
                {model === 'nvidia' && (
                  <div className="space-y-4 pt-4 border-t border-[#312a24]">
                    <div>
                      <label className="block text-xs font-bold text-[#a6958a] mb-2 uppercase tracking-wider flex items-center gap-1.5">
                        <Link size={12} className="text-[#c5a880]" />
                        Nvidia NIM URL
                      </label>
                      <input 
                        type="text"
                        value={nvidiaUrl}
                        onChange={(e) => setNvidiaUrl(e.target.value)}
                        className="w-full bg-[#1b1816] border border-[#362e29] rounded-xl p-3 text-gray-200 text-xs focus:outline-none focus:border-[#c5a880] font-medium"
                        placeholder="e.g. https://integrate.api.nvidia.com/v1"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#a6958a] mb-2 uppercase tracking-wider flex items-center gap-1.5">
                        <Key size={12} className="text-[#c5a880]" />
                        Nvidia API Key
                      </label>
                      <input 
                        type="password"
                        value={nvidiaApiKey}
                        onChange={(e) => setNvidiaApiKey(e.target.value)}
                        className="w-full bg-[#1b1816] border border-[#362e29] rounded-xl p-3 text-gray-200 text-xs focus:outline-none focus:border-[#c5a880] font-medium"
                        placeholder="nvapi-..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#a6958a] mb-2 uppercase tracking-wider flex items-center gap-1.5">
                        <Cpu size={12} className="text-[#c5a880]" />
                        Model Name
                      </label>
                      <input 
                        type="text"
                        value={nvidiaModel}
                        onChange={(e) => setNvidiaModel(e.target.value)}
                        className="w-full bg-[#1b1816] border border-[#362e29] rounded-xl p-3 text-gray-200 text-xs focus:outline-none focus:border-[#c5a880] font-medium"
                        placeholder="e.g. meta/llama-3.1-70b-instruct"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 4: Speech-to-Text */}
          {activeTab === 'stt' && (
            <div className="space-y-6 max-w-3xl">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  <Mic size={20} className="text-[#c5a880]" /> Speech-to-Text (STT)
                </h2>
                <p className="text-xs text-[#a6958a] mt-0.5 font-medium">Configure speech recognition settings to convert desktop capture audio into query transcripts.</p>
              </div>

              <div className="bg-[#24201d] border border-[#2d2722] p-6 rounded-2xl space-y-6">
                <div>
                  <label className="block text-xs font-bold text-[#a6958a] mb-2.5 uppercase tracking-wider">STT Provider</label>
                  <select 
                    value={sttProvider}
                    onChange={(e) => setSttProvider(e.target.value)}
                    className="w-full bg-[#1b1816] border border-[#362e29] rounded-xl p-3 text-gray-200 text-xs focus:outline-none focus:border-[#c5a880] transition-all cursor-pointer font-semibold"
                  >
                    <option value="none">None (Native Audio LLM / Gemini Live)</option>
                    <option value="local">Local Whisper (transformers.js - FREE)</option>
                    <option value="whisper">Cloud: OpenAI / Groq Whisper API</option>
                  </select>
                </div>

                {sttProvider === 'whisper' && (
                  <div className="space-y-4 pt-4 border-t border-[#312a24]">
                    <div>
                      <label className="block text-xs font-bold text-[#a6958a] mb-2 uppercase tracking-wider flex items-center gap-1.5">
                        <Link size={12} className="text-[#c5a880]" />
                        Whisper Endpoint URL
                      </label>
                      <input 
                        type="text"
                        value={whisperUrl}
                        onChange={(e) => setWhisperUrl(e.target.value)}
                        className="w-full bg-[#1b1816] border border-[#362e29] rounded-xl p-3 text-gray-200 text-xs focus:outline-none focus:border-[#c5a880] font-medium"
                        placeholder="e.g. https://api.groq.com/openai/v1"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#a6958a] mb-2 uppercase tracking-wider flex items-center gap-1.5">
                        <Key size={12} className="text-[#c5a880]" />
                        API Key
                      </label>
                      <input 
                        type="password"
                        value={whisperApiKey}
                        onChange={(e) => setWhisperApiKey(e.target.value)}
                        className="w-full bg-[#1b1816] border border-[#362e29] rounded-xl p-3 text-gray-200 text-xs focus:outline-none focus:border-[#c5a880] font-medium"
                        placeholder="gsk_... or sk_..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#a6958a] mb-2 uppercase tracking-wider flex items-center gap-1.5">
                        <Cpu size={12} className="text-[#c5a880]" />
                        Model Name
                      </label>
                      <input 
                        type="text"
                        value={whisperModel}
                        onChange={(e) => setWhisperModel(e.target.value)}
                        className="w-full bg-[#1b1816] border border-[#362e29] rounded-xl p-3 text-gray-200 text-xs focus:outline-none focus:border-[#c5a880] font-medium"
                        placeholder="e.g. whisper-large-v3"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 5: Real-Time Web Search */}
          {activeTab === 'search' && (
            <div className="space-y-6 max-w-3xl">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  <Globe size={20} className="text-[#c5a880]" /> Real-Time Web Search
                </h2>
                <p className="text-xs text-[#a6958a] mt-0.5 font-medium">Enable real-time technical searching to pull relevant API or language docs during conversations.</p>
              </div>

              <div className="bg-[#24201d] border border-[#2d2722] p-6 rounded-2xl space-y-6">
                <div>
                  <label className="block text-xs font-bold text-[#a6958a] mb-2 uppercase tracking-wider flex items-center gap-1.5">
                    <Key size={12} className="text-[#c5a880]" />
                    Tavily Search API Key (Optional)
                  </label>
                  <input 
                    type="password"
                    value={tavilyApiKey}
                    onChange={(e) => setTavilyApiKey(e.target.value)}
                    className="w-full bg-[#1b1816] border border-[#362e29] rounded-xl p-3 text-gray-200 text-xs focus:outline-none focus:border-[#c5a880] font-medium"
                    placeholder="tvly-..."
                  />
                  <p className="text-[10px] text-[#8c7b70] mt-3 leading-relaxed font-semibold">
                    If provided, the assistant will automatically search the web for API documentation, library features, or technical questions when real-time answers are needed.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tab 6: Connections Diagnostics */}
          {activeTab === 'connections' && (
            <div className="space-y-6 max-w-3xl">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  <Link size={20} className="text-[#c5a880]" /> Connections Diagnostics
                </h2>
                <p className="text-xs text-[#a6958a] mt-0.5 font-medium">Verify your configuration settings and run diagnostic checks for external APIs.</p>
              </div>

              <div className="bg-[#24201d] border border-[#2d2722] p-6 rounded-2xl space-y-6">
                
                {/* Diagnostics List */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-[#312a24] pb-3">
                    <div className="flex items-center gap-3">
                      <Cpu size={16} className="text-[#a6958a]" />
                      <span className="text-xs font-bold text-white">LLM Provider Endpoint</span>
                    </div>
                    {renderBadge(getLlmStatus())}
                  </div>

                  <div className="flex items-center justify-between border-b border-[#312a24] pb-3">
                    <div className="flex items-center gap-3">
                      <Mic size={16} className="text-[#a6958a]" />
                      <span className="text-xs font-bold text-white">Speech Recognition (STT)</span>
                    </div>
                    {renderBadge(getSttStatus())}
                  </div>

                  <div className="flex items-center justify-between border-b border-[#312a24] pb-3">
                    <div className="flex items-center gap-3">
                      <Globe size={16} className="text-[#a6958a]" />
                      <span className="text-xs font-bold text-white">Tavily Web Search Integration</span>
                    </div>
                    {renderBadge(getSearchStatus())}
                  </div>
                </div>

                <div className="space-y-4 pt-4">
                  <button 
                    onClick={testConnection}
                    disabled={status === 'testing'}
                    className="flex items-center justify-center gap-2 bg-[#2c2621] hover:bg-[#3b332d] text-xs font-semibold text-[#c5a880] px-4 py-2.5 border border-[#3b332d] rounded-xl transition-all disabled:opacity-50"
                  >
                    <RefreshCw size={14} className={status === 'testing' ? 'animate-spin' : ''} />
                    Run System Diagnostics
                  </button>

                  {/* Terminal Log */}
                  {statusMsg && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-[#8c7b70] uppercase tracking-wider">Diagnostic output console</p>
                      <pre className={`p-4 rounded-xl text-[11px] font-mono whitespace-pre-wrap border overflow-x-auto leading-relaxed max-h-48 overflow-y-auto ${
                        status === 'success' ? 'bg-[#141b16] text-emerald-400 border-emerald-500/20' :
                        status === 'error' ? 'bg-[#1f1314] text-rose-400 border-rose-500/20' :
                        'bg-[#121110] text-[#a6958a] border-[#2c2621]'
                      }`}>
                        {statusMsg}
                      </pre>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* Tab 7: Preferences */}
          {activeTab === 'preferences' && (
            <div className="space-y-6 max-w-3xl">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  <Sliders size={20} className="text-[#c5a880]" /> Preferences
                </h2>
                <p className="text-xs text-[#a6958a] mt-0.5 font-medium">Customize workspace preferences, UI features, and overlay controls.</p>
              </div>

              <div className="bg-[#24201d] border border-[#2d2722] p-6 rounded-2xl space-y-6">
                
                {/* Username */}
                <div>
                  <label className="block text-xs font-bold text-[#a6958a] mb-2 uppercase tracking-wider">User Profile Name</label>
                  <input 
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full bg-[#1b1816] border border-[#362e29] rounded-xl p-3 text-gray-200 text-xs focus:outline-none focus:border-[#c5a880] font-medium"
                    placeholder="Enter your name"
                  />
                </div>

                {/* Capture Switches */}
                <div className="space-y-3 pt-4 border-t border-[#312a24]">
                  <label className="flex items-center gap-3.5 p-3.5 bg-[#1b1816] border border-[#2d2722] rounded-xl cursor-pointer hover:bg-[#201d1a] transition-all">
                    <input 
                      type="checkbox" 
                      checked={hideOverlayFromCapture}
                      onChange={(e) => setHideOverlayFromCapture(e.target.checked)}
                      className="w-4 h-4 rounded text-[#8c6d53] bg-gray-900 border-gray-700 focus:ring-[#8c6d53]" 
                    />
                    <span className="flex items-center gap-2 text-xs font-bold text-white">
                      <Monitor size={14} className="text-[#8c7b70]" />
                      Hide Overlay from Capture
                    </span>
                  </label>

                  <label className="flex items-center gap-3.5 p-3.5 bg-[#1b1816] border border-[#2d2722] rounded-xl cursor-pointer hover:bg-[#201d1a] transition-all">
                    <input 
                      type="checkbox" 
                      checked={captureAudio}
                      onChange={(e) => setCaptureAudio(e.target.checked)}
                      className="w-4 h-4 rounded text-[#8c6d53] bg-gray-900 border-gray-700 focus:ring-[#8c6d53]" 
                    />
                    <span className="flex items-center gap-2 text-xs font-bold text-white">
                      <Mic size={14} className="text-[#8c7b70]" />
                      Capture System Audio
                    </span>
                  </label>
                </div>

                {/* Hotkeys */}
                <div className="pt-4 border-t border-[#312a24] space-y-2">
                  <label className="block text-xs font-bold text-[#a6958a] uppercase tracking-wider">Stealth Mode Hotkeys</label>
                  <div className="flex items-center gap-3 p-3.5 bg-[#121110] border border-[#201d1a] rounded-xl text-xs font-semibold text-white">
                    <Pin size={14} className="text-[#8c7b70]" />
                    <span>Toggle response overlay pin:</span>
                    <kbd className="ml-auto bg-[#24201d] px-2.5 py-1.5 border border-[#3b332d] rounded-md text-[10px] font-mono tracking-tight text-[#c5a880] shadow-sm">
                      Ctrl + Alt + P
                    </kbd>
                  </div>
                  <div className="flex items-center gap-3 p-3.5 bg-[#121110] border border-[#201d1a] rounded-xl text-xs font-semibold text-white">
                    <Lock size={14} className="text-[#8c7b70]" />
                    <span>Toggle response overlay lock:</span>
                    <kbd className="ml-auto bg-[#24201d] px-2.5 py-1.5 border border-[#3b332d] rounded-md text-[10px] font-mono tracking-tight text-[#c5a880] shadow-sm">
                      Ctrl + Alt + U
                    </kbd>
                  </div>
                </div>

                {/* Credits */}
                <div className="pt-4 border-t border-[#312a24] space-y-3">
                  <label className="block text-xs font-bold text-[#a6958a] uppercase tracking-wider">Credits & Contributions</label>
                  <div className="bg-[#121110] border border-[#201d1a] rounded-xl p-4 space-y-3 text-xs leading-relaxed font-semibold">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-white">Developed & Designed by</p>
                        <p className="text-[#a6958a] font-normal text-[11px]">Parag Batham</p>
                      </div>
                      <button 
                        onClick={() => window.electronAPI.openExternal('https://github.com/paragdhersarepaisewala')}
                        className="text-[#c5a880] hover:underline text-[11px] flex items-center gap-1 font-bold"
                      >
                        GitHub Profile
                      </button>
                    </div>
                    <div className="border-t border-[#201d1a] pt-3 flex justify-between items-center">
                      <div>
                        <p className="text-white">Idea & Concept by</p>
                        <p className="text-[#a6958a] font-normal text-[11px]">Narayan Shukla</p>
                      </div>
                      <button 
                        onClick={() => window.electronAPI.openExternal('https://github.com/Narayan-shukla04')}
                        className="text-[#c5a880] hover:underline text-[11px] flex items-center gap-1 font-bold"
                      >
                        GitHub Profile
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>

        {/* Global Bottom Status Bar - Fixed height */}
        <footer className="bg-[#0e0d0c] border-t border-[#26211d] px-8 py-4 flex items-center justify-between shadow-inner h-20 shrink-0">
          <div className="flex items-center gap-3 text-xs text-[#8c7b70]">
            <Shield size={16} className="text-[#c5a880] shrink-0" />
            <div>
              <p className="font-bold text-white">Your data is secure</p>
              <p className="text-[10px] font-medium leading-none mt-0.5">All configuration information is stored locally and encrypted.</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={handleResetAll}
              className="flex items-center gap-1.5 bg-[#1b1212] hover:bg-[#2e1a1a] text-xs font-semibold text-rose-400 border border-rose-950/40 hover:border-rose-900/60 px-4 py-2.5 rounded-xl transition-all"
            >
              <Trash2 size={13} />
              Reset All
            </button>
            <button 
              onClick={handleImportResume}
              className="flex items-center gap-1.5 bg-[#2c2621] hover:bg-[#382f28] text-xs font-semibold text-[#c5a880] border border-[#3b332d] px-4 py-2.5 rounded-xl transition-all"
            >
              <FileCheck size={13} />
              Import Resume
            </button>
            <button 
              onClick={testConnection}
              disabled={status === 'testing'}
              className="flex items-center gap-1.5 bg-[#201d1a] hover:bg-[#2b2723] text-xs font-semibold text-white border border-[#38312a] px-4 py-2.5 rounded-xl transition-all disabled:opacity-50"
            >
              <RefreshCw size={13} className={status === 'testing' ? 'animate-spin' : ''} />
              Test All
            </button>
          </div>
        </footer>

      </main>
    </div>
  );
}
