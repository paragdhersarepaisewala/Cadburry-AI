export interface APIParams {
  provider: string;
  lmStudioUrl: string;
  lmStudioModel: string;
  geminiApiKey: string;
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
  const targetUrl = `${url.replace(/\/$/, '')}/audio/transcriptions`;
  
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
    resumeText,
    jobDescription,
    audioBase64,
    textTranscript,
  } = params;

  const promptText = `
You are a hidden real-time interview assistant. Your goal is to help the candidate answer the interviewer's questions confidently and professionally.

CONTEXT:
---
JOB DESCRIPTION:
${jobDescription || 'Not provided.'}

CANDIDATE RESUME:
${resumeText || 'Not provided.'}
---

INSTRUCTIONS:
1. Analyze the interview conversation.
2. Formulate a strong, concise, and structured response using the candidate's resume and job description.
3. Output your answer in two sections:
   - "TRANSCRIBED QUESTION": (What you heard / latest interviewer question)
   - "SUGGESTED ANSWER": (Bullet points or a brief script the candidate can speak naturally)
4. Be concise and speed-focused.
`;

  // If we already have a text transcript (e.g. from Whisper), we pass it as text.
  // Otherwise, we send it as a multimodal audio request.
  const userContent: any[] = [];
  
  if (textTranscript) {
    userContent.push({
      type: 'text',
      text: `Conversation Log So Far:\n${textTranscript}\n\nTask: Formulate the response based on the above instruction.`,
    });
  } else {
    // Multimodal audio request (e.g. Gemini native)
    userContent.push({
      type: 'text',
      text: promptText,
    });
    
    if (provider === 'google') {
      // Handled separately below
    } else {
      // LM Studio (as image_url fallback)
      userContent.push({
        type: 'image_url',
        image_url: {
          url: `data:image/png;base64,${audioBase64}`,
        },
      });
    }
  }

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
            content: textTranscript ? userContent[0].text : userContent,
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
  
  if (provider === 'google') {
    if (!geminiApiKey) {
      throw new Error('Gemini API Key is missing.');
    }
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;
    
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
    // Test Groq / OpenAI Whisper URL
    const targetUrl = `${url.replace(/\/$/, '')}/models`;
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
