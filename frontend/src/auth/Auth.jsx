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
        confirmPassword: ""
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });

        setError("");
    };

    const handleLogin = async (e) => {
        e.preventDefault();

        setError("");
        setSuccess("");
        setLoading(true);

        try {
            const response = await api.post("/auth/login", {
                email: formData.email,
                password: formData.password
            });

            if (response.status === 200) {
                const { access_token, refresh_token, user: userData } = response.data;
                login(userData || { email: formData.email }, { access_token, refresh_token });
                navigate("/profile", {
                    replace: true
                });
            }

        } catch (error) {
            const detail = error.response?.data?.detail;
            let errorMsg = "Login failed. Please check your credentials.";
            if (typeof detail === "string") {
                errorMsg = detail;
            } else if (Array.isArray(detail)) {
                errorMsg = detail.map((d) => d.msg || d.message || JSON.stringify(d)).join(", ");
            } else if (detail?.msg) {
                errorMsg = detail.msg;
            }
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

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
                password: formData.password
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
                 * NEVER store the OTP here.
                 */
                sessionStorage.setItem(
                    "pendingRegistrationEmail",
                    email
                );

                navigate(`/otp?email=${encodeURIComponent(email)}`, {
                    replace: true
                });
            }

        } catch (error) {
            const detail = error.response?.data?.detail;
            let errorMsg = "Registration failed. Please try again.";
            if (typeof detail === "string") {
                errorMsg = detail;
            } else if (Array.isArray(detail)) {
                errorMsg = detail.map((d) => d.msg || d.message || JSON.stringify(d)).join(", ");
            } else if (detail?.msg) {
                errorMsg = detail.msg;
            }
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e) => {
        if (isSignup) {
            handleSignup(e);
        } else {
            handleLogin(e);
        }
    };

    const switchMode = () => {
        setIsSignup(!isSignup);

        setError("");
        setSuccess("");

        setFormData({
            name: "",
            email: "",
            password: "",
            confirmPassword: ""
        });
    };

    return (
        <div className="auth-page">

            <div className="auth-container">

                {/* LEFT SIDE — Brand panel */}
                <div className="auth-brand">

                    <h1>Hirelense.ai</h1>

                    <p>
                        AI-powered resume parser that extracts skills,
                        experience, and insights — so you can focus on
                        building your career.
                    </p>

                </div>


                {/* RIGHT SIDE — Form */}
                <div className="auth-card">

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


                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}


                    {success && (
                        <div className="success-message">
                            {success}
                        </div>
                    )}


                    <form onSubmit={handleSubmit}>

                        {/* NAME — ONLY SIGNUP */}
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


                        {/* CONFIRM PASSWORD — ONLY SIGNUP */}
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


                        {!isSignup && (
                            <div className="forgot-password">
                                <button
                                    type="button"
                                    onClick={() => {
                                        // Add forgot password flow later
                                    }}
                                >
                                    Forgot password?
                                </button>
                            </div>
                        )}


                        <button
                            type="submit"
                            className="auth-button"
                            disabled={loading}
                        >

                            {loading
                                ? "Please wait..."
                                : isSignup
                                    ? "Create account"
                                    : "Sign in"
                            }

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