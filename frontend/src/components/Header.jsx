import React from "react";
import { Link } from "react-router-dom";
import "./Header.css"; // Make sure to create this file for styling

const Header = () => {
  return (
    <header className="header">
      <div className="logo">SNP-MERN</div>
      <nav>
        <ul className="nav-links">
          <li><Link to="/">Home</Link></li>
          <li><Link to="/about">About</Link></li>
          <li><Link to="/login">Login</Link></li>
          <li><Link to="/register">Register</Link></li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;
