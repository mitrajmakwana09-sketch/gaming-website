
/* =========================================
   PIXELRUSH - AUTHENTICATION SYSTEM
   File: js/auth.js

   Features:
   - Firebase Register / Login / Logout
   - Firestore Player Profile
   - Password Reset
   - Auth State / Navigation
   - Return to requested game after login
   ========================================= */

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";

import {
    doc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

import {
    auth,
    db,
    authReady
} from "./firebase-config.js";

/* =========================================
   1. CONFIGURATION
   ========================================= */

const HOME_PAGE = "./index.html";
const LOGIN_PAGE = "./login.html";
const RETURN_KEY = "pixelrush_return_after_login";

let currentUser = null;

/* =========================================
   2. HELPERS
   ========================================= */

function getElement(...selectors) {
    for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) return element;
    }

    return null;
}

function showMessage(message, type = "error") {
    const box = getElement(
        "#authMessage",
        "#formMessage",
        "#message",
        "[data-auth-message]"
    );

    if (!box) {
        alert(message);
        return;
    }

    box.textContent = message;
    box.dataset.type = type;
    box.setAttribute("role", "status");
    box.style.display = "block";
}

function clearMessage() {
    const box = getElement(
        "#authMessage",
        "#formMessage",
        "#message",
        "[data-auth-message]"
    );

    if (box) {
        box.textContent = "";
        box.style.display = "none";
    }
}

function setLoading(form, loading, defaultText = "Continue") {
    if (!form) return;

    const button = form.querySelector(
        'button[type="submit"], input[type="submit"]'
    );

    if (!button) return;

    if (loading) {
        if (!button.dataset.originalText) {
            button.dataset.originalText =
                button.tagName === "INPUT"
                    ? button.value
                    : button.textContent;
        }

        button.disabled = true;

        if (button.tagName === "INPUT") {
            button.value = "Please wait...";
        } else {
            button.textContent = "Please wait...";
        }
    } else {
        button.disabled = false;

        const original =
            button.dataset.originalText || defaultText;

        if (button.tagName === "INPUT") {
            button.value = original;
        } else {
            button.textContent = original;
        }
    }
}

function getFriendlyError(error) {
    const messages = {
        "auth/email-already-in-use":
            "This email is already registered. Please log in.",

        "auth/invalid-email":
            "Please enter a valid email address.",

        "auth/weak-password":
            "Choose a stronger password with at least 6 characters.",

        "auth/invalid-credential":
            "Incorrect email or password.",

        "auth/user-not-found":
            "No account found. Please register first.",

        "auth/wrong-password":
            "Incorrect email or password.",

        "auth/user-disabled":
            "This account has been disabled.",

        "auth/too-many-requests":
            "Too many attempts. Please try again later.",

        "auth/network-request-failed":
            "Network error. Check your internet connection.",

        "auth/operation-not-allowed":
            "Enable Email/Password in Firebase Authentication.",

        "auth/invalid-api-key":
            "Firebase API key is incorrect. Check firebase-config.js.",

        "auth/unauthorized-domain":
            "This website domain is not authorized in Firebase.",

        "permission-denied":
            "Firestore permission denied. Check your security rules."
    };

    return messages[error?.code] ||
        error?.message ||
        "Something went wrong. Please try again.";
}

/* =========================================
   3. RETURN-TO-GAME REDIRECT
   ========================================= */

// Only allow same-origin URLs inside this website.
function getSafeReturnUrl() {
    const savedPath = sessionStorage.getItem(RETURN_KEY);

    if (!savedPath) return null;

    try {
        const target = new URL(savedPath, window.location.origin);

        if (target.origin !== window.location.origin) {
            sessionStorage.removeItem(RETURN_KEY);
            return null;
        }

        // Only allow returning to a game page.
        if (!target.pathname.includes("/games/")) {
            sessionStorage.removeItem(RETURN_KEY);
            return null;
        }

        return target.href;
    } catch (error) {
        sessionStorage.removeItem(RETURN_KEY);
        return null;
    }
}

