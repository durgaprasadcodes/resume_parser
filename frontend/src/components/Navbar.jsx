import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import hirelenseLogo from "../assets/hirelense.png";

function Navbar() {

    const { user, isauthenticated, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    const dropdownRef = useRef(null);


    /* Close dropdown on outside click */
    useEffect(() => {
        function handleClickOutside(e) {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target)
            ) {
                setDropdownOpen(false);
            }
        }

        if (dropdownOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [dropdownOpen]);


    /* Close mobile nav on route change */
    useEffect(() => {
        setMobileOpen(false);
    }, [location.pathname]);


    const isActive = (path) => location.pathname === path;


    const handleLogout = async () => {
        setDropdownOpen(false);
        await logout();
        navigate("/login", { replace: true });
    };


    const goToRoute = (route) => {
        setMobileOpen(false);
        navigate(route)
    };

    /* ---- User icon SVG (fallback when no picture) ---- */
    const UserIcon = () => (
        <svg
            className="nav-profile-icon"
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


    return (
        <>
            <nav className="navbar">

                {/* ---- BRAND ---- */}
                <Link to="/" className="navbar-brand">
                    <span className="navbar-brand-image-wrap">
                        <img src={hirelenseLogo} alt="HireLense" className="navbar-brand-image" />
                    </span>
                </Link>


                {/* ---- DESKTOP NAV LINKS ---- */}
                <div className="navbar-nav">

                    <button
                        type="button"
                        onClick={() => goToRoute("/")}
                        className="nav-link nav-link-btn"
                    >
                        Home
                    </button>

                    <button
                        type="button"
                        onClick={() => goToRoute("/check_ats_score")}
                        className="nav-link nav-link-btn"
                    >
                        Check ATS Score
                    </button>

                    <button
                        type="button"
                        onClick={() => goToRoute("/build_resume")}
                        className="nav-link nav-link-btn"
                    >
                        Build Resume
                    </button>

                    <button
                        type="button"
                        onClick={() => goToRoute("/profile")}
                        className="nav-link nav-link-btn"
                    >
                        Profile
                    </button>

                </div>


                {/* ---- ACTIONS ---- */}
                <div className="navbar-actions">

                    {isauthenticated ? (
                        /* Logged in — show quick analysis button + profile avatar */
                        <>
                            <Link to="/analysis" className="btn-nav-primary">
                                Launch App →
                            </Link>
                            <div className="profile-dropdown-wrapper" ref={dropdownRef}>
                                <button
                                    className="nav-profile-btn"
                                    onClick={() => setDropdownOpen(!dropdownOpen)}
                                    aria-label="Open profile menu"
                                >
                                    {user?.picture ? (
                                        <img
                                            src={user.picture}
                                            alt={user.name || "Profile"}
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                                if (e.currentTarget.nextElementSibling) {
                                                    e.currentTarget.nextElementSibling.style.display = 'flex';
                                                }
                                            }}
                                        />
                                    ) : null}
                                    <div
                                        className="nav-profile-icon-wrapper"
                                        style={{ display: user?.picture ? 'none' : 'flex' }}
                                    >
                                        <UserIcon />
                                    </div>
                                </button>

                                {dropdownOpen && (
                                    <div className="profile-dropdown">

                                        <div className="dropdown-user-info">
                                            <div className="dropdown-user-header">
                                                <div className="dropdown-avatar">
                                                    {user?.picture ? (
                                                        <img
                                                            src={user.picture}
                                                            alt={user.name || "Profile"}
                                                            onError={(e) => {
                                                                e.currentTarget.style.display = 'none';
                                                                if (e.currentTarget.nextElementSibling) {
                                                                    e.currentTarget.nextElementSibling.style.display = 'flex';
                                                                }
                                                            }}
                                                        />
                                                    ) : null}
                                                    <div
                                                        className="dropdown-avatar-fallback"
                                                        style={{ display: user?.picture ? 'none' : 'flex' }}
                                                    >
                                                        <UserIcon />
                                                    </div>
                                                </div>
                                                <div className="dropdown-user-text">
                                                    <div className="user-name">
                                                        {user?.name || "User"}
                                                    </div>
                                                    <div className="user-email">
                                                        {user?.email || ""}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <Link
                                            to="/profile"
                                            className="dropdown-item"
                                            onClick={() => setDropdownOpen(false)}
                                        >
                                            👤 Profile
                                        </Link>

                                        <Link
                                            to="/analysis"
                                            className="dropdown-item"
                                            onClick={() => setDropdownOpen(false)}
                                        >
                                            📄 Analyze Resume
                                        </Link>

                                        <button
                                            className="dropdown-item danger"
                                            onClick={handleLogout}
                                        >
                                            🚪 Sign Out
                                        </button>

                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        /* Not logged in — show Login / Sign Up buttons matching reference */
                        <>
                            <Link to="/login" className="nav-login-link">
                                Login
                            </Link>

                            <Link to="/login" className="nav-signup-pill">
                                Sign Up
                            </Link>
                        </>
                    )}

                    {/* Hamburger for mobile */}
                    <button
                        className="hamburger"
                        onClick={() => setMobileOpen(!mobileOpen)}
                        aria-label="Toggle menu"
                    >
                        <span />
                        <span />
                        <span />
                    </button>

                </div>

            </nav>


            {/* ---- MOBILE NAV ---- */}
            {mobileOpen && (
                <div
                    className="mobile-nav-overlay open"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            <div className={`mobile-nav${mobileOpen ? " open" : ""}`}>

                <button
                    type="button"
                    onClick={() => goToRoute("/")}
                    className="nav-link nav-link-btn"
                >
                    Home
                </button>

                <button
                    type="button"
                    onClick={() => goToRoute("/check_ats_score")}
                    className="nav-link nav-link-btn"
                >
                    Check ATS Score
                </button>

                <button
                    type="button"
                    onClick={() => goToRoute("/build_resume")}
                    className="nav-link nav-link-btn"
                >
                    Build Resume
                </button>

                <button
                    type="button"
                    onClick={() => goToRoute("/profile")}
                    className="nav-link nav-link-btn"
                >
                    Profile
                </button>

                <div className="navbar-actions" style={{ flexDirection: "column", width: "100%", gap: "10px" }}>
                    {isauthenticated ? (
                        <button
                            className="btn btn-danger btn-sm"
                            onClick={handleLogout}
                            style={{ width: "100%" }}
                        >
                            Sign Out
                        </button>
                    ) : (
                        <div style={{ display: "flex", gap: "10px", width: "100%" }}>
                            <Link
                                to="/login"
                                className="nav-login-link"
                                style={{ flex: 1, textAlign: "center", padding: "10px 0" }}
                            >
                                Login
                            </Link>

                            <Link
                                to="/login"
                                className="nav-signup-pill"
                                style={{ flex: 1, textAlign: "center" }}
                            >
                                Sign Up
                            </Link>
                        </div>
                    )}
                </div>

            </div>
        </>
    );
}

export default Navbar;
