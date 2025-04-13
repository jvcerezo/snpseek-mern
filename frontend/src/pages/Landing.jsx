import React from "react";
import { useNavigate, Link } from "react-router-dom";
// Import icons needed
import {
    FaDna, FaInfoCircle, FaCogs, FaArrowRight, FaStar, FaDatabase, FaBookOpen,
    FaExternalLinkAlt, FaGithub, FaLinkedin, FaProjectDiagram, FaSearch, FaBolt, FaUsers,
    FaUserPlus, // Keep for Register button
    FaUserCheck, // For Benefits icon
    FaList, FaChartLine, FaDownload, FaUserSecret // Added icons
} from "react-icons/fa";
// Dev Icons (optional - using img tags below for simplicity)
// import { DiMongodb, DiNodejsSmall, DiReact, DiGithubBadge } from 'react-icons/di';
// import { SiExpress } from 'react-icons/si';

import "./Landing.css"; // Shared CSS file

const Landing = () => {
    const navigate = useNavigate();

    // Navigate to Register page
    const handleRegisterNow = () => {
        navigate('/register');
    };

    // Navigate to dashboard or search page for guest access
    const handleGuestContinue = () => {
        // Navigate to the main search or dashboard page accessible to guests
        // Choose '/dashboard' or '/genotype-search' or similar
        navigate('/dashboard'); // Example: Navigate to dashboard
    };

    return (
        <div className="landing-container">
            {/* --- Hero Section --- */}
            <section className="hero">
                <div className="hero-content animate-fade-in-up">
                    <h1><FaDna className="hero-icon" /> Welcome to SNP-MERN</h1>
                    <p className="hero-subtitle">Your Modern Gateway to Advanced Genomic Research</p>
                    <div className="hero-buttons">
                        {/* Changed "Get Started" to "Register Now" */}
                        <button className="cta-button primary-btn" onClick={handleRegisterNow}>
                            Register Now <FaUserPlus className="btn-icon" style={{ marginLeft: '8px' }}/>
                        </button>
                        {/* Added "Continue as Guest" button */}
                        <button className="secondary-btn guest-btn" onClick={handleGuestContinue}>
                            Continue as Guest <FaUserSecret className="btn-icon" style={{ marginLeft: '8px' }}/>
                        </button>
                    </div>
                </div>
            </section>

            {/* --- Content Wrapper for sections below hero --- */}
            <div className="landing-content-wrapper">

                {/* Section 1: Introduction (What & Why) */}
                <section id="introduction" className="landing-section text-section">
                     <h2 className="section-title">
                         <FaInfoCircle className="section-icon" /> Platform Introduction
                     </h2>
                     <div className="intro-columns">
                         <div>
                             <h3>What is SNP-MERN?</h3>
                             <p>
                                 SNP-MERN is a high-performance web application designed for genomic researchers, particularly those working with rice data from institutions like IRRI. It modernizes traditional SNP analysis workflows by leveraging the MERN stack (MongoDB, Express.js, React.js, Node.js) to deliver a faster, more intuitive, and scalable experience compared to platforms like SNP-seek.
                             </p>
                         </div>
                          <div>
                             <h3>Why Use SNP-MERN?</h3>
                             <p>
                                 Gain access to powerful search capabilities across vast genomic datasets. Utilize integrated analysis tools (coming soon!) and benefit from a user-friendly interface designed to accelerate your research discovery process. SNP-App aims to streamline data exploration and analysis for the modern genomics era.
                             </p>
                         </div>
                     </div>
                 </section>

                {/* Section 2: Key Features */}
                <section className="landing-section features-section">
                     <h2 className="section-title">
                         <FaStar className="section-icon" /> Key Features
                     </h2>
                     <div className="features-grid">
                         <div className="feature-item">
                            <FaSearch className="feature-icon" />
                            <h4>Advanced Search</h4>
                            <p>Query genotypes, phenotypes, gene loci, and varieties with flexible filtering options.</p>
                         </div>
                         <div className="feature-item">
                              <FaProjectDiagram className="feature-icon" />
                              <h4>Analysis Pipelines</h4>
                              <p>Execute pre-defined or custom bioinformatics workflows directly within the platform (under development).</p>
                         </div>
                         <div className="feature-item">
                              <FaBolt className="feature-icon" />
                              <h4>Performance</h4>
                              <p>Built with modern web technologies for a fast, responsive, and scalable user experience.</p>
                         </div>
                          <div className="feature-item">
                              <FaUsers className="feature-icon" />
                              <h4>User Management</h4>
                              <p>Secure registration and login for managing projects and accessing resources.</p>
                          </div>
                     </div>
                 </section>

                 {/* --- ADDED Section: Account Benefits --- */}
                 <section id="account-benefits" className="landing-section benefits-section text-section alternate-bg">
                    <h2 className="section-title">
                        <FaUserCheck className="section-icon" /> Account Benefits
                    </h2>
                    <p style={{ textAlign: 'center', marginBottom: '2rem', color: 'var(--text-secondary)'}}>
                        Create a free account to unlock additional features and personalize your research experience:
                    </p>
                    <ul className="benefits-list">
                        <li className="benefit-item">
                            <FaList className="benefit-icon" />
                            <div>
                                <h4>Personalized Lists</h4>
                                <p>Save lists of genes, SNPs, or varieties for future reference and analysis.</p>
                            </div>
                        </li>
                        <li className="benefit-item">
                             <div className="benefit-icon-group"> {/* Group pipeline/qc icons */}
                                <FaProjectDiagram />
                                <FaChartLine />
                             </div>
                            <div>
                                <h4>Access to Pipeline & QC Metrics</h4>
                                <p>Run analysis workflows and view detailed Quality Control metrics (requires login).</p>
                            </div>
                        </li>
                        <li className="benefit-item">
                            <FaDownload className="benefit-icon" />
                            <div>
                                <h4>Downloadable Results</h4>
                                <p>Download your search results and analysis outputs in convenient formats like CSV.</p>
                            </div>
                        </li>
                    </ul>
                     <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                         <button className="primary-btn" onClick={handleRegisterNow}>
                             Create Your Account <FaArrowRight className="btn-icon" style={{ marginLeft: '8px' }}/>
                         </button>
                     </div>
                 </section>
                 {/* --- END Account Benefits Section --- */}

                {/* Section 4: Data Sources */}
                <section className="landing-section data-section text-section">
                      <h2 className="section-title"> <FaDatabase className="section-icon" /> Data Sources </h2>
                      <p>
                           SNP-MERN integrates valuable genomic datasets relevant to rice research, including variations derived from the 3,000 Rice Genomes Project (3k RGP) and potentially other curated public or private datasets from IRRI and collaborators. Explore millions of SNPs across thousands of rice varieties.
                      </p>
                  </section>

                {/* Section 5: Technology Stack */}
                <section className="landing-section technology-section alternate-bg">
                    <h2 className="section-title"> <FaCogs className="section-icon" /> Technology Stack </h2>
                    <div className="technology-list">
                         <div className="technology-item"> <div className="tech-logo"> <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/mongodb/mongodb-original.svg" alt="MongoDB Logo" /> </div> <h4>MongoDB</h4> </div>
                         <div className="technology-item"> <div className="tech-logo"> <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/express/express-original.svg" alt="ExpressJS Logo" style={{ filter: 'invert(1)' }}/> </div> <h4>Express.js</h4> </div>
                         <div className="technology-item"> <div className="tech-logo"> <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original.svg" alt="React Logo" /> </div> <h4>React.js</h4> </div>
                         <div className="technology-item"> <div className="tech-logo"> <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nodejs/nodejs-original.svg" alt="NodeJS Logo" /> </div> <h4>Node.js</h4> </div>
                    </div>
                     <p className="tech-stack-summary"> Built entirely with the MERN stack for a robust, full-stack JavaScript experience. </p>
                 </section>

                 {/* Section 6: Getting Started */}
                 <section className="landing-section getting-started-section text-section">
                     <h2 className="section-title"> <FaBookOpen className="section-icon" /> Getting Started </h2>
                     <p>Ready to dive in? Follow these simple steps:</p>
                     <ol className="getting-started-steps">
                         <li><Link to="/register" className="themed-link">Create an Account</Link> or <button onClick={handleGuestContinue} className="link-button">Continue as Guest</button>.</li>
                         <li>Explore the available datasets using our powerful <Link to="/dashboard" className="themed-link">Search Tools</Link>.</li>
                         <li>Check out the <Link to="/pipeline" className="themed-link">Analysis Pipeline</Link> & <Link to="/qc-metrics" className="themed-link">QC Metrics</Link> pages (login required).</li>
                     </ol>
                 </section>

            </div> {/* End landing-content-wrapper */}

            {/* --- Footer --- */}
            <footer className="landing-footer">
                <div className="footer-content">
                    <p>&copy; {new Date().getFullYear()} SNP-MERN | Developed by Jet Timothy V. Cerezo | Data Powered by IRRI</p>
                    <div className="footer-links">
                        <a href="https://www.irri.org" target="_blank" rel="noopener noreferrer">IRRI Official <FaExternalLinkAlt size="0.8em"/></a>
                        <Link to="/about">About</Link>
                        {/* Add your actual GitHub repo link here */}
                        <a href="#" target="_blank" rel="noopener noreferrer"><FaGithub /> GitHub</a>
                    </div>
                </div>
            </footer>

        </div> // End landing-container
    );
};

// Simple button styled like a link
const LinkButton = ({ onClick, children }) => (
    <button onClick={onClick} className="link-button">
        {children}
    </button>
);


export default Landing;