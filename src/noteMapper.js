class NoteMapper {
    constructor() {
        // Map guitar notes to keyboard characters
        this.noteToKeyMap = {
            'E2': 'e',  // Low E → 'e'
            'A2': 'a',  // A → 'a'
            'D3': 'd',  // D → 'd'
            'G3': 'g',  // G → 'g'
            'B3': 'b',  // B → 'b'
            'E4': 'E'   // High E → 'E' (uppercase to differentiate)
        };
        
        // Alternative mapping schemes
        this.mappingSchemes = {
            'letters': {
                'E2': 'e',
                'A2': 'a', 
                'D3': 'd',
                'G3': 'g',
                'B3': 'b',
                'E4': 'E'
            },
            'numbers': {
                'E2': '1',
                'A2': '2',
                'D3': '3',
                'G3': '4',
                'B3': '5',
                'E4': '6'
            },
            'qwerty': {
                'E2': 'q',
                'A2': 'w',
                'D3': 'e',
                'G3': 'r',
                'B3': 't',
                'E4': 'y'
            },
            'typing': {
                'E2': 'space',     // Space for low E
                'A2': 'a',
                'D3': 's',
                'G3': 'd',
                'B3': 'f',
                'E4': 'backspace'  // Backspace/delete for high E
            },
            'custom': {
                'E2': ' ',  // Space for low E
                'A2': 'a',
                'D3': 's',
                'G3': 'd',
                'B3': 'f',
                'E4': '\n'  // Enter for high E
            }
        };
        
        this.currentScheme = 'typing'; // Changed default to typing scheme
        this.lastNote = null;
        this.lastTime = 0;
        this.debounceTime = 500; // Increased debounce time significantly
        this.sameNoteCount = 0;
        this.requiredConsistency = 3; // Need 3 consistent detections before triggering
    }

    noteToKey(note) {
        if (!note) return null;
        
        const now = Date.now();
        
        // Check if it's the same note as before
        if (note === this.lastNote) {
            // If within debounce time, increment consistency counter
            if ((now - this.lastTime) < this.debounceTime) {
                this.sameNoteCount++;
                // Only return the key if we've seen this note consistently
                if (this.sameNoteCount >= this.requiredConsistency) {
                    this.lastTime = now;
                    const scheme = this.mappingSchemes[this.currentScheme];
                    return scheme[note] || null;
                }
                return null; // Not consistent enough yet
            } else {
                // Too much time passed, reset counter
                this.sameNoteCount = 1;
            }
        } else {
            // Different note, reset everything
            this.sameNoteCount = 1;
        }
        
        this.lastNote = note;
        this.lastTime = now;
        
        return null; // Don't trigger on first detection
    }

    setMappingScheme(schemeName) {
        if (this.mappingSchemes[schemeName]) {
            this.currentScheme = schemeName;
            console.log(`Mapping scheme changed to: ${schemeName}`);
            return true;
        }
        return false;
    }

    getCurrentScheme() {
        return this.currentScheme;
    }

    getAvailableSchemes() {
        return Object.keys(this.mappingSchemes);
    }

    addCustomMapping(note, key) {
        if (!this.mappingSchemes.custom) {
            this.mappingSchemes.custom = {};
        }
        this.mappingSchemes.custom[note] = key;
    }

    showCurrentMappings() {
        const scheme = this.mappingSchemes[this.currentScheme];
        console.log(`\nCurrent mapping scheme: ${this.currentScheme}`);
        console.log('Note → Key:');
        for (const [note, key] of Object.entries(scheme)) {
            let keyDisplay = key;
            if (key === ' ') keyDisplay = 'SPACE';
            else if (key === '\n') keyDisplay = 'ENTER';
            else if (key === 'space') keyDisplay = 'SPACE';
            else if (key === 'backspace') keyDisplay = 'BACKSPACE/DELETE';
            else if (key === 'enter') keyDisplay = 'ENTER';
            
            console.log(`  ${note} → ${keyDisplay}`);
        }
        console.log('');
    }
}

module.exports = NoteMapper;
