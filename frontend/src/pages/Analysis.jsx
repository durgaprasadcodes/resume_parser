import { useRef, useState, useMemo, useCallback, useEffect } from "react";
import api from "../api/api";
import { useAuth } from "../auth/AuthContext";
import Navbar from "../components/Navbar";
import uploadResumeImage from "../assets/upload_resume.png";
import AtsScoreCircle from "../components/AtsScoreCircle";
import { showSuccess, showError } from "../lib/toast";
import { saveAnalysis, loadAnalysis, clearAnalysis } from "../lib/analysisStorage";
import LoadingAnimation4 from "../anim/LoadingAnimation4";
import "../styles/Analysis.css";

import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Filler,
    Title,
} from "chart.js";
import { Doughnut, Line } from "react-chartjs-2";

ChartJS.register(
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Filler,
    Title
);

// ============================================================================
// HELPERS
// ============================================================================

const clamp = (n, min, max) => Math.min(Math.max(n, min), max);

function getScoreTone(score) {
    if (score >= 80) return "tone-excellent";
    if (score >= 65) return "tone-strong";
    if (score >= 50) return "tone-moderate";
    return "tone-risk";
}

// Creates a vertical gradient for the line-chart fill, reading the chart's own canvas
function makeGradient(ctx, chartArea, from, to) {
    if (!chartArea) return from;
    const g = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
    g.addColorStop(0, from);
    g.addColorStop(1, to);
    return g;
}

// ============================================================================
// SUBCOMPONENTS
// ============================================================================

// Card that tilts toward the cursor for a subtle 3D feel
function TiltCard({ children, className = "", intensity = 8 }) {
    const ref = useRef(null);

    const handleMove = (e) => {
        const el = ref.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        el.style.setProperty("--ry", `${px * intensity}deg`);
        el.style.setProperty("--rx", `${-py * intensity}deg`);
        el.style.setProperty("--mx", `${(px + 0.5) * 100}%`);
        el.style.setProperty("--my", `${(py + 0.5) * 100}%`);
    };

    const handleLeave = () => {
        const el = ref.current;
        if (!el) return;
        el.style.setProperty("--ry", "0deg");
        el.style.setProperty("--rx", "0deg");
    };

    return (
        <div
            ref={ref}
            className={`tilt-card ${className}`}
            onMouseMove={handleMove}
            onMouseLeave={handleLeave}
        >
            <div className="tilt-inner">{children}</div>
        </div>
    );
}

function StatCard({ icon, label, value, subtext, accent = "cyan" }) {
    return (
        <TiltCard className={`kpi-card accent-${accent}`}>
            <div className="kpi-icon">
                <i className={icon} aria-hidden="true" />
            </div>
            <span className="kpi-label">{label}</span>
            <span className="kpi-value">{value}</span>
            {subtext && <span className="kpi-subtext">{subtext}</span>}
        </TiltCard>
    );
}

function SectionHeader({ eyebrow, title, icon, action }) {
    return (
        <div className="section-header">
            <div>
                {eyebrow && <span className="section-eyebrow">{eyebrow}</span>}
                <h3 className="section-title">
                    {icon && <i className={`${icon} section-title-icon`} aria-hidden="true" />}
                    {title}
                </h3>
            </div>
            {action && <div className="section-action">{action}</div>}
        </div>
    );
}

function ProjectCard({ project, index }) {
    const data = project?.projects || {};
    const score = project?.final_score ?? data?.score ?? 0;
    const tone = getScoreTone(score);

    return (
        <TiltCard className="project-card" intensity={6}>
            <div className="project-card-header">
                <div className="project-title-area">
                    <span className="project-index">{String(index + 1).padStart(2, "0")}</span>
                    <h4 className="project-name">{data.name || "Untitled Project"}</h4>
                </div>
                <div className={`score-ring ${tone}`}>
                    <span className="score-num">{score}</span>
                </div>
            </div>

            {data.description && (
                <div className="project-block">
                    <span className="block-label">Overview & Architecture</span>
                    <p className="block-text">{data.description}</p>
                </div>
            )}

            {data.project_value && (
                <div className="project-block project-value">
                    <span className="block-label">
                        <i className="fa-solid fa-chart-line" /> Why This Project Matters
                    </span>
                    <p className="block-text">{data.project_value}</p>
                </div>
            )}
        </TiltCard>
    );
}

