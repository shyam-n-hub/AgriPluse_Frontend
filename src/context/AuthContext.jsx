// Authentication Context – provides auth state and methods throughout the app
import { createContext, useContext, useEffect, useState } from "react";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile,
} from "firebase/auth";
import { ref, set, get } from "firebase/database";
import { auth, db } from "../firebase/config";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    // Sign up new user + save profile to Realtime DB
    async function signup(email, password, displayName) {
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(credential.user, { displayName });
        await set(ref(db, `users/${credential.user.uid}`), {
            uid: credential.user.uid,
            email,
            displayName,
            createdAt: Date.now(),
            role: "farmer",
        });
        return credential;
    }

    // Login
    function login(email, password) {
        return signInWithEmailAndPassword(auth, email, password);
    }

    // Logout
    function logout() {
        return signOut(auth);
    }

    // Load user profile from DB
    async function loadUserProfile(uid) {
        try {
            const snap = await get(ref(db, `users/${uid}`));
            if (snap.exists()) setUserProfile(snap.val());
        } catch (err) {
            console.error("Failed to load user profile:", err);
        }
    }

    // Listen to auth state changes
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            if (user) await loadUserProfile(user.uid);
            else setUserProfile(null);
            setLoading(false);
        });
        return unsub;
    }, []);

    const value = { currentUser, userProfile, signup, login, logout, loading };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

// Hook to consume auth context
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}
