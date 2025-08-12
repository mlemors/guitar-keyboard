const fft = require('fft-js').fft;
const fftUtil = require('fft-js').util;

class PitchDetector {
    constructor() {
        this.sampleRate = 44100;
        this.bufferSize = 4096;
        this.audioBuffer = [];
        
        // Confidence tracking
        this.lastConfidence = 0;
        this.frequencyHistory = [];
        this.historySize = 5; // Track last 5 detections for stability
        
        // Calibration settings (will be updated during calibration)
        this.calibration = {
            noiseLevel: 0,
            guitarFrequencyRange: { min: 80, max: 800 },
            magnitudeThreshold: 0.02 // Increased threshold for better accuracy
        };
        
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
        
        // Find peak frequency with confidence
        const result = this.findPeakFrequencyWithConfidence(magnitudes);
        
        if (result.frequency) {
            // Add to frequency history for stability checking
            this.frequencyHistory.push(result.frequency);
            if (this.frequencyHistory.length > this.historySize) {
                this.frequencyHistory.shift();
            }
            
            // Calculate stability - how consistent are recent detections?
            const stability = this.calculateStability();
            this.lastConfidence = result.confidence * stability;
            
            // Only return frequency if it's stable and confident
            if (this.lastConfidence > 0.5) {
                return result.frequency;
            }
        }
        
        return null;
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

    findPeakFrequencyWithConfidence(magnitudes) {
        let maxMagnitude = 0;
        let peakIndex = 0;
        let secondPeak = 0;
        
        // Use calibrated frequency range
        const minFreq = this.calibration.guitarFrequencyRange.min;
        const maxFreq = this.calibration.guitarFrequencyRange.max;
        
        const startIndex = Math.floor(minFreq * this.bufferSize / this.sampleRate);
        const endIndex = Math.floor(maxFreq * this.bufferSize / this.sampleRate);
        
        for (let i = startIndex; i < endIndex && i < magnitudes.length; i++) {
            if (magnitudes[i] > maxMagnitude) {
                secondPeak = maxMagnitude;
                maxMagnitude = magnitudes[i];
                peakIndex = i;
            } else if (magnitudes[i] > secondPeak) {
                secondPeak = magnitudes[i];
            }
        }
        
        // Convert bin to frequency
        const frequency = peakIndex * this.sampleRate / this.bufferSize;
        
        // Calculate confidence based on peak prominence and threshold
        const threshold = this.calibration.magnitudeThreshold;
        const isAboveThreshold = maxMagnitude > threshold;
        const isNotNoise = Math.abs(frequency - this.calibration.noiseLevel) > 20;
        
        // Confidence is based on how much the peak stands out from background
        let confidence = 0;
        if (isAboveThreshold && isNotNoise) {
            // Higher confidence if peak is much stronger than second peak
            const peakRatio = secondPeak > 0 ? maxMagnitude / secondPeak : maxMagnitude;
            confidence = Math.min(1.0, (maxMagnitude / threshold) * (peakRatio / 2));
        }
        
        return {
            frequency: (isAboveThreshold && isNotNoise) ? frequency : null,
            confidence: confidence
        };
    }

    calculateStability() {
        if (this.frequencyHistory.length < 2) return 0.5;
        
        // Calculate how stable recent frequencies are
        const recent = this.frequencyHistory.slice(-3); // Last 3 detections
        const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
        const variance = recent.reduce((sum, freq) => sum + Math.pow(freq - avg, 2), 0) / recent.length;
        const stdDev = Math.sqrt(variance);
        
        // Lower standard deviation = higher stability
        // Convert to 0-1 scale where 0 = very unstable, 1 = very stable
        return Math.max(0, 1 - (stdDev / 50)); // 50Hz tolerance
    }

    getLastConfidence() {
        return this.lastConfidence;
    }

    findPeakFrequency(magnitudes) {
        let maxMagnitude = 0;
        let peakIndex = 0;
        
        // Use calibrated frequency range
        const minFreq = this.calibration.guitarFrequencyRange.min;
        const maxFreq = this.calibration.guitarFrequencyRange.max;
        
        const startIndex = Math.floor(minFreq * this.bufferSize / this.sampleRate);
        const endIndex = Math.floor(maxFreq * this.bufferSize / this.sampleRate);
        
        for (let i = startIndex; i < endIndex && i < magnitudes.length; i++) {
            if (magnitudes[i] > maxMagnitude) {
                maxMagnitude = magnitudes[i];
                peakIndex = i;
            }
        }
        
        // Convert bin to frequency
        const frequency = peakIndex * this.sampleRate / this.bufferSize;
        
        // Use calibrated magnitude threshold and filter out noise
        const threshold = this.calibration.magnitudeThreshold;
        const isAboveThreshold = maxMagnitude > threshold;
        const isNotNoise = Math.abs(frequency - this.calibration.noiseLevel) > 10;
        
        return (isAboveThreshold && isNotNoise) ? frequency : null;
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

    setCalibration(calibrationData) {
        this.calibration = { ...this.calibration, ...calibrationData };
        console.log('🔧 Pitch detector calibrated with new settings');
    }
}

module.exports = PitchDetector;
