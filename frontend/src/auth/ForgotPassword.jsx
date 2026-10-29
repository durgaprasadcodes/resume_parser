import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/api';
import { showSuccess, showError, extractErrorMessage } from '../lib/toast';
import "../styles/ForgotPassword.css"

export default function ForgotPassword() {

    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [changePassword, setChangePassword] = useState(false);
    const [resetToken, setResetToken] = useState("");
    const [showForgotPasswordPage, setShowForgotPasswordPage] = useState(true);

    const BackToLoginPage = () => {
        navigate("/login");
    }

    const BackToEmailEnterPage = () => {
        navigate("/auth/reset-password")
        setShowForgotPasswordPage(true);
    }


    const handleSendOTP = async (e) => {
        e.preventDefault();
        setLoading(true)
        try {
            const response = await api.post("/auth/reset-password", {
                email: e.target.email.value
            });
            if (response.status == 200) {
                setShowForgotPasswordPage(false);
                setEmail(e.target.email.value)
                showSuccess("OTP sent! Check your email.");
            }
        } catch (error) {
            showError(extractErrorMessage(error, "Failed to send OTP. Please try again."));
            setShowForgotPasswordPage(true);
        }
        finally {
            setLoading(false)
        }
    }

    const handleResetOTP = async (e) => {
        e.preventDefault();
        setLoading(true)
        try {
            const response = await api.post("/auth/reset-otp", {
                email: email,
                otp: e.target.otp.value
            });
            if (response.status == 200) {
                setResetToken(response.data.reset_token);
                setChangePassword(true);
                showSuccess("OTP verified! Set your new password.");
            }
        } catch (error) {
            showError(extractErrorMessage(error, "Invalid OTP. Please try again."));
        }
        finally {
            setLoading(false)
        }
    }

    const handleChangepassword = async (e) => {
        e.preventDefault();
        setLoading(true)
        try {
            const response = await api.post("/auth/change-password", {
                email: email,
                password: e.target.password.value,
                reset_token: resetToken
            });
            if (response.status == 200) {
                showSuccess("Password changed successfully! Please sign in.");
                navigate("/login");
            }
        } catch (error) {
            showError(extractErrorMessage(error, "Failed to change password. Please try again."));
        }
        finally {
            setLoading(false)
        }
    }

    return (
        showForgotPasswordPage ?
            (
                <div className="auth-page fp-auth-card">
                    <h1 className="fp-title">Reset Password</h1>
                    <form className="auth-form fp-form" onSubmit={handleSendOTP}>
                        <p className="fp-subtitle">
                            Enter your email address to receive a verification code.
                        </p>
                        <input
                            className="fp-input"
                            type="email"
                            id='email'
                            placeholder="Enter your email"
                            required
                        />
                        <button className="fp-btn-primary" type="submit" disabled={loading}>{loading ? "Sending OTP" : "Verify OTP"}</button>
                    </form>
                    <button className="fp-btn-secondary" onClick={BackToLoginPage}>Back to Login</button>
                </div>
            ) : (
                changePassword ? (
                    <div className="auth-page fp-auth-card">
                        <h1 className="fp-title">Change Password</h1>
                        <form className="auth-form fp-form" onSubmit={handleChangepassword}>
                            <p className="fp-subtitle">
                                Enter your new password.
                            </p>
                            <input
                                className="fp-input"
                                type="password"
                                id='password'
                                placeholder="Enter your password"
                                required
                            />
                            <input
                                className="fp-input"
                                type="password"
                                id='confirm-password'
                                placeholder="Confirm your password"
                                required
                            />
                            <button className="fp-btn-primary" type="submit" disabled={loading}>{loading ? "Changing Password..." : "Change Password"}</button>
                        </form>
                        <button className="fp-btn-secondary" onClick={BackToLoginPage}>Back to Login</button>
                    </div>
                ) : (
                    <div className="auth-page fp-auth-card">
                        <h1 className="fp-title">Enter OTP</h1>
                        <p className="fp-subtitle">We have sent an OTP to your email address. Please enter the OTP to verify your account.</p>
                        <form className="otp-digit-group fp-form" onSubmit={handleResetOTP}>
                            <input
                                className="fp-input fp-otp-input"
                                type="text"
                                id='otp'
                                required
                                onChange={(e) => e.target.value = e.target.value.replace(/\D/g, '').slice(0, 6)}
                            />
                            <button className="fp-btn-primary" type="submit" disabled={loading}>{loading ? "Verifying OTP..." : "Verify OTP"}</button>
                        </form>
                        <button className="fp-btn-secondary" onClick={BackToEmailEnterPage}>Enter OTP again</button>
                        <button className="fp-btn-secondary" onClick={BackToLoginPage}>Back to Login</button>
                    </div>
                )
            )
    )
}
