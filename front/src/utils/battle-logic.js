// battle-logic.js — ядро бойової логіки гри (друга частина)

export function resolveBattle(cardA, cardB) {
  const diff = Math.abs(cardA.attack - cardB.attack);
  let winner = null;
  let loser = null;

  if (cardA.attack !== undefined && cardB.attack !== undefined) {
    if (cardA.attack > cardB.attack) {
      winner = cardA.owner;
      loser = cardB.owner;
    } else if (cardB.attack > cardA.attack) {
      winner = cardB.owner;
      loser = cardA.owner;
    } else {
      // ничья по атаке
      winner = null;
      loser = null;
    }
  }

  return {
    cardA,
    cardB,
    winner,
    loser,
    damage: winner ? diff : 0,
    isDraw: !winner,
    survivorCard:
      winner === cardA.owner ? cardA : winner === cardB.owner ? cardB : null,
  };
}

export function applyDamage(health, loserId, damage) {
  const current = health[loserId] ?? 0;
  const next = Math.max(0, current - damage);
  return { ...health, [loserId]: next };
}

export function checkGameOver(health) {
  return Object.entries(health).find(([_, hp]) => hp <= 0);
}

export function simulateTurn({ state, cardA, cardB }) {
  const outcome = resolveBattle(cardA, cardB);
  if (outcome.winner) {
    state.health = applyDamage(state.health, outcome.loser, outcome.damage);
  }

  const gameOver = checkGameOver(state.health);

  console.log("⚔️ Resolving:", {
    cardA: { name: cardA.name, attack: cardA.attack, owner: cardA.owner },
    cardB: { name: cardB.name, attack: cardB.attack, owner: cardB.owner },
  });

  return {
    newState: {
      ...state,
      playedCards: {},
      readies: {},
    },
    outcome: {
      ...outcome,
      isGameOver: !!gameOver,
    },
    winnerId: gameOver ? outcome.winner : null,
  };
}
