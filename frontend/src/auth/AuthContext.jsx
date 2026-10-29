import {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
} from "react";

import { showSuccess } from "../lib/toast";
import api from "../api/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {

    // ============================================================
    // 1. INSTANT / OPTIMISTIC UI RENDERING (from localStorage)
    // ============================================================

    const [user, setUser] = useState(() => {
        try {
            const savedUser = localStorage.getItem("user");
            return savedUser ? JSON.parse(savedUser) : null;
        } catch (error) {
            console.error("Failed to parse user from localStorage:", error);
            return null;
        }
    });

    // Loading is initialized to false because user state is ready synchronously
    const [loading, setLoading] = useState(false);

    // ============================================================
    // 2. GOOGLE OAUTH CALLBACK
    // ============================================================
    const handleOAuthCallback = useCallback(() => {
        const hash = window.location.hash;

        if (!hash.startsWith("#oauth-callback?")) {
            return false;
        }

        const queryString = hash.slice("#oauth-callback?".length);
        const params = new URLSearchParams(queryString);

        const name = params.get("name");
        const email = params.get("email");
        const picture = params.get("picture");

        if (!email) {
            return false;
        }

        const userData = {
            name,
            email,
            picture,
        };

        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));

        // Clean up OAuth information from URL hash
        window.history.replaceState(
            null,
            "",
            window.location.pathname
        );

        return true;
    }, []);

    // ============================================================
    // 3. BACKGROUND AUTH CHECK (/auth/me)
    // ============================================================
    const checkAuth = useCallback(async () => {
        handleOAuthCallback();

        try {
            const response = await api.get("/auth/me");
            if (response.status === 200 && response.data) {
                const userData = response.data;
                setUser(userData);
                localStorage.setItem("user", JSON.stringify(userData));
            }
        } catch (error) {
            if (error.response?.status === 401) {
                console.warn("Session expired or invalid, logging out.");
                localStorage.removeItem("user");
                setUser(null);
            } else {
                console.error("Background auth check failed:", error);
            }
        } finally {
        }
    }, [handleOAuthCallback]);

    // ============================================================
    // 4. SYNC ON MOUNT & GLOBAL AUTH LOGOUT LISTENER
    // ============================================================
    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    useEffect(() => {
        // Triggered by axios interceptor if a refresh attempt fails on any request
        const handleUnauthorized = () => {
            localStorage.removeItem("user");
            setUser(null);
        };

        window.addEventListener("auth:unauthorized", handleUnauthorized);
        return () => window.removeEventListener("auth:unauthorized", handleUnauthorized);
    }, []);

    // ============================================================
    // 5. LOGIN
    // ============================================================
    const login = useCallback((userData) => {
        if (userData) {
            setUser(userData);
            localStorage.setItem("user", JSON.stringify(userData));
        }
    }, []);

    // ============================================================
    // 6. LOGOUT
    // ============================================================
    const logout = useCallback(async () => {
        try {
            const response = await api.post("/auth/logout");
            setLoading(true);
            if (response.status === 200) {
                showSuccess("Logged out successfully");
            }
        } catch (error) {
            console.error("Logout failed:", error);
        } finally {
            // Clear local user metadata & state
            localStorage.removeItem("user");
            setUser(null);
            setLoading(false);
        }
    }, []);

    const isauthenticated = !!user;

    return (
        <AuthContext.Provider
            value={{
                user,
                isauthenticated,
                loading,
                login,
                logout,
                checkAuth,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
