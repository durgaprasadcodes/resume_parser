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

            </div>
        </>
    );
}

export default Profile;