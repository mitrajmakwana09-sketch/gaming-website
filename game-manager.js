
"use strict";

/* ============================================
   PIXELRUSH GAME MANAGER
   File: js/game-manager.js

   Features:
   - Load games from games.json
   - Search and category filters
   - Sort games
   - Render game cards
   - Launch games
   - Record game scores
   - Connect with leaderboard.js
   - Add custom game cards
   ============================================ */

const PixelRushGameManager = (() => {
    const CUSTOM_GAMES_KEY = "pixelrush_custom_games_v1";
    const RECENT_GAMES_KEY = "pixelrush_recent_games_v1";
    const SCORES_KEY = "pixelrush_game_scores_v1";

    let games = [];
    let searchText = "";
    let activeCategory = "all";
    let sortMode = "popular";

    const $ = id => document.getElementById(id);

    const defaultGames = [
        {
            id: "snake",
            name: "Neon Snake",
            category: "arcade",
            emoji: "🐍",
            description: "Collect food, grow your snake and beat your best score.",
            url: "games/snake.html",
            featured: true,
            difficulty: "Easy"
        },
        {
            id: "tic-tac-toe",
            name: "Tic Tac Toe",
            category: "puzzle",
            emoji: "❌",
            description: "Challenge yourself or a friend in this classic game.",
            url: "games/tic-tac-toe.html",
            featured: true,
            difficulty: "Easy"
        },
        {
            id: "memory-match",
            name: "Memory Match",
            category: "puzzle",
            emoji: "🧠",
            description: "Flip cards, find matching pairs and train your memory.",
            url: "games/memory-match.html",
            featured: false,
            difficulty: "Medium"
        },
        {
            id: "reaction-test",
            name: "Reaction Test",
            category: "skill",
            emoji: "⚡",
            description: "Test your reflexes and try to react as quickly as possible.",
            url: "games/reaction-test.html",
            featured: true,
            difficulty: "Medium"
        }
    ];

    /* ---------- Helpers ---------- */

    function escapeHTML(value) {
        return String(value).replace(/[&<>"']/g, char => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[char]);
    }

    function readJSON(key, fallback) {
        try {
            const value = localStorage.getItem(key);
            return value ? JSON.parse(value) : fallback;
        } catch (error) {
            console.warn("PixelRush: Could not read saved data.", error);
            return fallback;
        }
    }

    function writeJSON(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error("PixelRush: Could not save data.", error);
            return false;
        }
    }

    function normalizeGame(game) {
        if (!game || typeof game !== "object") return null;

        const name = String(game.name || "").trim();
        const url = String(game.url || "").trim();

        if (!name || !url) return null;

        return {
            id: String(game.id || makeId()),
            name: name.slice(0, 60),
            category: String(game.category || "other").toLowerCase(),
            emoji: String(game.emoji || "🎮").slice(0, 8),
            description: String(game.description || "Explore this game.").slice(0, 200),
            url,
            featured: Boolean(game.featured),
            difficulty: String(game.difficulty || "Normal")
        };
    }

    function makeId() {
        return "game-" + Date.now().toString(36) +
            "-" + Math.random().toString(36).slice(2, 8);
    }

    function isSafeGameURL(url) {
        try {
            const parsed = new URL(url, window.location.href);

            // Only allow same-origin game pages or HTTPS external game URLs.
            if (parsed.origin === window.location.origin) {
                return !url.startsWith("javascript:");
            }

            return parsed.protocol === "https:";
        } catch {
            return false;
        }
    }

    /* ---------- Load games ---------- */

    async function loadGames() {
        let jsonGames = [];

        try {
            const response = await fetch("data/games.json", {
                cache: "no-cache"
            });

            if (response.ok) {
                const data = await response.json();

                if (Array.isArray(data)) {
                    jsonGames = data;
                } else if (data && Array.isArray(data.games)) {
                    jsonGames = data.games;
                }
            }
        } catch (error) {
            // Opening HTML directly with file:// may prevent fetch.
            console.info(
                "PixelRush: Using built-in games. Run through a local web server to load games.json."
            );
        }

        const savedCustomGames = readJSON(CUSTOM_GAMES_KEY, []);
        const validCustomGames = Array.isArray(savedCustomGames)
            ? savedCustomGames.map(normalizeGame).filter(Boolean)
            : [];

        const sourceGames = jsonGames.length ? jsonGames : defaultGames;
        const validSourceGames = sourceGames.map(normalizeGame).filter(Boolean);

        const unique = new Map();

        [...validSourceGames, ...validCustomGames].forEach(game => {
            if (game) unique.set(game.id, game);
        });

        games = [...unique.values()];
        renderGames();

        return games;
    }

    /* ---------- Filter and sort ---------- */

    function getVisibleGames() {
        let result = [...games];

        if (searchText) {
            result = result.filter(game =>
                game.name.toLowerCase().includes(searchText) ||
                game.description.toLowerCase().includes(searchText) ||
                game.category.toLowerCase().includes(searchText)
            );
        }

        if (activeCategory !== "all") {
            result = result.filter(game =>
                game.category === activeCategory
            );
        }

        if (sortMode === "name") {
            result.sort((a, b) => a.name.localeCompare(b.name));
        } else if (sortMode === "featured") {
            result.sort((a, b) => Number(b.featured) - Number(a.featured));
        }

        return result;
    }

    /* ---------- Render game cards ---------- */

    function renderGames() {
        const container = $("gamesGrid");

        if (!container) {
            console.warn(
                "PixelRush: Add an element with id='gamesGrid' to games.html."
            );
            return;
        }

        const visibleGames = getVisibleGames();

        if (!visibleGames.length) {
            container.innerHTML = `
                <div class="games-empty">
                    <div style="font-size:42px">🔎</div>
                    <h3>No games found</h3>
                    <p>Try a different search or category.</p>
                </div>
            `;
            updateCount(0);
            return;
        }

        container.innerHTML = visibleGames.map(game => {
            const safeURL = isSafeGameURL(game.url);
            const gameURL = safeURL ? escapeHTML(game.url) : "#";

            return `
                <article class="game-card">
                    <div class="game-card-visual">
                        <span class="game-emoji">
                            ${escapeHTML(game.emoji)}
                        </span>
                        ${game.featured
                            ? '<span class="game-featured">FEATURED</span>'
                            : ""}
                    </div>

                    <div class="game-card-content">
                        <div class="game-card-meta">
                            <span>${escapeHTML(game.category)}</span>
                            <span>${escapeHTML(game.difficulty)}</span>
                        </div>

                        <h3>${escapeHTML(game.name)}</h3>
                        <p>${escapeHTML(game.description)}</p>

                        ${safeURL
                            ? `<a class="play-game-btn"
                                  href="${gameURL}"
                                  data-game-id="${escapeHTML(game.id)}">
                                  ▶ Play Now
                               </a>`
                            : `<button type="button" disabled>
                                  Invalid game URL
                               </button>`
                        }
                    </div>
                </article>
            `;
        }).join("");

        container.querySelectorAll("[data-game-id]").forEach(link => {
            link.addEventListener("click", () => {
                recordRecentGame(link.dataset.gameId);
            });
        });

        updateCount(visibleGames.length);
    }

    function updateCount(count) {
        const element = $("gamesCount");
        if (element) element.textContent = String(count);
    }

    /* ---------- Search and category controls ---------- */

    function bindFilters() {
        const search = $("gameSearch");
        const category = $("gameCategory");
        const sort = $("gameSort");

        if (search) {
            search.addEventListener("input", event => {
                searchText = event.target.value.trim().toLowerCase();
                renderGames();
            });
        }

        if (category) {
            category.addEventListener("change", event => {
                activeCategory = event.target.value;
                renderGames();
            });
        }

        if (sort) {
            sort.addEventListener("change", event => {
                sortMode = event.target.value;
                renderGames();
            });
        }

        document.querySelectorAll("[data-game-category]").forEach(button => {
            button.addEventListener("click", () => {
                activeCategory = button.dataset.gameCategory || "all";

                document.querySelectorAll("[data-game-category]").forEach(item => {
                    item.classList.toggle("active", item === button);
                });

                if (category) category.value = activeCategory;

                renderGames();
            });
        });
    }

    /* ---------- Recent games ---------- */

    function recordRecentGame(gameId) {
        const game = games.find(item => item.id === gameId);
        if (!game) return;

        const recent = readJSON(RECENT_GAMES_KEY, []);
        const safeRecent = Array.isArray(recent) ? recent : [];

        safeRecent.unshift({
            gameId: game.id,
            gameName: game.name,
            playedAt: new Date().toISOString()
        });

        writeJSON(RECENT_GAMES_KEY, safeRecent.slice(0, 20));
    }

    /* ---------- Record completed game score ---------- */

    function recordScore(gameId, score) {
        const game = games.find(item => item.id === gameId);
        const numericScore = Number(score);

        if (!game) {
            throw new Error("Game not found.");
        }

        if (!Number.isFinite(numericScore) || numericScore < 0) {
            throw new Error("Score must be a non-negative number.");
        }

        const profile = readJSON("pixelrush_profile_v1", null);
        const username =
            profile && typeof profile.username === "string"
                ? profile.username.trim()
                : "";

        const history = readJSON(SCORES_KEY, []);
        const records = Array.isArray(history) ? history : [];

        records.unshift({
            gameId: game.id,
            gameName: game.name,
            score: Math.floor(numericScore),
            date: new Date().toISOString()
        });

        writeJSON(SCORES_KEY, records.slice(0, 20));

        // Integrate with leaderboard.js if it has been loaded.
        if (
            username &&
            typeof window.PixelRushLeaderboard?.submitScore === "function"
        ) {
            window.PixelRushLeaderboard.submitScore(
                username,
                Math.floor(numericScore),
                1,
                profile.avatar || "🎮"
            );
        }

        // Integrate with profile.js if it has been loaded.
        if (
            typeof window.PixelRushProfile?.recordGame === "function"
        ) {
            window.PixelRushProfile.recordGame(
                game.name,
                Math.floor(numericScore)
            );
        }

        return {
            game: game.name,
            score: Math.floor(numericScore)
        };
    }

    /* ---------- Add custom game ---------- */

    function addGame(gameData) {
        const game = normalizeGame(gameData);

        if (!game) {
            throw new Error("Please provide a game name and URL.");
        }

        if (!isSafeGameURL(game.url)) {
            throw new Error(
                "Use a valid relative game URL or an HTTPS external URL."
            );
        }

        if (games.some(item =>
            item.name.toLowerCase() === game.name.toLowerCase()
        )) {
            throw new Error("A game with this name already exists.");
        }

        const customGames = readJSON(CUSTOM_GAMES_KEY, []);
        const list = Array.isArray(customGames) ? customGames : [];

        list.push(game);

        if (!writeJSON(CUSTOM_GAMES_KEY, list)) {
            throw new Error("Unable to save the game in this browser.");
        }

        games.push(game);
        renderGames();

        return game;
    }

    /* ---------- Remove custom game ---------- */

    function removeCustomGame(gameId) {
        const customGames = readJSON(CUSTOM_GAMES_KEY, []);
        const list = Array.isArray(customGames) ? customGames : [];

        const updated = list.filter(game => game.id !== gameId);

        if (updated.length === list.length) {
            return false;
        }

        if (!writeJSON(CUSTOM_GAMES_KEY, updated)) {
            return false;
        }

        games = games.filter(game => game.id !== gameId);
        renderGames();

        return true;
    }

    /* ---------- Initialization ---------- */

    async function init() {
        bindFilters();
        await loadGames();

        window.addEventListener("storage", event => {
            if (event.key === CUSTOM_GAMES_KEY) {
                loadGames();
            }
        });
    }

    return {
        init,
        loadGames,
        renderGames,
        getGames: () => [...games],
        addGame,
        removeCustomGame,
        recordRecentGame,
        recordScore
    };
})();

window.PixelRushGameManager = PixelRushGameManager;

document.addEventListener(
    "DOMContentLoaded",
    PixelRushGameManager.init
);
