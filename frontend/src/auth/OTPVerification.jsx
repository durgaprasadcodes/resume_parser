import { useState } from "react";
import { useSearchParams } from "react-router-dom";

import api from "../api/api";


function OTPVerification() {

    const [searchParams] = useSearchParams();

    const email = searchParams.get("email");


    const [otp, setOtp] = useState("");

    const [loading, setLoading] = useState(false);

    const [error, setError] = useState("");

    const [message, setMessage] = useState("");


    const handleVerifyOTP = async (e) => {

        e.preventDefault();

        setError("");
        setMessage("");


        if (!email) {

            setError(
                "Email information is missing."
            );

            return;
        }


        if (otp.length !== 6) {

            setError(
                "Please enter a 6-digit OTP."
            );

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

                navigate("/profile", {
                    replace: true
                });
            }

            setMessage(
                response.data.message
            );


        } catch (error) {

            setError(
                error.response?.data?.detail ||
                "OTP verification failed."
            );


        } finally {

            setLoading(false);
        }
    };


    return (

        <div>

            <h1>
                Verify Your Email
            </h1>


            <p>
                OTP sent to: <strong> {email} </strong>
            </p>

            <small>Valid Only for 1 minute </small>

            <form
                onSubmit={handleVerifyOTP}
            >

                <input
                    type="text"
                    value={otp}
                    onChange={(e) => {

                        const value =
                            e.target.value
                                .replace(/\D/g, "")
                                .slice(0, 6);

                        setOtp(value);

                    }}
                    placeholder="Enter 6-digit OTP"
                    maxLength={6}
                    inputMode="numeric"
                />


                <button
                    type="submit"
                    disabled={loading}
                >

                    {loading
                        ? "Verifying..."
                        : "Verify OTP"
                    }

                </button>

            </form>


            {error && (
                <p>
                    {error}
                </p>
            )}


            {message && (
                <p>
                    {message}
                </p>
            )}

        </div>
    );
}


export default OTPVerification;