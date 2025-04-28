import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Toaster, toast } from "sonner"; // Keep for notifications
import { FaChevronDown, FaChevronUp, FaTimes, FaPalette, FaFilter, FaWindowMinimize, FaWindowMaximize, FaInfoCircle, FaExclamationTriangle } from 'react-icons/fa'; // Themed Icons
import ReactFlow, { Background, Controls, MiniMap, Position, MarkerType, ReactFlowProvider, useReactFlow, useNodesState, useEdgesState } from 'reactflow';
import 'reactflow/dist/style.css'; // Base ReactFlow styles
import { motion, AnimatePresence } from "framer-motion"; // Keep animations

import api from '../api.js'; // Adjust path, ensure default export
import './PHGVisualization.css'; // Use dedicated CSS file

// --- Expected Data Shapes (Comments for Documentation) ---
/*
Expected PHGData item shape: { sample_name, id, contig, alleles[], pos_start, pos_end, fmt_GT? }
Expected SampleRegionsResponse shape: { min_positions[], max_positions[], chromosomes_per_sample[] }
Expected ProjectData item shape: { Project_Name, Reference_Name? }
*/

const MAX_WINDOW_SIZE = 500000;

// Custom Hook for detecting click outside
const useClickOutside = (ref, callback) => {
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (ref.current && !ref.current.contains(event.target)) {
                callback();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => { document.removeEventListener("mousedown", handleClickOutside); };
    }, [ref, callback]);
};

// Main Component wrapped in Provider
const PHGVisualizationPage = () => {
    return (
        <ReactFlowProvider>
            <PHGVisualizationContent />
        </ReactFlowProvider>
    );
}

