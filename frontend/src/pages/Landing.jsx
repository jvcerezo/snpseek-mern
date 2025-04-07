import React from "react";
import { useNavigate } from "react-router-dom"; // For CTA button navigation
// Import used icons from react-icons
import { FaDna, FaChartLine, FaInfoCircle, FaUniversity, FaCogs, FaArrowRight } from "react-icons/fa";
// Import DevIcons if desired (or keep using img tags) - Example import
// import { DiMongodb, DiNodejsSmall, DiReact, DiGithubBadge } from 'react-icons/di'; // Example using react-icons for tech stack
// import { SiExpress } from 'react-icons/si'; // Example using react-icons for tech stack

import "./Landing.css"; // Adjust path if necessary

const Landing = () => {
    const navigate = useNavigate();

    const handleGetStarted = () => {
        // Navigate to the registration page or dashboard/login
        navigate('/register');
    };

    return (
        <div className="landing-container">
            {/* Hero Section */}
            <section className="hero">
                 {/* Background is handled by CSS */}
                <div className="hero-overlay"></div> {/* Overlay for contrast */}
                <div className="hero-content">
                    <h1>
                        <FaDna className="hero-icon" />
                        Welcome to SNP-MERN {/* Updated Name */}
                    </h1>
                    <p className="hero-subtitle">Your Modern Gateway to Advanced Genomic Research</p>
                    <button className="cta-button primary-btn" onClick={handleGetStarted}> {/* Use themed button class */}
                        Get Started
                        <FaArrowRight className="btn-icon" style={{ marginLeft: '8px' }}/> {/* Style icon within button */}
                    </button>
                </div>
            </section>

            {/* Content Wrapper for sections below hero */}
            <div className="landing-content-wrapper">

                {/* Info Cards Section */}
                <section className="info-section landing-section">
                    <h2 className="section-title">
                        <FaInfoCircle className="section-icon" /> About the Platform
                    </h2>
                    <div className="cards-grid info-cards"> {/* Use common grid class */}
                        <div className="styled-card info-card"> {/* Use common card class */}
                             <div className="card-icon-wrapper">
                                <FaUniversity className="card-icon" />
                             </div>
                             <h3>About IRRI</h3>
                             <p>
                                The International Rice Research Institute (IRRI) is dedicated to abolishing poverty and hunger among people and populations that depend on rice-based agri-food systems.
                             </p>
                         </div>
                        <div className="styled-card info-card">
                             <div className="card-icon-wrapper">
                                <FaDna className="card-icon" />
                            </div>
                             <h3>What is SNP-MERN?</h3>
                             <p>
                                 An enhanced genomic data platform inspired by IRRI's SNP-seek, rebuilt with the modern MERN stack for improved performance and user experience.
                             </p>
                         </div>
                         <div className="styled-card info-card">
                             <div className="card-icon-wrapper">
                                <FaChartLine className="card-icon" />
                             </div>
                             <h3>Why Use SNP-MERN?</h3>
                             <p>
                                 Leverage advanced analytics, an intuitive interface, and powerful search capabilities tailored for today's genomic researchers.
                             </p>
                         </div>
                     </div>
                </section>

                {/* Technology Section */}
                <section className="technology-section landing-section">
                    <h2 className="section-title">
                        <FaCogs className="section-icon" /> Technology Stack
                    </h2>
                    <div className="cards-grid tech-cards"> {/* Use common grid class */}
                        {/* Using img tags as before, styled by CSS */}
                        <div className="styled-card tech-card">
                             <div className="tech-logo">
                                <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/mongodb/mongodb-original-wordmark.svg" alt="MongoDB Logo" />
                             </div>
                             <h3>MongoDB</h3>
                             <p>Flexible NoSQL database storing complex genomic data efficiently.</p>
                         </div>
                         <div className="styled-card tech-card">
                             <div className="tech-logo">
                                 <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/express/express-original-wordmark.svg" alt="ExpressJS Logo" style={{ filter: 'invert(1)' }}/> {/* Invert for dark bg if needed */}
                             </div>
                             <h3>Express.js</h3>
                             <p>Minimalist backend framework powering our robust API endpoints.</p>
                         </div>
                         <div className="styled-card tech-card">
                            <div className="tech-logo">
                                <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original-wordmark.svg" alt="React Logo" />
                             </div>
                             <h3>React.js</h3>
                             <p>Component-based frontend library for interactive user interfaces.</p>
                         </div>
                         <div className="styled-card tech-card">
                             <div className="tech-logo">
                                <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nodejs/nodejs-original-wordmark.svg" alt="NodeJS Logo" />
                            </div>
                             <h3>Node.js</h3>
                             <p>JavaScript runtime enabling fast, scalable server-side applications.</p>
                         </div>
                     </div>
                </section>

                 {/* Optional: Add Footer here */}

            </div> {/* End landing-content-wrapper */}
        </div> // End landing-container
    );
};

export default Landing;