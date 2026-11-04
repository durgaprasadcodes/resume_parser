import { useEffect, useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api/api";
import "../styles/Jobs.css";

const categories = [
    { label: "Software Engineering", value: "software_engineering", icon: "fa-code" },
    { label: "Backend Engineering", value: "backend_engineering", icon: "fa-server" },
    { label: "Frontend Development", value: "frontend_web", icon: "fa-laptop-code" },
    { label: "Full Stack", value: "full_stack", icon: "fa-layer-group" },
    { label: "AI / ML", value: "ai", icon: "fa-brain" },
    { label: "Internships", value: "internships", icon: "fa-graduation-cap" },
];

const KNOWN_SKILLS = [
    "Python", "JavaScript", "TypeScript", "React", "React.js", "Node.js", "Vue", "Angular",
    "FastAPI", "Django", "Flask", "Docker", "Kubernetes", "PostgreSQL", "MySQL", "MongoDB",
    "Redis", "AWS", "Azure", "GCP", "Machine Learning", "Deep Learning", "PyTorch", "TensorFlow",
    "NLP", "LLM", "RAG", "LangChain", "RESTful APIs", "Microservices", "GraphQL", "Git", "CI/CD",
    "Java", "Spring Boot", "C++", "Go", "Figma", "UI/UX", "System Design", "SQL", "Unit Testing",
    "A/B Testing", "Statistics", "Prototyping", "User Research", "Design System", "Design Handoff"
];

const CATEGORY_DEFAULT_SKILLS = {
    software_engineering: ["Python", "System Design", "PostgreSQL", "Unit Testing", "RESTful APIs"],
    backend_engineering: ["Python", "Microservices", "PostgreSQL", "Unit Testing", "RESTful APIs"],
    frontend_web: ["TypeScript", "React/Vue", "UI Architecture", "CSS3/HTML5", "WebGL/Canvas"],
    full_stack: ["React", "Node.js", "PostgreSQL", "TypeScript", "RESTful APIs"],
    ai: ["Python", "Machine Learning", "PyTorch", "Deep Learning", "Statistics"],
    internships: ["DSA", "Python/Java", "Git", "Problem Solving", "REST APIs"],
};

// Known tech brand icons/colors for impeccable realism
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

    // Dynamic pleasant pastel avatar for any company
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

function extractSkills(job, category) {
    const text = `${job.title || ""} ${job.description || ""}`.toLowerCase();
    const detected = [];

    for (const skill of KNOWN_SKILLS) {
        // Simple word boundary regex match
        const escaped = skill.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
        const regex = new RegExp(`(^|[^a-zA-Z0-9])${escaped}([^a-zA-Z0-9]|$)`, "i");
        if (regex.test(text)) {
            detected.push(skill);
        }
    }

    // Deduplicate and fallback
    const defaults = CATEGORY_DEFAULT_SKILLS[category] || CATEGORY_DEFAULT_SKILLS.software_engineering;
    const combined = Array.from(new Set([...detected, ...defaults]));

    const visible = combined.slice(0, 4);
    const remainder = Math.max(0, combined.length - 4);

    return { visible, remainder };
}

function getWorkBadges(job) {
    const rawContract = (job.contract_type || "").toUpperCase();
    const rawTime = (job.contract_time || "").toUpperCase();
    const title = (job.title || "").toUpperCase();
    const desc = (job.description || "").toUpperCase();

    // 1. Employment Type Badge
    let typeBadge = "FULL TIME";
    if (rawContract.includes("INTERN") || title.includes("INTERN")) {
        typeBadge = "INTERNSHIP";
    } else if (rawContract.includes("PART") || rawTime.includes("PART")) {
        typeBadge = "PART TIME";
    } else if (rawContract.includes("CONTRACT")) {
        typeBadge = "CONTRACT";
    }

    // 2. Work arrangement badge
    let modelBadge = "ON-SITE";
    if (desc.includes("REMOTE") || title.includes("REMOTE") || (job.location?.display_name || "").toUpperCase().includes("REMOTE")) {
        modelBadge = "REMOTE-FRIENDLY";
    } else if (desc.includes("HYBRID") || title.includes("HYBRID")) {
        modelBadge = "HYBRID";
    }

    return [typeBadge, modelBadge];
}

function formatSalary(min, max) {
    if (min == null && max == null) {
        return "Competitive annual salary";
    }
    const format = (value) => `₹${Number(value).toLocaleString("en-IN")}`;
    if (min != null && max != null) {
        return `${format(min)} – ${format(max)} annual salary`;
    }
    return `${format(min ?? max)} annual salary`;
}

function formatPostedTime(created) {
    if (!created) return "1 days ago";
    const str = String(created).trim();
    if (/ago|just|today|yesterday/i.test(str)) {
        return str;
    }
    return `${str} ago`;
}

function getErrorMessage(error) {
    const detail = error.response?.data?.detail;
    if (typeof detail === "string") return detail;
    return error.message || "Failed to fetch jobs. Please try again.";
}

function Jobs() {
    const location = useLocation();
    const navigate = useNavigate();
    const [jobs, setJobs] = useState([]);
    const [category, setCategory] = useState("software_engineering");
    const [refreshKey, setRefreshKey] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Saved jobs persistence
    const [savedJobs, setSavedJobs] = useState(() => {
        try {
            const saved = localStorage.getItem("hirelense_saved_jobs");
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    const toggleSaveJob = (e, jobId) => {
        e.stopPropagation();
        setSavedJobs((prev) => {
            const next = prev.includes(jobId)
                ? prev.filter((id) => id !== jobId)
                : [...prev, jobId];
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

        const fetchJobs = async () => {
            setLoading(true);
            setError("");

            try {
                const response = await api.get("/jobs", {
                    params: { job_type: category },
                    signal: controller.signal,
                });
                const results = response.data?.jobs;

                if (!Array.isArray(results)) {
                    throw new Error("The jobs service returned an invalid response.");
                }

                setJobs(results);
            } catch (requestError) {
                if (requestError.code === "ERR_CANCELED") return;
                setError(getErrorMessage(requestError));
                setJobs([]);
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        };

        fetchJobs();

        return () => controller.abort();
    }, [category, refreshKey]);

    const refreshJobs = () => setRefreshKey((key) => key + 1);

    const openJob = (job) => {
        if (job.id == null) return;
        navigate(`/job/${encodeURIComponent(job.id)}`, {
            state: { job, from: location.pathname },
        });
    };

    const handleJobCardClick = (event, job) => {
        if (event.target.closest("a, button, input, select, textarea")) return;
        openJob(job);
    };

    const handleJobCardKeyDown = (event, job) => {
        if (
            (event.key === "Enter" || event.key === " ") &&
            !event.target.closest("a, button, input, select, textarea")
        ) {
            event.preventDefault();
            openJob(job);
        }
    };

    return (
        <div className="jobs-page">
            {/* Ambient background decoration */}
            <div className="jobs-ambient-bg" aria-hidden="true">
                <div className="ambient-blob blob-1" />
                <div className="ambient-blob blob-2" />
            </div>

            <div className="jobs-container">
                {/* Header */}
                <header className="jobs-header">
                    <div className="jobs-header-info">
                        <div className="jobs-badge-pill">
                            <span className="live-dot" />
                            Curated Opportunities
                        </div>
                        <h1>Find Your Next Dream Role</h1>
                        <p>Explore hand-picked tech roles, internships, and engineering opportunities Updated last <b>24hrs</b> with verified salary ranges.</p>
                    </div>

                    <div className="jobs-header-actions">
                        <button
                            className="header-pill-btn refresh-btn"
                            onClick={refreshJobs}
                            disabled={loading}
                        >
                            <i className={`fa-solid fa-rotate-right ${loading ? "fa-spin" : ""}`} />
                            Refresh
                        </button>
                        <button
                            className="header-pill-btn home-btn"
                            onClick={() => navigate("/")}
                        >
                            <i className="fa-solid fa-arrow-left" />
                            Back to Home
                        </button>
                    </div>
                </header>

                {/* Categories */}
                <section className="category-section">
                    <div className="category-list">
                        {categories.map((item) => (
                            <button
                                key={item.value}
                                className={`category-btn ${category === item.value ? "active" : ""}`}
                                onClick={() => setCategory(item.value)}
                            >
                                <i className={`fa-solid ${item.icon}`} />
                                {item.label}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Main Content */}
                <section className="jobs-section">
                    <div className="jobs-section-header">
                        <div>
                            <h2>Available Positions</h2>
                            <p className="jobs-count-text">
                                {loading
                                    ? "Scanning live job openings..."
                                    : `${jobs.length} open position${jobs.length === 1 ? "" : "s"} found`}
                            </p>
                        </div>
                    </div>

                    {loading && (
                        <div className="loading-state">
                            <div className="modern-spinner" />
                            <p>Discovering verified tech roles...</p>
                        </div>
                    )}

                    {error && !loading && (
                        <div className="error-card">
                            <div className="error-icon">
                                <i className="fa-solid fa-circle-exclamation" />
                            </div>
                            <div className="error-content">
                                <h4>Unable to Load Opportunities</h4>
                                <p>{error}</p>
                            </div>
                            <button className="error-retry-btn" onClick={refreshJobs}>
                                Try Again
                            </button>
                        </div>
                    )}

                    {!loading && !error && jobs.length === 0 && (
                        <div className="empty-state-card">
                            <div className="empty-state-icon">
                                <i className="fa-regular fa-folder-open" />
                            </div>
                            <h3>No Positions Found</h3>
                            <p>We couldn't find any openings in this category right now. Try switching categories or refreshing.</p>
                            <button className="empty-refresh-btn" onClick={() => setCategory("software_engineering")}>
                                View Software Engineering
                            </button>
                        </div>
                    )}

                    {!loading && !error && jobs.length > 0 && (
                        <div className="jobs-grid">
                            {jobs.map((job) => {
                                const companyName = job.company?.display_name || "Tech Company";
                                const brand = getCompanyBrand(companyName);
                                const [typeBadge, modelBadge] = getWorkBadges(job);
                                const { visible, remainder } = extractSkills(job, category);
                                const isSaved = savedJobs.includes(job.id);
                                const locationText = job.location?.display_name || "India (Remote / Hybrid)";
                                const postedText = formatPostedTime(job.created);
                                const salaryText = formatSalary(job.salary_min, job.salary_max);

                                return (
                                    <article
                                        className="job-card"
                                        key={job.id}
                                        role="link"
                                        tabIndex={job.id == null ? undefined : 0}
                                        aria-disabled={job.id == null}
                                        onClick={(event) => handleJobCardClick(event, job)}
                                        onKeyDown={(event) => handleJobCardKeyDown(event, job)}
                                    >
                                        {/* Card Top: Logo, Title & Company, Posted Time */}
                                        <div className="job-card-header">
                                            <div className="job-company-avatar" style={{ backgroundColor: brand.bg, color: brand.color }}>
                                                {brand.type === "brand" ? (
                                                    <i className={brand.icon} style={{ color: brand.color }} />
                                                ) : (
                                                    <span className="company-initial">{brand.initial}</span>
                                                )}
                                            </div>

                                            <div className="job-header-text">
                                                <h3 className="job-title" title={job.title}>{job.title}</h3>
                                                <p className="job-company-name">{companyName}</p>
                                            </div>

                                            <span className="job-posted-time">{postedText}</span>
                                        </div>

                                        {/* Work Model Badges (Warm Pastel Cream/Amber) */}
                                        <div className="job-badges-row">
                                            <span className="job-badge">{typeBadge}</span>
                                            <span className="job-badge">{modelBadge}</span>
                                        </div>

                                        {/* Inset Container: Location, Salary, Skill Tags */}
                                        <div className="job-card-inner">
                                            <div className="job-meta-row location-row">
                                                <span className="meta-icon">
                                                    <i className="fa-solid fa-location-dot" />
                                                </span>
                                                <span className="meta-text">{locationText}</span>
                                            </div>

                                            <div className="job-meta-row salary-row">
                                                <span className="meta-icon">
                                                    <i className="fa-solid fa-sack-dollar" />
                                                </span>
                                                <span className="meta-text">{salaryText}</span>
                                            </div>

                                            {/* Crisp Skill Badges */}
                                            <div className="job-skills-wrap">
                                                {visible.map((skill, index) => (
                                                    <span key={index} className="job-skill-pill">
                                                        {skill}
                                                    </span>
                                                ))}
                                                {remainder > 0 && (
                                                    <span className="job-skill-pill skill-more-pill">
                                                        +{remainder}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Footer Actions: Bookmark + Vibrant Apply Button */}
                                        <div className="job-card-actions">
                                            <button
                                                type="button"
                                                className={`job-bookmark-btn ${isSaved ? "saved" : ""}`}
                                                aria-label={isSaved ? "Remove from bookmarks" : "Save job"}
                                                onClick={(e) => toggleSaveJob(e, job.id)}
                                            >
                                                <i className={isSaved ? "fa-solid fa-bookmark" : "fa-regular fa-bookmark"} />
                                            </button>

                                            {job.redirect_url ? (
                                                <a
                                                    href={job.redirect_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="job-apply-pill-btn"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    Apply Now
                                                </a>
                                            ) : (
                                                <button
                                                    type="button"
                                                    className="job-apply-pill-btn"
                                                    onClick={() => openJob(job)}
                                                >
                                                    View Details
                                                </button>
                                            )}
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}

export default Jobs;
