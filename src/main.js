const robot = require('robotjs');
const recorder = require('node-record-lpcm16');
const chalk = require('chalk');
const PitchDetector = require('./pitchDetector');
const NoteMapper = require('./noteMapper');

class GuitarKeyboard {
    constructor() {
        this.pitchDetector = new PitchDetector();
        this.noteMapper = new NoteMapper();
        this.isListening = false;
        this.recording = null;
        this.lastInputTime = 0;
        this.inputTimeout = 1000; // Increased to 1 second between inputs to prevent spam
        
        // Calibration variables
        this.isCalibrating = false;
        this.calibrationData = {
            noiseLevel: 0,
            guitarFrequencyRange: { min: 80, max: 800 },
            magnitudeThreshold: 0.01,
            detectedNotes: new Set()
        };
        
        console.log(chalk.blue.bold('🎸 Guitar Keyboard - Initialized'));
        console.log(chalk.gray('Press Ctrl+C to stop'));
    }

    async start() {
        console.log(chalk.green('🎤 Starting microphone recording...'));
        
        // Start calibration first
        await this.runCalibration();
        
        // Show current mappings
        this.noteMapper.showCurrentMappings();
        console.log(chalk.blue(`⏱️  Input timeout: ${this.inputTimeout}ms (prevents spam)`));
        
        this.recording = recorder.record({
            sampleRate: 44100,
            channels: 1,
            audioType: 'wav',
            silence: '1.0',
            threshold: 0.5,
            thresholdStart: null,
            thresholdEnd: null,
            verbose: false
        });

        this.recording.stream()
            .on('data', (chunk) => this.processAudioChunk(chunk))
            .on('error', (err) => console.error(chalk.red('Recording error:'), err));

        this.isListening = true;
        console.log(chalk.cyan('🎯 Listening for guitar notes... Play something!'));
    }

    processAudioChunk(chunk) {
        try {
            // Check timeout to prevent spam
            const now = Date.now();
            if (now - this.lastInputTime < this.inputTimeout) {
                return; // Skip processing if within timeout period
            }
            
            // Convert audio chunk to frequency
            const frequency = this.pitchDetector.detectPitch(chunk);
            
            if (frequency && frequency > 80 && frequency < 800) { // Guitar frequency range
                const note = this.pitchDetector.frequencyToNote(frequency);
                const key = this.noteMapper.noteToKey(note);
                
                // Additional confidence check - only proceed if we have a strong, consistent signal
                if (key && this.pitchDetector.getLastConfidence() > 0.7) {
                    console.log(chalk.yellow(`🎵 Note: ${note} (${frequency.toFixed(1)}Hz) → Key: ${key} [Confidence: ${(this.pitchDetector.getLastConfidence() * 100).toFixed(1)}%]`));
                    this.typeKey(key);
                    this.lastInputTime = now; // Update last input time
                }
            }
        } catch (error) {
            console.error(chalk.red('Processing error:'), error.message);
        }
    }

    typeKey(key) {
        try {
            // Handle special keys
            if (key === 'backspace' || key === 'delete') {
                robot.keyTap('backspace');
                console.log(chalk.green(`⌨️  Pressed: BACKSPACE`));
            } else if (key === 'enter') {
                robot.keyTap('enter');
                console.log(chalk.green(`⌨️  Pressed: ENTER`));
            } else if (key === 'space') {
                robot.keyTap('space');
                console.log(chalk.green(`⌨️  Pressed: SPACE`));
            } else {
                robot.typeString(key);
                console.log(chalk.green(`⌨️  Typed: "${key}"`));
            }
        } catch (error) {
            console.error(chalk.red('Keyboard error:'), error.message);
        }
    }

    async runCalibration() {
        console.log(chalk.magenta('\n🔧 Starting Calibration...'));
        
        // Step 1: Measure background noise
        await this.calibrateNoise();
        
        // Step 2: Detect guitar frequency range
        await this.calibrateGuitar();
        
        // Step 3: Set thresholds
        this.finalizeCalibration();
        
        console.log(chalk.green('✅ Calibration complete!\n'));
    }

    async calibrateNoise() {
        console.log(chalk.yellow('📊 Step 1: Measuring background noise...'));
        console.log(chalk.gray('   Please stay quiet for 3 seconds...'));
        
        return new Promise((resolve) => {
            let noiseSamples = [];
            let sampleCount = 0;
            const maxSamples = 30; // 3 seconds worth
            
            const recording = recorder.record({
                sampleRate: 44100,
                channels: 1,
                audioType: 'wav',
                silence: '1.0',
                threshold: 0.5,
                thresholdStart: null,
                thresholdEnd: null,
                verbose: false
            });

            recording.stream().on('data', (chunk) => {
                if (sampleCount < maxSamples) {
                    const frequency = this.pitchDetector.detectPitch(chunk);
                    if (frequency) {
                        noiseSamples.push(frequency);
                    }
                    sampleCount++;
                } else {
                    recording.stop();
                    
                    // Calculate noise statistics
                    if (noiseSamples.length > 0) {
                        const avgNoise = noiseSamples.reduce((a, b) => a + b, 0) / noiseSamples.length;
                        this.calibrationData.noiseLevel = avgNoise;
                        console.log(chalk.blue(`   Background noise level: ${avgNoise.toFixed(1)}Hz`));
                    } else {
                        console.log(chalk.blue('   No background noise detected - good!'));
                    }
                    
                    resolve();
                }
            });
        });
    }

