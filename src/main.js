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
        
        console.log(chalk.blue.bold('🎸 Guitar Keyboard - Initialized'));
        console.log(chalk.gray('Press Ctrl+C to stop'));
    }

    start() {
        console.log(chalk.green('🎤 Starting microphone recording...'));
        
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
            // Convert audio chunk to frequency
            const frequency = this.pitchDetector.detectPitch(chunk);
            
            if (frequency && frequency > 80 && frequency < 800) { // Guitar frequency range
                const note = this.pitchDetector.frequencyToNote(frequency);
                const key = this.noteMapper.noteToKey(note);
                
                if (key) {
                    console.log(chalk.yellow(`🎵 Note: ${note} (${frequency.toFixed(1)}Hz) → Key: ${key}`));
                    this.typeKey(key);
                }
            }
        } catch (error) {
            console.error(chalk.red('Processing error:'), error.message);
        }
    }

    typeKey(key) {
        try {
            robot.typeString(key);
            console.log(chalk.green(`⌨️  Typed: "${key}"`));
        } catch (error) {
            console.error(chalk.red('Keyboard error:'), error.message);
        }
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

// Start the application
guitarKeyboard.start();
