import { useRef, useState, useMemo } from "react";
import api from "../api/api";
import { useAuth } from "../auth/AuthContext";
import Navbar from "../components/Navbar";
import uploadResumeImage from "../assets/upload_resume.png";
import AtsScoreCircle from "../components/AtsScoreCircle";
import { showSuccess, showError } from "../lib/toast";
import "../styles/Analysis.css";

// Chart.js imports
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
} from "chart.js";
import { Doughnut, Bar } from "react-chartjs-2";

// Register Chart.js components
ChartJS.register(
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    Title
);

// ============================================================================
// HELPER SUBCOMPONENTS (Clean & modular within Analysis.jsx)
// ============================================================================

function StatCard({ icon, label, value, subtext, accentColor = "default" }) {
    return (
        <div className={`kpi-card kpi-${accentColor}`}>
            <div className="kpi-icon-wrap">
                <i className={icon} aria-hidden="true" />
            </div>
            <div className="kpi-body">
                <span className="kpi-label">{label}</span>
                <span className="kpi-value">{value}</span>
                {subtext && <span className="kpi-subtext">{subtext}</span>}
            </div>
        </div>
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

    let scoreClass = "score-pill-neutral";
    if (score >= 80) scoreClass = "score-pill-success";
    else if (score >= 60) scoreClass = "score-pill-warning";
    else if (score > 0) scoreClass = "score-pill-danger";

    return (
        <div className="project-card">
            <div className="project-card-header">
                <div className="project-title-area">
                    <span className="project-index">#{index + 1}</span>
                    <h4 className="project-name">{data.name || "Untitled Project"}</h4>
                </div>
                <div className={`project-score-badge ${scoreClass}`}>
                    <span className="score-num">{score}</span>
                    <span className="score-total">/100</span>
                </div>
            </div>

            {data.description && (
                <div className="project-card-block">
                    <span className="block-label">Overview & Architecture</span>
                    <p className="block-text">{data.description}</p>
                </div>
            )}

            {data.project_value && (
                <div className="project-card-block project-value-block">
                    <span className="block-label">
                        <i className="fa-solid fa-chart-line" /> Why This Project Matters
                    </span>
                    <p className="block-text">{data.project_value}</p>
                </div>
            )}
        </div>
    );
}

function RecommendationCard({ improvement, index }) {
    const priority = (improvement?.priority || "MEDIUM").toUpperCase();
    let priorityClass = "priority-medium";
    let priorityIcon = "fa-solid fa-triangle-exclamation";

    if (priority === "HIGH") {
        priorityClass = "priority-high";
        priorityIcon = "fa-solid fa-circle-exclamation";
    } else if (priority === "LOW") {
        priorityClass = "priority-low";
        priorityIcon = "fa-solid fa-circle-info";
    }

    return (
        <div className={`recommendation-card ${priorityClass}`}>
            <div className="rec-top-bar">
                <div className="rec-badges">
                    <span className={`rec-priority-tag ${priorityClass}`}>
                        <i className={priorityIcon} /> {priority} PRIORITY
                    </span>
                    {improvement?.area && (
                        <span className="rec-area-tag">
                            <i className="fa-solid fa-folder" /> {improvement.area}
                        </span>
                    )}
                </div>
                <span className="rec-index">Step 0{index + 1}</span>
            </div>

            <div className="rec-body">
                <h4 className="rec-problem">{improvement?.problem || "Identified Opportunity"}</h4>
                {improvement?.reason && (
                    <div className="rec-reason-box">
                        <span className="rec-reason-label">Impact Analysis & Why It Matters:</span>
                        <p className="rec-reason-text">{improvement.reason}</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function EmptyState({ icon = "fa-solid fa-inbox", title, message }) {
    return (
        <div className="dashboard-empty-state">
            <div className="empty-icon-wrap">
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
    const [file, setFile] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [filename, setFilename] = useState("");
    const [filepath, setFilepath] = useState("");
    const [result, setResult] = useState(null);
    const [error, setError] = useState("");

    const fileInputRef = useRef(null);

    // --------------------------------------------------
    // FILE UPLOAD HANDLERS
    // --------------------------------------------------
    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        const droppedFile = e.dataTransfer.files?.[0];

        if (droppedFile && droppedFile.type === "application/pdf") {
            setFile(droppedFile);
            setError("");
        } else {
            setError("Please upload a PDF file.");
            showError("Please upload a PDF file.");
        }
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files?.[0];

        if (selectedFile) {
            if (selectedFile.type === "application/pdf") {
                setFile(selectedFile);
                setError("");
            } else {
                setError("Please upload a PDF file.");
                showError("Please upload a PDF file.");
            }
        }
    };

    const removeFile = () => {
        setFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleReset = () => {
        setResult(null);
        setFile(null);
        setError("");
        setFilename("");
        setFilepath("");
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleDownload = async () => {
        if (!filepath) return;

        setDownloading(true);
        try {
            const response = await fetch(filepath);
            if (!response.ok) {
                throw new Error(`Download failed (${response.status}).`);
            }

            const blob = await response.blob();
            const downloadUrl = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = downloadUrl;
            link.download = filename || "Resume.pdf";
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
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
            const errorMsg = "Your session could not be verified. Please sign in again.";
            setError(errorMsg);
            showError(errorMsg);
            return;
        }

        setError("");
        setUploading(true);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await api.post("/hirelense/upload_resume", formData, {
                params: { user_id: user.id },
            });

            // Supports both JSON string and parsed object formats
            const parsedResult =
                typeof response.data.result === "string"
                    ? JSON.parse(response.data.result)
                    : response.data.result;

            setResult(parsedResult);
            setFilename(response.data.filename || file.name || "Resume.pdf");
            setFilepath(response.data.url);
            showSuccess("Resume analyzed successfully!");
        } catch (err) {
            console.error("Resume analysis error:", err);

            const errorMsg =
                err.response?.data?.detail ||
                err.message ||
                "Analysis failed. Please try again.";

            showError(errorMsg);
            setError(errorMsg);
        } finally {
            setUploading(false);
        }
    };

    // --------------------------------------------------
    // DYNAMIC DERIVED DATA FOR DASHBOARD
    // --------------------------------------------------
    const atsScore = result?.ats_score ?? 0;

    const atsInterpretation = useMemo(() => {
        if (atsScore >= 80) {
            return {
                label: "Excellent Match",
                toneClass: "status-excellent",
                description:
                    "Your resume demonstrates exceptional alignment with target technical roles. Key core competencies, robust project implementations, and professional standards are prominently validated.",
            };
        } else if (atsScore >= 65) {
            return {
                label: "Strong Match",
                toneClass: "status-strong",
                description:
                    "Your resume shows strong foundational alignment with key job requirements. Addressing targeted keyword deficiencies and refining project metrics will elevate it into top candidate pools.",
            };
        } else if (atsScore >= 50) {
            return {
                label: "Moderate Match",
                toneClass: "status-moderate",
                description:
                    "Relevant qualifications were detected, but noticeable gaps exist in required tech stack coverage, quantified project outcomes, or structured experience.",
            };
        }
        return {
            label: "Needs Improvement",
            toneClass: "status-needs-work",
            description:
                "Significant gaps identified against standard ATS parsing benchmarks. Substantial structural reorganization, skill alignment, and project depth enhancements are recommended.",
        };
    }, [atsScore]);

    // KPI Metrics calculation
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

    const projectAverageScore = useMemo(() => {
        if (!projectsList.length) return 0;
        const total = projectsList.reduce((sum, p) => {
            const val = p?.final_score ?? p?.projects?.score ?? 0;
            return sum + val;
        }, 0);
        return Math.round(total / projectsList.length);
    }, [projectsList]);

    const certificationsList = useMemo(
        () => (Array.isArray(result?.certifications?.certificates) ? result.certifications.certificates : []),
        [result]
    );
    const certScore = result?.certifications?.final_score ?? 0;

    const experienceList = useMemo(
        () => (Array.isArray(result?.experience) ? result.experience : []),
        [result]
    );

    const positivesList = useMemo(
        () => (Array.isArray(result?.resume_quality?.positives) ? result.resume_quality.positives : []),
        [result]
    );
    const negativesList = useMemo(
        () => (Array.isArray(result?.resume_quality?.negatives) ? result.resume_quality.negatives : []),
        [result]
    );

    const improvementsList = useMemo(
        () => (Array.isArray(result?.improvements) ? result.improvements : []),
        [result]
    );

    // --------------------------------------------------
    // CHART CONFIGURATIONS (Chart.js)
    // --------------------------------------------------
    const skillsDoughnutData = useMemo(() => {
        const matched = matchedSkills.length;
        const unmatched = unmatchedSkills.length;
        const total = matched + unmatched;

        return {
            labels: ["Matched Skills", "Unmatched Skills"],
            datasets: [
                {
                    data: total === 0 ? [1, 0] : [matched, unmatched],
                    backgroundColor: total === 0 ? ["#e2e8f0", "#cbd5e1"] : ["#16a34a", "#ef4444"],
                    hoverBackgroundColor: total === 0 ? ["#cbd5e1", "#94a3b8"] : ["#15803d", "#dc2626"],
                    borderColor: "#ffffff",
                    borderWidth: 3,
                    hoverOffset: 4,
                },
            ],
        };
    }, [matchedSkills, unmatchedSkills]);

    const skillsDoughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "72%",
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                backgroundColor: "#0f172a",
                titleColor: "#ffffff",
                bodyColor: "#f1f5f9",
                padding: 10,
                cornerRadius: 8,
                callbacks: {
                    label: function (context) {
                        const count = context.raw || 0;
                        const total = matchedSkills.length + unmatchedSkills.length;
                        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                        return ` ${context.label}: ${count} (${pct}%)`;
                    },
                },
            },
        },
    };

    const projectBarData = useMemo(() => {
        const labels = projectsList.map(
            (p, idx) => p?.projects?.name || `Project ${idx + 1}`
        );
        const scores = projectsList.map(
            (p) => p?.final_score ?? p?.projects?.score ?? 0
        );

        return {
            labels,
            datasets: [
                {
                    label: "ATS Project Score",
                    data: scores,
                    backgroundColor: scores.map((s) =>
                        s >= 80 ? "#0284c7" : s >= 65 ? "#0ea5e9" : "#f59e0b"
                    ),
                    borderRadius: 6,
                    borderSkipped: false,
                    maxBarThickness: 42,
                },
            ],
        };
    }, [projectsList]);

    const projectBarOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: true,
                max: 100,
                grid: {
                    color: "#f1f5f9",
                },
                ticks: {
                    stepSize: 20,
                    color: "#64748b",
                    font: { size: 12, family: "'Poppins', sans-serif" },
                },
            },
            x: {
                grid: {
                    display: false,
                },
                ticks: {
                    color: "#334155",
                    font: { size: 12, weight: "500", family: "'Poppins', sans-serif" },
                    callback: function (val) {
                        const lbl = this.getLabelForValue(val);
                        return typeof lbl === "string" && lbl.length > 20
                            ? lbl.substring(0, 18) + "…"
                            : lbl;
                    },
                },
            },
        },
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                backgroundColor: "#0f172a",
                titleColor: "#ffffff",
                bodyColor: "#f1f5f9",
                padding: 10,
                cornerRadius: 8,
                callbacks: {
                    label: (ctx) => ` Score: ${ctx.raw} / 100`,
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
                {!result ? (
                    /* ========================================================
                       UPLOAD SECTION (Preserved exact behavior)
                       ======================================================== */
                    <div className="upload-section">
                        <h1>
                            <i className="fa-solid fa-cloud-arrow-up" /> Upload Your Resume
                        </h1>

                        <p>
                            Upload your resume and let our AI provide a comprehensive ATS breakdown,
                            keyword optimization, and prioritized career recommendations.
                        </p>

                        {/* Dropzone */}
                        <div
                            className={`upload-dropzone${dragActive ? " active" : ""}`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <img
                                className="upload-resume-image"
                                src={uploadResumeImage}
                                alt="Resume upload illustration"
                            />

                            <h3>
                                {dragActive
                                    ? "Drop your resume here"
                                    : "Drag & drop your resume here"}
                            </h3>

                            <p>or click to browse — PDF only, max 10MB</p>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf"
                                onChange={handleFileChange}
                            />
                        </div>

                        {/* Selected file info */}
                        {file && (
                            <div className="file-info">
                                <span>
                                    📄 {file.name} ({(file.size / 1024).toFixed(1)} KB)
                                </span>

                                <button type="button" onClick={removeFile}>
                                    ✕ Remove
                                </button>
                            </div>
                        )}

                        {/* Error */}
                        {error && (
                            <div className="error-message" style={{ marginTop: 16 }}>
                                {error}
                            </div>
                        )}

                        {/* Action buttons */}
                        <div className="upload-actions">
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={handleAnalyze}
                                disabled={!file || uploading}
                            >
                                {uploading ? (
                                    <>
                                        <span className="spinner" />
                                        Analyzing Resume...
                                    </>
                                ) : (
                                    <>
                                        <i className="fa-solid fa-bolt" /> Analyze Resume
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                ) : (
                    /* ========================================================
                       PREMIUM SAAS DASHBOARD (Intelligence Report)
                       ======================================================== */
                    <div className="analysis-dashboard">
                        {/* SECTION A — Analysis Header */}
                        <header className="dashboard-header-card">
                            <div className="header-left">
                                <div className="header-eyebrow">
                                    <span className="eyebrow-pill">RESUME ANALYSIS</span>
                                    <span className="live-indicator">
                                        <span className="live-dot" /> AI Evaluated
                                    </span>
                                </div>
                                <h1 className="header-title">Resume Intelligence Report</h1>
                                <div className="candidate-meta">
                                    <span className="candidate-name">
                                        {result?.name || "Candidate Profile"}
                                    </span>
                                    {result?.profession && (
                                        <>
                                            <span className="meta-separator">•</span>
                                            <span className="candidate-role">
                                                {result.profession}
                                            </span>
                                        </>
                                    )}
                                </div>
                                <div className="file-subtle-tag">
                                    <i className="fa-regular fa-file-pdf" />
                                    <span>{filename || "Resume.pdf"}</span>
                                </div>
                            </div>

                            <div className="header-actions">
                                <button
                                    type="button"
                                    className="btn-dash-action btn-dash-secondary"
                                    onClick={handleReset}
                                    title="Upload and evaluate another resume"
                                >
                                    <i className="fa-solid fa-arrow-left" />
                                    <span>Analyze Another Resume</span>
                                </button>

                                <button
                                    type="button"
                                    className="btn-dash-action btn-dash-ghost"
                                    onClick={() => window.print()}
                                    title="Print or export as PDF report"
                                >
                                    <i className="fa-solid fa-arrow-up-right-from-square" />
                                    <span>Export Report</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDownload}
                                    disabled={!filepath || downloading}
                                    style={{
                                        display: filepath ? "flex" : "none",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        padding: "8px 16px",
                                        background: "#007bff", // Your button color
                                        color: "#fff",
                                        border: "none",
                                        borderRadius: "4px",
                                        cursor: downloading ? "wait" : "pointer",
                                        opacity: downloading ? 0.7 : 1,
                                    }}
                                >
                                    {downloading ? "Downloading..." : "Download File"}
                                </button>
                            </div>
                        </header>

                        {/* SECTION B — ATS Score Hero Section */}
                        <section className="dashboard-hero-section">
                            <div className="hero-score-wrapper">
                                <AtsScoreCircle
                                    score={atsScore}
                                    size={190}
                                    strokeWidth={18}
                                />
                            </div>

                            <div className="hero-details">
                                <div className="hero-status-row">
                                    <span className="hero-category-label">
                                        OVERALL EVALUATION
                                    </span>
                                    <span className={`hero-match-badge ${atsInterpretation.toneClass}`}>
                                        <i className="fa-solid fa-circle-check" />{" "}
                                        {atsInterpretation.label}
                                    </span>
                                </div>

                                <h2 className="hero-score-heading">
                                    ATS Compatibility Score
                                </h2>

                                <div className="hero-score-display">
                                    <span className="hero-score-big">{atsScore}</span>
                                    <span className="hero-score-denom">/ 100</span>
                                </div>

                                <p className="hero-explanation">
                                    {atsInterpretation.description}
                                </p>
                            </div>
                        </section>

                        {/* SECTION C — KPI Cards */}
                        <section className="dashboard-kpi-grid">
                            <StatCard
                                icon="fa-solid fa-bullseye"
                                label="ATS Score"
                                value={`${atsScore}/100`}
                                subtext={atsInterpretation.label}
                                accentColor="primary"
                            />
                            <StatCard
                                icon="fa-solid fa-chart-pie"
                                label="Skill Match"
                                value={`${skillScore}%`}
                                subtext={`${matchedSkills.length} Matched • ${unmatchedSkills.length} Missing`}
                                accentColor="success"
                            />
                            <StatCard
                                icon="fa-solid fa-code"
                                label="Project Score"
                                value={projectsList.length > 0 ? `${projectAverageScore}/100` : "N/A"}
                                subtext={`${projectsList.length} Technical Projects`}
                                accentColor="accent"
                            />
                            <StatCard
                                icon="fa-solid fa-certificate"
                                label="Certifications"
                                value={certificationsList.length}
                                subtext={certScore > 0 ? `Rating: ${certScore}/100` : "Verified credentials"}
                                accentColor="warning"
                            />
                            <StatCard
                                icon="fa-solid fa-briefcase"
                                label="Experience"
                                value={experienceList.length}
                                subtext={experienceList.length > 0 ? "Track record" : "None detected"}
                                accentColor="neutral"
                            />
                        </section>

                        {/* SECTION D — Skills Match Analysis (Doughnut Chart + Skills Tags) */}
                        <section className="dashboard-section skills-analysis-section">
                            <SectionHeader
                                eyebrow="COMPETENCY BENCHMARK"
                                title="Skills Match Analysis"
                                icon="fa-solid fa-microchip"
                                action={
                                    <span className="section-pill-tag">
                                        {matchedSkills.length} of {matchedSkills.length + unmatchedSkills.length} Found
                                    </span>
                                }
                            />

                            <div className="skills-grid-layout">
                                {/* Left Chart Column */}
                                <div className="skills-chart-box">
                                    <div className="skills-doughnut-container">
                                        <Doughnut data={skillsDoughnutData} options={skillsDoughnutOptions} />
                                        <div className="chart-center-metric">
                                            <span className="metric-number">{skillScore}%</span>
                                            <span className="metric-label">Match</span>
                                        </div>
                                    </div>

                                    <div className="skills-chart-legend">
                                        <div className="legend-item">
                                            <span className="legend-dot dot-matched" />
                                            <span className="legend-name">Matched Skills</span>
                                            <span className="legend-count">{matchedSkills.length}</span>
                                        </div>
                                        <div className="legend-item">
                                            <span className="legend-dot dot-unmatched" />
                                            <span className="legend-name">Unmatched Skills</span>
                                            <span className="legend-count">{unmatchedSkills.length}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Lists Column */}
                                <div className="skills-lists-box">
                                    {/* Matched Skills */}
                                    <div className="skill-group-container">
                                        <div className="group-heading matched-heading">
                                            <i className="fa-solid fa-circle-check" />
                                            <span>Matched Skills ({matchedSkills.length})</span>
                                        </div>
                                        {matchedSkills.length > 0 ? (
                                            <div className="skills-tag-wrap">
                                                {matchedSkills.map((skill, idx) => (
                                                    <span key={idx} className="skill-badge skill-matched">
                                                        <i className="fa-solid fa-check" /> {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="no-items-text">No explicitly matched skills detected.</p>
                                        )}
                                    </div>

                                    {/* Unmatched Skills */}
                                    <div className="skill-group-container">
                                        <div className="group-heading unmatched-heading">
                                            <i className="fa-solid fa-circle-exclamation" />
                                            <span>Unmatched / Missing Skills ({unmatchedSkills.length})</span>
                                        </div>
                                        {unmatchedSkills.length > 0 ? (
                                            <div className="skills-tag-wrap">
                                                {unmatchedSkills.map((skill, idx) => (
                                                    <span key={idx} className="skill-badge skill-unmatched">
                                                        <i className="fa-solid fa-xmark" /> {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="all-skills-matched-pill">
                                                <i className="fa-solid fa-circle-check" />
                                                <span>✓ No missing skills detected — Excellent keyword alignment!</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* SECTION E — Projects Analysis — BAR CHART */}
                        <section className="dashboard-section project-performance-section">
                            <SectionHeader
                                eyebrow="PORTFOLIO RIGOR"
                                title="Project Performance"
                                icon="fa-solid fa-chart-column"
                                action={
                                    <span className="section-pill-tag">
                                        Avg Score: {projectAverageScore}/100
                                    </span>
                                }
                            />

                            {projectsList.length > 0 ? (
                                <div className="project-chart-card">
                                    <div className="project-bar-chart-container">
                                        <Bar data={projectBarData} options={projectBarOptions} />
                                    </div>
                                </div>
                            ) : (
                                <EmptyState
                                    icon="fa-solid fa-laptop-code"
                                    title="No projects detected"
                                    message="No project sections were parsed from this resume. Adding quantified technical projects significantly enhances ATS scoring."
                                />
                            )}
                        </section>

                        {/* SECTION F — Project Cards */}
                        {projectsList.length > 0 && (
                            <section className="dashboard-section project-cards-section">
                                <SectionHeader
                                    eyebrow="DETAILED REPOSITORIES"
                                    title="Project Breakdown"
                                    icon="fa-solid fa-layer-group"
                                />

                                <div className="projects-grid">
                                    {projectsList.map((project, idx) => (
                                        <ProjectCard key={idx} project={project} index={idx} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* SECTION G — Professional Summary */}
                        <section className="dashboard-section summary-section">
                            <SectionHeader
                                eyebrow="EXECUTIVE PROFILE"
                                title="Professional Summary"
                                icon="fa-solid fa-user-tie"
                            />

                            <div className="summary-content-card">
                                {result?.summary ? (
                                    <p className="summary-paragraph">{result.summary}</p>
                                ) : (
                                    <EmptyState
                                        icon="fa-solid fa-align-left"
                                        title="No summary section found"
                                        message="A concise professional summary highlighting your specialization and career trajectory is strongly recommended."
                                    />
                                )}
                            </div>
                        </section>

                        {/* SECTION H — Certifications */}
                        <section className="dashboard-section certifications-section">
                            <SectionHeader
                                eyebrow="CREDENTIALS & BADGES"
                                title="Certifications"
                                icon="fa-solid fa-certificate"
                                action={
                                    certScore > 0 ? (
                                        <span className="section-pill-tag">
                                            Score: {certScore}/100
                                        </span>
                                    ) : null
                                }
                            />

                            <div className="certifications-content-card">
                                {certificationsList.length > 0 ? (
                                    <div className="certifications-grid">
                                        {certificationsList.map((cert, idx) => (
                                            <div key={idx} className="certification-item">
                                                <div className="cert-icon-wrap">
                                                    <i className="fa-solid fa-award" />
                                                </div>
                                                <span className="cert-text">{cert}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <EmptyState
                                        icon="fa-solid fa-award"
                                        title="No certifications detected"
                                        message="Adding industry-recognized credentials (AWS, Google Cloud, OCI, Scrum) can boost ATS ranking."
                                    />
                                )}
                            </div>
                        </section>

                        {/* SECTION I — Experience */}
                        <section className="dashboard-section experience-section">
                            <SectionHeader
                                eyebrow="CAREER HISTORY"
                                title="Professional Experience"
                                icon="fa-solid fa-briefcase"
                            />

                            <div className="experience-content-card">
                                {experienceList.length > 0 ? (
                                    <div className="experience-list">
                                        {experienceList.map((exp, idx) => (
                                            <div key={idx} className="experience-item">
                                                <div className="exp-marker">
                                                    <i className="fa-solid fa-building" />
                                                </div>
                                                <div className="exp-details">
                                                    <h4 className="exp-role">
                                                        {exp?.role || exp?.title || "Role"}
                                                    </h4>
                                                    <div className="exp-company-row">
                                                        <span className="exp-company">
                                                            {exp?.company || "Company"}
                                                        </span>
                                                        {exp?.duration && (
                                                            <>
                                                                <span className="meta-separator">•</span>
                                                                <span className="exp-duration">
                                                                    {exp.duration}
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                    {exp?.description && (
                                                        <p className="exp-desc">{exp.description}</p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <EmptyState
                                        icon="fa-solid fa-briefcase"
                                        title="No professional experience detected"
                                        message="This resume emphasizes academic foundations, certifications, and technical projects over corporate work experience."
                                    />
                                )}
                            </div>
                        </section>

                        {/* SECTION J — Resume Quality Analysis (Two-Column) */}
                        <section className="dashboard-section quality-section">
                            <SectionHeader
                                eyebrow="ATS AUDIT & SIGNAL ANALYSIS"
                                title="Resume Quality Analysis"
                                icon="fa-solid fa-scale-balanced"
                            />

                            <div className="quality-two-column-grid">
                                {/* Left Column: Positive Signals */}
                                <div className="quality-card quality-positives">
                                    <div className="quality-card-header">
                                        <div className="quality-header-icon positive-icon">
                                            <i className="fa-solid fa-circle-check" />
                                        </div>
                                        <div>
                                            <h4 className="quality-title">What Your Resume Does Well</h4>
                                            <span className="quality-subtitle">
                                                Strong signals detected by parsing algorithms
                                            </span>
                                        </div>
                                    </div>

                                    {positivesList.length > 0 ? (
                                        <ul className="signal-list">
                                            {positivesList.map((item, idx) => (
                                                <li key={idx} className="signal-item signal-positive">
                                                    <i className="fa-solid fa-check" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="no-items-text">No specific positive signals highlighted.</p>
                                    )}
                                </div>

                                {/* Right Column: Potential Concerns */}
                                <div className="quality-card quality-negatives">
                                    <div className="quality-card-header">
                                        <div className="quality-header-icon negative-icon">
                                            <i className="fa-solid fa-triangle-exclamation" />
                                        </div>
                                        <div>
                                            <h4 className="quality-title">Potential Concerns</h4>
                                            <span className="quality-subtitle">
                                                Red flags that could filter out your application
                                            </span>
                                        </div>
                                    </div>

                                    {negativesList.length > 0 ? (
                                        <ul className="signal-list">
                                            {negativesList.map((item, idx) => (
                                                <li key={idx} className="signal-item signal-negative">
                                                    <i className="fa-solid fa-exclamation" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <div className="all-clean-pill">
                                            <i className="fa-solid fa-shield-halved" />
                                            <span>✓ No significant ATS red flags detected in your resume structure.</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>

                        {/* SECTION K — Improvement Recommendations */}
                        <section className="dashboard-section improvements-section">
                            <SectionHeader
                                eyebrow="STRATEGIC ROADMAP"
                                title="Recommended Improvements"
                                icon="fa-solid fa-lightbulb"
                                action={
                                    improvementsList.length > 0 ? (
                                        <span className="section-pill-tag">
                                            {improvementsList.length} Action Items
                                        </span>
                                    ) : null
                                }
                            />

                            {improvementsList.length > 0 ? (
                                <div className="improvements-grid">
                                    {improvementsList.map((rec, idx) => (
                                        <RecommendationCard
                                            key={idx}
                                            improvement={rec}
                                            index={idx}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <EmptyState
                                    icon="fa-solid fa-award"
                                    title="No immediate improvements necessary"
                                    message="Your resume satisfies all primary criteria for target role criteria."
                                />
                            )}
                        </section>
                    </div>
                )}
            </div>
        </>
    );
}
