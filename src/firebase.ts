import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAc7B6XLSv7WhiJ4TxctMZOF8duiVaz0LA",
  authDomain: "astrocare-7efd1.firebaseapp.com",
  projectId: "astrocare-7efd1",
  storageBucket: "astrocare-7efd1.firebasestorage.app",
  messagingSenderId: "605436420262",
  appId: "1:605436420262:web:474def4bc9a12d1bce9467",
  measurementId: "G-D05QMDE4EB"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});