function RecommendationCard({ improvement, index }) {
    const priority = (improvement?.priority || "MEDIUM").toUpperCase();
    const level = priority === "HIGH" ? "high" : priority === "LOW" ? "low" : "medium";
    const icon =
        level === "high"
            ? "fa-solid fa-circle-exclamation"
            : level === "low"
                ? "fa-solid fa-circle-info"
                : "fa-solid fa-triangle-exclamation";

    return (
        <TiltCard className={`rec-card rec-${level}`} intensity={4}>
            <div className="rec-top">
                <div className="rec-badges">
                    <span className={`rec-priority rec-${level}`}>
                        <i className={icon} /> {priority}
                    </span>
                    {improvement?.area && (
                        <span className="rec-area">
                            <i className="fa-solid fa-folder" /> {improvement.area}
                        </span>
                    )}
                </div>
                <span className="rec-step">STEP {String(index + 1).padStart(2, "0")}</span>
            </div>

            <h4 className="rec-problem">{improvement?.problem || "Identified Opportunity"}</h4>

            {improvement?.reason && (
                <div className="rec-reason">
                    <span className="rec-reason-label">Impact Analysis</span>
                    <p>{improvement.reason}</p>
                </div>
            )}
        </TiltCard>
    );
}

function EmptyState({ icon = "fa-solid fa-inbox", title, message }) {
    return (
        <div className="empty-state">
            <div className="empty-icon">
                <i className={icon} aria-hidden="true" />
            </div>
            <h4 className="empty-title">{title}</h4>
            <p className="empty-message">{message}</p>
        </div>
    );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function Analysis() {
    const { user } = useAuth();

    // Restore a previously saved report on mount
    const saved = useMemo(() => loadAnalysis(), []);

    const [file, setFile] = useState(null);
    const [jd, setJd] = useState("");
    const [dragActive, setDragActive] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [filename, setFilename] = useState(saved?.filename || "");
    const [filepath, setFilepath] = useState(saved?.filepath || "");
    const [result, setResult] = useState(saved?.result || null);
    const [error, setError] = useState("");

    const fileInputRef = useRef(null);

    // --------------------------------------------------
    // FILE HANDLERS
    // --------------------------------------------------
    const acceptFile = useCallback((f) => {
        if (f && f.type === "application/pdf") {
            setFile(f);
            setError("");
            return true;
        }
        const msg = "Please upload a PDF file.";
        setError(msg);
        showError(msg);
        return false;
    }, []);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
        else if (e.type === "dragleave") setDragActive(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        acceptFile(e.dataTransfer.files?.[0]);
    };

    const handleFileChange = (e) => {
        acceptFile(e.target.files?.[0]);
    };

    const removeFile = () => {
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleReset = () => {
        setResult(null);
        setFile(null);
        setJd("");
        setError("");
        setFilename("");
        setFilepath("");
        clearAnalysis();
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleDownload = async () => {
        if (!filepath) return;
        setDownloading(true);
        try {
            const response = await fetch(filepath);
            if (!response.ok) throw new Error(`Download failed (${response.status}).`);

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = filename || "Resume.pdf";
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch (err) {
            console.error("Resume download error:", err);
            showError("Could not download the resume. Please try again.");
        } finally {
            setDownloading(false);
        }
    };

    const handleAnalyze = async () => {
        if (!file) {
            setError("Please select a resume file first.");
            return;
        }
        if (!user?.id) {
            const msg = "Your session could not be verified. Please sign in again.";
            setError(msg);
            showError(msg);
            return;
        }

        setError("");
        setUploading(true);

        try {
            const formData = new FormData();
            formData.append("file", file);
            if (jd && jd.trim()) {
                formData.append("jd", jd.trim());
            }

            const response = await api.post("/hirelense/upload_resume", formData, {
                params: { user_id: user.id },
            });

            const parsed =
                typeof response.data.result === "string"
                    ? JSON.parse(response.data.result)
                    : response.data.result;

            const newFilename = response.data.filename || file.name || "Resume.pdf";
            const newFilepath = response.data.url;

            setResult(parsed);
            setFilename(newFilename);
            setFilepath(newFilepath);

            // Persist so the report survives a refresh; cleared on logout
            saveAnalysis({ result: parsed, filename: newFilename, filepath: newFilepath });

            showSuccess("Resume analyzed successfully!");
        } catch (err) {
            console.error("Resume analysis error:", err);
            const msg =
                err.response?.data?.detail || err.message || "Analysis failed. Please try again.";
            showError(msg);
            setError(msg);
        } finally {
            setUploading(false);
        }
    };

    // --------------------------------------------------
    // DERIVED DATA
    // --------------------------------------------------
    const atsScore = result?.ats_score ?? 0;

    const atsInterpretation = useMemo(() => {
        if (atsScore >= 80)
            return {
                label: "Excellent Match",
                tone: "tone-excellent",
                description:
                    "Exceptional alignment with target technical roles. Core competencies, project depth and professional standards are clearly validated.",
            };
        if (atsScore >= 65)
            return {
                label: "Strong Match",
                tone: "tone-strong",
                description:
                    "Solid foundational alignment with key requirements. Closing keyword gaps and quantifying project outcomes will move you into top candidate pools.",
            };
        if (atsScore >= 50)
            return {
                label: "Moderate Match",
                tone: "tone-moderate",
                description:
                    "Relevant qualifications detected, but gaps remain in tech stack coverage, quantified outcomes and structured experience.",
            };
        return {
            label: "Needs Improvement",
            tone: "tone-risk",
            description:
                "Significant gaps against standard ATS parsing benchmarks. Structural reorganization, skill alignment and project depth need attention.",
        };
    }, [atsScore]);

    const matchedSkills = useMemo(
        () => (Array.isArray(result?.skills?.matched) ? result.skills.matched : []),
        [result]
    );
    const unmatchedSkills = useMemo(
        () => (Array.isArray(result?.skills?.unmatched) ? result.skills.unmatched : []),
        [result]
    );
    const skillScore = result?.skills?.final_score ?? (matchedSkills.length > 0 ? 100 : 0);

    const projectsList = useMemo(
        () => (Array.isArray(result?.projects) ? result.projects : []),
        [result]
    );

    const projectScores = useMemo(
        () => projectsList.map((p) => p?.final_score ?? p?.projects?.score ?? 0),
        [projectsList]
    );

    const projectAverageScore = useMemo(() => {
        if (!projectScores.length) return 0;
        return Math.round(projectScores.reduce((a, b) => a + b, 0) / projectScores.length);
    }, [projectScores]);

    const certificationsList = useMemo(
        () =>
            Array.isArray(result?.certifications?.certificates)
                ? result.certifications.certificates
                : [],
        [result]
    );
    const certScore = result?.certifications?.final_score ?? 0;

    const experienceList = useMemo(
        () => (Array.isArray(result?.experience) ? result.experience : []),
        [result]
    );

    const positivesList = useMemo(
        () =>
            Array.isArray(result?.resume_quality?.positives)
                ? result.resume_quality.positives
                : [],
        [result]
    );
    const negativesList = useMemo(
        () =>
            Array.isArray(result?.resume_quality?.negatives)
                ? result.resume_quality.negatives
                : [],
        [result]
    );

    const improvementsList = useMemo(
        () => (Array.isArray(result?.improvements) ? result.improvements : []),
        [result]
    );

    // --------------------------------------------------
    // CHART CONFIGS
    // --------------------------------------------------
    const skillsDoughnutData = useMemo(() => {
        const matched = matchedSkills.length;
        const unmatched = unmatchedSkills.length;
        const total = matched + unmatched;
        return {
            labels: ["Matched", "Missing"],
            datasets: [
                {
                    data: total === 0 ? [1, 0] : [matched, unmatched],
                    backgroundColor: total === 0 ? ["#1e293b", "#1e293b"] : ["#22d3ee", "#f43f5e"],
                    borderColor: "#0b1120",
                    borderWidth: 4,
                    hoverOffset: 6,
                },
            ],
        };
    }, [matchedSkills, unmatchedSkills]);

    const skillsDoughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "74%",
        animation: { animateRotate: true, duration: 1100 },
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: "rgba(2, 6, 23, 0.92)",
                titleColor: "#e2e8f0",
                bodyColor: "#f8fafc",
                borderColor: "rgba(34, 211, 238, 0.35)",
                borderWidth: 1,
                padding: 12,
                cornerRadius: 10,
                callbacks: {
                    label: (ctx) => {
                        const total = matchedSkills.length + unmatchedSkills.length;
                        const pct = total > 0 ? Math.round((ctx.raw / total) * 100) : 0;
                        return ` ${ctx.label}: ${ctx.raw} (${pct}%)`;
                    },
                },
            },
        },
    };

    // Line chart: project scores with a gradient area fill
    const projectLineData = useMemo(() => {
        const labels = projectsList.map((p, i) => {
            const name = p?.projects?.name || `Project ${i + 1}`;
            return name.length > 18 ? name.slice(0, 16) + "…" : name;
        });
        return {
            labels,
            datasets: [
                {
                    label: "Project score",
                    data: projectScores,
                    borderColor: "#22d3ee",
                    borderWidth: 3,
                    tension: 0.42,
                    fill: true,
                    backgroundColor: (context) => {
                        const { chart } = context;
                        return makeGradient(
                            chart.ctx,
                            chart.chartArea,
                            "rgba(34, 211, 238, 0.45)",
                            "rgba(34, 211, 238, 0.00)"
                        );
                    },
                    pointBackgroundColor: "#0b1120",
                    pointBorderColor: "#22d3ee",
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 8,
                    pointHoverBackgroundColor: "#22d3ee",
                },
                {
                    label: "Average",
                    data: projectScores.map(() => projectAverageScore),
                    borderColor: "rgba(168, 85, 247, 0.8)",
                    borderDash: [6, 6],
                    borderWidth: 2,
                    pointRadius: 0,
                    tension: 0,
                    fill: false,
                },
            ],
        };
    }, [projectsList, projectScores, projectAverageScore]);

    const projectLineOptions = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        animation: { duration: 1200, easing: "easeOutQuart" },
        scales: {
            y: {
                beginAtZero: true,
                max: 100,
                grid: { color: "rgba(148, 163, 184, 0.08)", drawTicks: false },
                border: { display: false },
                ticks: {
                    stepSize: 20,
                    color: "#64748b",
                    font: { family: "'JetBrains Mono', monospace", size: 11 },
                    padding: 10,
                },
            },
            x: {
                grid: { display: false },
                border: { display: false },
                ticks: {
                    color: "#94a3b8",
                    font: { family: "'Space Grotesk', sans-serif", size: 12, weight: "500" },
                },
            },
        },
        plugins: {
            legend: {
                display: true,
                position: "bottom",
                labels: {
                    color: "#94a3b8",
                    usePointStyle: true,
                    boxWidth: 8,
                    font: { family: "'Space Grotesk', sans-serif", size: 12 },
                },
            },
            tooltip: {
                backgroundColor: "rgba(2, 6, 23, 0.92)",
                titleColor: "#e2e8f0",
                bodyColor: "#f8fafc",
                borderColor: "rgba(34, 211, 238, 0.35)",
                borderWidth: 1,
                padding: 12,
                cornerRadius: 10,
                displayColors: false,
                callbacks: {
                    label: (ctx) => ` ${ctx.dataset.label}: ${ctx.raw} / 100`,
                },
            },
        },
    };

    // --------------------------------------------------
    // RENDER
    // --------------------------------------------------
    return (
        <>
            <Navbar />

            <div className="page-container analysis-page">
                <div className="ambient ambient-a" aria-hidden="true" />
                <div className="ambient ambient-b" aria-hidden="true" />

                {uploading ? (
                    /* ---------------- LOADING ANIMATION STATE (Animation4) ---------------- */
                    <section className="analysis-loading-section" aria-live="polite">
                        <div className="analysis-loading-card">
                            <LoadingAnimation4 width={300} height={300} />
                            <div className="analysis-loading-copy">
                                <span className="hero-eyebrow">AI PARSER ACTIVE</span>
                                <h2 className="loading-title">Analyzing Your Resume…</h2>
                                <p className="loading-subtitle">
                                    Our AI engine is extracting keywords, evaluating ATS compatibility, and calculating your score.
                                </p>
                                <div className="loading-steps-pills">
                                    <span className="loading-step-pill active">
                                        <span className="step-live-dot" /> {file?.name || "Document.pdf"}
                                    </span>
                                    <span className="loading-step-pill">
                                        <i className="fa-solid fa-wand-magic-sparkles" /> Hirelense AI
                                    </span>
                                </div>
                            </div>
                        </div>
                    </section>
                ) : !result ? (
                    /* ---------------- UPLOAD ---------------- */
                    <section className="upload-section">
                        <span className="hero-eyebrow">AI · ATS INTELLIGENCE</span>
                        <h1 className="upload-title">
                            Upload your <span className="gradient-text">resume</span>
                        </h1>
                        <p className="upload-sub">
                            Get a full ATS breakdown, keyword gap analysis and prioritized career
                            recommendations in seconds.
                        </p>

                        {/* Workbench: Side-by-Side (display: flex) on Desktop, Stacked (flex-direction: column) on Mobile */}
                        <div className="upload-workbench">
                            <div className="workbench-col resume-col">
                                <TiltCard className="dropzone-wrap" intensity={5}>
                                    <div
                                        className={`upload-dropzone${dragActive ? " is-active" : ""}`}
                                        onDragEnter={handleDrag}
                                        onDragLeave={handleDrag}
                                        onDragOver={handleDrag}
                                        onDrop={handleDrop}
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <img
                                            className="upload-illustration"
                                            src={uploadResumeImage}
                                            alt="Resume upload illustration"
                                        />
                                        <div className="dropzone-copy">
                                            <h3>{dragActive ? "Drop it like it's hot" : "Drag & drop your resume"}</h3>
                                            <p>or click to browse · PDF only · max 10MB</p>
                                        </div>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept=".pdf"
                                            onChange={handleFileChange}
                                            hidden
                                        />
                                    </div>
                                </TiltCard>

                                {file && (
                                    <div className="file-chip">
                                        <span>
                                            <i className="fa-regular fa-file-pdf" /> {file.name}{" "}
                                            <small>({(file.size / 1024).toFixed(1)} KB)</small>
                                        </span>
                                        <button type="button" onClick={removeFile}>
                                            <i className="fa-solid fa-xmark" /> Remove
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="workbench-col jd-col">
                                <div className="jd-input-container">
                                    <div className="jd-input-header">
                                        <label htmlFor="jd-textarea" className="jd-input-title">
                                            <i className="fa-solid fa-briefcase" /> Target Job Description
                                            <span className="jd-optional-tag">Optional</span>
                                        </label>
                                        {jd && (
                                            <button
                                                type="button"
                                                className="jd-clear-btn"
                                                onClick={() => setJd("")}
                                            >
                                                Clear
                                            </button>
                                        )}
                                    </div>
                                    <textarea
                                        id="jd-textarea"
                                        className="jd-textarea"
                                        rows={6}
                                        placeholder="Paste the target Job Description (JD) here to evaluate your keyword match, skills alignment, and role relevancy..."
                                        value={jd}
                                        onChange={(e) => setJd(e.target.value)}
                                    />
                                    <div className="jd-input-footer">
                                        <span className="jd-char-counter">
                                            {jd.length.toLocaleString()} characters
                                        </span>
                                        <span className="jd-input-hint">
                                            <i className="fa-regular fa-lightbulb" /> Tip: Tailors ATS score & missing keywords.
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {error && <div className="error-banner">{error}</div>}

                        <button
                            type="button"
                            className="cta-btn"
                            onClick={handleAnalyze}
                            disabled={!file || uploading}
                        >
                            {uploading ? (
                                <>
                                    <span className="spinner" /> Analyzing resume…
                                </>
                            ) : (
                                <>
                                    <i className="fa-solid fa-bolt" /> Analyze Resume
                                </>
                            )}
                        </button>
                    </section>
                ) : (
                    /* ---------------- DASHBOARD ---------------- */
                    <div className="analysis-dashboard">
                        {/* HEADER */}
                        <header className="dash-header glass">
                            <div className="header-left">
                                <div className="header-eyebrow">
                                    <span className="pill pill-cyan">RESUME ANALYSIS</span>
                                    <span className="live">
                                        <span className="live-dot" /> AI Evaluated
                                    </span>
                                </div>
                                <h1 className="header-title">
                                    Resume <span className="gradient-text">Intelligence</span> Report
                                </h1>
                                <div className="candidate-meta">
                                    <span className="candidate-name">{result?.name || "Candidate Profile"}</span>
                                    {result?.profession && (
                                        <>
                                            <span className="sep">/</span>
                                            <span className="candidate-role">{result.profession}</span>
                                        </>
                                    )}
                                </div>
                                <div className="file-tag">
                                    <i className="fa-regular fa-file-pdf" /> {filename || "Resume.pdf"}
                                </div>
                            </div>

                            <div className="header-actions">
                                <button type="button" className="btn-ghost" onClick={handleReset}>
                                    <i className="fa-solid fa-arrow-left" /> New analysis
                                </button>
                                <button type="button" className="btn-ghost" onClick={() => window.print()}>
                                    <i className="fa-solid fa-print" /> Export
                                </button>
                                {filepath && (
                                    <button
                                        type="button"
                                        className="btn-solid"
                                        onClick={handleDownload}
                                        disabled={downloading}
                                    >
                                        {downloading ? "Downloading…" : "Download PDF"}
                                    </button>
                                )}
                            </div>
                        </header>

                        {/* HERO */}
                        <section className={`dash-hero glass ${atsInterpretation.tone}`}>
                            <div className="hero-ring">
                                <AtsScoreCircle score={atsScore} size={200} strokeWidth={16} />
                            </div>
                            <div className="hero-copy">
                                <span className="hero-kicker">OVERALL EVALUATION</span>
                                <span className={`status-chip ${atsInterpretation.tone}`}>
                                    <i className="fa-solid fa-circle-check" /> {atsInterpretation.label}
                                </span>
                                <h2 className="hero-heading">ATS Compatibility Score</h2>
                                <div className="hero-score">
                                    <span className="hero-big">{atsScore}</span>
                                    <span className="hero-denom">/100</span>
                                </div>
                                <p className="hero-desc">{atsInterpretation.description}</p>
                            </div>
                        </section>

                        {/* KPIs */}
                        <section className="kpi-grid">
                            <StatCard
                                icon="fa-solid fa-bullseye"
                                label="ATS Score"
                                value={`${atsScore}/100`}
                                subtext={atsInterpretation.label}
                                accent="cyan"
                            />
                            <StatCard
                                icon="fa-solid fa-chart-pie"
                                label="Skill Match"
                                value={`${skillScore}%`}
                                subtext={`${matchedSkills.length} matched · ${unmatchedSkills.length} missing`}
                                accent="emerald"
                            />
                            <StatCard
                                icon="fa-solid fa-code"
                                label="Project Score"
                                value={projectsList.length ? `${projectAverageScore}/100` : "N/A"}
                                subtext={`${projectsList.length} technical projects`}
                                accent="violet"
                            />
                            <StatCard
                                icon="fa-solid fa-certificate"
                                label="Certifications"
                                value={certificationsList.length}
                                subtext={certScore > 0 ? `Rating ${certScore}/100` : "Verified credentials"}
                                accent="amber"
                            />
                            <StatCard
                                icon="fa-solid fa-briefcase"
                                label="Experience"
                                value={experienceList.length}
                                subtext={experienceList.length ? "Track record" : "None detected"}
                                accent="rose"
                            />
                        </section>

                        {/* SKILLS */}
                        <section className="dash-section glass">
                            <SectionHeader
                                eyebrow="COMPETENCY BENCHMARK"
                                title="Skills Match"
                                icon="fa-solid fa-microchip"
                                action={
                                    <span className="pill">
                                        {matchedSkills.length} of {matchedSkills.length + unmatchedSkills.length}
                                    </span>
                                }
                            />

                            <div className="skills-layout">
                                <TiltCard className="donut-card" intensity={6}>
                                    <div className="donut-wrap">
                                        <Doughnut data={skillsDoughnutData} options={skillsDoughnutOptions} />
                                        <div className="donut-center">
                                            <span className="donut-num">{skillScore}%</span>
                                            <span className="donut-label">Match</span>
                                        </div>
                                    </div>
                                    <div className="donut-legend">
                                        <div>
                                            <i className="dot dot-cyan" /> Matched <b>{matchedSkills.length}</b>
                                        </div>
                                        <div>
                                            <i className="dot dot-rose" /> Missing <b>{unmatchedSkills.length}</b>
                                        </div>
                                    </div>
                                </TiltCard>

                                <div className="skill-lists">
                                    <div className="skill-group">
                                        <div className="group-title ok">
                                            <i className="fa-solid fa-circle-check" /> Matched ({matchedSkills.length})
                                        </div>
                                        {matchedSkills.length ? (
                                            <div className="chip-wrap">
                                                {matchedSkills.map((s, i) => (
                                                    <span key={i} className="chip chip-ok">
                                                        <i className="fa-solid fa-check" /> {s}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="muted-italic">No explicitly matched skills detected.</p>
                                        )}
                                    </div>

                                    <div className="skill-group">
                                        <div className="group-title bad">
                                            <i className="fa-solid fa-circle-exclamation" /> Missing ({unmatchedSkills.length})
                                        </div>
                                        {unmatchedSkills.length ? (
                                            <div className="chip-wrap">
                                                {unmatchedSkills.map((s, i) => (
                                                    <span key={i} className="chip chip-bad">
                                                        <i className="fa-solid fa-xmark" /> {s}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="all-clear">
                                                <i className="fa-solid fa-circle-check" /> No missing skills detected
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* PROJECT LINE CHART */}
                        <section className="dash-section glass">
                            <SectionHeader
                                eyebrow="PORTFOLIO RIGOR"
                                title="Project Performance"
                                icon="fa-solid fa-wave-square"
                                action={<span className="pill">Avg {projectAverageScore}/100</span>}
                            />

                            {projectsList.length > 0 ? (
                                <div className="line-chart-card">
                                    <div className="line-chart-wrap">
                                        <Line data={projectLineData} options={projectLineOptions} />
                                    </div>
                                </div>
                            ) : (
                                <EmptyState
                                    icon="fa-solid fa-laptop-code"
                                    title="No projects detected"
                                    message="No project sections were parsed. Quantified technical projects significantly improve ATS scoring."
                                />
                            )}
                        </section>

                        {/* PROJECT CARDS */}
                        {projectsList.length > 0 && (
                            <section className="dash-section glass">
                                <SectionHeader eyebrow="DETAILED REPOSITORIES" title="Project Breakdown" icon="fa-solid fa-layer-group" />
                                <div className="projects-grid">
                                    {projectsList.map((p, i) => (
                                        <ProjectCard key={i} project={p} index={i} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* SUMMARY */}
                        <section className="dash-section glass">
                            <SectionHeader eyebrow="EXECUTIVE PROFILE" title="Professional Summary" icon="fa-solid fa-user-tie" />
                            {result?.summary ? (
                                <p className="summary-text">{result.summary}</p>
                            ) : (
                                <EmptyState
                                    icon="fa-solid fa-align-left"
                                    title="No summary section found"
                                    message="A concise professional summary highlighting your specialization is strongly recommended."
                                />
                            )}
                        </section>

                        {/* CERTIFICATIONS */}
                        <section className="dash-section glass">
                            <SectionHeader
                                eyebrow="CREDENTIALS & BADGES"
                                title="Certifications"
                                icon="fa-solid fa-certificate"
                                action={certScore > 0 ? <span className="pill">Score {certScore}/100</span> : null}
                            />
                            {certificationsList.length > 0 ? (
                                <div className="cert-grid">
                                    {certificationsList.map((c, i) => (
                                        <TiltCard key={i} className="cert-item" intensity={5}>
                                            <div className="cert-icon">
                                                <i className="fa-solid fa-award" />
                                            </div>
                                            <span>{c}</span>
                                        </TiltCard>
                                    ))}
                                </div>
                            ) : (
                                <EmptyState
                                    icon="fa-solid fa-award"
                                    title="No certifications detected"
                                    message="Industry-recognized credentials (AWS, Google Cloud, OCI, Scrum) can boost ATS ranking."
                                />
                            )}
                        </section>

                        {/* EXPERIENCE */}
                        <section className="dash-section glass">
                            <SectionHeader eyebrow="CAREER HISTORY" title="Professional Experience" icon="fa-solid fa-briefcase" />
                            {experienceList.length > 0 ? (
                                <div className="exp-list">
                                    {experienceList.map((exp, i) => (
                                        <TiltCard key={i} className="exp-item" intensity={4}>
                                            <div className="exp-marker">
                                                <i className="fa-solid fa-building" />
                                            </div>
                                            <div className="exp-body">
                                                <h4 className="exp-role">{exp?.role || exp?.title || "Role"}</h4>
                                                <div className="exp-meta">
                                                    <span className="exp-company">{exp?.company || "Company"}</span>
                                                    {exp?.duration && (
                                                        <>
                                                            <span className="sep">·</span>
                                                            <span className="exp-duration">{exp.duration}</span>
                                                        </>
                                                    )}
                                                </div>
                                                {exp?.description && <p className="exp-desc">{exp.description}</p>}
                                            </div>
                                        </TiltCard>
                                    ))}
                                </div>
                            ) : (
                                <EmptyState
                                    icon="fa-solid fa-briefcase"
                                    title="No professional experience detected"
                                    message="This resume emphasizes academic foundations, certifications and projects over corporate experience."
                                />
                            )}
                        </section>

                        {/* QUALITY */}
                        <section className="dash-section glass">
                            <SectionHeader eyebrow="ATS AUDIT" title="Resume Quality" icon="fa-solid fa-scale-balanced" />
                            <div className="quality-grid">
                                <TiltCard className="quality-card q-good" intensity={4}>
                                    <div className="quality-head">
                                        <i className="fa-solid fa-circle-check" />
                                        <div>
                                            <h4>What Your Resume Does Well</h4>
                                            <span>Strong signals detected by parsing</span>
                                        </div>
                                    </div>
                                    {positivesList.length > 0 ? (
                                        <ul className="signal-list">
                                            {positivesList.map((item, i) => (
                                                <li key={i} className="signal good">
                                                    <i className="fa-solid fa-check" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="muted-italic">No specific positive signals highlighted.</p>
                                    )}
                                </TiltCard>

                                <TiltCard className="quality-card q-warn" intensity={4}>
                                    <div className="quality-head">
                                        <i className="fa-solid fa-triangle-exclamation" />
                                        <div>
                                            <h4>Potential Concerns</h4>
                                            <span>Red flags that could filter you out</span>
                                        </div>
                                    </div>
                                    {negativesList.length > 0 ? (
                                        <ul className="signal-list">
                                            {negativesList.map((item, i) => (
                                                <li key={i} className="signal bad">
                                                    <i className="fa-solid fa-exclamation" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <div className="all-clear">
                                            <i className="fa-solid fa-shield-halved" /> No significant ATS red flags
                                        </div>
                                    )}
                                </TiltCard>
                            </div>
                        </section>

                        {/* IMPROVEMENTS */}
                        <section className="dash-section glass">
                            <SectionHeader
                                eyebrow="STRATEGIC ROADMAP"
                                title="Recommended Improvements"
                                icon="fa-solid fa-lightbulb"
                                action={
                                    improvementsList.length > 0 ? (
                                        <span className="pill">{improvementsList.length} actions</span>
                                    ) : null
                                }
                            />
                            {improvementsList.length > 0 ? (
                                <div className="rec-list">
                                    {improvementsList.map((rec, i) => (
                                        <RecommendationCard key={i} improvement={rec} index={i} />
                                    ))}
                                </div>
                            ) : (
                                <EmptyState
                                    icon="fa-solid fa-award"
                                    title="No immediate improvements necessary"
                                    message="Your resume satisfies all primary criteria for the target role."
                                />
                            )}
                        </section>
                    </div>
                )}
            </div>
        </>
    );
}