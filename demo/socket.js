/**
 * Offline stand-in for the game WebSocket.
 *
 * `lobby.js` and `battle.js` open `ws://localhost:8080/gaming` directly. In the
 * static build there is no server, so `createGameSocket()` hands them this
 * object instead: same surface (`readyState`, `send`, `onopen`, `onmessage`,
 * `onerror`, `onclose`, `close`) and the same message envelope
 * `{ event, game | payload }` that back/modules/Game emits.
 *
 * The opponent is a scripted local bot, not another player. The battle it plays
 * is real in the sense that damage is resolved with the same attack/defence
 * rule as `utils/battle-logic.js`; it is not real in the sense that nothing
 * leaves the browser.
 */

import { ALL_CARDS, DEMO_GAME_CODE, DEMO_USER, RIVAL_USER } from './fixtures.js'
import { DEMO } from './mode.js'

const ME = DEMO_USER.id
const RIVAL = RIVAL_USER.id
const STARTING_HP = 100
const TURN_SECONDS = 10

const clone = (value) => JSON.parse(JSON.stringify(value))

/** Six cards each, drawn from the pool the demo player owns. */
const startingDecks = () => {
  const pick = (ids) => ids.map((id) => ({ ...ALL_CARDS.find((c) => c.id === id), owner: null }))
  return {
    [ME]: pick([11, 7, 4, 6, 2, 1]).map((c) => ({ ...c, owner: ME })),
    [RIVAL]: pick([9, 5, 4, 3, 2, 1]).map((c) => ({ ...c, owner: RIVAL }))
  }
}

const newGame = () => ({
  id: 412,
  game_code: DEMO_GAME_CODE,
  host_user_id: ME,
  user_ids: [ME, RIVAL],
  winner_id: null,
  status: 'CREATED',
  game_state: {
    players: {
      [ME]: { user_id: ME, username: DEMO_USER.username, avatar_url: DEMO_USER.avatar_url },
      [RIVAL]: { user_id: RIVAL, username: RIVAL_USER.username, avatar_url: RIVAL_USER.avatar_url }
    },
    decks: {},
    health: { [ME]: STARTING_HP, [RIVAL]: STARTING_HP },
    selected: {},
    readies: {}
  }
})

/**
 * Same rule as utils/battle-logic.js resolveBattle(): whoever would take more
 * damage loses the exchange, and the winner's surplus is dealt to them.
 */
const resolve = (mine, theirs) => {
  const damageToMe = theirs.attack - mine.defense
  const damageToThem = mine.attack - theirs.defense
  if (damageToMe > damageToThem) return { loser: ME, damage: Math.max(0, damageToMe) }
  if (damageToThem > damageToMe) return { loser: RIVAL, damage: Math.max(0, damageToThem) }
  return { loser: null, damage: 0 }
}

class DemoGameSocket {
  static CONNECTING = 0
  static OPEN = 1
  static CLOSING = 2
  static CLOSED = 3

  constructor() {
    this.readyState = DemoGameSocket.CONNECTING
    this.onopen = null
    this.onmessage = null
    this.onerror = null
    this.onclose = null

    this.game = newGame()
    this.timers = []
    this.timerHandle = null

    this.timers.push(
      setTimeout(() => {
        this.readyState = DemoGameSocket.OPEN
        this.onopen?.({ type: 'open' })
      }, 120)
    )
  }

  /* -------------------------------------------------------------- plumbing */

  emit(event, body = {}, delay = 0) {
    const payload = JSON.stringify({ event, ...clone(body) })
    this.timers.push(
      setTimeout(() => {
        if (this.readyState === DemoGameSocket.CLOSED) return
        this.onmessage?.({ data: payload })
      }, delay)
    )
  }

  send(raw) {
    let message
    try {
      message = JSON.parse(raw)
    } catch {
      return
    }
    const { event, payload = {} } = message
    const handler = this[`on_${event}`]
    if (typeof handler === 'function') handler.call(this, payload)
  }

  close() {
    this.readyState = DemoGameSocket.CLOSED
    this.timers.forEach(clearTimeout)
    clearInterval(this.timerHandle)
    this.onclose?.({ type: 'close' })
  }

  /* ----------------------------------------------------------- lobby flow */

  on_createGame() {
    this.game.game_state.decks = {}
    this.emit('gameCreated', { game: this.game }, 200)
    // The scripted opponent walks in a moment later.
    this.emit('playerJoined', { game: this.game }, 1600)
  }

  on_joinGame() {
    // The battle screen asks for state as soon as it connects.
    if (!Object.keys(this.game.game_state.decks).length) {
      this.game.game_state.decks = startingDecks()
    }
    this.game.status = 'IN_PROGRESS'
    this.emit('gameData', { game: this.game }, 260)
    this.emit('startRound', {}, 700)
    this.startTurnTimer()
  }

