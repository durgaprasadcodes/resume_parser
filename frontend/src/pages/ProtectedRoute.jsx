import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";


export function ProtectedRoute({ children }) {

    const { isauthenticated, loading } = useAuth();


    if (loading) {

        return (
            <div>
                Checking authentication...
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
            <div>
                Checking authentication...
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