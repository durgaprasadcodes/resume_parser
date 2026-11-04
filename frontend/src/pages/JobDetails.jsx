import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import api from "../api/api";
import "../styles/JobDetails.css";

const KNOWN_SKILLS = [
    "Python", "JavaScript", "TypeScript", "React", "React.js", "Node.js", "Vue", "Angular",
    "FastAPI", "Django", "Flask", "Docker", "Kubernetes", "PostgreSQL", "MySQL", "MongoDB",
    "Redis", "AWS", "Azure", "GCP", "Machine Learning", "Deep Learning", "PyTorch", "TensorFlow",
    "NLP", "LLM", "RAG", "LangChain", "RESTful APIs", "Microservices", "GraphQL", "Git", "CI/CD",
    "Java", "Spring Boot", "C++", "Go", "Figma", "UI/UX", "System Design", "SQL", "Unit Testing",
    "A/B Testing", "Statistics", "Prototyping", "User Research", "Design System", "Design Handoff"
];

const BRAND_PRESETS = [
    { match: /google/i, name: "Google", icon: "fa-brands fa-google", color: "#4285f4", bg: "#ffffff" },
    { match: /apple/i, name: "Apple", icon: "fa-brands fa-apple", color: "#000000", bg: "#ffffff" },
    { match: /spotify/i, name: "Spotify", icon: "fa-brands fa-spotify", color: "#1db954", bg: "#ffffff" },
    { match: /figma/i, name: "Figma", icon: "fa-brands fa-figma", color: "#f24e1e", bg: "#ffffff" },
    { match: /airbnb/i, name: "Airbnb", icon: "fa-brands fa-airbnb", color: "#ff5a5f", bg: "#ffffff" },
    { match: /microsoft/i, name: "Microsoft", icon: "fa-brands fa-microsoft", color: "#00a4ef", bg: "#ffffff" },
    { match: /amazon/i, name: "Amazon", icon: "fa-brands fa-amazon", color: "#ff9900", bg: "#ffffff" },
    { match: /meta|facebook/i, name: "Meta", icon: "fa-brands fa-meta", color: "#0668e1", bg: "#ffffff" },
    { match: /github/i, name: "GitHub", icon: "fa-brands fa-github", color: "#24292e", bg: "#ffffff" },
    { match: /uber/i, name: "Uber", icon: "fa-brands fa-uber", color: "#000000", bg: "#ffffff" },
    { match: /hsbc/i, name: "HSBC", icon: "fa-solid fa-landmark", color: "#db0011", bg: "#ffffff" },
];

function getCompanyBrand(companyName = "") {
    const raw = String(companyName).trim();
    const found = BRAND_PRESETS.find((p) => p.match.test(raw));
    if (found) {
        return {
            type: "brand",
            icon: found.icon,
            color: found.color,
            bg: found.bg,
            initial: raw.charAt(0).toUpperCase() || "J",
        };
    }

    const palettes = [
        { bg: "#eef2ff", color: "#4f46e5" },
        { bg: "#ecfdf5", color: "#059669" },
        { bg: "#eff6ff", color: "#2563eb" },
        { bg: "#fff7ed", color: "#ea580c" },
        { bg: "#fdf2f8", color: "#db2777" },
        { bg: "#f5f3ff", color: "#7c3aed" },
    ];
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
        hash = raw.charCodeAt(i) + ((hash << 5) - hash);
    }
    const selected = palettes[Math.abs(hash) % palettes.length];

    return {
        type: "initial",
        initial: (raw.charAt(0) || "J").toUpperCase(),
        bg: selected.bg,
        color: selected.color,
    };
}

function extractSkills(job) {
    if (!job) return [];
    const text = `${job.title || ""} ${job.description || ""}`.toLowerCase();
    const detected = [];

    for (const skill of KNOWN_SKILLS) {
        const escaped = skill.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
        const regex = new RegExp(`(^|[^a-zA-Z0-9])${escaped}([^a-zA-Z0-9]|$)`, "i");
        if (regex.test(text)) {
            detected.push(skill);
        }
    }

    const fallback = ["System Design", "Problem Solving", "Git", "REST APIs", "Team Collaboration"];
    const combined = Array.from(new Set([...detected, ...fallback]));
    return combined.slice(0, 8);
}

