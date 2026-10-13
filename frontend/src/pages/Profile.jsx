import { useAuth } from "../auth/AuthContext";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";


/* ---- Default User icon SVG (fallback when no picture) ---- */
const UserIcon = () => (
    <svg
        className="profile-fallback-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
    </svg>
);


function Profile() {

    const { user } = useAuth();


    return (
        <>
            <Navbar />

            <div className="page-container dashboard-page">

                {/* Welcome */}
                <section className="welcome-section profile-hero-card">
                    <div className="profile-hero-content">
                        <div className="profile-avatar-large">
                            {user?.picture ? (
                                <img
                                    src={user.picture}
                                    alt={user.name || "User"}
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        if (e.currentTarget.nextElementSibling) {
                                            e.currentTarget.nextElementSibling.style.display = 'flex';
                                        }
                                    }}
                                />
                            ) : null}
                            <div
                                className="profile-avatar-icon-wrapper"
                                style={{ display: user?.picture ? 'none' : 'flex' }}
                            >
                                <UserIcon />
                            </div>
                        </div>

                        <div className="profile-hero-info">
                            <div className="profile-name-row">
                                <h1>
                                    Welcome back, {user?.name || "User"} 👋
                                </h1>
                                {user?.is_verified && (
                                    <span className="profile-verified-badge" title="Verified Account">
                                        ✓ Verified
                                    </span>
                                )}
                            </div>
                            <p className="profile-hero-email">
                                {user?.email}
                            </p>
                            <p className="profile-hero-sub">
                                Continue building your skills and career with HireLense.ai.
                            </p>
                        </div>
                    </div>
                </section>


                {/* Stats */}
                <section className="stats-grid">

                    <div className="stat-card">
                        <span className="stat-label">
                            Resumes
                        </span>
                        <h2>04</h2>
                        <p>Uploaded</p>
                    </div>

                    <div className="stat-card">
                        <span className="stat-label">
                            Applications
                        </span>
                        <h2>12</h2>
                        <p>Tracked</p>
                    </div>

                    <div className="stat-card">
                        <span className="stat-label">
                            Skills
                        </span>
                        <h2>08</h2>
                        <p>Identified</p>
                    </div>

                    <div className="stat-card">
                        <span className="stat-label">
                            Profile
                        </span>
                        <h2>85%</h2>
                        <p>Complete</p>
                    </div>

                </section>


                {/* Bottom Grid */}
                <section className="dashboard-grid">

                    {/* Recent Activity */}
                    <div className="panel">

                        <div className="panel-header">
                            <h2>Recent Activity</h2>
                            <span>View all</span>
                        </div>

                        <div className="activity">

                            <div className="activity-item">
                                <div className="activity-icon">
                                    📄
                                </div>
                                <div>
                                    <h3>Resume analyzed</h3>
                                    <p>Today, 10:30 AM</p>
                                </div>
                            </div>

                            <div className="activity-item">
                                <div className="activity-icon">
                                    🎯
                                </div>
                                <div>
                                    <h3>Skills extracted</h3>
                                    <p>Yesterday, 6:20 PM</p>
                                </div>
                            </div>

                            <div className="activity-item">
                                <div className="activity-icon">
                                    👤
                                </div>
                                <div>
                                    <h3>Profile updated</h3>
                                    <p>2 days ago</p>
                                </div>
                            </div>

                        </div>

                    </div>


                    {/* Quick Actions */}
                    <div className="panel">

                        <div className="panel-header">
                            <h2>Quick Actions</h2>
                        </div>

                        <div className="actions">

                            <Link to="/analysis" className="action-btn primary">
                                <span>📤</span>
                                Upload & Analyze Resume
                            </Link>

                            <Link to="/analysis" className="action-btn">
                                <span>🔍</span>
                                View Past Analyses
                            </Link>

                            <button className="action-btn">
                                <span>👤</span>
                                Edit Profile
                            </button>

                        </div>

                    </div>

                </section>

            </div>
        </>
    );
}

export default Profile;