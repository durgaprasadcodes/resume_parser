import { useAuth } from "../auth/AuthContext";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";


function Profile() {

    const { user } = useAuth();


    return (
        <>
            <Navbar />

            <div className="page-container dashboard-page">

                {/* Welcome */}
                <section className="welcome-section">
                    <h1>
                        Welcome back, {user?.name || "User"} 👋
                    </h1>
                    <p>
                        Continue building your skills and career
                        with HireLense.ai.
                    </p>
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