import React from "react";
import "./Sidebar.css";

const Sidebar = () => {
  return (
    <aside className="sidebar">
      <ul>
        <li><a href="/profile">Profile</a></li>
        <li><a href="/my-snps">My SNPs</a></li>
        <li><a href="/settings">Settings</a></li>
        <li className="logout"><a href="/logout">Logout</a></li>
      </ul>
    </aside>
  );
};

export default Sidebar;
