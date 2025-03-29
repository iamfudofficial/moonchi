# Bitizien Backend API

Backend-API für die Bitizien-App, eine Crypto-Mining-Plattform mit sozialen Elementen.

## Technologien

- **Node.js**: JavaScript-Laufzeitumgebung
- **Express.js**: Web-Framework für Node.js
- **MongoDB**: NoSQL-Datenbank
- **Socket.io**: Echtzeit-Kommunikationsbibliothek
- **JWT**: JSON Web Tokens für die Authentifizierung

## Installation

1. Abhängigkeiten installieren:
   ```
   npm install
   ```

2. `.env`-Datei erstellen:
   ```
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/bitizien
   JWT_SECRET=dein_geheimer_schluessel
   JWT_EXPIRE=30d
   MINING_INTERVAL=3600000  # Mining-Intervall in Millisekunden (1 Stunde)
   ```

3. Server starten:
   ```
   npm run start   # Produktionsumgebung
   npm run dev     # Entwicklungsumgebung mit nodemon
   ```

## API-Dokumentation

### Authentifizierung

#### Registrierung
```
POST /api/auth/register
```
Body:
```json
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123",
  "referralCode": "ABCD1234"  // Optional
}
```
Antwort:
```json
{
  "success": true,
  "token": "JWT_TOKEN",
  "user": {
    "id": "user_id",
    "username": "testuser",
    "email": "test@example.com",
    "role": "user",
    "walletBalance": 0,
    "referralCode": "GENERATED_CODE"
  }
}
```

#### Login
```
POST /api/auth/login
```
Body:
```json
{
  "email": "test@example.com",
  "password": "password123"
}
```
Antwort:
```json
{
  "success": true,
  "token": "JWT_TOKEN",
  "user": {
    "id": "user_id",
    "username": "testuser",
    "email": "test@example.com",
    "role": "user",
    "walletBalance": 0,
    "referralCode": "GENERATED_CODE"
  }
}
```

#### Aktuellen Benutzer abrufen
```
GET /api/auth/me
```
Header:
```
Authorization: Bearer JWT_TOKEN
```
Antwort:
```json
{
  "success": true,
  "data": {
    "_id": "user_id",
    "username": "testuser",
    "email": "test@example.com",
    "role": "user",
    "walletBalance": 0,
    "miningRate": 1,
    "innerCircle": [],
    "referralCode": "GENERATED_CODE"
  }
}
```

### Mining

#### Mining starten
```
POST /api/mining/mine
```
Header:
```
Authorization: Bearer JWT_TOKEN
```
Antwort:
```json
{
  "success": true,
  "data": {
    "reward": 10,
    "newBalance": 110,
    "miningEvent": {
      "_id": "event_id",
      "user": "user_id",
      "amount": 10,
      "miningRate": 1,
      "innerCircleBonus": 0,
      "otherBonus": 0,
      "timestamp": "2023-07-01T12:00:00.000Z"
    }
  }
}
```

#### Mining-Statistik abrufen
```
GET /api/mining/stats
```
Header:
```
Authorization: Bearer JWT_TOKEN
```
Antwort:
```json
{
  "success": true,
  "data": {
    "walletBalance": 110,
    "miningRate": 1.4,
    "innerCircleCount": 2,
    "innerCircleBonus": 0.4,
    "miningBoost": 1,
    "lastMiningTime": "2023-07-01T12:00:00.000Z",
    "canMineNow": false,
    "timeUntilNextMining": 45
  }
}
```

#### Mining-Verlauf abrufen
```
GET /api/mining/history?page=1&limit=10
```
Header:
```
Authorization: Bearer JWT_TOKEN
```
Antwort:
```json
{
  "success": true,
  "count": 2,
  "total": 2,
  "pagination": {
    "currentPage": 1,
    "totalPages": 1
  },
  "data": [
    {
      "_id": "event_id_1",
      "user": "user_id",
      "amount": 10,
      "miningRate": 1,
      "innerCircleBonus": 0,
      "otherBonus": 0,
      "timestamp": "2023-07-01T12:00:00.000Z"
    },
    {
      "_id": "event_id_2",
      "user": "user_id",
      "amount": 10,
      "miningRate": 1,
      "innerCircleBonus": 0,
      "otherBonus": 0,
      "timestamp": "2023-07-01T11:00:00.000Z"
    }
  ]
}
```

#### Inner Circle abrufen
```
GET /api/mining/inner-circle
```
Header:
```
Authorization: Bearer JWT_TOKEN
```
Antwort:
```json
{
  "success": true,
  "count": 2,
  "maxCount": 5,
  "data": [
    {
      "_id": "user_id_1",
      "username": "friend1",
      "email": "friend1@example.com"
    },
    {
      "_id": "user_id_2",
      "username": "friend2",
      "email": "friend2@example.com"
    }
  ]
}
```

### Benutzer

