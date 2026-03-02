import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

let auth;
let googleProvider;
let firebaseEnabled = false;
const isPlaceholder = !firebaseConfig.apiKey || firebaseConfig.apiKey === "AIzaSyBwS-x-qM-X-x-x-x" || firebaseConfig.apiKey === "YOUR_API_KEY";

if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "undefined" && !isPlaceholder) {
    try {
        const app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        googleProvider = new GoogleAuthProvider();
        firebaseEnabled = true;
    } catch (e) {
        console.error("Firebase init failed:", e);
    }
}

export const onAuthStateChanged = (authInstance, callback) => {
    if (firebaseEnabled && authInstance) {
        import("firebase/auth").then(({ onAuthStateChanged: firebaseOnAuth }) => {
            firebaseOnAuth(authInstance, callback);
        });
        return () => { };
    } else {
        const isMock = localStorage.getItem("gt_auth_token") === "mock";
        const mockUser = isMock ? { displayName: 'Mock User', email: 'mock@example.com' } : null;
        setTimeout(() => callback(mockUser), 100);
        return () => { };
    }
};

export const logoutUser = async () => {
    localStorage.removeItem("gt_auth_token");
    if (firebaseEnabled && auth) {
        const { signOut } = await import("firebase/auth");
        await signOut(auth);
    }
    window.location.reload();
};

export { auth, googleProvider, firebaseEnabled };
