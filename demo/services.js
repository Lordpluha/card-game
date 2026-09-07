/**
 * Fixture-backed stand-ins for the five API service classes.
 *
 * Each object exposes exactly the same method names and return shapes as its
 * real counterpart in `src/api/`, so nothing above the service layer changes.
 * State lives in the tab's sessionStorage (several screens force a reload after
 * a mutation) and there is no network traffic of any kind.
 */

import {
  ALL_CARDS,
  DEMO_USER,
  GAME_HISTORY,
  OWNED_CARD_IDS,
  PACK_POOL,
  TOP_PLAYERS
} from './fixtures.js'
import { tick } from './mode.js'

/* ----------------------------------------------------------- session state */

/**
 * Kept in sessionStorage rather than a plain module variable because several
 * screens force a full `location.reload()` after a mutation (see
 * utils/packs.js), which would otherwise throw the change away immediately.
 * Scope is one browser tab; closing it resets the demo.
 */
const STORE_KEY = 'cardgame.demo.v1'

const freshState = () => ({
  user: { ...DEMO_USER },
  /** owned cards as {id, count} */
  owned: OWNED_CARD_IDS.map((c) => ({ ...c })),
  /** per-card stat upgrades applied this session */
  upgrades: {},
  history: GAME_HISTORY.map((g) => ({ ...g }))
})

const loadState = () => {
  try {
    const raw = sessionStorage.getItem(STORE_KEY)
    if (!raw) return freshState()
    const parsed = JSON.parse(raw)
    return parsed && parsed.user && Array.isArray(parsed.owned) ? parsed : freshState()
  } catch {
    return freshState()
  }
}

const state = loadState()

const save = () => {
  try {
    sessionStorage.setItem(STORE_KEY, JSON.stringify(state))
  } catch {
    /* private mode / storage disabled — the demo still works, it just resets */
  }
}

const baseCard = (id) => ALL_CARDS.find((c) => Number(c.id) === Number(id))

const hydrate = (entry) => {
  const base = baseCard(entry.id)
  if (!base) return null
  const up = state.upgrades[entry.id] || { attack: 0, defense: 0 }
  return {
    ...base,
    attack: Math.min(100, base.attack + up.attack),
    defense: Math.min(100, base.defense + up.defense),
    count: entry.count
  }
}

export const ownedCards = () => state.owned.map(hydrate).filter(Boolean)
export const demoUser = () => ({ ...state.user })

/* ------------------------------------------------------------------ Auth */