function getWorkBadges(job) {
    if (!job) return ["FULL TIME", "ON-SITE"];
    const rawContract = (job.contract_type || "").toUpperCase();
    const rawTime = (job.contract_time || "").toUpperCase();
    const title = (job.title || "").toUpperCase();
    const desc = (job.description || "").toUpperCase();

    let typeBadge = "FULL TIME";
    if (rawContract.includes("INTERN") || title.includes("INTERN")) {
        typeBadge = "INTERNSHIP";
    } else if (rawContract.includes("PART") || rawTime.includes("PART")) {
        typeBadge = "PART TIME";
    } else if (rawContract.includes("CONTRACT")) {
        typeBadge = "CONTRACT";
    }

    let modelBadge = "ON-SITE";
    if (desc.includes("REMOTE") || title.includes("REMOTE") || (job.location?.display_name || "").toUpperCase().includes("REMOTE")) {
        modelBadge = "REMOTE-FRIENDLY";
    } else if (desc.includes("HYBRID") || title.includes("HYBRID")) {
        modelBadge = "HYBRID";
    }

    return [typeBadge, modelBadge];
}

function formatSalary(min, max) {
    if (min == null && max == null) return "Competitive annual salary";
    const format = (value) => `₹${Number(value).toLocaleString("en-IN")}`;
    if (min != null && max != null) return `${format(min)} – ${format(max)} / year`;
    return `${format(min ?? max)} / year`;
}

function formatDate(date) {
    if (!date) return "Recently posted";
    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) {
        return String(date);
    }
    return parsedDate.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

function getSafeApplyUrl(url) {
    if (typeof url !== "string") return "";
    try {
        const parsedUrl = new URL(url);
        return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:"
            ? parsedUrl.href
            : "";
    } catch {
        return "";
    }
}

