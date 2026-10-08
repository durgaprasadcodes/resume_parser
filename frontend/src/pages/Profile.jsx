import "../styles/profile.css"

function Profile() {
    return (
        <div className="dashboard">

            {/* Navbar */}
            <nav className="navbar">
                <div className="logo">Hirelense.ai</div>

                <div className="nav-links">
                    <a href="/dashboard" className="active">
                        Dashboard
                    </a>
                    <a href="/profile">Profile</a>
                    <button className="logout-btn">
                        Logout
                    </button>
                </div>
            </nav>

            {/* Main Content */}
            <main className="dashboard-content">

                {/* Welcome */}
                <section className="welcome-section">
                    <div>
                        <h1>Welcome back, Rolex 👋</h1>
                        <p>
                            Continue building your skills and career.
                        </p>
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

                {/* Bottom Section */}
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

                            <button className="action-btn primary">
                                <span>📤</span>
                                Upload Resume
                            </button>

                            <button className="action-btn">
                                <span>🔍</span>
                                Analyze Resume
                            </button>

                            <button className="action-btn">
                                <span>👤</span>
                                Edit Profile
                            </button>

                        </div>

                    </div>

                </section>

            </main>

        </div>
    );
}

export default Profile;