export const demoAuthService = {
  async login() {
    // No credential store exists in a static build, so this deliberately does
    // not pretend to authenticate anyone.
    await tick()
    return new Response(
      JSON.stringify({ message: 'Static demo: sign-in is disabled. You are already playing as DemoPlayer.' }),
      { status: 501, headers: { 'Content-Type': 'application/json' } }
    )
  },
  async register() {
    await tick()
    return new Response(
      JSON.stringify({ message: 'Static demo: registration is disabled. Open the main menu to explore as DemoPlayer.' }),
      { status: 501, headers: { 'Content-Type': 'application/json' } }
    )
  },
  async refresh() {
    await tick(40)
    return { message: 'demo session' }
  },
  async logout() {
    await tick(40)
    return new Response(JSON.stringify({ message: 'Static demo: nothing to sign out of.' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

/* ------------------------------------------------------------------ User */

export const demoUserService = {
  async getUser() {
    await tick()
    return demoUser()
  },
  async updateSettings(settings = {}) {
    await tick()
    if (typeof settings.username === 'string' && settings.username.trim()) {
      state.user.username = settings.username.trim()
    }
    if (typeof settings.avatar_url === 'string' && settings.avatar_url) {
      state.user.avatar_url = settings.avatar_url
    }
    save()
    return demoUser()
  },
  async getByUsername(username) {
    await tick()
    const found = TOP_PLAYERS.find((p) => p.username === username)
    return found ? { ...found } : demoUser()
  },
  async getTopPlayers() {
    await tick()
    return TOP_PLAYERS.map((p) => ({ ...p }))
  }
}

/* ----------------------------------------------------------------- Cards */

export const demoCardsService = {
  async getAll() {
    await tick()
    return ALL_CARDS.map((c) => {
      const up = state.upgrades[c.id] || { attack: 0, defense: 0 }
      return { ...c, attack: Math.min(100, c.attack + up.attack), defense: Math.min(100, c.defense + up.defense) }
    })
  },

  async getMyCards() {
    await tick()
    return ownedCards()
  },

  async getById(id) {
    await tick()
    const entry = state.owned.find((c) => Number(c.id) === Number(id))
    return entry ? hydrate(entry) : { ...baseCard(id) }
  },

  async craft(ids) {
    await tick()
    return { message: 'Crafting is not part of the static demo.', ids }
  },

  /** Two duplicates become one card of the next rarity up. */
  async merge(ids = []) {
    await tick(260)
    const [a, b] = ids.map((id) => state.owned.find((c) => Number(c.id) === Number(id)))
    if (!a || !b) return { message: 'Select two cards you own.' }

    const LADDER = ['COMMON', 'RARE', 'EPIC', 'MYTHICAL', 'LEGENDARY']
    const best = [a, b]
      .map((e) => baseCard(e.id))
      .sort((x, y) => LADDER.indexOf(y.type) - LADDER.indexOf(x.type))[0]
    const nextTier = LADDER[Math.min(LADDER.length - 1, LADDER.indexOf(best.type) + 1)]
    const reward =
      ALL_CARDS.find((c) => c.type === nextTier && !state.owned.some((o) => o.id === c.id)) ||
      ALL_CARDS.find((c) => c.type === nextTier) ||
      best

    ids.forEach((id) => {
      const entry = state.owned.find((c) => Number(c.id) === Number(id))
      if (!entry) return
      entry.count -= 1
      if (entry.count <= 0) state.owned = state.owned.filter((c) => c !== entry)
    })

    const existing = state.owned.find((c) => Number(c.id) === Number(reward.id))
    if (existing) existing.count += 1
    else state.owned.push({ id: reward.id, count: 1 })
    save()

    return { card: hydrate({ id: reward.id, count: existing ? existing.count : 1 }) }
  },

  /** +6 attack / +6 defense for 50 coins, capped at 100. */
  async upgrade(id) {
    await tick(220)
    const base = baseCard(id)
    if (!base) throw new Error('Unknown card')
    if (state.user.coins < 50) throw new Error('Not enough coins')

    state.user.coins -= 50
    const up = state.upgrades[id] || { attack: 0, defense: 0 }
    state.upgrades[id] = {
      attack: Math.min(100 - base.attack, up.attack + 6),
      defense: Math.min(100 - base.defense, up.defense + 6)
    }
    save()
    const entry = state.owned.find((c) => Number(c.id) === Number(id)) || { id, count: 1 }
    return hydrate(entry)
  },

  async addToUserCards(newCards = []) {
    newCards.forEach((card) => {
      const existing = state.owned.find((c) => Number(c.id) === Number(card.id))
      if (existing) existing.count += 1
      else state.owned.push({ id: card.id, count: 1 })
    })
    save()
  },

  /** Weighted so a legendary stays rare enough to feel like one. */
  async openPack(type = 'common') {
    await tick(380)
    if (state.user.coins < 100) throw new Error('Not enough coins to open a booster')
    state.user.coins -= 100

    const pool = PACK_POOL[type] || PACK_POOL.common
    const roll = Math.random()
    const pick = roll > 0.93 ? pool[pool.length - 1] : pool[Math.floor(Math.random() * (pool.length - 1))]

    const existing = state.owned.find((c) => Number(c.id) === Number(pick))
    if (existing) existing.count += 1
    else state.owned.push({ id: pick, count: 1 })
    save()

    return [hydrate({ id: pick, count: existing ? existing.count : 1 })]
  }
}

/* ----------------------------------------------------------------- Games */

export const demoGameService = {
  async getGames() {
    await tick()
    return state.history.map((g) => ({ ...g }))
  },
  async getGame(id) {
    await tick()
    return state.history.find((g) => Number(g.id) === Number(id)) || null
  },
  async getHistory() {
    await tick()
    return state.history.map((g) => ({ ...g }))
  }
}
