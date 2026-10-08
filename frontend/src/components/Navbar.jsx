import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";


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
                    Hirelense<span className="brand-dot">.ai</span>
                </Link>


                {/* ---- DESKTOP NAV LINKS ---- */}
                <div className="navbar-nav">

                    <Link
                        to="/"
                        className={`nav-link${isActive("/") ? " active" : ""}`}
                    >
                        Home
                    </Link>

                    <Link
                        to="/analysis"
                        className={`nav-link${isActive("/analysis") ? " active" : ""}`}
                    >
                        Resume
                    </Link>

                    <Link
                        to="/profile"
                        className={`nav-link${isActive("/profile") ? " active" : ""}`}
                    >
                        Profile
                    </Link>

                </div>


                {/* ---- ACTIONS ---- */}
                <div className="navbar-actions">

                    {isauthenticated ? (
                        /* Logged in — show profile avatar with dropdown */
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
                                    />
                                ) : (
                                    <UserIcon />
                                )}
                            </button>

                            {dropdownOpen && (
                                <div className="profile-dropdown">

                                    <div className="dropdown-user-info">
                                        <div className="user-name">
                                            {user?.name || "User"}
                                        </div>
                                        <div className="user-email">
                                            {user?.email || ""}
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
                    ) : (
                        /* Not logged in — show Login / Sign Up buttons */
                        <>
                            <Link to="/login" className="btn btn-ghost btn-sm">
                                Log In
                            </Link>

                            <Link to="/login" className="btn btn-primary btn-sm">
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

                <Link
                    to="/"
                    className={`nav-link${isActive("/") ? " active" : ""}`}
                >
                    Home
                </Link>

                <Link
                    to="/analysis"
                    className={`nav-link${isActive("/analysis") ? " active" : ""}`}
                >
                    Resume
                </Link>

                <Link
                    to="/profile"
                    className={`nav-link${isActive("/profile") ? " active" : ""}`}
                >
                    Profile
                </Link>

                <div className="navbar-actions">
                    {isauthenticated ? (
                        <button
                            className="btn btn-danger btn-sm"
                            onClick={handleLogout}
                            style={{ width: "100%" }}
                        >
                            Sign Out
                        </button>
                    ) : (
                        <>
                            <Link
                                to="/login"
                                className="btn btn-ghost btn-sm"
                                style={{ flex: 1, textAlign: "center" }}
                            >
                                Log In
                            </Link>

                            <Link
                                to="/login"
                                className="btn btn-primary btn-sm"
                                style={{ flex: 1, textAlign: "center" }}
                            >
                                Sign Up
                            </Link>
                        </>
                    )}
                </div>

            </div>
        </>
    );
}

export default Navbar;
