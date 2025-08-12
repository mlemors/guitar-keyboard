const fft = require('fft-js').fft;
const fftUtil = require('fft-js').util;

class PitchDetector {
    constructor() {
        this.sampleRate = 44100;
        this.bufferSize = 4096;
        this.audioBuffer = [];
        
        // Note frequencies for reference (in Hz)
        this.noteFrequencies = {
            'E2': 82.41,   // Low E (6th string)
            'A2': 110.00,  // A (5th string)
            'D3': 146.83,  // D (4th string)
            'G3': 196.00,  // G (3rd string)
            'B3': 246.94,  // B (2nd string)
            'E4': 329.63   // High E (1st string)
        };
    }

    detectPitch(audioChunk) {
        // Convert buffer to float array
        const samples = this.bufferToFloat32Array(audioChunk);
        
        // Add to circular buffer
        this.audioBuffer = this.audioBuffer.concat(Array.from(samples));
        
        // Keep buffer size manageable
        if (this.audioBuffer.length > this.bufferSize) {
            this.audioBuffer = this.audioBuffer.slice(-this.bufferSize);
        }

        // Need enough samples for analysis
        if (this.audioBuffer.length < this.bufferSize) {
            return null;
        }

        // Apply window function (Hanning)
        const windowed = this.applyHanningWindow(this.audioBuffer);
        
        // Perform FFT
        const spectrum = fft(windowed);
        const magnitudes = fftUtil.fftMag(spectrum);
        
        // Find peak frequency
        const peakFrequency = this.findPeakFrequency(magnitudes);
        
        return peakFrequency;
    }

    bufferToFloat32Array(buffer) {
        const samples = new Float32Array(buffer.length / 2);
        for (let i = 0; i < samples.length; i++) {
            // Convert 16-bit PCM to float (-1 to 1)
            const sample = buffer.readInt16LE(i * 2);
            samples[i] = sample / 32768.0;
        }
        return samples;
    }

    applyHanningWindow(samples) {
        const windowed = new Array(samples.length);
        for (let i = 0; i < samples.length; i++) {
            const multiplier = 0.5 * (1 - Math.cos(2 * Math.PI * i / (samples.length - 1)));
            windowed[i] = samples[i] * multiplier;
        }
        return windowed;
    }

    findPeakFrequency(magnitudes) {
        let maxMagnitude = 0;
        let peakIndex = 0;
        
        // Skip very low frequencies (noise)
        const startIndex = Math.floor(50 * this.bufferSize / this.sampleRate);
        const endIndex = Math.floor(1000 * this.bufferSize / this.sampleRate);
        
        for (let i = startIndex; i < endIndex && i < magnitudes.length; i++) {
            if (magnitudes[i] > maxMagnitude) {
                maxMagnitude = magnitudes[i];
                peakIndex = i;
            }
        }
        
        // Convert bin to frequency
        const frequency = peakIndex * this.sampleRate / this.bufferSize;
        
        // Return frequency only if magnitude is significant
        return maxMagnitude > 0.01 ? frequency : null;
    }

    frequencyToNote(frequency) {
        let closestNote = '';
        let smallestDifference = Infinity;
        
        // Find closest note
        for (const [note, noteFreq] of Object.entries(this.noteFrequencies)) {
            const difference = Math.abs(frequency - noteFreq);
            if (difference < smallestDifference) {
                smallestDifference = difference;
                closestNote = note;
            }
        }
        
        // Only return note if it's reasonably close (within 20Hz)
        return smallestDifference < 20 ? closestNote : null;
    }
}

module.exports = PitchDetector;
