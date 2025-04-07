import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
// Assuming Font Awesome icons are set up, or use react-icons
import { FaDna, FaHome, FaInfoCircle, FaSearch, FaSignInAlt, FaUserPlus, FaBars, FaTimes, FaProjectDiagram, FaChartLine } from 'react-icons/fa';
import "./Header.css"; // Adjust path if necessary

const Header = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const location = useLocation();
    const headerRef = useRef(null); // Ref for the header element

    // Scroll detection effect
    useEffect(() => {
        const handleScroll = () => {
            // Check if scrolled more than a small threshold (e.g., 10px)
            setIsScrolled(window.scrollY > 10);
        };

        window.addEventListener("scroll", handleScroll, { passive: true }); // Use passive listener
        // Initial check in case page loads scrolled
        handleScroll();

        // Cleanup listener
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Close mobile menu on route change effect
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [location]);

    // Toggle mobile menu and body class for scroll lock
    const toggleMobileMenu = () => {
        setMobileMenuOpen(prev => {
            const isOpen = !prev;
            if (isOpen) {
                document.body.classList.add('no-scroll'); // Prevent body scroll when menu is open
            } else {
                document.body.classList.remove('no-scroll');
            }
            return isOpen;
        });
    };

    return (
        // Use ref for potential height calculations if needed later
        <header ref={headerRef} className={`header ${isScrolled ? "scrolled" : ""} ${mobileMenuOpen ? "mobile-menu-active" : ""}`}>
            <div className="header-container">
                {/* Logo */}
                <div className="logo-container">
                    <Link to="/" className="logo" aria-label="Homepage">
                        {/* Use react-icons component */}
                        <FaDna className="logo-icon" />
                        <span className="logo-text">SNP-MERN</span> {/* Example Name */}
                    </Link>
                </div>

                {/* Navigation */}
                <nav className={`nav-menu ${mobileMenuOpen ? "mobile-open" : ""}`} id="navigation-menu" aria-label="Main navigation">
                    {/* Main Links */}
                    <ul className="nav-links">
                        <li> {/* Added class directly to li for simpler CSS */}
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
                             {/* Link to the Gene Loci search page */}
                            <Link to="/gene-loci-search" className={location.pathname === "/gene-loci-search" ? "active" : ""}>
                                <FaSearch /><span>Gene Search</span>
                            </Link>
                        </li>
                        <li>
                             {/* Link to the Pipeline page */}
                            <Link to="/pipeline" className={location.pathname === "/pipeline" ? "active" : ""}>
                                <FaProjectDiagram /><span>Pipeline</span>
                            </Link>
                        </li>
                         <li>
                             {/* Link to the QC Metrics page */}
                             <Link to="/qc-metrics" className={location.pathname === "/qc-metrics" ? "active" : ""}>
                                <FaChartLine /><span>QC Metrics</span>
                            </Link>
                        </li>
                        {/* Add other main navigation links here */}
                    </ul>

                    {/* Authentication Links/Buttons (Separated for distinct styling) */}
                    <div className="nav-auth-links">
                         {/* Example: Conditionally show Login/Register or User Profile/Logout */}
                         {/* For now, showing both based on original code */}
                        <Link to="/login" className={`nav-button login-btn ${location.pathname === "/login" ? "active" : ""}`}>
                            <FaSignInAlt /><span>Login</span>
                        </Link>
                        <Link to="/register" className={`nav-button register-btn ${location.pathname === "/register" ? "active" : ""}`}>
                            <FaUserPlus /><span>Register</span>
                        </Link>
                    </div>
                </nav>

                {/* Mobile Menu Toggle Button */}
                <button
                    className="mobile-menu-toggle"
                    onClick={toggleMobileMenu}
                    aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
                    aria-expanded={mobileMenuOpen}
                    aria-controls="navigation-menu" // Controls the nav element
                >
                    {mobileMenuOpen ? <FaTimes /> : <FaBars />}
                </button>
            </div>
        </header>
    );
};

export default Header;