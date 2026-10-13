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

    const checkAuth = useCallback(async () => {
        const token = localStorage.getItem("access_token");

        // If no token stored and no user cached, finish loading
        if (!token && !localStorage.getItem("user")) {
            setLoading(false);
            return;
        }

        try {
            const response = await api.get("/auth/me");

            if (response.status === 200) {
                setUser(response.data);
                localStorage.setItem("user", JSON.stringify(response.data));
            }
        } catch (error) {
            if (error.response?.status === 401) {
                localStorage.removeItem("access_token");
                localStorage.removeItem("refresh_token");
                localStorage.removeItem("user");
                setUser(null);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    const isauthenticated = !!user;

    const login = useCallback((userData, tokens = {}) => {
        if (tokens.access_token) {
            localStorage.setItem("access_token", tokens.access_token);
        }
        if (tokens.refresh_token) {
            localStorage.setItem("refresh_token", tokens.refresh_token);
        }
        if (userData) {
            localStorage.setItem("user", JSON.stringify(userData));
            setUser(userData);
        }
    }, []);

    useEffect(() => {
        // Handle redirect callback from Google OAuth
        const params = new URLSearchParams(window.location.search);
        if (params.get("google_auth") === "success") {
            const userData = {
                id: params.get("id"),
                name: params.get("name"),
                email: params.get("email"),
                picture: params.get("picture") || null,
                is_verified: true,
            };
            const access_token = params.get("access_token");
            const refresh_token = params.get("refresh_token");

            login(userData, { access_token, refresh_token });

            // Clean query parameters from URL without reload
            const cleanUrl = window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
        }
    }, [login]);

    useEffect(() => {
        // Handle popup postMessage from Google OAuth
        const handleMessage = (event) => {
            if (event.data?.type === "GOOGLE_AUTH_SUCCESS") {
                const { user: userData, tokens } = event.data;
                login(userData, tokens || {});
            }
        };

        window.addEventListener("message", handleMessage);
        return () => window.removeEventListener("message", handleMessage);
    }, [login]);

    const logout = async () => {
        try {
            const refreshToken = localStorage.getItem("refresh_token");
            await api.post("/auth/logout", { refresh_token: refreshToken });
        } catch (error) {
            console.error("Logout failed:", error);
        } finally {
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
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