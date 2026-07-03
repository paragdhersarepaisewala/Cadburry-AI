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
