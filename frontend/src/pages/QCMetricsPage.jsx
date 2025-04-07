import React, { useState, useEffect } from 'react';
// Import specific icons needed for this page
import {
    FaChartLine, FaChartBar, FaImage, FaFileDownload, FaCheckCircle,
    FaExclamationTriangle, FaInfoCircle, FaClock, FaMemory, FaListOl
} from 'react-icons/fa';
import './Pipeline.css'; // Shared CSS file

// Placeholder function to simulate API calls/processing
const simulateProcessing = (duration = 1500) => {
    return new Promise((resolve, reject) => {
         const success = Math.random() > 0.15; // 85% success rate
        setTimeout(() => {
             if (success) {
                resolve({ message: "Processing complete." });
            } else {
                reject(new Error("Simulated QC failure."));
            }
        }, duration);
    });
};

// Assume selectedProject is passed as a prop or obtained from context/URL
const QCMetricsPage = ({ selectedProject: initialProject = "Default Project" }) => {

    // State to manage which project's QC data to show
    // TODO: Replace with dynamic project fetching or context
    const [selectedProject, setSelectedProject] = useState(initialProject);
    const [projects, setProjects] = useState(['Rice Genome Analysis', 'Wheat Variant Calling', 'Maize Transposon Study']);

    // --- Mock Data (Replace with API calls based on selectedProject) ---
    const availableComparisons = ['japonica vs indica', 'japonica vs reference_v5'];

    // --- State for QC Section ---
    const [qc_stepMetrics, setQc_stepMetrics] = useState({
        // TODO: Fetch actual metrics based on selectedProject runs from backend/shared state
        step1: { ram: '1.5GB', time: '30s', statusText: 'Success' },
        step2: { ram: '2.1GB', time: '1m 15s', statusText: 'Success' },
        step3: { ram: '0.8GB', time: '25s', statusText: 'Success' },
        step4: { ram: '10.5GB', time: '1h 30m', statusText: 'Success' },
        step5: { ram: 'N/A', time: 'N/A', statusText: 'Failed' },
        step6: { ram: 'N/A', time: 'N/A', statusText: 'Not Run' },
    });
    const [qc_dotPlots, setQc_dotPlots] = useState({
        selectedComparison: '',
        plotImageUrl: null,
        loading: false,
        error: null,
    });
    const [qc_vcfMetrics, setQc_vcfMetrics] = useState({
        downloadLink: null,
        loading: false,
        error: null,
    });

    // --- Handlers ---

    // Placeholder QC Handlers (Replace with actual API calls)
    const handleGenerateDotPlot = async () => {
        if (!qc_dotPlots.selectedComparison || !selectedProject) {
            alert("Please select a project and comparison for the dot plot.");
            return;
        }
        setQc_dotPlots(prev => ({...prev, loading: true, error: null, plotImageUrl: null}));
        console.log(`Generating dot plot for: ${qc_dotPlots.selectedComparison} in project ${selectedProject}`);
        try {
            // Replace with API call: await api.generateDotPlot(selectedProject, qc_dotPlots.selectedComparison);
            await simulateProcessing(2000);
            const plotUrl = `https://via.placeholder.com/400x300.png?text=Dot+Plot+${qc_dotPlots.selectedComparison.replace(' ','+')}`;
            setQc_dotPlots(prev => ({...prev, plotImageUrl: plotUrl}));
        } catch(error) {
             console.error("Dot plot generation error:", error);
             setQc_dotPlots(prev => ({...prev, error: "Failed to generate dot plot."}));
        } finally {
             setQc_dotPlots(prev => ({...prev, loading: false}));
        }
    }

     const handleGenerateVcfMetrics = async () => {
         if (!selectedProject) {
             alert("Please select a project first.");
             return;
         }
        setQc_vcfMetrics(prev => ({...prev, loading: true, error: null, downloadLink: null}));
        console.log(`Generating VCF metrics for project ${selectedProject}...`);
        try {
             // Replace with API call: await api.generateVcfMetrics(selectedProject);
            await simulateProcessing(1000);
            const metricsLink = `/api/download/${selectedProject}/vcf_metrics_report.txt`;
            setQc_vcfMetrics(prev => ({...prev, downloadLink: metricsLink}));
        } catch(error) {
             console.error("VCF metrics generation error:", error);
             setQc_vcfMetrics(prev => ({...prev, error: "Failed to generate VCF metrics."}));
        } finally {
             setQc_vcfMetrics(prev => ({...prev, loading: false}));
        }
    }

     // Helper to render status messages (can be shared in a utils file)
     const renderQcStatus = (loading, error, downloadLink, defaultText) => {
        if (loading) return <span className="spinner"></span>;
        if (error) return <div className="output-area output-error"><FaExclamationTriangle/> {error}</div>;
        if (downloadLink) {
            return (
                 <div className="output-area output-success">
                     <a href={downloadLink} className="download-link" target="_blank" rel="noopener noreferrer">
                         <FaFileDownload /> Download Metrics Report
                     </a>
                </div>
            );
        }
        return <p>{defaultText}</p>;
     };


    // --- JSX ---
    return (
         <div className="page-container qc-metrics-container">
             <div className="page-header">
                 <h1><FaChartLine className="header-icon" /> Quality Control & Visualization</h1>
                 {/* Project Selector for QC Page */}
                 <div className="page-controls">
                     <select
                        className="themed-select project-select"
                        value={selectedProject}
                        onChange={(e) => setSelectedProject(e.target.value)}
                        // TODO: Load projects dynamically
                    >
                        <option value="">Select Project...</option>
                        {projects.map(project => (
                            <option key={project} value={project}>{project}</option>
                        ))}
                    </select>
                     {/* Optional Refresh button */}
                     {/* <button className="secondary-btn"><FaSync /> Refresh</button> */}
                </div>
            </div>

             {!selectedProject && (
                 <div className="output-area output-info" style={{marginBottom: '2rem'}}>
                    <FaInfoCircle /> Please select a project to view its QC metrics.
                 </div>
             )}

            {selectedProject && (
                 <div className="cards-grid qc-cards"> {/* Use common grid class */}

                     {/* Card for Step Metrics */}
                     <div className="styled-card qc-card"> {/* Use themed class */}
                         <div className="card-header"><h3><FaClock /> Pipeline Step Metrics</h3></div>
                         <div className="card-content">
                             <div className="metrics-list">
                                 {/* TODO: Map over steps dynamically */}
                                 <p><strong>1. Prepare FASTA:</strong> <span>{qc_stepMetrics.step1.statusText} ({qc_stepMetrics.step1.time || 'N/A'})</span></p>
                                 <p><strong>2. Compress FASTA:</strong> <span>{qc_stepMetrics.step2.statusText} ({qc_stepMetrics.step2.time || 'N/A'})</span></p>
                                 <p><strong>3. Create Ranges:</strong> <span>{qc_stepMetrics.step3.statusText} ({qc_stepMetrics.step3.time || 'N/A'})</span></p>
                                 <p><strong>4. Align Assemblies:</strong> <span>{qc_stepMetrics.step4.statusText} ({qc_stepMetrics.step4.time || 'N/A'})</span></p>
                                 <p><strong>5. Create VCF:</strong> <span>{qc_stepMetrics.step5.statusText} ({qc_stepMetrics.step5.time || 'N/A'})</span></p>
                                 <p><strong>6. Load VCF:</strong> <span>{qc_stepMetrics.step6.statusText} ({qc_stepMetrics.step6.time || 'N/A'})</span></p>
                                 {/* Display RAM if available */}
                             </div>
                         </div>
                     </div>

                     {/* Card for Anchorwave Dot Plots */}
                     <div className="styled-card qc-card">
                         <div className="card-header"><h3><FaImage /> Alignment Dot Plots</h3></div>
                         <div className="card-content">
                             <div className="input-group">
                                 <label><FaListOl className="label-icon" />Select Alignment Comparison</label>
                                 <select
                                    className="themed-select"
                                    value={qc_dotPlots.selectedComparison}
                                    onChange={(e) => setQc_dotPlots(prev => ({...prev, selectedComparison: e.target.value}))}
                                    disabled={qc_dotPlots.loading}
                                >
                                     <option value="">Select Comparison...</option>
                                     {/* TODO: Populate with actual available alignment outputs for the project */}
                                     {availableComparisons.map(comp => ( <option key={comp} value={comp}>{comp}</option> ))}
                                 </select>
                             </div>
                             <button
                                className="primary-btn qc-generate-btn"
                                onClick={handleGenerateDotPlot}
                                disabled={qc_dotPlots.loading || !qc_dotPlots.selectedComparison}
                             >
                                {qc_dotPlots.loading ? <><span className="spinner small-spinner"></span> Generating...</> : <><FaImage /> Generate Plot</>}
                             </button>
                             <div className="plot-output-area">
                                 {qc_dotPlots.loading && <span className="spinner"></span>}
                                 {qc_dotPlots.error && <div className="output-area output-error"><FaExclamationTriangle/> {qc_dotPlots.error}</div>}
                                 {qc_dotPlots.plotImageUrl && !qc_dotPlots.loading && !qc_dotPlots.error && (
                                    <img src={qc_dotPlots.plotImageUrl} alt={`Dot plot for ${qc_dotPlots.selectedComparison}`} />
                                 )}
                                 {!qc_dotPlots.plotImageUrl && !qc_dotPlots.loading && !qc_dotPlots.error && (
                                    <p>Select comparison and generate plot.</p>
                                 )}
                             </div>
                         </div>
                     </div>

                     {/* Card for VCF Metrics */}
                     <div className="styled-card qc-card">
                         <div className="card-header"><h3><FaChartBar /> VCF Metrics</h3></div>
                         <div className="card-content">
                             <p style={{color: 'var(--text-muted)', marginBottom: '1rem'}}>Generate and download a report containing quality metrics for the project's VCF file(s).</p>
                             <button
                                className="primary-btn qc-generate-btn"
                                onClick={handleGenerateVcfMetrics}
                                disabled={qc_vcfMetrics.loading}
                             >
                                 {qc_vcfMetrics.loading ? <><span className="spinner small-spinner"></span> Generating...</> : <><FaChartBar /> Generate VCF Metrics</>}
                             </button>
                             <div className="metrics-output-area">
                                {renderQcStatus(qc_vcfMetrics.loading, qc_vcfMetrics.error, qc_vcfMetrics.downloadLink, "Click button to generate metrics report.")}
                             </div>
                         </div>
                     </div>

                 </div> // End QC Cards Grid
            )}
        </div> // End page-container
    );
};

export default QCMetricsPage;