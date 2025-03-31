import React, { useState, useEffect } from "react";
import { fetchTraits, fetchReferenceGenomes, fetchFeaturesByGeneName, fetchGenesByTrait } from "../api"; 
import "./GeneLoci.css";

const GeneLoci = () => {
  const [selectedGeneOption, setSelectedGeneOption] = useState("Gene name/symbol/function");
  const [selectedTrait, setSelectedTrait] = useState("");
  const [selectedGeneName, setSelectedGeneName] = useState("");
  const [searchType, setSearchType] = useState("substring");
  const [traitsList, setTraitsList] = useState([]);
  const [referenceGenomes, setReferenceGenomes] = useState([]);
  const [referenceGenome, setReferenceGenome] = useState("");
  const [isReferenceGenomesLoaded, setIsReferenceGenomesLoaded] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [genesByTrait, setGenesByTrait] = useState([]);
  const [traitDetails, setTraitDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [expandedSections, setExpandedSections] = useState({
    searchParams: true,
    results: true
  });

  useEffect(() => {
    if (selectedGeneOption === "Traits") {
      fetchTraits().then((traits) => {
        setTraitsList(traits);
      });
    }
  }, [selectedGeneOption]);

  const handleReferenceGenomesClick = async () => {
    if (!isReferenceGenomesLoaded) {
      const genomes = await fetchReferenceGenomes();
      setReferenceGenomes(genomes);
      if (genomes.length > 0) setReferenceGenome(genomes[0]);
      setIsReferenceGenomesLoaded(true);
    }
  };

  const handleSearch = async () => {
    if (!referenceGenome) {
      setErrorMessage("Please select a reference genome.");
      return;
    }

    if (selectedGeneOption === "Traits" && !selectedTrait) {
      setErrorMessage("Please select a trait.");
      return;
    }

    if (selectedGeneOption !== "Traits" && !selectedGeneName) {
      setErrorMessage("Please enter a gene name.");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setExpandedSections({ ...expandedSections, results: true });

    try {
      let results;

      if (selectedGeneOption === "Traits") {
        const genes = await fetchGenesByTrait(selectedTrait, referenceGenome);
        setGenesByTrait(genes);

        const trait = traitsList.find((trait) => trait.traitName === selectedTrait);
        setTraitDetails(trait);

        if (genes.length > 0) {
          results = await fetchFeaturesByGeneName(
            genes.map(gene => gene.geneName).join(","),
            referenceGenome,
            searchType
          );
          setSearchResults(results);
        } else {
          setSearchResults([]);
        }
      } else {
        results = await fetchFeaturesByGeneName(selectedGeneName, referenceGenome, searchType);
        setSearchResults(results);
      }
    } catch (error) {
      setErrorMessage("An error occurred while fetching data. Please try again.");
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section]
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="gene-loci-container">
      <div className="background-overlay"></div>
      <div className="content-wrapper">
        <h1 className="title">
          <i className="fas fa-dna title-icon"></i>
          Search By Gene Loci
        </h1>
        
        <div className="content">
          {/* Search Form Card */}
          <div className="search-form-card">
            <div className="search-form">
              <div className="form-header">
                <h2>
                  <i className="fas fa-search"></i> Query Parameters
                </h2>
                <div className="form-actions">
                  <button 
                    className="clear-btn"
                    onClick={() => {
                      setSelectedGeneName("");
                      setSelectedTrait("");
                      setSearchResults([]);
                      setGenesByTrait([]);
                      setErrorMessage("");
                    }}
                  >
                    <i className="fas fa-eraser"></i> Clear
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>
                  <i className="fas fa-database"></i> Reference Genome
                  <span className="required-asterisk">*</span>
                </label>
                <div className="select-wrapper">
                  <select
                    value={referenceGenome}
                    onChange={(e) => setReferenceGenome(e.target.value)}
                    onClick={handleReferenceGenomesClick}
                    className="styled-select"
                  >
                    {referenceGenomes.length > 0 ? (
                      referenceGenomes.map((genome) => (
                        <option key={genome} value={genome}>
                          {genome}
                        </option>
                      ))
                    ) : (
                      <option value="">Click to load genomes...</option>
                    )}
                  </select>
                  <i className="fas fa-chevron-down select-icon"></i>
                </div>
              </div>

              <div className="form-group">
                <label><i className="fas fa-filter"></i> Search By</label>
                <div className="select-wrapper">
                  <select 
                    value={selectedGeneOption} 
                    onChange={(e) => setSelectedGeneOption(e.target.value)}
                    className="styled-select"
                  >
                    <option>Gene name/symbol/function</option>
                    <option>GO Term</option>
                    <option>Contig and Region</option>
                    <option>Sequence</option>
                    <option>SNP positions list</option>
                    <option>Gene set</option>
                    <option>Traits</option>
                  </select>
                  <i className="fas fa-chevron-down select-icon"></i>
                </div>
              </div>

              <div className="form-group">
                {selectedGeneOption === "Traits" ? (
                  <>
                    <label>
                      <i className="fas fa-tag"></i> Select Trait
                      <span className="required-asterisk">*</span>
                    </label>
                    <div className="select-wrapper">
                      <select 
                        value={selectedTrait} 
                        onChange={(e) => setSelectedTrait(e.target.value)}
                        className="styled-select"
                      >
                        <option value="">-- Select Trait --</option>
                        {traitsList.length > 0 ? (
                          traitsList.map((trait) => (
                            <option key={trait.traitName} value={trait.traitName}>
                              {trait.traitName} - {trait.category}
                            </option>
                          ))
                        ) : (
                          <option disabled>Loading traits...</option>
                        )}
                      </select>
                      <i className="fas fa-chevron-down select-icon"></i>
                    </div>
                  </>
                ) : (
                  <>
                    <label>
                      <i className="fas fa-gene"></i> Gene Name
                      <span className="required-asterisk">*</span>
                    </label>
                    <div className="input-with-icon">
                      <input
                        type="text"
                        value={selectedGeneName}
                        onChange={(e) => setSelectedGeneName(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Enter Gene Name"
                        className="search-input"
                      />
                      <i className="fas fa-dna input-icon"></i>
                    </div>
                    
                    <label><i className="fas fa-search-plus"></i> Search Type</label>
                    <div className="select-wrapper">
                      <select 
                        value={searchType} 
                        onChange={(e) => setSearchType(e.target.value)}
                        className="styled-select"
                      >
                        <option value="whole-word">Whole Word</option>
                        <option value="substring">Substring</option>
                        <option value="exact">Exact Match</option>
                        <option value="regex">Regular Expression</option>
                      </select>
                      <i className="fas fa-chevron-down select-icon"></i>
                    </div>
                  </>
                )}
              </div>

              {errorMessage && (
                <div className="error-message">
                  <i className="fas fa-exclamation-circle"></i> {errorMessage}
                </div>
              )}

              <button 
                className="search-btn" 
                onClick={handleSearch} 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Searching...
                  </>
                ) : (
                  <>
                    <i className="fas fa-search"></i> Search
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Results Card */}
          <div className="results-card">
            <div className="results-section">
              <div 
                className="section-header" 
                onClick={() => toggleSection('results')}
              >
                <h2>
                  <i className={`fas fa-chevron-${expandedSections.results ? 'down' : 'right'}`}></i>
                  <i className="fas fa-poll results-icon"></i> Search Results
                </h2>
                {searchResults.length > 0 || genesByTrait.length > 0 ? (
                  <span className="results-count">
                    {selectedGeneOption === "Traits" 
                      ? `${genesByTrait.length} genes found` 
                      : `${searchResults.length} results`}
                  </span>
                ) : null}
              </div>
              
              <div className={`results-content-container ${expandedSections.results ? 'expanded' : 'collapsed'}`}>
                {loading ? (
                  <div className="loading-state">
                    <div className="loading-indicator">
                      <span className="spinner"></span>
                      <span>Loading results...</span>
                    </div>
                  </div>
                ) : (
                  <>
                    {(searchResults.length === 0 && genesByTrait.length === 0) ? (
                      <div className="no-results">
                        <i className="fas fa-search-minus no-results-icon"></i>
                        <h3>No results found</h3>
                        <p>Try adjusting your search parameters</p>
                        <button 
                          className="help-btn"
                          onClick={() => {
                            setExpandedSections({ ...expandedSections, searchParams: true });
                            document.querySelector('.search-form-card').scrollIntoView({ 
                              behavior: 'smooth' 
                            });
                          }}
                        >
                          <i className="fas fa-question-circle"></i> Search Help
                        </button>
                      </div>
                    ) : (
                      <>
                        {/* Query Details Card */}
                        <div 
                          className={`query-details-card ${expandedSections.searchParams ? 'expanded' : 'collapsed'}`}
                        >
                          <div 
                            className="section-header"
                            onClick={() => toggleSection('searchParams')}
                          >
                            <h3>
                              <i className={`fas fa-chevron-${expandedSections.searchParams ? 'down' : 'right'}`}></i>
                              <i className="fas fa-info-circle"></i> Search Parameters
                            </h3>
                          </div>
                          
                          {expandedSections.searchParams && (
                            <div className="details-content">
                              <div className="detail-row">
                                <span className="detail-label">Reference Genome:</span>
                                <span className="detail-value">{referenceGenome || "Not selected"}</span>
                              </div>
                              <div className="detail-row">
                                <span className="detail-label">Search Type:</span>
                                <span className="detail-value">{selectedGeneOption}</span>
                              </div>
                              
                              {selectedGeneOption === "Traits" && selectedTrait && traitDetails && (
                                <>
                                  <div className="detail-row">
                                    <span className="detail-label">Selected Trait:</span>
                                    <span className="detail-value">{selectedTrait}</span>
                                  </div>
                                  <div className="detail-row">
                                    <span className="detail-label">Trait Category:</span>
                                    <span className="detail-value">{traitDetails.category || "N/A"}</span>
                                  </div>
                                  <div className="detail-row">
                                    <span className="detail-label">Trait Description:</span>
                                    <span className="detail-value">{traitDetails.description || "No description available"}</span>
                                  </div>
                                </>
                              )}
                              
                              {selectedGeneOption !== "Traits" && selectedGeneName && (
                                <div className="detail-row">
                                  <span className="detail-label">Search Term:</span>
                                  <span className="detail-value">{selectedGeneName}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Results Table */}
                        <div className="table-card">
                          <h3>
                            <i className="fas fa-table"></i>
                            {selectedGeneOption === "Traits" 
                              ? " Genes Associated with Selected Trait"
                              : " Matching Genes Found"}
                          </h3>
                          <div className="table-responsive">
                            <table className="results-table">
                              <thead>
                                <tr>
                                  <th>Gene Name <i className="fas fa-sort"></i></th>
                                  <th>Reference Genome <i className="fas fa-sort"></i></th>
                                  <th>Contig <i className="fas fa-sort"></i></th>
                                  <th>Strand <i className="fas fa-sort"></i></th>
                                  <th>Description <i className="fas fa-sort"></i></th>
                                </tr>
                              </thead>
                              <tbody>
                                {(selectedGeneOption === "Traits" ? genesByTrait : searchResults).map((item) => (
                                  <tr key={item._id || item.geneName}>
                                    <td>
                                      <span className="gene-name">{item.geneName}</span>
                                      {item.geneSymbol && (
                                        <span className="gene-symbol">{item.geneSymbol}</span>
                                      )}
                                    </td>
                                    <td>{item.referenceGenome}</td>
                                    <td>{item.contig}</td>
                                    <td>
                                      <span className={`strand-badge ${item.strand === '+' ? 'positive' : 'negative'}`}>
                                        {item.strand}
                                      </span>
                                    </td>
                                    <td>
                                      <div className="description-text">
                                        {item.description || "No description available"}
                                      </div>
                                      {item.function && (
                                        <div className="gene-function">
                                          <strong>Function:</strong> {item.function}
                                        </div>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          
                          {(searchResults.length > 10 || genesByTrait.length > 10) && (
                            <div className="table-footer">
                              <div className="pagination-controls">
                                <button className="pagination-btn" disabled>
                                  <i className="fas fa-chevron-left"></i> Previous
                                </button>
                                <span className="page-info">Page 1 of 1</span>
                                <button className="pagination-btn" disabled>
                                  Next <i className="fas fa-chevron-right"></i>
                                </button>
                              </div>
                              <div className="results-per-page">
                                <span>Results per page:</span>
                                <select className="page-select">
                                  <option>10</option>
                                  <option>25</option>
                                  <option>50</option>
                                  <option>100</option>
                                </select>
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneLoci;