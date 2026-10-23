import {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback
} from "react";

import api from "../api/api";

const AuthContext = createContext(null);



export function AuthProvider({ children }) {

    /*
     * Initialize user from localStorage to prevent auth flicker on reload.
     */
    const [user, setUser] = useState(() => {
        try {
            const saved = localStorage.getItem("user");
            return saved ? JSON.parse(saved) : null;
        } catch {
            return null;
        }
    });

    const [loading, setLoading] = useState(true);

    /**
     * Handle OAuth callback from Google.
     * After Google redirects back, the URL hash contains:
     *   /#oauth-callback?access_token=...&name=...&email=...&picture=...
     * We parse this, store in localStorage, then clean up the URL.
     */
    const handleOAuthCallback = useCallback(() => {
        const hash = window.location.hash;
        if (!hash.startsWith("#oauth-callback?")) return false;

        const queryStr = hash.slice("#oauth-callback?".length);
        const params = new URLSearchParams(queryStr);

        const access_token = params.get("access_token");
        const name = params.get("name");
        const email = params.get("email");
        const picture = params.get("picture");

        if (!access_token) return false;

        const userData = { name, email, picture };

        localStorage.setItem("access_token", access_token);
        localStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);

        // Navigate to home, replacing history so the OAuth URL can't be revisited
        window.location.replace(window.location.origin + "/");

        return true;
    }, []);

    const checkAuth = useCallback(async () => {
        // If the URL contains OAuth callback data, process it first
        if (handleOAuthCallback()) {
            setLoading(false);
            return;
        }

        const storedToken = localStorage.getItem("access_token");
        const storedUser = localStorage.getItem("user");

        // If we already have both token and user data, we're good
        if (storedToken && storedUser) {
            setLoading(false);
            return;
        }

        // If we have a token but no user data, fetch /auth/me
        if (storedToken) {
            try {
                const response = await api.get("/auth/me");
                if (response.status === 200) {
                    setUser(response.data);
                    localStorage.setItem("user", JSON.stringify(response.data));
                }
            } catch (error) {
                if (error.response?.status === 401) {
                    localStorage.removeItem("access_token");
                    localStorage.removeItem("user");
                    setUser(null);
                }
            } finally {
                setLoading(false);
            }
            return;
        }

        // No token — try a silent refresh via httpOnly cookie
        try {
            const response = await api.post("/auth/refresh");
            if (response.status === 200) {
                const { access_token, user: userData } = response.data;
                if (access_token) {
                    localStorage.setItem("access_token", access_token);
                }
                if (userData) {
                    localStorage.setItem("user", JSON.stringify(userData));
                    setUser(userData);
                }
            }
        } catch {
            // No valid refresh token either — user is logged out
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, [handleOAuthCallback]);

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    const isauthenticated = !!user;

    /**
     * Called after a successful login/register/OTP-verify.
     * Stores the access_token and user data in localStorage.
     */
    const login = useCallback((userData, tokens = {}) => {
        if (tokens.access_token) {
            localStorage.setItem("access_token", tokens.access_token);
        }
        if (userData) {
            localStorage.setItem("user", JSON.stringify(userData));
            setUser(userData);
        }
    }, []);

    const logout = async () => {
        try {
            await api.post("/auth/logout");
        } catch (error) {
            console.error("Logout failed:", error);
        } finally {
            localStorage.removeItem("access_token");
            localStorage.removeItem("user");
            setUser(null);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isauthenticated,
                loading,
                login,
                logout,
                checkAuth
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}