function redirectAfterAuthentication() {
    const returnUrl = getSafeReturnUrl();

    if (returnUrl) {
        sessionStorage.removeItem(RETURN_KEY);
        window.location.replace(returnUrl);
        return;
    }

    window.location.replace(HOME_PAGE);
}

/* =========================================
   4. REGISTER
   ========================================= */

async function registerUser({
    name,
    username = "",
    email,
    password
}) {
    await authReady;

    name = (name || "").trim();
    username = (username || "").trim();
    email = (email || "").trim().toLowerCase();

    if (!name || !email || !password) {
        throw new Error("Please fill in all required fields.");
    }

    if (password.length < 6) {
        throw new Error(
            "Password must contain at least 6 characters."
        );
    }

    const credential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
    );

    const user = credential.user;

    try {
        await updateProfile(user, {
            displayName: name
        });

        await setDoc(doc(db, "users", user.uid), {
            uid: user.uid,
            name,
            username,
            email: user.email,
            photoURL: user.photoURL || "",
            role: "player",
            totalScore: 0,
            gamesPlayed: 0,
            createdAt: serverTimestamp()
        });
    } catch (error) {
        console.error("Profile save failed:", error);

        throw new Error(
            "Your account was created, but your profile could not be saved. Check Firestore setup and security rules."
        );
    }

    return user;
}

/* =========================================
   5. LOGIN
   ========================================= */

async function loginUser(email, password) {
    await authReady;

    email = (email || "").trim().toLowerCase();

    if (!email || !password) {
        throw new Error("Enter your email and password.");
    }

    const credential = await signInWithEmailAndPassword(
        auth,
        email,
        password
    );

    return credential.user;
}

/* =========================================
   6. LOGOUT
   ========================================= */

async function logoutUser() {
    await authReady;
    await signOut(auth);

    // Do not keep a previous game redirect after logout.
    sessionStorage.removeItem(RETURN_KEY);

    window.location.replace(LOGIN_PAGE);
}

/* =========================================
   7. PASSWORD RESET
   ========================================= */

async function resetPassword(email) {
    await authReady;

    email = (email || "").trim().toLowerCase();

    if (!email) {
        throw new Error("Enter your email address first.");
    }

    await sendPasswordResetEmail(auth, email);
    return true;
}

/* =========================================
   8. AUTH STATE
   ========================================= */

async function getCurrentUser() {
    await authReady;
    return auth.currentUser;
}

function watchAuthState(callback) {
    return onAuthStateChanged(auth, callback);
}

function updateNavigation(user) {
    document.querySelectorAll(
        '[data-auth="login"], .login-link'
    ).forEach(element => {
        element.hidden = !!user;
    });

    document.querySelectorAll(
        '[data-auth="profile"], .profile-link'
    ).forEach(element => {
        element.hidden = !user;
    });

    document.querySelectorAll(
        '[data-auth="logout"], .logout-btn, #logoutBtn'
    ).forEach(element => {
        element.hidden = !user;
    });

    document.querySelectorAll("[data-user-name]").forEach(element => {
        element.textContent =
            user?.displayName || user?.email || "Player";
    });
}

/* =========================================
   9. REGISTER FORM
   ========================================= */

function setupRegisterForm() {
    const form = getElement("#registerForm", "#signupForm");
    if (!form || form.dataset.authInitialized) return;

    form.dataset.authInitialized = "true";

    form.addEventListener("submit", async event => {
        event.preventDefault();
        clearMessage();
        setLoading(form, true, "Create Account");

        try {
            const name = getElement(
                "#name", "#fullName", "#registerName"
            )?.value || "";

            const username = getElement(
                "#username", "#registerUsername"
            )?.value || "";

            const email = getElement(
                "#email", "#registerEmail"
            )?.value || "";

            const password = getElement(
                "#password", "#registerPassword"
            )?.value || "";

            const confirmPassword = getElement(
                "#confirmPassword", "#registerConfirmPassword"
            )?.value || "";

            if (password !== confirmPassword) {
                throw new Error("Passwords do not match.");
            }

            const terms = getElement("#terms", "#agreeTerms");

            if (terms && !terms.checked) {
                throw new Error(
                    "Please accept the terms and conditions."
                );
            }

            await registerUser({
                name,
                username,
                email,
                password
            });

            showMessage(
                "Account created successfully!",
                "success"
            );

            redirectAfterAuthentication();
        } catch (error) {
            console.error("Registration error:", error);
            showMessage(getFriendlyError(error));
        } finally {
            setLoading(form, false, "Create Account");
        }
    });
}

