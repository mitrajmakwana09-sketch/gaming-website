/* =========================================
   PIXELRUSH - FIREBASE CONFIGURATION
   File: js/firebase-config.js
   ========================================= */

import {
    initializeApp,
    getApp,
    getApps
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";

import {
    getAuth,
    setPersistence,
    browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";

import {
    getFirestore
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

/* =========================================
   1. FIREBASE PROJECT CONFIGURATION
   ========================================= */

// Firebase Console માંથી તમારી સાચી values નાખો.
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

/* =========================================
   2. INITIALIZE FIREBASE ONLY ONCE
   ========================================= */

const app = getApps().length > 0
    ? getApp()
    : initializeApp(firebaseConfig);

/* =========================================
   3. FIREBASE SERVICES
   ========================================= */

const auth = getAuth(app);
const db = getFirestore(app);

/* =========================================
   4. LOGIN PERSISTENCE
   User login remains active after browser restart.
   ========================================= */

const authReady = setPersistence(
    auth,
    browserLocalPersistence
).catch((error) => {
    console.error(
        "PixelRush: Auth persistence setup failed:",
        error
    );

    throw error;
});

/* =========================================
   5. EXPORT SERVICES
   Other JavaScript modules can import these.
   ========================================= */

export {
    app,
    auth,
    db,
    authReady,
    firebaseConfig
};