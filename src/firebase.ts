import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAc7B6XLSv7WhiJ4TxctMZOF8duiVaz0LA",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "astrocare-7efd1.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "astrocare-7efd1",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "astrocare-7efd1.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "605436420262",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:605436420262:web:474def4bc9a12d1bce9467",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-D05QMDE4EB"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});
