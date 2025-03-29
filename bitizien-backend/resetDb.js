const mongoose = require('mongoose');
require('dotenv').config();

async function resetDatabase() {
  try {
    console.log('Verbinde mit MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    
    console.log('Lösche alle Daten aus der Datenbank...');
    await mongoose.connection.db.dropDatabase();
    
    console.log('Datenbank erfolgreich zurückgesetzt!');
  } catch (err) {
    console.error('Fehler beim Zurücksetzen der Datenbank:', err);
  } finally {
    await mongoose.connection.close();
    console.log('Verbindung geschlossen.');
    process.exit(0);
  }
}

resetDatabase(); 