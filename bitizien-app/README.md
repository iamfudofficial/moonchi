# Bitizien App

Eine Crypto-Mining-App mit sozialem Netzwerk für Mobilgeräte, entwickelt mit React Native und Expo.

## Features

- **Benutzerauthentifizierung**: Registrierung und Login
- **Social Mining**: Verdiene mit deinen Freunden im Inner Circle
- **Chat-System**: Globaler Chat und private Nachrichten
- **Wallet-System**: Verwalte deine verdienten Coins
- **Referral-System**: Lade Freunde ein und erhalte Boni

## Technologien

- **Frontend**: React Native mit Expo
- **Backend**: Node.js, Express.js, MongoDB
- **Echtzeitkommunikation**: Socket.io

## Installation

### Voraussetzungen

- Node.js (v14+)
- npm oder yarn
- MongoDB
- Expo CLI

### Frontend-Setup

1. Installiere Abhängigkeiten:
   ```
   cd bitizien-app
   npm install
   ```

2. Passe die API-URL an:
   - Öffne die Dateien unter `/context` und `/screens`
   - Ändere `API_URL` und `SERVER_URL` auf deine lokale Server-Adresse

3. Starte die App:
   ```
   npm start
   ```

### Backend-Setup

1. Installiere Abhängigkeiten:
   ```
   cd bitizien-backend
   npm install
   ```

2. Erstelle eine `.env`-Datei mit folgenden Umgebungsvariablen:
   ```
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/bitizien
   JWT_SECRET=dein_geheimer_schluessel
   JWT_EXPIRE=30d
   MINING_INTERVAL=3600000  # Mining-Intervall in Millisekunden (1 Stunde)
   ```

3. Starte den Server:
   ```
   npm run dev
   ```

## Verwendung

### Mining

- Auf dem Home-Screen kannst du alle `MINING_INTERVAL` Zeit minen
- Der Mining-Prozess läuft auch im Hintergrund, so dass regelmäßig Coins verdient werden
- Je mehr Benutzer in deinem Inner Circle, desto mehr verdienst du

### Inner Circle

- Lade bis zu 5 Freunde in deinen Inner Circle ein
- Jeder Freund bringt einen Bonus von 20% auf deine Mining-Rate

### Chat

- Kommuniziere mit anderen Benutzern im globalen Chat
- Sende private Nachrichten an einzelne Benutzer

## Projektstruktur

### Frontend (React Native)

```
bitizien-app/
├── assets/          # Bilder, Fonts, etc.
├── components/      # Wiederverwendbare UI-Komponenten
├── context/         # React Context für Authentifizierung
├── screens/         # App-Bildschirme
│   ├── auth/        # Authentifizierungsbildschirme
│   └── main/        # Hauptbildschirme nach dem Login
└── App.js           # Haupteinstiegspunkt
```

### Backend (Node.js)

```
bitizien-backend/
├── controllers/     # Anforderungshandler
├── middleware/      # Express-Middleware
├── models/          # Mongoose-Modelle
├── routes/          # API-Routen
├── utils/           # Hilfsfunktionen und -dienste
└── server.js        # Haupteinstiegspunkt
```

## Lizenz

Dieses Projekt ist unter der MIT-Lizenz lizenziert.

## Referral-System und Mining-Mechanik

### Referral-System
- **Einladungscode**: Der Benutzername eines bestehenden Nutzers dient als Einladungscode
- **Erste Registrierung**: Der erste Benutzer in der Datenbank kann sich ohne Einladungscode registrieren
- **Inner Circle**: Jeder Benutzer kann bis zu 5 Personen in seinem Inner Circle haben
- **Mining-Boost**: Jeder Benutzer im Inner Circle erhöht die Mining-Rate um 20%

### Mining-Mechanik
- **Basisrate**: Jeder Benutzer startet mit einer Basisrate von 1.0x
- **Intervall**: Mining ist alle 60 Minuten möglich (konfigurierbar)
- **Belohnung**: Die Belohnung basiert auf der aktuellen Mining-Rate
- **Wallet**: Alle gewonnenen Coins werden automatisch im Wallet gespeichert

## Public Ordner für Bilder

Der `public/images` Ordner ist für benutzerdefinierte Bilder vorgesehen. Hier können Sie Ihre eigenen Bilder für die App hochladen.

### Struktur

```
bitizien-app/
  └── public/
      └── images/
          ├── moonchi-logo.png    # Logo für die App
          ├── moonchi-bg.png      # Hintergrundbild
          └── ...                 # Weitere Bilder
```

### Verwendung

1. Legen Sie Ihre Bilder im `public/images` Ordner ab
2. Verwenden Sie die Bilder in der App mit:
   ```javascript
   <Image source={require('../../public/images/ihr-bild.png')} />
   ```

### Unterstützte Bildformate

- PNG
- JPG/JPEG
- GIF
- WebP

### Empfohlene Bildgrößen

- Logo: 512x512 px
- Hintergrund: 1080x1920 px
- Icons: 128x128 px

### Wichtige Hinweise

- Verwenden Sie aussagekräftige Dateinamen
- Optimieren Sie Ihre Bilder für mobile Geräte
- Vermeiden Sie Sonderzeichen in Dateinamen
- Beachten Sie die Bildrechte
