
"use strict";

/* ==========================================
   PIXELRUSH - LEADERBOARD MANAGER
   File: js/leaderboard.js
   ========================================== */

const PixelRushLeaderboard = (() => {
    const STORAGE_KEY = "pixelrush_leaderboard_v1";
    const PROFILE_KEY = "pixelrush_profile_v1";

    // Demo data for first-time preview.
    // Replace with Firebase data for a real online leaderboard.
    const demoPlayers = [
        { username: "ShadowX", score: 9850, gamesPlayed: 42, avatar: "🥷" },
        { username: "NeonWolf", score: 8720, gamesPlayed: 38, avatar: "🐺" },
        { username: "CyberKing", score: 7640, gamesPlayed: 35, avatar: "👑" },
        { username: "PixelPro", score: 6890, gamesPlayed: 31, avatar: "🎮" },
        { username: "FireStorm", score: 5780, gamesPlayed: 27, avatar: "🔥" },
        { username: "NovaPlay", score: 4920, gamesPlayed: 24, avatar: "🚀" },
        { username: "GameMaster", score: 3850, gamesPlayed: 19, avatar: "🕹️" },
        { username: "StarGamer", score: 2740, gamesPlayed: 15, avatar: "⭐" },
        { username: "NightRider", score: 1680, gamesPlayed: 11, avatar: "🌙" },
        { username: "PlayerOne", score: 850, gamesPlayed: 7, avatar: "👾" }
    ];

    let players = [];
    let currentFilter = "all";
    let searchTerm = "";
    let sortMode = "score";

    const $ = id => document.getElementById(id);

    function escapeHTML(value) {
        return String(value).replace(/[&<>"']/g, char => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[char]);
    }

    function formatNumber(value) {
        const n = Number(value);
        return (Number.isFinite(n) ? n : 0).toLocaleString();
    }

    function loadPlayers() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);

            if (saved) {
                const parsed = JSON.parse(saved);

                if (Array.isArray(parsed)) {
                    return parsed;
                }
            }
        } catch (error) {
            console.warn("Could not read leaderboard data.", error);
        }

        return demoPlayers.map(player => ({ ...player }));
    }

    function savePlayers() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(players));
            return true;
        } catch (error) {
            console.error("Could not save leaderboard data.", error);
            return false;
        }
    }

    function getCurrentUsername() {
        try {
            const profile = JSON.parse(
                localStorage.getItem(PROFILE_KEY) || "null"
            );

            return profile && typeof profile.username === "string"
                ? profile.username
                : "";
        } catch {
            return "";
        }
    }

    function getSortedPlayers() {
        const sorted = [...players];

        if (sortMode === "games") {
            sorted.sort((a, b) =>
                (Number(b.gamesPlayed) || 0) -
                (Number(a.gamesPlayed) || 0)
            );
        } else {
            sorted.sort((a, b) =>
                (Number(b.score) || 0) -
                (Number(a.score) || 0)
            );
        }

        return sorted;
    }

    function getFilteredPlayers() {
        let result = getSortedPlayers();

        if (searchTerm) {
            result = result.filter(player =>
                String(player.username || "")
                    .toLowerCase()
                    .includes(searchTerm)
            );
        }

        if (currentFilter === "top10") {
            result = result.slice(0, 10);
        } else if (currentFilter === "top3") {
            result = result.slice(0, 3);
        }

        return result;
    }

    function getRankIcon(rank) {
        if (rank === 1) return "🥇";
        if (rank === 2) return "🥈";
        if (rank === 3) return "🥉";
        return `#${rank}`;
    }

    function renderPodium() {
        const podium = $("leaderboardPodium");
        if (!podium) return;

        const topThree = getSortedPlayers().slice(0, 3);

        if (!topThree.length) {
            podium.innerHTML = "";
            return;
        }

        // Display in 2nd, 1st, 3rd order for a podium layout.
        const order = [
            { player: topThree[1], rank: 2 },
            { player: topThree[0], rank: 1 },
            { player: topThree[2], rank: 3 }
        ].filter(item => item.player);

        podium.innerHTML = order.map(({ player, rank }) => `
            <article class="podium-card podium-${rank}">
                <div class="podium-medal">${getRankIcon(rank)}</div>
                <div class="podium-avatar">${escapeHTML(player.avatar || "🎮")}</div>
                <h3>${escapeHTML(player.username || "Player")}</h3>
                <p>${formatNumber(player.score)} pts</p>
                <span class="podium-rank">RANK ${rank}</span>
            </article>
        `).join("");
    }

    function renderTable() {
        const tbody = $("leaderboardBody");
        const empty = $("leaderboardEmpty");

        if (!tbody) return;

        const currentUsername = getCurrentUsername().toLowerCase();
        const filtered = getFilteredPlayers();
        const allSorted = getSortedPlayers();

        if (empty) {
            empty.hidden = filtered.length > 0;
        }

        if (filtered.length === 0) {
            tbody.innerHTML = "";
            return;
        }

        tbody.innerHTML = filtered.map(player => {
            const rank = allSorted.findIndex(item =>
                item.username === player.username
            ) + 1;

            const isCurrent = currentUsername &&
                String(player.username).toLowerCase() === currentUsername;

            return `
                <tr class="${isCurrent ? "current-player" : ""}">
                    <td class="rank-cell">${getRankIcon(rank)}</td>
                    <td>
                        <div class="player-cell">
                            <span class="player-avatar">
                                ${escapeHTML(player.avatar || "🎮")}
                            </span>
                            <span class="player-name">
                                ${escapeHTML(player.username || "Player")}
                                ${isCurrent
                                    ? '<small class="you-label">YOU</small>'
                                    : ""}
                            </span>
                        </div>
                    </td>
                    <td class="score-cell">${formatNumber(player.score)}</td>
                    <td>${formatNumber(player.gamesPlayed)}</td>
                </tr>
            `;
        }).join("");
    }

    function renderStats() {
        const sorted = getSortedPlayers();

        const totalPlayers = $("totalPlayers");
        const highestScore = $("highestScore");
        const totalGames = $("totalGames");

        if (totalPlayers) {
            totalPlayers.textContent = formatNumber(sorted.length);
        }

        if (highestScore) {
            highestScore.textContent = formatNumber(
                sorted.length ? sorted[0].score : 0
            );
        }

        if (totalGames) {
            const total = sorted.reduce(
                (sum, player) => sum + (Number(player.gamesPlayed) || 0),
                0
            );

            totalGames.textContent = formatNumber(total);
        }
    }

    function render() {
        renderPodium();
        renderTable();
        renderStats();
    }

    function bindEvents() {
        const search = $("leaderboardSearch");
        const filter = $("leaderboardFilter");
        const sort = $("leaderboardSort");
        const refresh = $("refreshLeaderboard");

        if (search) {
            search.addEventListener("input", event => {
                searchTerm = event.target.value.trim().toLowerCase();
                renderTable();
            });
        }

        if (filter) {
            filter.addEventListener("change", event => {
                currentFilter = event.target.value;
                renderTable();
            });
        }

        if (sort) {
            sort.addEventListener("change", event => {
                sortMode = event.target.value;
                render();
            });
        }

        if (refresh) {
            refresh.addEventListener("click", () => {
                players = loadPlayers();
                render();
            });
        }

        // Update the leaderboard when another tab changes its saved data.
        window.addEventListener("storage", event => {
            if (
                event.key === STORAGE_KEY ||
                event.key === PROFILE_KEY
            ) {
                players = loadPlayers();
                render();
            }
        });
    }

    // Add or update a player's entry.
    // Call this from trusted game code after a game ends.
    function submitScore(username, score, gamesPlayed = 1, avatar = "🎮") {
        const name = String(username || "").trim();
        const points = Number(score);

        if (!name || name.length > 20) {
            throw new Error("Enter a username between 1 and 20 characters.");
        }

        if (!Number.isFinite(points) || points < 0) {
            throw new Error("Score must be a non-negative number.");
        }

        let player = players.find(item =>
            String(item.username).toLowerCase() === name.toLowerCase()
        );

        if (player) {
            player.score += Math.floor(points);
            player.gamesPlayed += Math.max(
                1,
                Math.floor(Number(gamesPlayed) || 1)
            );
            player.avatar = String(avatar || player.avatar || "🎮");
        } else {
            player = {
                username: name,
                score: Math.floor(points),
                gamesPlayed: Math.max(
                    1,
                    Math.floor(Number(gamesPlayed) || 1)
                ),
                avatar: String(avatar || "🎮")
            };

            players.push(player);
        }

        savePlayers();
        render();

        return { ...player };
    }

    function init() {
        players = loadPlayers();
        bindEvents();
        render();
    }

    return {
        init,
        render,
        submitScore,
        getSortedPlayers
    };
})();

document.addEventListener("DOMContentLoaded", PixelRushLeaderboard.init);
