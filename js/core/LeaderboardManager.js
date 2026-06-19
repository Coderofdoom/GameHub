/**
 * LeaderboardManager — global and local leaderboards.
 */
const LeaderboardManager = (() => {
  const BOT_NAMES = ["ShadowX", "Nova", "Blaze", "Cipher", "Echo", "Vortex", "Pixel", "Nexus", "Storm", "Frost"];

  function seedBots() {
    let board = SaveManager.loadLeaderboard();
    if (board.length >= 5) return board;

    board = BOT_NAMES.map((name, i) => ({
      username: name,
      xp: 15000 - i * 1200 + Math.floor(Math.random() * 500),
      level: 40 - i * 3,
      wins: 100 - i * 8,
      isBot: true,
    }));

    SaveManager.saveLeaderboard(board);
    return board;
  }

  function updatePlayer(player) {
    let board = SaveManager.loadLeaderboard();
    const idx = board.findIndex((p) => p.username === player.username && !p.isBot);

    const entry = {
      username: player.username,
      xp: player.xp,
      level: player.level,
      wins: player.wins,
      prestige: player.prestige,
      isBot: false,
    };

    if (idx >= 0) board[idx] = entry;
    else board.push(entry);

    board.sort((a, b) => b.xp - a.xp || b.wins - a.wins);
    SaveManager.saveLeaderboard(board);
    return board;
  }

  function addLocalScore(gameId, score, player) {
    let local = SaveManager.loadLocalLeaderboard();
    local.push({
      game: gameId,
      username: player.username,
      score,
      date: Date.now(),
    });

    local.sort((a, b) => b.score - a.score);
    local = local.slice(0, 100);
    SaveManager.saveLocalLeaderboard(local);
    return local.filter((e) => e.game === gameId).slice(0, 10);
  }

  function getGlobal(limit = 10) {
    const board = SaveManager.loadLeaderboard();
    if (board.length < 5) seedBots();
    return SaveManager.loadLeaderboard().slice(0, limit);
  }

  function getLocal(gameId, limit = 10) {
    return SaveManager.loadLocalLeaderboard()
      .filter((e) => e.game === gameId)
      .slice(0, limit);
  }

  function getPlayerRank(player) {
    const board = getGlobal(100);
    const idx = board.findIndex((p) => p.username === player.username);
    return idx >= 0 ? idx + 1 : null;
  }

  return { seedBots, updatePlayer, addLocalScore, getGlobal, getLocal, getPlayerRank };
})();

if (typeof window !== "undefined") window.LeaderboardManager = LeaderboardManager;
