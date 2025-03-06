import React from "react";
import background from "../assets/irri_background.webp";
import "./Landing.css";

const Landing = () => {
  return (
    <div className="landing-container">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>Welcome to SNP-MERN</h1>
          <p>Your gateway to advanced genomic research.</p>
          <button className="cta-button">Get Started</button>
        </div>
      </section>

      {/* First Row: 3 Cards */}
      <section className="info-section">
        <div className="card">
          <h2>About IRRI</h2>
          <p>
            The International Rice Research Institute (IRRI) is dedicated to improving rice production
            and food security worldwide.
          </p>
        </div>
        <div className="card">
          <h2>What is SNP-MERN?</h2>
          <p>
            IRRI's SNP-seek reinvented with the MERN stack for a more efficient and user-friendly experience.
          </p>
        </div>
        <div className="card">
          <h2>Why Use SNP-MERN?</h2>
          <p>
            SNP-MERN provides a more efficient and user-friendly experience for advanced genomic research.
          </p>
        </div>
      </section>
    <div className="technology-section">
      <h1>Technology Used</h1>
    </div>
      {/* Second Row: 4 Cards */}
      <section className="info-section">
        <div className="card">
        <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/mongodb/mongodb-plain.svg" />
          <h2>MongoDB</h2>
          <p>
            MongoDB is a NoSQL database that stores data in flexible, JSON-like documents.
          </p>
        </div>
        <div className="card">
        <i className="devicon-express-original" style={{fontSize: "100px"}}></i>
          <h2>ExpressJS</h2>
          <p>
            ExpressJS is a fast, unopinionated, minimalist web framework for Node.js.
          </p>
        </div>
        <div className="card">
        <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original.svg" />
          <h2>ReactJS</h2>
          <p>
            ReactJS is a JavaScript library for building user interfaces.
          </p>
        </div>
        <div className="card">
        <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nodejs/nodejs-plain-wordmark.svg" />
          <h2>NodeJS</h2>
          <p>
            NodeJS is an open-source, cross-platform, back-end JavaScript runtime environment.
          </p>
        </div>
      </section>
    </div>
  );
};

export default Landing;