    async calibrateGuitar() {
        console.log(chalk.yellow('🎸 Step 2: Guitar detection...'));
        console.log(chalk.gray('   Please play each string (low E, A, D, G, B, high E) for 10 seconds...'));
        console.log(chalk.gray('   Press Enter when ready to start...'));
        
        // Wait for user input
        await this.waitForEnter();
        
        return new Promise((resolve) => {
            let guitarSamples = [];
            let frequencies = [];
            let sampleCount = 0;
            const maxSamples = 100; // 10 seconds worth
            
            const recording = recorder.record({
                sampleRate: 44100,
                channels: 1,
                audioType: 'wav',
                silence: '1.0',
                threshold: 0.5,
                thresholdStart: null,
                thresholdEnd: null,
                verbose: false
            });

            console.log(chalk.cyan('   🎵 Recording guitar... play all strings!'));

            recording.stream().on('data', (chunk) => {
                if (sampleCount < maxSamples) {
                    const frequency = this.pitchDetector.detectPitch(chunk);
                    if (frequency && frequency > 50 && frequency < 1000) {
                        frequencies.push(frequency);
                        const note = this.pitchDetector.frequencyToNote(frequency);
                        if (note) {
                            this.calibrationData.detectedNotes.add(note);
                            console.log(chalk.dim(`     Detected: ${note} (${frequency.toFixed(1)}Hz)`));
                        }
                    }
                    sampleCount++;
                } else {
                    recording.stop();
                    
                    // Analyze guitar frequency range
                    if (frequencies.length > 0) {
                        const sortedFreqs = frequencies.sort((a, b) => a - b);
                        this.calibrationData.guitarFrequencyRange.min = sortedFreqs[0] - 10;
                        this.calibrationData.guitarFrequencyRange.max = sortedFreqs[sortedFreqs.length - 1] + 10;
                        
                        console.log(chalk.blue(`   Guitar frequency range: ${this.calibrationData.guitarFrequencyRange.min.toFixed(1)}Hz - ${this.calibrationData.guitarFrequencyRange.max.toFixed(1)}Hz`));
                        console.log(chalk.blue(`   Detected notes: ${Array.from(this.calibrationData.detectedNotes).join(', ')}`));
                    }
                    
                    resolve();
                }
            });
        });
    }

    waitForEnter() {
        return new Promise((resolve) => {
            process.stdin.setRawMode(true);
            process.stdin.resume();
            process.stdin.on('data', (key) => {
                if (key[0] === 13) { // Enter key
                    process.stdin.setRawMode(false);
                    process.stdin.pause();
                    resolve();
                }
            });
        });
    }

    finalizeCalibration() {
        // Adjust detection thresholds based on calibration
        const detectedNotesCount = this.calibrationData.detectedNotes.size;
        
        if (detectedNotesCount >= 3) {
            console.log(chalk.green(`   ✅ Good calibration: detected ${detectedNotesCount} different notes`));
            this.calibrationData.magnitudeThreshold = 0.005; // More sensitive
        } else if (detectedNotesCount >= 1) {
            console.log(chalk.yellow(`   ⚠️  Partial calibration: detected ${detectedNotesCount} notes`));
            this.calibrationData.magnitudeThreshold = 0.01; // Default
        } else {
            console.log(chalk.red(`   ❌ Poor calibration: no guitar notes detected`));
            console.log(chalk.gray('      Using default settings...'));
            this.calibrationData.magnitudeThreshold = 0.02; // Less sensitive
        }
        
        // Update pitch detector with calibration data
        this.pitchDetector.setCalibration(this.calibrationData);
    }

    setInputTimeout(timeoutMs) {
        this.inputTimeout = timeoutMs;
        console.log(chalk.blue(`⏱️  Input timeout changed to: ${timeoutMs}ms`));
    }

    stop() {
        if (this.recording) {
            this.recording.stop();
            this.isListening = false;
            console.log(chalk.red('🛑 Guitar Keyboard stopped'));
        }
    }
}

// Initialize and start the application
const guitarKeyboard = new GuitarKeyboard();

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log(chalk.yellow('\n📴 Shutting down...'));
    guitarKeyboard.stop();
    process.exit(0);
});

// Start the application (async)
(async () => {
    try {
        await guitarKeyboard.start();
    } catch (error) {
        console.error(chalk.red('Startup error:'), error.message);
        process.exit(1);
    }
})();