// Renamed internal component
const PHGVisualizationContent = () => {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const reactFlowInstance = useReactFlow();

    // --- State ---
    const [availableProjects, setAvailableProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState('');
    const [selectedSample, setSelectedSample] = useState(''); // Ref sample
    const [availableSamples, setAvailableSamples] = useState([]);
    const [contig, setContig] = useState('');
    const [availableContigs, setAvailableContigs] = useState([]);
    const [start, setStart] = useState(0);
    const [regionSize, setRegionSize] = useState(50000);
    const [minBoundary, setMinBoundary] = useState(0);
    const [maxBoundary, setMaxBoundary] = useState(0);
    const [submittedContig, setSubmittedContig] = useState(''); // Contig used for last fetch
    const [isNodeModalOpen, setIsNodeModalOpen] = useState(false);
    const [selectedNodeData, setSelectedNodeData] = useState(null);
    const [isFetchingSampleRegions, setIsFetchingSampleRegions] = useState(false);
    const [isFetchingGraphData, setIsFetchingGraphData] = useState(false);
    const [isControlsCollapsed, setIsControlsCollapsed] = useState(false);
    const [iframeLoading, setIframeLoading] = useState(false);
    const [error, setError] = useState(null);

    // --- Dropdown State & Refs ---
    const [showProjectDropdown, setShowProjectDropdown] = useState(false);
    const [showSampleDropdown, setShowSampleDropdown] = useState(false);
    const [showContigDropdown, setShowContigDropdown] = useState(false);
    const projectRef = useRef(null);
    const sampleRef = useRef(null);
    const contigRef = useRef(null);
    useClickOutside(projectRef, () => setShowProjectDropdown(false));
    useClickOutside(sampleRef, () => setShowSampleDropdown(false));
    useClickOutside(contigRef, () => setShowContigDropdown(false));

    // --- Caching Refs ---
    const regionCacheRef = useRef({});
    const regionsDataRef = useRef(null);

    // --- Fetch Projects ---
    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const res = await api.get('/PHG/pipeline/get-directory-projects');
                if (res.data?.Files && Array.isArray(res.data.Files)) {
                    const projectsData = res.data.Files.map((projectName) => ({ Project_Name: projectName }));
                    setAvailableProjects(projectsData);
                } else { console.error('Unexpected format for projects:', res.data); }
            } catch (err) { console.error('Error fetching projects:', err); toast.error("Failed to fetch projects."); }
        };
        fetchProjects();
    }, []);

    // --- Fetch Sample/Region Metadata ---
    useEffect(() => {
        const fetchSampleRegions = async () => {
             if (!selectedProject) {
                setAvailableSamples([]); setSelectedSample(''); setAvailableContigs([]); setContig('');
                setStart(0); setRegionSize(50000); setMinBoundary(0); setMaxBoundary(0); regionsDataRef.current = null;
                return;
            }
            setIsFetchingSampleRegions(true); setError(null);
            try {
                 // Assuming Reference_Name might be needed, or just use selectedProject if appropriate
                 const referenceName = availableProjects.find(p => p.Project_Name === selectedProject)?.Reference_Name || selectedProject;
                const res = await api.post(`/PHG/query/sample_regions`, { Project_Name: selectedProject, Reference_Name: referenceName });
                if (!res.data) throw new Error('No data returned for sample regions');
                const regionsData = res.data; regionsDataRef.current = regionsData;
                const samples = regionsData?.chromosomes_per_sample?.map((item) => item.sample_name) || [];
                const filteredSamples = samples.filter((sample) => sample !== 'CX230'); // Keep filter
                setAvailableSamples(filteredSamples);
                // Reset dependent selections
                setSelectedSample(''); setAvailableContigs([]); setContig('');
                setStart(0); setRegionSize(50000); setMinBoundary(0); setMaxBoundary(0);
            } catch (err) {
                console.error('Error fetching sample regions:', err); toast.error(`Failed to fetch sample data for ${selectedProject}.`);
                setError("Could not load sample/region data.");
                setAvailableSamples([]); setSelectedSample(''); setAvailableContigs([]); setContig('');
                setStart(0); setRegionSize(50000); setMinBoundary(0); setMaxBoundary(0); regionsDataRef.current = null;
            } finally { setIsFetchingSampleRegions(false); }
        };
        fetchSampleRegions();
    }, [selectedProject, availableProjects]); // Add availableProjects dependency if Reference_Name depends on it

    // --- Update Contigs & Boundaries ---
     useEffect(() => {
        if (selectedSample && regionsDataRef.current) {
             const chromObj = regionsDataRef.current.chromosomes_per_sample?.find(item => item.sample_name === selectedSample);
             const minObj = regionsDataRef.current.min_positions?.find(item => item.sample_name === selectedSample);
             const maxObj = regionsDataRef.current.max_positions?.find(item => item.sample_name === selectedSample);
             if (chromObj?.contig) { setAvailableContigs(chromObj.contig); setContig(chromObj.contig[0] || ''); }
             else { setAvailableContigs([]); setContig(''); }
             if (minObj?.pos_start !== undefined && maxObj?.pos_end !== undefined) {
                setMinBoundary(minObj.pos_start); setMaxBoundary(maxObj.pos_end); setStart(minObj.pos_start);
                setRegionSize(Math.min(MAX_WINDOW_SIZE, maxObj.pos_end - minObj.pos_start || MAX_WINDOW_SIZE)); // Handle potential 0 range
             } else { setMinBoundary(0); setMaxBoundary(0); setStart(0); setRegionSize(0); }
        } else { setAvailableContigs([]); setContig(''); setMinBoundary(0); setMaxBoundary(0); setStart(0); setRegionSize(0); }
    }, [selectedSample]);

     // --- Fit view ---
     useEffect(() => {
         if ((nodes.length > 0 || edges.length > 0) && reactFlowInstance) {
              setTimeout(() => reactFlowInstance.fitView({ padding: 0.1, duration: 300 }), 100);
         }
     }, [nodes, edges, reactFlowInstance]);

    // --- Fetch Graph Data ---
    const fetchData = async () => {
        if (!selectedProject || !selectedSample || !contig || regionSize <= 0) {
             toast.error("Please select Project, Sample, Chromosome, and a valid Region Size first."); return;
         }
        setIsFetchingGraphData(true); setNodes([]); setEdges([]); setError(null); setSubmittedContig(contig);

        const effectiveSize = Math.min(regionSize, MAX_WINDOW_SIZE);
        const fetchStart = Math.max(minBoundary, start); // Ensure start isn't below min boundary
        const fetchEnd = Math.min(maxBoundary, fetchStart + effectiveSize); // Ensure end doesn't exceed max boundary

        // Adjust start if fetchEnd calculation caused it to shift below minimum start boundary due to effectiveSize limit
        const finalStart = (fetchEnd - effectiveSize < minBoundary) ? fetchEnd - effectiveSize : fetchStart;
        const finalEnd = fetchEnd;


        // Use finalStart and finalEnd for API call and cache key
         if (finalStart < minBoundary || finalEnd > maxBoundary) {
             toast.error("Calculated region is outside available boundaries.");
             setIsFetchingGraphData(false);
             return;
         }

        const cacheKey = `${selectedProject}:${contig}:${finalStart}-${finalEnd}`;

        if (regionCacheRef.current[cacheKey]) {
            console.log("Using cached data for", cacheKey);
            processData(regionCacheRef.current[cacheKey], selectedSample); setIsFetchingGraphData(false); return;
        }

        console.log(`Workspaceing data for ${cacheKey}`);
         const referenceName = availableProjects.find(p => p.Project_Name === selectedProject)?.Reference_Name || selectedProject;
        try {
            const response = await api.post(
                `/PHG/query/regions?chro=${contig}&position=${finalStart}-${finalEnd}`,
                { Project_Name: selectedProject, Reference_Name: referenceName, chro: contig, position: `${finalStart}-${finalEnd}`, samples: availableSamples, attrs: ['sample_name', 'id', 'contig', 'alleles', 'pos_start', 'pos_end', 'fmt_GT'] },
                { headers: { 'Content-Type': 'application/json' } }
            );
            if (!response.data) throw new Error('No data received from server.');
            const fetchedData = response.data;
            regionCacheRef.current[cacheKey] = fetchedData;
            processData(fetchedData, selectedSample);
        } catch (err) {
            console.error('Error fetching graph data:', err); toast.error("Failed to fetch visualization data."); setError("Could not load graph data.");
        } finally { setIsFetchingGraphData(false); }
    };

    // --- Process Data for ReactFlow ---
    const processData = (rawData, referenceSample) => { /* Omitted for brevity - logic remains the same as before */ };

     // --- Node Click Handler ---
     const handleNodeClick = useCallback((event, node) => { /* Omitted - same as before */ }, [submittedContig]);

    // --- Other Handlers ---
    const toggleDropdown = (setter) => setter(prev => !prev);
    const handleDropdownSelect = (field, value, setter) => {
        if(field === 'project') setSelectedProject(value);
        if(field === 'sample') setSelectedSample(value);
        if(field === 'contig') setContig(value);
        setter(false);
    };

    // Calculate effective max for slider
    const effectiveSliderMax = maxBoundary > minBoundary ? Math.min(MAX_WINDOW_SIZE, maxBoundary - start) : MAX_WINDOW_SIZE;
    useEffect(() => {
        if (regionSize > effectiveSliderMax && effectiveSliderMax > 0) { setRegionSize(effectiveSliderMax); }
        else if (effectiveSliderMax <= 100 && regionSize < 100) { setRegionSize(100); }
    }, [effectiveSliderMax, regionSize]);


    return (
        <div className="page-container phg-vis-page">
            <Toaster position="top-right" richColors />

            {/* Controls Bar */}
            <div className={`controls-bar ${isControlsCollapsed ? 'collapsed' : ''}`}>
                <div className="controls-header">
                    <h2 className="control-section-title"><FaFilter /> Visualization Controls</h2>
                    <button className="secondary-btn collapse-btn" onClick={() => setIsControlsCollapsed(!isControlsCollapsed)}>
                        {isControlsCollapsed ? <FaWindowMaximize/> : <FaWindowMinimize />}
                         {isControlsCollapsed ? ' Expand' : ' Collapse'}
                    </button>
                </div>
                <AnimatePresence>
                 {!isControlsCollapsed && (
                    <motion.div className="controls-content" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} style={{ overflow: 'hidden' }}>
                         {/* Project Selection */}
                         <div className="control-group" ref={projectRef}>
                            <label htmlFor="project-dropdown-vis">Project</label>
                            <div className="dropdown-container">
                                <button type="button" id="project-dropdown-vis" className="dropdown-trigger" onClick={() => toggleDropdown(setShowProjectDropdown)} aria-haspopup="listbox" aria-expanded={showProjectDropdown}>
                                    <span className={`dropdown-label ${!selectedProject ? 'placeholder' : ''}`}>{selectedProject || "Select Project..."}</span>
                                    <FaChevronDown className={`dropdown-chevron ${showProjectDropdown ? 'open' : ''}`} />
                                </button>
                                {showProjectDropdown && (
                                    <div className="dropdown-panel" role="listbox">
                                        {availableProjects.length > 0 ? availableProjects.map((p) => (<button type="button" key={p.Project_Name} className={`dropdown-option ${selectedProject === p.Project_Name ? 'selected' : ''}`} onClick={() => handleDropdownSelect('project', p.Project_Name, setShowProjectDropdown)} role="option" aria-selected={selectedProject === p.Project_Name}>{p.Project_Name}</button>)) : <div className="dropdown-option disabled">Loading...</div>}
                                    </div>
                                )}
                            </div>
                         </div>

                         {/* Sample Selection */}
                         <div className="control-group" ref={sampleRef}>
                            <label htmlFor="sample-dropdown-vis">Reference Sample</label>
                            <div className="dropdown-container">
                                 <button type="button" id="sample-dropdown-vis" className="dropdown-trigger" onClick={() => toggleDropdown(setShowSampleDropdown)} aria-haspopup="listbox" aria-expanded={showSampleDropdown} disabled={!selectedProject || isFetchingSampleRegions}>
                                     <span className={`dropdown-label ${!selectedSample ? 'placeholder' : ''}`}>{selectedSample || "Select Sample..."}</span>
                                     <FaChevronDown className={`dropdown-chevron ${showSampleDropdown ? 'open' : ''}`} />
                                 </button>
                                 {showSampleDropdown && (
                                     <div className="dropdown-panel" role="listbox">
                                         {isFetchingSampleRegions ? <div className="dropdown-option disabled"><span className="spinner small-spinner" style={{marginRight: '5px'}}></span>Loading...</div> : availableSamples.length > 0 ? availableSamples.map((s) => (<button type="button" key={s} className={`dropdown-option ${selectedSample === s ? 'selected' : ''}`} onClick={() => handleDropdownSelect('sample', s, setShowSampleDropdown)} role="option" aria-selected={selectedSample === s}>{s}</button>)) : <div className="dropdown-option disabled">No samples</div>}
                                     </div>
                                 )}
                             </div>
                         </div>

                         {/* Contig Selection */}
                          <div className="control-group" ref={contigRef}>
                            <label htmlFor="contig-dropdown-vis">Chromosome/Contig</label>
                             <div className="dropdown-container">
                                 <button type="button" id="contig-dropdown-vis" className="dropdown-trigger" onClick={() => toggleDropdown(setShowContigDropdown)} aria-haspopup="listbox" aria-expanded={showContigDropdown} disabled={!selectedSample || isFetchingSampleRegions}>
                                     <span className={`dropdown-label ${!contig ? 'placeholder' : ''}`}>{contig || "Select Chromosome..."}</span>
                                     <FaChevronDown className={`dropdown-chevron ${showContigDropdown ? 'open' : ''}`} />
                                 </button>
                                 {showContigDropdown && (
                                     <div className="dropdown-panel" role="listbox">
                                        {isFetchingSampleRegions ? <div className="dropdown-option disabled">Loading...</div> : availableContigs.length > 0 ? availableContigs.map((c) => (<button type="button" key={c} className={`dropdown-option ${contig === c ? 'selected' : ''}`} onClick={() => handleDropdownSelect('contig', c, setShowContigDropdown)} role="option" aria-selected={contig === c}>{c}</button>)) : <div className="dropdown-option disabled">Select sample first</div>}
                                     </div>
                                 )}
                             </div>
                         </div>

                        {/* Position Inputs */}
                         <div className="control-group">
                            <label htmlFor="vis-start-pos">Start Position</label>
                            <input id="vis-start-pos" type='number' placeholder='Start' value={start} min={minBoundary} max={maxBoundary} onChange={(e) => setStart(Number(e.target.value))} className='themed-input' disabled={!contig || isFetchingSampleRegions}/>
                            <small className='input-hint'>Min: {minBoundary.toLocaleString()}, Max: {maxBoundary.toLocaleString()}</small>
                        </div>

                         {/* Region Size Slider */}
                         <div className="control-group range-slider-group">
                            <label htmlFor="vis-region-size" className="range-slider-label">
                                <span>Region Size (bp)</span>
                                <span className="value">{regionSize.toLocaleString()}</span>
                            </label>
                            <input id="vis-region-size" type='range' value={regionSize} min={100} max={effectiveSliderMax > 100 ? effectiveSliderMax : 100} // Ensure max is >= min
                             step={100} onChange={(e) => setRegionSize(Number(e.target.value))} className='themed-slider' disabled={!contig || isFetchingSampleRegions || effectiveSliderMax <= 100}/>
                            <small className='input-hint'>Max window: {MAX_WINDOW_SIZE.toLocaleString()} bp</small>
                         </div>

                        {/* Visualize Button */}
                         <div className="control-group">
                             <label>&nbsp;</label>
                            <button className="primary-btn phg-action-btn" onClick={fetchData} disabled={!contig || isFetchingSampleRegions || isFetchingGraphData}>
                                 {isFetchingGraphData ? <><span className="spinner small-spinner"></span> Loading Graph...</> : 'Visualize'}
                            </button>
                         </div>
                    </motion.div>
                  )}
                </AnimatePresence>
            </div>

            {/* --- React Flow Graph Area --- */}
             <div className='reactflow-wrapper'>
                 {error && <div className="output-area output-error" style={{position: 'absolute', top: '1rem', left: '1rem', zIndex: 10, maxWidth: '300px'}}><FaExclamationTriangle/> {error}</div>}
                 <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onNodeClick={handleNodeClick} fitView attributionPosition="bottom-left">
                     <Background />
                     <Controls />
                     <MiniMap nodeStrokeWidth={3} nodeColor={n => n.style?.backgroundColor || '#ccc'}/>
                 </ReactFlow>
                 {/* Legend Overlay */}
                 <div className='legend-card'>
                     <h4><FaPalette style={{marginRight: '0.4rem'}}/> Legend</h4>
                      <div className='legend-item'> <div className='legend-color-box' style={{ backgroundColor: '#5096f2' }}></div> <span className="legend-text">Ref. Allele ({selectedSample || 'N/A'})</span> </div>
                      <div className='legend-item'> <div className='legend-color-box' style={{ backgroundColor: '#f25050' }}></div> <span className="legend-text">Alt. Allele 1</span> </div>
                      <div className='legend-item'> <div className='legend-color-box' style={{ backgroundColor: '#50f250' }}></div> <span className="legend-text">Alt. Allele 2</span> </div>
                      {/* Add more legend items if more colors are used */}
                      <p className="legend-note">Colors show allele identity per column.</p>
                 </div>
             </div>

            {/* --- Node Detail Modal --- */}
            <AnimatePresence>
                 {isNodeModalOpen && selectedNodeData && (
                    <motion.div className="node-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsNodeModalOpen(false)}>
                         <motion.div className="node-modal-content" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} transition={{ duration: 0.2, ease: "easeOut" }} onClick={(e) => e.stopPropagation()}>
                             <button onClick={() => setIsNodeModalOpen(false)} className="node-modal-close-btn" aria-label="Close modal"><FaTimes /></button>
                             <div className="node-modal-header"><h2>Node Details</h2></div>
                             <div className="node-details-grid">
                                <p><strong>Sample:</strong> {selectedNodeData.sample}</p>
                                <p><strong>Contig:</strong> {selectedNodeData.contig}</p>
                                <p><strong>Allele ID:</strong> {selectedNodeData.allele}</p>
                                <p><strong>Start:</strong> {Number(selectedNodeData.start).toLocaleString()}</p>
                                <p><strong>End:</strong> {Number(selectedNodeData.end).toLocaleString()}</p>
                            </div>
                            <div className="iframe-container">
                                {iframeLoading && (<div className="iframe-skeleton"><span className="spinner"></span><p>Loading JBrowse...</p></div>)}
                                <iframe
                                     src={`https://snp-seek.irri.org/jbrowse/?loc=${selectedNodeData.contig}%3A${selectedNodeData.start}..${selectedNodeData.end}&tracklist=0&nav=1&overview=0`}
                                     title={`JBrowse view for ${selectedNodeData.contig}:${selectedNodeData.start}-${selectedNodeData.end}`}
                                    className="jbrowse-iframe"
                                    onLoad={() => setIframeLoading(false)}
                                    onError={() => { setIframeLoading(false); toast.error("Failed to load JBrowse view.") }}
                                    style={{ visibility: iframeLoading ? 'hidden' : 'visible' }}
                                 />
                            </div>
                        </motion.div>
                    </motion.div>
                 )}
             </AnimatePresence>

        </div> // End page-container
    );
};

export default PHGVisualizationPage;