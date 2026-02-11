/**
 * Scoundrel Solo Card Game
 * A browser-based implementation of the solo dungeon-crawl card game
 *
 * Game Rules Summary:
 * - 44-card deck: 26 monsters (♣♠), 9 weapons (♦), 9 potions (♥)
 * - Start with 20 health
 * - Each turn: draw until 4 cards visible (the Room)
 * - Choose: Avoid (place all 4 on bottom of deck) or Face (resolve 3 of 4)
 * - Cannot avoid twice in a row
 * - Weapon rule: Can only fight monsters with value ≤ last defeated monster
 * - Scoring: Win = remaining health, Loss = negative sum of remaining monsters
 */

// ============================================
// UTILITIES
// ============================================

/**
 * Card Ranks to Values
 * 2-10: face value
 * J: 11, Q: 12, K: 13, A: 14
 */
const RANK_TO_VALUE = {
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
  '10': 10,
  J: 11,
  Q: 12,
  K: 13,
  A: 14,
}

/**
 * Fisher-Yates shuffle algorithm
 * @param {Array} array - Array to shuffle
 * @param {number} seed - Optional seed for deterministic shuffles
 * @returns {Array} Shuffled array
 */
function shuffle(array, seed = null) {
  const arr = [...array]

  // Simple seeded random if seed provided
  let random =
    seed !== null
      ? () => {
          seed = (seed * 9301 + 49297) % 233280
          return seed / 233280
        }
      : Math.random

  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/**
 * Create the initial deck (44 cards after removing Jokers and red face cards)
 * @returns {Array} Shuffled deck of card objects
 */
function createDeck() {
  const cards = []

  // Monsters: all clubs and spades (2-10, J, Q, K, A)
  for (const suit of ['♣', '♠']) {
    for (const rank of ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']) {
      cards.push({
        suit,
        rank,
        value: RANK_TO_VALUE[rank],
        type: 'monster',
      })
    }
  }

  // Weapons: diamonds 2-10
  for (const rank of ['2', '3', '4', '5', '6', '7', '8', '9', '10']) {
    cards.push({
      suit: '♦',
      rank,
      value: RANK_TO_VALUE[rank],
      type: 'weapon',
    })
  }

  // Potions: hearts 2-10
  for (const rank of ['2', '3', '4', '5', '6', '7', '8', '9', '10']) {
    cards.push({
      suit: '♥',
      rank,
      value: RANK_TO_VALUE[rank],
      type: 'potion',
    })
  }

  return shuffle(cards)
}

/**
 * Format a card for display
 * @param {Object} card - Card object
 * @returns {string} Formatted card string (e.g., "♦7")
 */
function formatCard(card) {
  return `${card.suit}${card.rank}`
}

/**
 * Get the image path for a card based on type and value
 * @param {Object} card - Card object
 * @returns {string} Path to the card image
 */
function getCardImagePath(card) {
  switch (card.type) {
    case 'potion':
      return '/assets/heart.jpg'

    case 'monster':
      if (card.suit === '♣') {
        if (card.value <= 5) return '/assets/club-1.jpg'
        if (card.value <= 10) return '/assets/club-2.jpg'
        return '/assets/club-3.jpg'
      } else if (card.suit === '♠') {
        if (card.value <= 5) return '/assets/spade-1.jpg'
        if (card.value <= 10) return '/assets/spade-2.jpg'
        return '/assets/spade-3.jpg'
      }
      break

    case 'weapon':
      if (card.value <= 4) return '/assets/diamond-1.jpg'
      if (card.value <= 7) return '/assets/diamond-2.jpg'
      return '/assets/diamond-3.jpg'
  }

  return ''
}

// ============================================
// GAME STATE
// ============================================

class Game {
  constructor() {
    this.reset()
  }

  reset() {
    // Deck management
    this.deck = createDeck()
    this.discardPile = []
    this.room = []

    // Player state
    this.health = 20
    this.weapon = null
    this.lastDefeatedValue = 14
    this.potionUsedThisTurn = false

    // Game state
    this.turn = 1
    this.gameActive = true
    this.lastRoomAvoided = false
    this.carryoverCard = null

    // Stack on weapon (for display)
    this.weaponStack = []
  }

  /**
   * Draw cards until room has 4 cards
   * Returns newly drawn cards
   */
  drawRoom() {
    const newCards = []

    if (this.carryoverCard) {
      this.room.push(this.carryoverCard)
      this.carryoverCard = null
    }

    while (this.room.length < 4 && this.deck.length > 0) {
      const card = this.deck.pop()
      this.room.push(card)
      newCards.push(card)
    }

    this.potionUsedThisTurn = false

    return newCards
  }

  /**
   * Avoid the current room
   * Place all 4 cards on the bottom of the deck
   */
  avoidRoom() {
    if (!this.canAvoid()) {
      return false
    }

    this.deck.unshift(...this.room)
    this.room = []
    this.carryoverCard = null
    this.lastRoomAvoided = true
    this.turn++

    return true
  }

  /**
   * Check if player can avoid
   */
  canAvoid() {
    return !this.lastRoomAvoided && this.gameActive
  }

  /**
   * Resolve a card from the room
   * @param {number} cardIndex - Index of card in room
   * @returns {Object} Result with messages
   */
  resolveCard(cardIndex) {
    if (cardIndex < 0 || cardIndex >= this.room.length || !this.gameActive) {
      return { success: false, messages: [] }
    }

    const card = this.room[cardIndex]
    const messages = []
    let damage = 0

    switch (card.type) {
      case 'weapon':
        messages.push(`Equipped ${formatCard(card)}`)
        this.weapon = card
        this.lastDefeatedValue = 14
        this.weaponStack = []
        break

      case 'potion':
        if (!this.potionUsedThisTurn) {
          const oldHealth = this.health
          this.health = Math.min(this.health + card.value, 20)
          const healed = this.health - oldHealth
          messages.push(`Drank ${formatCard(card)}, healed ${healed}`)
          this.potionUsedThisTurn = true
        } else {
          messages.push(`${formatCard(card)} discarded (already used potion)`)
        }
        break

      case 'monster': {
        const canUseWeapon = this.weapon && card.value <= this.lastDefeatedValue

        if (canUseWeapon) {
          damage = Math.max(0, card.value - this.weapon.value)
          messages.push(`Fought ${formatCard(card)} with ${formatCard(this.weapon)}`)

          if (damage === 0) {
            this.lastDefeatedValue = card.value
            this.weaponStack.push(card)
            messages.push(`Defeated! Stacked on weapon (max value: ${card.value})`)
          } else {
            messages.push(`Took ${damage} damage`)
          }
        } else {
          damage = card.value
          if (this.weapon) {
            messages.push(`Cannot use ${formatCard(this.weapon)} (monster too strong). Bare-handed!`)
          }
          messages.push(`Took ${damage} damage`)
        }

        this.health -= damage

        if (this.health <= 0) {
          this.gameActive = false
          messages.push('HEALTH CRITICAL! Game Over.')
        }
        break
      }
    }

    this.room.splice(cardIndex, 1)
    this.discardPile.push(card)

    return { success: true, messages, damage }
  }

  /**
   * End the current turn and prepare for next room
   * Sets carryover card (4th card remains as first of next room)
   */
  endTurn() {
    if (this.room.length > 0) {
      this.carryoverCard = this.room[0]
      this.room = []
    } else {
      this.carryoverCard = null
    }

    this.lastRoomAvoided = false
    this.turn++

    if (this.deck.length === 0 && this.room.length === 0 && !this.carryoverCard) {
      this.gameActive = false
    }
  }

  /**
   * Check if game is over
   */
  isGameOver() {
    return !this.gameActive
  }

  /**
   * Calculate final score
   */
  calculateScore() {
    if (this.health > 0) {
      return {
        won: true,
        score: this.health,
        message: `Victory! Final health: ${this.health}`,
      }
    }

    const remainingMonsters = this.deck.filter((card) => card.type === 'monster')
    const monsterloss = remainingMonsters.reduce((sum, card) => sum + card.value, 0)
    const score = -monsterloss
    return {
      won: false,
      score,
      message: `Defeated! Remaining monsters worth: ${monsterloss}`,
    }
  }

  /**
   * Save game state to localStorage
   */
  save() {
    const state = {
      deck: this.deck,
      discardPile: this.discardPile,
      room: this.room,
      health: this.health,
      weapon: this.weapon,
      lastDefeatedValue: this.lastDefeatedValue,
      potionUsedThisTurn: this.potionUsedThisTurn,
      turn: this.turn,
      gameActive: this.gameActive,
      lastRoomAvoided: this.lastRoomAvoided,
      carryoverCard: this.carryoverCard,
      weaponStack: this.weaponStack,
    }
    localStorage.setItem('scoundrel-game-state', JSON.stringify(state))
  }

  /**
   * Load game state from localStorage
   */
  load() {
    const saved = localStorage.getItem('scoundrel-game-state')
    if (!saved) return false

    try {
      const state = JSON.parse(saved)
      Object.assign(this, state)
      return true
    } catch (e) {
      console.error('Failed to load game state:', e)
      return false
    }
  }
}

// ============================================
// UI MANAGEMENT
// ============================================

class GameUI {
  constructor(game) {
    this.game = game
    this.setupElements()
    this.setupEventListeners()
    this.log = []
  }

  setupElements() {
    // HUD
    this.healthDisplay = document.getElementById('health-display')
    this.healthBarFill = document.getElementById('health-bar-fill')
    this.weaponValue = document.getElementById('weapon-value')
    this.weaponHistory = document.getElementById('weapon-history')
    this.turnDisplay = document.getElementById('turn-display')
    this.deckRemaining = document.getElementById('deck-remaining')
    this.deckDiscarded = document.getElementById('deck-discarded')
    this.avoidBtn = document.getElementById('avoid-btn')

    // Room
    this.roomGrid = document.getElementById('room-grid')

    // Log
    this.actionLog = document.getElementById('action-log')
    this.logClearBtn = document.getElementById('log-clear-btn')

    // Controls
    this.newGameBtn = document.getElementById('new-game-btn')
    this.restartBtn = document.getElementById('restart-btn')
    this.helpBtn = document.getElementById('help-btn')
    this.debugBtn = document.getElementById('debug-btn')

    // Navbar buttons
    this.navbarNewGameBtn = document.getElementById('navbar-new-game-btn')
    this.navbarRestartBtn = document.getElementById('navbar-restart-btn')
    this.navbarHelpBtn = document.getElementById('navbar-help-btn')

    // Modals
    this.helpModal = document.getElementById('help-modal')
    this.helpClose = document.getElementById('help-close')
    this.helpOkBtn = document.getElementById('help-ok-btn')

    this.debugModal = document.getElementById('debug-modal')
    this.debugClose = document.getElementById('debug-close')
    this.debugCloseBtn = document.getElementById('debug-close-btn')
    this.debugState = document.getElementById('debug-state')
    this.debugDeck = document.getElementById('debug-deck')

    this.newGameModal = document.getElementById('new-game-modal')
    this.newGameClose = document.getElementById('new-game-close')
    this.newGameCancelBtn = document.getElementById('new-game-cancel-btn')
    this.newGameConfirmBtn = document.getElementById('new-game-confirm-btn')

    this.endGameModal = document.getElementById('end-game-modal')
    this.endGameTitle = document.getElementById('end-game-title')
    this.endGameScore = document.getElementById('end-game-score')
    this.endGameMessage = document.getElementById('end-game-message')
    this.endGameNewBtn = document.getElementById('end-game-new-btn')
  }

  setupEventListeners() {
    const navbarToggle = document.getElementById('navbar-toggle')
    const navbarMenu = document.getElementById('navbar-menu')

    if (navbarToggle && navbarMenu) {
      navbarToggle.addEventListener('click', () => {
        navbarToggle.classList.toggle('active')
        navbarMenu.classList.toggle('active')
      })
    }

    this.navbarNewGameBtn.addEventListener('click', () => {
      navbarToggle.classList.remove('active')
      navbarMenu.classList.remove('active')
      this.showNewGameModal()
    })
    this.navbarRestartBtn.addEventListener('click', () => {
      navbarToggle.classList.remove('active')
      navbarMenu.classList.remove('active')
      this.restartGame()
    })
    this.navbarHelpBtn.addEventListener('click', () => {
      navbarToggle.classList.remove('active')
      navbarMenu.classList.remove('active')
      this.helpModal.showModal()
    })

    const oldNewGameBtn = document.getElementById('new-game-btn')
    const oldRestartBtn = document.getElementById('restart-btn')
    const oldHelpBtn = document.getElementById('help-btn')

    if (oldNewGameBtn) oldNewGameBtn.addEventListener('click', () => this.showNewGameModal())
    if (oldRestartBtn) oldRestartBtn.addEventListener('click', () => this.restartGame())
    if (oldHelpBtn) oldHelpBtn.addEventListener('click', () => this.helpModal.showModal())

    this.debugBtn.addEventListener('click', () => this.showDebugPanel())
    this.avoidBtn.addEventListener('click', () => this.handleAvoid())

    this.helpClose.addEventListener('click', () => this.helpModal.close())
    this.helpOkBtn.addEventListener('click', () => this.helpModal.close())
    this.helpModal.addEventListener('click', (e) => {
      if (e.target === this.helpModal) this.helpModal.close()
    })

    this.debugClose.addEventListener('click', () => this.debugModal.close())
    this.debugCloseBtn.addEventListener('click', () => this.debugModal.close())
    this.debugModal.addEventListener('click', (e) => {
      if (e.target === this.debugModal) this.debugModal.close()
    })

    this.newGameClose.addEventListener('click', () => this.newGameModal.close())
    this.newGameCancelBtn.addEventListener('click', () => this.newGameModal.close())
    this.newGameConfirmBtn.addEventListener('click', () => this.confirmNewGame())
    this.newGameModal.addEventListener('click', (e) => {
      if (e.target === this.newGameModal) this.newGameModal.close()
    })

    this.endGameNewBtn.addEventListener('click', () => {
      this.endGameModal.close()
      this.startNewGame()
    })

    this.logClearBtn.addEventListener('click', () => this.clearLog())

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.helpModal.close()
        this.debugModal.close()
        this.newGameModal.close()
      }
    })
  }

  /**
   * Start a completely new game
   */
  startNewGame() {
    this.game.reset()
    this.log = []
    this.addLog('Game started! Draw cards to begin.')
    this.newGameModal.close()
    this.endGameModal.close()
    this.render()
    this.drawRoomWithAnimation()
  }

  /**
   * Show new game confirmation modal
   */
  showNewGameModal() {
    this.newGameModal.showModal()
  }

  /**
   * Confirm new game from modal
   */
  confirmNewGame() {
    this.startNewGame()
  }

  /**
   * Restart from saved state
   */
  restartGame() {
    if (this.game.load()) {
      this.log = []
      this.addLog('Game restored from last save.')
      this.render()
    } else {
      alert('No saved game found.')
    }
  }

  /**
   * Draw room with animation
   */
  drawRoomWithAnimation() {
    const newCards = this.game.drawRoom()

    if (newCards.length === 0 && this.game.room.length === 0) {
      this.endGame()
      return
    }

    this.renderRoom()
  }

  /**
   * Handle avoid button click
   */
  handleAvoid() {
    if (!this.game.canAvoid()) {
      alert('Cannot avoid twice in a row.')
      return
    }

    const cards = this.game.room.map(formatCard).join(', ')
    this.game.avoidRoom()
    this.addLog(`Avoided room: ${cards}. All cards placed on bottom of deck.`, 'info')
    this.game.save()
    this.render()
    this.drawRoomWithAnimation()
  }

  /**
   * Handle card click
   */
  handleCardClick(cardIndex) {
    if (!this.game.gameActive || cardIndex >= this.game.room.length) {
      return
    }

    const card = this.game.room[cardIndex]
    const result = this.game.resolveCard(cardIndex)

    if (!result.success) return

    for (const msg of result.messages) {
      const type = msg.includes('Took')
        ? 'damage'
        : msg.includes('Defeated')
          ? 'success'
          : msg.includes('discarded')
            ? 'warning'
            : 'info'
      this.addLog(msg, type)
    }

    this.game.save()
    this.render()

    if (this.game.room.length === 1) {
      this.addLog(
        `Turn ${this.game.turn} complete. Next turn starts with: ${formatCard(this.game.room[0])}`,
        'info'
      )
      this.game.endTurn()
      this.render()

      if (this.game.isGameOver()) {
        this.endGame()
      } else {
        setTimeout(() => this.drawRoomWithAnimation(), 800)
      }
    }
  }

  /**
   * End the game and show score
   */
  endGame() {
    const score = this.game.calculateScore()

    if (score.won) {
      this.endGameTitle.textContent = '🎉 Victory!'
      this.endGameScore.textContent = score.score
      this.endGameScore.parentElement.classList.add('win')
      this.endGameScore.parentElement.classList.remove('loss')
    } else {
      this.endGameTitle.textContent = '💀 Defeated!'
      this.endGameScore.textContent = score.score
      this.endGameScore.parentElement.classList.add('loss')
      this.endGameScore.parentElement.classList.remove('win')
    }
    this.endGameMessage.textContent = score.message

    this.addLog(`GAME OVER: ${score.message}`, score.won ? 'success' : 'damage')
    this.game.save()

    setTimeout(() => {
      this.endGameModal.showModal()
    }, 500)
  }

  /**
   * Show debug panel
   */
  showDebugPanel() {
    const stateInfo = {
      health: this.game.health,
      weapon: this.game.weapon ? formatCard(this.game.weapon) : 'None',
      lastDefeatedValue: this.game.lastDefeatedValue,
      turn: this.game.turn,
      gameActive: this.game.gameActive,
      deckRemaining: this.game.deck.length,
      discardPile: this.game.discardPile.length,
      room: this.game.room.map(formatCard),
      carryoverCard: this.game.carryoverCard ? formatCard(this.game.carryoverCard) : 'None',
    }

    this.debugState.textContent = JSON.stringify(stateInfo, null, 2)

    const nextCards = this.game.deck.slice(0, 10).map(formatCard).join(', ')
    this.debugDeck.textContent = nextCards || 'Deck is empty'

    this.debugModal.showModal()
  }

  /**
   * Render the entire UI
   */
  render() {
    this.renderHUD()
    this.renderRoom()
    this.renderAvoidButton()
  }

  /**
   * Render HUD (health, weapon, turn, deck)
   */
  renderHUD() {
    this.healthDisplay.textContent = this.game.health
    const healthPercent = (this.game.health / 20) * 100
    this.healthBarFill.style.width = `${healthPercent}%`

    if (this.game.weapon) {
      this.weaponValue.textContent = this.game.weapon.value
      this.weaponHistory.textContent = `(≤${this.game.lastDefeatedValue})`
    } else {
      this.weaponValue.textContent = '—'
      this.weaponHistory.textContent = ''
    }

    this.turnDisplay.textContent = this.game.turn

    this.deckRemaining.textContent = this.game.deck.length + this.game.room.length
    this.deckDiscarded.textContent = this.game.discardPile.length
  }

  /**
   * Render room grid
   */
  renderRoom() {
    this.roomGrid.innerHTML = ''

    for (let i = 0; i < this.game.room.length; i++) {
      const card = this.game.room[i]
      const cardEl = this.createCardElement(card, i)
      this.roomGrid.appendChild(cardEl)
    }
  }

  /**
   * Create a card DOM element
   */
  createCardElement(card, index) {
    const div = document.createElement('div')
    div.className = `card ${card.type} reveal`
    div.setAttribute('role', 'button')
    div.setAttribute('tabindex', '0')
    div.setAttribute('aria-label', `${formatCard(card)} - ${card.type}`)

    const imagePath = getCardImagePath(card)
    if (imagePath) {
      div.style.backgroundImage = `url('${imagePath}')`
      div.classList.add('has-background-image')
    }

    const labelEl = document.createElement('div')
    labelEl.className = 'card-label'
    labelEl.textContent = card.type.charAt(0).toUpperCase() + card.type.slice(1)
    div.appendChild(labelEl)

    const rankEl = document.createElement('div')
    rankEl.className = 'card-rank'
    rankEl.textContent = card.rank

    const suitEl = document.createElement('div')
    suitEl.className = 'card-suit'
    suitEl.textContent = card.suit

    div.appendChild(rankEl)
    div.appendChild(suitEl)

    if (this.game.gameActive && this.game.room.length > 1) {
      div.classList.add('selectable')
      div.addEventListener('click', () => this.handleCardClick(index))
      div.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          this.handleCardClick(index)
        }
      })
    }

    return div
  }

  /**
   * Render avoid button state
   */
  renderAvoidButton() {
    const canAvoid = this.game.canAvoid()
    this.avoidBtn.disabled = !canAvoid

    if (!this.game.gameActive) {
      this.avoidBtn.textContent = 'Game Over'
      this.avoidBtn.disabled = true
    } else if (this.game.lastRoomAvoided) {
      this.avoidBtn.textContent = 'Used'
      this.avoidBtn.disabled = true
    } else {
      this.avoidBtn.textContent = 'Avoid'
      this.avoidBtn.disabled = false
    }
  }

  /**
   * Add message to action log
   */
  addLog(message, type = 'info') {
    const entry = document.createElement('div')
    entry.className = `log-entry ${type}`
    entry.textContent = message

    this.actionLog.appendChild(entry)
    this.actionLog.scrollTop = this.actionLog.scrollHeight

    while (this.actionLog.children.length > 50) {
      this.actionLog.firstChild.remove()
    }
  }

  /**
   * Clear action log
   */
  clearLog() {
    this.actionLog.innerHTML = ''
  }
}

// ============================================
// INITIALIZATION
// ============================================

let game
let gameUI
let initialized = false

export function initScoundrel() {
  if (initialized) return
  initialized = true

  game = new Game()
  gameUI = new GameUI(game)

  if (!game.load()) {
    gameUI.startNewGame()
  } else {
    gameUI.addLog('Game restored from last save.')
    gameUI.render()
  }
}