function JobDetails() {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const stateJob = location.state?.job;
    const [result, setResult] = useState(null);
    const selectedJob = stateJob && String(stateJob.id) === id ? stateJob : null;
    const currentResult = result?.id === id ? result : null;
    const job = currentResult?.job || selectedJob;
    const loading = !selectedJob && (!currentResult || currentResult.loading);
    const notFound = currentResult?.notFound || false;
    const error = currentResult?.error || "";

    // Sync saved jobs with localStorage
    const [savedJobs, setSavedJobs] = useState(() => {
        try {
            const saved = localStorage.getItem("hirelense_saved_jobs");
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    const isSaved = job ? savedJobs.includes(job.id) : false;

    const toggleSave = () => {
        if (!job) return;
        setSavedJobs((prev) => {
            const next = prev.includes(job.id)
                ? prev.filter((item) => item !== job.id)
                : [...prev, job.id];
            try {
                localStorage.setItem("hirelense_saved_jobs", JSON.stringify(next));
            } catch {
                // Ignore storage limits
            }
            return next;
        });
    };

    useEffect(() => {
        const controller = new AbortController();

        const fetchJob = async () => {
            try {
                const response = await api.get(
                    `/jobs/${encodeURIComponent(id)}`,
                    { signal: controller.signal }
                );

                if (!response.data || String(response.data.id) !== id) {
                    setResult({
                        id,
                        job: null,
                        notFound: true,
                        error: "",
                        loading: false,
                    });
                    return;
                }

                setResult({
                    id,
                    job: response.data,
                    notFound: false,
                    error: "",
                    loading: false,
                });
            } catch (requestError) {
                if (requestError.code === "ERR_CANCELED") return;
                if (selectedJob) return;

                const detail = requestError.response?.data?.detail;
                const message =
                    typeof detail === "string"
                        ? detail
                        : requestError.message || "Could not load this job. Please try again.";
                setResult({
                    id,
                    job: null,
                    notFound: requestError.response?.status === 404,
                    error: requestError.response?.status === 404 ? "" : message,
                    loading: false,
                });
            }
        };

        fetchJob();
        return () => controller.abort();
    }, [id, selectedJob]);

    const backToJobs = () => {
        const returnPath = location.state?.from;
        navigate(returnPath?.startsWith("/") ? returnPath : "/jobs");
    };

    const companyName = job?.company?.display_name || "Hiring Company";
    const brand = getCompanyBrand(companyName);
    const [typeBadge, modelBadge] = getWorkBadges(job);
    const skills = extractSkills(job);
    const applyUrl = getSafeApplyUrl(job?.redirect_url);

    const jobFacts = [
        { label: "Location", value: job?.location?.display_name || "India (Remote / Hybrid)", icon: "fa-location-dot" },
        { label: "Employment Type", value: typeBadge, icon: "fa-briefcase" },
        { label: "Work Model", value: modelBadge, icon: "fa-house-laptop" },
        { label: "Contract Schedule", value: job?.contract_time || "Full-time hours", icon: "fa-clock" },
        { label: "Date Posted", value: formatDate(job?.created), icon: "fa-calendar-day" },
        { label: "Verification Status", value: "Verified by HireLense", icon: "fa-shield-halved" },
    ];

    return (
        <main className="job-details-page">
            {/* Ambient Background Glow matching the Dribbble theme */}
            <div className="job-details-ambient-bg" aria-hidden="true">
                <div className="jd-blob jd-blob-1" />
                <div className="jd-blob jd-blob-2" />
            </div>

            <div className="job-details-container">
                {/* Top Action Bar */}
                <div className="job-details-nav-bar">
                    <button className="job-back-link" onClick={backToJobs}>
                        <i className="fa-solid fa-arrow-left" /> Back to Opportunities
                    </button>

                    {job && (
                        <div className="job-top-quick-actions">
                            <button
                                className={`job-quick-bookmark-btn ${isSaved ? "saved" : ""}`}
                                onClick={toggleSave}
                                title={isSaved ? "Saved" : "Save this job"}
                            >
                                <i className={isSaved ? "fa-solid fa-bookmark" : "fa-regular fa-bookmark"} />
                                <span>{isSaved ? "Saved" : "Save Job"}</span>
                            </button>
                        </div>
                    )}
                </div>

                {loading && (
                    <div className="job-details-state-card" role="status">
                        <div className="jd-spinner" aria-hidden="true" />
                        <h3>Loading Job Details...</h3>
                        <p>Fetching full job listing, responsibilities, and requirements.</p>
                    </div>
                )}

                {!loading && notFound && (
                    <div className="job-details-state-card" role="alert">
                        <div className="state-icon not-found-icon">
                            <i className="fa-regular fa-folder-open" />
                        </div>
                        <h3>Job Not Found</h3>
                        <p>This job listing may have expired or is no longer accepting applications.</p>
                        <button className="jd-back-btn" onClick={backToJobs}>
                            Explore Other Jobs
                        </button>
                    </div>
                )}

                {!loading && error && (
                    <div className="job-details-state-card" role="alert">
                        <div className="state-icon error-icon">
                            <i className="fa-solid fa-triangle-exclamation" />
                        </div>
                        <h3>Unable to Load Position</h3>
                        <p>{error}</p>
                        <button className="jd-back-btn" onClick={backToJobs}>
                            Return to Jobs
                        </button>
                    </div>
                )}

                {!loading && !error && !notFound && job && (
                    <div className="job-details-layout">
                        {/* Left Main Content */}
                        <section className="job-details-main">
                            {/* Hero Card */}
                            <header className="job-details-hero-card">
                                <div className="hero-top-row">
                                    <div
                                        className="job-details-avatar"
                                        style={{ backgroundColor: brand.bg, color: brand.color }}
                                    >
                                        {brand.type === "brand" ? (
                                            <i className={brand.icon} style={{ color: brand.color }} />
                                        ) : (
                                            <span className="avatar-initial">{brand.initial}</span>
                                        )}
                                    </div>

                                    <div className="hero-info">
                                        <div className="hero-eyebrow">
                                            <span className="company-text">{companyName}</span>
                                            <span className="verified-pill">
                                                <i className="fa-solid fa-circle-check" /> Verified
                                            </span>
                                        </div>
                                        <h1 className="hero-job-title">{job.title || "Untitled Position"}</h1>
                                        <div className="hero-location-line">
                                            <i className="fa-solid fa-location-dot" />
                                            <span>{job.location?.display_name || "India (Remote / Hybrid)"}</span>
                                            <span className="bullet-sep">•</span>
                                            <i className="fa-regular fa-clock" />
                                            <span>{formatDate(job.created)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Badges Row */}
                                <div className="hero-badges-row">
                                    <span className="hero-badge">{typeBadge}</span>
                                    <span className="hero-badge">{modelBadge}</span>
                                    <span className="hero-badge-alt">Tech Opportunity</span>
                                </div>
                            </header>

                            {/* Skills Section */}
                            <section className="job-skills-card">
                                <div className="card-section-header">
                                    <span className="card-eyebrow">SKILLS & COMPETENCIES</span>
                                    <h2>Key Requirements & Tech Stack</h2>
                                </div>
                                <div className="job-skills-pill-group">
                                    {skills.map((skill, index) => (
                                        <span key={index} className="jd-skill-pill">
                                            <i className="fa-solid fa-check" />
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </section>

                            {/* Role Description Card */}
                            <section className="job-content-card">
                                <div className="card-section-header">
                                    <span className="card-eyebrow">THE ROLE</span>
                                    <h2>About the Position</h2>
                                </div>
                                <div className="job-full-description">
                                    {job.description || "No full description provided for this opening."}
                                </div>
                            </section>

                            {/* Company Summary Banner */}
                            <section className="job-company-footer-card">
                                <div className="footer-company-avatar" style={{ backgroundColor: brand.bg, color: brand.color }}>
                                    {brand.type === "brand" ? (
                                        <i className={brand.icon} style={{ color: brand.color }} />
                                    ) : (
                                        <span>{brand.initial}</span>
                                    )}
                                </div>
                                <div className="footer-company-info">
                                    <h4>{companyName}</h4>
                                    <p>Actively hiring for {job.title} in {job.location?.display_name || "India"}.</p>
                                </div>
                                {applyUrl && (
                                    <a
                                        href={applyUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="footer-apply-btn"
                                    >
                                        Apply on Company Portal ↗
                                    </a>
                                )}
                            </section>
                        </section>

                        {/* Right Sticky Sidebar */}
                        <aside className="job-details-sidebar">
                            <div className="job-overview-card">
                                <span className="sidebar-eyebrow">COMPENSATION</span>
                                <h3 className="job-sidebar-salary">
                                    {formatSalary(job.salary_min, job.salary_max)}
                                </h3>
                                <p className="salary-subtitle">Estimated market range for this position</p>

                                {/* Primary Apply Pill Button */}
                                {applyUrl ? (
                                    <a
                                        className="sidebar-apply-btn"
                                        href={applyUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        Apply Now <i className="fa-solid fa-arrow-up-right-from-square" />
                                    </a>
                                ) : (
                                    <button className="sidebar-apply-btn disabled" disabled>
                                        Application Link Not Provided
                                    </button>
                                )}

                                {/* Secondary Bookmark Button */}
                                <button
                                    type="button"
                                    className={`sidebar-bookmark-btn ${isSaved ? "saved" : ""}`}
                                    onClick={toggleSave}
                                >
                                    <i className={isSaved ? "fa-solid fa-bookmark" : "fa-regular fa-bookmark"} />
                                    {isSaved ? "Saved to Bookmarks" : "Save for Later"}
                                </button>

                                <div className="sidebar-divider" />

                                <span className="sidebar-eyebrow">JOB OVERVIEW</span>
                                <div className="job-facts-grid">
                                    {jobFacts.map(({ label, value, icon }) => (
                                        <div className="job-fact-item" key={label}>
                                            <div className="fact-icon">
                                                <i className={`fa-solid ${icon}`} />
                                            </div>
                                            <div className="fact-details">
                                                <span className="fact-label">{label}</span>
                                                <span className="fact-value">{value}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="sidebar-trust-badge">
                                    <i className="fa-solid fa-shield-check" />
                                    <span>Verified candidate-safe job listing</span>
                                </div>
                            </div>
                        </aside>
                    </div>
                )}
            </div>
        </main>
    );
}

export default JobDetails;