/* =========================================
   10. LOGIN FORM
   ========================================= */

function setupLoginForm() {
    const form = getElement("#loginForm", "#signinForm");
    if (!form || form.dataset.authInitialized) return;

    form.dataset.authInitialized = "true";

    form.addEventListener("submit", async event => {
        event.preventDefault();
        clearMessage();
        setLoading(form, true, "Login");

        try {
            const email = getElement(
                "#email", "#loginEmail"
            )?.value || "";

            const password = getElement(
                "#password", "#loginPassword"
            )?.value || "";

            await loginUser(email, password);

            showMessage("Login successful!", "success");

            redirectAfterAuthentication();
        } catch (error) {
            console.error("Login error:", error);
            showMessage(getFriendlyError(error));
        } finally {
            setLoading(form, false, "Login");
        }
    });
}

/* =========================================
   11. FORGOT PASSWORD
   ========================================= */

function setupPasswordReset() {
    const button = getElement(
        "#forgotPassword",
        "#resetPasswordBtn"
    );

    if (!button || button.dataset.authInitialized) return;

    button.dataset.authInitialized = "true";

    button.addEventListener("click", async event => {
        event.preventDefault();
        clearMessage();

        const email = getElement(
            "#email", "#loginEmail", "#resetEmail"
        )?.value || "";

        try {
            await resetPassword(email);

            showMessage(
                "If the address is eligible, a password reset email will be sent.",
                "success"
            );
        } catch (error) {
            showMessage(getFriendlyError(error));
        }
    });
}

/* =========================================
   12. LOGOUT BUTTONS
   ========================================= */

function setupLogoutButtons() {
    document.querySelectorAll(
        '[data-auth="logout"], .logout-btn, #logoutBtn'
    ).forEach(button => {
        if (button.dataset.authInitialized) return;

        button.dataset.authInitialized = "true";

        button.addEventListener("click", async () => {
            button.disabled = true;

            try {
                await logoutUser();
            } catch (error) {
                console.error("Logout error:", error);
                showMessage(getFriendlyError(error));
                button.disabled = false;
            }
        });
    });
}

/* =========================================
   13. PROTECTED PAGE HELPER
   ========================================= */

async function requireLogin(redirect = LOGIN_PAGE) {
    await authReady;

    if (auth.currentUser) {
        return auth.currentUser;
    }

    // Save the current page if it is a game URL.
    if (window.location.pathname.includes("/games/")) {
        sessionStorage.setItem(
            RETURN_KEY,
            window.location.pathname +
            window.location.search +
            window.location.hash
        );
    }

    window.location.replace(redirect);

    throw new Error("Login required.");
}

/* =========================================
   14. INITIALIZE AUTH SYSTEM
   ========================================= */

async function initAuth() {
    try {
        await authReady;

        currentUser = auth.currentUser;
        updateNavigation(currentUser);

        onAuthStateChanged(auth, user => {
            currentUser = user;
            updateNavigation(user);

            document.dispatchEvent(
                new CustomEvent("pixelrush:auth-changed", {
                    detail: { user }
                })
            );
        });

        setupRegisterForm();
        setupLoginForm();
        setupPasswordReset();
        setupLogoutButtons();

        console.log(
            "PixelRush authentication initialized."
        );
    } catch (error) {
        console.error(
            "PixelRush authentication setup failed:",
            error
        );
    }
}

/* =========================================
   15. PUBLIC API
   ========================================= */

window.PixelRushAuth = {
    registerUser,
    loginUser,
    logoutUser,
    resetPassword,
    getCurrentUser,
    watchAuthState,
    requireLogin
};

initAuth();
