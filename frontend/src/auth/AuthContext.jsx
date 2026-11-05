import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from "react";

import { showSuccess } from "../lib/toast";
import api from "../api/api";
import { clearAnalysis } from "../lib/analysisStorage";

const AuthContext = createContext(null);

function getStoredUser() {
    try {
        const savedUser = localStorage.getItem("user");
        return savedUser ? JSON.parse(savedUser) : null;
    } catch (error) {
        console.error("Failed to parse user from localStorage:", error);
        localStorage.removeItem("user");
        return null;
    }
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(getStoredUser);
    const [loading, setLoading] = useState(true);

    const handleOAuthCallback = useCallback(() => {
        const hash = window.location.hash;
        if (!hash.startsWith("#oauth-callback?")) return false;

        const queryString = hash.slice("#oauth-callback?".length);
        const params = new URLSearchParams(queryString);
        const name = params.get("name");
        const email = params.get("email");
        const picture = params.get("picture");
        const accessToken = params.get("access_token");

        if (!email) return false;

        if (accessToken) {
            localStorage.setItem("access_token", accessToken);
        } else {
            localStorage.removeItem("access_token");
        }

        const userData = { name, email, picture };
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));

        window.history.replaceState(null, "", window.location.pathname);
        return true;
    }, []);

    const checkAuth = useCallback(async () => {
        handleOAuthCallback();

        try {
            const response = await api.get("/auth/me");
            if (response.status === 200 && response.data) {
                setUser(response.data);
                localStorage.setItem("user", JSON.stringify(response.data));
            } else {
                localStorage.removeItem("access_token");
                localStorage.removeItem("user");
                setUser(null);
            }
        } catch (error) {
            if (error.response?.status === 401) {
                localStorage.removeItem("access_token");
                localStorage.removeItem("user");
                setUser(null);
                clearAnalysis();
            } else {
                console.error("Background auth check failed:", error);
            }
        } finally {
            setLoading(false);
        }
    }, [handleOAuthCallback]);

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    useEffect(() => {
        const handleUnauthorized = () => {
            localStorage.removeItem("access_token");
            localStorage.removeItem("user");
            setUser(null);
            clearAnalysis();
        };

        window.addEventListener("auth:unauthorized", handleUnauthorized);
        return () => {
            window.removeEventListener("auth:unauthorized", handleUnauthorized);
        };
    }, []);

    useEffect(() => {
        const syncUserAcrossTabs = (event) => {
            if (event.key === "user") {
                try {
                    setUser(event.newValue ? JSON.parse(event.newValue) : null);
                } catch (error) {
                    console.error("Failed to sync user from another tab:", error);
                    setUser(null);
                }
            }

            if (event.key === "access_token" && event.newValue === null) {
                localStorage.removeItem("user");
                setUser(null);
            }
        };

        window.addEventListener("storage", syncUserAcrossTabs);
        return () => window.removeEventListener("storage", syncUserAcrossTabs);
    }, []);

    const login = useCallback((userData, accessToken) => {
        if (typeof accessToken !== "string" || !accessToken) {
            throw new Error("Authentication succeeded without an access token.");
        }

        const normalizedUser = userData || {};
        localStorage.setItem("access_token", accessToken);
        localStorage.setItem("user", JSON.stringify(normalizedUser));
        setUser(normalizedUser);
    }, []);

    const updateUser = useCallback((userData) => {
        const updatedUser = { ...user, ...userData };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
    }, [user]);

    const logout = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.post("/auth/logout");
            if (response.status === 200) {
                showSuccess("Logged out successfully");
            }
        } catch (error) {
            console.error("Logout failed:", error);
        } finally {
            localStorage.removeItem("user");
            localStorage.removeItem("access_token");
            setUser(null);
            setLoading(false);
            clearAnalysis();
        }
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                isauthenticated: !!user,
                loading,
                login,
                updateUser,
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
