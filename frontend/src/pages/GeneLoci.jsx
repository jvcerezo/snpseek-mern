import React, { useState } from "react";
import { fetchTraits, fetchReferenceGenomes } from "../api"; // ✅ Import API functions
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

  // Fetch traits only when "Traits" option is selected
  React.useEffect(() => {
    if (selectedGeneOption === "Traits") {
      fetchTraits().then(setTraitsList);
    }
  }, [selectedGeneOption]);

  // Fetch reference genomes only when dropdown is clicked
  const handleReferenceGenomesClick = async () => {
    if (!isReferenceGenomesLoaded) {
      const genomes = await fetchReferenceGenomes();
      setReferenceGenomes(genomes);
      if (genomes.length > 0) setReferenceGenome(genomes[0]);
      setIsReferenceGenomesLoaded(true);
    }
  };

  return (
    <div className="gene-loci-container">
      <h1 className="title">Search By Gene Loci</h1>
      <div className="content">
        <div className="columns">
          {/* Left Column - Queries */}
          <div className="search-form">
            <h2>Query</h2>
            <div className="form-group">
              <label>Reference Genome</label>
              <select
                value={referenceGenome}
                onChange={(e) => setReferenceGenome(e.target.value)}
                onClick={handleReferenceGenomesClick}
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
              <select value={selectedGeneOption} onChange={(e) => setSelectedGeneOption(e.target.value)}>
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
                  <select value={selectedTrait} onChange={(e) => setSelectedTrait(e.target.value)}>
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
  
            <button className="search-btn">Search</button>
          </div>
  
          {/* Right Column - Instructions */}
          <div className="instructions">
            <h2>How to Use</h2>
            <ul>
              <li>Select a reference genome from the dropdown.</li>
              <li>Choose the type of search you want to perform.</li>
              <li>If searching by traits, pick a trait from the list.</li>
              <li>For gene searches, enter a gene name and choose a search type.</li>
              <li>Click "Search" to retrieve the results.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneLoci;
