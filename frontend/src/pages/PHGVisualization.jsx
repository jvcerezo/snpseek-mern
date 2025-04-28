
import React, { useEffect, useRef, useState } from 'react';
import ReactFlow, { Background, Controls, MarkerType, MiniMap, Position, applyNodeChanges, applyEdgeChanges, addEdge } from 'reactflow';
import 'reactflow/dist/style.css'; // Import React Flow styles
import { motion } from 'framer-motion'; // For animations

import './PHGVisualization.css';

import api from '../api.js'; // Make sure the path is correct

const MAX_WINDOW_SIZE = 500000; // Maximum size for the visualization window

// --- React Component ---
const PHGVisualization = () => {
    // --- State Variables ---
    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);
    const [data, setData] = useState([]);
    const [isCardCollapsed, setIsCardCollapsed] = useState(false);
    const [availableProjects, setAvailableProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState('');
    const [selectedSample, setSelectedSample] = useState('');
    const [availableSamples, setAvailableSamples] = useState([]);
    const [contig, setContig] = useState('');
    const [start, setStart] = useState(0);
    const [regionSize, setRegionSize] = useState(0);
    const [minBoundary, setMinBoundary] = useState(0);
    const [maxBoundary, setMaxBoundary] = useState(0);
    const [availableContigs, setAvailableContigs] = useState([]);
    const [submittedContig, setSubmittedContig] = useState('');
    const [isNodeClicked, setIsNodeClicked] = useState(false);
    const [selectedNode, setSelectedNode] = useState({ allele: "", start: "", end: "" });
    const [isFetchingSampleRegions, setIsFetchingSampleRegions] = useState(false);

    // --- Refs ---
    const regionCacheRef = useRef({});
    const regionsDataRef = useRef(null);
    const reactFlowInstanceRef = useRef(null); // Keep if needed for fitView effect

    // --- Effects ---

    // Effect 1: Fetch available projects on component mount
    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const res = await api.get('/PHG/pipeline/get-directory-projects');
                if (!res.data) throw new Error('Error fetching available projects: No data received');
                const response = res.data;
                if (response.Files && Array.isArray(response.Files)) {
                    const projects = response.Files.map((projectName) => ({ Project_Name: projectName }));
                    setAvailableProjects(projects);
                } else {
                    console.error('Unexpected response format from get-directory-projects:', response);
                    setAvailableProjects([]);
                }
            } catch (error) {
                console.error('Error fetching projects:', error);
                setAvailableProjects([]);
            }
        };
        fetchProjects();
    }, []);

    // Effect 2: Fetch sample regions metadata when the selected project changes
    useEffect(() => {
        const fetchSampleRegions = async () => {
            if (!selectedProject) {
                setAvailableSamples([]); setSelectedSample(''); setAvailableContigs([]); setContig('');
                setMinBoundary(0); setMaxBoundary(0); setStart(0); setRegionSize(0);
                regionsDataRef.current = null; return;
            }
            setIsFetchingSampleRegions(true); regionsDataRef.current = null;
            try {
                const res = await api.post(`/PHG/query/sample_regions`,
                    { Project_Name: selectedProject, Reference_Name: selectedProject },
                    { headers: { 'Content-Type': 'application/json' } }
                );
                if (!res.data) throw new Error('Error fetching sample regions: No data received');
                const regionsData = res.data;
                regionsDataRef.current = regionsData;
                const samples = regionsData.chromosomes_per_sample?.map((item) => item.sample_name) || [];
                const filteredSamples = samples.filter((sample) => sample !== 'CX230');
                setAvailableSamples(filteredSamples);
                setSelectedSample(''); setContig('');
            } catch (error) {
                console.error('Error fetching sample regions:', error);
                setAvailableSamples([]); setSelectedSample(''); setAvailableContigs([]); setContig('');
                setMinBoundary(0); setMaxBoundary(0); setStart(0); setRegionSize(0);
                regionsDataRef.current = null;
            } finally {
                setIsFetchingSampleRegions(false);
            }
        };
        fetchSampleRegions();
    }, [selectedProject]);

    // Effect 3: Update available contigs and boundaries when the selected sample changes
    useEffect(() => {
        if (selectedSample && regionsDataRef.current) {
            const regionsData = regionsDataRef.current;
            const chromObj = regionsData.chromosomes_per_sample?.find((item) => item.sample_name === selectedSample);
            const sampleContigs = chromObj?.contig || [];
            setAvailableContigs(sampleContigs);
            const minObj = regionsData.min_positions?.find((item) => item.sample_name === selectedSample);
            const maxObj = regionsData.max_positions?.find((item) => item.sample_name === selectedSample);
            const sampleMinBoundary = minObj?.pos_start ?? 0;
            const sampleMaxBoundary = maxObj?.pos_end ?? 0;
            setTimeout(() => {
                setContig(sampleContigs[0] || '');
                setMinBoundary(sampleMinBoundary);
                setMaxBoundary(sampleMaxBoundary);
                setStart(sampleMinBoundary);
                const initialSize = Math.min(MAX_WINDOW_SIZE, sampleMaxBoundary - sampleMinBoundary);
                setRegionSize(initialSize > 0 ? initialSize : 0);
            }, 0);
        } else if (!selectedSample) {
             setTimeout(() => {
                setAvailableContigs([]); setContig(''); setMinBoundary(0); setMaxBoundary(0); setStart(0); setRegionSize(0);
             }, 0);
        }
    }, [selectedSample]);

    // Optional Effect 4: Fit view (React Flow's fitView prop often sufficient)
    // useEffect(() => {
    //     if (reactFlowInstanceRef.current && (nodes.length > 0 || edges.length > 0)) {
    //         reactFlowInstanceRef.current.fitView({ padding: 0.1 }); // Add padding
    //     }
    // }, [nodes, edges]);

    // --- Helper Functions ---
    const effectiveSliderMax = Math.max(100, Math.min(MAX_WINDOW_SIZE, maxBoundary - start));

    // --- Data Fetching and Processing ---
    const fetchData = async () => {
        if (!selectedProject || !contig || !selectedSample) {
            console.warn("Please select Project, Sample, and Chromosome."); return;
        }
        setSubmittedContig(contig);
        const effectiveSize = Math.min(regionSize, MAX_WINDOW_SIZE);
        const adjustedEnd = Math.min(start + effectiveSize, maxBoundary);
        const adjustedStart = Math.min(start, adjustedEnd);
        const cacheKey = `${selectedProject}:${contig}:${adjustedStart}-${adjustedEnd}`;

        if (regionCacheRef.current[cacheKey]) {
            console.log("Using cached data for:", cacheKey);
            const cachedData = regionCacheRef.current[cacheKey];
            setData(cachedData); processData(cachedData, selectedSample); return;
        }
        console.log("Fetching data for:", cacheKey);
        try {
            const response = await api.post(
                `/PHG/query/regions?chro=${contig}&position=${adjustedStart}-${adjustedEnd}`,
                {
                    Project_Name: selectedProject, Reference_Name: selectedProject,
                    samples: availableSamples,
                    attrs: ['sample_name', 'id', 'contig', 'alleles', 'pos_start', 'pos_end', 'fmt_GT']
                },
                { headers: { 'Content-Type': 'application/json' } }
            );
            if (!response.data) throw new Error('Network response was not ok: No data received');
            const fetchedData = response.data;
            regionCacheRef.current[cacheKey] = fetchedData;
            setData(fetchedData); processData(fetchedData, selectedSample);
        } catch (error) {
            console.error('Error fetching data:', error); setNodes([]); setEdges([]);
        }
    };

    const processData = (rawData, referenceSample) => {
        const newNodes = []; const newEdges = [];
        if (!rawData || rawData.length === 0) { setNodes([]); setEdges([]); return; }

        const allSamples = [...new Set(rawData.map(item => item.sample_name))];
        const orderedSamples = [ referenceSample, ...allSamples.filter((sample) => sample !== referenceSample) ];
        const yPositions = {}; orderedSamples.forEach((sample, idx) => { yPositions[sample] = 100 + idx * 100; });

        const nodeHeight = 50; const xGap = 20; let currentXPosition = 0; const prevNodeIds = {};
        const groupedData = {}; rawData.forEach((item) => {
            const posKey = `${item.pos_start}-${item.pos_end}`;
            if (!groupedData[posKey]) groupedData[posKey] = [];
            groupedData[posKey].push(item);
        });
        const sortedPosKeys = Object.keys(groupedData).sort((a, b) => parseInt(a.split('-')[0], 10) - parseInt(b.split('-')[0], 10));

        sortedPosKeys.forEach((posKey) => {
            const itemsAtPosition = groupedData[posKey]; if (!itemsAtPosition || itemsAtPosition.length === 0) return;
            const allelesBySample = {}; itemsAtPosition.forEach((item) => {
                const allele = (Array.isArray(item.alleles) && item.alleles.length > 1) ? item.alleles[1] : (Array.isArray(item.alleles) && item.alleles.length > 0 ? item.alleles[0] : '');
                allelesBySample[item.sample_name] = allele || '';
            });
            const referenceAllele = allelesBySample[referenceSample] || '';
            const uniqueAllelesAtPosition = [...new Set(Object.values(allelesBySample))];
            const positionColorMap = {}; const alternateColors = ['#f25050', '#50f250', '#f2a050', '#a050f2', '#50f2f2']; let colorIndex = 0;
            if (referenceAllele !== '') positionColorMap[referenceAllele] = '#5096f2';
            uniqueAllelesAtPosition.forEach((allele) => {
                if (allele !== '' && allele !== referenceAllele) {
                    positionColorMap[allele] = (colorIndex < alternateColors.length) ? alternateColors[colorIndex++] : '#cccccc';
                } else if (allele === '' && !positionColorMap['']) {
                    positionColorMap[''] = '#e0e0e0';
                }
            });

            let maxWidthAtPosition = 0;
            itemsAtPosition.forEach((item) => {
                const width = Math.max(10, (item.pos_end - item.pos_start) / 50); maxWidthAtPosition = Math.max(maxWidthAtPosition, width);
                const nodeId = `${item.sample_name}-${item.pos_start}-${item.pos_end}`; // Consider adding index if duplicates possible
                const allele = allelesBySample[item.sample_name]; const color = positionColorMap[allele] || '#cccccc';
                newNodes.push({
                    id: nodeId, type: 'default',
                    data: { label: (
                        // Using divs for structure within the node label
                        <div className="phg-node-label">
                            <div className='phg-node-label-sample'>{item.sample_name}</div>
                            <div className='phg-node-label-pos'>{item.pos_start} - {item.pos_end}</div>
                        </div>
                    )},
                    position: { x: currentXPosition, y: yPositions[item.sample_name] },
                    style: { width: width, height: nodeHeight, backgroundColor: color, border: '1px solid #444', borderRadius: '4px' }, // Basic styles, specific text styles in CSS
                    sourcePosition: Position.Right, targetPosition: Position.Left,
                });
                if (prevNodeIds[item.sample_name]) {
                    newEdges.push({
                        id: `e-${prevNodeIds[item.sample_name]}-${nodeId}`, source: prevNodeIds[item.sample_name], target: nodeId,
                        type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed, width: 15, height: 15, color: '#555' }, style: { stroke: '#555', strokeWidth: 1.5 },
                    });
                }
                prevNodeIds[item.sample_name] = nodeId;
            });
            currentXPosition += maxWidthAtPosition + xGap;
        });
        setNodes(newNodes); setEdges(newEdges);
    };

    // --- Event Handlers ---
    const handleNodeClick = (event, node) => {
        const parts = node.id.split('-');
        if (parts.length >= 3) {
            const startPos = parts[parts.length - 2]; const endPos = parts[parts.length - 1];
            const alleleSample = parts.slice(0, parts.length - 2).join('-');
            setSelectedNode({ allele: alleleSample, start: startPos, end: endPos });
            setIsNodeClicked(true);
        } else { console.error("Could not parse node ID:", node.id); }
    };

    const handleIframeLoad = () => {
        setTimeout(() => {
            const skeleton = document.getElementById('skeleton'); const iframe = document.getElementById('snpIframe');
            if (skeleton) skeleton.style.display = 'none'; if (iframe) iframe.style.display = 'block'; // Use display block instead of removing hidden class
        }, 1000);
    };

    // --- Render ---
    return (
        // Main container - Added class for potential top-level styling
        <div className='phg-visualization-container'>

            {/* Node Details Modal */}
            {isNodeClicked && (
                <div className="phg-modal-overlay">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.2, ease: "linear" }}
                        className="phg-modal-content"
                    >
                        <button onClick={() => setIsNodeClicked(false)} className="phg-modal-close-button" aria-label="Close modal">
                            &times;
                        </button>
                        <h2 className="phg-modal-title">Node Details</h2>
                        <div className="phg-node-details-box">
                             <div className="phg-node-details-grid">
                                <p><strong className="phg-text-highlight">Sample:</strong> {selectedNode.allele}</p>
                                <p><strong className="phg-text-highlight">Contig:</strong> {submittedContig}</p>
                                <p><strong className="phg-text-highlight">Start:</strong> {selectedNode.start}</p>
                                <p><strong className="phg-text-highlight">End:</strong> {selectedNode.end}</p>
                             </div>
                        </div>
                        <div className="phg-iframe-container">
                            <div id="skeleton" className="phg-skeleton-loader">
                                <p>Loading JBrowse...</p>
                            </div>
                            <iframe
                                id="snpIframe"
                                src={`https://snp-seek.irri.org/jbrowse/?loc=${encodeURIComponent(submittedContig)}%3A${encodeURIComponent(selectedNode.start)}..${encodeURIComponent(selectedNode.end)}`}
                                width="100%" height="100%"
                                className="phg-iframe" // Start hidden via CSS
                                title={`JBrowse view for ${submittedContig}:${selectedNode.start}-${selectedNode.end}`}
                                onLoad={handleIframeLoad}
                            />
                        </div>
                    </motion.div>
                </div>
            )}

            {/* React Flow Container */}
            <div className='phg-reactflow-wrapper'>
                <ReactFlow
                    nodes={nodes} edges={edges} onNodeClick={handleNodeClick}
                    onNodesChange={(changes) => setNodes(nds => applyNodeChanges(changes, nds))}
                    onEdgesChange={(changes) => setEdges(eds => applyEdgeChanges(changes, eds))}
                    onConnect={(connection) => setEdges(eds => addEdge(connection, eds))}
                    fitView
                    // onInit={(instance) => reactFlowInstanceRef.current = instance} // Store instance if using effect 4
                    proOptions={{ hideAttribution: true }}
                    className="phg-reactflow-canvas" // Class for canvas specific styles if needed
                >
                    <Background variant="dots" gap={16} size={1} /> {/* Color set in CSS */}
                    <Controls />
                    <MiniMap nodeStrokeWidth={3} nodeColor={n => n.style?.backgroundColor || '#ccc'} />

                     {/* Settings Panel Overlay */}
                     <div className='phg-settings-panel'>
                        {/* Use standard div for Card */}
                        <div className='phg-card'>
                             {/* Use standard div for CardHeader */}
                             <div className="phg-card-header">
                                 {/* Use standard h3 or div for CardTitle */}
                                <h3 className="phg-card-title">Visualization Settings</h3>
                                {/* Use standard button */}
                                <button
                                    onClick={() => setIsCardCollapsed(!isCardCollapsed)}
                                    className='phg-button phg-button-ghost' // Base + variant class
                                    aria-expanded={!isCardCollapsed}
                                    aria-controls="settings-content"
                                >
                                    {isCardCollapsed ? 'Expand' : 'Collapse'}
                                </button>
                            </div>

                           {!isCardCollapsed && (
                               // Use standard div for CardContent
                                <div id="settings-content" className='phg-card-content'>
                                    {/* Project Selection */}
                                    <div className='phg-form-group'>
                                        <label htmlFor="project-select" className="phg-label">Project</label>
                                        {/* Use standard select */}
                                        <select
                                            id="project-select"
                                            className="phg-select"
                                            value={selectedProject}
                                            onChange={(e) => {
                                                setSelectedProject(e.target.value);
                                                setSelectedSample(''); setContig(''); setNodes([]); setEdges([]);
                                            }}
                                        >
                                            <option value="" disabled>Select Project...</option>
                                            {availableProjects.length === 0 && <option value="loading" disabled>Loading...</option>}
                                            {availableProjects.map((project) => (
                                                <option key={project.Project_Name} value={project.Project_Name}>
                                                    {project.Project_Name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Sample Selection */}
                                    <div className='phg-form-group'>
                                        <label htmlFor="sample-select" className="phg-label">Reference Sample</label>
                                        <select
                                            id="sample-select"
                                            className="phg-select"
                                            value={selectedSample}
                                            onChange={(e) => {
                                                setSelectedSample(e.target.value);
                                                setContig(''); setNodes([]); setEdges([]);
                                            }}
                                            disabled={!selectedProject || isFetchingSampleRegions || availableSamples.length === 0}
                                        >
                                            <option value="" disabled>{isFetchingSampleRegions ? 'Loading Samples...' : 'Select Sample...'}</option>
                                            {availableSamples.map((sample) => (
                                                <option key={sample} value={sample}>
                                                    {sample}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Chromosome/Contig Selection */}
                                    <div className='phg-form-group'>
                                        <label htmlFor="contig-select" className="phg-label">Chromosome</label>
                                        <select
                                            id="contig-select"
                                            className="phg-select"
                                            value={contig}
                                            onChange={(e) => setContig(e.target.value)}
                                            disabled={!selectedSample || isFetchingSampleRegions || availableContigs.length === 0}
                                        >
                                            <option value="" disabled>{!selectedSample ? 'Select Sample First' : 'Select Chromosome...'}</option>
                                            {availableContigs.map((c) => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                        </select>
                                        {selectedSample && minBoundary !== maxBoundary && (
                                            <p className="phg-help-text">
                                                Available Range: {minBoundary.toLocaleString()} - {maxBoundary.toLocaleString()} bp
                                            </p>
                                        )}
                                    </div>

                                    {/* Starting Position Input */}
                                    <div className='phg-form-group'>
                                        <label htmlFor="start-pos" className="phg-label">Starting Position (bp)</label>
                                        {/* Use standard input */}
                                        <input
                                            id="start-pos"
                                            type='number'
                                            placeholder='Start position'
                                            value={start}
                                            min={minBoundary}
                                            max={maxBoundary}
                                            onChange={(e) => setStart(Math.max(minBoundary, Number(e.target.value)))}
                                            className='phg-input'
                                            disabled={!contig || isFetchingSampleRegions}
                                        />
                                    </div>

                                    {/* Region Size Slider */}
                                    <div className='phg-form-group'>
                                        <label htmlFor="region-size" className="phg-label">
                                             Region Size: {regionSize.toLocaleString()} bp
                                             <span className="phg-label-detail">(Max: {MAX_WINDOW_SIZE.toLocaleString()})</span>
                                        </label>
                                        {/* Use standard range input */}
                                        <input
                                            id="region-size"
                                            type='range'
                                            value={regionSize}
                                            min={100}
                                            max={effectiveSliderMax}
                                            step={100}
                                            onChange={(e) => setRegionSize(Number(e.target.value))}
                                            className='phg-slider'
                                            disabled={!contig || isFetchingSampleRegions || effectiveSliderMax <= 100}
                                        />
                                         <p className="phg-help-text">
                                             Visualizing: {start.toLocaleString()} - {(start + regionSize).toLocaleString()} bp
                                         </p>
                                    </div>

                                    {/* Visualize Button */}
                                    <button
                                        className="phg-button phg-button-primary phg-button-visualize" // Base + variant + specific class
                                        onClick={fetchData}
                                        disabled={!contig || !selectedSample || isFetchingSampleRegions || regionSize <= 0}
                                    >
                                        Visualize Region
                                    </button>
                                </div>
                            )}
                        </div> {/* End phg-card */}
                    </div> {/* End phg-settings-panel */}

                     {/* Legend Overlay */}
                     <div className='phg-legend-panel'>
                         {/* Use standard div for Card */}
                         <div className='phg-card'>
                            {/* Use standard div for CardHeader */}
                            <div className="phg-card-header">
                                {/* Use standard h4 or div for CardTitle */}
                                <h4 className='phg-card-title'>Legend</h4>
                            </div>
                            {/* Use standard div for CardContent */}
                            <div className="phg-card-content phg-legend-content">
                                {/* Legend Items */}
                                <div className='phg-legend-item'>
                                    <div className='phg-legend-color-box' style={{ backgroundColor: '#5096f2' }} />
                                    <span className="phg-legend-text">Reference Allele ({selectedSample || 'N/A'})</span>
                                </div>
                                <div className='phg-legend-item'>
                                    <div className='phg-legend-color-box' style={{ backgroundColor: '#f25050' }} />
                                    <span className="phg-legend-text">Alternate Allele 1</span>
                                </div>
                                <div className='phg-legend-item'>
                                    <div className='phg-legend-color-box' style={{ backgroundColor: '#50f250' }} />
                                    <span className="phg-legend-text">Alternate Allele 2</span>
                                </div>
                                 <div className='phg-legend-item'>
                                    <div className='phg-legend-color-box' style={{ backgroundColor: '#cccccc' }} />
                                    <span className="phg-legend-text">Other / Missing</span>
                                </div>
                                {/* Explanation */}
                                <div className='phg-legend-explanation'>
                                    Colors show allele similarity *at each position*. Same color = same allele sequence.
                                </div>
                            </div> {/* End phg-card-content */}
                        </div> {/* End phg-card */}
                    </div> {/* End phg-legend-panel */}

                </ReactFlow>
            </div> {/* End phg-reactflow-wrapper */}
        </div> // End phg-visualization-container
    );
};

export default PHGVisualization;
