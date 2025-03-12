import React, { useState } from "react";
import "./GeneLoci.css";

const GeneLoci = () => {
  const [includeGeneName, setIncludeGeneName] = useState(false);

  return (
    <div className="gene-loci-container">
      <h1 className="title">Search By Gene Loci</h1>
      <div className="content">
        {/* Left Section: Search Form */}
        <div className="search-form">
          <div className="form-group">
            <label>Reference Genome</label>
            <select>
              <option>Japonica Nipponbare</option>
              <option>Indica</option>
              <option>Other</option>
            </select>
          </div>
          <div className="form-group">
            <label>Search By</label>
            <select>
              <option>Gene name/symbol/function</option>
              <option>GO Term</option>
              <option>Contig and Region</option>
              <option>Sequence</option>
              <option>SNP positions list</option>
              <option>Gene set</option>
            </select>
          </div>
          <div className="form-group">
            <label>Gene Model</label>
            <select>
              <option>All</option>
              <option>Specific Model</option>
            </select>
          </div>
          <div className="form-group">
            <label>Maximum interacting loci</label>
            <input type="number" placeholder="Enter max loci" />
          </div>

          {/* Optional Gene Name Section */}
          <div className="optional-section">
  <label className="checkbox-container">
    <input
      type="checkbox"
      checked={includeGeneName}
      onChange={() => setIncludeGeneName(!includeGeneName)}
    />
    Include Gene Name
  </label>
</div>


          {includeGeneName && (
            <div className="form-group">
              <label>Gene Name</label>
              <select>
                <option>Whole word only</option>
                <option>Substring</option>
                <option>Exact match</option>
                <option>Regular expression</option>
              </select>
            </div>
          )}

          <button className="search-btn">Search</button>
        </div>

        {/* Right Section: Visual Guide */}
        <div className="visual-guide">
          <h2>How It Works</h2>
          <div className="steps">
            <div className="step">
              <span className="step-number">1</span>
              <p>Select a <strong>Reference Genome</strong></p>
            </div>
            <div className="step">
              <span className="step-number">2</span>
              <p>Choose a <strong>Search Type</strong> (e.g., Gene Name, GO Term)</p>
            </div>
            <div className="step">
              <span className="step-number">3</span>
              <p>(Optional) <strong>Enable Gene Name Search</strong></p>
            </div>
            <div className="step">
              <span className="step-number">4</span>
              <p>Click <strong>Search</strong> to find matching loci</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneLoci;
