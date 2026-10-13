import { useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../api/api";
import { useAuth } from "./AuthContext";

function Login() {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [isSignup, setIsSignup] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // --------------------------------------------------
    // Check OAuth errors from backend
    // --------------------------------------------------

    useState(() => {
        const params = new URLSearchParams(window.location.search);
        const urlError = params.get("error");

        if (urlError) {
            setError(urlError);

            window.history.replaceState(
                {},
                document.title,
                window.location.pathname
            );
        }
    }, []);

    // --------------------------------------------------
    // GOOGLE LOGIN
    // --------------------------------------------------

    const handleGoogleAuth = () => {
        setError("");
        setLoading(true);

        const apiUrl =
            import.meta.env.VITE_API_URL || "http://localhost:8000";

        /*
         * IMPORTANT:
         *
         * Do NOT use window.open()
         * Do NOT use popup
         * Do NOT use postMessage()
         *
         * This redirects the CURRENT TAB to Google OAuth.
         */

        window.location.href = `${apiUrl}/google/login`;
    };

    // --------------------------------------------------
    // INPUT CHANGE
    // --------------------------------------------------

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });

        setError("");
    };

    // --------------------------------------------------
    // NORMAL LOGIN
    // --------------------------------------------------

    const handleLogin = async (e) => {
        e.preventDefault();

        setError("");
        setSuccess("");
        setLoading(true);

        try {
            const response = await api.post("/auth/login", {
                email: formData.email,
                password: formData.password,
            });

            if (response.status === 200) {
                const {
                    access_token,
                    refresh_token,
                    user: userData,
                } = response.data;

                login(
                    userData || {
                        email: formData.email,
                    },
                    {
                        access_token,
                        refresh_token,
                    }
                );

                navigate("/", {
                    replace: true,
                });
            }
        } catch (error) {
            const detail = error.response?.data?.detail;

            let errorMsg =
                "Login failed. Please check your credentials.";

            if (typeof detail === "string") {
                errorMsg = detail;
            } else if (Array.isArray(detail)) {
                errorMsg = detail
                    .map(
                        (d) =>
                            d.msg ||
                            d.message ||
                            JSON.stringify(d)
                    )
                    .join(", ");
            } else if (detail?.msg) {
                errorMsg = detail.msg;
            }

            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    // --------------------------------------------------
    // SIGNUP
    // --------------------------------------------------

    const handleSignup = async (e) => {
        e.preventDefault();

        setError("");
        setSuccess("");

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        if (formData.password.length < 8) {
            setError("Password must be at least 8 characters.");
            return;
        }

        setLoading(true);

        try {
            const response = await api.post("/auth/register", {
                name: formData.name,
                email: formData.email,
                password: formData.password,
            });

            if (response.status === 200) {
                /*
                 * Backend returns:
                 *
                 * {
                 *     message: "OTP sent successfully",
                 *     email: "user@gmail.com"
                 * }
                 */

                const email = response.data.email;

                /*
                 * Store only the pending email.
                 * NEVER store the OTP.
                 */

                sessionStorage.setItem(
                    "pendingRegistrationEmail",
                    email
                );

                navigate(
                    `/otp?email=${encodeURIComponent(email)}`,
                    {
                        replace: true,
                    }
                );
            }
        } catch (error) {
            const detail = error.response?.data?.detail;

            let errorMsg =
                "Registration failed. Please try again.";

            if (typeof detail === "string") {
                errorMsg = detail;
            } else if (Array.isArray(detail)) {
                errorMsg = detail
                    .map(
                        (d) =>
                            d.msg ||
                            d.message ||
                            JSON.stringify(d)
                    )
                    .join(", ");
            } else if (detail?.msg) {
                errorMsg = detail.msg;
            }

            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    // --------------------------------------------------
    // FORM SUBMIT
    // --------------------------------------------------

    const handleSubmit = (e) => {
        if (isSignup) {
            handleSignup(e);
        } else {
            handleLogin(e);
        }
    };

    // --------------------------------------------------
    // SWITCH LOGIN / SIGNUP
    // --------------------------------------------------

    const switchMode = () => {
        setIsSignup(!isSignup);

        setError("");
        setSuccess("");

        setFormData({
            name: "",
            email: "",
            password: "",
            confirmPassword: "",
        });
    };

    // --------------------------------------------------
    // FORGOT PASSWORD
    // --------------------------------------------------

    const handleForgotPassword = () => {
        navigate("/reset-password");
    };

    // --------------------------------------------------
    // UI
    // --------------------------------------------------

    return (
        <div className="auth-page">

            <div className="auth-container">

                {/* ======================================
                    LEFT SIDE — BRAND
                ====================================== */}

                <div className="auth-brand">

                    <h1>Hirelense.ai</h1>

                    <p>
                        AI-powered resume parser that extracts
                        skills, experience, and insights — so you
                        can focus on building your career.
                    </p>

                </div>

                {/* ======================================
                    RIGHT SIDE — FORM
                ====================================== */}

                <div className="auth-card">

                    {/* HEADER */}

                    {isSignup ? (
                        <>
                            <h2>Create your account</h2>

                            <p className="auth-subtitle">
                                Start your journey with HireLense.ai
                            </p>
                        </>
                    ) : (
                        <>
                            <h2>Welcome back</h2>

                            <p className="auth-subtitle">
                                Sign in to continue to your dashboard.
                            </p>
                        </>
                    )}

                    {/* ERROR */}

                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}

                    {/* SUCCESS */}

                    {success && (
                        <div className="success-message">
                            {success}
                        </div>
                    )}

                    {/* FORM */}

                    <form onSubmit={handleSubmit}>

                        {/* NAME — SIGNUP ONLY */}

                        {isSignup && (
                            <div className="form-group">

                                <label htmlFor="name">
                                    Full name
                                </label>

                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    placeholder="Enter your full name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                />

                            </div>
                        )}

                        {/* EMAIL */}

                        <div className="form-group">

                            <label htmlFor="email">
                                Email address
                            </label>

                            <input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="you@example.com"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />

                        </div>

                        {/* PASSWORD */}

                        <div className="form-group">

                            <label htmlFor="password">
                                Password
                            </label>

                            <input
                                id="password"
                                name="password"
                                type="password"
                                placeholder="Enter your password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />

                        </div>

                        {/* CONFIRM PASSWORD */}

                        {isSignup && (
                            <div className="form-group">

                                <label htmlFor="confirmPassword">
                                    Confirm password
                                </label>

                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    placeholder="Confirm your password"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                />

                            </div>
                        )}

                        {/* FORGOT PASSWORD */}

                        {!isSignup && (
                            <div className="forgot-password">

                                <button
                                    type="button"
                                    onClick={handleForgotPassword}
                                >
                                    Forgot password?
                                </button>

                            </div>
                        )}

                        {/* SUBMIT */}

                        <button
                            type="submit"
                            className="auth-button"
                            disabled={loading}
                        >
                            {loading
                                ? "Please wait..."
                                : isSignup
                                    ? "Create account"
                                    : "Sign in"}
                        </button>

                        {/* DIVIDER */}

                        <div className="auth-divider">
                            <span>or continue with</span>
                        </div>

                        {/* GOOGLE */}

                        <button
                            type="button"
                            className="google-auth-button"
                            onClick={handleGoogleAuth}
                            disabled={loading}
                        >

                            <svg
                                className="google-icon"
                                viewBox="0 0 24 24"
                                width="18"
                                height="18"
                            >

                                <path
                                    fill="#4285F4"
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                />

                                <path
                                    fill="#34A853"
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                />

                                <path
                                    fill="#FBBC05"
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                                />

                                <path
                                    fill="#EA4335"
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                                />

                            </svg>

                            <span>
                                {isSignup
                                    ? "Sign up with Google"
                                    : "Sign in with Google"}
                            </span>

                        </button>

                    </form>

                    {/* SWITCH LOGIN / SIGNUP */}

                    <div className="auth-switch">

                        {isSignup ? (
                            <>
                                <span>
                                    Already have an account?
                                </span>

                                <button
                                    type="button"
                                    onClick={switchMode}
                                >
                                    Sign in
                                </button>
                            </>
                        ) : (
                            <>
                                <span>
                                    Don't have an account?
                                </span>

                                <button
                                    type="button"
                                    onClick={switchMode}
                                >
                                    Create account
                                </button>
                            </>
                        )}

                    </div>

                </div>
            </div>
        </div>
    );
}

export default Login;