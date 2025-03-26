import React, { useState, useEffect } from "react";
import axios from "axios";
import "./GeneLoci.css";

const GeneLoci = () => {
  const [selectedGeneOption, setSelectedGeneOption] = useState("Gene name/symbol/function");
  const [selectedTrait, setSelectedTrait] = useState("");
  const [selectedGeneName, setSelectedGeneName] = useState("");
  const [searchType, setSearchType] = useState("substring");
  const [traitsList, setTraitsList] = useState([]);

  // Fetch traits from backend when "Traits" is selected
  useEffect(() => {
    if (selectedGeneOption === "Traits") {
      axios.get("http://localhost:5002/features/traits")
        .then((response) => setTraitsList(response.data))
        .catch((error) => console.error("Error fetching traits:", error));
    }
  }, [selectedGeneOption]);

  const handleSearch = () => {
    let apiUrl = "http://localhost:5002/features/search";

    if (selectedGeneOption === "Traits") {
      apiUrl = `http://localhost:5002/features/by-trait?traitName=${selectedTrait}`;
    } else if (selectedGeneOption === "Gene name/symbol/function") {
      apiUrl = `http://localhost:5002/features/by-gene-name?geneName=${selectedGeneName}&searchType=${searchType}`;
    }

    axios.get(apiUrl)
      .then((response) => console.log("Search Results:", response.data))
      .catch((error) => console.error("Search Error:", error));
  };

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
            <select 
              value={selectedGeneOption} 
              onChange={(e) => setSelectedGeneOption(e.target.value)}
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
            <label>Gene Model</label>
            <select>
              <option>All</option>
              <option>Specific Model</option>
            </select>
          </div>
          <div className="form-group">
            <label>Maximum interacting loci</label>
            <input type="number" placeholder="Feature coming soon..." disabled />
          </div>

          {/* Dynamic Field: Gene Name or Traits Dropdown */}
          <div className="form-group">
            {selectedGeneOption === "Traits" ? (
              <>
                <label>Select Trait</label>
                <select 
                  value={selectedTrait} 
                  onChange={(e) => setSelectedTrait(e.target.value)}
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
                />
                <label>Search Type</label>
                <select value={searchType} onChange={(e) => setSearchType(e.target.value)}>
                  <option value="whole-word">Whole Word</option>
                  <option value="substring">Substring</option>
                  <option value="exact">Exact Match</option>
                  <option value="regex">Regular Expression</option>
                </select>
              </>
            )}
          </div>

          <button className="search-btn" onClick={handleSearch}>Search</button>
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
              <p>Choose a <strong>Search Type</strong> (e.g., Gene Name, GO Term, Traits)</p>
            </div>
            <div className="step">
              <span className="step-number">3</span>
              <p>Enter <strong>Gene Name or Select a Trait</strong></p>
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
