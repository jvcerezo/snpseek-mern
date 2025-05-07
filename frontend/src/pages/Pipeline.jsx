import React, { useState, useEffect, useCallback } from "react";
import { Toaster, toast } from "sonner"; // For notifications
import { saveAs } from 'file-saver'; // For downloading files
import api from "../api"; // Adjust path as needed

import './Pipeline.css';

// --- SVG Chevron Icon ---
const ChevronDownIcon = ({ className = "w-5 h-5", open }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
    // Apply className for potential utility classes, but base style in CSS
    className={`${className} phg-dropdown-icon transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
    style={{ flexShrink: 0 }}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
  </svg>
);

// --- Main Pipeline Component ---
const Pipeline = () => {
    // --- State ---
    const [projects, setProjects] = useState([]);
    const [projectName, setProjectName] = useState("");
    const [isSubmittingProjectCreation, setIsSubmittingProjectCreation] = useState(false);
    const [selectedProjectForDownload, setSelectedProjectForDownload] = useState("");
    const [isDownloading, setIsDownloading] = useState(false);
    const [formData, setFormData] = useState({
        project: "", selectedSequences: [], gff: "", reference: "",
        boundary: "", minRangeSize: "", pad: "",
    });
    const [errors, setErrors] = useState({});
    const [isSubmittingPipeline, setIsSubmittingPipeline] = useState(false);
    const [showProjectDropdown, setShowProjectDropdown] = useState(false);
    const [showSequencesDropdown, setShowSequencesDropdown] = useState(false);
    const [showGffDropdown, setShowGffDropdown] = useState(false);
    const [showReferenceDropdown, setShowReferenceDropdown] = useState(false);
    const [showBoundaryDropdown, setShowBoundaryDropdown] = useState(false);

    // --- Constants ---
    const sequenceOptions = [
        { value: "Ref.fa", label: "Ref.fa" }, { value: "LineA.fa", label: "LineA.fa" },
        { value: "LineB.fa", label: "LineB.fa" },
    ];
    const gffOptions = ["anchors.gff"];
    const boundaryOptions = ["gene", "cds"];

    // --- Effects ---
    const fetchProjects = useCallback(async () => {
        try {
            console.log("Fetching projects...");
            const res = await api.get('/api/PHG/pipeline/get-directory-projects');
            if (res.data?.Files && Array.isArray(res.data.Files)) {
                setProjects(res.data.Files);
                console.log("Projects fetched:", res.data.Files);
            } else {
                setProjects([]);
                console.warn("No projects found or unexpected format:", res.data);
            }
        } catch (error) {
            toast.error("An error occurred while fetching projects");
            console.error("Fetch projects error:", error);
            setProjects([]);
        }
    }, []);

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects, isSubmittingProjectCreation]);

    // --- Helper Functions ---
    const pollLogStatus = async (endpoint, projectName, maxRetries = 20, delay = 15000) => {
        let retries = 0;
        const stepName = endpoint.split('/').pop().replace('-log-file', '').replace(/-/g, ' ');
        toast.info(`Polling status for ${stepName}... Attempt ${retries + 1}`);
        console.log(`Polling status for ${endpoint}, Project: ${projectName}, Attempt ${retries + 1}`);

        while (retries < maxRetries) {
            try {
                const res = await api.post(endpoint, { Project_Name: projectName });
                console.log(`Poll response for ${endpoint}:`, res.data);
                const statusEntry = Array.isArray(res.data) ? res.data.find(entry => typeof entry === 'object' && entry !== null && "Exit status" in entry) : null;

                if (statusEntry && "Exit status" in statusEntry) {
                    const exitCode = statusEntry["Exit status"];
                    console.log(`Exit status found for ${stepName}: ${exitCode}`);
                    if (exitCode == "0") {
                        toast.success(`${stepName} completed successfully.`);
                        return true;
                    } else if (exitCode != null && exitCode != "0") {
                        toast.error(`${stepName} failed with exit code ${exitCode}.`);
                        console.error(`${endpoint} failed with exit code ${exitCode}. Log data:`, res.data);
                        return false;
                    }
                } else {
                     console.log(`No exit status found yet for ${stepName}. Retrying...`);
                }
            } catch (error) {
                console.error(`Error polling ${endpoint} (Attempt ${retries + 1}):`, error);
            }
            retries++;
            if (retries < maxRetries) {
                await new Promise((resolve) => setTimeout(resolve, delay));
                toast.info(`Polling status for ${stepName}... Attempt ${retries + 1}`);
                console.log(`Polling status for ${endpoint}, Project: ${projectName}, Attempt ${retries + 1}`);
            }
        }
        toast.error(`${stepName} timed out waiting for completion status.`);
        console.error(`${endpoint} timed out after ${maxRetries} retries.`);
        return false;
    };


    // --- Event Handlers ---
    const handleCreateProject = async (e) => {
        e.preventDefault();
        if (projectName.trim() === "") {
            toast.warning("Please enter a project name."); return;
        }
        setIsSubmittingProjectCreation(true);
        try {
            const res = await api.post(`/api/PHG/pipeline/create-project`, { Project_Name: projectName.trim() }, { headers: { 'Content-Type': 'application/json' } });
            if (res.data?.message?.includes("created successfully")) {
                toast.success("Project Created Successfully!"); setProjectName("");
            } else if (res.data?.message === "Project Name Already Used") {
                toast.warning(res.data.message);
            } else { toast.error(res.data?.message || "Failed to create project."); }
        } catch (error) {
            toast.error(error.response?.data?.message || "An error occurred during project creation."); console.error("Create project error:", error);
        } finally {
             setTimeout(() => setIsSubmittingProjectCreation(false), 0);
        }
    };

    const handleDownloadMetrics = async (e) => {
        e.preventDefault();
        if (!selectedProjectForDownload) { toast.warning("Please select a project to download metrics."); return; }
        setIsDownloading(true); toast.info("Preparing VCF Metrics download...");
        try {
            const res = await api.post(`/api/PHG/pipeline/get-vcf-metrics`, { Project_Name: selectedProjectForDownload }, { headers: { 'Content-Type': 'application/json' }, responseType: 'blob' });
            saveAs(res.data, `${selectedProjectForDownload}_VCFMetrics.tsv`); toast.success("VCF Metrics downloaded successfully!");
        } catch (error) {
            console.error("Download metrics error:", error); let errorMsg = "An error occurred during metrics download.";
            if (error.response?.data instanceof Blob) { try { const text = await error.response.data.text(); const json = JSON.parse(text); errorMsg = json.message || json.detail || errorMsg; } catch (parseError) { console.error("Could not parse error blob:", parseError); } } else { errorMsg = error.response?.data?.message || error.response?.data?.detail || errorMsg; } toast.error(errorMsg);
        } finally { setIsDownloading(false); }
    };

     const handleDownloadPlot = async (e) => {
        e.preventDefault();
        if (!selectedProjectForDownload) { toast.warning("Please select a project to download the plot."); return; }
        setIsDownloading(true); toast.info("Preparing Dot Plot download...");
        try {
            const res = await api.post(`/api/PHG/pipeline/get-dot-plots`, { Project_Name: selectedProjectForDownload }, { headers: { 'Content-Type': 'application/json' }, responseType: 'blob' });
            saveAs(res.data, `${selectedProjectForDownload}_DotPlot.zip`); toast.success("Dot Plot downloaded successfully!");
        } catch (error) {
            console.error("Download plot error:", error); let errorMsg = "An error occurred during plot download.";
             if (error.response?.data instanceof Blob) { try { const text = await error.response.data.text(); const json = JSON.parse(text); errorMsg = json.message || json.detail || errorMsg; } catch (parseError) { console.error("Could not parse error blob:", parseError); } } else { errorMsg = error.response?.data?.message || error.response?.data?.detail || errorMsg; } toast.error(errorMsg);
        } finally { setIsDownloading(false); }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        if (errors[name]) { setErrors({ ...errors, [name]: null }); }
    };

    const validate = () => {
        let isValid = true; const newErrors = {};
        if (!formData.project) { newErrors.project = "Select a Project"; isValid = false; }
        if (formData.selectedSequences.length === 0) { newErrors.selectedSequences = "At least one sequence is required"; isValid = false; }
        if (!formData.gff) { newErrors.gff = "Select a GFF File"; isValid = false; }
        if (!formData.reference) { newErrors.reference = "Select a Reference File"; isValid = false; }
        if (!formData.boundary) { newErrors.boundary = "Select a Boundary"; isValid = false; }
        if (!formData.minRangeSize || Number(formData.minRangeSize) <= 0) { newErrors.minRangeSize = "Enter a positive Min Range Size"; isValid = false; }
        if (!formData.pad || Number(formData.pad) < 0) { newErrors.pad = "Enter a non-negative Pad Size"; isValid = false; }
        setErrors(newErrors); return isValid;
    };

    // *** FIXED toggleDropdown function ***
    const toggleDropdown = (setter, currentState) => {
        const shouldOpen = !currentState; // Determine if the target dropdown should open

        // Close all dropdowns first
        setShowProjectDropdown(false);
        setShowSequencesDropdown(false);
        setShowGffDropdown(false);
        setShowReferenceDropdown(false);
        setShowBoundaryDropdown(false);

        // Set the target dropdown state ONLY if it should open
        if (shouldOpen) {
            setter(true);
        }
        // If shouldOpen is false, the target dropdown remains closed due to the reset above.
    };


    const handleDropdownBlur = (e, setter) => {
        setTimeout(() => {
            if (e.currentTarget && !e.currentTarget.contains(document.activeElement)) {
                 setter(false);
            }
        }, 0);
    };

    const handleSelect = (field, value, dropdownSetter) => {
        setFormData((prevFormData) => ({ ...prevFormData, [field]: value }));
        if (errors[field]) { setErrors({ ...errors, [field]: null }); }
        dropdownSetter(false);
    };

    const handleSequenceSelect = (value) => {
        let newSequences;
        if (formData.selectedSequences.includes(value)) {
            newSequences = formData.selectedSequences.filter((seq) => seq !== value);
        } else { newSequences = [...formData.selectedSequences, value]; }
        setFormData({ ...formData, selectedSequences: newSequences });
        if (errors.selectedSequences && newSequences.length > 0) {
             setErrors({ ...errors, selectedSequences: null });
        }
    };

    const handleSubmitPipeline = async (e) => {
        e.preventDefault();
        if (!validate()) {
            toast.warning("Please check the form for errors.");
            const firstErrorKey = Object.keys(errors).find(key => errors[key]);
            if (firstErrorKey) { document.getElementById(firstErrorKey)?.focus(); }
            return;
        }
        setIsSubmittingPipeline(true);
        toast.info("Pipeline started, please wait... This may take a while.");
        console.log("Submitting pipeline with data:", formData);
        const selectedProjectName = formData.project;
        const newNames = formData.selectedSequences.map(filename => filename.replace(/\.[^/.]+$/, ""));
        const filteredSequences = formData.selectedSequences.filter(seq => seq !== formData.reference);

        try {
            let stepOK = true;
            if (stepOK) {
                toast.info("Step 1/6: Preparing Assembly...");
                const prepareRes = await api.post(`/api/PHG/pipeline/prepare-assembly`, { sequences: formData.selectedSequences, new_names: newNames, Project_Name: selectedProjectName, hvcf_anchorgap: 1000000, gvcf_anchorgap: 1000 });
                if (!prepareRes.data || prepareRes.data.detail === "Process already running.") throw new Error(prepareRes.data?.detail || "Failed to start Prepare Assembly.");
                console.log("Prepare Assembly response:", prepareRes.data);
                stepOK = await pollLogStatus("/api/PHG/pipeline/prepare-assembly-log-file", selectedProjectName);
                if (!stepOK) throw new Error("Prepare Assembly step failed or timed out.");
            }
             if (stepOK) {
                toast.info("Step 2/6: Compressing FASTA...");
                const compressRes = await api.post(`/PHG/pipeline/agc-compress`, { Project_Name: selectedProjectName, sequences: filteredSequences, reference: formData.reference });
                if (!compressRes.data || compressRes.data.detail === "Process already running.") throw new Error(compressRes.data?.detail || "Failed to start AGC Compress.");
                console.log("Compress FASTA response:", compressRes.data);
                stepOK = await pollLogStatus("/api/PHG/pipeline/agc-compress-log-file", selectedProjectName);
                if (!stepOK) throw new Error("Compress FASTA step failed or timed out.");
            }
             if (stepOK) {
                toast.info("Step 3/6: Creating Reference Ranges...");
                const rangeRes = await api.post(`/api/PHG/pipeline/create-reference-ranges`, { Project_Name: selectedProjectName, gff_file: formData.gff, reference: formData.reference, boundary: formData.boundary, pad: Number(formData.pad), min_range_size: Number(formData.minRangeSize) });
                if (!rangeRes.data || rangeRes.data.detail === "Process already running.") throw new Error(rangeRes.data?.detail || "Failed to start Create Reference Ranges.");
                console.log("Create Reference Ranges response:", rangeRes.data);
                stepOK = await pollLogStatus("/api/PHG/pipeline/create-reference-ranges-log-file", selectedProjectName);
                if (!stepOK) throw new Error("Create Reference Ranges step failed or timed out.");
            }
             if (stepOK) {
                toast.info("Step 4/6: Aligning Assemblies...");
                const alignRes = await api.post(`/api/PHG/pipeline/align-assemblies`, { Project_Name: selectedProjectName, gff_file: formData.gff, reference: formData.reference, sequences: filteredSequences });
                if (!alignRes.data || alignRes.data.detail === "Process already running.") throw new Error(alignRes.data?.detail || "Failed to start Align Assemblies.");
                console.log("Align Assemblies response:", alignRes.data);
                stepOK = await pollLogStatus("/api/PHG/pipeline/align-assemblies-log-file", selectedProjectName);
                if (!stepOK) throw new Error("Align Assemblies step failed or timed out.");
            }
             if (stepOK) {
                toast.info("Step 5/6: Creating VCF...");
                const vcfRes = await api.post(`/api/PHG/pipeline/create-vcf`, { reference: formData.reference, Project_Name: selectedProjectName });
                if (!vcfRes.data || vcfRes.data.detail === "Process already running.") throw new Error(vcfRes.data?.detail || "Failed to start Create VCF.");
                console.log("Create VCF response:", vcfRes.data);
            }
             if (stepOK) {
                toast.info("Step 6/6: Loading VCF...");
                const loadRes = await api.post(`/api/PHG/pipeline/load-vcf`, { Project_Name: selectedProjectName });
                if (!loadRes.data || loadRes.data.detail === "Process already running.") throw new Error(loadRes.data?.detail || "Failed to start Load VCF.");
                console.log("Load VCF response:", loadRes.data);
                stepOK = await pollLogStatus("/api/PHG/pipeline/load-vcf-log-file", selectedProjectName);
                if (!stepOK) throw new Error("Load VCF step failed or timed out.");
            }
            if (stepOK) {
                toast.success("Pipeline completed successfully!");
                setFormData({ project: "", selectedSequences: [], gff: "", reference: "", boundary: "", minRangeSize: "", pad: "" });
                setErrors({});
            }
        } catch (error) {
            console.error("Pipeline execution error:", error);
            toast.error(`Pipeline failed: ${error.message || "An unknown error occurred."}`);
        } finally {
            setIsSubmittingPipeline(false);
        }
    };


    // --- Render ---
    return (
        <div className="pipeline-container">
            <Toaster position="top-right" richColors theme="dark" />

            <header className="pipeline-header">
                <h1 className="phg-page-title">RicePHG Pipeline</h1>
                <div className="pipeline-actions">
                     <form onSubmit={handleCreateProject} className="pipeline-action-group">
                         <input value={projectName} onChange={(e) => setProjectName(e.target.value)} type="text" placeholder="New Project Name" className="phg-input" aria-label="New Project Name" />
                         <button type="submit" disabled={isSubmittingProjectCreation || !projectName.trim()} className="phg-button phg-button-primary" >
                            {isSubmittingProjectCreation ? ( <><span className="phg-spinner"></span> Creating...</> ) : ( "Create Project" )}
                         </button>
                     </form>
                     <div className="pipeline-action-group">
                         <select value={selectedProjectForDownload} onChange={(e) => setSelectedProjectForDownload(e.target.value)} className="phg-select" aria-label="Select project for download" >
                            <option value="">Select Project for Download</option>
                            {projects.map((proj) => (<option key={proj} value={proj}>{proj}</option>))}
                         </select>
                         <button disabled={isDownloading || !selectedProjectForDownload} onClick={handleDownloadMetrics} className="phg-button" >
                            {isDownloading ? ( <> <span className="phg-spinner"></span> Downloading...</> ) : ( "Download QC Metrics" )}
                         </button>
                         <button disabled={isDownloading || !selectedProjectForDownload} onClick={handleDownloadPlot} className="phg-button" >
                             {isDownloading ? ( <> <span className="phg-spinner"></span> Downloading...</> ) : ( "Download Dot Plot" )}
                         </button>
                     </div>
                </div>
            </header>

            <div className="phg-card pipeline-form-card">
                 <div className="phg-card-header">
                     <h2 className="phg-card-title">Run Pipeline</h2>
                 </div>
                 <div className="phg-card-content">
                     <form onSubmit={handleSubmitPipeline} className="pipeline-form">
                         {/* Project Selection */}
                         <div className="phg-form-group" onBlur={(e) => handleDropdownBlur(e, setShowProjectDropdown)}>
                            <label htmlFor="project" className="phg-label">Target Project</label>
                            <div className="phg-dropdown-container" >
                                <button
                                    type="button" id="project"
                                    // *** FIXED onClick ***
                                    onClick={() => toggleDropdown(setShowProjectDropdown, showProjectDropdown)}
                                    className="phg-select phg-dropdown-trigger" aria-haspopup="listbox" aria-expanded={showProjectDropdown}
                                >
                                    <span>{formData.project || "Select a Project..."}</span>
                                    <ChevronDownIcon className="phg-dropdown-icon" open={showProjectDropdown} />
                                </button>
                                {showProjectDropdown && (
                                    <div className="phg-dropdown-menu" role="listbox">
                                        {projects.map((project) => ( <button key={project} type="button" role="option" aria-selected={formData.project === project} onClick={() => handleSelect('project', project, setShowProjectDropdown)} className="phg-dropdown-item" > {project} </button> ))}
                                        {projects.length === 0 && <div className="phg-dropdown-item-disabled">No projects available</div>}
                                    </div>
                                )}
                            </div>
                            {errors.project && <span className="phg-error-text">{errors.project}</span>}
                         </div>

                         {/* Sequences Multi-select */}
                         <div className="phg-form-group" onBlur={(e) => handleDropdownBlur(e, setShowSequencesDropdown)}>
                            <label htmlFor="selectedSequences" className="phg-label">Input Sequences</label>
                            <div className="phg-dropdown-container">
                                <button
                                    type="button" id="selectedSequences"
                                    // *** FIXED onClick ***
                                    onClick={() => toggleDropdown(setShowSequencesDropdown, showSequencesDropdown)}
                                    className="phg-select phg-dropdown-trigger" aria-haspopup="listbox" aria-expanded={showSequencesDropdown}
                                >
                                    <span> {formData.selectedSequences.length === 0 ? "Select Sequences..." : formData.selectedSequences.length === 1 ? formData.selectedSequences[0] : `${formData.selectedSequences.length} sequences selected`} </span>
                                    <ChevronDownIcon className="phg-dropdown-icon" open={showSequencesDropdown} />
                                </button>
                                {showSequencesDropdown && (
                                    <div className="phg-dropdown-menu phg-dropdown-menu-multi" role="listbox">
                                        {sequenceOptions.map((option) => ( <label key={option.value} className="phg-dropdown-item phg-dropdown-item-multi"> <input type="checkbox" checked={formData.selectedSequences.includes(option.value)} onChange={() => handleSequenceSelect(option.value)} className="phg-checkbox" /> {option.label} </label> ))}
                                    </div>
                                )}
                            </div>
                            {errors.selectedSequences && <span className="phg-error-text">{errors.selectedSequences}</span>}
                         </div>

                         {/* GFF File Selection */}
                         <div className="phg-form-group" onBlur={(e) => handleDropdownBlur(e, setShowGffDropdown)}>
                             <label htmlFor="gff" className="phg-label">GFF File</label>
                             <div className="phg-dropdown-container">
                                 <button
                                     type="button" id="gff"
                                     // *** FIXED onClick ***
                                     onClick={() => toggleDropdown(setShowGffDropdown, showGffDropdown)}
                                     className="phg-select phg-dropdown-trigger" aria-haspopup="listbox" aria-expanded={showGffDropdown}>
                                     <span>{formData.gff || "Select GFF File..."}</span>
                                     <ChevronDownIcon className="phg-dropdown-icon" open={showGffDropdown} />
                                 </button>
                                 {showGffDropdown && (
                                     <div className="phg-dropdown-menu" role="listbox">
                                         {gffOptions.map((gff) => ( <button key={gff} type="button" role="option" aria-selected={formData.gff === gff} onClick={() => handleSelect('gff', gff, setShowGffDropdown)} className="phg-dropdown-item"> {gff} </button> ))}
                                     </div>
                                 )}
                             </div>
                             {errors.gff && <span className="phg-error-text">{errors.gff}</span>}
                         </div>

                         {/* Reference File Selection */}
                         <div className="phg-form-group" onBlur={(e) => handleDropdownBlur(e, setShowReferenceDropdown)}>
                             <label htmlFor="reference" className="phg-label">Reference Sequence File</label>
                             <div className="phg-dropdown-container">
                                 <button
                                     type="button" id="reference"
                                     // *** FIXED onClick ***
                                     onClick={() => toggleDropdown(setShowReferenceDropdown, showReferenceDropdown)}
                                     className="phg-select phg-dropdown-trigger" aria-haspopup="listbox" aria-expanded={showReferenceDropdown}>
                                     <span>{formData.reference || "Select Reference File..."}</span>
                                     <ChevronDownIcon className="phg-dropdown-icon" open={showReferenceDropdown} />
                                 </button>
                                 {showReferenceDropdown && (
                                     <div className="phg-dropdown-menu" role="listbox">
                                         {sequenceOptions .filter(seq => formData.selectedSequences.includes(seq.value)) .map((seq) => ( <button key={seq.value} type="button" role="option" aria-selected={formData.reference === seq.value} onClick={() => handleSelect('reference', seq.value, setShowReferenceDropdown)} className="phg-dropdown-item"> {seq.label} </button> ))}
                                         {sequenceOptions.filter(seq => formData.selectedSequences.includes(seq.value)).length === 0 && <div className="phg-dropdown-item-disabled">Select sequences first</div> }
                                     </div>
                                 )}
                             </div>
                             {errors.reference && <span className="phg-error-text">{errors.reference}</span>}
                         </div>

                         {/* Boundary Selection */}
                         <div className="phg-form-group" onBlur={(e) => handleDropdownBlur(e, setShowBoundaryDropdown)}>
                             <label htmlFor="boundary" className="phg-label">Boundary Type</label>
                             <div className="phg-dropdown-container">
                                 <button
                                     type="button" id="boundary"
                                     // *** FIXED onClick ***
                                     onClick={() => toggleDropdown(setShowBoundaryDropdown, showBoundaryDropdown)}
                                     className="phg-select phg-dropdown-trigger" aria-haspopup="listbox" aria-expanded={showBoundaryDropdown}>
                                     <span>{formData.boundary || "Select Boundary..."}</span>
                                     <ChevronDownIcon className="phg-dropdown-icon" open={showBoundaryDropdown} />
                                 </button>
                                 {showBoundaryDropdown && (
                                     <div className="phg-dropdown-menu" role="listbox">
                                         {boundaryOptions.map((bound) => ( <button key={bound} type="button" role="option" aria-selected={formData.boundary === bound} onClick={() => handleSelect('boundary', bound, setShowBoundaryDropdown)} className="phg-dropdown-item"> {bound} </button> ))}
                                     </div>
                                 )}
                             </div>
                             {errors.boundary && <span className="phg-error-text">{errors.boundary}</span>}
                         </div>

                         {/* Pad Input */}
                         <div className="phg-form-group">
                             <label htmlFor="pad" className="phg-label">Pad Size</label>
                             <input type="number" id="pad" name="pad" value={formData.pad} onChange={handleChange} min={0} className="phg-input" placeholder="e.g., 1000" />
                             {errors.pad && <span className="phg-error-text">{errors.pad}</span>}
                         </div>

                         {/* Min Range Size Input */}
                         <div className="phg-form-group">
                             <label htmlFor="minRangeSize" className="phg-label">Minimum Range Size</label>
                             <input type="number" id="minRangeSize" name="minRangeSize" value={formData.minRangeSize} onChange={handleChange} min={1} className="phg-input" placeholder="e.g., 500" />
                             {errors.minRangeSize && <span className="phg-error-text">{errors.minRangeSize}</span>}
                         </div>

                         {/* Submit Button */}
                         <div className="pipeline-form-submit">
                             <button type="submit" className="phg-button phg-button-primary" disabled={isSubmittingPipeline} >
                                 {isSubmittingPipeline && <span className="phg-spinner"></span>}
                                 {isSubmittingPipeline ? "Processing Pipeline..." : "Run Full Pipeline"}
                             </button>
                         </div>
                     </form>
                 </div> {/* End Card Content */}
            </div> {/* End Card */}

            <div style={{ height: '2rem' }}></div>

        </div> // End pipeline-container
    );
};

export default Pipeline;
