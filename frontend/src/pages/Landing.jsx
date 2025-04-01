import React from "react";
import { FaDna, FaChartLine,} from "react-icons/fa";
import "./Landing.css";

const Landing = () => {
  return (
    <div className="landing-container">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1>
            <FaDna className="hero-icon" />
            Welcome to SNP-MERN
          </h1>
          <p className="hero-subtitle">Your gateway to advanced genomic research</p>
          <button className="cta-button">
            Get Started <i className="fas fa-arrow-right"></i>
          </button>
        </div>
      </section>

      {/* Info Cards Section */}
      <div className="content-wrapper">
        {/* First Row: 3 Cards */}
        <section className="info-section">
          <h2 className="section-title">
            <i className="fas fa-info-circle"></i> About the Platform
          </h2>
          <div className="cards-container">
            <div className="card">
              <div className="card-icon">
                <i className="fas fa-university"></i>
              </div>
              <h3>About IRRI</h3>
              <p>
                The International Rice Research Institute (IRRI) is dedicated to improving rice production
                and food security worldwide through advanced genomic research.
              </p>
            </div>
            <div className="card">
              <div className="card-icon">
                <FaDna />
              </div>
              <h3>What is SNP-MERN?</h3>
              <p>
                IRRI's SNP-seek reinvented with the MERN stack for a more efficient and user-friendly 
                genomic research experience.
              </p>
            </div>
            <div className="card">
              <div className="card-icon">
                <FaChartLine />
              </div>
              <h3>Why Use SNP-MERN?</h3>
              <p>
                Advanced analytics, intuitive interface, and powerful search capabilities designed 
                specifically for genomic researchers.
              </p>
            </div>
          </div>
        </section>

        {/* Technology Section */}
        <section className="technology-section">
          <h2 className="section-title">
            <i className="fas fa-cogs"></i> Technology Stack
          </h2>
          <div className="cards-container">
            <div className="tech-card">
              <div className="tech-logo">
                <img 
                  src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/mongodb/mongodb-original-wordmark.svg" 
                  alt="MongoDB" 
                />
              </div>
              <h3>MongoDB</h3>
              <p>
                Flexible NoSQL database that stores genomic data in JSON-like documents
                for efficient querying and scalability.
              </p>
            </div>
            <div className="tech-card">
              <div className="tech-logo">
                <img 
                  src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/express/express-original-wordmark.svg" 
                  alt="ExpressJS" 
                />
              </div>
              <h3>ExpressJS</h3>
              <p>
                Fast, unopinionated backend framework that powers our robust API for
                genomic data processing and analysis.
              </p>
            </div>
            <div className="tech-card">
              <div className="tech-logo">
                <img 
                  src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original-wordmark.svg" 
                  alt="ReactJS" 
                />
              </div>
              <h3>ReactJS</h3>
              <p>
                Powerful frontend library that enables our interactive, real-time
                genomic data visualization interface.
              </p>
            </div>
            <div className="tech-card">
              <div className="tech-logo">
                <img 
                  src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nodejs/nodejs-original-wordmark.svg" 
                  alt="NodeJS" 
                />
              </div>
              <h3>NodeJS</h3>
              <p>
                JavaScript runtime that serves as the foundation for our high-performance
                genomic research platform.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Landing;