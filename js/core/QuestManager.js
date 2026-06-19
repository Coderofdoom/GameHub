/**
 * QuestManager — daily quests, weekly quests, and missions.
 */
const QuestManager = (() => {
  const DAILY_POOL = [
    { id: "play_snake", text: "Play Snake", target: 1, type: "play", game: "snake", reward: { xp: 50, coins: 30 } },
    { id: "play_any_3", text: "Play 3 games", target: 3, type: "play_any", reward: { xp: 75, coins: 50 } },
    { id: "earn_xp_200", text: "Earn 200 XP", target: 200, type: "xp", reward: { coins: 75, gems: 2 } },
    { id: "earn_coins_100", text: "Earn 100 coins", target: 100, type: "coins", reward: { xp: 50, coins: 25 } },
    { id: "win_game", text: "Win a game", target: 1, type: "win", reward: { xp: 100, coins: 60 } },
    { id: "score_snake_50", text: "Score 50 in Snake", target: 50, type: "score", game: "snake", reward: { xp: 60, coins: 40 } },
    { id: "kill_20", text: "Get 20 kills", target: 20, type: "kills", reward: { xp: 80, coins: 50 } },
  ];

  const WEEKLY_POOL = [
    { id: "play_15", text: "Play 15 games", target: 15, type: "play_any", reward: { xp: 300, coins: 200, gems: 10 } },
    { id: "win_5", text: "Win 5 games", target: 5, type: "win", reward: { xp: 400, coins: 250, gems: 15 } },
    { id: "earn_xp_1000", text: "Earn 1000 XP", target: 1000, type: "xp", reward: { coins: 500, gems: 20 } },
    { id: "shop_buy", text: "Buy 2 shop items", target: 2, type: "shop", reward: { xp: 200, gems: 10 } },
  ];

  const MISSIONS = [
    { id: "mission_snake_master", text: "Reach score 100 in Snake", target: 100, type: "score", game: "snake", reward: { xp: 500, coins: 300, gems: 15 } },
    { id: "mission_shooter_ace", text: "Defeat a boss in Space Shooter", target: 1, type: "boss", game: "shooter", reward: { xp: 400, coins: 250, gems: 10 } },
    { id: "mission_platform_boss", text: "Defeat a boss in Platformer", target: 1, type: "boss", game: "platformer", reward: { xp: 450, coins: 280, gems: 12 } },
    { id: "mission_racer_drift", text: "Drift 50 times in Racer", target: 50, type: "drift", game: "racer", reward: { xp: 350, coins: 200 } },
    { id: "mission_zombie_quest", text: "Complete a quest in Zombie World", target: 1, type: "quest", game: "zombie", reward: { xp: 400, gems: 15 } },
    { id: "mission_blockcraft_night", text: "Survive night in BlockCraft", target: 1, type: "survive_night", game: "blockcraft", reward: { xp: 300, coins: 200 } },
  ];

  function pickRandom(pool, count) {
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count).map((q) => ({ ...q, progress: 0, claimed: false }));
  }

  function resetIfNeeded(player) {
    const now = Date.now();
    const day = 86400000;
    const week = day * 7;

    if (!player.quests.lastDailyReset || now - player.quests.lastDailyReset > day) {
      player.quests.daily = pickRandom(DAILY_POOL, 3);
      player.quests.lastDailyReset = now;
    }

    if (!player.quests.lastWeeklyReset || now - player.quests.lastWeeklyReset > week) {
      player.quests.weekly = pickRandom(WEEKLY_POOL, 2);
      player.quests.lastWeeklyReset = now;
    }

    if (!player.quests.missions || player.quests.missions.length === 0) {
      player.quests.missions = MISSIONS.map((m) => ({ ...m, progress: 0, claimed: false }));
    }
  }

  function updateProgress(player, event) {
    resetIfNeeded(player);
    const all = [...player.quests.daily, ...player.quests.weekly, ...player.quests.missions];

    all.forEach((q) => {
      if (q.claimed) return;

      switch (q.type) {
        case "play":
          if (event.type === "play" && event.game === q.game) q.progress += 1;
          break;
        case "play_any":
          if (event.type === "play") q.progress += 1;
          break;
        case "win":
          if (event.type === "win") q.progress += 1;
          break;
        case "xp":
          if (event.type === "xp") q.progress += event.amount || 0;
          break;
        case "coins":
          if (event.type === "coins") q.progress += event.amount || 0;
          break;
        case "score":
          if (event.type === "score" && event.game === q.game) q.progress = Math.max(q.progress, event.score);
          break;
        case "kills":
          if (event.type === "kills") q.progress += event.amount || 0;
          break;
        case "shop":
          if (event.type === "shop") q.progress += 1;
          break;
        case "boss":
          if (event.type === "boss" && event.game === q.game) q.progress += 1;
          break;
        case "drift":
          if (event.type === "drift") q.progress += event.amount || 1;
          break;
        case "quest":
          if (event.type === "quest" && event.game === q.game) q.progress += 1;
          break;
        case "survive_night":
          if (event.type === "survive_night" && event.game === q.game) q.progress += 1;
          break;
      }

      q.progress = Math.min(q.progress, q.target);
    });
  }

  function claimQuest(player, listType, index) {
    const list = player.quests[listType];
    if (!list || !list[index]) return false;
    const q = list[index];
    if (q.claimed || q.progress < q.target) return false;

    q.claimed = true;
    if (q.reward.xp) XPManager.addXP(player, q.reward.xp, window.GameHub?.managers);
    if (q.reward.coins) player.coins += q.reward.coins;
    if (q.reward.gems) player.gems += q.reward.gems;
    return q;
  }

  function getAllQuests(player) {
    resetIfNeeded(player);
    return player.quests;
  }

  return { DAILY_POOL, WEEKLY_POOL, MISSIONS, resetIfNeeded, updateProgress, claimQuest, getAllQuests };
})();

if (typeof window !== "undefined") window.QuestManager = QuestManager;
