import React from "react";
import { FaUser, FaDna, FaCog, FaSignOutAlt } from "react-icons/fa";
import "./Sidebar.css";

const Sidebar = () => {
  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        <ul className="sidebar-menu">
          <li className="sidebar-item">
            <a href="/profile" className="sidebar-link">
              <FaUser className="sidebar-icon" />
              <span>Profile</span>
            </a>
          </li>
          <li className="sidebar-item">
            <a href="/my-snps" className="sidebar-link">
              <FaDna className="sidebar-icon" />
              <span>My SNPs</span>
            </a>
          </li>
          <li className="sidebar-item">
            <a href="/settings" className="sidebar-link">
              <FaCog className="sidebar-icon" />
              <span>Settings</span>
            </a>
          </li>
          <li className="sidebar-item sidebar-logout">
            <a href="/logout" className="sidebar-link">
              <FaSignOutAlt className="sidebar-icon" />
              <span>Logout</span>
            </a>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;