export interface APIParams {
  provider: string;
  lmStudioUrl: string;
  lmStudioModel: string;
  geminiApiKey: string;
  openaiApiKey?: string;
  anthropicApiKey?: string;
  resumeText: string;
  jobDescription: string;
  audioBase64: string;
  textTranscript?: string; // Optional: if audio is transcribed to text first
}

export async function transcribeAudio(
  url: string,
  key: string,
  model: string,
  audioBase64: string
): Promise<string> {
  // If the user pasted the complete endpoint (including /audio/transcriptions), use it directly.
  // Otherwise, append /audio/transcriptions to the base URL.
  const cleanUrl = url.trim().replace(/\/$/, '');
  const targetUrl = cleanUrl.endsWith('/audio/transcriptions') 
    ? cleanUrl 
    : `${cleanUrl}/audio/transcriptions`;
  
  // Convert base64 to Blob
  const buffer = Buffer.from(audioBase64, 'base64');
  const blob = new Blob([buffer], { type: 'audio/wav' });
  
  const formData = new FormData();
  formData.append('file', blob, 'audio.wav');
  formData.append('model', model || 'whisper-large-v3');
  
  const response = await fetch(targetUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Whisper STT error: ${response.status} - ${errText}`);
  }

  const data = await response.json() as any;
  return data.text || '';
}

export async function sendAudioToLLM(params: APIParams): Promise<string> {
  const {
    provider,
    lmStudioUrl,
    lmStudioModel,
    geminiApiKey,
    openaiApiKey,
    anthropicApiKey,
    resumeText,
    jobDescription,
    audioBase64,
    textTranscript,
  } = params;

  const promptText = `
You are a hidden real-time interview assistant. Your goal is to help the candidate answer the interviewer's questions confidently, naturally, and professionally.

CONTEXT:
---
JOB DESCRIPTION:
${jobDescription || 'Not provided.'}

CANDIDATE RESUME:
${resumeText || 'Not provided.'}
---

INSTRUCTIONS:
1. Listen to or read the provided interview segment.
2. If the segment is NOT an actual interview question (e.g., it is a greeting like "Hello", small talk, agreements like "mhm", "yes", "okay", or generic feedback like "Thank you", "Great", "Nice"), DO NOT output a SUGGESTED ANSWER. Instead, output:
   - "TRANSCRIBED QUESTION": [The greeting/feedback]
   - "SUGGESTED ANSWER": (Acknowledge and keep talking)
3. If it is an actual interview question, formulate a strong, simplified, and highly conversational response script using the candidate's resume and job description.
4. Rules for "SUGGESTED ANSWER":
   - Write in a natural, conversational, humanized tone.
   - Use simple, everyday language. Avoid robotic, overly formal corporate jargon, and rigid bulleted lists.
   - Write in the first person ("I", "my") so the candidate can read or speak it directly.
   - Keep it concise, engaging, and easy to speak naturally off-the-cuff (2-4 sentences max).
5. Output your answer in exactly this format:
   - "TRANSCRIBED QUESTION": (Summarize the question you heard)
   - "SUGGESTED ANSWER": (The conversational, simple speaking script)
`;

  // Pre-process transcript input. Text models require STT.
  if (provider !== 'google' && !textTranscript) {
    throw new Error(`${provider.toUpperCase()} provider currently requires Speech-to-Text (STT) to be enabled on the dashboard.`);
  }

  // 1. LM Studio
  if (provider === 'lmstudio') {
    const url = `${lmStudioUrl.replace(/\/$/, '')}/chat/completions`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: lmStudioModel || 'google/gemma-4-e2b',
        messages: [
          {
            role: 'system',
            content: promptText,
          },
          {
            role: 'user',
            content: `Conversation Log So Far:\n${textTranscript}`,
          },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`LM Studio error: ${response.status} - ${errText}`);
    }

    const data = await response.json() as any;
    return data.choices?.[0]?.message?.content || 'No suggestion received.';
  } 

  // 2. Ollama (Local Gemma 2)
  if (provider === 'gemma') {
    const response = await fetch('http://localhost:11434/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gemma2',
        messages: [
          {
            role: 'system',
            content: promptText,
          },
          {
            role: 'user',
            content: `Conversation Log So Far:\n${textTranscript}`,
          },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Ollama error: ${response.status} - ${errText}`);
    }

    const data = await response.json() as any;
    return data.choices?.[0]?.message?.content || 'No suggestion received.';
  }

  // 3. OpenAI (GPT-4o)
  if (provider === 'openai') {
    if (!openaiApiKey) {
      throw new Error('OpenAI API Key is missing.');
    }
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: promptText,
          },
          {
            role: 'user',
            content: `Conversation Log So Far:\n${textTranscript}`,
          },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errText}`);
    }

    const data = await response.json() as any;
    return data.choices?.[0]?.message?.content || 'No suggestion received.';
  }

  // 4. Anthropic (Claude 3.5 Sonnet)
  if (provider === 'anthropic') {
    if (!anthropicApiKey) {
      throw new Error('Anthropic API Key is missing.');
    }
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20240620',
        max_tokens: 1024,
        system: promptText,
        messages: [
          {
            role: 'user',
            content: `Conversation Log So Far:\n${textTranscript}`,
          },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Anthropic API error: ${response.status} - ${errText}`);
    }

    const data = await response.json() as any;
    return data.content?.[0]?.text || 'No suggestion received.';
  }
  
  // 5. Gemini 1.5
  if (provider === 'google') {
    if (!geminiApiKey) {
      throw new Error('Gemini API Key is missing.');
    }
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;
    
    const parts: any[] = [];
    if (textTranscript) {
      parts.push({
        text: promptText + `\n\nConversation Log So Far:\n${textTranscript}`,
      });
    } else {
      parts.push({
        text: promptText,
      });
      parts.push({
        inlineData: {
          mimeType: 'audio/wav',
          data: audioBase64,
        },
      });
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: parts,
          },
        ],
        generationConfig: {
          temperature: 0.3,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errText}`);
    }

    const data = await response.json() as any;
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No suggestion received.';
  }

  throw new Error(`Unsupported provider: ${provider}`);
}

export async function testLLMConnection(provider: string, url: string, key: string): Promise<string> {
  if (provider === 'lmstudio') {
    const targetUrl = `${url.replace(/\/$/, '')}/models`;
    const res = await fetch(targetUrl);
    if (!res.ok) {
      throw new Error(`Server returned status ${res.status}`);
    }
    const data = await res.json() as any;
    return `Connected to LM Studio! Found models: ${data.data?.map((m: any) => m.id).join(', ')}`;
  } else if (provider === 'gemma') {
    const res = await fetch('http://localhost:11434/v1/models');
    if (!res.ok) {
      throw new Error('Ollama not running on http://localhost:11434');
    }
    const data = await res.json() as any;
    return `Connected to Ollama! Found models: ${data.data?.map((m: any) => m.id).join(', ')}`;
  } else if (provider === 'openai') {
    if (!key) {
      throw new Error('OpenAI API Key is required.');
    }
    const res = await fetch('https://api.openai.com/v1/models', {
      headers: { 'Authorization': `Bearer ${key}` }
    });
    if (!res.ok) {
      throw new Error('Invalid OpenAI API Key');
    }
    return 'OpenAI API connection verified successfully!';
  } else if (provider === 'anthropic') {
    if (!key) {
      throw new Error('Anthropic API Key is required.');
    }
    // Anthropic doesn't have a simple list models GET endpoint without key headers.
    // We send a dummy message to test authentication.
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20240620',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'test' }]
      })
    });
    if (res.status === 401 || res.status === 403) {
      throw new Error('Invalid Anthropic API Key');
    }
    return 'Anthropic API connection verified successfully!';
  } else if (provider === 'google') {
    if (!key) {
      throw new Error('Gemini API key is required.');
    }
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
    if (!res.ok) {
      throw new Error('Invalid API Key or network error');
    }
    return 'Gemini API Key validated successfully!';
  } else if (provider === 'whisper') {
    if (!key) {
      throw new Error('Whisper API Key is required.');
    }
    let cleanUrl = url.trim().replace(/\/$/, '');
    if (cleanUrl.endsWith('/audio/transcriptions')) {
      cleanUrl = cleanUrl.replace(/\/audio\/transcriptions$/, '');
    }
    const targetUrl = `${cleanUrl}/models`;
    const res = await fetch(targetUrl, {
      headers: { 'Authorization': `Bearer ${key}` }
    });
    if (!res.ok) {
      throw new Error(`Whisper server connection failed: status ${res.status}`);
    }
    return 'Whisper connection validated successfully!';
  }
  return 'Saved provider settings.';
}
