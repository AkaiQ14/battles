// js/mode-tournament.js
// Adapter for tournament mode

window.GameModeTournament = {
  detect() {
    const currentMatchId = localStorage.getItem('currentMatchId');
    const currentMatchPlayers = localStorage.getItem('currentMatchPlayers');
    return Boolean(currentMatchId && currentMatchPlayers);
  },

  loadConfig(defaults) {
    const tournamentRounds = localStorage.getItem('tournamentRounds');
    const roundCount = tournamentRounds ? parseInt(tournamentRounds) : defaults.rounds;
    let player1 = defaults.player1;
    let player2 = defaults.player2;
    try {
      const currentMatchPlayers = localStorage.getItem('currentMatchPlayers');
      if (currentMatchPlayers) {
        const players = JSON.parse(currentMatchPlayers);
        player1 = players[0];
        player2 = players[1];
      }
    } catch (_) {}
    return {
      isTournament: true,
      roundCount,
      startingHP: roundCount,
      player1,
      player2
    };
  },

  onGameEnd(winner) {
    // Save winner name for bracket and go to final-result which will route back
    localStorage.setItem('matchWinner', winner);
    window.location.href = 'final-result.html';
  }
};


