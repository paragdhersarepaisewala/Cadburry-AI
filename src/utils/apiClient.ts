export interface APIParams {
  provider: string;
  lmStudioUrl: string;
  lmStudioModel: string;
  geminiApiKey: string;
  resumeText: string;
  jobDescription: string;
  audioBase64: string;
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
1. Listen to the provided audio (which contains the interview conversation).
2. Transcribe or analyze the latest question from the interviewer.
3. Formulate a strong, concise, and structured response using the candidate's resume and job description.
4. Output your answer in two sections:
   - "TRANSCRIBED QUESTION": (What you heard)
   - "SUGGESTED ANSWER": (Bullet points or a brief script the candidate can speak naturally)
5. Be concise. Only update if a new question or critical follow-up is asked.
`;

  if (provider === 'lmstudio') {
    const url = `${lmStudioUrl.replace(/\/$/, '')}/v1/chat/completions`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: lmStudioModel || 'gemma-2-e2b',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: promptText,
              },
              {
                type: 'input_audio',
                input_audio: {
                  data: audioBase64,
                  format: 'wav',
                },
              },
            ],
          },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`LM Studio error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'No suggestion received.';
  } 
  
  if (provider === 'google') {
    if (!geminiApiKey) {
      throw new Error('Gemini API Key is missing.');
    }
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: promptText,
              },
              {
                inlineData: {
                  mimeType: 'audio/wav',
                  data: audioBase64,
                },
              },
            ],
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

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No suggestion received.';
  }

  throw new Error(`Unsupported provider: ${provider}`);
}
