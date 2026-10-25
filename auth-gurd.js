
/* =========================================
   PIXELRUSH - AUTH GUARD
   File: js/auth-guard.js

   Features:
   1. Protect direct game URLs
   2. Require Firebase login to play
   3. Save requested game URL
   4. Redirect guests to login
   5. Reveal game only after authentication
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

const LOGIN_PAGE = new URL(
    "../login.html",
    window.location.href
).href;

/* =========================================
   2. FIND PROTECTED GAME ELEMENTS
   ========================================= */

function showGame() {
    document.querySelectorAll("[data-game-loading]")
        .forEach(element => {
            element.hidden = true;
        });

    document.querySelectorAll("[data-game-locked]")
        .forEach(element => {
            element.hidden = true;
        });

    document.querySelectorAll("[data-protected-game]")
        .forEach(element => {
            element.hidden = false;
        });

    document.documentElement.dataset.authStatus = "authenticated";

    document.dispatchEvent(
        new CustomEvent("pixelrush:game-unlocked", {
            detail: {
                user: auth.currentUser
            }
        })
    );
}

function showLockedMessage() {
    document.querySelectorAll("[data-game-loading]")
        .forEach(element => {
            element.hidden = true;
        });

    document.querySelectorAll("[data-protected-game]")
        .forEach(element => {
            element.hidden = true;
        });

    document.querySelectorAll("[data-game-locked]")
        .forEach(element => {
            element.hidden = false;
        });
}

/* =========================================
   3. SAVE CURRENT GAME URL
   ========================================= */

function saveCurrentGameUrl() {
    const currentPath =
        window.location.pathname +
        window.location.search +
        window.location.hash;

    sessionStorage.setItem(
        RETURN_KEY,
        currentPath
    );
}

/* =========================================
   4. REDIRECT GUEST TO LOGIN
   ========================================= */

function redirectToLogin() {
    saveCurrentGameUrl();

    const loginUrl = new URL(LOGIN_PAGE);

    loginUrl.searchParams.set(
        "reason",
        "login-required"
    );

    window.location.replace(loginUrl.href);
}

/* =========================================
   5. AUTHENTICATION GUARD
   ========================================= */

async function protectGamePage() {
    // Hide gameplay before checking login status.
    document.documentElement.dataset.authStatus = "checking";

    document.querySelectorAll("[data-protected-game]")
        .forEach(element => {
            element.hidden = true;
        });

    document.querySelectorAll("[data-game-locked]")
        .forEach(element => {
            element.hidden = true;
        });

    document.querySelectorAll("[data-game-loading]")
        .forEach(element => {
            element.hidden = false;
        });

    try {
        // Wait until Firebase persistence is configured.
        await authReady;

        // Wait for Firebase's initial authentication state.
        const user = await new Promise((resolve, reject) => {
            const unsubscribe = onAuthStateChanged(
                auth,
                currentUser => {
                    unsubscribe();
                    resolve(currentUser);
                },
                error => {
                    unsubscribe();
                    reject(error);
                }
            );
        });

        if (!user) {
            document.documentElement.dataset.authStatus = "guest";
            redirectToLogin();
            return;
        }

        // Authenticated user: allow the game UI to appear.
        showGame();

    } catch (error) {
        console.error(
            "PixelRush: Unable to verify login status:",
            error
        );

        // Fail closed: do not expose gameplay on an auth error.
        document.documentElement.dataset.authStatus = "error";
        showLockedMessage();

        const message = document.querySelector(
            "[data-game-auth-error]"
        );

        if (message) {
            message.textContent =
                "Unable to verify your login. Check your internet connection and reload this page.";
            message.hidden = false;
        }
    }
}

/* =========================================
   6. START GUARD
   ========================================= */

protectGamePage();
