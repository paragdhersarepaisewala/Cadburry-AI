import React, { useState, useEffect } from 'react';
import { Settings, FileText, Mic, Play, Monitor, Link, Cpu, Key, MessageSquare, Globe } from 'lucide-react';

export default function Dashboard() {
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

  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [statusMsg, setStatusMsg] = useState('');
  const [isLocked, setIsLocked] = useState(false);

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
  }, [
    model, lmStudioUrl, lmStudioModel, geminiApiKey, geminiModel, openaiApiKey, openaiModel, 
    anthropicApiKey, anthropicModel, nvidiaApiKey, nvidiaUrl, nvidiaModel, tavilyApiKey, resumeText, jobDescription, 
    sttProvider, whisperUrl, whisperApiKey, whisperModel
  ]);

  const handleStart = () => {
    if (window.electronAPI) {
      window.electronAPI.startStealthMode();
    } else {
      console.warn('Electron API not available');
    }
  };

  const testConnection = async () => {
    setStatus('testing');
    setStatusMsg('Testing connection...');
    try {
      if (window.electronAPI && window.electronAPI.testConnection) {
        let result = '';
        if (model === 'lmstudio') {
          result = await window.electronAPI.testConnection('lmstudio', lmStudioUrl, '');
        } else if (model === 'gemma') {
          result = await window.electronAPI.testConnection('gemma', '', '');
        } else if (model === 'google') {
          result = await window.electronAPI.testConnection('google', '', geminiApiKey, geminiModel);
        } else if (model === 'openai') {
          result = await window.electronAPI.testConnection('openai', '', openaiApiKey, openaiModel);
        } else if (model === 'anthropic') {
          result = await window.electronAPI.testConnection('anthropic', '', anthropicApiKey, anthropicModel);
        } else if (model === 'nvidia') {
          result = await window.electronAPI.testConnection('nvidia', nvidiaUrl, nvidiaApiKey, nvidiaModel);
        }
        
        // Also test STT connection if configured
        if (sttProvider === 'whisper') {
          result += '\n[STT Test] Testing Whisper API...';
          const sttRes = await window.electronAPI.testConnection('whisper', whisperUrl, whisperApiKey);
          result += `\n[STT Test] ${sttRes}`;
        }

        // Also test Tavily Search if configured
        if (tavilyApiKey) {
          result += '\n[Search Test] Testing Tavily Search...';
          const searchRes = await window.electronAPI.testConnection('tavily', '', tavilyApiKey);
          result += `\n[Search Test] ${searchRes}`;
        }
        
        setStatus('success');
        setStatusMsg(result);
      } else {
        throw new Error('Electron API not available');
      }
    } catch (err: any) {
      setStatus('error');
      setStatusMsg(`Connection failed: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex p-8">
      <div className="max-w-5xl mx-auto w-full space-y-8">
        
        {/* Header */}
        <header className="flex justify-between items-center bg-gray-900 p-6 rounded-2xl border border-gray-800 shadow-xl">
          <div>
            <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 text-transparent bg-clip-text">
              Hidden Interview Assistant
            </h1>
            <p className="text-gray-400 mt-2">Real-time LLM support for your interviews</p>
          </div>
          <div className="flex gap-4">
            {isLocked && (
              <button 
                onClick={() => {
                  console.log('Dashboard: Unlock Overlay clicked, invoking window.electronAPI.unlockStealthWindow()');
                  window.electronAPI.unlockStealthWindow();
                }}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 transition-colors px-6 py-3 rounded-xl font-bold shadow-md"
              >
                Unlock Overlay
              </button>
            )}
            <button 
              onClick={handleStart}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 transition-colors px-6 py-3 rounded-xl font-bold shadow-[0_0_20px_rgba(79,70,229,0.3)]"
            >
              <Play size={20} />
              Start Assistant
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Context Input */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 space-y-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <FileText className="text-blue-400" />
                Interview Context
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">My Resume / Experience</label>
                  <textarea 
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    className="w-full h-48 bg-gray-800 border border-gray-700 rounded-xl p-4 text-gray-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
                    placeholder="Paste your resume content, key skills, or elevator pitch here so the assistant can align suggestions..."
                  ></textarea>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Job Description</label>
                  <textarea 
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    className="w-full h-48 bg-gray-800 border border-gray-700 rounded-xl p-4 text-gray-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
                    placeholder="Paste the job description or target role requirements here..."
                  ></textarea>
                </div>
              </div>
            </div>
          </div>

          {/* Settings Section */}
          <div className="space-y-8">
            
            {/* LLM Config */}
            <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 space-y-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Settings className="text-purple-400" />
                LLM Configuration
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">LLM Provider</label>
                  <select 
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-gray-200 focus:outline-none focus:border-indigo-500 transition-all appearance-none"
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
                  <div className="space-y-4 pt-2 border-t border-gray-800">
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider flex items-center gap-1">
                        <Link size={12} />
                        LM Studio Server URL
                      </label>
                      <input 
                        type="text"
                        value={lmStudioUrl}
                        onChange={(e) => setLmStudioUrl(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-gray-200 text-sm focus:outline-none focus:border-indigo-500"
                        placeholder="e.g. http://localhost:1234"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider flex items-center gap-1">
                        <Cpu size={12} />
                        Active Model Identifier
                      </label>
                      <input 
                        type="text"
                        value={lmStudioModel}
                        onChange={(e) => setLmStudioModel(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-gray-200 text-sm focus:outline-none focus:border-indigo-500"
                        placeholder="e.g. gemma-2-e2b"
                      />
                    </div>
                  </div>
                )}

                {/* Gemini API Key & Model */}
                {model === 'google' && (
                  <div className="space-y-4 pt-2 border-t border-gray-800">
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                        Gemini API Key
                      </label>
                      <input 
                        type="password"
                        value={geminiApiKey}
                        onChange={(e) => setGeminiApiKey(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-gray-200 text-sm focus:outline-none focus:border-indigo-500"
                        placeholder="AIzaSy..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                        Gemini Model Name
                      </label>
                      <input 
                        type="text"
                        value={geminiModel}
                        onChange={(e) => setGeminiModel(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-gray-200 text-sm focus:outline-none focus:border-indigo-500"
                        placeholder="e.g. gemini-2.5-flash or gemini-2.0-flash"
                      />
                    </div>
                  </div>
                )}

                {/* OpenAI API Key & Model */}
                {model === 'openai' && (
                  <div className="space-y-4 pt-2 border-t border-gray-800">
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                        OpenAI API Key
                      </label>
                      <input 
                        type="password"
                        value={openaiApiKey}
                        onChange={(e) => setOpenaiApiKey(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-gray-200 text-sm focus:outline-none focus:border-indigo-500"
                        placeholder="sk-proj-..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                        OpenAI Model Name
                      </label>
                      <input 
                        type="text"
                        value={openaiModel}
                        onChange={(e) => setOpenaiModel(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-gray-200 text-sm focus:outline-none focus:border-indigo-500"
                        placeholder="e.g. gpt-4o-mini or gpt-4o"
                      />
                    </div>
                  </div>
                )}

                {/* Anthropic API Key & Model */}
                {model === 'anthropic' && (
                  <div className="space-y-4 pt-2 border-t border-gray-800">
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                        Anthropic API Key
                      </label>
                      <input 
                        type="password"
                        value={anthropicApiKey}
                        onChange={(e) => setAnthropicApiKey(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-gray-200 text-sm focus:outline-none focus:border-indigo-500"
                        placeholder="sk-ant-..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                        Anthropic Model Name
                      </label>
                      <input 
                        type="text"
                        value={anthropicModel}
                        onChange={(e) => setAnthropicModel(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-gray-200 text-sm focus:outline-none focus:border-indigo-500"
                        placeholder="e.g. claude-3-5-sonnet-20240620"
                      />
                    </div>
                  </div>
                )}

                {/* Nvidia NIM Settings */}
                {model === 'nvidia' && (
                  <div className="space-y-4 pt-2 border-t border-gray-800">
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider flex items-center gap-1">
                        <Link size={12} />
                        Nvidia NIM URL
                      </label>
                      <input 
                        type="text"
                        value={nvidiaUrl}
                        onChange={(e) => setNvidiaUrl(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-gray-200 text-sm focus:outline-none focus:border-indigo-500"
                        placeholder="e.g. https://integrate.api.nvidia.com/v1"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider flex items-center gap-1">
                        <Key size={12} />
                        Nvidia API Key
                      </label>
                      <input 
                        type="password"
                        value={nvidiaApiKey}
                        onChange={(e) => setNvidiaApiKey(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-gray-200 text-sm focus:outline-none focus:border-indigo-500"
                        placeholder="nvapi-..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider flex items-center gap-1">
                        <Cpu size={12} />
                        Model Name
                      </label>
                      <input 
                        type="text"
                        value={nvidiaModel}
                        onChange={(e) => setNvidiaModel(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-gray-200 text-sm focus:outline-none focus:border-indigo-500"
                        placeholder="e.g. meta/llama-3.1-70b-instruct"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* STT Config */}
            <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 space-y-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <MessageSquare className="text-emerald-400" />
                Speech-to-Text (STT)
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">STT Provider</label>
                  <select 
                    value={sttProvider}
                    onChange={(e) => setSttProvider(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-gray-200 focus:outline-none focus:border-indigo-500 transition-all appearance-none"
                  >
                    <option value="none">None (Native Audio LLM / Gemini)</option>
                    <option value="local">Local Whisper (transformers.js - FREE)</option>
                    <option value="whisper">Cloud: OpenAI / Groq Whisper API</option>
                  </select>
                </div>

                {sttProvider === 'whisper' && (
                  <div className="space-y-4 pt-2 border-t border-gray-800">
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider flex items-center gap-1">
                        <Link size={12} />
                        Whisper Endpoint URL
                      </label>
                      <input 
                        type="text"
                        value={whisperUrl}
                        onChange={(e) => setWhisperUrl(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-gray-200 text-sm focus:outline-none focus:border-indigo-500"
                        placeholder="e.g. https://api.groq.com/openai/v1"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider flex items-center gap-1">
                        <Key size={12} />
                        API Key
                      </label>
                      <input 
                        type="password"
                        value={whisperApiKey}
                        onChange={(e) => setWhisperApiKey(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-gray-200 text-sm focus:outline-none focus:border-indigo-500"
                        placeholder="gsk_... or sk_..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider flex items-center gap-1">
                        <Cpu size={12} />
                        Model Name
                      </label>
                      <input 
                        type="text"
                        value={whisperModel}
                        onChange={(e) => setWhisperModel(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-gray-200 text-sm focus:outline-none focus:border-indigo-500"
                        placeholder="e.g. whisper-large-v3"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Tavily Search Config */}
            <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 space-y-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Globe className="text-blue-400" />
                Real-Time Web Search (RAG)
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                    Tavily Search API Key (Optional)
                  </label>
                  <input 
                    type="password"
                    value={tavilyApiKey}
                    onChange={(e) => setTavilyApiKey(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-gray-200 text-sm focus:outline-none focus:border-indigo-500"
                    placeholder="tvly-..."
                  />
                  <p className="text-[10px] text-gray-500 mt-1.5 leading-relaxed">
                    If provided, the assistant will automatically search the web for technical specifications, latest library releases, or documentation when real-time information is needed.
                  </p>
                </div>
              </div>
            </div>

            {/* Actions & Status */}
            <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 space-y-4">
              <button 
                onClick={testConnection}
                disabled={status === 'testing'}
                className="w-full bg-gray-800 hover:bg-gray-700 text-indigo-400 border border-indigo-500/20 hover:border-indigo-500/50 text-sm font-semibold py-2.5 px-4 rounded-xl transition-all disabled:opacity-50"
              >
                Test Connections
              </button>

              {statusMsg && (
                <div className={`p-3 rounded-xl text-xs font-medium border whitespace-pre-line ${
                  status === 'success' ? 'bg-emerald-950/30 text-emerald-400 border-emerald-500/20' :
                  status === 'error' ? 'bg-rose-950/30 text-rose-400 border-rose-500/20' :
                  'bg-indigo-950/30 text-indigo-400 border-indigo-500/20'
                }`}>
                  {statusMsg}
                </div>
              )}

              <div className="pt-2 border-t border-gray-800 space-y-3">
                <label className="flex items-center gap-3 p-3 bg-gray-800/40 rounded-xl cursor-pointer hover:bg-gray-800/80 transition-colors">
                  <input type="checkbox" className="w-5 h-5 rounded text-indigo-600 bg-gray-700 border-gray-600 focus:ring-indigo-500" defaultChecked />
                  <span className="flex items-center gap-2 text-sm text-gray-300">
                    <Monitor size={16} className="text-gray-400" />
                    Hide Overlay from Capture
                  </span>
                </label>
                <label className="flex items-center gap-3 p-3 bg-gray-800/40 rounded-xl cursor-pointer hover:bg-gray-800/80 transition-colors">
                  <input type="checkbox" className="w-5 h-5 rounded text-indigo-600 bg-gray-700 border-gray-600 focus:ring-indigo-500" defaultChecked />
                  <span className="flex items-center gap-2 text-sm text-gray-300">
                    <Mic size={16} className="text-gray-400" />
                    Capture System Audio & Mic
                  </span>
                </label>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
