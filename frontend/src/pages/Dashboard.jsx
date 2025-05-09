import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    FaTachometerAlt, FaClipboardList, FaSeedling, FaChartLine,
    FaSearch, FaFlask, FaProjectDiagram, FaList, FaDna, FaUsers, FaClock
} from "react-icons/fa";
import { Toaster, toast } from "sonner"; // Import Toaster and toast
import "./Dashboard.css";

const useAuth = () => {
  const isLoggedIn = !!localStorage.getItem("authToken"); // Example: check for a token
  return { isLoggedIn };
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth(); // Use the auth hook

  // Placeholder data (replace with actual data fetching)
  const stats = {
    datasets: 1,
    varieties: 3024,
    snps: "20M+",
    visits: 18, // Example data
  };

  const recentActivities = [
    { id: 1, icon: <FaSearch />, text: "Genotype search performed for 'OsGene1'", time: "2 hours ago" },
    { id: 2, icon: <FaProjectDiagram />, text: "Pipeline step 'Align Assemblies' completed", time: "5 hours ago" },
    { id: 3, icon: <FaClipboardList />, text: "New dataset 'Maize HapMap V3' added", time: "1 day ago" },
  ];

  // Navigate handler for buttons
  const handleNavigate = (path) => {
    const protectedRoutes = ["/phg-visualization", "/pipeline", "/my-lists"];
    if (protectedRoutes.includes(path) && !isLoggedIn) {
      toast.error("Access Denied. Please log in to access this feature.");
      // Optionally, you could redirect to a login page:
      // navigate("/login", { state: { from: path } });
      return;
    }
    navigate(path);
  };

  return (
    <div className="page-container dashboard-container">
      <Toaster position="top-right" richColors theme="dark" /> {/* Add Toaster for notifications */}
      <div className="main-content-full">
        <header className="dashboard-header">
          <div className="header-title-group">
            <h1>
              <FaTachometerAlt className="header-icon" />
              Dashboard
            </h1>
            <p className="welcome-message">Welcome back! Overview of your genomic data portal.</p>
          </div>
        </header>

        <section className="dashboard-section quick-actions">
          <h2 className="section-title visually-hidden">Quick Actions</h2>
          <div className="actions-grid">
            <button className="action-btn" onClick={() => handleNavigate("/search-genotype")}>
              <FaSearch className="btn-icon" /><span>Search by Genotype</span>
            </button>
            <button className="action-btn" onClick={() => handleNavigate("/search-gene-loci")}>
              <FaFlask className="btn-icon" /><span>Search by Gene Loci</span>
            </button>
            <button className="action-btn" onClick={() => handleNavigate("/phg-visualization")}>
              <FaSeedling className="btn-icon" /><span>PHG Visualization</span>
            </button>
            <button className="action-btn" onClick={() => handleNavigate("/pipeline")}>
              <FaProjectDiagram className="btn-icon" /><span>Analysis Pipeline</span>
            </button>
            <button className="action-btn" onClick={() => handleNavigate("/my-lists")}>
              <FaList className="btn-icon" /><span>My Lists</span>
            </button>
          </div>
        </section>

        <section className="dashboard-section stats-section">
          <h2 className="section-title visually-hidden">Statistics</h2>
          <div className="stats-container">
            <div className="stat-card">
              <div className="stat-content"> <span className="stat-label">DATASETS</span> <h3 className="stat-value">{stats.datasets}</h3> <p className="stat-description">Available genome datasets</p> </div>
              <div className="stat-icon"><FaClipboardList /></div>
            </div>
            <div className="stat-card">
              <div className="stat-content"> <span className="stat-label">VARIETIES</span> <h3 className="stat-value">{stats.varieties.toLocaleString()}</h3> <p className="stat-description">Cataloged rice varieties</p> </div>
              <div className="stat-icon"><FaSeedling /></div>
            </div>
            <div className="stat-card">
              <div className="stat-content"> <span className="stat-label">IDENTIFIED SNPS</span> <h3 className="stat-value">{stats.snps}</h3> <p className="stat-description">Across all datasets</p> </div>
              <div className="stat-icon"><FaDna /></div>
            </div>
            <div className="stat-card">
              <div className="stat-content"> <span className="stat-label">TOTAL VISITS</span> <h3 className="stat-value">{stats.visits}</h3> <p className="stat-description">Unique research sessions</p> </div>
              <div className="stat-icon"><FaUsers /></div>
            </div>
          </div>
        </section>

        <section className="dashboard-section recent-activity">
          <h2 className="section-title"><FaClock className="section-icon" /> Recent Activity</h2>
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
              <p style={{ color: 'var(--text-muted)' }}>No recent activity recorded.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;