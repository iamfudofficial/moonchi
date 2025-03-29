# MOONCHI Token Platform

Eine vollständige Kryptowährungs-Mining-Plattform mit mobilem Frontend und Backend-Server.

## Projektstruktur

```
moonchi-token/
├── bitizien-app/     # Mobile App (React Native + Expo)
└── bitizien-backend/ # Server (Node.js + Express + MongoDB)
```

## Features

- Tägliches Mining von MOONCHI Tokens
- Echtzeit-Kontostand-Anzeige
- Mining-Statistiken und Boosts
- Inner Circle System für erhöhte Mining-Raten
- 24-Stunden-Cooldown-System
- Modernes UI-Design mit Glasmorphismus-Effekten
- Sichere JWT-basierte Authentifizierung
- Echtzeit-Updates via Socket.io

## Technologie-Stack

### Frontend (Mobile App)
- React Native
- Expo
- Socket.io Client
- Moderne UI/UX mit Glasmorphismus

### Backend (Server)
- Node.js/Express
- MongoDB Datenbank
- JWT Authentication
- Socket.io für Echtzeit-Updates

## Installation

1. Clone das Repository:
```bash
git clone https://github.com/iamfudofficial/moonchi-token.git
cd moonchi-token
```

2. Installiere die Abhängigkeiten:

Frontend (App):
```bash
cd bitizien-app
npm install
```

Backend:
```bash
cd ../bitizien-backend
npm install
```

3. Konfiguriere die Umgebungsvariablen:

Erstelle eine `.env` Datei im Backend-Verzeichnis:
```env
PORT=5000
MONGODB_URI=deine_mongodb_uri
JWT_SECRET=dein_jwt_secret
```

4. Starte die Entwicklungsserver:

Backend:
```bash
cd bitizien-backend
npm run dev
```

Frontend:
```bash
cd bitizien-app
npx expo start
```

## Entwicklung

- Frontend läuft auf Port 19000 (Expo)
- Backend läuft auf Port 5000
- MongoDB sollte lokal oder als Cloud-Service verfügbar sein
- Stelle sicher, dass alle Umgebungsvariablen korrekt gesetzt sind

## Lizenz

MIT 