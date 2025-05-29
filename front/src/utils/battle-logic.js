// battle-logic.js — ядро бойової логіки гри (друга частина)

export function resolveBattle(cardA, cardB) {
  let winner = null;
  let loser = null;
  let damage = 0;

  if (
    cardA.attack !== undefined &&
    cardB.attack !== undefined &&
    cardA.defense !== undefined &&
    cardB.defense !== undefined
  ) {
    // кто выжил?
    const damageToA = cardB.attack - cardA.defense;
    const damageToB = cardA.attack - cardB.defense;

    console.log("🛡️ Attack vs Defense:", {
      cardA: { attack: cardA.attack, defense: cardA.defense },
      cardB: { attack: cardB.attack, defense: cardB.defense },
      damageToA,
      damageToB,
    });

		// Определение победителя
    if (damageToA > damageToB) {
      winner = cardB.owner;
      loser = cardA.owner;
      damage = Math.max(0, damageToA);
    } else if (damageToB > damageToA) {
      winner = cardA.owner;
      loser = cardB.owner;
      damage = Math.max(0, damageToB);
    } else {
      // ничья
      winner = null;
      loser = null;
      damage = 0;
    }
  }

  return {
    cardA,
    cardB,
    winner,
    loser,
    damage,
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
