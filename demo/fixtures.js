/**
 * Fixture data for the offline demo build.
 *
 * Shapes mirror what back/ actually returns (see contract.json and
 * back/modules/*): cards carry id/name/type/cost/attack/defense/image_url,
 * the user carries id/username/email/avatar_url/coins/rating, game history
 * rows carry p1/p2/result/created_at.
 *
 * Everything is in memory. Reloading the page resets it.
 */

/**
 * Asset paths stay relative so the build works from any subdirectory
 * (GitHub Pages project sites). Pages live one level down in `pages/`, the
 * entry page does not — resolve that at runtime rather than hard-coding it.
 */
const A = /\/pages\//.test(globalThis.location?.pathname ?? '') ? '../assets' : './assets'
const cardArt = (slug) => `${A}/cards/${slug}.svg`
const avatar = (slug) => `${A}/avatars/${slug}.svg`

export const ASSET_BASE = A

export const DEMO_USER = {
  id: 1,
  username: 'DemoPlayer',
  email: 'demo@cardgame.local',
  avatar_url: avatar('demo'),
  coins: 1450,
  rating: 2310,
  wins: 34,
  losses: 19,
  created_at: '2025-02-11T10:20:00.000Z'
}

export const RIVAL_USER = {
  id: 2,
  username: 'NyxRaven',
  avatar_url: avatar('rival'),
  coins: 980,
  rating: 2265
}

/** The full card pool — `GET /api/cards`. */
export const ALL_CARDS = [
  { id: 1, name: 'Warrior', type: 'COMMON', cost: 40, attack: 42, defense: 38, image_url: cardArt('warrior'),
    description: 'Frontline infantry. Cheap, reliable, and dies on schedule.' },
  { id: 2, name: 'Ranger', type: 'COMMON', cost: 45, attack: 48, defense: 30, image_url: cardArt('archer'),
    description: 'Strikes first from range, folds the moment anything reaches her.' },
  { id: 3, name: 'Warden', type: 'COMMON', cost: 45, attack: 28, defense: 55, image_url: cardArt('warden'),
    description: 'Holds the line. Will not win you the game, will stop you losing it.' },
  { id: 4, name: 'Paladin', type: 'RARE', cost: 70, attack: 58, defense: 62, image_url: cardArt('paladin'),
    description: 'Balanced attack and defence with heavy plate to back it up.' },
  { id: 5, name: 'Stone Golem', type: 'RARE', cost: 75, attack: 44, defense: 80, image_url: cardArt('golem'),
    description: 'Almost impossible to break through, almost as slow to break anything.' },
  { id: 6, name: 'Nightblade', type: 'RARE', cost: 72, attack: 74, defense: 26, image_url: cardArt('assassin'),
    description: 'Glass dagger. Wins the exchange or loses the card.' },
  { id: 7, name: 'Titan', type: 'EPIC', cost: 95, attack: 82, defense: 70, image_url: cardArt('titan'),
    description: 'Raw strength with no finesse whatsoever, and no need for any.' },
  { id: 8, name: 'Archmage', type: 'EPIC', cost: 98, attack: 88, defense: 52, image_url: cardArt('archmage'),
    description: 'Burns through armour. Anything that reaches him wins.' },
  { id: 9, name: 'Valkyrie', type: 'EPIC', cost: 92, attack: 76, defense: 68, image_url: cardArt('valkyrie'),
    description: 'Chooses the slain. Consistently good, never spectacular.' },
  { id: 10, name: 'Necromancer', type: 'MYTHICAL', cost: 120, attack: 90, defense: 64, image_url: cardArt('necromancer'),
    description: 'Trades your board for his. The most hated card in the pool.' },
  { id: 11, name: 'Ashen Dragon', type: 'LEGENDARY', cost: 150, attack: 96, defense: 88, image_url: cardArt('dragon'),
    description: 'The reason people keep opening boosters.' },
  { id: 12, name: 'Phoenix', type: 'LEGENDARY', cost: 145, attack: 92, defense: 94, image_url: cardArt('phoenix'),
    description: 'Comes back. Always comes back.' }
]

/** Cards the demo player owns — `GET /api/my-cards`. Ids reference ALL_CARDS. */
export const OWNED_CARD_IDS = [
  { id: 1, count: 4 },
  { id: 2, count: 3 },
  { id: 3, count: 2 },
  { id: 4, count: 2 },
  { id: 5, count: 1 },
  { id: 6, count: 2 },
  { id: 7, count: 1 },
  { id: 9, count: 1 },
  { id: 11, count: 1 }
]

/** `GET /api/users/top` */
export const TOP_PLAYERS = [
  { id: 7, username: 'IronVeil', rating: 2884, avatar_url: avatar('p1') },
  { id: 5, username: 'Kasparow', rating: 2612, avatar_url: avatar('p2') },
  { id: 1, username: 'DemoPlayer', rating: 2310, avatar_url: avatar('demo') },
  { id: 2, username: 'NyxRaven', rating: 2265, avatar_url: avatar('rival') },
  { id: 9, username: 'Solstice', rating: 2104, avatar_url: avatar('p3') }
]

const hoursAgo = (h) => new Date(Date.now() - h * 3600 * 1000).toISOString()

/** `GET /api/games/history` */
export const GAME_HISTORY = [
  { id: 412, p1: 'DemoPlayer', p2: 'NyxRaven', result: 'IN_PROGRESS', created_at: hoursAgo(0.3) },
  { id: 411, p1: 'DemoPlayer', p2: 'IronVeil', result: 'ENDED', created_at: hoursAgo(5) },
  { id: 410, p1: 'Solstice', p2: 'DemoPlayer', result: 'ENDED', created_at: hoursAgo(27) },
  { id: 409, p1: 'DemoPlayer', p2: 'Kasparow', result: 'ENDED', created_at: hoursAgo(50) },
  { id: 408, p1: 'DemoPlayer', p2: 'NyxRaven', result: 'CREATED', created_at: hoursAgo(74) }
]

/** Booster contents used by the scripted pack-opening animation. */
export const PACK_POOL = {
  common: [1, 2, 3, 4, 6],
  rare: [4, 5, 6, 9],
  epic: [7, 8, 9, 10],
  legendary: [10, 11, 12]
}

export const DEMO_GAME_CODE = 'NYX7QF'
