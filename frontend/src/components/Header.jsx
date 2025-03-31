import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import "./Header.css";

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false); // Close mobile menu when route changes
  }, [location]);

  return (
    <header className={`header ${isScrolled ? "scrolled" : ""}`}>
      <div className="header-container">
        <div className="logo-container">
          <Link to="/" className="logo">
            <i className="fas fa-dna logo-icon"></i>
            <span>SNP-MERN</span>
          </Link>
        </div>

        <nav className={`nav-links-container ${mobileMenuOpen ? "mobile-open" : ""}`}>
          <ul className="nav-links">
            <li className={location.pathname === "/" ? "active" : ""}>
              <Link to="/">
                <i className="fas fa-home"></i>
                <span>Home</span>
              </Link>
            </li>
            <li className={location.pathname === "/about" ? "active" : ""}>
              <Link to="/about">
                <i className="fas fa-info-circle"></i>
                <span>About</span>
              </Link>
            </li>
            <li className={location.pathname === "/genes" ? "active" : ""}>
              <Link to="/genes">
                <i className="fas fa-search"></i>
                <span>Gene Search</span>
              </Link>
            </li>
            <li className={location.pathname === "/login" ? "active" : ""}>
              <Link to="/login" className="login-btn">
                <i className="fas fa-sign-in-alt"></i>
                <span>Login</span>
              </Link>
            </li>
            <li className={location.pathname === "/register" ? "active" : ""}>
              <Link to="/register" className="register-btn">
                <i className="fas fa-user-plus"></i>
                <span>Register</span>
              </Link>
            </li>
          </ul>
        </nav>

        <button 
          className="mobile-menu-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? (
            <i className="fas fa-times"></i>
          ) : (
            <i className="fas fa-bars"></i>
          )}
        </button>
      </div>
    </header>
  );
};

export default Header;