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
      setErrorMessage("An error occurred while fetching data.");
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gene-loci-container">
      <h1 className="title">Search By Gene Loci</h1>
      <div className="content">
        <div className="search-and-results">
          {/* Search Form Card */}
          <div className="search-form-card">
            <div className="search-form">
              <h2>Query</h2>
              <div className="form-group">
                <label>Reference Genome</label>
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
                    <option disabled>Click to load...</option>
                  )}
                </select>
              </div>

              <div className="form-group">
                <label>Search By</label>
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
              </div>

              <div className="form-group">
                {selectedGeneOption === "Traits" ? (
                  <>
                    <label>Select Trait</label>
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
                  </>
                ) : (
                  <>
                    <label>Gene Name</label>
                    <input
                      type="text"
                      value={selectedGeneName}
                      onChange={(e) => setSelectedGeneName(e.target.value)}
                      placeholder="Enter Gene Name"
                      className="search-input"
                    />
                    <label>Search Type</label>
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
                  </>
                )}
              </div>

              {errorMessage && <p className="error-message">{errorMessage}</p>}

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
                ) : "Search"}
              </button>
            </div>
          </div>

          {/* Results Card */}
          <div className="results-card">
  <div className="results-section">
    <h2>Search Results</h2>
    <div className="results-content-container">
      {loading ? (
        <div className="loading-state">
          <div className="loading-indicator">
            <span className="spinner"></span>
            <span>Loading results...</span>
          </div>
        </div>
      ) : (
        <>
          {searchResults.length === 0 && genesByTrait.length === 0 ? (
            <div className="no-results">
              No results found. Try a different search.
            </div>
          ) : (
                      <>
                        {/* Query Details Card */}
                        <div className="query-details-card">
                          <h3>Search Parameters</h3>
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

                        {/* Results Table */}
                        <div className="table-card">
                          <h3>
                            {selectedGeneOption === "Traits" 
                              ? "Genes Associated with Selected Trait"
                              : "Matching Genes Found"}
                          </h3>
                          <div className="table-responsive">
                            <table className="results-table">
                              <thead>
                                <tr>
                                  <th>Gene Name</th>
                                  <th>Reference Genome</th>
                                  <th>Contig</th>
                                  <th>Strand</th>
                                  <th>Description</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(selectedGeneOption === "Traits" ? genesByTrait : searchResults).map((item) => (
                                  <tr key={item._id || item.geneName}>
                                    <td>{item.geneName}</td>
                                    <td>{item.referenceGenome}</td>
                                    <td>{item.contig}</td>
                                    <td>{item.strand}</td>
                                    <td>{item.description || "No description available"}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
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