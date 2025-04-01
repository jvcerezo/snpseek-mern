import React, { useState } from 'react';
import { FaDna, FaFileDownload, FaPlus, FaCog, FaChartLine } from 'react-icons/fa';
import './Pipeline.css';

const Pipeline = () => {
  const [selectedProject, setSelectedProject] = useState('');
  const [projects, setProjects] = useState(['Rice Genome Analysis', 'Wheat Variant Calling']);
  
  // Mock data for dropdowns
  const sequences = ['Sequence_1.fa', 'Sequence_2.fa', 'Sequence_3.fa'];
  const gffFiles = ['Annotation_1.gff', 'Annotation_2.gff'];
  const bedFiles = ['Ranges_1.bed', 'Ranges_2.bed'];
  
  // State for each pipeline card
  const [prepareFasta, setPrepareFasta] = useState({
    selectedSequences: [],
    newName: '',
    output: null,
    error: null
  });

  const [compressFasta, setCompressFasta] = useState({
    selectedSequences: [],
    reference: '',
    output: null,
    error: null
  });

  // Add similar state objects for other pipeline cards...

  const handleCreateProject = () => {
    const newProject = `Project_${projects.length + 1}`;
    setProjects([...projects, newProject]);
    setSelectedProject(newProject);
  };

  return (
    <div className="pipeline-container">
      <div className="pipeline-header">
        <h1><FaDna /> Genome Analysis Pipeline</h1>
        
        <div className="project-controls">
          <select 
            className="project-select"
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
          >
            <option value="">Select Project</option>
            {projects.map(project => (
              <option key={project} value={project}>{project}</option>
            ))}
          </select>
          
          <button className="create-project-btn" onClick={handleCreateProject}>
            <FaPlus /> Create Project
          </button>
        </div>
      </div>

      {/* Pipeline Cards */}
      <div className="pipeline-cards">
        
        {/* 1. Prepare Assembly FASTA files */}
        <div className="pipeline-card">
          <div className="card-header">
            <h2><FaCog /> Prepare Assembly FASTA files</h2>
          </div>
          <div className="card-content">
            <div className="input-group">
              <label>Sequences</label>
              <select 
                multiple
                className="multi-select"
                value={prepareFasta.selectedSequences}
                onChange={(e) => setPrepareFasta({
                  ...prepareFasta,
                  selectedSequences: Array.from(e.target.selectedOptions, option => option.value)
                })}
              >
                {sequences.map(seq => (
                  <option key={seq} value={seq}>{seq}</option>
                ))}
              </select>
            </div>
            
            <div className="input-group">
              <label>New name of file/annotation</label>
              <input 
                type="text" 
                value={prepareFasta.newName}
                onChange={(e) => setPrepareFasta({...prepareFasta, newName: e.target.value})}
              />
            </div>
            
            <button className="process-btn">Process</button>
            
            {prepareFasta.output && (
              <div className="output-success">
                <a href={prepareFasta.output} className="download-link">
                  <FaFileDownload /> Download Prepared FASTA
                </a>
              </div>
            )}
            
            {prepareFasta.error && (
              <div className="output-error">{prepareFasta.error}</div>
            )}
          </div>
        </div>

        {/* 2. Compress FASTA files */}
        <div className="pipeline-card">
          <div className="card-header">
            <h2><FaCog /> Compress FASTA files</h2>
          </div>
          <div className="card-content">
            <div className="input-group">
              <label>Sequences</label>
              <select multiple className="multi-select">
                {sequences.map(seq => (
                  <option key={seq} value={seq}>{seq}</option>
                ))}
              </select>
            </div>
            
            <div className="input-group">
              <label>Reference</label>
              <select>
                <option value="">Select reference</option>
                {sequences.map(seq => (
                  <option key={seq} value={seq}>{seq}</option>
                ))}
              </select>
            </div>
            
            <button className="process-btn">Compress</button>
          </div>
        </div>

        {/* 3. Create reference ranges */}
        <div className="pipeline-card">
          <div className="card-header">
            <h2><FaCog /> Create reference ranges</h2>
          </div>
          <div className="card-content">
            <div className="input-group">
              <label>GFF File</label>
              <select>
                <option value="">Select GFF file</option>
                {gffFiles.map(file => (
                  <option key={file} value={file}>{file}</option>
                ))}
              </select>
            </div>
            
            <div className="input-group">
              <label>Reference File</label>
              <select>
                <option value="">Select reference</option>
                {sequences.map(seq => (
                  <option key={seq} value={seq}>{seq}</option>
                ))}
              </select>
            </div>
            
            <div className="toggle-group">
              <label>Feature Type:</label>
              <div className="toggle-container">
                <button className="toggle-btn active">Gene</button>
                <button className="toggle-btn">CDS</button>
              </div>
            </div>
            
            <div className="input-group">
              <label>Genome range pad</label>
              <input type="number" />
            </div>
            
            <div className="input-group">
              <label>Minimum range size</label>
              <input type="number" />
            </div>
            
            <div className="input-group">
              <label>Output BED file name</label>
              <input type="text" />
            </div>
            
            <button className="process-btn">Generate Ranges</button>
          </div>
        </div>

        {/* Additional pipeline cards for other functions... */}
      </div>

      {/* QC Metrics Section */}
      <div className="qc-section">
        <h2><FaChartLine /> Quality Control Metrics</h2>
        
        <div className="qc-cards">
          <div className="qc-card">
            <h3>Prepare FASTA Metrics</h3>
            <div className="metrics">
              <p>RAM Usage: 2.4GB</p>
              <p>Processing Time: 45s</p>
              <p>Status: Completed successfully</p>
            </div>
          </div>
          
          <div className="qc-card">
            <h3>Anchorwave Dot Plots</h3>
            <select>
              <option value="">Select comparison</option>
              <option value="comp1">Sequence_1 vs Sequence_2</option>
            </select>
            <div className="plot-output">
              {/* Image would be rendered here */}
              <p>Dot plot visualization will appear here</p>
            </div>
          </div>
          
          <div className="qc-card">
            <h3>VCF Metrics</h3>
            <button className="generate-btn">Generate VCF Metrics</button>
            <div className="metrics-output">
              <p>Metrics file will be available here</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pipeline;