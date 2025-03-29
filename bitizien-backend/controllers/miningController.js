const User = require('../models/User');

// Mining-Statistiken abrufen
exports.getMiningStats = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Benutzer nicht gefunden' });
    }

    const lastMining = user.lastMiningTime ? new Date(user.lastMiningTime) : new Date(0);
    const now = new Date();
    const timeDiff = now - lastMining;
    const canMineNow = timeDiff >= 24 * 60 * 60 * 1000; // 24 Stunden in Millisekunden

    const timeUntilNextMining = canMineNow ? 0 : 
      Math.ceil((24 * 60 * 60 * 1000 - timeDiff) / (60 * 1000)); // Verbleibende Minuten

    res.json({
      success: true,
      data: {
        walletBalance: user.walletBalance,
        miningRate: 1.0, // Basis-Rate
        innerCircleCount: user.innerCircle?.length || 0,
        innerCircleBonus: 0.1 * (user.innerCircle?.length || 0), // 10% pro Inner Circle Mitglied
        miningBoost: 1 + (0.1 * (user.innerCircle?.length || 0)), // Gesamtboost
        lastMiningTime: user.lastMiningTime,
        canMineNow: canMineNow,
        timeUntilNextMining: timeUntilNextMining
      }
    });
  } catch (error) {
    console.error('Fehler beim Abrufen der Mining-Statistiken:', error);
    res.status(500).json({ success: false, message: 'Server-Fehler beim Abrufen der Mining-Statistiken' });
  }
};

// Mining durchführen
exports.mine = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Benutzer nicht gefunden' });
    }

    // Prüfen, ob 24 Stunden seit dem letzten Mining vergangen sind
    const lastMining = user.lastMiningTime ? new Date(user.lastMiningTime) : new Date(0);
    const now = new Date();
    const timeDiff = now - lastMining;
    
    if (timeDiff < 24 * 60 * 60 * 1000) { // 24 Stunden in Millisekunden
      const hoursLeft = Math.ceil((24 * 60 * 60 * 1000 - timeDiff) / (1000 * 60 * 60));
      return res.status(400).json({ 
        success: false, 
        message: `Du kannst erst in ${hoursLeft} Stunden wieder minen.` 
      });
    }

    // Mining-Belohnung berechnen
    const baseReward = 1.0; // Basis-Belohnung
    const innerCircleBonus = 0.1 * (user.innerCircle?.length || 0); // 10% pro Inner Circle Mitglied
    const totalMultiplier = 1 + innerCircleBonus;
    const reward = baseReward * totalMultiplier;

    // Belohnung dem Wallet hinzufügen und Mining-Zeit aktualisieren
    user.walletBalance += reward;
    user.lastMiningTime = now;
    await user.save();

    res.json({
      success: true,
      data: {
        reward: reward,
        newBalance: user.walletBalance,
        nextMiningTime: new Date(now.getTime() + 24 * 60 * 60 * 1000)
      }
    });
  } catch (error) {
    console.error('Mining-Fehler:', error);
    res.status(500).json({ success: false, message: 'Server-Fehler beim Mining' });
  }
}; 