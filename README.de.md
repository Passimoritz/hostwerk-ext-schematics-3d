![Bauwerke in 3D](banner.svg)

# Bauwerke in 3D

Minecraft-Bauwerke in 3D ansehen, bevor du sie setzt: .schem (WorldEdit/Sponge), .litematic (Litematica) und .schematic (MCEdit).

[English](README.md) · Offizielle [Hostwerk](https://github.com/Passimoritz/hostwerk-public)-Erweiterung (SDK 2.7, native Erweiterung)

![Bildschirmfoto](docs/screenshot.de.png)

## Was sie kann

- 3D-Ansicht – drehen, zoomen, hineinschauen
- Eigene Seite mit allen Bauwerken deiner Server und ein Reiter „Bauwerke“ im Minecraft-Bereich (Server wählbar)
- Formate: .schem (WorldEdit/Sponge), .litematic, .schematic (MCEdit) und Vanilla-.nbt-Strukturen
- Ebenen-Schieber – Schicht für Schicht von unten
- Materialliste mit Anzahl und 64er-Stapeln (auch verdeckte Blöcke), als Text kopieren
- Ansicht als PNG-Bild speichern
- Direkt in der Dateivorschau von Hostwerks Dateibrowser
- Läuft auf diesem PC – nichts wird hochgeladen

## Installieren

In Hostwerk unter **Erweiterungen → Entdecken** auf „Installieren“ klicken. Wer die Funktion schon in Hostwerk 2.8 benutzt hat, bekommt die Erweiterung beim Update automatisch – mit allen Daten.

Native Erweiterungen laufen als Teil von Hostwerk (eigener Server- und Oberflächen-Teil). Darum installiert Hostwerk sie nur aus dem offiziellen Katalog (mit Prüfsumme) oder im Entwickler-Modus.

## Daten

Keine eigenen Daten.

## Entwickeln

```bash
node --test tests/*.test.js          # Tests
node build-native.js .               # Oberfläche bauen (sdk/build-native.js aus hostwerk-public)
node check.js . --strict             # Prüfung wie im Katalog (sdk/check.js)
```

Quelltext der Oberfläche in `ui/src`, Server-Teil in `server/`. Texte im Code sind Englisch, Deutsch steht in `locales/de.json`.

## Lizenz

MIT
