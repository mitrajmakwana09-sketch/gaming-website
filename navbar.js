
"use strict";

/* ==========================================
   PIXELRUSH GAMING WEBSITE
   File: js/navbar.js
   Features:
   1. Mobile hamburger menu
   2. Active page highlighting
   3. Dropdown menus
   4. Scroll effect
   5. Close menu on outside click
   6. Keyboard accessibility
   ========================================== */

document.addEventListener("DOMContentLoaded", () => {

    /* ---------- Select elements ---------- */

    const navbar = document.querySelector(".navbar");
    const navLinks = document.querySelector(".nav-links");

    const menuToggle =
        document.querySelector(".menu-toggle") ||
        document.querySelector("#menuToggle") ||
        document.querySelector("#navToggle");

    if (!navbar || !navLinks) {
        console.warn(
            "PixelRush Navbar: .navbar or .nav-links was not found."
        );
        return;
    }

    /* ---------- Mobile menu ---------- */

    function openMenu() {
        navLinks.classList.add("open");

        if (menuToggle) {
            menuToggle.classList.add("active");
            menuToggle.setAttribute("aria-expanded", "true");
            menuToggle.setAttribute("aria-label", "Close navigation menu");
            menuToggle.textContent = "✕";
        }
    }

    function closeMenu() {
        navLinks.classList.remove("open");

        if (menuToggle) {
            menuToggle.classList.remove("active");
            menuToggle.setAttribute("aria-expanded", "false");
            menuToggle.setAttribute("aria-label", "Open navigation menu");
            menuToggle.textContent = "☰";
        }
    }

    function toggleMenu() {
        const isOpen = navLinks.classList.contains("open");

        if (isOpen) {
            closeMenu();
        } else {
            openMenu();
        }
    }

    if (menuToggle) {
        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.setAttribute("aria-controls", navLinks.id || "navLinks");

        menuToggle.addEventListener("click", toggleMenu);
    }

    /* ---------- Active page highlighting ---------- */

    function highlightCurrentPage() {
        const currentPath = window.location.pathname;
        let currentPage = currentPath.split("/").pop().toLowerCase();

        if (!currentPage || currentPage === "") {
            currentPage = "index.html";
        }

        navLinks.querySelectorAll("a[href]").forEach(link => {
            const href = link.getAttribute("href");

            // Ignore external links and in-page anchors.
            if (
                !href ||
                href.startsWith("http://") ||
                href.startsWith("https://") ||
                href.startsWith("mailto:") ||
                href.startsWith("tel:") ||
                href.startsWith("#")
            ) {
                return;
            }

            const linkPath = href.split("#")[0].split("?")[0];
            const linkPage = linkPath.split("/").pop().toLowerCase();

            if (linkPage === currentPage) {
                link.classList.add("active");
                link.setAttribute("aria-current", "page");
            } else {
                link.classList.remove("active");
                link.removeAttribute("aria-current");
            }
        });
    }

    highlightCurrentPage();

    /* ---------- Close menu after navigation ---------- */

    navLinks.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", () => {
            closeMenu();
        });
    });

    /* ---------- Close on outside click ---------- */

    document.addEventListener("click", event => {
        if (!navbar.contains(event.target)) {
            closeMenu();
        }
    });

    /* ---------- Keyboard support ---------- */

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            closeMenu();

            if (menuToggle) {
                menuToggle.focus();
            }
        }
    });

    /* ---------- Navbar scroll effect ---------- */

    function handleScroll() {
        if (window.scrollY > 25) {
            navbar.classList.add("scrolled");
        } else {
            navbar.classList.remove("scrolled");
        }
    }

    window.addEventListener("scroll", handleScroll, {
        passive: true
    });

    handleScroll();

    /* ---------- Dropdown menus ---------- */

    const dropdowns = document.querySelectorAll(".nav-dropdown");

    dropdowns.forEach(dropdown => {
        const trigger = dropdown.querySelector(".dropdown-toggle");

        if (!trigger) return;

        trigger.addEventListener("click", event => {
            event.preventDefault();

            const willOpen =
                !dropdown.classList.contains("dropdown-open");

            // Close other dropdowns first.
            dropdowns.forEach(other => {
                other.classList.remove("dropdown-open");

                const otherTrigger =
                    other.querySelector(".dropdown-toggle");

                if (otherTrigger) {
                    otherTrigger.setAttribute(
                        "aria-expanded",
                        "false"
                    );
                }
            });

            if (willOpen) {
                dropdown.classList.add("dropdown-open");
                trigger.setAttribute("aria-expanded", "true");
            }
        });
    });

    document.addEventListener("click", event => {
        dropdowns.forEach(dropdown => {
            if (!dropdown.contains(event.target)) {
                dropdown.classList.remove("dropdown-open");

                const trigger =
                    dropdown.querySelector(".dropdown-toggle");

                if (trigger) {
                    trigger.setAttribute("aria-expanded", "false");
                }
            }
        });
    });

    /* ---------- Responsive resize ---------- */

    window.addEventListener("resize", () => {
        if (window.innerWidth > 768) {
            closeMenu();
        }
    });

    console.log("PixelRush Navbar initialized successfully.");
});
