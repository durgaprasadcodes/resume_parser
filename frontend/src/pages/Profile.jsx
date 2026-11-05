import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import api from "../api/api";
import Navbar from "../components/Navbar";
import { showError, showSuccess } from "../lib/toast";
import "../styles/profile.css";

const PAGE_SIZE = 5;

const formatDate = (value) => {
    if (!value) return "Date unavailable";
    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? "Date unavailable"
        : date.toLocaleDateString(undefined, {
              year: "numeric",
              month: "long",
              day: "numeric",
          });
};

const UserIcon = () => (
    <svg
        className="profile-fallback-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
    >
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
    </svg>
);

function Profile() {
    const { user, updateUser } = useAuth();
    const [memberSince, setMemberSince] = useState(null);
    const [resumes, setResumes] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalResumes, setTotalResumes] = useState(0);
    const [loadingResumes, setLoadingResumes] = useState(true);
    const [resumeError, setResumeError] = useState("");
    const [editing, setEditing] = useState(false);
    const [name, setName] = useState(user?.name || "");
    const [savingProfile, setSavingProfile] = useState(false);

    useEffect(() => {
        let isCurrent = true;

        const loadResumes = async () => {
            setLoadingResumes(true);
            setResumeError("");
            try {
                const response = await api.get("/hirelense/get_resumes", {
                    params: { page, page_size: PAGE_SIZE },
                });
                if (!isCurrent) return;

                setMemberSince(response.data.member_since);
                setResumes(response.data.resumes || []);
                setTotalResumes(response.data.total_resumes || 0);
                setTotalPages(response.data.total_pages || 1);
            } catch (error) {
                if (!isCurrent) return;
                console.error("Could not load uploaded resumes:", error);
                const message =
                    error.response?.data?.detail || "Could not load your uploaded resumes.";
                setResumeError(message);
                setResumes([]);
            } finally {
                if (isCurrent) setLoadingResumes(false);
            }
        };

        loadResumes();
        return () => {
            isCurrent = false;
        };
    }, [page]);

    const handleProfileSave = async (event) => {
        event.preventDefault();
        const trimmedName = name.trim();
        if (!trimmedName) {
            showError("Name cannot be empty.");
            return;
        }

        setSavingProfile(true);
        try {
            const response = await api.patch("/auth/profile", { name: trimmedName });
            updateUser(response.data);
            setName(response.data.name);
            setEditing(false);
            showSuccess("Profile updated.");
        } catch (error) {
            console.error("Could not update profile:", error);
            showError(error.response?.data?.detail || "Could not update your profile.");
        } finally {
            setSavingProfile(false);
        }
    };

    const cancelEditing = () => {
        setName(user?.name || "");
        setEditing(false);
    };

    return (
        <>
            <Navbar />

            <main className="page-container dashboard-page profile-page">
                <header className="profile-page-heading">
                    <span className="profile-eyebrow">YOUR ACCOUNT</span>
                    <h1>Account Settings</h1>
                    <p>Manage your personal information and account preferences.</p>
                </header>

                <section className="profile-hero-card" aria-label="Account information">
                    <div className="profile-hero-content">
                        <div className="profile-avatar-large">
                            {user?.picture ? (
                                <img
                                    src={user.picture}
                                    alt=""
                                    onError={(event) => {
                                        event.currentTarget.style.display = "none";
                                        event.currentTarget.nextElementSibling.style.display = "flex";
                                    }}
                                />
                            ) : null}
                            <div
                                className="profile-avatar-icon-wrapper"
                                style={{ display: user?.picture ? "none" : "flex" }}
                            >
                                <UserIcon />
                            </div>
                        </div>

                        <div className="profile-hero-info">
                            {editing ? (
                                <form className="profile-edit-form" onSubmit={handleProfileSave}>
                                    <label htmlFor="profile-name">Name</label>
                                    <input
                                        id="profile-name"
                                        value={name}
                                        onChange={(event) => setName(event.target.value)}
                                        maxLength={100}
                                        autoComplete="name"
                                        required
                                    />
                                    <div className="profile-actions">
                                        <button
                                            className="profile-button profile-button-primary"
                                            type="submit"
                                            disabled={savingProfile}
                                        >
                                            {savingProfile ? "Saving…" : "Save changes"}
                                        </button>
                                        <button
                                            className="profile-button profile-button-secondary"
                                            type="button"
                                            onClick={cancelEditing}
                                            disabled={savingProfile}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <>
                                    <div className="profile-name-row">
                                        <h2>{user?.name || "User"}</h2>
                                        {user?.is_verified && (
                                            <span className="profile-verified-badge">
                                                <i className="fa-solid fa-check" aria-hidden="true" />
                                                Verified
                                            </span>
                                        )}
                                    </div>
                                    <p className="profile-hero-email">{user?.email}</p>
                                    <p className="profile-member-since">
                                        Member since {formatDate(memberSince)}
                                    </p>
                                    <div className="profile-actions">
                                        <button
                                            className="profile-button profile-button-primary"
                                            type="button"
                                            onClick={() => setEditing(true)}
                                        >
                                            <i className="fa-solid fa-pen" aria-hidden="true" />
                                            Edit Profile
                                        </button>
                                        <Link
                                            className="profile-button profile-button-secondary"
                                            to="/reset-password"
                                        >
                                            <i className="fa-solid fa-lock" aria-hidden="true" />
                                            Change Password
                                        </Link>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </section>

                <section className="resume-panel" aria-labelledby="resume-list-title">
                    <div className="resume-panel-header">
                        <div>
                            <span className="profile-eyebrow">YOUR DOCUMENTS</span>
                            <h2 id="resume-list-title">Uploaded Resumes</h2>
                        </div>
                        <span className="resume-count">
                            {totalResumes} {totalResumes === 1 ? "resume" : "resumes"}
                        </span>
                    </div>

                    {loadingResumes ? (
                        <p className="resume-state" role="status">Loading resumes…</p>
                    ) : resumeError ? (
                        <p className="resume-state resume-state-error" role="alert">
                            {resumeError}
                        </p>
                    ) : resumes.length ? (
                        <ul className="resume-list">
                            {resumes.map((resume) => (
                                <li className="resume-list-item" key={resume.id}>
                                    <span className="resume-file-icon" aria-hidden="true">
                                        <i className="fa-regular fa-file-pdf" />
                                    </span>
                                    <span className="resume-file-name" title={resume.resume_name}>
                                        {resume.resume_name}
                                    </span>
                                    <time
                                        className="resume-upload-date"
                                        dateTime={resume.uploaded_at || undefined}
                                    >
                                        Uploaded {formatDate(resume.uploaded_at)}
                                    </time>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="resume-state">
                            No resumes uploaded yet. Analyze a resume to see it listed here.
                        </p>
                    )}

                    {totalPages > 1 && (
                        <nav className="resume-pagination" aria-label="Resume list pagination">
                            <button
                                className="profile-button profile-button-secondary"
                                type="button"
                                onClick={() => setPage((current) => Math.max(1, current - 1))}
                                disabled={page <= 1 || loadingResumes}
                            >
                                <i className="fa-solid fa-chevron-left" aria-hidden="true" />
                                Previous
                            </button>
                            <span aria-live="polite">
                                Page {page} of {totalPages}
                            </span>
                            <button
                                className="profile-button profile-button-secondary"
                                type="button"
                                onClick={() =>
                                    setPage((current) => Math.min(totalPages, current + 1))
                                }
                                disabled={page >= totalPages || loadingResumes}
                            >
                                Next
                                <i className="fa-solid fa-chevron-right" aria-hidden="true" />
                            </button>
                        </nav>
                    )}
                </section>
            </main>
        </>
    );
}

export default Profile;
