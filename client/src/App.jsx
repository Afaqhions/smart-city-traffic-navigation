import { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import { Network } from 'vis-network';
import { DataSet } from 'vis-data';
import { Navigation, ArrowRight, Activity, Trash2, Route, GitBranch, AlertTriangle, Search, Menu, X, Loader2, Network as NetworkIcon } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet icon issue
const fixLeafletIcon = () => {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });
};
fixLeafletIcon();

// Custom marker icons
const createCustomIcon = (type, color = null) => {
  const colors = {
    start: '#0066ff',
    end: '#ff3333',
    path: '#00aa55',
    traffic: '#ff9900',
    landmark: '#8B5CF6'
  };
  
  const bgColor = color || colors[type];
  
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      background-color: ${bgColor};
      width: ${type === 'landmark' ? '20px' : '28px'};
      height: ${type === 'landmark' ? '20px' : '28px'};
      border: 2px solid white;
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <span style="
        color: white;
        font-weight: bold;
        font-size: ${type === 'landmark' ? '8px' : '12px'};
      ">${type === 'start' ? 'A' : type === 'end' ? 'B' : type === 'landmark' ? '📍' : ''}</span>
    </div>`,
    iconSize: type === 'landmark' ? [20, 20] : [28, 28],
    iconAnchor: type === 'landmark' ? [10, 10] : [14, 14],
    popupAnchor: type === 'landmark' ? [0, -10] : [0, -14]
  });
};

// Lahore city center coordinates
const lahoreCenter = [31.5497, 74.3436];

// Location coordinates mapping
const lahoreLocations = {
  "UET Lahore": { lat: 31.5785, lng: 74.4022, type: "university", popularity: 95 },
  "University of Punjab": { lat: 31.5680, lng: 74.4650, type: "university", popularity: 90 },
  "Lahore Railway Station": { lat: 31.5712, lng: 74.3042, type: "transit", popularity: 85 },
  "Lahore Airport (Allama Iqbal)": { lat: 31.5214, lng: 74.4031, type: "transit", popularity: 80 },
  "Mall Road": { lat: 31.5636, lng: 74.3142, type: "shopping", popularity: 98 },
  "Anarkali Bazaar": { lat: 31.5654, lng: 74.3331, type: "shopping", popularity: 92 },
  "Minhaj-ul-Quran International": { lat: 31.5385, lng: 74.4032, type: "religious", popularity: 75 },
  "Shalimar Gardens": { lat: 31.5882, lng: 74.3642, type: "tourist", popularity: 88 },
  "Badshahi Mosque": { lat: 31.5883, lng: 74.3104, type: "tourist", popularity: 96 },
  "Lahore Zoo": { lat: 31.5402, lng: 74.3331, type: "tourist", popularity: 82 },
  "Canal Bank": { lat: 31.5736, lng: 74.3592, type: "scenic", popularity: 70 },
  "Ferozepur Road": { lat: 31.5682, lng: 74.3782, type: "road", popularity: 85 },
  "Gulberg III": { lat: 31.5454, lng: 74.3952, type: "commercial", popularity: 94 },
  "Lahore Cantt": { lat: 31.5876, lng: 74.3492, type: "military", popularity: 60 },
  "Model Town": { lat: 31.5185, lng: 74.4122, type: "residential", popularity: 78 },
  "Garden Town": { lat: 31.5298, lng: 74.3832, type: "residential", popularity: 82 },
  "Shalimar Block": { lat: 31.5500, lng: 74.4400, type: "residential", popularity: 65 },
  "Ichra": { lat: 31.5570, lng: 74.3080, type: "commercial", popularity: 75 },
  "Nishtar Town": { lat: 31.5350, lng: 74.3200, type: "residential", popularity: 68 },
  "Township": { lat: 31.5100, lng: 74.3500, type: "residential", popularity: 72 },
  "Wapda Town": { lat: 31.5200, lng: 74.3900, type: "residential", popularity: 70 },
  "Johar Town": { lat: 31.4950, lng: 74.3700, type: "residential", popularity: 85 },
  "Mughalpura": { lat: 31.5900, lng: 74.3700, type: "residential", popularity: 55 },
  "Mozang": { lat: 31.5800, lng: 74.3250, type: "residential", popularity: 60 },
  "Baghbanpura": { lat: 31.5950, lng: 74.3800, type: "residential", popularity: 50 },
  "Wahdat Colony": { lat: 31.5850, lng: 74.3850, type: "residential", popularity: 52 },
  "Samanabad": { lat: 31.5550, lng: 74.3400, type: "residential", popularity: 65 },
  "Yousafabad": { lat: 31.5400, lng: 74.3500, type: "residential", popularity: 60 },
  "Kot Lakhpat": { lat: 31.5300, lng: 74.4200, type: "industrial", popularity: 58 },
  "Baroon": { lat: 31.5600, lng: 74.3950, type: "residential", popularity: 45 }
};

// Traffic data management
const TrafficLayer = ({ trafficData, onTrafficClick }) => {
  useMapEvents({});
  
  if (!trafficData || trafficData.length === 0) return null;
  
  return (
    <>
      {trafficData.map((traffic, idx) => {
        const location = lahoreLocations[traffic.road.split('-')[0]];
        if (!location) return null;
        
        const densityColor = traffic.density > 70 ? '#ff3333' : traffic.density > 40 ? '#ff9900' : '#00aa55';
        
        return (
          <CircleMarker
            key={idx}
            center={[location.lat, location.lng]}
            radius={8 + (traffic.density / 20)}
            pathOptions={{
              color: densityColor,
              fillColor: densityColor,
              fillOpacity: 0.6,
              weight: 2
            }}
            eventHandlers={{
              click: () => onTrafficClick?.(traffic)
            }}
          >
            <Popup>
              <div className="p-2 text-center">
                <strong className="text-sm block">{traffic.road}</strong>
                <span className={`text-xs ${traffic.density > 70 ? 'text-red-500' : traffic.density > 40 ? 'text-orange-500' : 'text-green-500'}`}>
                  Density: {traffic.density}%
                </span>
                {traffic.is_accident && (
                  <div className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <AlertTriangle size={10} /> Accident Reported
                  </div>
                )}
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </>
  );
};

const SPEED_OPTIONS = [
  { label: '0.25x', value: 0.25, ms: 3200 },
  { label: '0.5x', value: 0.5, ms: 1600 },
  { label: '1x', value: 1, ms: 800 },
  { label: '2x', value: 2, ms: 400 },
  { label: '4x', value: 4, ms: 200 },
];

const DijkstraVisualizer = ({ steps, onStepChange, currentStep }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(SPEED_OPTIONS[2]);
  const intervalRef = useRef(null);
  const logEndRef = useRef(null);
  
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        if (currentStep < steps.length - 1) {
          onStepChange(currentStep + 1);
        } else {
          setIsPlaying(false);
        }
      }, speed.ms);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, currentStep, steps.length, onStepChange, speed.ms]);
  
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentStep]);
  
  if (!steps || steps.length === 0) return null;
  
  const progress = ((currentStep + 1) / steps.length) * 100;
  
  return (
    <div className="bg-gray-900 rounded-none p-4 mt-4 ">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-600 rounded-none flex items-center justify-center ">
            <GitBranch size={13} className="text-white" />
          </div>
          <h4 className="text-white text-xs font-bold uppercase tracking-wider">Dijkstra Algorithm</h4>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => onStepChange(Math.max(0, currentStep - 1))}
            disabled={currentStep <= 0}
            className="px-2 py-1.5 bg-white/10 text-white text-[11px] rounded-none disabled:opacity-30 hover:bg-white/20 transition-all font-medium leading-none"
          >
            Prev
          </button>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-2 py-1.5 bg-blue-600 text-white text-[11px] rounded-none hover:opacity-90 transition-all font-medium leading-none flex items-center gap-1"
          >
            {isPlaying ? (
              <><svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> Pause</>
            ) : (
              <><svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg> Play</>
            )}
          </button>
          <button
            onClick={() => onStepChange(Math.min(steps.length - 1, currentStep + 1))}
            disabled={currentStep >= steps.length - 1}
            className="px-2 py-1.5 bg-white/10 text-white text-[11px] rounded-none disabled:opacity-30 hover:bg-white/20 transition-all font-medium leading-none"
          >
            Next
          </button>
        </div>
      </div>
      
      <div className="w-full h-1 bg-white/10 rounded-none mb-3 overflow-hidden">
        <div
          className="h-full bg-blue-600 rounded-none transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-gray-400 uppercase font-medium">Speed</span>
        <div className="flex gap-1">
          {SPEED_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setSpeed(opt)}
              className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-none transition-all ${
                speed.value === opt.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/10 text-gray-400 hover:bg-white/20'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      
      <div className="bg-black/60 rounded-none p-3 font-mono text-xs max-h-44 overflow-y-auto overflow-x-hidden border border-white/5 break-words">
        {steps.slice(0, currentStep + 1).map((step, i) => {
          const isActive = i === currentStep;
          return (
            <div key={i} className={`mb-1 px-1.5 py-0.5 rounded-none transition-colors ${isActive ? 'bg-blue-500/20' : ''}`}>
              <span className="text-gray-500 mr-2 select-none shrink-0">{String(i + 1).padStart(2, '0')}.</span>
              <span className={isActive ? 'text-blue-300 break-words' : 'text-green-400 break-words'}>{step.action}</span>
              {step.distance !== undefined && step.distance !== Infinity && (
                <span className="text-yellow-400/80 ml-2 shrink-0">(dist: {step.distance})</span>
              )}
            </div>
          );
        })}
        {currentStep < 0 && (
          <div className="text-gray-500 italic">Press Play to start step-by-step visualization</div>
        )}
        <div ref={logEndRef} />
      </div>
      
      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className="bg-white/5 rounded-none p-2 text-center">
          <span className="text-[10px] text-gray-400 uppercase block font-medium">Visited</span>
          <span className="text-white text-sm font-bold font-mono">{steps[currentStep]?.visited_count || 0}</span>
        </div>
        <div className="bg-white/5 rounded-none p-2 text-center">
          <span className="text-[10px] text-gray-400 uppercase block font-medium">Queue</span>
          <span className="text-white text-sm font-bold font-mono">{steps[currentStep]?.queue_size || 0}</span>
        </div>
        <div className="bg-white/5 rounded-none p-2 text-center">
          <span className="text-[10px] text-gray-400 uppercase block font-medium">Steps</span>
          <span className="text-white text-sm font-bold font-mono">{currentStep + 1}/{steps.length}</span>
        </div>
      </div>
    </div>
  );
};

// Map Detail Modal Component
const MapDetailModal = ({ startCoords, endCoords, routePositions, path, onClose }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: lahoreCenter,
      zoom: 12,
      zoomControl: true,
      scrollWheelZoom: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    if (startCoords) {
      L.marker(startCoords, { icon: createCustomIcon('start') }).addTo(map);
    }
    if (endCoords) {
      L.marker(endCoords, { icon: createCustomIcon('end') }).addTo(map);
    }
    if (routePositions.length > 0) {
      L.polyline(routePositions, {
        color: '#0066ff',
        weight: 6,
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(map);
    }
    if (routePositions.length > 0) {
      map.fitBounds(L.latLngBounds(routePositions).pad(0.1));
    }

    mapInstanceRef.current = map;
    map.invalidateSize();

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col">
      <div className="flex items-center justify-between bg-white px-4 py-2.5 shrink-0 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-600 flex items-center justify-center">
            <Navigation size={14} className="text-white" />
          </div>
          <span className="text-sm font-bold text-gray-900">Detailed Route View</span>
          <span className="text-xs text-gray-400 font-mono">{path.length} stops</span>
        </div>
        <button onClick={onClose} className="p-1.5 hover:bg-gray-100 transition-colors">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div ref={mapRef} className="flex-1 w-full" />
    </div>
  );
};

// Graph Visualization Modal Component
const GraphVisualizationModal = ({ graphData, path, startLocation, endLocation, onClose }) => {
  const graphRef = useRef(null);
  const networkRef = useRef(null);

  useEffect(() => {
    if (!graphRef.current || !graphData) return;

    // Helper function to check if edge is in path
    const isEdgeInPath = (from, to) => {
      if (!path || path.length < 2) return false;
      for (let i = 0; i < path.length - 1; i++) {
        if ((path[i] === from && path[i + 1] === to) || (path[i] === to && path[i + 1] === from)) {
          return true;
        }
      }
      return false;
    };

    // Create nodes from graph data with enhanced styling
    const nodes = new DataSet(
      Object.keys(graphData || {}).map((location) => {
        const isStart = path && path[0] === location;
        const isEnd = path && path[path.length - 1] === location;
        const isPathNode = path && path.includes(location);
        
        const nodeSize = isStart || isEnd ? 45 : isPathNode ? 38 : 32;
        
        return {
          id: location,
          label: location,
          title: location,
          color: {
            background: isStart ? '#0066ff' : isEnd ? '#ff3333' : isPathNode ? '#00dd66' : '#6b7c8f',
            border: isStart ? '#00ccff' : isEnd ? '#ff6688' : isPathNode ? '#00ffaa' : '#4a5d75',
            highlight: {
              background: '#ff6600',
              border: '#ffaa00',
            }
          },
          font: { 
            size: isStart || isEnd ? 13 : isPathNode ? 12 : 11, 
            color: '#ffffff', 
            face: 'Arial, sans-serif',
            bold: { 
              size: isStart || isEnd ? 14 : isPathNode ? 13 : 12, 
              color: '#ffffff',
              face: 'Arial',
            },
            strokeWidth: 3,
            strokeColor: '#0a0e27',
            multi: false,
          },
          borderWidth: isStart || isEnd ? 3 : isPathNode ? 2.5 : 1.5,
          borderWidthSelected: 4,
          size: nodeSize,
          shadow: {
            enabled: true,
            color: isPathNode ? 'rgba(0, 221, 102, 0.9)' : isStart ? 'rgba(0, 102, 255, 0.8)' : isEnd ? 'rgba(255, 51, 51, 0.8)' : 'rgba(100, 120, 140, 0.5)',
            size: isPathNode ? 25 : isStart || isEnd ? 20 : 12,
            x: 0,
            y: 0,
          },
        };
      })
    );

    // Create edges from graph data - handle array format
    const edgesArray = [];
    const edgeSet = new Set();
    
    Object.entries(graphData || {}).forEach(([from, edgesList]) => {
      // Handle if edges are in array format (with to, weight, etc.)
      if (Array.isArray(edgesList)) {
        edgesList.forEach(edge => {
          const to = edge.to || edge;
          const weight = edge.weight || 1;
          const edgeKey = [from, to].sort().join('|');
          
          if (!edgeSet.has(edgeKey)) {
            edgeSet.add(edgeKey);
            const isInPath = isEdgeInPath(from, to);
            
            edgesArray.push({
              from,
              to,
              label: weight.toString(),
              title: `${from} ↔ ${to}: ${weight}`,
              color: isInPath ? {
                color: '#00ff88',
                highlight: '#00ff88',
                hover: '#00ffaa',
                opacity: 1,
              } : {
                color: '#6b7c8f',
                highlight: '#ff9900',
                hover: '#8b9dae',
                opacity: 0.7,
              },
              width: isInPath ? 4 : 1.5,
              font: { 
                size: isInPath ? 13 : 10, 
                color: isInPath ? '#00ff88' : '#7a8a9a',
                face: 'Arial, sans-serif',
                bold: { 
                  size: isInPath ? 14 : 11, 
                  color: isInPath ? '#00ff88' : '#7a8a9a',
                  face: 'Arial',
                },
                strokeWidth: 3,
                strokeColor: '#0a0e27',
              },
              smooth: {
                type: 'continuous',
                forceDirection: false,
                roundness: 0.5,
              },
              shadow: {
                enabled: isInPath,
                color: 'rgba(0, 255, 136, 0.95)',
                size: 20,
                x: 0,
                y: 0,
              },
            });
          }
        });
      } else if (typeof edgesList === 'object') {
        // Handle if edges are in object format
        Object.entries(edgesList).forEach(([to, weight]) => {
          const edgeKey = [from, to].sort().join('|');
          
          if (!edgeSet.has(edgeKey)) {
            edgeSet.add(edgeKey);
            const isInPath = isEdgeInPath(from, to);
            
            edgesArray.push({
              from,
              to,
              label: weight.toString(),
              title: `${from} ↔ ${to}: ${weight}`,
              color: isInPath ? {
                color: '#00ff88',
                highlight: '#00ff88',
                hover: '#00ffaa',
                opacity: 1,
              } : {
                color: '#6b7c8f',
                highlight: '#ff9900',
                hover: '#8b9dae',
                opacity: 0.7,
              },
              width: isInPath ? 4 : 1.5,
              font: { 
                size: isInPath ? 13 : 10, 
                color: isInPath ? '#00ff88' : '#7a8a9a',
                face: 'Arial, sans-serif',
                bold: { 
                  size: isInPath ? 14 : 11, 
                  color: isInPath ? '#00ff88' : '#7a8a9a',
                  face: 'Arial',
                },
                strokeWidth: 3,
                strokeColor: '#0a0e27',
              },
              smooth: {
                type: 'continuous',
                forceDirection: false,
                roundness: 0.5,
              },
              shadow: {
                enabled: isInPath,
                color: 'rgba(0, 255, 136, 0.95)',
                size: 20,
                x: 0,
                y: 0,
              },
            });
          }
        });
      }
    });

    console.log('Nodes:', nodes.get({}));
    console.log('Edges:', edgesArray);

    const edges = new DataSet(edgesArray);

    // Calculate circular layout positions
    const nodeCount = Object.keys(graphData || {}).length;
    const radius = Math.min(600, (nodeCount * 80) / (2 * Math.PI));
    const positions = {};
    
    Object.keys(graphData || {}).forEach((location, index) => {
      const angle = (index / nodeCount) * 2 * Math.PI;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      positions[location] = { x, y };
    });
    
    // Update nodes with fixed positions
    nodes.get({}).forEach(node => {
      const pos = positions[node.id];
      if (pos) {
        nodes.update({
          id: node.id,
          x: pos.x,
          y: pos.y,
          physics: false,
        });
      }
    });

    const options = {
      physics: {
        enabled: false,
      },
      nodes: {
        shape: 'dot',
        font: {
          size: 14,
          color: '#ffffff',
          face: 'Arial, sans-serif',
          strokeWidth: 3,
          strokeColor: '#0a0e27',
          multi: false,
          bold: {
            size: 16,
            color: '#ffffff',
            face: 'Arial',
            strokeWidth: 3,
            strokeColor: '#0a0e27',
          }
        },
        margin: {
          top: 12,
          bottom: 12,
          left: 12,
          right: 12,
        },
      },
      edges: {
        smooth: {
          type: 'continuous',
          forceDirection: false,
          roundness: 0.5,
        },
        arrows: {
          to: false,
          from: false,
          middle: false,
        },
        color: {
          inherit: false,
          opacity: 0.8,
        },
        scaling: {
          min: 0.5,
          max: 20,
        },
        hoverWidth: 4,
        shadow: {
          enabled: true,
          color: 'rgba(0, 0, 0, 0.5)',
          size: 10,
          x: 2,
          y: 2,
        },
      },
      interaction: {
        navigationButtons: true,
        keyboard: true,
        dragNodes: false,
        dragView: true,
        zoomView: true,
        hover: true,
        tooltipDelay: 100,
        navigationButtonStyle: 'dark',
        zoomSpeed: 1,
        multiselect: false,
        selectable: true,
      },
    };

    const data = { nodes, edges };
    
    // Clear and reinit
    if (graphRef.current) {
      graphRef.current.innerHTML = '';
    }
    
    const network = new Network(graphRef.current, data, options);
    networkRef.current = network;

    // Fit view immediately since physics is disabled
    setTimeout(() => {
      network.fit({ 
        animation: { 
          duration: 800, 
          easingFunction: 'easeInOutQuad' 
        } 
      });
    }, 100);

    return () => {
      if (networkRef.current) {
        try {
          networkRef.current.destroy();
        } catch (e) {
          console.error('Error destroying network:', e);
        }
      }
      networkRef.current = null;
    };
  }, [graphData, path]);

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col">
      <div className="flex items-center justify-between bg-white px-4 py-3 shrink-0 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center rounded-lg">
            <NetworkIcon size={15} className="text-white" />
          </div>
          <div>
            <span className="text-sm font-bold text-gray-900 block">City Network Graph</span>
            <span className="text-xs text-gray-600 font-mono">Circular Layout with Route Highlighting</span>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 transition-colors rounded-lg">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div className="flex-1 bg-gradient-to-br from-gray-950 via-blue-950 to-gray-950 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl"></div>
        </div>
        <div ref={graphRef} className="w-full h-full relative z-10" />
        <div className="absolute bottom-4 left-4 bg-gray-900/95 backdrop-blur-sm text-white p-4 rounded-lg text-xs border border-purple-500/30 shadow-2xl graph-legend">
          <div className="font-bold mb-3 text-sm text-purple-300">Network Legend:</div>
          <div className="flex flex-col gap-3">
            <div>
              <div className="font-semibold text-gray-300 mb-2">Nodes:</div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-blue-500 border-2 border-blue-300" style={{boxShadow: '0 0 12px rgba(0, 102, 255, 0.9)'}}></div>
                  <span className="text-gray-200">Start Point</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-red-500 border-2 border-red-300" style={{boxShadow: '0 0 12px rgba(255, 51, 51, 0.9)'}}></div>
                  <span className="text-gray-200">End Point</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-green-500 border-2 border-green-300" style={{boxShadow: '0 0 12px rgba(0, 221, 102, 0.9)'}}></div>
                  <span className="text-gray-200">Path Nodes</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-gray-600 border-2 border-gray-500"></div>
                  <span className="text-gray-400">Other Cities</span>
                </div>
              </div>
            </div>
            <div className="border-t border-gray-700 pt-2">
              <div className="font-semibold text-gray-300 mb-2">Connections:</div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-1 rounded-full bg-green-400" style={{boxShadow: '0 0 8px rgba(0, 255, 136, 0.95)'}}></div>
                  <span className="text-gray-200">Shortest Route</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-0.5 rounded-full bg-gray-500"></div>
                  <span className="text-gray-400">Other Roads</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Map click handler component
const MapClickHandler = ({ onMapClick }) => {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng);
    }
  });
  return null;
};

// Main App Component
function App() {
  // State management
  const [startLocation, setStartLocation] = useState('');
  const [endLocation, setEndLocation] = useState('');
  const [startCoords, setStartCoords] = useState(null);
  const [endCoords, setEndCoords] = useState(null);
  const [path, setPath] = useState([]);
  const [distance, setDistance] = useState(null);
  const [routePositions, setRoutePositions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [roadDistance, setRoadDistance] = useState(null);
  const [algoSteps, setAlgoSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(-1);
  const [trafficData, setTrafficData] = useState([]);
  const [considerTraffic, setConsiderTraffic] = useState(true);
  const [alternativePaths, setAlternativePaths] = useState([]);
  const [selectedPath, setSelectedPath] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [estimatedTime, setEstimatedTime] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState('info');
  const [backendConnected, setBackendConnected] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [graphData, setGraphData] = useState(null);
  const [trafficRoad, setTrafficRoad] = useState('');
  const [trafficDensity, setTrafficDensity] = useState(50);
  const [updatingTraffic, setUpdatingTraffic] = useState(false);
  const [showDetailedGraph, setShowDetailedGraph] = useState(false);
  const [showPathOnMap, setShowPathOnMap] = useState(false);
  const [showGraphView, setShowGraphView] = useState(false);
  
  // Show toast helper
  const showStatusToast = useCallback((message, type = 'info', duration = 3000) => {
    setStatusMessage(message);
    setStatusType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), duration);
  }, []);
  
  // Fetch locations and graph from backend
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [locRes, graphRes] = await Promise.all([
          fetch('http://localhost:18080/api/locations'),
          fetch('http://localhost:18080/api/graph')
        ]);
        await locRes.json();
        const graphJson = await graphRes.json();
        if (graphJson.graph) setGraphData(graphJson.graph);
        setBackendConnected(true);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        setBackendConnected(false);
        showStatusToast('Backend server not running. Using local data.', 'error', 5000);
      }
    };
    fetchInitialData();
  }, [showStatusToast]);
  
  // Fetch traffic data periodically
  useEffect(() => {
    const fetchTraffic = async () => {
      try {
        const response = await fetch('http://localhost:18080/api/traffic');
        const data = await response.json();
        if (data.traffic) setTrafficData(data.traffic);
      } catch {
        console.error('Failed to fetch traffic');
      }
    };
    fetchTraffic();
    const interval = setInterval(fetchTraffic, 30000);
    return () => clearInterval(interval);
  }, []);
  
  // Find nearest location to clicked coordinates
  const findNearestLocation = (lat, lng) => {
    let nearest = null;
    let minDist = Infinity;
    
    for (const [name, coords] of Object.entries(lahoreLocations)) {
      const dist = Math.sqrt(
        Math.pow(lat - coords.lat, 2) + Math.pow(lng - coords.lng, 2)
      );
      if (dist < minDist) {
        minDist = dist;
        nearest = name;
      }
    }
    return nearest;
  };
  
  // Handle map click for location selection
  const handleMapClick = (latlng) => {
    const nearest = findNearestLocation(latlng.lat, latlng.lng);
    
    if (!startLocation && !startCoords) {
      setStartLocation(nearest);
      setStartCoords([latlng.lat, latlng.lng]);
      setEndLocation('');
      setEndCoords(null);
      setPath([]);
      setDistance(null);
      setRoutePositions([]);
      setAlgoSteps([]);
      setCurrentStep(-1);
      setAlternativePaths([]);
      showStatusToast(`Start point set to ${nearest}`, 'success');
    } else if (!endLocation && !endCoords) {
      setEndLocation(nearest);
      setEndCoords([latlng.lat, latlng.lng]);
      showStatusToast(`Destination set to ${nearest}`, 'success');
    } else {
      setStartLocation(nearest);
      setStartCoords([latlng.lat, latlng.lng]);
      setEndLocation('');
      setEndCoords(null);
      setPath([]);
      setDistance(null);
      setRoutePositions([]);
      setAlgoSteps([]);
      setCurrentStep(-1);
      setAlternativePaths([]);
      showStatusToast(`Start point changed to ${nearest}`, 'info');
    }
  };
  
  // Handle location selection from dropdown
  const handleSelectLocation = (location, type) => {
    const coords = lahoreLocations[location];
    if (type === 'start') {
      setStartLocation(location);
      setStartCoords([coords.lat, coords.lng]);
      setRoutePositions([]);
      setPath([]);
      setDistance(null);
      setAlgoSteps([]);
      setCurrentStep(-1);
      setAlternativePaths([]);
    } else {
      setEndLocation(location);
      setEndCoords([coords.lat, coords.lng]);
      setRoutePositions([]);
      setPath([]);
      setDistance(null);
      setAlgoSteps([]);
      setCurrentStep(-1);
      setAlternativePaths([]);
    }
  };
  
  // Calculate shortest path
  const handleCalculate = async () => {
    if ((!startLocation && !startCoords) || (!endLocation && !endCoords)) {
      showStatusToast('Please select both start and destination', 'error', 3000);
      return;
    }
    
    setLoading(true);
    setRoadDistance(null);
    setAlternativePaths([]);
    setShowPathOnMap(false);
    
    const start = startLocation || findNearestLocation(startCoords[0], startCoords[1]);
    const end = endLocation || findNearestLocation(endCoords[0], endCoords[1]);
    
    try {
      // Get shortest path
      const response = await fetch('http://localhost:18080/api/navigate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ start, end, consider_traffic: considerTraffic })
      });
      const data = await response.json();
      
      if (data.error) {
        showStatusToast(data.error, 'error', 5000);
        setPath([]);
        setDistance(null);
      } else {
        setPath(data.path || []);
        setDistance(data.distance);
        setEstimatedTime(data.estimated_time || data.distance * 2);
        
        // Generate algorithm steps visualization
        const steps = [];
        let visited = new Set();
        let distances = {};
        
        distances[start] = 0;
        steps.push({ action: `Initialize: distance(${start}) = 0`, distance: 0, visited_count: 0, queue_size: 1 });
        
        for (let i = 0; i < data.path.length - 1; i++) {
          visited.add(data.path[i]);
          steps.push({ 
            action: `Visit ${data.path[i]}, update neighbors`, 
            distance: distances[data.path[i]],
            visited_count: visited.size,
            queue_size: Math.max(1, data.path.length - i)
          });
        }
        
        steps.push({ action: `Goal reached! Shortest path found with total distance ${data.distance}`, distance: data.distance });
        setAlgoSteps(steps);
        setCurrentStep(-1);
        
        // Get real road distance using OSRM
        const positions = data.path.map(loc => {
          const coords = lahoreLocations[loc];
          return [coords.lat, coords.lng];
        });
        
        let totalOSRMDistance = 0;
        const routeCoords = [];
        
        for (let i = 0; i < positions.length - 1; i++) {
          const from = positions[i];
          const to = positions[i + 1];
          try {
            const osrmResponse = await fetch(
              `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`
            );
            const osrmData = await osrmResponse.json();
            if (osrmData.code === 'Ok' && osrmData.routes[0]) {
              const geometry = osrmData.routes[0].geometry.coordinates;
              routeCoords.push(...geometry.map(coord => [coord[1], coord[0]]));
              totalOSRMDistance += osrmData.routes[0].distance;
            } else {
              routeCoords.push(from, to);
            }
          } catch {
            routeCoords.push(from, to);
          }
        }
        
        if (positions.length > 0 && routeCoords.length === 0) {
          routeCoords.unshift(positions[0]);
        }
        
        setRoutePositions(routeCoords.length > 0 ? routeCoords : positions);
        setRoadDistance((totalOSRMDistance / 1000).toFixed(1));
        
        // Fetch alternative paths
        const altResponse = await fetch('http://localhost:18080/api/alternatives', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ start, end, k: 3 })
        });
        const altData = await altResponse.json();
        if (altData.paths && altData.paths.length > 0) {
          setAlternativePaths(altData.paths);
        }
      }
    } catch (error) {
      console.error('Navigation error:', error);
      showStatusToast('Failed to calculate route. Please check if the backend is running.', 'error', 5000);
    }
    
    setLoading(false);
  };
  
  // Clear all selections
  const handleClear = () => {
    setStartLocation('');
    setEndLocation('');
    setStartCoords(null);
    setEndCoords(null);
    setPath([]);
    setDistance(null);
    setRoutePositions([]);
    setAlgoSteps([]);
    setCurrentStep(-1);
    setAlternativePaths([]);
    setSelectedPath(0);
    setEstimatedTime(null);
    setRoadDistance(null);
    setShowPathOnMap(false);
    setShowDetailedGraph(false);
    showStatusToast('All selections cleared', 'info', 2000);
  };
  
  // Swap start and destination
  const handleSwap = () => {
    setStartLocation(endLocation);
    setEndLocation(startLocation);
    setStartCoords(endCoords);
    setEndCoords(startCoords);
    setPath([]);
    setDistance(null);
    setRoutePositions([]);
    setShowPathOnMap(false);
    showStatusToast('Start and destination swapped', 'info', 2000);
  };
  
  // Update traffic conditions
  const handleTrafficUpdate = async () => {
    if (!trafficRoad) {
      showStatusToast('Select a road segment', 'error');
      return;
    }
    setUpdatingTraffic(true);
    try {
      const res = await fetch('http://localhost:18080/api/traffic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ road: trafficRoad, density: trafficDensity })
      });
      const data = await res.json();
      if (data.status === 'success') {
        showStatusToast(`Traffic updated: ${trafficRoad} (${trafficDensity}%)`, 'success');
        const trafficRes = await fetch('http://localhost:18080/api/traffic');
        const trafficJson = await trafficRes.json();
        if (trafficJson.traffic) setTrafficData(trafficJson.traffic);
      } else {
        showStatusToast('Failed to update traffic', 'error');
      }
    } catch {
      showStatusToast('Backend offline', 'error');
    }
    setUpdatingTraffic(false);
  };

  // Collect all road segments from graph data for traffic selector
  const roadSegments = graphData
    ? Object.entries(graphData).flatMap(([from, edges]) =>
        edges.map(e => ({ id: `${from}-${e.to}`, label: `${from} → ${e.to}` }))
      )
    : [];

  // Filter locations based on search term
  const filteredLocations = Object.keys(lahoreLocations).filter(loc =>
    loc.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Get location type color
  const getLocationTypeColor = (type) => {
    const colors = {
      university: '#8B5CF6',
      transit: '#0066ff',
      shopping: '#ff9900',
      tourist: '#ff3333',
      religious: '#00aa55',
      scenic: '#00cccc',
      commercial: '#ff6600',
      residential: '#666666',
      military: '#996633',
      industrial: '#999999',
      road: '#00aa55'
    };
    return colors[type] || '#0066ff';
  };
  
  return (
    <div className="h-screen w-full bg-[#f0f2f5] flex flex-col overflow-hidden">
      {/* Toast Notification */}
      <div
        className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${
          showToast ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
        }`}
      >
        <div className={`px-5 py-3 rounded-none  text-sm font-medium flex items-center gap-2.5 ${
          statusType === 'error' ? 'bg-red-500/90 text-white' :
          statusType === 'success' ? 'bg-emerald-500/90 text-white' :
          'bg-gray-900/90 text-white'
        }`}>
          {statusType === 'error' ? <AlertTriangle size={14} /> :
           statusType === 'success' ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg> :
           <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>}
          {statusMessage}
        </div>
      </div>

      {/* Top Navbar */}
      <div className="h-14 shrink-0 bg-white border-b border-gray-200/70 flex items-center justify-between px-4  z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-none transition-colors"
            title={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          >
            <Menu size={18} className="text-gray-600" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-none flex items-center justify-center  ">
              <Navigation size={16} className="text-white" />
            </div>
            <div>
              <h1 className="font-extrabold text-sm tracking-tight text-gray-900">Smart City Navigation</h1>
              <p className="text-[10px] text-gray-400 font-medium leading-tight">Dijkstra Visualizer — Lahore</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 bg-gray-50 rounded-none px-3 py-1.5 border border-gray-200">
            <div className={`w-2 h-2 rounded-none ${backendConnected ? 'bg-emerald-500' : 'bg-red-400'}`} />
            <span className="text-[11px] font-medium text-gray-500">{backendConnected ? 'Connected' : 'Offline'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
            <Route size={12} />
            <span className="hidden sm:inline font-mono font-medium">O((V+E)logV)</span>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className={`bg-white/95 border-r border-gray-200/50 transition-all duration-300 ease-out shrink-0 overflow-hidden flex flex-col ${
          sidebarOpen ? 'w-80' : 'w-0'
        }`}>
          <div className="p-4 flex-1 overflow-y-auto overflow-x-hidden">
            {/* Sidebar Header */}
            <div className="flex justify-between items-center mb-5 pb-4 border-b border-gray-200/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-blue-600 rounded-none flex items-center justify-center  ">
                  <Navigation size={17} className="text-white" />
                </div>
                <div>
                  <h2 className="font-extrabold text-sm tracking-tight text-gray-900">Smart Nav</h2>
                  <p className="text-[10px] text-gray-400 font-medium">Lahore Navigation</p>
                </div>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-none transition-colors">
                <X size={16} className="text-gray-400" />
              </button>
            </div>
            
            {/* Location Search */}
            <div className="mb-3">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search all locations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-none text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                />
              </div>
            </div>

            {/* Location List */}
            {searchTerm && (
              <div className="mb-4 border border-gray-200 bg-white max-h-48 overflow-y-auto">
                {filteredLocations.length === 0 ? (
                  <div className="p-3 text-xs text-gray-400 text-center">No locations found</div>
                ) : (
                  filteredLocations.map(loc => {
                    const info = lahoreLocations[loc];
                    return (
                      <button
                        key={loc}
                        onClick={() => {
                          if (!startLocation) {
                            handleSelectLocation(loc, 'start');
                            setSearchTerm('');
                          } else if (!endLocation && loc !== startLocation) {
                            handleSelectLocation(loc, 'end');
                            setSearchTerm('');
                          } else {
                            handleSelectLocation(loc, 'start');
                            setSearchTerm('');
                          }
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors"
                      >
                        <div className="w-2 h-2 shrink-0" style={{ backgroundColor: getLocationTypeColor(info.type) }} />
                        <span className="text-xs font-medium text-gray-800 flex-1">{loc}</span>
                        <span className="text-[10px] uppercase text-gray-400 font-medium">{info.type}</span>
                      </button>
                    );
                  })
                )}
              </div>
            )}
            
            {/* Start Location */}
            <div className="mb-3">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Start Point</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-none bg-blue-500  " />
                <select 
                  className="w-full border border-gray-200 bg-gray-50 pl-8 pr-8 py-2.5 text-sm font-medium text-gray-900 rounded-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all"
                  value={startLocation}
                  onChange={(e) => handleSelectLocation(e.target.value, 'start')}
                >
                  <option value="" className="text-gray-400">Select Start</option>
                  {filteredLocations.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Swap Button */}
            <div className="flex justify-center py-0.5">
              <button
                onClick={handleSwap}
                disabled={!startLocation && !endLocation}
                className="p-1.5 hover:bg-gray-100 rounded-none transition-all disabled:opacity-30 group"
              >
                <ArrowRight size={16} className="text-gray-400 rotate-90 group-hover:text-blue-500 transition-colors" />
              </button>
            </div>
            
            {/* Destination */}
            <div className="mb-4">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Destination</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-none bg-red-400  " />
                <select 
                  className="w-full border border-gray-200 bg-gray-50 pl-8 pr-8 py-2.5 text-sm font-medium text-gray-900 rounded-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all"
                  value={endLocation}
                  onChange={(e) => handleSelectLocation(e.target.value, 'end')}
                >
                  <option value="" className="text-gray-400">Select Destination</option>
                  {filteredLocations.filter(l => l !== startLocation).map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Traffic Toggle */}
            <div className="mb-4 flex items-center justify-between p-3 bg-gray-50/80 rounded-none border border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className={`p-1.5 rounded-none ${considerTraffic ? 'bg-orange-100' : 'bg-gray-100'}`}>
                  <AlertTriangle size={14} className={considerTraffic ? 'text-orange-500' : 'text-gray-400'} />
                </div>
                <span className="text-xs font-semibold text-gray-700">Consider Traffic</span>
              </div>
              <button
                onClick={() => setConsiderTraffic(!considerTraffic)}
                className={`px-2.5 py-1 text-xs font-bold uppercase tracking-wider border-2 ${
                  considerTraffic ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-500 border-gray-300'
                }`}
              >
                {considerTraffic ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* Traffic Management */}
            <details className="mb-4 group">
              <summary className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 cursor-pointer hover:text-gray-700 flex items-center gap-1.5 select-none">
                <AlertTriangle size={12} /> Traffic Simulation
                <svg className="ml-auto group-open:rotate-180 transition-transform" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m6 9 6 6 6-6"/></svg>
              </summary>
              <div className="space-y-2.5 border border-gray-200 bg-gray-50 p-3">
                <p className="text-[10px] text-gray-400 leading-relaxed">
                  Simulate traffic on any road segment. Dijkstra's algorithm will adjust path weights based on density.
                </p>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Road Segment</label>
                  <select
                    value={trafficRoad}
                    onChange={(e) => setTrafficRoad(e.target.value)}
                    className="w-full border border-gray-200 bg-white px-2.5 py-2 text-xs text-gray-800 rounded-none focus:border-blue-500 outline-none"
                  >
                    <option value="">Select road...</option>
                    {roadSegments.map(seg => (
                      <option key={seg.id} value={seg.id}>{seg.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
                    Density: <span className="text-blue-600 font-mono">{trafficDensity}%</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={trafficDensity}
                    onChange={(e) => setTrafficDensity(Number(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                  <div className="flex justify-between text-[9px] text-gray-400 mt-0.5">
                    <span>Clear</span>
                    <span>Moderate</span>
                    <span>Heavy</span>
                  </div>
                </div>
                <button
                  onClick={handleTrafficUpdate}
                  disabled={!trafficRoad || updatingTraffic}
                  className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white text-xs font-bold py-2 uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5"
                >
                  {updatingTraffic ? <Loader2 size={12} className="animate-spin" /> : <AlertTriangle size={12} />}
                  {updatingTraffic ? 'Updating...' : 'Apply Traffic'}
                </button>
              </div>
            </details>
            
            {/* Action Buttons */}
            <div className="space-y-2.5">
              <button 
                onClick={handleCalculate}
                disabled={(!startLocation && !startCoords) || (!endLocation && !endCoords) || loading}
                className="w-full bg-blue-600 hover:opacity-90 disabled:opacity-40 text-white font-bold py-2.5 px-4 text-sm uppercase tracking-wider rounded-none transition-all    flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Route size={16} />}
                {loading ? 'Calculating...' : 'Find Shortest Path'}
              </button>
              
              <button 
                onClick={handleClear}
                className="w-full bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-2.5 px-4 text-sm rounded-none transition-all flex items-center justify-center gap-2 "
              >
                <Trash2 size={14} /> Clear All
              </button>
            </div>
            
            {/* Info Panel */}
            <div className="mt-4 bg-gray-900 rounded-none p-4  animate-fade-in">
              <h3 className="text-[11px] font-bold text-white/80 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Activity size={12} /> Algorithm Info
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center bg-white/5 rounded-none px-3 py-2">
                  <span className="text-xs text-gray-400">Method</span>
                  <span className="text-xs font-bold text-blue-400">Dijkstra</span>
                </div>
                <div className="flex justify-between items-center bg-white/5 rounded-none px-3 py-2">
                  <span className="text-xs text-gray-400">Data Structure</span>
                  <span className="text-xs font-mono text-white">Priority Queue</span>
                </div>
                <div className="flex justify-between items-center bg-white/5 rounded-none px-3 py-2">
                  <span className="text-xs text-gray-400">Complexity</span>
                  <span className="text-xs font-mono text-emerald-400">O((V+E)logV)</span>
                </div>
                <div className="flex justify-between items-center bg-white/5 rounded-none px-3 py-2">
                  <span className="text-xs text-gray-400">Locations</span>
                  <span className="text-xs font-mono text-white">{Object.keys(lahoreLocations).length}</span>
                </div>
                <div className="flex justify-between items-center bg-white/5 rounded-none px-3 py-2">
                  <span className="text-xs text-gray-400">Edges</span>
                  <span className="text-xs font-mono text-white">~120</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Results Panel */}
        {distance !== null && distance !== -1 && (
          <div className="w-96 border-r border-gray-200/50 bg-gray-50 flex flex-col shrink-0">
            <div className="p-4 flex-1 overflow-y-auto overflow-x-hidden">
              {/* Trip Summary */}
              <div className="animate-slide-in">
                <div className="bg-white rounded-none p-4 border border-gray-100">
                  <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-3">Trip Summary</h3>
                  <div className="grid grid-cols-2 gap-2.5 mb-3">
                    <div className="bg-blue-600 rounded-none p-3 text-center">
                      <span className="text-[9px] font-bold uppercase tracking-wider opacity-75 block">Distance</span>
                      <p className="text-xl font-black tracking-tight">{distance.toFixed(1)} <span className="text-sm font-medium opacity-75">km</span></p>
                    </div>
                    <div className="bg-emerald-600 rounded-none p-3 text-center">
                      <span className="text-[9px] font-bold uppercase tracking-wider opacity-75 block">Stops</span>
                      <p className="text-xl font-black tracking-tight">{path.length} <span className="text-sm font-medium opacity-75">nodes</span></p>
                    </div>
                  </div>
                  
                  {roadDistance && (
                    <div className="flex items-center justify-between bg-blue-50 rounded-none px-3 py-2.5 mb-3 border border-blue-100">
                      <span className="text-xs font-medium text-blue-700">Road Distance</span>
                      <span className="text-sm font-bold text-blue-700 font-mono">{roadDistance} km</span>
                    </div>
                  )}
                  
                  {estimatedTime && (
                    <div className="bg-purple-600 rounded-none p-3 text-center mb-3">
                      <span className="text-[9px] font-bold uppercase tracking-wider opacity-75 block">Estimated Time</span>
                      <p className="text-xl font-black tracking-tight">{estimatedTime} <span className="text-sm font-medium opacity-75">min</span></p>
                    </div>
                  )}
                  
                  
                  {/* Path Sequence */}
                  <div>
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-2">Path Sequence</span>
                    <div className="space-y-1 max-h-44 overflow-y-auto overflow-x-hidden custom-scrollbar pr-1">
                      {path.map((step, i) => (
                        <div key={i} className="flex items-center gap-2.5 bg-white p-2.5 rounded-none border border-gray-100 hover:border-gray-200 transition-all">
                          <div className={`w-6 h-6 flex items-center justify-center text-[10px] font-bold rounded-none shrink-0 ${
                            i === 0 ? 'bg-blue-600 text-white' : 
                            i === path.length - 1 ? 'bg-red-500 text-white' : 
                            'bg-gray-200 text-gray-600'
                          }`}>
                            {i + 1}
                          </div>
                          <span className="text-xs font-medium text-gray-800 leading-tight truncate min-w-0">{step}</span>
                          {i < path.length - 1 && (
                            <svg className="ml-auto shrink-0 text-gray-300" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Detailed View & Graph View Buttons */}
              <div className="grid grid-cols-2 gap-2 mt-4">
                <button
                  onClick={() => setShowDetailedGraph(true)}
                  className="py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider rounded-none flex items-center justify-center gap-2 transition-all"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  Map View
                </button>
                
                <button
                  onClick={() => setShowGraphView(true)}
                  disabled={!graphData}
                  className="py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-xs font-bold uppercase tracking-wider rounded-none flex items-center justify-center gap-2 transition-all"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/><path d="M12 13v4M19 11v4M5 11v4"/></svg>
                  Graph View
                </button>
              </div>
              
              {/* Algorithm Visualization */}
              {algoSteps.length > 0 && (
                <DijkstraVisualizer 
                  steps={algoSteps}
                  currentStep={currentStep}
                  onStepChange={setCurrentStep}
                />
              )}
              
              {/* Alternative Paths */}
              {alternativePaths.length > 1 && (
                <div className="mt-4 animate-slide-in">
                  <div className="bg-white rounded-none p-4 border border-gray-100">
                    <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <GitBranch size={12} /> Alternative Routes
                    </h3>
                    <div className="space-y-2">
                      {alternativePaths.slice(1).map((alt, idx) => (
                        <div 
                          key={idx}
                          className={`p-3 rounded-none cursor-pointer transition-all ${
                            selectedPath === idx + 1
                              ? 'border-2 border-purple-500 bg-purple-50/50'
                              : 'border border-gray-200 bg-white hover:border-gray-300'
                          }`}
                          onClick={() => {
                            setSelectedPath(idx + 1);
                            setPath(alt.path);
                            setDistance(alt.distance);
                            setEstimatedTime(alt.distance * 2);
                          }}
                        >
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-bold flex items-center gap-1.5">
                              <div className={`w-4 h-4 rounded-none flex items-center justify-center text-[9px] font-bold ${
                                selectedPath === idx + 1 ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-500'
                              }`}>
                                {idx + 2}
                              </div>
                              Route {idx + 2}
                            </span>
                            <span className="text-xs font-mono font-bold text-gray-600">{alt.distance.toFixed(1)} km</span>
                          </div>
                          <div className="text-[11px] text-gray-400 truncate">
                            {alt.path.slice(0, 3).join(' → ')}...
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Main Map Area */}
        <div className="flex-1 relative">
          <div className="absolute inset-0">
            <MapContainer 
              center={lahoreCenter} 
              zoom={12} 
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={true}
              zoomControl={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              <MapClickHandler onMapClick={handleMapClick} />
              
              {/* Traffic Layer */}
              <TrafficLayer trafficData={trafficData} onTrafficClick={(t) => console.log(t)} />
              
              {/* Start Marker */}
              {startCoords && (
                <Marker position={startCoords} icon={createCustomIcon('start')}>
                  <Popup>
                    <div className="text-center p-1">
                      <strong className="text-blue-600 block text-sm">Start Point</strong>
                      <span className="text-xs text-gray-600">{startLocation}</span>
                    </div>
                  </Popup>
                </Marker>
              )}
              
              {/* End Marker */}
              {endCoords && (
                <Marker position={endCoords} icon={createCustomIcon('end')}>
                  <Popup>
                    <div className="text-center p-1">
                      <strong className="text-red-500 block text-sm">Destination</strong>
                      <span className="text-xs text-gray-600">{endLocation}</span>
                    </div>
                  </Popup>
                </Marker>
              )}
              
              {/* All Location Markers */}
              {filteredLocations.map(location => {
                const coords = lahoreLocations[location];
                const isStart = location === startLocation;
                const isEnd = location === endLocation;
                
                if (isStart || isEnd) return null;
                
                return (
                  <Marker 
                    key={location}
                    position={[coords.lat, coords.lng]} 
                    icon={createCustomIcon('landmark', getLocationTypeColor(coords.type))}
                    eventHandlers={{
                      click: () => {
                        if (!startLocation) {
                          handleSelectLocation(location, 'start');
                        } else if (!endLocation && location !== startLocation) {
                          handleSelectLocation(location, 'end');
                        }
                      }
                    }}
                  >
                    <Popup>
                      <div className="text-center p-1.5 min-w-[120px]">
                        <strong className="block text-sm mb-0.5">{location}</strong>
                        <span className="text-[11px] text-gray-400 capitalize font-medium">{coords.type}</span>
                        <button
                          onClick={() => {
                            if (!startLocation) {
                              handleSelectLocation(location, 'start');
                            } else if (!endLocation && location !== startLocation) {
                              handleSelectLocation(location, 'end');
                            }
                          }}
                          className="mt-2.5 w-full text-xs bg-blue-600 text-white font-semibold px-3 py-1.5 rounded-none  "
                        >
                          Set as {!startLocation ? 'Start' : 'Destination'}
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
              
              {/* Route Polyline */}
              {routePositions.length > 0 && (
                <Polyline 
                  positions={routePositions}
                  pathOptions={{
                    color: selectedPath > 0 ? '#8B5CF6' : '#0066ff',
                    weight: 6,
                    opacity: 0.9,
                    lineCap: 'round',
                    lineJoin: 'round'
                  }}
                />
              )}
              
              {/* Highlighted Path Nodes */}
              {path.map((loc, idx) => {
                if (idx === 0 || idx === path.length - 1) return null;
                const coords = lahoreLocations[loc];
                if (!coords) return null;
                return (
                  <CircleMarker
                    key={idx}
                    center={[coords.lat, coords.lng]}
                    radius={5}
                    pathOptions={{
                      color: '#0066ff',
                      fillColor: '#0066ff',
                      fillOpacity: 0.6,
                      weight: 2
                    }}
                  />
                );
              })}
            </MapContainer>
          </div>
        </div>
      </div>
      
      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9998] animate-fade-in" style={{ pointerEvents: 'auto' }}>
          <div className="bg-white rounded-none p-8 flex flex-col items-center gap-4 animate-slide-in shadow-xl">
            <Loader2 size={40} className="animate-spin text-blue-600" />
            <div className="text-center">
              <p className="text-sm font-bold text-gray-900">Calculating Optimal Route</p>
              <p className="text-xs text-gray-500 mt-0.5">Running Dijkstra's algorithm...</p>
            </div>
            <div className="w-40 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full" style={{ width: '60%', animation: 'pulse 1s infinite' }} />
            </div>
          </div>
        </div>
      )}
      
      {/* Detailed Map Modal */}
      {showDetailedGraph && (
        <MapDetailModal
          startCoords={startCoords}
          endCoords={endCoords}
          routePositions={routePositions}
          path={path}
          onClose={() => setShowDetailedGraph(false)}
        />
      )}
      
      {/* Graph Visualization Modal */}
      {showGraphView && graphData && (
        <GraphVisualizationModal
          graphData={graphData}
          path={path}
          startLocation={startLocation}
          endLocation={endLocation}
          onClose={() => setShowGraphView(false)}
        />
      )}
    </div>
  );
}

export default App;