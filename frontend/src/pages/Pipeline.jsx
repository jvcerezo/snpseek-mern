import React, { useState, useEffect } from 'react';
import { fetchDirectorySequences,fetchDirectoryProjects, fetchDirectoryAvailableGff, fetchProjectsUpdatedAssemblies} from "../api"
import {
    FaProjectDiagram, FaPlus, FaCog, FaCompressArrowsAlt, FaFileAlt, FaListOl, FaPencilAlt,
    FaRulerCombined, FaLink, FaVial, FaDatabase, FaFileCode, 
    FaTags, FaExpandArrowsAlt, FaArrowsAltH, FaToggleOn, FaToggleOff, FaArrowRight,
    FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaFileDownload
} from 'react-icons/fa';
import './Pipeline.css'; 

// Placeholder function to simulate API calls/processing
const simulateProcessing = (duration = 1500) => {
    return new Promise((resolve, reject) => {
        const success = Math.random() > 0.15; 
        setTimeout(() => {
            if (success) {
                resolve({ message: "Processing complete." });
            } else {
                reject(new Error("Simulated processing failure."));
            }
        }, duration);
    });
};

const handleFiles = async (e) => {
    e.preventDefault(); // Prevent default form submission
//     setIsLoading(true);
//     setError("");
//     try {
//         // Basic validation client-side
//         if (!identifier || !password) {
//             throw new Error("Username/Email and password are required.");
//         }
//         await login({ identifier, password }); // <-- 4. CALL context's login function
//         console.log("Login component: Context login successful. Waiting for navigation effect...");


//     } catch (err) {
//          // Use err.message provided by the api.js error handling (passed through context)
//         setError(err?.message || "Login failed. Please check credentials.");
//         console.error("Login component error:", err);
//     } finally {
//         setIsLoading(false);
//     }
};



