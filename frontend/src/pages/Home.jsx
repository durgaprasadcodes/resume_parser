import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import Navbar from "../components/Navbar";
import "../styles/Home.css";

import hirelenseLogo from "../assets/hirelense.png";
import sample_vedio from "../assets/demo_vedio.mp4";
import amazonPng from "../assets/amazon.png";
import resumeAnalysis from "../assets/resume-analysis.png"
import person_1 from "../assets/person_1.png"
import person_2 from "../assets/person_2.png"
import person_3 from "../assets/person_3.png"

export default function Home() {
    const { isauthenticated } = useAuth();
    const [openFaq, setOpenFaq] = useState(null);
    const location = useLocation();
    const previewVideoRef = useRef(null);

    useEffect(() => {
        if (!location.hash) {
            return;
        }

        const frame = window.requestAnimationFrame(() => {
            document.getElementById(location.hash.slice(1))?.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        });

        return () => window.cancelAnimationFrame(frame);
    }, [location.hash]);

    useEffect(() => {
        const revealElements = document.querySelectorAll(".landing-root [data-scroll-reveal]");
        const revealAll = () => {
            revealElements.forEach((element) => element.classList.add("is-visible"));
        };

        if (
            !("IntersectionObserver" in window) ||
            window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ) {
            revealAll();
            return;
        }

        const observer = new IntersectionObserver((entries, currentObserver) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("is-visible");
                    currentObserver.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.12,
            rootMargin: "0px 0px -40px 0px"
        });

        revealElements.forEach((element) => observer.observe(element));

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const video = previewVideoRef.current;
        if (!video || !("IntersectionObserver" in window)) {
            return;
        }

        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                video.currentTime = 0;
                video.play().catch((error) => {
                    if (error.name !== "AbortError") {
                        console.error("Could not play the preview video:", error);
                    }
                });
            } else {
                video.pause();
                if (video.readyState > 0) {
                    video.currentTime = 0;
                }
            }
        }, { threshold: 0.25 });

        observer.observe(video);

        return () => {
            observer.disconnect();
            video.pause();
            if (video.readyState > 0) {
                video.currentTime = 0;
            }
        };
    }, []);

    const toggleFaq = (index) => {
        setOpenFaq(openFaq === index ? null : index);
    };

    const scrollToSection = (id) => {
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    };

    const faqs = [
        {
            q: "How does HireLense calculate the ATS match score?",
            a: "HireLense simulates modern Applicant Tracking Systems (Workday, Greenhouse, Lever). It parses your resume's technical keywords, experience seniority, measurable achievements, and section structure, comparing them against industry-standard engineering and product benchmarks."
        },
        {
            q: "Is my resume kept private and secure?",
            a: "Yes, 100%. Your resume data is encrypted in transit and at rest. We never share, sell, or use your private career documents to train third-party public models."
        },
        {
            q: "What file formats does HireLense support?",
            a: "We currently support standard PDF (.pdf) documents, including single-page and multi-page formats. DOCX and plain text formats can also be parsed directly."
        },
        {
            q: "Can I use HireLense if I'm transitioning careers or a fresh graduate?",
            a: "Absolutely. HireLense highlights transferable technical projects, coursework, and core competencies, helping you bridge keyword gaps so you pass recruiter screening."
        }
    ];

    const team = [
        {
            "id": 1,
            "img": person_1,
            "contribution": "Frontend Development",
            "name": "Jayanth"
        },
        {
            "id": 2,
            "img": person_2,
            "contribution": "Backend Development",
            "name": "Durga Prasad"
        },
        {
            "id": 3,
            "img": person_3,
            "contribution": "Frontend Development",
            "name": "Sidhu"
        },
    ]

    return (
        <div className="landing-root">
            {/* Background Graph Grid & Sky Blue Aura */}
            <div className="landing-grid-aura" aria-hidden="true" />

            <Navbar />

            <main className="landing-container">

                {/* ===== HERO SECTION ===== */}
                <section className="hero-wrapper">

                    <h1 className="hero-title-editorial scroll-reveal" data-scroll-reveal>
                        Your first <span className="hero-serif-italic script-accent">real</span> interview,<br />
                        before the <span className="hero-serif-italic script-accent">real</span> one.
                    </h1>

                    <p className="hero-subtext scroll-reveal" data-scroll-reveal>
                        Upload your resume, unlock hidden candidate strengths, and get instant ATS-score
                        breakdowns with an AI that evaluates experience like a senior tech recruiter.
                    </p>

                    <div className="hero-action-group scroll-reveal" data-scroll-reveal>
                        <Link
                            to={isauthenticated ? "/analysis" : "/login"}
                            className="btn-hero-dark"
                        >
                            <span>{isauthenticated ? "Analyze My Resume" : "Start Free Assessment"}</span>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="5" y1="12" x2="19" y2="12" />
                                <polyline points="12 5 19 12 12 19" />
                            </svg>
                        </Link>

                        <button
                            type="button"
                            onClick={() => scrollToSection("preview")}
                            className="btn-hero-white"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                                <line x1="16" y1="13" x2="8" y2="13" />
                                <line x1="16" y1="17" x2="8" y2="17" />
                                <polyline points="10 9 9 9 8 9" />
                            </svg>
                            <span>View Sample Report</span>
                        </button>
                    </div>
                    {/* ===== TRUST SOCIAL PROOF STRIP ===== */}
                    <div className="trust-strip-wrapper scroll-reveal" data-scroll-reveal>
                        <p className="trust-strip-label">
                            Engineered for candidates interviewing across top tech engineering teams
                        </p>
                        <div className="trust-logos-row">
                            <span className="trust-logo-item">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>

                                Google
                            </span>
                            <span className="trust-logo-item">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 23 23"
                                    width="24"
                                    height="24"
                                >
                                    <rect x="1" y="1" width="10" height="10" fill="#F25022" />
                                    <rect x="12" y="1" width="10" height="10" fill="#7FBA00" />
                                    <rect x="1" y="12" width="10" height="10" fill="#00A4EF" />
                                    <rect x="12" y="12" width="10" height="10" fill="#FFB900" />
                                </svg>
                                Microsoft
                            </span>
                            <span className="trust-logo-item">
                                <img src={amazonPng} style={{ width: 24, height: 24, marginTop: 5 }} alt="" />
                                Amazon
                            </span>
                            <span className="trust-logo-item">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    width="28"
                                    height="28"
                                    fill="none"
                                >
                                    <path
                                        d="M3.5 16.5C3.5 12.8 5.3 8 8.1 8c2.2 0 3.6 3.2 4.7 5.4C14 16.2 15.3 19 17.2 19c2.1 0 3.3-2.7 3.3-5.8C20.5 9.6 18.7 7 16.2 7c-2.8 0-4.5 3.3-5.9 6.1C8.8 16.1 7.5 19 5.6 19c-1.4 0-2.1-1.1-2.1-2.5Z"
                                        stroke="#1877F2"
                                        stroke-width="2.2"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                    />
                                </svg>
                                Meta
                            </span>
                            <span className="trust-logo-item">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 32"
                                    width="24"
                                    height="19"
                                >
                                    <path
                                        fill="#E50914"
                                        d="M3 0h6.2l5.6 18.2V0H21v32h-6.1L9.2 13.8V32H3V0z"
                                    />
                                </svg>
                                Netflix
                            </span>
                            <span className="trust-logo-item">
                                <img
                                    src={"https://cdn.21st.dev/assets/mirror/b9/b93fa7942be639a1dae60194ff12141145d7d9fd59581582d6ff23335755f19c.svg"}
                                    style={{ width: 24, height: 24 }}
                                    alt="OpenAI"
                                />
                                OpenAI
                            </span>
                        </div>
                    </div>
                </section>

                <section className="showcase-outer-shell scroll-reveal" id="preview" data-scroll-reveal>

                    {/* Top Bar above Inner Mockup */}
                    <div className="showcase-top-header">
                        <div className="showcase-header-left">
                            <span className="showcase-role-pill">
                                Software Engineer • ATS Benchmark
                            </span>
                        </div>
                        <div className="showcase-status-live">
                            <span className="status-dot-green" />
                            <span>Preview</span>
                        </div>
                    </div>

                    {/* Inner Window Preview with resume-uploading.png */}
                    <div className="showcase-inner-card">
                        {/* Window Top Navigation Bar */}
                        <div className="inner-browser-bar">
                            <div className="browser-traffic-lights">
                                <span className="traffic-light red" />
                                <span className="traffic-light amber" />
                                <span className="traffic-light green" />
                            </div>
                        </div>
                        {/* Centered Image Viewport */}
                        <div className="showcase-image-viewport">

                            <video
                                ref={previewVideoRef}
                                className="showcase-main-image"
                                src={sample_vedio}
                                loop
                                muted
                                playsInline
                                preload="none"
                            >
                            </video>

                        </div>

                    </div>

                </section>


                {/* ===== HOW IT WORKS SECTION ===== */}
                <section className="how-it-works-section" id="how-it-works">

                    <div className="section-header-clean scroll-reveal" data-scroll-reveal>
                        <h2 className="section-h2">
                            <span className="script-accent">Three simple steps</span> to a recruiter-ready resume
                        </h2>
                        <p className="section-p">
                            Zero fluff. Instant diagnostics that show you what ATS scanners and hiring managers see.
                        </p>
                    </div>

                    <div className="how-steps-grid">

                        <div className="how-step-card scroll-reveal" data-scroll-reveal>
                            <div className="step-card-num">01</div>
                            <h3>Instant Multimodal Parsing</h3>
                            <p>
                                Drop your PDF resume. Our neural extraction engine parses sections, roles,
                                technical stacks, and education in under two seconds.
                            </p>
                        </div>

                        <div className="how-step-card scroll-reveal" data-scroll-reveal>
                            <div className="step-card-num">02</div>
                            <h3>ATS Audit &amp; Gap Detection</h3>
                            <p>
                                Cross-reference your bullet points against real applicant tracking systems
                                to identify missing role-critical keywords and weak phrasing.
                            </p>
                        </div>

                        <div className="how-step-card scroll-reveal" data-scroll-reveal>
                            <div className="step-card-num">03</div>
                            <h3>Targeted Optimization Tips</h3>
                            <p>
                                Receive quantified metric improvements, role-specific phrasing recommendations,
                                and confidence metrics to land interviews faster.
                            </p>
                        </div>

                    </div>

                </section>


                {/* ===== TEAM BENTO GRID ===== */}
                <section className="team-section-alt" id="team">

                    <div className="section-header-clean scroll-reveal" data-scroll-reveal>
                        <h2 className="section-h2">
                            <span className="script-accent">Meet the team</span> behind HireLense
                        </h2>
                        <p className="section-p">
                            The people building a smarter way to prepare for your next interview.
                        </p>
                    </div>
                    <div className="developing-team">
                        {team.map((person) => (
                            <div className="personal_details scroll-reveal" key={person.id} data-scroll-reveal>
                                <img src={person.img} alt={`${person.name} profile`} />
                                <h3 className="script-name">{person.name}</h3>
                                <p>{person.contribution}</p>
                            </div>
                        ))}
                    </div>
                </section>


                {/* ===== FAQ SECTION ===== */}
                <section className="faq-section-clean" id="faq">

                    <div className="section-header-clean scroll-reveal" data-scroll-reveal>
                        <h2 className="section-h2">
                            <span className="script-accent">Frequently asked</span> questions
                        </h2>
                        <p className="section-p">
                            Everything you need to know about HireLense's parsing and privacy safeguards.
                        </p>
                    </div>

                    <div className="faq-accordion-wrap">
                        {faqs.map((faq, idx) => {
                            const isOpen = openFaq === idx;
                            return (
                                <div key={idx} className="faq-item-card scroll-reveal" data-scroll-reveal>
                                    <button
                                        type="button"
                                        className="faq-question-btn"
                                        onClick={() => toggleFaq(idx)}
                                        aria-expanded={isOpen}
                                    >
                                        <span>{faq.q}</span>
                                        <span className="faq-toggle-icon">
                                            {isOpen ? "−" : "+"}
                                        </span>
                                    </button>
                                    {isOpen && (
                                        <div className="faq-answer-pane">
                                            <p>{faq.a}</p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                </section>


                {/* ===== BOTTOM CTA BANNER (SKY BLUE AURA) ===== */}
                <section className="bottom-cta-wrap" id="get-started">
                    <div className="bottom-cta-banner scroll-reveal" data-scroll-reveal>
                        <h2>
                            Ready to optimize your resume for your <span className="script-accent">dream interview</span>?
                        </h2>

                        <img className="resumeanalysis" src={resumeAnalysis} alt="" />

                        <Link
                            to={isauthenticated ? "/analysis" : "/login"}
                            className="btn-hero-dark"
                            style={{ padding: "16px 36px" }}
                        >
                            <span>{isauthenticated ? "Open Resume Analyzer" : "Upload Your Resume Free →"}</span>
                        </Link>

                        <div className="cta-guarantee-note">
                            No credit card required • Instant results in under 3 seconds
                        </div>
                    </div>
                </section>

            </main>


            {/* ===== SAAS FOOTER ===== */}
            <footer className="landing-footer">
                <div className="landing-container">
                    <div className="footer-top-grid">

                        <div className="footer-brand-side scroll-reveal" data-scroll-reveal>
                            <span className="navbar-brand-image-wrap footer-brand-image-wrap">
                                <img src={hirelenseLogo} alt="HireLense" className="navbar-brand-image" />
                            </span>
                            <p>
                                Intelligent candidate resume parsing and ATS auditing platform. Built for modern engineers and recruiters.
                            </p>
                        </div>

                        <div className="scroll-reveal" data-scroll-reveal>
                            <div className="footer-col-header">Product</div>
                            <ul className="footer-links-list">
                                <li><a href="#how-it-works">How It Works</a></li>
                                <li><a href="#team">team</a></li>
                                <li><a href="#preview">Sample Report</a></li>
                                <li><a href="#get-started">Get Started</a></li>
                            </ul>
                        </div>

                        <div className="scroll-reveal" data-scroll-reveal>
                            <div className="footer-col-header">App</div>
                            <ul className="footer-links-list">
                                <li><Link to="/analysis">Resume Analyzer</Link></li>
                                <li><Link to="/profile">Candidate Profile</Link></li>
                                <li><Link to="/login">Sign In / Register</Link></li>
                            </ul>
                        </div>

                        <div className="scroll-reveal" data-scroll-reveal>
                            <div className="footer-col-header">Trust &amp; Legal</div>
                            <ul className="footer-links-list">
                                <li><a href="#faq">Privacy Safeguards</a></li>
                                <li><a href="#faq">Security Policy</a></li>
                                <li><a href="#faq">Terms of Service</a></li>
                            </ul>
                        </div>

                    </div>

                    <div className="footer-bottom-bar scroll-reveal" data-scroll-reveal>
                        <span>© {new Date().getFullYear()} Hirelense.ai. All rights reserved.</span>
                        <span>Designed with Impeccable Craft • White &amp; Sky Blue Theme</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
