import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api/api";
import "../styles/Jobs.css";

const categories = [
    { label: "Software Engineering", value: "software_engineering" },
    { label: "Backend Engineering", value: "backend_engineering" },
    { label: "Frontend Development", value: "frontend_web" },
    { label: "Full Stack", value: "full_stack" },
    { label: "AI / ML", value: "ai" },
    { label: "Internships", value: "internships" },
];

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

    const formatSalary = (min, max) => {
        if (min == null && max == null) return "Not disclosed";

        const format = (value) => `₹${Number(value).toLocaleString("en-IN")}`;

        if (min != null && max != null) {
            return `${format(min)} - ${format(max)}`;
        }

        return format(min ?? max);
    };

    const formatDate = (date) => {
        if (!date) return "Recently posted";

        const parsedDate = new Date(date);
        if (Number.isNaN(parsedDate.getTime())) return "Recently posted";

        return parsedDate.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    };

    return (
        <div className="jobs-page">
            <header className="jobs-header">
                <div>
                    <h1>Find Your Next Opportunity</h1>
                    <p>Discover the latest jobs and internships.</p>
                </div>

                <div className="jobs-header-actions">
                    <button
                        className="refresh-btn"
                        onClick={refreshJobs}
                        disabled={loading}
                    >
                        ↻ Refresh Jobs
                    </button>
                    <button
                        className="refresh-btn"
                        onClick={() => navigate("/")}
                    >
                        Back To Home
                    </button>
                </div>
            </header>

            <section className="category-section">
                <h2>Explore Categories</h2>

                <div className="category-list">
                    {categories.map((item) => (
                        <button
                            key={item.value}
                            className={
                                category === item.value
                                    ? "category-btn active"
                                    : "category-btn"
                            }
                            onClick={() => setCategory(item.value)}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            </section>

            <section className="jobs-section">
                <div className="jobs-title">
                    <div style={{ marginBottom: 20 }}>
                        <h2>Available Opportunities</h2>
                        <p>
                            {loading
                                ? "Searching for opportunities..."
                                : `${jobs.length} jobs found`}
                        </p>
                    </div>
                </div>

                {loading && (
                    <div className="loading">
                        <div className="spinner"></div>
                        <p>Fetching latest jobs...</p>
                    </div>
                )}

                {error && !loading && (
                    <div className="error-message">
                        {error}
                        <button onClick={refreshJobs}>Try Again</button>
                    </div>
                )}

                {!loading && !error && jobs.length === 0 && (
                    <div className="empty-state">
                        <h3>No jobs found</h3>
                        <p>Try selecting another category.</p>
                    </div>
                )}

                {!loading && !error && jobs.length > 0 && (
                    <div className="jobs-grid">
                        {jobs.map((job) => (
                            <article
                                className="job-card"
                                key={job.id}
                                role="link"
                                tabIndex={job.id == null ? undefined : 0}
                                aria-disabled={job.id == null}
                                aria-label={
                                    job.title
                                        ? `View details for ${job.title}`
                                        : "View job details"
                                }
                                onClick={(event) => handleJobCardClick(event, job)}
                                onKeyDown={(event) => handleJobCardKeyDown(event, job)}
                            >

                                <h3>{job.title} </h3>

                                <p className="company-name">
                                    {job.company?.display_name || "Unknown Company"}
                                </p>

                                <div className="job-details">
                                    <span>
                                        <i className="fa-solid fa-location-dot" style={{ marginRight: 5 }}></i> {job.location?.display_name || "India"}
                                    </span>
                                    <span>
                                        <i className="fa-solid fa-indian-rupee-sign" style={{ marginRight: 5 }}></i> {formatSalary(job.salary_min, job.salary_max)}
                                    </span>
                                    {job.contract_type && (
                                        <span><i className="fa-solid fa-briefcase" style={{ marginRight: 5 }}></i> {job.contract_type}</span>
                                    )}
                                    {job.contract_time && (
                                        <span><i className="fa-solid fa-clock" style={{ marginRight: 5 }}></i> {job.contract_time}</span>
                                    )}
                                </div>

                                <p className="job-description">
                                    {job.description || "No description available."}
                                </p>

                                {job.redirect_url && (
                                    <div className="job-card-footer">
                                        <a
                                            href={job.redirect_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="apply-btn"
                                        >
                                            Apply Now ↗
                                        </a>
                                    </div>
                                )}
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}

export default Jobs;
