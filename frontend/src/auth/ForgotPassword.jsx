import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/api';
import "../styles/ForgotPassword.css"

export default function ForgotPassword() {

    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [changePassword, setChangePassword] = useState(false);
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
                console.log("Success")
            }
        } catch (error) {
            console.log(error.response);
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
                setChangePassword(true);

            }
        } catch (error) {
            console.log(error.response);
            window.alert("Service Unavailble")
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
                password: e.target.password.value
            });
            if (response.status == 200) {
                navigate("/login");
            }
        } catch (error) {
            console.log(error.response);
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
                            <button className="fp-btn-primary" type="submit" disabled={loading}>{loading ? "Change Password" : "Change Password"}</button>
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
                            <button className="fp-btn-primary" type="submit" disabled={loading}>{loading ? "Verifying OTP" : "Verify OTP"}</button>
                        </form>
                        <button className="fp-btn-secondary" onClick={BackToEmailEnterPage}>Enter OTP again</button>
                        <button className="fp-btn-secondary" onClick={BackToLoginPage}>Back to Login</button>
                    </div>
                )
            )
    )
}
