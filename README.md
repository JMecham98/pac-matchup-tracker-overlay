# 🧭 PAC Tracker – PvP Distance Overlay

A lightweight userscript for **Pokémon Auto Chess** that displays upcoming PvP opponents ordered by matchup distance directly in-game.

The overlay helps you anticipate future fights, plan positioning, and keep track of who you’re most likely to face next without tabbing out or doing mental math.

---

## ✨ Features

- 📊 **PvP Distance Tracking**  
  Shows all alive opponents sorted by how “far away” they are in PvP rotation.

- 👤 **Player Name Matching**  
  Tracks distances relative to your exact in-game name (supports ghost variants).

- 🖼 **Opponent Highlighting**  
  Displays the avatar of the closest upcoming opponent.

- 🧲 **Draggable & Persistent Position**  
  Move the overlay anywhere — position is saved between games.

- ➕➖ **Collapsible UI**  
  Collapse the overlay to just the header when needed.

- ⌨️ **Hotkey-Safe Name Editing**  
  Game hotkeys are disabled while editing your name to prevent misplays.

- 🔄 **SPA-Aware**  
  Automatically appears when a game loads and disappears when leaving.

---

## 📦 Installation

### 1. Install a Userscript Manager

- **Tampermonkey** (recommended): https://www.tampermonkey.net/
- Violentmonkey: https://violentmonkey.github.io/

---

### 2. Install the Script

1. Open your userscript manager
2. Create a **new script**
3. Paste the contents of `pac-tracker.js`
4. Save

---

### 3. Use In-Game

1. Go to https://pokemon-auto-chess.com
2. Start a game
3. The overlay appears automatically once the game is ready
4. Click **Name** and enter your exact in-game username

> ⚠️ Name matching is **case- and space-sensitive**.

---

## 🛠 Controls

| Action | How |
|------|----|
| Move overlay | Drag the header |
| Collapse / expand | ➕ / ➖ |
| Edit name | Click **Name** |
| Save name | Click **Save** |
| Close overlay | ✖ |

---

## 🔒 Safety & Performance

- Read-only (no gameplay changes)
- No network requests
- Runs fully client-side
- Updates every 3 seconds

---

## 📜 License

MIT License

---

## ❤️ Credits

Created by **Tegberen and Cinn**  
For the Pokémon Auto Chess community.

PRs and improvements welcome 🚀
