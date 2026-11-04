import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import api from "../api/api";
import "../styles/JobDetails.css";

function formatSalary(min, max) {
    if (min == null && max == null) return "Not disclosed";

    const format = (value) => `₹${Number(value).toLocaleString("en-IN")}`;
    if (min != null && max != null) return `${format(min)} - ${format(max)}`;
    return format(min ?? max);
}

function formatDate(date) {
    if (!date) return "Recently posted";

    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) return "Recently posted";

    return parsedDate.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
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
    const selectedJob =
        stateJob && String(stateJob.id) === id ? stateJob : null;
    const currentResult = result?.id === id ? result : null;
    const job = currentResult?.job || selectedJob;
    const loading = !selectedJob && (!currentResult || currentResult.loading);
    const notFound = currentResult?.notFound || false;
    const error = currentResult?.error || "";

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
                    error:
                        requestError.response?.status === 404 ? "" : message,
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

    const companyName = job?.company?.display_name || "Unknown Company";
    const applyUrl = getSafeApplyUrl(job?.redirect_url);
    const jobFacts = [
        { label: "Location", value: job?.location?.display_name || "Not specified" },
        { label: "Employment type", value: job?.contract_type || "Not specified" },
        { label: "Working time", value: job?.contract_time || "Not specified" },
        { label: "Posted", value: formatDate(job?.created) },
    ];

    return (
        <main className="job-details-page">
            <div className="job-details-container">
                <button className="job-back-link" onClick={backToJobs}>
                    <span aria-hidden="true">←</span> Back to Jobs
                </button>

                {loading && (
                    <div className="job-details-state" role="status">
                        <span className="job-details-spinner" aria-hidden="true" />
                        <p>Loading job details...</p>
                    </div>
                )}

                {!loading && notFound && (
                    <div className="job-details-state" role="alert">
                        <h1>Job not found</h1>
                        <p>This job may have expired or is no longer available.</p>
                        <button className="job-primary-button" onClick={backToJobs}>
                            Back to Jobs
                        </button>
                    </div>
                )}

                {!loading && error && (
                    <div className="job-details-state" role="alert">
                        <h1>Unable to load job</h1>
                        <p>{error}</p>
                        <button className="job-primary-button" onClick={backToJobs}>
                            Back to Jobs
                        </button>
                    </div>
                )}

                {!loading && !error && !notFound && job && (
                    <>
                        <div className="job-details-layout">
                            <section className="job-details-main">
                                <header className="job-details-hero">
                                    <div className="job-company-mark" aria-hidden="true">
                                        {companyName.trim().charAt(0).toUpperCase() || "J"}
                                    </div>
                                    <div className="job-details-heading">
                                        <p className="job-company-eyebrow">{companyName}</p>
                                        <h1>{job.title || "Untitled position"}</h1>
                                        <p className="job-location-line">
                                            <span aria-hidden="true">⌖</span>
                                            {job.location?.display_name || "Location not specified"}
                                        </p>
                                    </div>
                                </header>

                                <section className="job-content-card">
                                    <div className="job-section-heading">
                                        <span>THE ROLE</span>
                                        <h2>About this opportunity</h2>
                                    </div>
                                    <div className="job-full-description">
                                        {job.description || "No description is available for this position."}
                                    </div>
                                </section>
                            </section>

                            <aside className="job-details-sidebar">
                                <section className="job-overview-card">
                                    <p className="job-card-eyebrow">COMPENSATION</p>
                                    <h2 className="job-salary">
                                        {formatSalary(job.salary_min, job.salary_max)}
                                    </h2>
                                    <p className="job-salary-caption">Estimated salary range</p>

                                    {applyUrl ? (
                                        <a
                                            className="job-primary-button job-apply-button"
                                            href={applyUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            Apply Now <span aria-hidden="true">↗</span>
                                        </a>
                                    ) : (
                                        <button className="job-primary-button" disabled>
                                            Application link unavailable
                                        </button>
                                    )}

                                    <div className="job-overview-divider" />
                                    <div className="job-section-heading job-overview-heading">
                                        <span>OVERVIEW</span>
                                    </div>
                                    <dl className="job-facts-list">
                                        {jobFacts.map(({ label, value }) => (
                                            <div className="job-fact" key={label}>
                                                <dt>{label}</dt>
                                                <dd>{value}</dd>
                                            </div>
                                        ))}
                                    </dl>
                                </section>
                            </aside>
                        </div>
                    </>
                )}
            </div>
        </main>
    );
}

export default JobDetails;
