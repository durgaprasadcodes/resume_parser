import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { DotLottieReact } from '@lottiefiles/dotlottie-react'


export function ProtectedRoute({ children }) {

    const { isauthenticated, loading } = useAuth();


    if (loading) {

        return (
            <div className="loading-overlay">
                <DotLottieReact
                    src="https://lottie.host/fab0564c-b9fa-4f0f-b243-955fdc0ea24b/CGBHZLKVks.lottie"
                    loop
                    autoplay
                />
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
                <DotLottieReact
                    src="https://lottie.host/fab0564c-b9fa-4f0f-b243-955fdc0ea24b/CGBHZLKVks.lottie"
                    loop
                    autoplay
                />
            </div>
        );

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