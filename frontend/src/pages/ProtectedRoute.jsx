import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import LoadingAnimation1 from "../anim/LoadingAnimation1";


export function ProtectedRoute({ children }) {

    const { isauthenticated, loading } = useAuth();


    if (loading) {
        return <LoadingAnimation1 />;
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
        return <LoadingAnimation1 />;
    }


    if (isauthenticated) {

        return (
            <Navigate
                to="/"
                replace
            />
        );

    }


    return children;
}