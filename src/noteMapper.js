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
            'custom': {
                'E2': ' ',  // Space for low E
                'A2': 'a',
                'D3': 's',
                'G3': 'd',
                'B3': 'f',
                'E4': '\n'  // Enter for high E
            }
        };
        
        this.currentScheme = 'letters';
        this.lastNote = null;
        this.lastTime = 0;
        this.debounceTime = 200; // ms to prevent rapid repeated notes
    }

    noteToKey(note) {
        if (!note) return null;
        
        // Debounce to prevent rapid fire of same note
        const now = Date.now();
        if (note === this.lastNote && (now - this.lastTime) < this.debounceTime) {
            return null;
        }
        
        this.lastNote = note;
        this.lastTime = now;
        
        const scheme = this.mappingSchemes[this.currentScheme];
        return scheme[note] || null;
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
            const keyDisplay = key === ' ' ? 'SPACE' : key === '\n' ? 'ENTER' : key;
            console.log(`  ${note} → ${keyDisplay}`);
        }
        console.log('');
    }
}

module.exports = NoteMapper;
