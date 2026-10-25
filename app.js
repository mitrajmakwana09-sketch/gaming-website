
/* ==========================================
   PIXELRUSH - MAIN APPLICATION
   File: js/app.js
   Features:
   - Website initialization
   - Firebase login status
   - Theme toggle
   - User greeting
   - Footer year
   - Back to top
   - Notifications
   - Page loading animation
   ========================================== */

"use strict";

const PixelRushApp = (() => {
    const THEME_KEY = "pixelrush_theme_v1";

    // ---------- SELECTOR HELPER ----------
    function $(selector, parent = document) {
        return parent.querySelector(selector);
    }

    function $all(selector, parent = document) {
        return [...parent.querySelectorAll(selector)];
    }

    // ---------- THEME ----------
    function applyTheme(theme) {
        const selectedTheme =
            theme === "light" ? "light" : "dark";

        document.documentElement.dataset.theme = selectedTheme;

        document.documentElement.classList.toggle(
            "light-theme",
            selectedTheme === "light"
        );

        const themeButtons = $all(
            "#themeToggle, [data-theme-toggle]"
        );

        themeButtons.forEach(button => {
            button.textContent =
                selectedTheme === "dark" ? "☀️" : "🌙";

            button.setAttribute(
                "aria-label",
                selectedTheme === "dark"
                    ? "Switch to light theme"
                    : "Switch to dark theme"
            );

            button.setAttribute(
                "aria-pressed",
                String(selectedTheme === "light")
            );
        });
    }

    function initTheme() {
        let savedTheme = "dark";

        try {
            savedTheme =
                localStorage.getItem(THEME_KEY) || "dark";
        } catch (error) {
            console.warn("Theme preference unavailable.", error);
        }

        applyTheme(savedTheme);

        $all("#themeToggle, [data-theme-toggle]").forEach(button => {
            button.addEventListener("click", () => {
                const current =
                    document.documentElement.dataset.theme || "dark";

                const next = current === "dark" ? "light" : "dark";

                try {
                    localStorage.setItem(THEME_KEY, next);
                } catch (error) {
                    console.warn("Could not save theme.", error);
                }

                applyTheme(next);
            });
        });
    }

    // ---------- CURRENT YEAR ----------
    function initFooterYear() {
        $all("[data-current-year], #currentYear").forEach(element => {
            element.textContent = new Date().getFullYear();
        });
    }

    // ---------- USER GREETING ----------
    function updateUserGreeting(user) {
        const greeting = $("[data-user-greeting], #userGreeting");
        const userName = $("[data-user-name], #appUserName");

        if (userName) {
            userName.textContent = user
                ? (user.displayName || user.email || "Player")
                : "Guest";
        }

        if (greeting) {
            greeting.textContent = user
                ? `Welcome back, ${user.displayName || "Player"}!`
                : "Welcome to PixelRush!";
        }

        // Show or hide optional sign-in and profile links.
        $all('[data-show-when="signed-in"]').forEach(element => {
            element.hidden = !user;
        });

        $all('[data-show-when="signed-out"]').forEach(element => {
            element.hidden = !!user;
        });
    }

    function initAuthIntegration() {
        // auth.js dispatches this event after Firebase auth changes.
        document.addEventListener(
            "pixelrush:auth-changed",
            event => {
                updateUserGreeting(event.detail?.user || null);
            }
        );

        // Handles pages where auth.js initialized first.
        if (window.PixelRushAuth?.getCurrentUser) {
            window.PixelRushAuth.getCurrentUser()
                .then(updateUserGreeting)
                .catch(error => {
                    console.warn("Could not read auth state.", error);
                });
        } else {
            updateUserGreeting(null);
        }
    }

    // ---------- TOAST NOTIFICATIONS ----------
    function notify(message, type = "info", duration = 3000) {
        let container = $("#appToastContainer");

        if (!container) {
            container = document.createElement("div");
            container.id = "appToastContainer";

            Object.assign(container.style, {
                position: "fixed",
                right: "20px",
                bottom: "20px",
                zIndex: "9999",
                display: "grid",
                gap: "10px",
                maxWidth: "min(360px, calc(100vw - 40px))"
            });

            document.body.appendChild(container);
        }

        const toast = document.createElement("div");
        toast.textContent = String(message);

        Object.assign(toast.style, {
            padding: "14px 18px",
            borderRadius: "12px",
            background: "#17172b",
            color: "#ffffff",
            border: `1px solid ${
                type === "error" ? "#ff5d73" :
                type === "success" ? "#38e8a5" : "#8b7cff"
            }`,
            boxShadow: "0 8px 30px rgba(0,0,0,.25)",
            fontSize: "14px",
            lineHeight: "1.5",
            overflowWrap: "anywhere"
        });

        container.appendChild(toast);

        window.setTimeout(() => {
            toast.remove();

            if (!container.childElementCount) {
                container.remove();
            }
        }, Math.max(1000, duration));
    }

    // ---------- BACK TO TOP ----------
    function initBackToTop() {
        const button = $(
            "#backToTop, [data-back-to-top]"
        );

        if (!button) return;

        button.addEventListener("click", () => {
            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });
        });

        function updateButton() {
            button.hidden = window.scrollY < 300;
        }

        window.addEventListener("scroll", updateButton, {
            passive: true
        });

        updateButton();
    }

    // ---------- INTERNAL PAGE LINKS ----------
    function initPageLinks() {
        const currentPath = window.location.pathname;

        $all("a[href]").forEach(link => {
            const href = link.getAttribute("href");

            if (!href || href.startsWith("#")) return;

            try {
                const url = new URL(href, window.location.href);

                if (
                    url.origin === window.location.origin &&
                    url.pathname === currentPath
                ) {
                    link.setAttribute("aria-current", "page");
                }
            } catch {
                // Ignore invalid or unsupported links.
            }
        });
    }

    // ---------- PAGE READY ----------
    function initPageReady() {
        document.documentElement.classList.add("app-ready");

        $all("[data-loading-screen]").forEach(screen => {
            screen.classList.add("loading-finished");
        });
    }

    // ---------- EXTERNAL API ----------
    function init() {
        initTheme();
        initFooterYear();
        initAuthIntegration();
        initBackToTop();
        initPageLinks();
        initPageReady();

        console.log("🎮 PixelRush application initialized.");
    }

    return {
        init,
        notify,
        applyTheme
    };
})();

// Make the app API available to other scripts.
window.PixelRushApp = PixelRushApp;

// Run after HTML is ready.
if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        PixelRushApp.init,
        { once: true }
    );
} else {
    PixelRushApp.init();
}
