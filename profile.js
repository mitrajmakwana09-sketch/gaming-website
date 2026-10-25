
"use strict";

/* =========================================
   PIXELRUSH - PROFILE MANAGER
   File: js/profile.js
   ========================================= */

const PixelRushProfile = (() => {
    const STORAGE_KEY = "pixelrush_profile_v1";
    const SCORES_KEY = "pixelrush_game_scores_v1";

    const defaultProfile = {
        username: "PlayerOne",
        email: "player@example.com",
        avatar: "🎮",
        bio: "Ready for my next gaming challenge!",
        joinedAt: new Date().toISOString(),
        gamesPlayed: 0,
        totalScore: 0,
        bestScore: 0,
        xp: 0,
        level: 1,
        achievements: []
    };

    const avatars = ["🎮", "👾", "🕹️", "🚀", "🤖", "🐉", "⚡", "🎯"];

    const achievementDefinitions = [
        {
            id: "first-game",
            icon: "🎯",
            name: "First Game",
            description: "Play your first game."
        },
        {
            id: "score-100",
            icon: "⭐",
            name: "Rising Star",
            description: "Earn a score of 100 or more."
        },
        {
            id: "score-1000",
            icon: "🏆",
            name: "High Scorer",
            description: "Earn a score of 1,000 or more."
        },
        {
            id: "games-10",
            icon: "🔥",
            name: "Dedicated Gamer",
            description: "Record 10 game sessions."
        },
        {
            id: "level-5",
            icon: "💎",
            name: "Level Master",
            description: "Reach level 5."
        }
    ];

    /* ---------- DOM helpers ---------- */

    function getElement(id) {
        return document.getElementById(id);
    }

    function setText(id, value) {
        const element = getElement(id);
        if (element) element.textContent = String(value);
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
            alert("Could not save your changes. Check browser storage settings.");
            return false;
        }
    }

    function getProfile() {
        const saved = readJSON(STORAGE_KEY, {});
        return {
            ...defaultProfile,
            ...(saved && typeof saved === "object" ? saved : {})
        };
    }

    function saveProfile(profile) {
        return writeJSON(STORAGE_KEY, profile);
    }

    function escapeHTML(value) {
        return String(value).replace(/[&<>"']/g, character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[character]);
    }

    function formatNumber(value) {
        const number = Number(value);
        return (Number.isFinite(number) ? number : 0).toLocaleString();
    }

    function safeDate(value) {
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? new Date() : date;
    }

    /* ---------- XP and levels ---------- */

    function getLevelInfo(xp) {
        const safeXP = Math.max(0, Number(xp) || 0);
        const level = Math.floor(safeXP / 500) + 1;
        const currentLevelXP = safeXP % 500;

        return {
            level,
            currentLevelXP,
            nextLevelXP: 500,
            percentage: (currentLevelXP / 500) * 100
        };
    }

    function updateLevel(profile) {
        const info = getLevelInfo(profile.xp);
        profile.level = info.level;
        return profile;
    }

    /* ---------- Achievements ---------- */

    function checkAchievements(profile) {
        const earned = new Set(
            Array.isArray(profile.achievements)
                ? profile.achievements
                : []
        );

        if (profile.gamesPlayed >= 1) {
            earned.add("first-game");
        }

        if (profile.bestScore >= 100) {
            earned.add("score-100");
        }

        if (profile.bestScore >= 1000) {
            earned.add("score-1000");
        }

        if (profile.gamesPlayed >= 10) {
            earned.add("games-10");
        }

        if (profile.level >= 5) {
            earned.add("level-5");
        }

        profile.achievements = [...earned];
        return profile;
    }

    function renderAchievements(profile) {
        const container = getElement("achievementsList");
        if (!container) return;

        const earned = new Set(profile.achievements || []);

        container.innerHTML = achievementDefinitions.map(item => {
            const unlocked = earned.has(item.id);

            return `
                <article class="achievement-card ${unlocked ? "unlocked" : "locked"}">
                    <div class="achievement-icon">${item.icon}</div>
                    <div class="achievement-info">
                        <h3>${escapeHTML(item.name)}</h3>
                        <p>${escapeHTML(item.description)}</p>
                        <small>${unlocked ? "✓ Unlocked" : "🔒 Locked"}</small>
                    </div>
                </article>
            `;
        }).join("");
    }

    /* ---------- Recent game history ---------- */

    function getRecentScores() {
        const scores = readJSON(SCORES_KEY, []);
        return Array.isArray(scores) ? scores.slice(0, 5) : [];
    }

    function renderRecentGames() {
        const container = getElement("recentGamesList");
        if (!container) return;

        const scores = getRecentScores();

        if (!scores.length) {
            container.innerHTML = `
                <div class="profile-empty">
                    <span>🎮</span>
                    <p>No games recorded yet.</p>
                    <a href="games.html">Explore games →</a>
                </div>
            `;
            return;
        }

        container.innerHTML = scores.map(game => {
            const name = escapeHTML(game.gameName || "Browser Game");
            const score = formatNumber(game.score);
            const date = safeDate(game.date).toLocaleDateString();

            return `
                <article class="recent-game">
                    <div class="recent-game-icon">🕹️</div>
                    <div class="recent-game-info">
                        <h3>${name}</h3>
                        <p>${date}</p>
                    </div>
                    <strong>${score} pts</strong>
                </article>
            `;
        }).join("");
    }

    /* ---------- Render profile ---------- */

    function renderProfile() {
        let profile = getProfile();

        profile = updateLevel(profile);
        profile = checkAchievements(profile);
        saveProfile(profile);

        const levelInfo = getLevelInfo(profile.xp);
        const joined = safeDate(profile.joinedAt);

        setText("profileName", profile.username);
        setText("profileUsername", "@" + profile.username);
        setText("profileEmail", profile.email);
        setText("profileBio", profile.bio);
        setText("profileAvatar", profile.avatar);
        setText("profileLevel", profile.level);
        setText("profileXP", formatNumber(profile.xp));
        setText("gamesPlayed", formatNumber(profile.gamesPlayed));
        setText("totalScore", formatNumber(profile.totalScore));
        setText("bestScore", formatNumber(profile.bestScore));
        setText("joinedDate", joined.toLocaleDateString());

        const xpBar = getElement("xpProgress");
        if (xpBar) {
            xpBar.style.width = levelInfo.percentage + "%";
            xpBar.setAttribute("role", "progressbar");
            xpBar.setAttribute("aria-valuemin", "0");
            xpBar.setAttribute("aria-valuemax", "500");
            xpBar.setAttribute("aria-valuenow", String(levelInfo.currentLevelXP));
        }

        setText(
            "xpProgressText",
            `${levelInfo.currentLevelXP} / ${levelInfo.nextLevelXP} XP to next level`
        );

        renderAchievements(profile);
        renderRecentGames();
    }

    /* ---------- Edit profile ---------- */

    function editProfile() {
        const profile = getProfile();

        const newName = prompt("Enter your username:", profile.username);
        if (newName === null) return;

        const username = newName.trim();

        if (username.length < 3 || username.length > 20) {
            alert("Username must be between 3 and 20 characters.");
            return;
        }

        if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
            alert("Use only letters, numbers, underscores or hyphens.");
            return;
        }

        const newBio = prompt("Write a short bio:", profile.bio);
        if (newBio === null) return;

        if (newBio.trim().length > 120) {
            alert("Bio must be 120 characters or fewer.");
            return;
        }

        profile.username = username;
        profile.bio = newBio.trim();

        if (saveProfile(profile)) {
            renderProfile();
            alert("Profile updated on this browser!");
        }
    }

    /* ---------- Change avatar ---------- */

    function changeAvatar() {
        const profile = getProfile();
        const currentIndex = avatars.indexOf(profile.avatar);
        const nextIndex = (currentIndex + 1) % avatars.length;

        profile.avatar = avatars[nextIndex];

        if (saveProfile(profile)) {
            renderProfile();
        }
    }

    /* ---------- Record a game session ---------- */

    function recordGame(gameName, score) {
        const safeScore = Number(score);

        if (!Number.isFinite(safeScore) || safeScore < 0) {
            throw new Error("Score must be a non-negative number.");
        }

        const profile = getProfile();

        profile.gamesPlayed += 1;
        profile.totalScore += Math.floor(safeScore);
        profile.bestScore = Math.max(
            profile.bestScore,
            Math.floor(safeScore)
        );

        // Earn XP based on the score, capped per game.
        profile.xp += Math.min(100, Math.max(10, Math.floor(safeScore / 10)));

        updateLevel(profile);
        checkAchievements(profile);

        const history = getRecentScores();
        history.unshift({
            gameName: String(gameName || "Browser Game").slice(0, 60),
            score: Math.floor(safeScore),
            date: new Date().toISOString()
        });

        // Keep the latest 20 records.
        writeJSON(SCORES_KEY, history.slice(0, 20));

        if (saveProfile(profile)) {
            renderProfile();
        }

        return profile;
    }

    /* ---------- Initialize ---------- */

    function init() {
        renderProfile();

        const editButton = getElement("editProfileBtn");
        if (editButton) {
            editButton.addEventListener("click", editProfile);
        }

        const avatarButton = getElement("changeAvatarBtn");
        if (avatarButton) {
            avatarButton.addEventListener("click", changeAvatar);
        }

        // Listen for updates made in another tab of this browser.
        window.addEventListener("storage", event => {
            if (event.key === STORAGE_KEY || event.key === SCORES_KEY) {
                renderProfile();
            }
        });
    }

    return {
        init,
        getProfile,
        renderProfile,
        editProfile,
        changeAvatar,
        recordGame,
        getLevelInfo,
        checkAchievements
    };
})();

document.addEventListener("DOMContentLoaded", PixelRushProfile.init);

/*
HOW TO RECORD A GAME SCORE:

PixelRushProfile.recordGame("Neon Snake", 250);

Call this after a game finishes, using its real score.
Do not call it repeatedly for the same game session.
*/
