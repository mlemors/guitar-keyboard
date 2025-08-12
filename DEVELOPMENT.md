# Guitar Keyboard Development Notes

## Architektur

### Hauptkomponenten

1. **main.js**: Hauptanwendung und Orchestrierung
2. **pitchDetector.js**: Audio-Processing und Frequenz-Erkennung
3. **noteMapper.js**: Note-zu-Tastatur Mapping

### Audio Pipeline

```
Mikrofon → Audio Buffer → FFT → Frequenz → Note → Tastatur
```

### Technische Details

- **Sample Rate**: 44.1kHz
- **Buffer Size**: 4096 Samples
- **FFT**: Fast Fourier Transform für Frequenzanalyse
- **Window Function**: Hanning Window zur Reduzierung von Spektral-Leakage

## Erweiterungsmöglichkeiten

### 1. Chord Detection
- Mehrere Frequenzen gleichzeitig erkennen
- Akkorde zu Tastenkombinationen mappen

### 2. Machine Learning Integration
- TensorFlow.js für bessere Note Recognition
- Training mit eigenen Gitarren-Samples

### 3. GUI Interface
- Electron-basierte UI
- Visuelle Feedback für erkannte Noten
- Real-time Mapping-Konfiguration

### 4. Advanced Features
- MIDI Input Support
- Multiple Instrument Support (Bass, Ukulele)
- Velocity-sensitive Mapping

## Performance Optimierungen

- Circular Buffer für Audio-Daten
- Debouncing für Note Recognition
- Efficient FFT Implementation

## Testing

```bash
# Unit Tests für Pitch Detection
npm test

# Manual Testing
# 1. Start application
# 2. Play single notes on guitar
# 3. Verify correct keyboard output
```
