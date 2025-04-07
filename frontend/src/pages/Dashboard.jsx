import React from "react"; // Removed useState as sidebar toggle state is gone
import { useNavigate } from "react-router-dom"; // Use hook for navigation
import { FaTachometerAlt, FaClipboardList, FaSeedling, FaChartLine, FaSearch, FaFlask, FaProjectDiagram, FaDna } from "react-icons/fa";
// Removed Sidebar import
import "./Dashboard.css"; // Adjust path if necessary

const Dashboard = () => {
  const navigate = useNavigate(); // Hook for navigation

  // Removed sidebar state and toggle function

  // Placeholder data (replace with actual data fetching)
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


  return (
    // Simplified layout container class
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
           {/* Mobile Sidebar Toggle Button Removed */}
        </header>

        {/* Quick Actions */}
        <section className="dashboard-section quick-actions">
             <h2 className="section-title visually-hidden">Quick Actions</h2> {/* Added hidden title for semantics */}
              <div className="actions-grid">
                  <button className="action-btn" onClick={() => handleNavigate("/search-genotype")}>
                    <FaSearch className="btn-icon" /><span>Search Genotype</span>
                  </button>
                  <button className="action-btn" onClick={() => handleNavigate("/search-variety")}>
                    <FaSeedling className="btn-icon" /><span>Search Variety</span>
                  </button>
                  <button className="action-btn" onClick={() => handleNavigate("/search-gene-loci")}>
                    <FaFlask className="btn-icon" /><span>Search Gene Loci</span>
                  </button>
                  <button className="action-btn" onClick={() => handleNavigate("/pipeline")}>
                    <FaProjectDiagram className="btn-icon" /><span>Analysis Pipeline</span>
                  </button>
                  {/* Add QC Metrics button if desired */}
                   <button className="action-btn" onClick={() => handleNavigate("/qc-metrics")}>
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

// CSS utility class if needed
/*
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}
*/

// Remove body scroll lock CSS rule if added previously
/*
body.no-scroll-dashboard {
  overflow: visible !important; // Ensure overflow is reset
}
*/