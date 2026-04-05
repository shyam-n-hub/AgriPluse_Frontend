// Firebase configuration for Plantiq 2.0
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDv9WVRTaUlMHAiXsZ7oR1mQq3SMt1Hueg",
  authDomain: "agripulse-331d2.firebaseapp.com",
  databaseURL: "https://agripulse-331d2-default-rtdb.firebaseio.com",
  projectId: "agripulse-331d2",
  storageBucket: "agripulse-331d2.firebasestorage.app",
  messagingSenderId: "340707120685",
  appId: "1:340707120685:web:fc85ae65167c6965670aa4",
  measurementId: "G-PGE08XHYQZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export services
export const auth = getAuth(app);
export const db = getDatabase(app);
export const storage = getStorage(app);

export default app;
