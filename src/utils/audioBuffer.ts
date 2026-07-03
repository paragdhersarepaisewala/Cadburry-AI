import { encodeWAV } from './wavEncoder';

export class SlidingAudioBuffer {
  private buffer: Float32Array = new Float32Array(0);
  private maxSamples: number;
  private sampleRate: number;

  constructor(maxDurationSeconds: number = 20, sampleRate: number = 16000) {
    this.sampleRate = sampleRate;
    this.maxSamples = maxDurationSeconds * sampleRate;
  }

  /**
   * Appends new float32 samples to the sliding buffer.
   */
  append(newSamples: Float32Array) {
    const combined = new Float32Array(this.buffer.length + newSamples.length);
    combined.set(this.buffer);
    combined.set(newSamples, this.buffer.length);

    if (combined.length > this.maxSamples) {
      // Slice from the end (sliding window)
      this.buffer = combined.slice(combined.length - this.maxSamples);
    } else {
      this.buffer = combined;
    }
  }

  /**
   * Encodes the current sliding buffer as a WAV Blob.
   */
  getWavBlob(): Blob {
    return encodeWAV(this.buffer, this.sampleRate);
  }

  /**
   * Returns the raw Float32Array samples of the current buffer.
   */
  getRawSamples(): Float32Array {
    return this.buffer;
  }

  /**
   * Resets the buffer.
   */
  clear() {
    this.buffer = new Float32Array(0);
  }

  isEmpty(): boolean {
    return this.buffer.length === 0;
  }
}
