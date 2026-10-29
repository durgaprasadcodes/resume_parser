import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import { useAuth } from "./AuthContext";
import { showSuccess, showError, extractErrorMessage } from "../lib/toast";
import hirelenseLogo from "../assets/hirelense.png";
import "../styles/Auth.css";

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
    const [error, setError] = useState(
        () => new URLSearchParams(window.location.search).get("error") || ""
    );
    const [success, setSuccess] = useState("");

    // --------------------------------------------------
    // Check OAuth errors from backend
    // --------------------------------------------------

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);

        if (params.has("error")) {
            window.history.replaceState(
                {},
                document.title,
                window.location.pathname
            );
        }

        const handlePageShow = () => setLoading(false);
        window.addEventListener("pageshow", handlePageShow);

        return () => window.removeEventListener("pageshow", handlePageShow);
    }, []);

    // --------------------------------------------------
    // GOOGLE LOGIN
    // --------------------------------------------------

    const handleGoogleAuth = () => {
        setError("");

        const apiUrl =
            import.meta.env.VITE_API_URL ||
            (import.meta.env.DEV ? "http://127.0.0.1:8000" : "");

        if (!apiUrl) {
            setError("Google sign-in is not configured. Please try again later.");
            setLoading(false);
            return;
        }

        try {
            const loginUrl = new URL("/google/login", apiUrl);
            if (!["http:", "https:"].includes(loginUrl.protocol)) {
                throw new Error("Invalid API URL protocol.");
            }

            setLoading(true);
            window.location.assign(loginUrl.toString());
        } catch {
            showError("Unable to start Google sign-in. Please try again.");
            setError("Unable to start Google sign-in. Please try again.");
            setLoading(false);
        }
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
                const userData = response.data.user;

                login(
                    userData || { email: formData.email }
                );

                showSuccess("Welcome back! Signed in successfully.");

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

            showError(errorMsg);
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

                showSuccess("OTP sent! Check your email to verify your account.");

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

            showError(errorMsg);
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
            <div className={`container ${isSignup ? "active" : ""}`}>
                {/* LOGIN FORM BOX */}
                <div className="form-box sign-in">
                    <form onSubmit={handleLogin}>
                        <div className="form-logo-wrap">
                            <img
                                src={hirelenseLogo}
                                alt="HireLense.ai"
                                className="form-logo"
                            />
                        </div>
                        <h1 className="antiqua-title">Login</h1>

                        {error && !isSignup && (
                            <div className="auth-alert error">{error}</div>
                        )}
                        {success && !isSignup && (
                            <div className="auth-alert success">{success}</div>
                        )}

                        <div className="input-box">
                            <input
                                type="email"
                                name="email"
                                placeholder="Email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                            <i class='bx bx-envelope'></i>
                        </div>

                        <div className="input-box">
                            <input
                                type="password"
                                name="password"
                                placeholder="Password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                            <i class='bx bx-lock-alt'></i>
                        </div>

                        <div className="forgot-link">
                            <button
                                type="button"
                                onClick={handleForgotPassword}
                            >
                                Forgot password?
                            </button>
                        </div>

                        <button
                            type="submit"
                            className="btn"
                            disabled={loading}
                        >
                            {loading ? "Please wait..." : "Login"}
                        </button>

                        <p>or login with social platforms</p>

                        <div className="social-links">
                            <button
                                type="button"
                                className="google-signin-btn"
                                onClick={handleGoogleAuth}
                                disabled={loading}
                                title="Sign in with Google"
                                aria-label="Sign in with Google"
                            >
                                <svg
                                    className="google-svg-icon"
                                    viewBox="0 0 24 24"
                                    width="20"
                                    height="20"
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
                                <span>Sign in with Google</span>
                            </button>
                        </div>

                        <div className="mobile-toggle-text">
                            Don't have an account?{" "}
                            <button
                                type="button"
                                className="mobile-toggle-btn"
                                onClick={() => {
                                    setIsSignup(true);
                                    setError("");
                                }}
                            >
                                Register
                            </button>
                        </div>
                    </form>
                </div>

                {/* REGISTRATION FORM BOX */}
                <div className="form-box sign-up">
                    <form onSubmit={handleSignup}>
                        <div className="form-logo-wrap">
                            <img
                                src={hirelenseLogo}
                                alt="HireLense.ai"
                                className="form-logo"
                            />
                        </div>
                        <h1 className="antiqua-title">Registration</h1>

                        {error && isSignup && (
                            <div className="auth-alert error">{error}</div>
                        )}
                        {success && isSignup && (
                            <div className="auth-alert success">{success}</div>
                        )}

                        <div className="input-box">
                            <input
                                type="text"
                                name="name"
                                placeholder="Full name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                            <i class='bx  bx-user'></i>
                        </div>

                        <div className="input-box">
                            <input
                                type="email"
                                name="email"
                                placeholder="Email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                            <i class='bx bx-envelope'></i>
                        </div>

                        <div className="input-box">
                            <input
                                type="password"
                                name="password"
                                placeholder="Password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                            <i class='bx bx-lock-alt'></i>
                        </div>

                        <div className="input-box">
                            <input
                                type="password"
                                name="confirmPassword"
                                placeholder="Confirm password"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                            />
                            <i class='bx bx-lock-alt'></i>
                        </div>

                        <button
                            type="submit"
                            className="btn"
                            disabled={loading}
                        >
                            {loading ? "Please wait..." : "Register"}
                        </button>

                        <p>or register with social platforms</p>

                        <div className="social-links">
                            <button
                                type="button"
                                className="google-signin-btn"
                                onClick={handleGoogleAuth}
                                disabled={loading}
                                title="Sign in with Google"
                                aria-label="Sign in with Google"
                            >
                                <svg
                                    className="google-svg-icon"
                                    viewBox="0 0 24 24"
                                    width="20"
                                    height="20"
                                >
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                                </svg>
                                <span>Sign up with Google</span>
                            </button>
                        </div>

                        <div className="mobile-toggle-text">
                            Already have an account?{" "}
                            <button
                                type="button"
                                className="mobile-toggle-btn"
                                onClick={() => {
                                    setIsSignup(false);
                                    setError("");
                                }}
                            >
                                Login
                            </button>
                        </div>
                    </form>
                </div>

                {/* SLIDING TOGGLE BOX */}
                <div className="toggle-box">
                    <div className="toggle-panel toggle-left">
                        <div className="toggle-logo-wrap">
                            <img
                                src={hirelenseLogo}
                                alt="HireLense.ai"
                                className="toggle-logo"
                            />
                        </div>
                        <h1>Welcome Back!</h1>
                        <p>Don't have an account?</p>
                        <button
                            type="button"
                            className="btn"
                            onClick={() => {
                                setIsSignup(true);
                                setError("");
                            }}
                        >
                            Register
                        </button>
                    </div>

                    <div className="toggle-panel toggle-right">
                        <div className="toggle-logo-wrap">
                            <img
                                src={hirelenseLogo}
                                alt="HireLense.ai"
                                className="toggle-logo"
                            />
                        </div>
                        <h1>Hello, Welcome!</h1>
                        <p>Already have an account?</p>
                        <button
                            type="button"
                            className="btn"
                            onClick={() => {
                                setIsSignup(false);
                                setError("");
                            }}
                        >
                            Login
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;