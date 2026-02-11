# ⚔️ Scoundrel

A solo dungeon-crawl card game built as a Progressive Web App. Navigate through a dangerous dungeon using a standard 52-card deck, manage your health and weapons strategically, and survive to escape!

## 🎮 About the Game

Scoundrel is a solitaire card game where you delve into a dungeon represented by a shuffled deck of cards. Each turn, you draw 4 cards that form a "room" and must decide whether to face the dangers or avoid them. The goal is to clear the entire deck while keeping your health above zero.

### Game Rules

**Objective:** Clear the dungeon deck to win. Your score is your remaining health. If you lose, your score is negative (sum of remaining monsters).

**Setup:** 44 cards total:
- 26 Monsters (♣ Clubs and ♠ Spades)
- 9 Weapons (♦ Diamonds)
- 9 Potions (♥ Hearts)

**Each Turn:**
1. Draw cards until 4 are visible (forming the Room)
2. Choose to either:
   - **Avoid:** Place all 4 cards on the bottom of the deck (can't do twice in a row)
   - **Face:** Resolve 3 of the 4 cards in any order you choose

**Resolving Cards:**
- **Weapon (♦):** Equip it immediately
- **Potion (♥):** Heal by its value (max 1 per room, others discarded)
- **Monster (♣♠):**
  - Bare-handed: Take full damage
  - With weapon: Damage = monster value − weapon value (min 0)
  - If defeated, monster stacks on weapon
  - Important: Can only use weapon on monsters with value ≤ your last defeated monster

**Card Values:** 2–10 = face value, J=11, Q=12, K=13, A=14

## ✨ Features

- 🎴 **Authentic card game mechanics** based on the original Scoundrel solitaire game
- 📱 **Progressive Web App** - Install on your device and play offline
- 💾 **Auto-save** - Game state is preserved across sessions
- 🎯 **Strategic gameplay** - Plan your moves carefully to maximize survival
- 📊 **Game log** - Track all actions and decisions
- 🐛 **Debug mode** - View game state and deck order for learning/testing
- ♿ **Accessible** - ARIA labels and semantic HTML for screen readers
- 🎨 **Dark theme** - Easy on the eyes during long sessions

## 🛠️ Tech Stack

- **React 19** - UI framework
- **Vite** - Build tool and dev server
- **PWA Plugin** - Service worker and manifest generation
- **ESLint** - Code quality and consistency
- **Custom Service Worker** - Offline support and caching

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/smrdwn/scoundrel-pwa.git
   cd scoundrel-pwa
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser to `http://localhost:5173`

### Available Scripts

- `npm run dev` - Start development server with hot module replacement
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint to check code quality

## 📦 Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory, ready to deploy to any static hosting service.

## 🎯 How to Play

1. Click **New Game** to start
2. Cards will automatically draw to form a room of 4 cards
3. Click **Avoid** to skip the room (places cards at bottom of deck)
4. Or click on 3 cards in your preferred order to face them
5. Monitor your health, weapon status, and turn count in the HUD
6. Use the **How to Play** button for complete rules
7. Enable **Debug** mode to see the game state and upcoming cards

## 🔧 Development

### Project Structure

```
scoundrel-pwa/
├── public/           # Static assets (icons, etc.)
├── src/
│   ├── scoundrel/    # Game logic and styles
│   │   ├── game.js   # Core game mechanics
│   │   └── styles.css # Game-specific styles
│   ├── App.jsx       # Main React component
│   ├── main.jsx      # React entry point
│   └── sw.js         # Service worker
├── index.html        # HTML template
├── vite.config.js    # Vite and PWA configuration
└── package.json      # Dependencies and scripts
```

### PWA Configuration

The app uses `vite-plugin-pwa` with a custom service worker strategy (`injectManifest`). The manifest is configured in `vite.config.js` with:
- App name and theme colors
- Icons for different sizes (192x192, 512x512)
- Standalone display mode
- Offline caching of assets

## 📄 License

This project is open source and available for personal and educational use.

## 🙏 Acknowledgments

Scoundrel is based on the classic solitaire dungeon-crawl card game. This digital implementation brings the strategic depth of the original to the web with modern PWA features.
