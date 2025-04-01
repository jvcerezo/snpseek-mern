import React from "react";
import { FaDna, FaClipboardList, FaSeedling, FaChartLine, FaSearch, FaFlask } from "react-icons/fa";
import Sidebar from "../components/Sidebar";
import "./Dashboard.css";

const Dashboard = () => {
  return (
    <div className="dashboard-layout">
      <Sidebar />

      <div className="main-content">
        {/* Header */}
        <header className="dashboard-header">
          <h1>
            <FaDna className="header-icon" />
            Dashboard
          </h1>
          <p className="welcome-message">Welcome back to your genomic research portal</p>
        </header>

        {/* Quick Actions */}
        <div className="quick-actions">
          <button 
            className="action-btn search-genotype"
            onClick={() => window.location.href = "/search-genotype"}
          >
            <FaSearch className="btn-icon" />
            Search by Genotype
          </button>
          <button 
            className="action-btn search-variety"
            onClick={() => window.location.href = "/search-variety"}
          >
            <FaSeedling className="btn-icon" />
            Search by Variety
          </button>
          <button 
            className="action-btn search-gene-loci"
            onClick={() => window.location.href = "/search-gene-loci"}
          >
            <FaFlask className="btn-icon" />
            Search by Gene Loci
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="stats-container">
          <div className="stat-card dataset-card">
            <div className="stat-content">
              <span className="stat-label">DATASETS AVAILABLE</span>
              <h3 className="stat-value">1</h3>
              <p className="stat-description">Rice genome datasets</p>
            </div>
            <div className="stat-icon">
              <FaClipboardList />
            </div>
          </div>

          <div className="stat-card variety-card">
            <div className="stat-content">
              <span className="stat-label">VARIETY NAMES</span>
              <h3 className="stat-value">3,024</h3>
              <p className="stat-description">Rice varieties cataloged</p>
            </div>
            <div className="stat-icon">
              <FaSeedling />
            </div>
          </div>

          <div className="stat-card snp-card">
            <div className="stat-content">
              <span className="stat-label">NUMBER OF SNPS</span>
              <h3 className="stat-value">20M+</h3>
              <p className="stat-description">Identified SNPs</p>
            </div>
            <div className="stat-icon">
              <FaDna />
            </div>
          </div>

          <div className="stat-card visits-card">
            <div className="stat-content">
              <span className="stat-label">TOTAL VISITS</span>
              <h3 className="stat-value">18</h3>
              <p className="stat-description">Research sessions</p>
            </div>
            <div className="stat-icon">
              <FaChartLine />
            </div>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="recent-activity">
          <h2 className="section-title">
            <FaChartLine className="section-icon" />
            Recent Activity
          </h2>
          <div className="activity-list">
            <div className="activity-item">
              <div className="activity-icon">🔍</div>
              <div className="activity-details">
                <p>Genotype search performed</p>
                <span className="activity-time">2 hours ago</span>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon">🧬</div>
              <div className="activity-details">
                <p>New dataset uploaded</p>
                <span className="activity-time">1 day ago</span>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon">📊</div>
              <div className="activity-details">
                <p>Analysis completed</p>
                <span className="activity-time">3 days ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;