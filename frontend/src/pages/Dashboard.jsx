import React from "react"; // Ensure React is imported
import { useNavigate } from "react-router-dom"; // Use hook for navigation
import { FaTachometerAlt, FaClipboardList, FaSeedling, FaChartLine, FaSearch, FaFlask, FaProjectDiagram, FaDna } from "react-icons/fa";
import { useAuth } from "../context/AuthContext"; // Import useAuth hook to check login status
import "./Dashboard.css"; // Adjust path if necessary

const Dashboard = () => {
    const navigate = useNavigate(); // Hook for navigation
    const { isAuthenticated } = useAuth(); // Get authentication status from context

    // Placeholder data (replace with actual data fetching later)
    const stats = {
        datasets: 1,
        varieties: 3024,
        snps: "20M+",
        visits: 18,
    };

    const recentActivities = [
        { id: 1, icon: <FaSearch />, text: "Genotype search performed for 'OsGene1'", time: "2 hours ago" },
        { id: 2, icon: <FaProjectDiagram />, text: "Pipeline step 'Align Assemblies' completed", time: "5 hours ago" },
        { id: 3, icon: <FaClipboardList />, text: "New dataset 'Maize HapMap V3' added", time: "1 day ago" },
        { id: 4, icon: <FaChartLine />, text: "QC Metrics generated for 'Wheat Project'", time: "3 days ago" },
    ];

    // Navigate handler for buttons
    const handleNavigate = (path) => {
        navigate(path);
    };

    // Tooltip message for disabled actions
    const disabledActionMessage = "You have to be logged in to continue";

    return (
        // Layout container class
        <div className="dashboard-container">
            {/* Main content area */}
            <div className="main-content-full">
                {/* Header within main content */}
                <header className="dashboard-header">
                    <div className="header-title-group">
                        <h1>
                            <FaTachometerAlt className="header-icon" />
                            Dashboard
                        </h1>
                        <p className="welcome-message">Welcome back! Overview of your genomic data portal.</p>
                    </div>
                </header>

                {/* Quick Actions */}
                <section className="dashboard-section quick-actions">
                     <h2 className="section-title visually-hidden">Quick Actions</h2> {/* Added hidden title for semantics */}
                     <div className="actions-grid">
                          {/* These buttons are assumed to be always enabled */}
                          <button className="action-btn" onClick={() => handleNavigate("/search-genotype")}>
                              <FaSearch className="btn-icon" /><span>Search by Genotype</span>
                          </button>
                           <button className="action-btn" onClick={() => handleNavigate("/search-variety")}>
                               <FaSeedling className="btn-icon" /><span>Search by Variety</span>
                           </button>
                           <button className="action-btn" onClick={() => handleNavigate("/search-gene-loci")}>
                               <FaFlask className="btn-icon" /><span>Search by Gene Loci</span>
                           </button>

                           {/* Analysis Pipeline Button - Conditional disabling */}
                           <button
                                className="action-btn"
                                onClick={() => handleNavigate("/pipeline")}
                                disabled={!isAuthenticated} // Disable if not logged in
                                title={!isAuthenticated ? disabledActionMessage : undefined} // Add title if disabled
                           >
                               <FaProjectDiagram className="btn-icon" /><span>Analysis Pipeline</span>
                           </button>

                           {/* View QC Metrics Button - Conditional disabling */}
                            <button
                                className="action-btn"
                                onClick={() => handleNavigate("/qc-metrics")}
                                disabled={!isAuthenticated} // Disable if not logged in
                                title={!isAuthenticated ? disabledActionMessage : undefined} // Add title if disabled
                            >
                                <FaChartLine className="btn-icon" /><span>View QC Metrics</span>
                            </button>
                     </div>
                </section>

                {/* Statistics Cards */}
                <section className="dashboard-section stats-section">
                     <h2 className="section-title visually-hidden">Statistics</h2> {/* Added hidden title */}
                     <div className="stats-container">
                          <div className="stat-card">
                              <div className="stat-content">
                                  <span className="stat-label">DATASETS</span>
                                  <h3 className="stat-value">{stats.datasets}</h3>
                                  <p className="stat-description">Available genome datasets</p>
                              </div>
                              <div className="stat-icon"><FaClipboardList /></div>
                          </div>

                          <div className="stat-card">
                              <div className="stat-content">
                                  <span className="stat-label">VARIETIES</span>
                                  <h3 className="stat-value">{stats.varieties.toLocaleString()}</h3>
                                  <p className="stat-description">Cataloged rice varieties</p>
                              </div>
                               <div className="stat-icon"><FaSeedling /></div>
                          </div>

                          <div className="stat-card">
                              <div className="stat-content">
                                  <span className="stat-label">IDENTIFIED SNPS</span>
                                  <h3 className="stat-value">{stats.snps}</h3>
                                  <p className="stat-description">Across all datasets</p>
                              </div>
                               <div className="stat-icon"><FaDna /></div>
                          </div>

                          <div className="stat-card">
                              <div className="stat-content">
                                  <span className="stat-label">TOTAL VISITS</span>
                                  <h3 className="stat-value">{stats.visits}</h3>
                                  <p className="stat-description">Unique research sessions</p>
                              </div>
                              <div className="stat-icon"><FaChartLine /></div>
                          </div>
                     </div>
                </section>

                {/* Recent Activity Section */}
                <section className="dashboard-section recent-activity">
                  <h2 className="section-title"> {/* Keep this title visible */}
                    <FaChartLine className="section-icon" />
                    Recent Activity
                  </h2>
                  <div className="activity-list">
                    {recentActivities.length > 0 ? (
                        recentActivities.map(activity => (
                            <div className="activity-item" key={activity.id}>
                                <div className="activity-icon">{activity.icon}</div>
                                <div className="activity-details">
                                    <p>{activity.text}</p>
                                    <span className="activity-time">{activity.time}</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p style={{color: 'var(--text-muted)'}}>No recent activity recorded.</p>
                    )}
                  </div>
                </section>
            </div> {/* End main-content-full */}
        </div> // End dashboard-container
    );
};

export default Dashboard;
