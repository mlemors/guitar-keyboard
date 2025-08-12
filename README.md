# Guitar Keyboard 🎸⌨️

Eine Desktop-Anwendung, die Gitarrentöne in Tastatureingaben umwandelt. Spiele deine Gitarre und schreibe Text in jedem Editor!

## Features

- **Echtzeit-Pitch-Erkennung**: Erkennt Gitarrentöne über das Mikrofon
- **Universelle Tastatureingabe**: Funktioniert in VS Code, Notepad, und jedem anderen Editor
- **Verschiedene Mapping-Modi**: 
  - Letters: E→e, A→a, D→d, G→g, B→b, E→E
  - Numbers: E→1, A→2, D→3, G→4, B→5, E→6
  - QWERTY: E→q, A→w, D→e, G→r, B→t, E→y
  - Custom: Eigene Zuordnungen möglich

## Installation

```bash
# Dependencies installieren
npm install

# Entwicklungsmodus starten
npm run dev

# Oder direkt starten
npm start
```

## Verwendung

1. **Anwendung starten**: `npm start`
2. **Editor öffnen**: VS Code, Notepad oder einen beliebigen Texteditor
3. **Gitarre spielen**: Einzelne Töne anschlagen (E, A, D, G, B, E)
4. **Text erscheint**: Automatisch im aktiven Editor

## Systemanforderungen

- **Node.js** 16+ 
- **Mikrofon** (für Gitarre-Input)
- **macOS/Windows/Linux** (robotjs unterstützt alle Plattformen)

## Konfiguration

Die Anwendung kann über verschiedene Parameter angepasst werden:

- **Debounce-Zeit**: Verhindert doppelte Eingaben
- **Frequenz-Toleranz**: Wie genau Töne erkannt werden
- **Mapping-Schema**: Welche Tasten welchen Noten entsprechen

## Entwicklung

```bash
# Entwicklung mit Auto-Reload
npm run dev

# Build für Distribution
npm run build
```

## Troubleshooting

### Mikrofon funktioniert nicht
- Berechtigung für Mikrofonzugriff prüfen
- Eingabepegel testen

### Robotjs Installation Probleme
```bash
# macOS
npm install --save robotjs

# Bei Problemen: XCode Command Line Tools
xcode-select --install
```

### Pitch Detection ungenau
- Gitarre stimmen
- Hintergrundgeräusche minimieren
- Einzelne Töne klar anschlagen

## Lizenz

MIT License - Freie Nutzung und Modifikation erlaubt!
