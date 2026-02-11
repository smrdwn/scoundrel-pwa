import { useEffect } from 'react'
import './scoundrel/styles.css'
import { initScoundrel } from './scoundrel/game'

function App() {
  useEffect(() => {
    initScoundrel()
  }, [])

  return (
    <>
      <nav className="navbar">
        <div className="navbar-left">
          <h1 className="game-title">⚔️ Scoundrel</h1>
        </div>
        <button
          className="navbar-toggle"
          id="navbar-toggle"
          aria-label="Toggle navigation menu"
          aria-expanded="false"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        <div className="navbar-right" id="navbar-menu">
          <button className="btn btn-nav" id="navbar-new-game-btn" aria-label="Start a new game">
            New Game
          </button>
          <button className="btn btn-nav" id="navbar-restart-btn" aria-label="Restart from last save">
            Restart
          </button>
          <button className="btn btn-nav" id="navbar-help-btn" aria-label="View game rules">
            How to Play
          </button>
        </div>
      </nav>

      <div className="game-container">
        <header className="hud">
          <div className="hud-section">
            <div className="stat-card health-card">
              <div className="stat-label">Health</div>
              <div className="stat-value" id="health-display">
                20
              </div>
              <div className="health-bar">
                <div className="health-fill" id="health-bar-fill"></div>
              </div>
            </div>

            <div className="stat-card weapon-card">
              <div className="stat-label">Weapon</div>
              <div className="weapon-display">
                <span className="weapon-value" id="weapon-value">
                  —
                </span>
                <span className="weapon-history" id="weapon-history"></span>
              </div>
            </div>

            <div className="stat-card turn-card">
              <div className="stat-label">Turn</div>
              <div className="stat-value" id="turn-display">
                1
              </div>
            </div>

            <div className="stat-card deck-card">
              <div className="stat-label">Deck</div>
              <div className="deck-counts">
                <span id="deck-remaining">44</span> / <span id="deck-discarded">0</span>
              </div>
            </div>

            <div className="stat-card avoid-card" id="avoid-card">
              <div className="stat-label">Avoid</div>
              <button
                className="avoid-button"
                id="avoid-btn"
                aria-label="Avoid current room and place cards on bottom of deck"
              >
                Ready
              </button>
            </div>
          </div>
        </header>

        <main className="game-main">
          <section className="room-section" aria-label="Current room with 4 cards">
            <h2 className="section-title">Room</h2>
            <div className="room-grid" id="room-grid"></div>
          </section>

          <section className="log-section" aria-label="Game event log">
            <div className="log-header">
              <h2 className="section-title">Log</h2>
              <button className="log-clear-btn" id="log-clear-btn" aria-label="Clear log">
                Clear
              </button>
            </div>
            <div
              className="action-log"
              id="action-log"
              role="log"
              aria-live="polite"
              aria-label="Game events and actions"
            >
              <div className="log-entry">Game initialized. Draw cards to begin.</div>
            </div>
          </section>
        </main>

        <footer className="controls">
          <button className="btn btn-secondary" id="debug-btn" aria-label="Toggle debug panel">
            Debug
          </button>
        </footer>
      </div>

      <dialog className="modal" id="help-modal" aria-label="Game help and rules">
        <div className="modal-content">
          <div className="modal-header">
            <h2>Scoundrel Rules</h2>
            <button className="modal-close" id="help-close" aria-label="Close help">
              ×
            </button>
          </div>
          <div className="modal-body">
            <h3>Objective</h3>
            <p>
              Clear the dungeon deck to win. Your score is your remaining health. If you lose,
              your score is negative (sum of remaining monsters).
            </p>

            <h3>Setup</h3>
            <p>44 cards: 26 monsters (♣♠), 9 weapons (♦), 9 potions (♥)</p>

            <h3>Each Turn</h3>
            <ol>
              <li>
                <strong>Draw cards</strong> until 4 are visible (the Room)
              </li>
              <li>
                <strong>Choose:</strong>
                <ul>
                  <li>
                    <strong>Avoid:</strong> Place all 4 cards on the bottom of the deck (can't do
                    twice in a row)
                  </li>
                  <li>
                    <strong>Face:</strong> Resolve 3 of the 4 cards in any order
                  </li>
                </ul>
              </li>
            </ol>

            <h3>Resolving Cards</h3>
            <ul>
              <li>
                <strong>Weapon (♦):</strong> Equip it immediately
              </li>
              <li>
                <strong>Potion (♥):</strong> Heal by its value (max 1 per room, others discarded)
              </li>
              <li>
                <strong>Monster (♣♠):</strong>
                <ul>
                  <li>
                    <em>Bare-handed:</em> Take full damage
                  </li>
                  <li>
                    <em>With weapon:</em> Damage = monster − weapon (min 0). If defeated, monster
                    stacks on weapon
                  </li>
                  <li>
                    <em>Rule:</em> Can only use weapon on monsters with value ≤ your last defeated
                    monster
                  </li>
                </ul>
              </li>
            </ul>

            <h3>Card Values</h3>
            <p>2–10 = face value, J=11, Q=12, K=13, A=14</p>

            <h3>Example</h3>
            <p>
              <strong>Scenario:</strong> You have ♦7 equipped (last defeated: 9). You see ♠8 and
              ♠11.
            </p>
            <ul>
              <li>Can fight ♠8? Yes (8 ≤ 9). Damage = 8 − 7 = 1.</li>
              <li>
                Can fight ♠11? No (11 {'>'} 9). You'd be bare-handed, taking 11 damage.
              </li>
            </ul>
          </div>
          <div className="modal-footer">
            <button className="btn btn-primary" id="help-ok-btn">
              Got it
            </button>
          </div>
        </div>
      </dialog>

      <dialog className="modal debug-modal" id="debug-modal" aria-label="Debug panel">
        <div className="modal-content">
          <div className="modal-header">
            <h2>Debug Panel</h2>
            <button className="modal-close" id="debug-close" aria-label="Close debug panel">
              ×
            </button>
          </div>
          <div className="modal-body">
            <div className="debug-section">
              <h3>Game State</h3>
              <pre id="debug-state"></pre>
            </div>
            <div className="debug-section">
              <h3>Deck Order (Next 10)</h3>
              <pre id="debug-deck"></pre>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" id="debug-close-btn">
              Close
            </button>
          </div>
        </div>
      </dialog>

      <dialog className="modal" id="new-game-modal" aria-label="Start new game confirmation">
        <div className="modal-content">
          <div className="modal-header">
            <h2>Start New Game?</h2>
            <button className="modal-close" id="new-game-close" aria-label="Close">
              ×
            </button>
          </div>
          <div className="modal-body">
            <p>This will start a new game and lose any unsaved progress.</p>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" id="new-game-cancel-btn">
              Cancel
            </button>
            <button className="btn btn-primary" id="new-game-confirm-btn">
              Start New Game
            </button>
          </div>
        </div>
      </dialog>

      <dialog className="modal" id="end-game-modal" aria-label="Game over">
        <div className="modal-content">
          <div className="modal-header">
            <h2 id="end-game-title">Game Over!</h2>
          </div>
          <div className="modal-body">
            <div className="end-game-result">
              <div className="result-label">Score</div>
              <div className="result-score" id="end-game-score">
                0
              </div>
            </div>
            <p id="end-game-message"></p>
          </div>
          <div className="modal-footer">
            <button className="btn btn-primary" id="end-game-new-btn">
              New Game
            </button>
          </div>
        </div>
      </dialog>
    </>
  )
}

export default App
