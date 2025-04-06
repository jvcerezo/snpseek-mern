import React, { useState } from 'react';
import './GenotypeSearch.css';

const GenotypeSearch = () => {
  const [formData, setFormData] = useState({
    dataset: 'Reference',
    regionType: 'Chromosome',
    start: '',
    end: '',
  });
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setShowResults(true);
      setLoading(false);
    }, 1000);
  };

  const handleReset = () => {
    setFormData({
      dataset: 'Reference',
      regionType: 'Chromosome',
      start: '',
      end: '',
    });
    setShowResults(false);
  };

  return (
    <div className="genotype-search-container">
      <div className="search-card">
        <div className="card-header">
          <h2>Search By Genotype</h2>
          <label className="toggle-switch">
            <input 
              type="checkbox" 
              checked={showAdvanced}
              onChange={() => setShowAdvanced(!showAdvanced)}
            />
            <span className="slider">Include Advanced Options</span>
          </label>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Dataset</label>
            <select
              name="dataset"
              value={formData.dataset}
              onChange={handleInputChange}
            >
              <option>Reference</option>
              <option>Variety Set</option>
              <option>Snp Set</option>
              <option>Subpopulation</option>
              <option>Variety List</option>
            </select>
          </div>

          <div className="form-group">
            <label>Region</label>
            <div className="region-inputs">
              <select
                name="regionType"
                value={formData.regionType}
                onChange={handleInputChange}
              >
                <option>Chromosome (ex.chr1)</option>
                <option>Gene Locus (ex.loc_oa01g01010)</option>
                <option>SNP List</option>
                <option>Locus List</option>
              </select>
              <input
                type="text"
                name="start"
                value={formData.start}
                onChange={handleInputChange}
                placeholder="Start"
              />
              <input
                type="text"
                name="end"
                value={formData.end}
                onChange={handleInputChange}
                placeholder="End"
              />
            </div>
          </div>

          {showAdvanced && (
            <div className="advanced-options">
              <h3>Advanced Options</h3>
              <div className="form-group">
                <label>Minimum Quality Score</label>
                <input type="number" min="0" max="100" defaultValue="30" />
              </div>
            </div>
          )}

          <div className="form-actions">
            <button type="button" onClick={handleReset} className="secondary-btn">
              Reset
            </button>
            <button type="submit" disabled={loading} className="primary-btn">
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>
      </div>

      {showResults && (
        <div className="results-card">
          <h3>Search Results</h3>
          <div className="results-table">
            <table>
              <thead>
                <tr>
                  <th>Variety ID</th>
                  <th>Chromosome</th>
                  <th>Position</th>
                  <th>Genotype</th>
                </tr>
              </thead>
              <tbody>
                {[...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td>VAR{i+1000}</td>
                    <td>chr{Math.floor(Math.random() * 12) + 1}</td>
                    <td>{Math.floor(Math.random() * 1000000)}</td>
                    <td>{['AA', 'AT', 'TT', 'CC', 'GG'][Math.floor(Math.random() * 5)]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default GenotypeSearch;