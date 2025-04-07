import React, { useState } from 'react';
// Import specific icons
import {
    FaProjectDiagram, FaPlus, FaCog, FaCompressArrowsAlt,
    FaRulerCombined, FaLink, FaVial, FaDatabase, FaChartLine,
    FaChartBar, FaImage, FaFileDownload, FaCheckCircle, FaExclamationTriangle, FaInfoCircle,
    FaArrowRight, FaFileAlt, FaListOl, FaFileCode, FaToggleOn, FaToggleOff, FaTags, FaPencilAlt,
    FaExpandArrowsAlt, FaArrowsAltH, FaFileCode as FaFileCodeIcon,
} from 'react-icons/fa';
import './Pipeline.css'; // Adjust path if necessary

// Placeholder function to simulate API calls/processing
const simulateProcessing = (duration = 1500) => {
    return new Promise((resolve) => setTimeout(resolve, duration));
};

const Pipeline = () => {
    // --- Global State ---
    const [selectedProject, setSelectedProject] = useState('');
    const [projects, setProjects] = useState(['Rice Genome Analysis', 'Wheat Variant Calling', 'Maize Transposon Study']);
    const [isProcessing, setIsProcessing] = useState({}); // Track loading state for each step { stepId: boolean }

    // --- Mock Data (Replace with API calls) ---
    const availableSequences = ['japonica_chr1.fa', 'indica_chr1.fa', 'aus_chr1.fa', 'reference_genome_v5.fa', 'assembly_contigs.fasta'];
    const availableGffs = ['japonica_genes.gff3', 'reference_genes.gff', 'predicted_models.gff'];
    const availableBeds = ['promoter_regions.bed', 'repeat_mask.bed'];
    const availableComparisons = ['japonica vs indica', 'japonica vs reference_v5'];

    // --- State for Each Pipeline Step ---
    const [step1_prepareFasta, setStep1_prepareFasta] = useState({
        selectedSequences: [],
        outputName: '',
        status: null, // 'success', 'error', 'info', null
        message: '',
        downloadLink: null,
    });

    const [step2_compressFasta, setStep2_compressFasta] = useState({
        selectedSequences: [],
        referenceSequence: '',
        status: null, message: '', downloadLink: null,
    });

    const [step3_createRanges, setStep3_createRanges] = useState({
        gffFile: '',
        referenceFile: '',
        featureType: 'gene', // 'gene' or 'cds'
        rangePad: 1000,
        minRangeSize: 50,
        outputName: '',
        status: null, message: '', downloadLink: null,
    });

    const [step4_alignAssemblies, setStep4_alignAssemblies] = useState({
        gffFile: '',
        referenceFile: '',
        querySequences: [],
        status: null, message: '', downloadLinks: [], // Multiple output files possible
    });

    const [step5_createVcf, setStep5_createVcf] = useState({
        vcfType: 'ref', // 'ref' or 'maf'
        referenceFile: '',
        bedFile: '', // Can be selection or upload path
        status: null, message: '',
    });

    const [step6_loadVcf, setStep6_loadVcf] = useState({
        vcfFileSource: '', // Could be output from step 5 or a selection
        status: null, message: '',
    });

    // --- State for QC Section ---
    const [qc_stepMetrics, setQc_stepMetrics] = useState({
        step1: { ram: null, time: null, statusText: 'Not Run' },
        step2: { ram: null, time: null, statusText: 'Not Run' },
        // ... metrics for other steps
    });
    const [qc_dotPlots, setQc_dotPlots] = useState({
        selectedComparison: '',
        plotImageUrl: null, // URL to the generated image
        loading: false,
        error: null,
    });
    const [qc_vcfMetrics, setQc_vcfMetrics] = useState({
        downloadLink: null,
        loading: false,
        error: null,
    });


    // --- Handlers ---
    const handleCreateProject = () => {
        const newProject = prompt("Enter new project name:", `Project_${projects.length + 1}`);
        if (newProject && !projects.includes(newProject)) {
            setProjects([...projects, newProject]);
            setSelectedProject(newProject);
        } else if (projects.includes(newProject)) {
            alert("Project name already exists!");
        }
    };

    // Generic handler to update state for a step
    const handleStepChange = (stepSetter, field, value) => {
        stepSetter(prev => ({ ...prev, [field]: value }));
    };

    // Generic handler to update multi-select state
    const handleMultiSelectChange = (stepSetter, field, event) => {
         const selectedOptions = Array.from(event.target.selectedOptions, option => option.value);
         stepSetter(prev => ({ ...prev, [field]: selectedOptions }));
    };


    // Placeholder Process Handlers (Replace with actual API calls)
    const handleProcessStep = async (stepId, stepSetter, inputData) => {
        setIsProcessing(prev => ({ ...prev, [stepId]: true }));
        stepSetter(prev => ({ ...prev, status: 'info', message: 'Processing...', downloadLink: null, downloadLinks: [], error: null })); // Reset status
        console.log(`Processing Step ${stepId} with data:`, inputData);

        try {
            await simulateProcessing(); // Simulate backend call
            // Simulate success
            stepSetter(prev => ({
                ...prev,
                status: 'success',
                message: `Step ${stepId} completed successfully.`,
                // Example output link generation
                downloadLink: stepId !== 'step4' ? `/download/${inputData.outputName || 'output'}_step${stepId}.zip` : null,
                downloadLinks: stepId === 'step4' ? ['/download/alignment1.bam', '/download/alignment2.bam'] : [],
            }));
             // Update QC Metrics (Example)
             if (stepId === 'step1') {
                 setQc_stepMetrics(prev => ({...prev, step1: {ram: '1.5GB', time: '30s', statusText: 'Success'}}));
             }
        } catch (error) {
            console.error(`Error processing step ${stepId}:`, error);
            stepSetter(prev => ({ ...prev, status: 'error', message: `Error during step ${stepId}: ${error.message || 'Unknown error'}` }));
        } finally {
            setIsProcessing(prev => ({ ...prev, [stepId]: false }));
        }
    };

    // Placeholder QC Handlers
    const handleGenerateDotPlot = async () => {
        if (!qc_dotPlots.selectedComparison) {
            alert("Please select a comparison for the dot plot.");
            return;
        }
        setQc_dotPlots(prev => ({...prev, loading: true, error: null, plotImageUrl: null}));
        console.log("Generating dot plot for:", qc_dotPlots.selectedComparison);
        try {
            await simulateProcessing(2000);
            // Simulate image URL result
            setQc_dotPlots(prev => ({...prev, plotImageUrl: `https://via.placeholder.com/400x300.png?text=Dot+Plot+${qc_dotPlots.selectedComparison.replace(' ','+')}`}));
        } catch(error) {
             setQc_dotPlots(prev => ({...prev, error: "Failed to generate dot plot."}));
        } finally {
             setQc_dotPlots(prev => ({...prev, loading: false}));
        }
    }

     const handleGenerateVcfMetrics = async () => {
        setQc_vcfMetrics(prev => ({...prev, loading: true, error: null, downloadLink: null}));
        console.log("Generating VCF metrics...");
        try {
            await simulateProcessing(1000);
            // Simulate file link result
            setQc_vcfMetrics(prev => ({...prev, downloadLink: "/download/vcf_metrics_report.txt"}));
        } catch(error) {
             setQc_vcfMetrics(prev => ({...prev, error: "Failed to generate VCF metrics."}));
        } finally {
             setQc_vcfMetrics(prev => ({...prev, loading: false}));
        }
    }

    // Helper to render status message
    const renderStatus = (status, message, downloadLink, downloadLinks) => {
        if (!status) return null;
        const icon = status === 'success' ? <FaCheckCircle /> : status === 'error' ? <FaExclamationTriangle /> : <FaInfoCircle />;
        const linkContent = downloadLinks && downloadLinks.length > 0 ? (
             <ul>
                 {downloadLinks.map((link, index) => (
                    <li key={index}>
                        <a href={link} className="download-link" target="_blank" rel="noopener noreferrer">
                            <FaFileDownload /> Download File {index + 1}
                         </a>
                    </li>
                 ))}
             </ul>
         ) : downloadLink ? (
            <a href={downloadLink} className="download-link" target="_blank" rel="noopener noreferrer">
                <FaFileDownload /> Download Output
             </a>
         ) : null;

        return (
            <div className={`output-area output-${status}`}>
                <span className="status-icon">{icon}</span>
                <span>{message}</span>
                {linkContent}
            </div>
        );
    };


    return (
        <div className="pipeline-container">
            <div className="pipeline-header">
                <h1><FaProjectDiagram className="header-icon" /> Genome Analysis Pipeline</h1>
                <div className="project-controls">
                    <select
                        className="project-select"
                        value={selectedProject}
                        onChange={(e) => setSelectedProject(e.target.value)}
                    >
                        <option value="">Select Project...</option>
                        {projects.map(project => (
                            <option key={project} value={project}>{project}</option>
                        ))}
                    </select>
                    <button className="create-project-btn" onClick={handleCreateProject}>
                        <FaPlus /> Create Project
                    </button>
                </div>
            </div>

            {/* --- Pipeline Step Cards --- */}
            <div className="pipeline-cards">

                {/* 1. Prepare Assembly FASTA files */}
                <div className="pipeline-card">
                    <div className="card-header"><h2><FaFileAlt className="card-icon" /> Prepare Assembly FASTA</h2></div>
                    <div className="card-content">
                        <div className="input-group">
                            <label><FaListOl className="label-icon" />Sequences (Select multiple)</label>
                            {/* User Experience Note: Standard multi-select is basic. Consider using a library like react-select for better UX. */}
                            <select
                                multiple
                                className="multi-select"
                                value={step1_prepareFasta.selectedSequences}
                                onChange={(e) => handleMultiSelectChange(setStep1_prepareFasta, 'selectedSequences', e)}
                                disabled={isProcessing['step1']}
                            >
                                {availableSequences.map(seq => ( <option key={seq} value={seq}>{seq}</option> ))}
                            </select>
                        </div>
                        <div className="input-group">
                            <label><FaPencilAlt className="label-icon" />Output Name (Optional)</label>
                            <input
                                type="text"
                                placeholder="e.g., prepared_assembly"
                                value={step1_prepareFasta.outputName}
                                onChange={(e) => handleStepChange(setStep1_prepareFasta, 'outputName', e.target.value)}
                                disabled={isProcessing['step1']}
                            />
                        </div>
                        {renderStatus(step1_prepareFasta.status, step1_prepareFasta.message, step1_prepareFasta.downloadLink)}
                        <button
                            className="process-btn"
                            onClick={() => handleProcessStep('step1', setStep1_prepareFasta, step1_prepareFasta)}
                            disabled={isProcessing['step1'] || step1_prepareFasta.selectedSequences.length === 0}
                        >
                             {isProcessing['step1'] ? <><span className="spinner small-spinner"></span> Processing...</> : <><FaArrowRight className="btn-icon" /> Prepare Files</>}
                        </button>
                    </div>
                </div>

                {/* 2. Compress FASTA files */}
                <div className="pipeline-card">
                    <div className="card-header"><h2><FaCompressArrowsAlt className="card-icon" /> Compress FASTA Files</h2></div>
                    <div className="card-content">
                         <div className="input-group">
                            <label><FaListOl className="label-icon" />Input Sequences (Select multiple)</label>
                             <select
                                 multiple
                                 className="multi-select"
                                 value={step2_compressFasta.selectedSequences}
                                 onChange={(e) => handleMultiSelectChange(setStep2_compressFasta, 'selectedSequences', e)}
                                 disabled={isProcessing['step2']}
                             >
                                 {/* Should list outputs from Step 1 or available files */}
                                 {availableSequences.map(seq => ( <option key={seq} value={seq}>{seq}</option> ))}
                             </select>
                         </div>
                         <div className="input-group">
                             <label><FaFileAlt className="label-icon" />Reference Sequence</label>
                             <select
                                value={step2_compressFasta.referenceSequence}
                                onChange={(e) => handleStepChange(setStep2_compressFasta, 'referenceSequence', e.target.value)}
                                disabled={isProcessing['step2']}
                             >
                                 <option value="">Select Reference...</option>
                                 {availableSequences.map(seq => ( <option key={seq} value={seq}>{seq}</option> ))}
                             </select>
                         </div>
                          {renderStatus(step2_compressFasta.status, step2_compressFasta.message, step2_compressFasta.downloadLink)}
                         <button
                            className="process-btn"
                            onClick={() => handleProcessStep('step2', setStep2_compressFasta, step2_compressFasta)}
                            disabled={isProcessing['step2'] || step2_compressFasta.selectedSequences.length === 0 || !step2_compressFasta.referenceSequence}
                        >
                             {isProcessing['step2'] ? <><span className="spinner small-spinner"></span> Compressing...</> : <><FaArrowRight className="btn-icon" /> Compress Files</>}
                         </button>
                    </div>
                </div>

                 {/* 3. Create reference ranges */}
                 <div className="pipeline-card">
                     <div className="card-header"><h2><FaRulerCombined className="card-icon" /> Create Reference Ranges</h2></div>
                     <div className="card-content">
                         <div className="input-group">
                             <label><FaFileCode className="label-icon" />Annotation GFF File</label>
                             <select
                                value={step3_createRanges.gffFile}
                                onChange={(e) => handleStepChange(setStep3_createRanges, 'gffFile', e.target.value)}
                                disabled={isProcessing['step3']}
                             >
                                 <option value="">Select GFF File...</option>
                                 {availableGffs.map(file => ( <option key={file} value={file}>{file}</option> ))}
                             </select>
                         </div>
                          <div className="input-group">
                             <label><FaFileAlt className="label-icon" />Reference FASTA File</label>
                             <select
                                value={step3_createRanges.referenceFile}
                                onChange={(e) => handleStepChange(setStep3_createRanges, 'referenceFile', e.target.value)}
                                disabled={isProcessing['step3']}
                            >
                                 <option value="">Select Reference...</option>
                                 {availableSequences.map(seq => ( <option key={seq} value={seq}>{seq}</option> ))}
                             </select>
                         </div>
                         <div className="toggle-group">
                             <label><FaTags className="label-icon"/>Feature Type</label>
                             <div className="toggle-container">
                                 <button
                                    className={`toggle-btn ${step3_createRanges.featureType === 'gene' ? 'active' : ''}`}
                                    onClick={() => handleStepChange(setStep3_createRanges, 'featureType', 'gene')}
                                    disabled={isProcessing['step3']}
                                >Gene</button>
                                 <button
                                    className={`toggle-btn ${step3_createRanges.featureType === 'cds' ? 'active' : ''}`}
                                    onClick={() => handleStepChange(setStep3_createRanges, 'featureType', 'cds')}
                                    disabled={isProcessing['step3']}
                                >CDS</button>
                             </div>
                         </div>
                         <div className="input-group">
                             <label><FaExpandArrowsAlt className="label-icon" />Genome Range Pad (bp)</label>
                              <input
                                type="number"
                                value={step3_createRanges.rangePad}
                                onChange={(e) => handleStepChange(setStep3_createRanges, 'rangePad', e.target.value)}
                                disabled={isProcessing['step3']}
                                min="0"
                             />
                         </div>
                         <div className="input-group">
                             <label><FaArrowsAltH className="label-icon" />Minimum Range Size (bp)</label>
                              <input
                                type="number"
                                value={step3_createRanges.minRangeSize}
                                onChange={(e) => handleStepChange(setStep3_createRanges, 'minRangeSize', e.target.value)}
                                disabled={isProcessing['step3']}
                                min="1"
                            />
                         </div>
                         <div className="input-group">
                             <label><FaPencilAlt className="label-icon" />Output BED File Name</label>
                              <input
                                type="text"
                                placeholder="e.g., gene_ranges"
                                value={step3_createRanges.outputName}
                                onChange={(e) => handleStepChange(setStep3_createRanges, 'outputName', e.target.value)}
                                disabled={isProcessing['step3']}
                            />
                         </div>
                          {renderStatus(step3_createRanges.status, step3_createRanges.message, step3_createRanges.downloadLink)}
                         <button
                            className="process-btn"
                             onClick={() => handleProcessStep('step3', setStep3_createRanges, step3_createRanges)}
                             disabled={isProcessing['step3'] || !step3_createRanges.gffFile || !step3_createRanges.referenceFile || !step3_createRanges.outputName}
                         >
                             {isProcessing['step3'] ? <><span className="spinner small-spinner"></span> Generating...</> : <><FaArrowRight className="btn-icon" /> Generate Ranges</>}
                         </button>
                    </div>
                 </div>

                  {/* 4. Align Assemblies */}
                 <div className="pipeline-card">
                     <div className="card-header"><h2><FaLink className="card-icon" /> Align Assemblies (Anchorwave)</h2></div>
                     <div className="card-content">
                          <div className="input-group">
                             <label><FaFileCode className="label-icon" />Reference GFF File</label>
                             <select disabled={isProcessing['step4']}>
                                 <option value="">Select GFF File...</option>
                                 {availableGffs.map(file => ( <option key={file} value={file}>{file}</option> ))}
                             </select>
                         </div>
                          <div className="input-group">
                             <label><FaFileAlt className="label-icon" />Reference FASTA File</label>
                             <select disabled={isProcessing['step4']}>
                                 <option value="">Select Reference...</option>
                                 {availableSequences.map(seq => ( <option key={seq} value={seq}>{seq}</option> ))}
                             </select>
                         </div>
                         <div className="input-group">
                            <label><FaListOl className="label-icon" />Query Sequences (Select multiple)</label>
                             <select multiple className="multi-select" disabled={isProcessing['step4']}>
                                 {/* List prepared/compressed sequences */}
                                 {availableSequences.map(seq => ( <option key={seq} value={seq}>{seq}</option> ))}
                             </select>
                         </div>
                          {renderStatus(step4_alignAssemblies.status, step4_alignAssemblies.message, null, step4_alignAssemblies.downloadLinks)}
                          <button
                            className="process-btn"
                             onClick={() => handleProcessStep('step4', setStep4_alignAssemblies, step4_alignAssemblies)}
                            disabled={isProcessing['step4']} // Add input validation logic
                         >
                             {isProcessing['step4'] ? <><span className="spinner small-spinner"></span> Aligning...</> : <><FaArrowRight className="btn-icon" /> Run Alignment</>}
                          </button>
                    </div>
                 </div>

                  {/* 5. Create VCF files */}
                 <div className="pipeline-card">
                     <div className="card-header"><h2><FaVial className="card-icon" /> Create VCF Files</h2></div>
                     <div className="card-content">
                          <div className="toggle-group">
                             <label><FaTags className="label-icon"/>VCF Format</label>
                             <div className="toggle-container">
                                 <button
                                     className={`toggle-btn ${step5_createVcf.vcfType === 'ref' ? 'active' : ''}`}
                                     onClick={() => handleStepChange(setStep5_createVcf, 'vcfType', 'ref')}
                                     disabled={isProcessing['step5']}
                                 >Reference VCF</button>
                                  <button
                                     className={`toggle-btn ${step5_createVcf.vcfType === 'maf' ? 'active' : ''}`}
                                     onClick={() => handleStepChange(setStep5_createVcf, 'vcfType', 'maf')}
                                     disabled={isProcessing['step5']}
                                 >MAF</button>
                             </div>
                         </div>
                         <div className="input-group">
                             <label><FaFileAlt className="label-icon" />Reference FASTA File</label>
                             <select
                                value={step5_createVcf.referenceFile}
                                onChange={(e) => handleStepChange(setStep5_createVcf, 'referenceFile', e.target.value)}
                                disabled={isProcessing['step5']}
                            >
                                 <option value="">Select Reference...</option>
                                 {availableSequences.map(seq => ( <option key={seq} value={seq}>{seq}</option> ))}
                             </select>
                         </div>
                         <div className="input-group">
                             <label><FaFileCode className="label-icon" />BED File / Region</label>
                             <select
                                value={step5_createVcf.bedFile}
                                onChange={(e) => handleStepChange(setStep5_createVcf, 'bedFile', e.target.value)}
                                disabled={isProcessing['step5']}
                            >
                                 <option value="">Select BED File (Optional)...</option>
                                 {availableBeds.map(bed => ( <option key={bed} value={bed}>{bed}</option> ))}
                                 {/* Add option for upload? */}
                             </select>
                         </div>
                          {renderStatus(step5_createVcf.status, step5_createVcf.message)}
                          <button
                            className="process-btn"
                            onClick={() => handleProcessStep('step5', setStep5_createVcf, step5_createVcf)}
                            disabled={isProcessing['step5'] || !step5_createVcf.referenceFile} // Add more validation
                         >
                             {isProcessing['step5'] ? <><span className="spinner small-spinner"></span> Generating...</> : <><FaArrowRight className="btn-icon" /> Create VCF</>}
                          </button>
                    </div>
                 </div>

                  {/* 6. Load VCF data into DBs */}
                 <div className="pipeline-card">
                     <div className="card-header"><h2><FaDatabase className="card-icon" /> Load VCF to Database</h2></div>
                     <div className="card-content">
                         <div className="input-group">
                             <label><FaFileAlt className="label-icon" />VCF File Source</label>
                             <select
                                value={step6_loadVcf.vcfFileSource}
                                onChange={(e) => handleStepChange(setStep6_loadVcf, 'vcfFileSource', e.target.value)}
                                disabled={isProcessing['step6']}
                            >
                                 <option value="">Select VCF Source...</option>
                                 {/* List outputs from step 5 or allow selection/upload */}
                                 <option value="output_step5">Output from VCF Creation Step</option>
                                 <option value="variants.vcf.gz">variants.vcf.gz (Example)</option>
                             </select>
                         </div>
                          {renderStatus(step6_loadVcf.status, step6_loadVcf.message)}
                          <button
                            className="process-btn"
                            onClick={() => handleProcessStep('step6', setStep6_loadVcf, step6_loadVcf)}
                            disabled={isProcessing['step6'] || !step6_loadVcf.vcfFileSource}
                         >
                            {isProcessing['step6'] ? <><span className="spinner small-spinner"></span> Loading...</> : <><FaArrowRight className="btn-icon" /> Load Data</>}
                          </button>
                    </div>
                 </div>


            </div> {/* End Pipeline Cards */}


            {/* --- QC Metrics Section --- */}
            {/* Note: Consider moving this to a separate Route/Component */}
            <div className="qc-section">
                <h2><FaChartLine className="header-icon" /> Quality Control & Visualization</h2>
                <div className="qc-cards">

                    {/* Card for Step Metrics */}
                    <div className="qc-card">
                         <h3>Pipeline Step Metrics</h3>
                         <div className="metrics">
                             <p><strong>Prepare FASTA:</strong> <span>{qc_stepMetrics.step1.statusText} ({qc_stepMetrics.step1.time || 'N/A'})</span></p>
                             <p><strong>Compress FASTA:</strong> <span>{qc_stepMetrics.step2.statusText} ({qc_stepMetrics.step2.time || 'N/A'})</span></p>
                             {/* Add metrics for other steps */}
                         </div>
                         {/* Optionally add a button to refresh metrics */}
                    </div>

                     {/* Card for Anchorwave Dot Plots */}
                     <div className="qc-card">
                         <h3>Anchorwave Dot Plots</h3>
                         <div className="input-group">
                             <label>Select Comparison:</label>
                             <select
                                value={qc_dotPlots.selectedComparison}
                                onChange={(e) => setQc_dotPlots(prev => ({...prev, selectedComparison: e.target.value}))}
                                disabled={qc_dotPlots.loading}
                            >
                                 <option value="">Select Comparison...</option>
                                 {availableComparisons.map(comp => ( <option key={comp} value={comp}>{comp}</option> ))}
                             </select>
                         </div>
                         <button
                            className="generate-btn"
                            onClick={handleGenerateDotPlot}
                            disabled={qc_dotPlots.loading || !qc_dotPlots.selectedComparison}
                         >
                            {qc_dotPlots.loading ? <><span className="spinner small-spinner"></span> Generating...</> : <><FaImage /> Generate Plot</>}
                         </button>
                         <div className="plot-output">
                             {qc_dotPlots.loading && <span className="spinner"></span>}
                             {qc_dotPlots.error && <div className="output-error">{qc_dotPlots.error}</div>}
                             {qc_dotPlots.plotImageUrl && !qc_dotPlots.loading && !qc_dotPlots.error && (
                                <img src={qc_dotPlots.plotImageUrl} alt={`Dot plot for ${qc_dotPlots.selectedComparison}`} />
                             )}
                             {!qc_dotPlots.plotImageUrl && !qc_dotPlots.loading && !qc_dotPlots.error && (
                                <p>Select comparison and generate plot.</p>
                             )}
                         </div>
                     </div>

                     {/* Card for VCF Metrics */}
                     <div className="qc-card">
                         <h3>VCF Metrics</h3>
                         <button
                            className="generate-btn"
                            onClick={handleGenerateVcfMetrics}
                            disabled={qc_vcfMetrics.loading}
                         >
                             {qc_vcfMetrics.loading ? <><span className="spinner small-spinner"></span> Generating...</> : <><FaChartBar /> Generate VCF Metrics</>}
                         </button>
                         <div className="metrics-output">
                              {qc_vcfMetrics.loading && <span className="spinner"></span>}
                              {qc_vcfMetrics.error && <div className="output-error">{qc_vcfMetrics.error}</div>}
                              {qc_vcfMetrics.downloadLink && !qc_vcfMetrics.loading && !qc_vcfMetrics.error && (
                                <div className="output-success">
                                     <a href={qc_vcfMetrics.downloadLink} className="download-link" target="_blank" rel="noopener noreferrer">
                                         <FaFileDownload /> Download VCF Metrics Report
                                     </a>
                                </div>
                              )}
                              {!qc_vcfMetrics.downloadLink && !qc_vcfMetrics.loading && !qc_vcfMetrics.error && (
                                 <p>Click button to generate metrics report.</p>
                              )}
                         </div>
                     </div>

                </div> {/* End QC Cards */}
            </div> {/* End QC Section */}


        </div> // End pipeline-container
    );
};

export default Pipeline;