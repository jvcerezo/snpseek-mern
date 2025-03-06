import React from "react";
import Sidebar from "../components/Sidebar";
import "./Dashboard.css";

const Dashboard = () => {
  return (
    <div className="dashboard-layout">
      {/* Sidebar Component */}
      <Sidebar />

      {/* Main Content */}
      <div className="main-content">
        {/* Navbar */}
        <nav className="dashboard-navbar">
          <button onClick={() => window.location.href = "/search-genotype"}>Search by Genotype</button>
          <button onClick={() => window.location.href = "/search-variety"}>Search by Variety</button>
          <button onClick={() => window.location.href = "/search-gene-loci"}>Search by Gene Loci</button>
        </nav>

        {/* Statistics Cards */}
        <div className="stats-container">
          <div className="stat-card">
            <div className="stat-content">
              <span>DATASET AVAILABLE</span>
              <h3>1</h3>
            </div>
            <div className="stat-icon">&#128203;</div> {/* Clipboard Icon */}
          </div>

          <div className="stat-card">
            <div className="stat-content">
              <span>VARIETY NAMES</span>
              <h3>3024</h3>
            </div>
            <div className="stat-icon">&#127793;</div> {/* Plant Icon */}
          </div>

          <div className="stat-card">
            <div className="stat-content">
              <span>NUMBER OF SNPS</span>
              <h3>20 million +</h3>
            </div>
            <div className="stat-icon">&#128203;</div> {/* Clipboard Icon */}
          </div>

          <div className="stat-card">
            <div className="stat-content">
              <span>TOTAL VISITS</span>
              <h3>18</h3>
            </div>
            <div className="stat-icon">&#128202;</div> {/* Chart Icon */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
