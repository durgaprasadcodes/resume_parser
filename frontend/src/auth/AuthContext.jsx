import {
    createContext,
    useContext,
    useEffect,
    useState
} from "react";

import api from "../api/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {

    const [isauthenticated, setAuthenticated] = useState(null);
    const [loading, setLoading] = useState(true);

    const checkAuth = async () => {

        try {
            const response = await api.get("/auth/me");
            if (response.status === 200) {
                setAuthenticated(true)
            }
        } catch (error) {
            setAuthenticated(false);
        } finally {
            setLoading(false);

        }
    };

    useEffect(() => {
        checkAuth();
    }, []);

    const login = (userData) => {
        setAuthenticated(userData);
    };

    const logout = async () => {

        try {
            await api.post("/auth/logout");
        } catch (error) {
            console.error("Logout failed:", error);
        }

        setAuthenticated(false);
    };


    return (
        <AuthContext.Provider
            value={{
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