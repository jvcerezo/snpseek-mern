// GenotypeSearch.js
import React, { useState } from 'react';
import './GenotypeSearch.css'; // Ensure you link the updated CSS

const GenotypeSearch = () => {
  const [formData, setFormData] = useState({
    varietySet: '',
    snpSet: '',
    varietySubpopulation: '',
    regionChromosome: '',
    regionStart: '',
    regionEnd: '',
    regionGeneLocus: '',
  });
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  // --- Sample Data (Keep or replace with actual data fetching) ---
  const varietySets = ['Variety Set A', 'Variety Set B', 'Variety Set C', 'Core 4K', 'USDA GRIN'];
  const snpSets = ['SNP Set 1', 'SNP Set 2', 'SNP Set 3', 'GBS v2.1', 'Axiom 50k'];
  const varietySubpopulations = ['Subpopulation A', 'Subpopulation B', 'Subpopulation C', 'Indica', 'Japonica', 'Aus'];
  const regionChromosomes = ['chr1', 'chr2', 'chr3', 'chr4', 'chr5', 'chr6', 'chr7', 'chr8', 'chr9', 'chr10', 'chr11', 'chr12'];
  // --- End Sample Data ---

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setShowResults(true); // Show the results area immediately (to display loading)
    setSearchResults([]); // Clear previous results

    // Simulate API call
    console.log('Searching with:', formData);
    setTimeout(() => {
      // Simulate finding results or not
      const hasResults = Math.random() > 0.2; // 80% chance of getting results
      const simulatedResults = hasResults ? [...Array(15)].map((_, i) => ({ // Increased sample size
        VarietyID: `VAR${i + 1000 + Math.floor(Math.random() * 500)}`,
        Chromosome: `chr${Math.floor(Math.random() * 12) + 1}`,
        Position: Math.floor(Math.random() * 30000000), // More realistic position range
        Ref: ['A', 'T', 'C', 'G'][Math.floor(Math.random() * 4)],
        Alt: ['A', 'T', 'C', 'G'][Math.floor(Math.random() * 4)],
        Genotype: ['AA', 'AT', 'TT', 'CC', 'GG', 'AC', 'AG', 'CT', 'CG', 'GT'][Math.floor(Math.random() * 10)],
        Quality: Math.floor(Math.random() * 90) + 10, // Quality usually > 0
      })) : [];

      setSearchResults(simulatedResults);
      setLoading(false);
    }, 1500); // Slightly longer delay
  };

  const handleReset = () => {
    setFormData({
      varietySet: '',
      snpSet: '',
      varietySubpopulation: '',
      regionChromosome: '',
      regionStart: '',
      regionEnd: '',
      regionGeneLocus: '',
    });
    setShowResults(false);
    setSearchResults([]);
    setLoading(false); // Ensure loading is reset
  };

  return (
    // Use a wrapper that allows content to grow but centers it
    <div className="page-wrapper">
      <div className="genotype-search-container">
        <div className="search-card">
          {/* Use a more descriptive title */}
          <h2>Genotype Search Criteria</h2>
          <form onSubmit={handleSubmit} className="genotype-form">
            {/* Group Datasets */}
            <div className="form-section">
              <h3>Datasets</h3>
              <div className="form-row"> {/* Use rows for better alignment */}
                <div className="form-group">
                  <label htmlFor="varietySet">Variety Set</label>
                  <select id="varietySet" name="varietySet" value={formData.varietySet} onChange={handleInputChange}>
                    <option value="">Select Variety Set</option>
                    {varietySets.map(set => <option key={set} value={set}>{set}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="snpSet">SNP Set</label>
                  <select id="snpSet" name="snpSet" value={formData.snpSet} onChange={handleInputChange}>
                    <option value="">Select SNP Set</option>
                    {snpSets.map(set => <option key={set} value={set}>{set}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Group Varieties */}
            <div className="form-section">
              <h3>Varieties (Optional Filter)</h3>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="varietySubpopulation">Subpopulation</label>
                  <select id="varietySubpopulation" name="varietySubpopulation" value={formData.varietySubpopulation} onChange={handleInputChange}>
                    <option value="">Any Subpopulation</option>
                    {varietySubpopulations.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                  </select>
                </div>
                {/* Add more variety filters here if needed */}
              </div>
            </div>

            {/* Group Region */}
            <div className="form-section">
              <h3>Region (Optional Filter)</h3>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="regionChromosome">Chromosome</label>
                  <select id="regionChromosome" name="regionChromosome" value={formData.regionChromosome} onChange={handleInputChange}>
                    <option value="">Any Chromosome</option>
                    {regionChromosomes.map(chr => <option key={chr} value={chr}>{chr}</option>)}
                  </select>
                </div>
                <div className="form-group region-inputs"> {/* Keep Start/End together */}
                    <label htmlFor="regionStart">Position Start</label>
                    <input id="regionStart" type="number" name="regionStart" value={formData.regionStart} onChange={handleInputChange} placeholder="e.g., 100000" />
                    <label htmlFor="regionEnd">Position End</label>
                    <input id="regionEnd" type="number" name="regionEnd" value={formData.regionEnd} onChange={handleInputChange} placeholder="e.g., 200000" />
                </div>
              </div>
               <div className="form-row"> {/* Separate row for Gene Locus */}
                 <div className="form-group">
                  <label htmlFor="regionGeneLocus">Gene Locus (e.g., LOC_Os...) </label>
                  <input id="regionGeneLocus" type="text" name="regionGeneLocus" value={formData.regionGeneLocus} onChange={handleInputChange} placeholder="Enter Gene Locus ID" />
                </div>
               </div>
            </div>

            {/* Actions */}
            <div className="form-actions">
              <button type="button" onClick={handleReset} className="secondary-btn">Reset</button>
              <button type="submit" disabled={loading} className="primary-btn">
                {loading ? (
                  <>
                    <span className="spinner"></span> Searching...
                  </>
                 ) : 'Search'}
              </button>
            </div>
          </form>
        </div> {/* End search-card */}

        {/* Results Area */}
        {showResults && (
          <div className="results-card">
            <h3>Search Results</h3>
            {loading ? (
              <div className="loading-indicator">
                 <span className="spinner"></span> Loading data... please wait.
              </div>
            ) : searchResults.length > 0 ? (
              <div className="results-table-container"> {/* Added container for overflow */}
                <table className="results-table">
                  <thead>
                    <tr>
                      <th>Variety ID</th>
                      <th>Chromosome</th>
                      <th>Position</th>
                      <th>Ref</th>
                      <th>Alt</th>
                      <th>Genotype</th>
                      <th>Quality</th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchResults.map((result, index) => (
                      <tr key={index}> {/* Use a more stable key if available, like result.id */}
                        <td data-label="Variety ID">{result.VarietyID}</td>
                        <td data-label="Chromosome">{result.Chromosome}</td>
                        <td data-label="Position">{result.Position.toLocaleString()}</td> {/* Format numbers */}
                        <td data-label="Ref">{result.Ref}</td>
                        <td data-label="Alt">{result.Alt}</td>
                        <td data-label="Genotype">{result.Genotype}</td>
                        <td data-label="Quality">{result.Quality}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="no-results">
                No genotypes found matching your criteria. Try broadening your search.
              </div>
            )}
          </div> // End results-card
        )}
      </div> {/* End genotype-search-container */}
    </div> // End page-wrapper
  );
};

export default GenotypeSearch;