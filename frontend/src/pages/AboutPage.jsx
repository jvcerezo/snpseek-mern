import React from 'react';
// Import icons needed for this page
import { FaInfoCircle, FaCode, FaUserTie, FaUsers, FaUserGraduate, FaLinkedin, FaGithub, FaGlobe } from 'react-icons/fa'; // Added more icons
import './AboutPage.css'; // Adjust path if necessary

// Placeholder image component/style (or use actual img tags if URLs available)
const ProfilePlaceholder = () => <div className="profile-picture-placeholder"><FaUserTie /></div>; // Example placeholder

const AboutPage = () => {
    return (
        <div className="page-container about-page-container"> {/* Use common container */}

            {/* Page Header */}
            <header className="page-header about-header">
                <h1><FaInfoCircle className="header-icon" /> About SNP-MERN</h1>
            </header>

            {/* Introduction Section */}
            <section className="about-intro-section styled-card"> {/* Style intro like a card */}
                <h2 className="section-title">
                    <FaCode className="section-icon" /> What is SNP-MERN?
                </h2>
                <p>
                    SNP-MERN represents a significant modernization of the International Rice Research Institute's (IRRI) SNP-seek platform.
                    Leveraging the power and flexibility of the MERN stack (MongoDB, Express.js, React.js, Node.js), SNP-MERN provides a faster,
                    more intuitive, and feature-rich environment for genomic researchers studying rice varieties.
                </p>
                <p>
                    Our goal is to accelerate research by offering powerful data querying, seamless analysis pipeline integration (coming soon!),
                    and clear visualizations, ultimately contributing to IRRI's mission of improving rice production and global food security.
                </p>
            </section>

            {/* Team Section */}
            <section className="team-section">
                <h2 className="section-title">
                    <FaUsers className="section-icon" /> Meet the Team
                </h2>

                {/* Developer Subsection */}
                <div className="team-subsection">
                    <h3>The Developer</h3>
                    <div className="team-grid developer-grid">
                        <div className="styled-card profile-card">
                            <div className="profile-picture">
                                <ProfilePlaceholder />
                                {/* <img src="/path/to/jet-photo.jpg" alt="Jet Timothy V. Cerezo" /> */}
                            </div>
                            <h4 className="profile-name">Jet Timothy V. Cerezo</h4>
                            <p className="profile-role">SNP-MERN Developer | BS Computer Science Student</p>
                            <p className="profile-bio">
                                Responsible for the full-stack development, design, and implementation of the SNP-MERN platform as part of my Special Problem.
                                Passionate about leveraging technology for scientific advancement.
                                {/* Add more placeholder bio info */}
                            </p>
                            <div className="profile-links">
                                <a href="#" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><FaLinkedin /></a>
                                <a href="#" target="_blank" rel="noopener noreferrer" aria-label="GitHub"><FaGithub /></a>
                                <a href="#" target="_blank" rel="noopener noreferrer" aria-label="Portfolio"><FaGlobe /></a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Adviser Subsection */}
                <div className="team-subsection">
                    <h3>Project Adviser</h3>
                     <div className="team-grid adviser-grid">
                        <div className="styled-card profile-card">
                             <div className="profile-picture">
                                <ProfilePlaceholder />
                                {/* <img src="/path/to/arian-photo.jpg" alt="Arian J. Jacildo" /> */}
                            </div>
                            <h4 className="profile-name">Arian J. Jacildo</h4>
                            <p className="profile-role">Adviser - UPLB ICS Professor</p>
                             <p className="profile-bio">
                                 Providing guidance and expertise throughout the development lifecycle of the SNP-MERN project.
                                 {/* Add more placeholder info */}
                             </p>
                             <div className="profile-links">
                                 <a href="#" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><FaLinkedin /></a>
                                 {/* Add other relevant links like university profile */}
                                 <a href="#" target="_blank" rel="noopener noreferrer" aria-label="University Profile"><FaUserGraduate /></a>
                            </div>
                         </div>
                     </div>
                </div>

                {/* Team Members Subsection */}
                 <div className="team-subsection">
                     <h3>Development Team Members</h3>
                    <div className="team-grid">
                         <div className="styled-card profile-card">
                            <div className="profile-picture">
                                <ProfilePlaceholder />
                                {/* <img src="/path/to/raffy-photo.jpg" alt="Raffy" /> */}
                            </div>
                             <h4 className="profile-name">Raffy</h4>
                             <p className="profile-role">PHG Pipeline Developer | BS Computer Science Student</p>
                             <p className="profile-bio">
                                 Developer of the PHG pipeline, focusing on backend logic and data processing.
                             </p>
                             <div className="profile-links">
                                 <a href="#" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><FaLinkedin /></a>
                                 <a href="#" target="_blank" rel="noopener noreferrer" aria-label="GitHub"><FaGithub /></a>
                             </div>
                         </div>

                          <div className="styled-card profile-card">
                            <div className="profile-picture">
                                <ProfilePlaceholder />
                                {/* <img src="/path/to/jr-photo.jpg" alt="JR" /> */}
                            </div>
                            <h4 className="profile-name">JR Despi</h4>
                             <p className="profile-role">PHG Visualization Developer | BS Computer Science Student</p>
                             <p className="profile-bio">
                                Developer of the PHG visualization tool, enhancing user experience and data representation.
                             </p>
                             <div className="profile-links">
                                 <a href="#" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><FaLinkedin /></a>
                                 <a href="#" target="_blank" rel="noopener noreferrer" aria-label="GitHub"><FaGithub /></a>
                             </div>
                         </div>

                          <div className="styled-card profile-card">
                             <div className="profile-picture">
                                <ProfilePlaceholder />
                                {/* <img src="/path/to/jp-photo.jpg" alt="JP" /> */}
                            </div>
                            <h4 className="profile-name">JP Deloso</h4>
                             <p className="profile-role">SNP-Spring Developer | BS Computer Science Student</p>
                             <p className="profile-bio">
                                Developer of SNP-Spring, a java-based counterpart of the SNP-MERN platform, focusing on backend logic and data processing.
                             </p>
                            <div className="profile-links">
                                 <a href="#" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><FaLinkedin /></a>
                                 <a href="#" target="_blank" rel="noopener noreferrer" aria-label="GitHub"><FaGithub /></a>
                             </div>
                         </div>
                     </div>
                </div>
            </section>

        </div> // End page-container
    );
};

export default AboutPage;