#### Benutzerprofil abrufen
```
GET /api/users/profile
```
Header:
```
Authorization: Bearer JWT_TOKEN
```
Antwort:
```json
{
  "success": true,
  "data": {
    "id": "user_id",
    "username": "testuser",
    "email": "test@example.com",
    "walletBalance": 110,
    "miningRate": 1.4,
    "miningBoost": 1,
    "referralCode": "GENERATED_CODE",
    "innerCircle": [
      {
        "_id": "user_id_1",
        "username": "friend1",
        "email": "friend1@example.com"
      },
      {
        "_id": "user_id_2",
        "username": "friend2",
        "email": "friend2@example.com"
      }
    ],
    "lastMiningTime": "2023-07-01T12:00:00.000Z",
    "createdAt": "2023-06-01T00:00:00.000Z",
    "role": "user"
  }
}
```

#### Referral-Informationen abrufen
```
GET /api/users/referral
```
Header:
```
Authorization: Bearer JWT_TOKEN
```
Antwort:
```json
{
  "success": true,
  "count": 3,
  "data": {
    "referralCode": "GENERATED_CODE",
    "referrals": [
      {
        "_id": "user_id_1",
        "username": "friend1",
        "createdAt": "2023-06-15T00:00:00.000Z"
      },
      {
        "_id": "user_id_2",
        "username": "friend2",
        "createdAt": "2023-06-20T00:00:00.000Z"
      },
      {
        "_id": "user_id_3",
        "username": "friend3",
        "createdAt": "2023-06-25T00:00:00.000Z"
      }
    ]
  }
}
```

## Socket.io-Events

### Chat-Events

#### Verbindung herstellen
```javascript
const socket = io('http://localhost:5000', {
  auth: {
    token: 'JWT_TOKEN'
  }
});
```

#### Globale Nachricht senden
```javascript
socket.emit('globalMessage', 'Hallo, Welt!');
```

#### Globale Nachricht empfangen
```javascript
socket.on('globalMessage', (message) => {
  console.log(message);
  // {
  //   id: 'message_id',
  //   sender: 'username',
  //   content: 'Hallo, Welt!',
  //   createdAt: '2023-07-01T12:00:00.000Z',
  //   senderId: 'user_id',
  //   senderRole: 'user'
  // }
});
```

#### Private Nachricht senden
```javascript
socket.emit('privateMessage', {
  receiverId: 'user_id_to_send_to',
  content: 'Hallo, wie geht es dir?'
});
```

#### Private Nachricht empfangen
```javascript
socket.on('privateMessage', (message) => {
  console.log(message);
  // {
  //   id: 'message_id',
  //   sender: 'username',
  //   content: 'Hallo, wie geht es dir?',
  //   createdAt: '2023-07-01T12:00:00.000Z',
  //   senderId: 'user_id'
  // }
});
```

#### Liste aktiver Benutzer empfangen
```javascript
socket.on('userList', (users) => {
  console.log(users);
  // [
  //   {
  //     socketId: 'socket_id_1',
  //     username: 'user1',
  //     role: 'user'
  //   },
  //   {
  //     socketId: 'socket_id_2',
  //     username: 'admin',
  //     role: 'admin'
  //   }
  // ]
});
```

## Projektstruktur

```
bitizien-backend/
├── controllers/        # Anforderungshandler
│   ├── auth.js         # Authentifizierungslogik
│   └── mining.js       # Mining-Logik
├── middleware/         # Express-Middleware
│   └── auth.js         # Authentifizierungs-Middleware
├── models/             # Mongoose-Modelle
│   ├── User.js         # Benutzermodell
│   ├── MiningEvent.js  # Mining-Event-Modell
│   └── Message.js      # Nachrichtenmodell
├── routes/             # API-Routen
│   ├── auth.js         # Authentifizierungsrouten
│   ├── mining.js       # Mining-Routen
│   └── user.js         # Benutzerrouten
├── utils/              # Hilfsfunktionen und -dienste
│   ├── miningEngine.js # Mining-Logik
│   └── socket.js       # Socket.io-Konfiguration
├── .env                # Umgebungsvariablen
├── server.js           # Haupteinstiegspunkt
└── package.json        # Projektabhängigkeiten
```

## Mining-Mechanik

Das Mining in Bitizien funktioniert wie folgt:

1. Der Basis-Mining-Wert beträgt 10 Coins pro Stunde.
2. Jeder Benutzer kann alle `MINING_INTERVAL` Zeit (Standard: 1 Stunde) manuell minen.
3. Zusätzlich wird ein automatischer Mining-Prozess für alle Benutzer alle `MINING_INTERVAL` Zeit ausgeführt.
4. Die Mining-Rate wird wie folgt berechnet:
   - Basis-Rate: 1.0
   - Inner Circle-Bonus: +0.2 pro Mitglied (maximal 5 Mitglieder = +1.0)
   - Andere Boosts: Multiplikator für spezielle Events oder Achievements
5. Die Gesamt-Mining-Belohnung wird berechnet als:
   ```
   Belohnung = Basis-Wert + (Inner Circle-Bonus * Basis-Wert) + (Andere Boosts * Basis-Wert)
   ```

## Lizenz

Dieses Projekt ist unter der MIT-Lizenz lizenziert. 