import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
// Import icons
import { FaDna, FaHome, FaInfoCircle, FaSearch, FaSignInAlt, FaUserPlus, FaBars, FaTimes, FaProjectDiagram, FaChartLine, FaSignOutAlt, FaUserCircle } from 'react-icons/fa';
// Import auth context hook
import { useAuth } from "../context/AuthContext"; // Adjust path if necessary
import "./Header.css"; // Adjust path if necessary

const Header = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const location = useLocation();
    const headerRef = useRef(null);
    const navigate = useNavigate();

    // Use the authentication context, including the isIframe value
    const { isAuthenticated, user, logout, isIframe } = useAuth();

    // Scroll detection effect
    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 10);
        window.addEventListener("scroll", handleScroll, { passive: true });
        handleScroll();
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Close mobile menu on route change effect
    useEffect(() => {
        setMobileMenuOpen(false);
        document.body.classList.remove('no-scroll');
    }, [location]);

    // Toggle mobile menu
    const toggleMobileMenu = () => {
        setMobileMenuOpen(prev => {
            const isOpen = !prev;
            document.body.classList.toggle('no-scroll', isOpen);
            return isOpen;
        });
    };

    // Handle Logout Click
    const handleLogout = () => {
        logout();
        setMobileMenuOpen(false);
        document.body.classList.remove('no-scroll');
        navigate('/');
        console.log("User logged out.");
    };

    // Tooltip message for disabled links
    const disabledLinkMessage = "You have to be logged in to continue";

    return (
        !isIframe && ( // Conditionally render based on the isIframe context value
            <header ref={headerRef} className={`header ${isScrolled ? "scrolled" : ""} ${mobileMenuOpen ? "mobile-menu-active" : ""}`}>
                <div className="header-container">
                    {/* Logo */}
                    <div className="logo-container">
                        <Link to="/" className="logo" aria-label="Homepage">
                            <FaDna className="logo-icon" />
                            <span className="logo-text">SNP-MERN</span>
                        </Link>
                    </div>

                    {/* Navigation */}
                    <nav className={`nav-menu ${mobileMenuOpen ? "mobile-open" : ""}`} id="navigation-menu" aria-label="Main navigation">
                        {/* Main Links */}
                        <ul className="nav-links">
                            <li>
                                <Link to="/" className={location.pathname === "/" ? "active" : ""}>
                                    <FaHome /><span>Home</span>
                                </Link>
                            </li>
                            <li>
                                <Link to="/about" className={location.pathname === "/about" ? "active" : ""}>
                                    <FaInfoCircle /><span>About</span>
                                </Link>
                            </li>
                            <li>
                                {/* Dashboard might also need protection? Assuming public for now */}
                                <Link to="/dashboard" className={location.pathname === "/dashboard" ? "active" : ""}>
                                    <FaSearch /><span>Dashboard</span>
                                </Link>
                            </li>
                        </ul>

                        {/* Authentication Links/Buttons */}
                        <div className="nav-auth-links">
                            {isAuthenticated ? (
                                <>
                                    <span className="user-greeting">
                                        <FaUserCircle className="user-icon"/> Hello, {user?.firstName + " " + user?.lastName || 'User'}!
                                    </span>
                                    <button onClick={handleLogout} className="nav-button logout-btn">
                                        <FaSignOutAlt /><span>Logout</span>
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link to="/login" className={`nav-button login-btn ${location.pathname === "/login" ? "active" : ""}`}>
                                        <FaSignInAlt /><span>Login</span>
                                    </Link>
                                    <Link to="/register" className={`nav-button register-btn ${location.pathname === "/register" ? "active" : ""}`}>
                                        <FaUserPlus /><span>Register</span>
                                    </Link>
                                </>
                            )}
                        </div>
                    </nav>

                    {/* Mobile Menu Toggle Button */}
                    <button
                        className="mobile-menu-toggle"
                        onClick={toggleMobileMenu}
                        aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
                        aria-expanded={mobileMenuOpen}
                        aria-controls="navigation-menu"
                    >
                        {mobileMenuOpen ? <FaTimes /> : <FaBars />}
                    </button>
                </div>
            </header>
        )
    );
};

export default Header;