import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import Navbar from "../components/Navbar";


export default function Home() {

    const { isauthenticated } = useAuth();


    return (
        <>
            <Navbar />

            <div className="page-container">

                {/* ===== HERO ===== */}
                <section className="hero-section">

                    <div className="hero-badge">
                        🚀 AI-Powered Resume Analysis
                    </div>

                    <h1 className="hero-title">
                        Parse, Analyze &amp;<br />
                        <span className="gradient-text">
                            Optimize Your Resume
                        </span>
                    </h1>

                    <p className="hero-description">
                        HireLense.ai uses advanced AI to extract skills,
                        experience, and actionable insights from your resume —
                        helping you stand out to recruiters and land interviews
                        faster.
                    </p>

                    <div className="hero-actions">

                        {isauthenticated ? (
                            <Link
                                to="/analysis"
                                className="btn btn-primary btn-lg"
                            >
                                📄 Analyze My Resume
                            </Link>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    className="btn btn-primary btn-lg"
                                >
                                    Get Started Free
                                </Link>

                                <Link
                                    to="/analysis"
                                    className="btn btn-outline btn-lg"
                                >
                                    Try Analysis
                                </Link>
                            </>
                        )}

                    </div>

                </section>


                {/* ===== FEATURES ===== */}
                <section className="features-section">

                    <h2>How It Works</h2>

                    <p className="features-subtitle">
                        Three simple steps to a stronger resume
                    </p>

                    <div className="features-grid">

                        <div className="feature-card">
                            <div className="feature-icon purple">📤</div>
                            <h3>Upload Resume</h3>
                            <p>
                                Upload your resume in PDF format.
                                Our parser handles all standard layouts
                                and multi-page documents.
                            </p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon green">🤖</div>
                            <h3>AI Analysis</h3>
                            <p>
                                Our AI extracts key skills, experience,
                                education, and provides a detailed
                                assessment of your profile.
                            </p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon amber">🎯</div>
                            <h3>Get Insights</h3>
                            <p>
                                Receive actionable recommendations to
                                improve your resume and increase your
                                chances of getting hired.
                            </p>
                        </div>

                    </div>

                </section>


                {/* ===== CTA ===== */}
                <section className="cta-section">

                    <div className="cta-card">

                        <h2>Ready to Upgrade Your Resume?</h2>

                        <p>
                            Join thousands of professionals who use
                            HireLense.ai to optimize their career documents.
                        </p>

                        {isauthenticated ? (
                            <Link
                                to="/analysis"
                                className="btn btn-white btn-lg"
                            >
                                Go to Analysis →
                            </Link>
                        ) : (
                            <Link
                                to="/login"
                                className="btn btn-white btn-lg"
                            >
                                Create Free Account →
                            </Link>
                        )}

                    </div>

                </section>

            </div>
        </>
    );
}
