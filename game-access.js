
/* =========================================
   PIXELRUSH - GAME ACCESS CONTROLLER
   File: js/game-access.js

   Features:
   1. Guest can browse games
   2. Login required to play
   3. Save selected game URL
   4. Return to selected game after login
   5. Wait for Firebase auth state
   ========================================= */

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";

import {
    auth,
    authReady
} from "./firebase-config.js";

/* =========================================
   1. CONFIGURATION
   ========================================= */

const RETURN_KEY = "pixelrush_return_after_login";
const LOGIN_PAGE = "./login.html";

let currentUser = null;
let authInitialized = false;

/* =========================================
   2. WAIT FOR FIREBASE AUTH STATE
   ========================================= */

const authStateReady = (async () => {
    await authReady;

    return new Promise((resolve, reject) => {
        const unsubscribe = onAuthStateChanged(
            auth,
            user => {
                currentUser = user;
                authInitialized = true;
                unsubscribe();
                resolve(user);
            },
            error => {
                unsubscribe();
                reject(error);
            }
        );
    });
})();

/* =========================================
   3. UPDATE PLAY BUTTONS
   ========================================= */

function updatePlayButtons() {
    document.querySelectorAll("[data-play-game]").forEach(button => {
        if (!button.dataset.defaultPlayText) {
            button.dataset.defaultPlayText =
                button.textContent.trim() || "Play Now";
        }

        button.textContent = currentUser
            ? button.dataset.defaultPlayText
            : "Login to Play";

        button.setAttribute(
            "aria-label",
            currentUser
                ? "Play selected game"
                : "Login to play selected game"
        );
    });
}

/* =========================================
   4. GET GAME URL FROM BUTTON
   ========================================= */

function getGameUrl(button) {
    const target =
        button.dataset.gameUrl ||
        button.dataset.playGame ||
        button.getAttribute("href");

    if (!target) {
        console.error(
            "PixelRush: Play button is missing its game URL.",
            button
        );
        return null;
    }

    try {
        const url = new URL(target, window.location.href);

        // Prevent external or unrelated URLs.
        if (url.origin !== window.location.origin) {
            console.error("PixelRush: Invalid game URL.");
            return null;
        }

        if (!url.pathname.includes("/games/")) {
            console.error(
                "PixelRush: Target must be inside the games folder."
            );
            return null;
        }

        return url;
    } catch (error) {
        console.error("PixelRush: Invalid game URL.", error);
        return null;
    }
}

/* =========================================
   5. HANDLE PLAY BUTTON CLICK
   ========================================= */

async function handlePlayClick(event) {
    const button = event.currentTarget;

    // Don't open the game before auth state is known.
    event.preventDefault();

    if (button.dataset.accessChecking === "true") {
        return;
    }

    button.dataset.accessChecking = "true";
    button.setAttribute("aria-busy", "true");

    try {
        await authStateReady;

        const gameUrl = getGameUrl(button);

        if (!gameUrl) {
            alert("This game's URL is not configured correctly.");
            return;
        }

        if (currentUser) {
            // Already logged in: open selected game.
            sessionStorage.removeItem(RETURN_KEY);
            window.location.assign(gameUrl.href);
            return;
        }

        // Guest: save the exact selected game path.
        sessionStorage.setItem(
            RETURN_KEY,
            gameUrl.pathname + gameUrl.search + gameUrl.hash
        );

        const loginUrl = new URL(
            LOGIN_PAGE,
            window.location.href
        );

        loginUrl.searchParams.set(
            "reason",
            "login-required"
        );

        window.location.assign(loginUrl.href);

    } catch (error) {
        console.error(
            "PixelRush: Could not verify game access.",
            error
        );

        alert(
            "Unable to verify login. Check your internet connection and try again."
        );
    } finally {
        button.dataset.accessChecking = "false";
        button.removeAttribute("aria-busy");
    }
}

/* =========================================
   6. CONNECT PLAY BUTTONS
   ========================================= */

function setupPlayButtons() {
    document.querySelectorAll("[data-play-game]").forEach(button => {
        if (button.dataset.gameAccessInitialized === "true") {
            return;
        }

        button.dataset.gameAccessInitialized = "true";

        button.addEventListener("click", handlePlayClick);
    });
}

/* =========================================
   7. INITIALIZE
   ========================================= */

async function initGameAccess() {
    setupPlayButtons();

    try {
        await authStateReady;
        updatePlayButtons();

        console.log(
            "PixelRush game access initialized."
        );
    } catch (error) {
        console.error(
            "PixelRush: Firebase authentication unavailable.",
            error
        );

        // Fail closed: never assume a guest is authenticated.
        document.querySelectorAll("[data-play-game]").forEach(button => {
            button.disabled = true;
            button.title =
                "Unable to verify login. Please reload the page.";
        });
    }
}

initGameAccess();
