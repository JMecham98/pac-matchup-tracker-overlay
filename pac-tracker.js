// ==UserScript==
// @name         PAC Tracker (PvP Distance Overlay)
// @namespace    pac-helper
// @description  Displays upcoming PvP opponents ordered by matchup distance.
// @version      1.0
// @match        *://pokemon-auto-chess.com/*
// @match        *://*.pokemon-auto-chess.com/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function() {
    "use strict";

    const LS_NAME_KEY = "pac_tracker_player_name";
    const LS_POS_KEY = "pac_tracker_pos";
    const LS_COLLAPSED_KEY = "pac_tracker_collapsed";
    const NAME_MAX_LEN = 30;

    let waitingForGame = false;

    if (window.__pacTrackerBootstrapped) return;
    window.__pacTrackerBootstrapped = true;

    window.__pacTrackerCleanup = window.__pacTrackerCleanup || null;

    let isEditingName = false;
    let isCollapsed = localStorage.getItem(LS_COLLAPSED_KEY) === "1";
    let playerName = (localStorage.getItem(LS_NAME_KEY) || "")
        .trim()
        .slice(0, NAME_MAX_LEN);

    if (playerName) localStorage.setItem(LS_NAME_KEY, playerName);

    if (!document.querySelector('link[href*="Jost"]')) {
        const l = document.createElement("link");
        l.rel = "stylesheet";
        l.href =
            "https://fonts.googleapis.com/css2?family=Jost:wght@400;700&display=swap";
        document.head.appendChild(l);
    }

    function isInGameRoute() {
        return location.pathname.startsWith("/game");
    }

    function findRoom(obj, depth = 0, visited = new Set()) {
        if (depth > 10 || !obj || visited.has(obj)) return null;
        visited.add(obj);
        try {
            if (obj.sessionId && obj.state && obj.state.players) return obj;
        } catch {}
        for (const key in obj) {
            let val;
            try {
                val = obj[key];
            } catch {
                continue;
            }
            if (val && typeof val === "object") {
                const found = findRoom(val, depth + 1, visited);
                if (found) return found;
            }
        }
        return null;
    }

    function waitForGameReady(cb) {
        const maxMs = 30000;
        const stepMs = 250;
        const start = Date.now();

        const t = setInterval(() => {
            if (!isInGameRoute()) {
                clearInterval(t);
                return;
            }

            const room = findRoom(window);
            const hasPlayers =
                room?.state?.players &&
                (room.state.players.$items?.values || room.state.players.$items);

            if (hasPlayers) {
                clearInterval(t);
                cb();
                return;
            }

            if (Date.now() - start > maxMs) {
                clearInterval(t);
            }
        }, stepMs);
    }

    function onRouteChange() {
        if (isInGameRoute()) {
            if (!document.getElementById("pac-pvp-overlay") && !waitingForGame) {
                waitingForGame = true;
                waitForGameReady(() => {
                    waitingForGame = false;
                    if (isInGameRoute() && !document.getElementById("pac-pvp-overlay")) {
                        startTracker();
                    }
                });
            }
        } else {
            waitingForGame = false;

            if (window.__pacTrackerCleanup) {
                window.__pacTrackerCleanup();
                window.__pacTrackerCleanup = null;
            }

            const existing = document.getElementById("pac-pvp-overlay");
            if (existing) existing.remove();
        }
    }

    (function hookHistory() {
        const push = history.pushState;
        const replace = history.replaceState;

        history.pushState = function() {
            const r = push.apply(this, arguments);
            window.dispatchEvent(new Event("pac-route"));
            return r;
        };
        history.replaceState = function() {
            const r = replace.apply(this, arguments);
            window.dispatchEvent(new Event("pac-route"));
            return r;
        };

        window.addEventListener("popstate", () =>
            window.dispatchEvent(new Event("pac-route"))
        );
        window.addEventListener("pac-route", onRouteChange);
    })();

    function startTracker() {
        function headerButton(text, title) {
            const b = document.createElement("button");
            b.textContent = text;
            b.title = title;

            b.style.cssText = `
        border: 0;
        background: transparent;
        color: #fff;
        padding: 6px 10px;
        cursor: var(--cursor-hover, pointer);
        border-radius: 3px;
        font-size: 1rem;
        font-weight: 700;
        line-height: 1;
        user-select: none;
        transition: filter .15s;
      `;

            return b;
        }

        function wrapHeaderButton(btn) {
            const plate = document.createElement("div");
            plate.style.cssText = `
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 2px;
        background: transparent;
        cursor: var(--cursor-hover, pointer);
        user-select: none;
        transition: background-color .15s;
      `;

            btn.style.display = "inline-flex";
            btn.style.cursor = "inherit";
            plate.appendChild(btn);

            plate.addEventListener("mouseenter", () => {
                plate.style.backgroundColor = "rgba(255,255,255,0.15)";
            });
            plate.addEventListener("mouseleave", () => {
                plate.style.backgroundColor = "transparent";
            });

            return plate;
        }

        const overlay = document.createElement("div");
        overlay.id = "pac-pvp-overlay";
        overlay.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: var(--color-bg-primary, #61738A);
      color: #fff;
      border-radius: 12px;
      border: 4px solid #000;
      font-family: Jost, system-ui, sans-serif;
      font-size: 13px;
      z-index: 99999;
      min-width: 200px;
      box-shadow: 0 3px 5px rgba(0,0,0,.35);
      cursor: grab;
      user-select: none;
      box-sizing: border-box;
      overflow: hidden;
    `;
        document.body.appendChild(overlay);

        const header = document.createElement("div");
        header.style.cssText = `
      background: var(--color-bg-secondary, #54596B);
      padding: .25rem .5rem;
      box-sizing: border-box;
    `;
        overlay.appendChild(header);

        const headerRow = document.createElement("div");
        headerRow.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    `;
        header.appendChild(headerRow);

        const left = document.createElement("div");
        left.style.cssText =
            "display:flex;align-items:center;gap:8px;min-width:0;";
        headerRow.appendChild(left);

        const right = document.createElement("div");
        right.style.cssText =
            "display:flex;align-items:center;gap:8px;flex:0 0 auto;";
        headerRow.appendChild(right);

        const closeBtn = headerButton("?", "Close");
        closeBtn.style.setProperty("color", "#8871CE", "important");
        const closePlate = wrapHeaderButton(closeBtn);
        left.appendChild(closePlate);

        const title = document.createElement("div");
        title.textContent = "PAC Tracker";
        title.style.cssText = `
      font-size: 1.2rem;
      font-weight: 700;
      line-height: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      text-align: center;
      flex: 1;
    `;
        left.appendChild(title);

        const toggleBtn = headerButton(isCollapsed ? "?" : "?", "Toggle");
        toggleBtn.style.minWidth = "34px";
        const togglePlate = wrapHeaderButton(toggleBtn);
        right.appendChild(togglePlate);

        const nameRow = document.createElement("div");
        nameRow.style.cssText = `
      display:flex;
      align-items: center;
      justify-content:center;
      gap:6px;
      margin-top:4px;
      padding-bottom:2px;
      cursor:pointer;
      line-height: 1.2;
    `;
        header.appendChild(nameRow);

        const nameLabel = document.createElement("span");
        nameLabel.textContent = "Name:";
        nameLabel.style.cssText = `
      font-weight:700;
      opacity:.9;
      font-size:14px;
      line-height:1.2;
    `;
        nameRow.appendChild(nameLabel);

        const nameValue = document.createElement("span");
        nameValue.textContent = playerName;
        nameValue.style.cssText = `
      font-weight:700;
      font-size:14px;
      line-height:1.2;
    `;
        nameRow.appendChild(nameValue);

        const content = document.createElement("div");
        content.style.cssText = `
      background: var(--color-bg-primary, #61738A);
      padding: 10px;
      box-sizing: border-box;
    `;
        overlay.appendChild(content);

        let stopGameHotkeys = false;

        function keyboardBlocker(e) {
            if (!stopGameHotkeys) return;
            e.stopImmediatePropagation();
            e.stopPropagation();
        }

        window.addEventListener("keydown", keyboardBlocker, true);
        window.addEventListener("keypress", keyboardBlocker, true);
        window.addEventListener("keyup", keyboardBlocker, true);

        function cleanup() {
            stopGameHotkeys = false;

            window.removeEventListener("keydown", keyboardBlocker, true);
            window.removeEventListener("keypress", keyboardBlocker, true);
            window.removeEventListener("keyup", keyboardBlocker, true);

            if (window.pacTrackerInterval) clearInterval(window.pacTrackerInterval);
            window.pacTrackerInterval = null;
        }

        window.__pacTrackerCleanup = cleanup;

        function loadSavedPos() {
            try {
                const raw = localStorage.getItem(LS_POS_KEY);
                if (!raw) return null;
                const pos = JSON.parse(raw);
                if (typeof pos?.x !== "number" || typeof pos?.y !== "number") {
                    return null;
                }
                return pos;
            } catch {
                return null;
            }
        }

        function savePos(x, y) {
            localStorage.setItem(LS_POS_KEY, JSON.stringify({
                x,
                y
            }));
        }

        let drag = false,
            startX = 0,
            startY = 0,
            ox = 0,
            oy = 0;

        const savedPos = loadSavedPos();
        if (savedPos) {
            ox = savedPos.x;
            oy = savedPos.y;
            overlay.style.transform = `translate(${ox}px,${oy}px)`;
        }

        function isControl(el) {
            const tag = el?.tagName ? el.tagName.toLowerCase() : "";
            if (tag === "button" || tag === "input") return true;
            if (el === closeBtn || el === toggleBtn) return true;
            if (el === closePlate || el === togglePlate) return true;
            return false;
        }

        overlay.addEventListener("mousedown", (e) => {
            if (isControl(e.target)) return;
            drag = true;
            startX = e.clientX - ox;
            startY = e.clientY - oy;
        });

        document.addEventListener("mousemove", (e) => {
            if (!drag) return;
            e.preventDefault();
            ox = e.clientX - startX;
            oy = e.clientY - startY;
            overlay.style.transform = `translate(${ox}px,${oy}px)`;
        });

        document.addEventListener("mouseup", () => {
            if (!drag) return;
            drag = false;
            savePos(ox, oy);
        });

        closeBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            if (window.__pacTrackerCleanup) window.__pacTrackerCleanup();
            window.__pacTrackerCleanup = null;
            overlay.remove();
        });

        function applyCollapsedState() {
            if (isCollapsed) {
                overlay.style.background = "transparent";
                header.style.borderBottom = "0";
                content.style.display = "none";
                nameRow.style.display = "none";
                overlay.style.height = "auto";
            } else {
                overlay.style.background = "var(--color-bg-primary, #61738A)";
                content.style.display = "block";
                nameRow.style.display = "flex";
                overlay.style.height = "auto";
            }
            toggleBtn.textContent = isCollapsed ? "?" : "?";
            localStorage.setItem(LS_COLLAPSED_KEY, isCollapsed ? "1" : "0");
        }

        toggleBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            isCollapsed = !isCollapsed;
            applyCollapsedState();
        });

        function findLastIndexCompat(arr, pred) {
            if (arr.findLastIndex) {
                return arr.findLastIndex(pred);
            }

            for (let i = arr.length - 1; i >= 0; i--) {
                if (pred(arr[i], i, arr)) {
                    return i;
                }
            }

            return -1;
        }

        function getHistoryArray(player) {
            const h = player?.history;
            if (!h) return [];
            if (Array.isArray(h)) return h;
            if (Array.isArray(h.items)) return h.items;
            return [];
        }

        function entryMatchesOpponentByName(entry, opponentName) {
            if (!entry || !opponentName) return false;
            const eName = entry.name;
            if (!eName) return false;
            if (eName === opponentName) return true;
            if (eName === "Ghost of " + opponentName) return true;
            if (eName === "Ghost Of " + opponentName) return true;
            if (eName === "ghost of " + opponentName) return true;
            return false;
        }

        function getDistance(a, b) {
            const aHist = getHistoryArray(a);
            const bHist = getHistoryArray(b);
            if (!aHist.length || !bHist.length) return 0;

            const idxA = findLastIndexCompat(aHist, (h) =>
                entryMatchesOpponentByName(h, b.name)
            );
            const idxB = findLastIndexCompat(bHist, (h) =>
                entryMatchesOpponentByName(h, a.name)
            );

            return aHist.length - idxA + (bHist.length - idxB);
        }

        function showNameEditor() {
            if (isCollapsed) {
                isCollapsed = false;
                applyCollapsedState();
            }

            isEditingName = true;
            stopGameHotkeys = true;
            content.innerHTML = "";

            const headerText = document.createElement("div");
            headerText.style.cssText = "font-weight:700;margin-bottom:6px;";
            headerText.textContent = `Enter your player name (max ${NAME_MAX_LEN})`;
            content.appendChild(headerText);

            const row = document.createElement("div");
            row.style.cssText = "display:flex;gap:6px;align-items:center;";
            content.appendChild(row);

            const input = document.createElement("input");
            input.placeholder = "Exact in-game name";
            input.value = playerName || "";
            input.maxLength = NAME_MAX_LEN;
            input.style.cssText = `
        width: 100%;
        padding: 6px 8px;
        border-radius: 6px;
        border: 1px solid rgba(255,255,255,0.25);
        outline: none;
        box-sizing: border-box;
      `;
            row.appendChild(input);

            const saveBtn = document.createElement("button");
            saveBtn.textContent = "Save";
            saveBtn.style.cssText = `
        padding: 6px 10px;
        border-radius: 6px;
        border: none;
        cursor: pointer;
        font-weight: 700;
      `;
            row.appendChild(saveBtn);

            const tip = document.createElement("div");
            tip.style.cssText = "opacity:.75;margin-top:6px;font-size:12px;";
            tip.textContent = "Tip: name must match exactly (case/spaces).";
            content.appendChild(tip);

            const exitEditor = () => {
                isEditingName = false;
                stopGameHotkeys = false;
            };

            const doSave = () => {
                const name = (input.value || "")
                    .trim()
                    .slice(0, NAME_MAX_LEN);
                if (!name) return;

                playerName = name;
                localStorage.setItem(LS_NAME_KEY, name);
                nameValue.textContent = name;

                exitEditor();
                logPvPDistances();
            };

            saveBtn.addEventListener("click", doSave);

            input.addEventListener("keydown", (e) => {
                if (e.key === "Enter") doSave();

                if (e.key === "Escape") {
                    exitEditor();
                    logPvPDistances();
                }
            });

            setTimeout(() => input.focus(), 0);
        }

        nameRow.addEventListener("click", (e) => {
            e.stopPropagation();
            showNameEditor();
        });

        function logPvPDistances() {
            if (isCollapsed) return;
            if (isEditingName) return;

            if (!playerName) {
                showNameEditor();
                return;
            }

            const room = findRoom(window);
            if (!room) {
                content.innerHTML =
                    '<div style="color:#ffcccc;">Room not found yet.</div>';
                return;
            }

            const players = Array.from(room.state.players?.$items?.values?.() ?? []);
            const localPlayer = players.find((p) => p?.name === playerName);

            if (!localPlayer) {
                content.innerHTML =
                    '<div style="color:#ffcccc;">Player not found. Click Name to change it.</div>';
                return;
            }

            const rows = [];
            for (const p of players) {
                if (!p?.alive) continue;
                if (p.id === localPlayer.id) continue;
                rows.push({
                    name: p.name,
                    playerRef: p,
                    distance: getDistance(localPlayer, p),
                });
            }

            rows.sort((a, b) => (b.distance ?? 0) - (a.distance ?? 0));

            if (rows.length === 0) {
                content.innerHTML = `
          <div style="text-align:center;">
            <div style="font-weight:700;margin-bottom:8px;">Lobby won ??</div>
          </div>
        `;
                return;
            }

            let html = "";
            rows.forEach((info, index) => {
                const dist =
                    info.distance == null || info.distance < 0 ? 0 : info.distance;
                const distDisplay = String(dist).padStart(2, " ");

                const showAvatar =
                    index === 0 || (index === 1 && rows[0]?.distance === info.distance);

                if (showAvatar && info.playerRef?.avatar) {
                    const avatarUrl = "/assets/portraits/" + info.playerRef.avatar + ".png";
                    html += `<img src="${avatarUrl}" style="width:48px;height:48px;border-radius:6px;border:2px solid #A8D8EA;display:block;margin-bottom:6px;">`;
                }

                const color = index === 0 ? "#A8D8EA" : "white";
                html += `
          <div style="display:flex;justify-content:flex-start;color:${color};margin:5px 0;font-weight:700;font-size:18px;gap:6px;">
            <span style="font-family:monospace;min-width:2ch;text-align:right;">? ${distDisplay}</span>
            <span>-</span>
            <span>${info.name}</span>
          </div>
        `;
            });

            content.innerHTML =
                html || '<div style="opacity:.85;">No alive opponents found.</div>';
        }

        if (window.pacTrackerInterval) clearInterval(window.pacTrackerInterval);
        applyCollapsedState();
        logPvPDistances();
        window.pacTrackerInterval = setInterval(logPvPDistances, 3000);
    }

    onRouteChange();
})();