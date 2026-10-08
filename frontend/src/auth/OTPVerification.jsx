import { useState, useRef, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../api/api";
import { useAuth } from "./AuthContext";


function OTPVerification() {

    const [searchParams] = useSearchParams();
    const email = searchParams.get("email");
    const navigate = useNavigate();
    const { login } = useAuth();

    const OTP_LENGTH = 6;

    const [otpDigits, setOtpDigits] = useState(
        Array(OTP_LENGTH).fill("")
    );

    const inputRefs = useRef([]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");


    /* Auto-focus the first input on mount */
    useEffect(() => {
        inputRefs.current[0]?.focus();
    }, []);


    const handleDigitChange = (index, value) => {

        /* Only allow single digits */
        const digit = value.replace(/\D/g, "").slice(-1);

        const newDigits = [...otpDigits];
        newDigits[index] = digit;
        setOtpDigits(newDigits);

        /* Auto-advance to next input */
        if (digit && index < OTP_LENGTH - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };


    const handleKeyDown = (index, e) => {

        /* On Backspace, clear current or move back */
        if (e.key === "Backspace") {

            if (!otpDigits[index] && index > 0) {
                inputRefs.current[index - 1]?.focus();

                const newDigits = [...otpDigits];
                newDigits[index - 1] = "";
                setOtpDigits(newDigits);
            }
        }
    };


    const handlePaste = (e) => {

        e.preventDefault();

        const pasted = e.clipboardData
            .getData("text")
            .replace(/\D/g, "")
            .slice(0, OTP_LENGTH);

        const newDigits = [...otpDigits];

        for (let i = 0; i < OTP_LENGTH; i++) {
            newDigits[i] = pasted[i] || "";
        }

        setOtpDigits(newDigits);

        /* Focus the last filled input or the next empty one */
        const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1);
        inputRefs.current[focusIndex]?.focus();
    };


    const handleVerifyOTP = async (e) => {

        e.preventDefault();

        setError("");
        setMessage("");

        if (!email) {
            setError("Email information is missing.");
            return;
        }

        const otp = otpDigits.join("");

        if (otp.length !== OTP_LENGTH) {
            setError("Please enter a 6-digit OTP.");
            return;
        }


        try {
            setLoading(true);

            const response = await api.post("/auth/verify-otp", {
                email,
                otp
            });

            if (response.status === 200) {
                sessionStorage.removeItem("pendingRegistrationEmail");

                const { access_token, refresh_token, user: userData } = response.data;
                login(userData || { email }, { access_token, refresh_token });

                setMessage(
                    response.data.message || "Account verified!"
                );

                /* Short delay so the user sees the success message */
                setTimeout(() => {
                    navigate("/profile", { replace: true });
                }, 600);
            }

        } catch (error) {
            const detail = error.response?.data?.detail;
            let errorMsg = error.response?.data?.message || "OTP verification failed.";
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


    return (

        <div className="otp-page">

            <div className="otp-card">

                <div className="otp-icon">✉️</div>

                <h2>Verify Your Email</h2>

                <p className="otp-subtitle">
                    We sent a verification code to
                </p>

                <p className="otp-email">
                    {email || "your email"}
                </p>

                <p className="otp-expiry">
                    ⏱ Code expires in 1 minute
                </p>


                <form onSubmit={handleVerifyOTP}>

                    <div className="otp-input-group">
                        {otpDigits.map((digit, i) => (
                            <input
                                key={i}
                                ref={(el) => {
                                    inputRefs.current[i] = el;
                                }}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={(e) =>
                                    handleDigitChange(i, e.target.value)
                                }
                                onKeyDown={(e) =>
                                    handleKeyDown(i, e)
                                }
                                onPaste={handlePaste}
                                autoComplete="one-time-code"
                            />
                        ))}
                    </div>


                    <button
                        type="submit"
                        className="auth-button"
                        disabled={loading}
                    >
                        {loading
                            ? "Verifying..."
                            : "Verify OTP"
                        }
                    </button>

                </form>


                {error && (
                    <div className="error-message" style={{ marginTop: 16 }}>
                        {error}
                    </div>
                )}


                {message && (
                    <div className="success-message" style={{ marginTop: 16 }}>
                        {message}
                    </div>
                )}

            </div>

        </div>
    );
}


export default OTPVerification;