const Pipeline = () => {
    // --- Global State ---
    const [selectedProject, setSelectedProject] = useState(localStorage.getItem('Project'));
    // const [projects, setProjects] = useState(['Rice Genome Analysis', 'Wheat Variant Calling', 'Maize Transposon Study']);
    const [projects, setProjects] = useState([]);
    const [isProcessing, setIsProcessing] = useState({}); // Track loading state for each step { stepId: boolean }

    // --- Mock Data (Replace with API calls based on selectedProject) ---
    // const availableSequences = ['japonica_chr1.fa', 'indica_chr1.fa', 'aus_chr1.fa', 'reference_genome_v5.fa', 'assembly_contigs.fasta'];
    const [availableSequences, setAvailableSequences] = useState([]);
    const [updatedSequences, setUpdatedSequences] = useState([]);
    // const availableGffs = ['japonica_genes.gff3', 'reference_genes.gff', 'predicted_models.gff']; 
    const [availableGffs, setAvailableGffs] = useState([]);
    const availableBeds = ['promoter_regions.bed', 'repeat_mask.bed'];
    // Source files for steps (should be dynamically determined)

    const sourcesForStep2 = updatedSequences;
    const sourcesForStep4Queries = updatedSequences;
    const sourcesForStep5VCF = ['output_step4_alignment.bam', 'variants.vcf.gz'];
    const sourcesForStep6Load = ['output_step5.vcf.gz'];


    // --- State for Each Pipeline Step ---
    const [step1_prepareFasta, setStep1_prepareFasta] = useState({
        selectedSequences: [], outputName: `prepared_${selectedProject || 'assembly'}`,
        status: null, message: '', downloadLink: null,
    });
    const [step2_compressFasta, setStep2_compressFasta] = useState({
        selectedSequences: [], referenceSequence: '', outputName: `compressed_${selectedProject || 'assembly'}`,
        status: null, message: '', downloadLink: null,
    });
    const [step3_createRanges, setStep3_createRanges] = useState({
        gffFile: '', referenceFile: '', featureType: 'gene', rangePad: 1000, minRangeSize: 50, outputName: `ranges_${selectedProject || 'ref'}`,
        status: null, message: '', downloadLink: null,
    });
    const [step4_alignAssemblies, setStep4_alignAssemblies] = useState({
        gffFile: '', referenceFile: '', querySequences: [], outputPrefix: `aligned_${selectedProject || 'run'}`,
        status: null, message: '', downloadLinks: [],
    });
    const [step5_createVcf, setStep5_createVcf] = useState({
        vcfType: 'ref', referenceFile: '', bedFile: '', outputName: `variants_${selectedProject || 'set'}`,
        status: null, message: '', downloadLink: null,
    });
    const [step6_loadVcf, setStep6_loadVcf] = useState({
        vcfFileSource: '', status: null, message: '',
    });

    //fethcing available sequences
    useEffect(() => {
        const fetchSequences = async () => {
            try {
                const response = await fetchDirectorySequences(); // Replace with your actual API endpoint
                if (!(200 <= response.status_code < 400)) throw new Error("Failed to fetch sequences");
                const data = await response; // Assuming the API returns a JSON array
                setAvailableSequences(data.Files);
            } catch (error) {
                console.error("Error fetching sequences:", error);
            }
        };
    
        fetchSequences(); // Run on mount

    }, []);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const response = await fetchDirectoryProjects(); // Replace with your actual API endpoint
                if (!(200 <= response.status_code < 400)) throw new Error("Failed to fetch projects");
                const data = await response; // Assuming the API returns a JSON array
                setProjects(data.Files);
            } catch (error) {
                console.error("Error fetching sequences:", error);
            }
        };
    
        fetchProjects(); // Run on mount

    }, []);

    useEffect(() => {
        const fetchGffs = async () => {
            try {
                const response = await fetchDirectoryAvailableGff(); // Replace with your actual API endpoint
                if (!(200 <= response.status_code < 400)) throw new Error("Failed to fetch projects");
                const data = await response; // Assuming the API returns a JSON array
                setAvailableGffs(data.Files);
            } catch (error) {
                console.error("Error fetching sequences:", error);
            }
        };
    
        fetchGffs(); // Run on mount

    }, []);

    useEffect(() => {
        const fetchUpdatedAssemblies = async () => {
            try {
                const response = await fetchProjectsUpdatedAssemblies(selectedProject); // Replace with your actual API endpoint
                if (!(200 <= response.status_code < 400)) throw new Error("Failed to fetch projects");
                const data = await response; // Assuming the API returns a JSON array
                setUpdatedSequences(data.Files);
            } catch (error) {
                console.error("Error fetching sequences:", error);
            }
        };
    
        fetchUpdatedAssemblies(); // Run on mount

    }, [selectedProject]);


    // --- Handlers ---
    const handleCreateProject = () => {
        const newProject = prompt("Enter new project name:", `Project_${projects.length + 1}`);
        if (newProject && newProject.trim() && !projects.includes(newProject.trim())) {
             const trimmedProjectName = newProject.trim();
            setProjects([...projects, trimmedProjectName]);
            setSelectedProject(trimmedProjectName);
             // TODO: Add API call to create project on backend
        } else if (newProject && projects.includes(newProject.trim())) {
            alert("Project name already exists!");
        }
    };

    const handleStepChange = (stepSetter, field, value) => {
        stepSetter(prev => ({ ...prev, [field]: value, status: null, message: '', downloadLink: null, downloadLinks: [] }));
    };
    const handleMultiSelectChange = (stepSetter, field, event) => {
         const selectedOptions = Array.from(event.target.selectedOptions, option => option.value);
         stepSetter(prev => ({ ...prev, [field]: selectedOptions, status: null, message: '', downloadLink: null, downloadLinks: [] }));
    };
     const handleToggleChange = (stepSetter, field, newValue) => {
        stepSetter(prev => ({ ...prev, [field]: newValue, status: null, message: '', downloadLink: null, downloadLinks: [] }));
    }

    const handleProcessStep = async (stepId, stepSetter, inputData) => {
        if (!selectedProject) {
             alert("Please select or create a project first.");
             return;
        }
        setIsProcessing(prev => ({ ...prev, [stepId]: true }));
        const outputName = inputData.outputName || inputData.outputPrefix || `${stepId}_${selectedProject}_${Date.now()}`; // Use provided name/prefix or generate one
        const processingInput = { ...inputData, outputName: outputName, project: selectedProject };

        stepSetter(prev => ({ ...prev, status: 'info', message: 'Processing request...', downloadLink: null, downloadLinks: [], error: null }));
        console.log(`Processing Step ${stepId} for project ${selectedProject} with data:`, processingInput);

        try {
            await simulateProcessing();
            let successData = {
                status: 'success',
                message: `Step ${stepId} completed successfully.`,
                downloadLink: null,
                downloadLinks: []
            };
            if (['step1', 'step2', 'step3', 'step5'].includes(stepId)) {
                 successData.downloadLink = `/api/download/${selectedProject}/${outputName}.zip`; // Example download link
            } else if (stepId === 'step4') {
                 successData.downloadLinks = [
                    `/api/download/${selectedProject}/${outputName}_alignment1.bam`,
                    `/api/download/${selectedProject}/${outputName}_alignment2.bam`
                 ];
            }
            stepSetter(prev => ({ ...prev, ...successData }));
            // TODO: Update global state or notify QC page that results are ready/updated
        } catch (error) {
            console.error(`Error processing step ${stepId}:`, error);
            stepSetter(prev => ({ ...prev, status: 'error', message: `Error during step ${stepId}: ${error.message || 'Unknown error'}` }));
        } finally {
            setIsProcessing(prev => ({ ...prev, [stepId]: false }));
        }
    };

     const renderStatus = (status, message, downloadLink, downloadLinks) => {
        if (!status) return null;
        let icon;
        switch(status) {
            case 'success': icon = <FaCheckCircle />; break;
            case 'error': icon = <FaExclamationTriangle />; break;
            case 'info': icon = <FaInfoCircle />; break;
            case 'warning': icon = <FaExclamationTriangle />; break;
            default: icon = <FaInfoCircle />;
        }
        const linkContent = downloadLinks && downloadLinks.length > 0 ? (
             <ul style={{ listStyle: 'none', paddingLeft: 0, marginTop: '0.5rem' }}>
                 {downloadLinks.map((link, index) => (
                    <li key={index} style={{marginTop: '0.25rem'}}>
                        <a href={link} className="download-link" target="_blank" rel="noopener noreferrer">
                            <FaFileDownload /> Download File {index + 1}
                         </a>
                    </li>
                 ))}
             </ul>
         ) : downloadLink ? (
            <div style={{marginTop: '0.5rem'}}>
                 <a href={downloadLink} className="download-link" target="_blank" rel="noopener noreferrer">
                     <FaFileDownload /> Download Output File
                 </a>
            </div>
         ) : null;
        return (
            <div className={`output-area output-${status}`}>
                <span className="status-icon">{icon}</span>
                <span>{message}</span>
                {linkContent}
            </div>
        );
    };

    const isStepDisabled = (stepId) => isProcessing[stepId] || !selectedProject;

    return (
        <div className="page-container pipeline-steps-container">
            <div className="page-header">
                <h1><FaProjectDiagram className="header-icon" /> Genome Analysis Pipeline</h1>
                <div className="page-controls">
                    <select
                        className="themed-select project-select"
                        value={selectedProject}
                        onChange={(e) => {
                            const selectedValue = e.target.value;
                            setSelectedProject(selectedValue);
                            localStorage.setItem('Project', selectedValue);
                          }}
                    >
                        <option value="">Select Project...</option>
                        {projects.map(project => (
                            <option key={project} value={project}>{project}</option>
                        ))}
                    </select>
                    <button className="primary-btn create-project-btn" onClick={handleCreateProject}>
                        <FaPlus /> Create Project
                    </button>
                </div>
            </div>

            {!selectedProject && (
                 <div className="output-area output-info" style={{marginBottom: '2rem'}}>
                    <FaInfoCircle /> Please select or create a project to start the pipeline.
                 </div>
             )}

            {/* --- Pipeline Step Cards --- */}
            <div className="cards-grid pipeline-cards">

                {/* Card 1: Prepare FASTA */}
                <div className="styled-card pipeline-card">
                    <div className="card-header"><h2><FaFileAlt className="card-icon" /> 1. Prepare FASTA</h2></div>
                    <div className="card-content">
                        <div className="input-group">
                            <label><FaListOl className="label-icon" />Input Sequences</label>
                            <select multiple className="multi-select"
                                value={step1_prepareFasta.selectedSequences}
                                onChange={(e) => handleMultiSelectChange(setStep1_prepareFasta, 'selectedSequences', e)}
                                disabled={isStepDisabled('step1')}>
                                {availableSequences.map(seq => ( <option key={seq} value={seq}>{seq}</option> ))}
                            </select>
                             <small style={{color: 'var(--text-muted)', marginTop: '0.3rem'}}>Hold Ctrl/Cmd to select multiple.</small>
                        </div>
                        <div className="input-group">
                            <label><FaPencilAlt className="label-icon" />Output Name Prefix</label>
                            <input type="text" placeholder="e.g., prepared_assembly"
                                value={step1_prepareFasta.outputName}
                                onChange={(e) => handleStepChange(setStep1_prepareFasta, 'outputName', e.target.value)}
                                disabled={isStepDisabled('step1')} />
                        </div>
                        {renderStatus(step1_prepareFasta.status, step1_prepareFasta.message, step1_prepareFasta.downloadLink)}
                        <button className="process-btn primary-btn"
                            onClick={() => handleProcessStep('step1', setStep1_prepareFasta, step1_prepareFasta)}
                            disabled={isStepDisabled('step1') || step1_prepareFasta.selectedSequences.length === 0}>
                             {isProcessing['step1'] ? <><span className="spinner small-spinner"></span> Processing...</> : <><FaArrowRight className="btn-icon" /> Run Prepare</>}
                        </button>
                    </div>
                </div>

                {/* Card 2: Compress FASTA */}
                <div className="styled-card pipeline-card">
                    <div className="card-header"><h2><FaCompressArrowsAlt className="card-icon" /> 2. Compress FASTA</h2></div>
                    <div className="card-content">
                         <div className="input-group">
                            <label><FaListOl className="label-icon" />Input Sequences</label>
                             <select multiple className="multi-select"
                                 value={step2_compressFasta.selectedSequences}
                                 onChange={(e) => handleMultiSelectChange(setStep2_compressFasta, 'selectedSequences', e)}
                                 disabled={isStepDisabled('step2')}>
                                 {sourcesForStep2.map(seq => ( <option key={seq} value={seq}>{seq}</option> ))}
                             </select>
                         </div>
                         <div className="input-group">
                             <label><FaFileAlt className="label-icon" />Reference Sequence</label>
                             <select value={step2_compressFasta.referenceSequence}
                                onChange={(e) => handleStepChange(setStep2_compressFasta, 'referenceSequence', e.target.value)}
                                disabled={isStepDisabled('step2')}>
                                 <option value="">Select Reference...</option>
                                 {availableSequences.map(seq => ( <option key={seq} value={seq}>{seq}</option> ))}
                             </select>
                         </div>
                          <div className="input-group">
                             <label><FaPencilAlt className="label-icon" />Output Name Prefix</label>
                             <input type="text" placeholder="e.g., compressed_assembly"
                                value={step2_compressFasta.outputName}
                                onChange={(e) => handleStepChange(setStep2_compressFasta, 'outputName', e.target.value)}
                                disabled={isStepDisabled('step2')} />
                         </div>
                          {renderStatus(step2_compressFasta.status, step2_compressFasta.message, step2_compressFasta.downloadLink)}
                         <button className="process-btn primary-btn"
                            onClick={() => handleProcessStep('step2', setStep2_compressFasta, step2_compressFasta)}
                            disabled={isStepDisabled('step2') || step2_compressFasta.selectedSequences.length === 0 || !step2_compressFasta.referenceSequence}>
                             {isProcessing['step2'] ? <><span className="spinner small-spinner"></span> Compressing...</> : <><FaArrowRight className="btn-icon" /> Run Compress</>}
                         </button>
                    </div>
                </div>

                 {/* Card 3: Create Ranges */}
                 <div className="styled-card pipeline-card">
                     <div className="card-header"><h2><FaRulerCombined className="card-icon" /> 3. Create Ranges</h2></div>
                     <div className="card-content">
                         <div className="input-group">
                             {/* Corrected Icon Usage */}
                             <label><FaFileCode className="label-icon" />Annotation GFF</label>
                             <select value={step3_createRanges.gffFile}
                                onChange={(e) => handleStepChange(setStep3_createRanges, 'gffFile', e.target.value)}
                                disabled={isStepDisabled('step3')}>
                                 <option value="">Select GFF File...</option>
                                 {availableGffs.map(file => ( <option key={file} value={file}>{file}</option> ))}
                             </select>
                         </div>
                          <div className="input-group">
                             <label><FaFileAlt className="label-icon" />Reference FASTA</label>
                             <select value={step3_createRanges.referenceFile}
                                onChange={(e) => handleStepChange(setStep3_createRanges, 'referenceFile', e.target.value)}
                                disabled={isStepDisabled('step3')}>
                                 <option value="">Select Reference...</option>
                                 {availableSequences.map(seq => ( <option key={seq} value={seq}>{seq}</option> ))}
                             </select>
                         </div>
                         <div className="toggle-group">
                             <label><FaTags className="label-icon"/>Feature Type</label>
                             <div className="toggle-container">
                                 <button className={`toggle-btn ${step3_createRanges.featureType === 'gene' ? 'active' : ''}`}
                                    onClick={() => handleToggleChange(setStep3_createRanges, 'featureType', 'gene')}
                                    disabled={isStepDisabled('step3')}>Gene</button>
                                 <button className={`toggle-btn ${step3_createRanges.featureType === 'cds' ? 'active' : ''}`}
                                    onClick={() => handleToggleChange(setStep3_createRanges, 'featureType', 'cds')}
                                    disabled={isStepDisabled('step3')}>CDS</button>
                             </div>
                         </div>
                         <div className="input-group">
                             <label><FaExpandArrowsAlt className="label-icon" />Range Pad (bp)</label>
                              <input type="number" value={step3_createRanges.rangePad}
                                onChange={(e) => handleStepChange(setStep3_createRanges, 'rangePad', parseInt(e.target.value, 10) || 0)}
                                disabled={isStepDisabled('step3')} min="0" />
                         </div>
                         <div className="input-group">
                             <label><FaArrowsAltH className="label-icon" />Min Range Size (bp)</label>
                              <input type="number" value={step3_createRanges.minRangeSize}
                                onChange={(e) => handleStepChange(setStep3_createRanges, 'minRangeSize', parseInt(e.target.value, 10) || 1)}
                                disabled={isStepDisabled('step3')} min="1" />
                         </div>
                         <div className="input-group">
                             <label><FaPencilAlt className="label-icon" />Output BED Name</label>
                              <input type="text" placeholder="e.g., gene_ranges" value={step3_createRanges.outputName}
                                onChange={(e) => handleStepChange(setStep3_createRanges, 'outputName', e.target.value)}
                                disabled={isStepDisabled('step3')} required/>
                         </div>
                          {renderStatus(step3_createRanges.status, step3_createRanges.message, step3_createRanges.downloadLink)}
                         <button className="process-btn primary-btn"
                             onClick={() => handleProcessStep('step3', setStep3_createRanges, step3_createRanges)}
                             disabled={isStepDisabled('step3') || !step3_createRanges.gffFile || !step3_createRanges.referenceFile || !step3_createRanges.outputName}>
                             {isProcessing['step3'] ? <><span className="spinner small-spinner"></span> Generating...</> : <><FaArrowRight className="btn-icon" /> Generate Ranges</>}
                         </button>
                    </div>
                 </div>

                {/* Card 4: Align Assemblies */}
                <div className="styled-card pipeline-card">
                     <div className="card-header"><h2><FaLink className="card-icon" /> 4. Align Assemblies</h2></div>
                     <div className="card-content">
                          <div className="input-group">
                              {/* Corrected Icon Usage */}
                             <label><FaFileCode className="label-icon" />Reference GFF</label>
                             <select value={step4_alignAssemblies.gffFile}
                                onChange={(e) => handleStepChange(setStep4_alignAssemblies, 'gffFile', e.target.value)}
                                disabled={isStepDisabled('step4')}>
                                 <option value="">Select GFF File...</option>
                                 {availableGffs.map(file => ( <option key={file} value={file}>{file}</option> ))}
                             </select>
                         </div>
                          <div className="input-group">
                             <label><FaFileAlt className="label-icon" />Reference FASTA</label>
                             <select value={step4_alignAssemblies.referenceFile}
                                onChange={(e) => handleStepChange(setStep4_alignAssemblies, 'referenceFile', e.target.value)}
                                disabled={isStepDisabled('step4')}>
                                 <option value="">Select Reference...</option>
                                 {availableSequences.map(seq => ( <option key={seq} value={seq}>{seq}</option> ))}
                             </select>
                         </div>
                         <div className="input-group">
                            <label><FaListOl className="label-icon" />Query Sequences</label>
                             <select multiple className="multi-select"
                                value={step4_alignAssemblies.querySequences}
                                onChange={(e) => handleMultiSelectChange(setStep4_alignAssemblies, 'querySequences', e)}
                                disabled={isStepDisabled('step4')}>
                                 {sourcesForStep4Queries.map(seq => ( <option key={seq} value={seq}>{seq}</option> ))}
                             </select>
                         </div>
                          <div className="input-group">
                             <label><FaPencilAlt className="label-icon" />Output Files Prefix</label>
                              <input type="text" placeholder="e.g., aligned_run" value={step4_alignAssemblies.outputPrefix}
                                onChange={(e) => handleStepChange(setStep4_alignAssemblies, 'outputPrefix', e.target.value)}
                                disabled={isStepDisabled('step4')} required/>
                         </div>
                          {renderStatus(step4_alignAssemblies.status, step4_alignAssemblies.message, null, step4_alignAssemblies.downloadLinks)}
                          <button className="process-btn primary-btn"
                            onClick={() => handleProcessStep('step4', setStep4_alignAssemblies, step4_alignAssemblies)}
                            disabled={isStepDisabled('step4') || !step4_alignAssemblies.referenceFile || !step4_alignAssemblies.gffFile || step4_alignAssemblies.querySequences.length === 0 || !step4_alignAssemblies.outputPrefix}>
                             {isProcessing['step4'] ? <><span className="spinner small-spinner"></span> Aligning...</> : <><FaArrowRight className="btn-icon" /> Run Alignment</>}
                          </button>
                    </div>
                 </div>

                {/* Card 5: Create VCF */}
                 <div className="styled-card pipeline-card">
                     <div className="card-header"><h2><FaVial className="card-icon" /> 5. Create VCF</h2></div>
                     <div className="card-content">
                          <div className="toggle-group">
                             <label><FaTags className="label-icon"/>Format</label>
                             <div className="toggle-container">
                                 <button className={`toggle-btn ${step5_createVcf.vcfType === 'ref' ? 'active' : ''}`}
                                     onClick={() => handleToggleChange(setStep5_createVcf, 'vcfType', 'ref')}
                                     disabled={isStepDisabled('step5')}>Ref VCF</button>
                                  <button className={`toggle-btn ${step5_createVcf.vcfType === 'maf' ? 'active' : ''}`}
                                     onClick={() => handleToggleChange(setStep5_createVcf, 'vcfType', 'maf')}
                                     disabled={isStepDisabled('step5')}>MAF</button>
                             </div>
                         </div>
                         <div className="input-group">
                             <label><FaFileAlt className="label-icon" />Reference FASTA</label>
                             <select value={step5_createVcf.referenceFile}
                                onChange={(e) => handleStepChange(setStep5_createVcf, 'referenceFile', e.target.value)}
                                disabled={isStepDisabled('step5')}>
                                 <option value="">Select Reference...</option>
                                 {availableSequences.map(seq => ( <option key={seq} value={seq}>{seq}</option> ))}
                             </select>
                         </div>
                         <div className="input-group">
                             {/* Corrected Icon Usage */}
                             <label><FaFileCode className="label-icon" />Input BED File/Regions</label>
                             <select value={step5_createVcf.bedFile}
                                onChange={(e) => handleStepChange(setStep5_createVcf, 'bedFile', e.target.value)}
                                disabled={isStepDisabled('step5')}>
                                 <option value="">Select Input Ranges...</option>
                                 {availableBeds.map(bed => ( <option key={bed} value={bed}>{bed}</option> ))}
                             </select>
                         </div>
                           <div className="input-group">
                             <label><FaPencilAlt className="label-icon" />Output Name Prefix</label>
                              <input type="text" placeholder="e.g., variants_set" value={step5_createVcf.outputName}
                                onChange={(e) => handleStepChange(setStep5_createVcf, 'outputName', e.target.value)}
                                disabled={isStepDisabled('step5')} required/>
                         </div>
                          {renderStatus(step5_createVcf.status, step5_createVcf.message, step5_createVcf.downloadLink)}
                          <button className="process-btn primary-btn"
                            onClick={() => handleProcessStep('step5', setStep5_createVcf, step5_createVcf)}
                            disabled={isStepDisabled('step5') || !step5_createVcf.referenceFile || !step5_createVcf.bedFile || !step5_createVcf.outputName}>
                             {isProcessing['step5'] ? <><span className="spinner small-spinner"></span> Generating...</> : <><FaArrowRight className="btn-icon" /> Create VCF</>}
                          </button>
                    </div>
                 </div>

                {/* Card 6: Load VCF */}
                 <div className="styled-card pipeline-card">
                     <div className="card-header"><h2><FaDatabase className="card-icon" /> 6. Load VCF</h2></div>
                     <div className="card-content">
                         <div className="input-group">
                             <label><FaFileAlt className="label-icon" />VCF File Source</label>
                             <select value={step6_loadVcf.vcfFileSource}
                                onChange={(e) => handleStepChange(setStep6_loadVcf, 'vcfFileSource', e.target.value)}
                                disabled={isStepDisabled('step6')}>
                                 <option value="">Select VCF Source...</option>
                                 {sourcesForStep6Load.map(src => (<option key={src} value={src}>{src}</option>))}
                             </select>
                         </div>
                          {renderStatus(step6_loadVcf.status, step6_loadVcf.message)}
                          <button className="process-btn primary-btn"
                            onClick={() => handleProcessStep('step6', setStep6_loadVcf, step6_loadVcf)}
                            disabled={isStepDisabled('step6') || !step6_loadVcf.vcfFileSource}>
                            {isProcessing['step6'] ? <><span className="spinner small-spinner"></span> Loading...</> : <><FaArrowRight className="btn-icon" /> Load Data</>}
                          </button>
                    </div>
                 </div>

            </div> {/* End Pipeline Cards Grid */}

        </div> // End page-container
    );
};

export default Pipeline;