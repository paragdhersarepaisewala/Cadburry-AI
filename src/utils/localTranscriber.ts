import { pipeline, env } from '@xenova/transformers';

// Disable local model directory checks for CDN loading
env.allowLocalModels = false;

let transcriber: any = null;
let isInitializing = false;
let initPromise: Promise<any> | null = null;

export async function initLocalWhisper(onProgress?: (progress: string) => void): Promise<any> {
  if (transcriber) return transcriber;
  if (isInitializing && initPromise) return initPromise;

  isInitializing = true;
  initPromise = (async () => {
    try {
      transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny.en', {
        progress_callback: (data: any) => {
          if (data.status === 'progress' && onProgress) {
            onProgress(`Downloading model: ${Math.round(data.progress)}%`);
          } else if (data.status === 'ready' && onProgress) {
            onProgress('Model loaded successfully!');
          }
        }
      });
      return transcriber;
    } catch (err) {
      transcriber = null;
      throw err;
    } finally {
      isInitializing = false;
    }
  })();

  return initPromise;
}

export async function transcribeLocalAudio(samples: Float32Array, onProgress?: (progress: string) => void): Promise<string> {
  const pipe = await initLocalWhisper(onProgress);
  const response = await pipe(samples, {
    chunk_length_s: 30,
    stride_length_s: 5,
    language: 'english',
    task: 'transcribe',
  });
  return response.text || '';
}
