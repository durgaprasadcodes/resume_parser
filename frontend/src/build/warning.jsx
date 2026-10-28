import React from "react";
import { useNavigate } from "react-router-dom";

export default function Warning() {
    const navigate = useNavigate();

    return (
        <div
            style={{
                minHeight: "100vh",
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "24px",
                boxSizing: "border-box",
                background: "#f8f9fa",
                fontFamily:
                    "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
            }}
        >
            <div
                style={{
                    width: "100%",
                    maxWidth: "520px",
                    boxSizing: "border-box",
                    padding: "40px",
                    background: "#ffffff",
                    border: "1px solid #e8e8e8",
                    borderRadius: "24px",
                    boxShadow: "0 16px 50px rgba(0, 0, 0, 0.06)",
                }}
            >
                {/* Status */}

                <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 'clamp(5px, 20px, 50px)'
                }}>
                    {/* Heading */}
                    <h1
                        style={{
                            margin: "0 0 12px",
                            color: "#18181b",
                            fontSize: "clamp(28px, 5vw, 36px)",
                            lineHeight: "1.12",
                            fontWeight: "700",
                            letterSpacing: "-0.035em",
                        }}
                    >
                        Resume Builder
                    </h1>

                    <div
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "7px",
                            marginBottom: "14px",
                            padding: "6px 10px",
                            borderRadius: "999px",
                            background: "#f4f4f5",
                            border: "1px solid #e4e4e7",
                            color: "#52525b",
                            fontSize: "11px",
                            fontWeight: "700",
                            letterSpacing: "0.07em",
                            textTransform: "uppercase",
                        }}
                    >
                        <span
                            style={{
                                width: "6px",
                                height: "6px",
                                borderRadius: "50%",
                                background: "#71717a",
                            }}
                        />

                        Coming Soon
                    </div>
                </div>

                {/* Description */}
                <p
                    style={{
                        margin: "0",
                        maxWidth: "440px",
                        color: "#71717a",
                        fontSize: "15px",
                        lineHeight: "1.7",
                    }}
                >
                    We're building a better way to create, customize, and
                    optimize your resume. This feature is currently under
                    development and will be available soon.
                </p>

                {/* Back button */}
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    style={{
                        width: "100%",
                        minHeight: "46px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        marginTop: "24px",
                        padding: "0 18px",
                        border: "1px solid #dedede",
                        borderRadius: "12px",
                        background: "#ffffff",
                        color: "#18181b",
                        fontSize: "14px",
                        fontWeight: "600",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#f4f4f5";
                        e.currentTarget.style.borderColor = "#d4d4d8";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#ffffff";
                        e.currentTarget.style.borderColor = "#dedede";
                    }}
                >
                    <span style={{ fontSize: "17px", lineHeight: 1 }}>
                        ←
                    </span>

                    Go Back
                </button>
            </div>
        </div>
    );
}