const User = require('../models/User');
const MiningEvent = require('../models/MiningEvent');

// Basiswert für Mining-Belohnungen pro Stunde
const BASE_MINING_REWARD = 10;

// Mining-Prozess für alle aktiven Benutzer
const mineForAllUsers = async () => {
  try {
    console.log('Mining-Prozess gestartet...');
    
    // Alle Benutzer abrufen
    const users = await User.find({});
    
    for (const user of users) {
      // Berechne die Mining-Rate für den Benutzer
      const miningRate = await user.calculateMiningRate();
      
      // Berechne die Mining-Belohnung
      const baseReward = BASE_MINING_REWARD;
      const innerCircleBonus = user.innerCircle.length * 0.2 * baseReward; // 20% pro Inner Circle Mitglied
      const otherBonus = (user.miningBoost - 1) * baseReward; // Andere Boosts
      
      const totalReward = baseReward + innerCircleBonus + otherBonus;
      
      // Füge die Belohnung zum Wallet des Benutzers hinzu
      if (typeof user.walletBalance !== 'number') {
        user.walletBalance = 0; // Sicherstellen, dass walletBalance eine Zahl ist
      }
      
      user.walletBalance += totalReward;
      user.lastMiningTime = Date.now();
      await user.save();
      
      // Erstelle einen Mining-Event-Eintrag
      await MiningEvent.create({
        user: user._id,
        amount: totalReward,
        miningRate: miningRate,
        innerCircleBonus: innerCircleBonus,
        otherBonus: otherBonus
      });
      
      console.log(`Mining für ${user.username}: +${totalReward} Coins (Rate: ${miningRate})`);
    }
    
    console.log('Mining-Prozess abgeschlossen');
  } catch (error) {
    console.error('Fehler beim Mining-Prozess:', error);
  }
};

// Mining-Timer starten (Standard: jede Stunde)
const startMiningTimer = () => {
  // Mining-Intervall aus Umgebungsvariable oder Standardwert (1 Stunde)
  const miningInterval = process.env.MINING_INTERVAL || 3600000; // 1 Stunde in Millisekunden
  
  console.log(`Mining-Timer gestartet. Intervall: ${miningInterval/1000} Sekunden`);
  
  // Initiales Mining durchführen
  mineForAllUsers();
  
  // Timer für regelmäßiges Mining einrichten
  setInterval(mineForAllUsers, miningInterval);
};

// Mining für einen einzelnen Benutzer manuell auslösen
const mineForUser = async (userId) => {
  try {
    console.log('Manuelles Mining für Benutzer:', userId);
    
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('Benutzer nicht gefunden');
    }
    
    // Prüfen, ob genügend Zeit seit dem letzten Mining vergangen ist
    const lastMiningTime = new Date(user.lastMiningTime).getTime();
    const currentTime = Date.now();
    const timeDifference = currentTime - lastMiningTime;
    const miningInterval = process.env.MINING_INTERVAL || 3600000;
    
    if (timeDifference < miningInterval) {
      const remainingTime = miningInterval - timeDifference;
      throw new Error(`Zu früh für Mining. Bitte warte noch ${Math.ceil(remainingTime/60000)} Minuten.`);
    }
    
    // Berechne die Mining-Rate für den Benutzer
    const miningRate = await user.calculateMiningRate();
    
    // Berechne die Mining-Belohnung
    const baseReward = BASE_MINING_REWARD;
    const innerCircleBonus = user.innerCircle.length * 0.2 * baseReward;
    const otherBonus = (user.miningBoost - 1) * baseReward;
    
    const totalReward = baseReward + innerCircleBonus + otherBonus;
    
    // Füge die Belohnung zum Wallet des Benutzers hinzu
    if (typeof user.walletBalance !== 'number') {
      user.walletBalance = 0; // Sicherstellen, dass walletBalance eine Zahl ist
    }
    
    user.walletBalance += totalReward;
    user.lastMiningTime = currentTime;
    await user.save();
    
    console.log(`Mining erfolgreich für ${user.username}: +${totalReward} Coins (Rate: ${miningRate})`);
    
    // Erstelle einen Mining-Event-Eintrag
    const miningEvent = await MiningEvent.create({
      user: user._id,
      amount: totalReward,
      miningRate: miningRate,
      innerCircleBonus: innerCircleBonus,
      otherBonus: otherBonus
    });
    
    return {
      success: true,
      miningEvent,
      reward: totalReward,
      newBalance: user.walletBalance
    };
  } catch (error) {
    console.error('Fehler beim manuellen Mining:', error);
    throw error;
  }
};

module.exports = {
  mineForAllUsers,
  startMiningTimer,
  mineForUser
}; 