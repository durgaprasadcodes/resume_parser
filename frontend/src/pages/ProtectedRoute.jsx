import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";


export function ProtectedRoute({ children }) {

    const { isauthenticated, loading } = useAuth();


    if (loading) {

        return (
            <div className="loading-overlay">
                <div className="spinner" />
                <span>Checking authentication...</span>
            </div>
        );

    }


    if (!isauthenticated) {

        return (
            <Navigate
                to="/login"
                replace
            />
        );

    }


    return children ?? <Outlet />;
}


export function PublicOnlyRoute({ children }) {

    const { isauthenticated, loading } = useAuth();


    if (loading) {

        return (
            <div className="loading-overlay">
                <div className="spinner" />
                <span>Checking authentication...</span>
            </div>
        );

    }


    if (isauthenticated) {

        return (
            <Navigate
                to="/profile"
                replace
            />
        );

    }


    return children;
}