  on_selectDeck({ cardIds = [] } = {}) {
    const decks = startingDecks()
    // Honour the player's actual six picks where we can resolve them.
    const chosen = cardIds
      .map((id) => ALL_CARDS.find((c) => Number(c.id) === Number(id)))
      .filter(Boolean)
      .map((c) => ({ ...c, owner: ME }))
    this.game.game_state.decks[ME] = chosen.length ? chosen : decks[ME]

    this.emit('deckSelected', { player: ME, deck: this.game.game_state.decks[ME] }, 150)

    this.timers.push(
      setTimeout(() => {
        this.game.game_state.decks[RIVAL] = decks[RIVAL]
        this.emit('deckSelected', { player: RIVAL, deck: decks[RIVAL] }, 0)
        this.emit('decksSelected', { game: this.game }, 150)
      }, 1400)
    )
  }

  on_startGame() {
    this.game.status = 'IN_PROGRESS'
    this.emit('gameStarted', { game: this.game }, 300)
  }

  on_getGame() {
    this.emit('gameData', { game: this.game }, 150)
  }

  on_getGameByCode() {
    this.emit('gameDataByCode', { game: this.game }, 150)
  }

  /* ---------------------------------------------------------- battle flow */

  startTurnTimer() {
    clearInterval(this.timerHandle)
    let left = TURN_SECONDS
    this.timerHandle = setInterval(() => {
      if (this.readyState === DemoGameSocket.CLOSED) return clearInterval(this.timerHandle)
      this.onmessage?.({ data: JSON.stringify({ event: 'updateTimer', payload: { timeLeft: left } }) })
      left -= 1
      if (left < 0) left = TURN_SECONDS
    }, 1000)
  }

  on_playCard({ cardId } = {}) {
    const gs = this.game.game_state
    const myDeck = gs.decks[ME] || []
    const rivalDeck = gs.decks[RIVAL] || []

    const mine = myDeck.find((c) => String(c.id) === String(cardId)) || myDeck[0]
    if (!mine) return
    // The bot leads with its strongest remaining card.
    const theirs = [...rivalDeck].sort((a, b) => b.attack - a.attack)[0]
    if (!theirs) return

    gs.decks[ME] = myDeck.filter((c) => c !== mine)
    gs.decks[RIVAL] = rivalDeck.filter((c) => c !== theirs)

    const { loser, damage } = resolve(mine, theirs)
    if (loser) gs.health[loser] = Math.max(0, gs.health[loser] - damage)

    gs.selected = { [ME]: mine, [RIVAL]: theirs }

    this.emit('cardPlayed', { game: this.game, cardId }, 220)
    this.emit('endRound', { game: this.game }, 400)

    const over =
      gs.health[ME] <= 0 || gs.health[RIVAL] <= 0 || (!gs.decks[ME].length && !gs.decks[RIVAL].length)

    if (over) {
      this.game.winner_id =
        gs.health[ME] === gs.health[RIVAL] ? null : gs.health[ME] > gs.health[RIVAL] ? ME : RIVAL
      this.emit('gameEnded', { game: this.game }, 2400)
      clearInterval(this.timerHandle)
    } else {
      // Clear the board for the next exchange.
      this.timers.push(
        setTimeout(() => {
          gs.selected = {}
          this.startTurnTimer()
          this.emit('startRound', {}, 0)
        }, 2200)
      )
    }
  }

  /** Two cards dragged together become one stronger card. */
  on_mergeCards({ cardIds = [] } = {}) {
    const gs = this.game.game_state
    const deck = gs.decks[ME] || []
    const [a, b] = cardIds.map((id) => deck.find((c) => String(c.id) === String(id)))
    if (!a || !b || a === b) return

    const merged = {
      ...a,
      id: `${a.id}-${b.id}`,
      name: `${a.name} + ${b.name}`,
      attack: Math.min(100, Math.round(a.attack + b.attack * 0.6)),
      defense: Math.min(100, Math.round(a.defense + b.defense * 0.6)),
      owner: ME
    }
    gs.decks[ME] = [merged, ...deck.filter((c) => c !== a && c !== b)]
    this.emit('mergedCards', { game: this.game, cardIds }, 200)
  }

  on_surrender() {
    this.game.winner_id = RIVAL
    this.emit('playerSurrendered', { player: ME }, 150)
    this.emit('gameEnded', { game: this.game, winner: RIVAL }, 400)
    clearInterval(this.timerHandle)
  }
}

/**
 * Returns a real WebSocket when the app is pointed at a live backend, and the
 * scripted demo socket otherwise.
 */
export const createGameSocket = (url) => (DEMO ? new DemoGameSocket() : new WebSocket(url))
