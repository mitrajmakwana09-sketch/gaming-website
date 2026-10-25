
/* ==========================================
   PIXELRUSH - ANIMATION CONTROLLER
   File: js/animations.js
   Features:
   - Scroll reveal animations
   - Gaming card hover effects
   - Button ripple effect
   - Animated counters
   - Scroll progress bar
   - Back-to-top visibility
   - Reduced-motion accessibility
   ========================================== */

"use strict";

const PixelRushAnimations = (() => {
    const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;

    // ---------- INJECT ANIMATION STYLES ----------
    function injectStyles() {
        if (document.getElementById("pixelrush-animation-styles")) {
            return;
        }

        const style = document.createElement("style");
        style.id = "pixelrush-animation-styles";

        style.textContent = `
            .pr-reveal {
                opacity: 0;
                transform: translateY(28px);
                transition:
                    opacity .65s ease,
                    transform .65s cubic-bezier(.2,.7,.2,1);
            }

            .pr-reveal.pr-visible {
                opacity: 1;
                transform: translateY(0);
            }

            .pr-reveal-left {
                transform: translateX(-28px);
            }

            .pr-reveal-right {
                transform: translateX(28px);
            }

            .pr-reveal-scale {
                transform: scale(.94);
            }

            .pr-visible.pr-reveal-left,
            .pr-visible.pr-reveal-right,
            .pr-visible.pr-reveal-scale {
                transform: none;
            }

            .pr-game-card,
            [data-game-card] {
                transition:
                    transform .25s ease,
                    box-shadow .25s ease,
                    border-color .25s ease;
                transform-style: preserve-3d;
            }

            .pr-game-card:hover,
            [data-game-card]:hover {
                transform: translateY(-6px);
                box-shadow: 0 14px 36px rgba(120, 75, 255, .18);
            }

            .pr-ripple {
                position: relative;
                overflow: hidden;
                isolation: isolate;
            }

            .pr-ripple-wave {
                position: absolute;
                border-radius: 50%;
                background: rgba(255,255,255,.35);
                transform: scale(0);
                animation: pr-ripple .55s ease-out forwards;
                pointer-events: none;
                z-index: 0;
            }

            @keyframes pr-ripple {
                to {
                    transform: scale(1);
                    opacity: 0;
                }
            }

            @keyframes pr-float {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-9px); }
            }

            @keyframes pr-glow {
                0%, 100% {
                    filter: drop-shadow(0 0 3px rgba(139,92,246,.25));
                }
                50% {
                    filter: drop-shadow(0 0 12px rgba(139,92,246,.65));
                }
            }

            .pr-float {
                animation: pr-float 3s ease-in-out infinite;
            }

            .pr-glow {
                animation: pr-glow 2.4s ease-in-out infinite;
            }

            #prScrollProgress {
                position: fixed;
                top: 0;
                left: 0;
                height: 3px;
                width: 0;
                background: linear-gradient(90deg, #8b5cf6, #22d3ee);
                z-index: 10000;
                pointer-events: none;
                transition: width .08s linear;
            }

            .pr-counter {
                font-variant-numeric: tabular-nums;
            }

            @media (prefers-reduced-motion: reduce) {
                .pr-reveal,
                .pr-game-card,
                [data-game-card],
                .pr-float,
                .pr-glow {
                    animation: none !important;
                    transition: none !important;
                    transform: none !important;
                }

                .pr-reveal {
                    opacity: 1 !important;
                }
            }
        `;

        document.head.appendChild(style);
    }

    // ---------- SCROLL REVEAL ----------
    function initReveal() {
        const elements = document.querySelectorAll(
            "[data-reveal], .reveal, .scroll-reveal"
        );

        if (prefersReducedMotion || !("IntersectionObserver" in window)) {
            elements.forEach(element => {
                element.classList.add("pr-visible");
                element.style.opacity = "1";
            });
            return;
        }

        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;

                entry.target.classList.add("pr-visible");
                obs.unobserve(entry.target);
            });
        }, {
            threshold: 0.12,
            rootMargin: "0px 0px -35px 0px"
        });

        elements.forEach(element => {
            element.classList.add("pr-reveal");

            const type = element.dataset.reveal;

            if (type === "left") {
                element.classList.add("pr-reveal-left");
            } else if (type === "right") {
                element.classList.add("pr-reveal-right");
            } else if (type === "scale") {
                element.classList.add("pr-reveal-scale");
            }

            observer.observe(element);
        });
    }

    // ---------- CARD HOVER ----------
    function initCardEffects() {
        const cards = document.querySelectorAll(
            "[data-game-card], .game-card, .pr-game-card"
        );

        cards.forEach(card => {
            if (card.dataset.prHoverReady) return;
            card.dataset.prHoverReady = "true";

            card.addEventListener("pointermove", event => {
                if (prefersReducedMotion) return;
                if (event.pointerType === "touch") return;

                const rect = card.getBoundingClientRect();
                const x = (event.clientX - rect.left) / rect.width;
                const y = (event.clientY - rect.top) / rect.height;

                card.style.setProperty("--pointer-x", `${x * 100}%`);
                card.style.setProperty("--pointer-y", `${y * 100}%`);
            });

            card.addEventListener("pointerleave", () => {
                card.style.removeProperty("--pointer-x");
                card.style.removeProperty("--pointer-y");
            });
        });
    }

    // ---------- BUTTON RIPPLE ----------
    function initRipple() {
        document.addEventListener("click", event => {
            if (prefersReducedMotion) return;

            const button = event.target.closest(
                "[data-ripple], .ripple"
            );

            if (!button) return;

            // Don't create ripples on disabled controls.
            if (button.disabled || button.getAttribute("aria-disabled") === "true") {
                return;
            }

            const rect = button.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const wave = document.createElement("span");

            wave.className = "pr-ripple-wave";
            wave.style.width = `${size}px`;
            wave.style.height = `${size}px`;
            wave.style.left = `${event.clientX - rect.left - size / 2}px`;
            wave.style.top = `${event.clientY - rect.top - size / 2}px`;

            button.appendChild(wave);

            wave.addEventListener("animationend", () => {
                wave.remove();
            }, { once: true });
        });
    }

    // ---------- ANIMATED COUNTERS ----------
    function animateCounter(element) {
        if (element.dataset.prCountDone === "true") return;

        const target = Number(element.dataset.count);

        if (!Number.isFinite(target)) return;

        element.dataset.prCountDone = "true";

        const decimals = Number(element.dataset.decimals || 0);
        const duration = Math.max(
            200,
            Number(element.dataset.duration || 1200)
        );

        const prefix = element.dataset.prefix || "";
        const suffix = element.dataset.suffix || "";

        const format = value =>
            prefix + value.toLocaleString(undefined, {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals
            }) + suffix;

        if (prefersReducedMotion) {
            element.textContent = format(target);
            return;
        }

        const startTime = performance.now();

        function frame(now) {
            const progress = Math.min(
                (now - startTime) / duration,
                1
            );

            // Ease-out cubic.
            const eased = 1 - Math.pow(1 - progress, 3);
            const value = target * eased;

            element.textContent = format(value);

            if (progress < 1) {
                requestAnimationFrame(frame);
            } else {
                element.textContent = format(target);
            }
        }

        requestAnimationFrame(frame);
    }

    function initCounters() {
        const counters = document.querySelectorAll("[data-count]");

        if (!("IntersectionObserver" in window)) {
            counters.forEach(animateCounter);
            return;
        }

        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;

                animateCounter(entry.target);
                obs.unobserve(entry.target);
            });
        }, {
            threshold: 0.4
        });

        counters.forEach(counter => observer.observe(counter));
    }

    // ---------- SCROLL PROGRESS ----------
    function initScrollProgress() {
        if (!document.body) return;

        let progress = document.getElementById("prScrollProgress");

        if (!progress) {
            progress = document.createElement("div");
            progress.id = "prScrollProgress";
            progress.setAttribute("aria-hidden", "true");
            document.body.appendChild(progress);
        }

        let scheduled = false;

        function update() {
            const scrollable =
                document.documentElement.scrollHeight -
                window.innerHeight;

            const percent = scrollable > 0
                ? (window.scrollY / scrollable) * 100
                : 0;

            progress.style.width =
                `${Math.min(100, Math.max(0, percent))}%`;

            scheduled = false;
        }

        window.addEventListener("scroll", () => {
            if (scheduled) return;

            scheduled = true;
            requestAnimationFrame(update);
        }, { passive: true });

        window.addEventListener("resize", update);
        update();
    }

    // ---------- PUBLIC INITIALIZATION ----------
    function init() {
        injectStyles();
        initReveal();
        initCardEffects();
        initRipple();
        initCounters();
        initScrollProgress();

        console.log("✨ PixelRush animations initialized.");
    }

    return {
        init
    };
})();

// Expose the animation controller for other scripts.
window.PixelRushAnimations = PixelRushAnimations;

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        PixelRushAnimations.init,
        { once: true }
    );
} else {
    PixelRushAnimations.init();
}
