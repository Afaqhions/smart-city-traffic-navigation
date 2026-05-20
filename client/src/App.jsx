import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Navigation, ArrowRight, Activity, MapPin, Trash2, Route, GitBranch } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

const fixLeafletIcon = () => {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });
};

fixLeafletIcon();

const lahoreCenter = [31.5497, 74.3436];

const lahoreLocations = {
  "UET Lahore": { lat: 31.5785, lng: 74.4022 },
  "University of Punjab": { lat: 31.5680, lng: 74.4650 },
  "Lahore Railway Station": { lat: 31.5712, lng: 74.3042 },
  "Lahore Airport (Allama Iqbal)": { lat: 31.5214, lng: 74.4031 },
  "Mall Road": { lat: 31.5636, lng: 74.3142 },
  "Anarkali Bazaar": { lat: 31.5654, lng: 74.3331 },
  "Minhaj-ul-Quran International": { lat: 31.5385, lng: 74.4032 },
  "Shalimar Gardens": { lat: 31.5882, lng: 74.3642 },
  "Badshahi Mosque": { lat: 31.5883, lng: 74.3104 },
  "Lahore Zoo": { lat: 31.5402, lng: 74.3331 },
  "Canal Bank": { lat: 31.5736, lng: 74.3592 },
  "Ferozepur Road": { lat: 31.5682, lng: 74.3782 },
  "Gulberg III": { lat: 31.5454, lng: 74.3952 },
  "Lahore Cantt": { lat: 31.5876, lng: 74.3492 },
  "Model Town": { lat: 31.5185, lng: 74.4122 },
  "Garden Town": { lat: 31.5298, lng: 74.3832 },
  "Shalimar Block": { lat: 31.5500, lng: 74.4400 },
  "Ichra": { lat: 31.5570, lng: 74.3080 },
  "Nishtar Town": { lat: 31.5350, lng: 74.3200 },
  "Township": { lat: 31.5100, lng: 74.3500 },
  "Wapda Town": { lat: 31.5200, lng: 74.3900 },
  "Johar Town": { lat: 31.4950, lng: 74.3700 },
  "Mughalpura": { lat: 31.5900, lng: 74.3700 },
  "Mozang": { lat: 31.5800, lng: 74.3250 },
  "Baghbanpura": { lat: 31.5950, lng: 74.3800 },
  "Wahdat Colony": { lat: 31.5850, lng: 74.3850 },
  "Samanabad": { lat: 31.5550, lng: 74.3400 },
  "Yousafabad": { lat: 31.5400, lng: 74.3500 },
  "Kot Lakhpat": { lat: 31.5300, lng: 74.4200 },
  "Baroon": { lat: 31.5600, lng: 74.3950 }
};

const lahoreGraph = {
  "UET Lahore": [
    { to: "Ferozepur Road", weight: 2.5 },
    { to: "Shalimar Gardens", weight: 3.2 },
    { to: "Gulberg III", weight: 4.1 },
    { to: "Minhaj-ul-Quran International", weight: 4.8 },
    { to: "Baroon", weight: 3.0 }
  ],
  "University of Punjab": [
    { to: "UET Lahore", weight: 3.5 },
    { to: "Shalimar Block", weight: 2.0 },
    { to: "Kot Lakhpat", weight: 2.8 },
    { to: "Wapda Town", weight: 3.2 }
  ],
  "Lahore Railway Station": [
    { to: "Anarkali Bazaar", weight: 1.8 },
    { to: "Badshahi Mosque", weight: 2.5 },
    { to: "Canal Bank", weight: 3.2 },
    { to: "Mall Road", weight: 2.4 },
    { to: "Ichra", weight: 2.0 },
    { to: "Mozang", weight: 2.2 }
  ],
  "Lahore Airport (Allama Iqbal)": [
    { to: "Lahore Cantt", weight: 4.0 },
    { to: "Canal Bank", weight: 5.5 },
    { to: "Badshahi Mosque", weight: 7.2 },
    { to: "Wapda Town", weight: 4.8 }
  ],
  "Mall Road": [
    { to: "Lahore Railway Station", weight: 2.4 },
    { to: "Anarkali Bazaar", weight: 1.5 },
    { to: "Canal Bank", weight: 2.8 },
    { to: "Ferozepur Road", weight: 1.8 },
    { to: "Lahore Cantt", weight: 3.5 },
    { to: "Ichra", weight: 2.0 },
    { to: "Samanabad", weight: 2.2 }
  ],
  "Anarkali Bazaar": [
    { to: "Lahore Railway Station", weight: 1.8 },
    { to: "Mall Road", weight: 1.5 },
    { to: "Badshahi Mosque", weight: 1.8 },
    { to: "Gulberg III", weight: 2.5 },
    { to: "Samanabad", weight: 1.5 },
    { to: "Lahore Zoo", weight: 1.2 }
  ],
  "Minhaj-ul-Quran International": [
    { to: "UET Lahore", weight: 4.8 },
    { to: "Gulberg III", weight: 1.8 },
    { to: "Lahore Zoo", weight: 3.5 },
    { to: "Model Town", weight: 4.2 },
    { to: "Wapda Town", weight: 2.5 },
    { to: "Kot Lakhpat", weight: 3.0 }
  ],
  "Shalimar Gardens": [
    { to: "UET Lahore", weight: 3.2 },
    { to: "Lahore Cantt", weight: 4.5 },
    { to: "Canal Bank", weight: 2.5 },
    { to: "Baghbanpura", weight: 2.0 },
    { to: "Mozang", weight: 3.8 },
    { to: "Mughalpura", weight: 2.8 }
  ],
  "Badshahi Mosque": [
    { to: "Lahore Railway Station", weight: 2.5 },
    { to: "Anarkali Bazaar", weight: 1.8 },
    { to: "Lahore Airport (Allama Iqbal)", weight: 7.2 },
    { to: "Lahore Zoo", weight: 4.0 },
    { to: "Mozang", weight: 2.0 }
  ],
  "Lahore Zoo": [
    { to: "Minhaj-ul-Quran International", weight: 3.5 },
    { to: "Badshahi Mosque", weight: 4.0 },
    { to: "Gulberg III", weight: 2.2 },
    { to: "Garden Town", weight: 2.5 },
    { to: "Yousafabad", weight: 1.5 }
  ],
  "Canal Bank": [
    { to: "Lahore Railway Station", weight: 3.2 },
    { to: "Mall Road", weight: 2.8 },
    { to: "Lahore Airport (Allama Iqbal)", weight: 5.5 },
    { to: "Shalimar Gardens", weight: 2.5 },
    { to: "Lahore Cantt", weight: 3.2 },
    { to: "Gulberg III", weight: 3.0 }
  ],
  "Ferozepur Road": [
    { to: "UET Lahore", weight: 2.5 },
    { to: "Mall Road", weight: 1.8 },
    { to: "Lahore Cantt", weight: 2.8 },
    { to: "Gulberg III", weight: 1.5 },
    { to: "Baroon", weight: 1.2 },
    { to: "Wahdat Colony", weight: 2.0 }
  ],
  "Gulberg III": [
    { to: "UET Lahore", weight: 4.1 },
    { to: "Ferozepur Road", weight: 1.5 },
    { to: "Anarkali Bazaar", weight: 2.5 },
    { to: "Minhaj-ul-Quran International", weight: 1.8 },
    { to: "Lahore Zoo", weight: 2.2 },
    { to: "Garden Town", weight: 1.8 },
    { to: "Canal Bank", weight: 3.0 }
  ],
  "Lahore Cantt": [
    { to: "Lahore Airport (Allama Iqbal)", weight: 4.0 },
    { to: "Mall Road", weight: 3.5 },
    { to: "Shalimar Gardens", weight: 4.5 },
    { to: "Canal Bank", weight: 3.2 },
    { to: "Ferozepur Road", weight: 2.8 },
    { to: "Mughalpura", weight: 3.5 },
    { to: "Mozang", weight: 2.8 }
  ],
  "Model Town": [
    { to: "Minhaj-ul-Quran International", weight: 4.2 },
    { to: "Garden Town", weight: 3.0 },
    { to: "Wapda Town", weight: 2.2 },
    { to: "Kot Lakhpat", weight: 2.5 },
    { to: "Johar Town", weight: 3.5 }
  ],
  "Garden Town": [
    { to: "Minhaj-ul-Quran International", weight: 3.0 },
    { to: "Lahore Zoo", weight: 2.5 },
    { to: "Gulberg III", weight: 1.8 },
    { to: "Model Town", weight: 3.0 },
    { to: "Yousafabad", weight: 1.5 },
    { to: "Township", weight: 2.2 }
  ],
  "Shalimar Block": [
    { to: "University of Punjab", weight: 2.0 },
    { to: "Kot Lakhpat", weight: 1.5 },
    { to: "Wapda Town", weight: 2.2 },
    { to: "Baroon", weight: 2.5 }
  ],
  "Ichra": [
    { to: "Lahore Railway Station", weight: 2.0 },
    { to: "Mall Road", weight: 2.0 },
    { to: "Mozang", weight: 1.8 },
    { to: "Samanabad", weight: 1.5 }
  ],
  "Nishtar Town": [
    { to: "Mall Road", weight: 2.5 },
    { to: "Samanabad", weight: 1.8 },
    { to: "Yousafabad", weight: 1.2 },
    { to: "Township", weight: 2.0 }
  ],
  "Township": [
    { to: "Garden Town", weight: 2.2 },
    { to: "Nishtar Town", weight: 2.0 },
    { to: "Yousafabad", weight: 1.5 },
    { to: "Johar Town", weight: 2.5 },
    { to: "Wapda Town", weight: 3.0 }
  ],
  "Wapda Town": [
    { to: "Minhaj-ul-Quran International", weight: 2.5 },
    { to: "Shalimar Block", weight: 2.2 },
    { to: "Model Town", weight: 2.2 },
    { to: "Kot Lakhpat", weight: 1.8 },
    { to: "Johar Town", weight: 2.5 },
    { to: "Lahore Airport (Allama Iqbal)", weight: 4.8 }
  ],
  "Johar Town": [
    { to: "Model Town", weight: 3.5 },
    { to: "Township", weight: 2.5 },
    { to: "Wapda Town", weight: 2.5 },
    { to: "Kot Lakhpat", weight: 3.0 }
  ],
  "Mughalpura": [
    { to: "Shalimar Gardens", weight: 2.8 },
    { to: "Lahore Cantt", weight: 3.5 },
    { to: "Baghbanpura", weight: 2.5 },
    { to: "Mozang", weight: 3.0 }
  ],
  "Mozang": [
    { to: "Lahore Railway Station", weight: 2.2 },
    { to: "Badshahi Mosque", weight: 2.0 },
    { to: "Shalimar Gardens", weight: 3.8 },
    { to: "Lahore Cantt", weight: 2.8 },
    { to: "Ichra", weight: 1.8 },
    { to: "Mughalpura", weight: 3.0 }
  ],
  "Baghbanpura": [
    { to: "Shalimar Gardens", weight: 2.0 },
    { to: "Mughalpura", weight: 2.5 },
    { to: "Wahdat Colony", weight: 2.0 },
    { to: "Baroon", weight: 2.8 }
  ],
  "Wahdat Colony": [
    { to: "Ferozepur Road", weight: 2.0 },
    { to: "Baghbanpura", weight: 2.0 },
    { to: "Baroon", weight: 1.5 },
    { to: "Mughalpura", weight: 2.8 }
  ],
  "Samanabad": [
    { to: "Mall Road", weight: 2.2 },
    { to: "Anarkali Bazaar", weight: 1.5 },
    { to: "Ichra", weight: 1.5 },
    { to: "Nishtar Town", weight: 1.8 },
    { to: "Yousafabad", weight: 1.2 }
  ],
  "Yousafabad": [
    { to: "Lahore Zoo", weight: 1.5 },
    { to: "Garden Town", weight: 1.5 },
    { to: "Nishtar Town", weight: 1.2 },
    { to: "Township", weight: 1.5 },
    { to: "Samanabad", weight: 1.2 }
  ],
  "Kot Lakhpat": [
    { to: "University of Punjab", weight: 2.8 },
    { to: "Shalimar Block", weight: 1.5 },
    { to: "Minhaj-ul-Quran International", weight: 3.0 },
    { to: "Model Town", weight: 2.5 },
    { to: "Wapda Town", weight: 1.8 },
    { to: "Johar Town", weight: 3.0 }
  ],
  "Baroon": [
    { to: "UET Lahore", weight: 3.0 },
    { to: "Ferozepur Road", weight: 1.2 },
    { to: "Shalimar Block", weight: 2.5 },
    { to: "Baghbanpura", weight: 2.8 },
    { to: "Wahdat Colony", weight: 1.5 }
  ]
};

const createCustomIcon = (type) => {
  const colors = {
    start: '#0066ff',
    end: '#ff3333',
    path: '#00aa55'
  };
  
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      background-color: ${colors[type]};
      width: 28px;
      height: 28px;
      border-radius: 4px;
      border: 2px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
    "><span style="
      color: white;
      font-weight: bold;
      font-size: 12px;
    ">${type === 'start' ? 'A' : type === 'end' ? 'B' : ''}</span></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28]
  });
};

function dijkstraVisualized(graph, start, end) {
  const distances = {};
  const previous = {};
  const visited = new Set();
  const steps = [];

  for (const node in graph) {
    distances[node] = Infinity;
    previous[node] = null;
  }

  distances[start] = 0;
  steps.push({ node: start, dist: 0, action: `Start: distance(${start}) = 0`, visited: [] });

  let current = start;
  while (current && current !== end) {
    visited.add(current);
    steps.push({ node: current, dist: distances[current], action: `Visit ${current} (dist: ${distances[current]})`, visited: Array.from(visited) });

    if (graph[current]) {
      for (const edge of graph[current]) {
        const alt = distances[current] + edge.weight;
        if (alt < distances[edge.to]) {
          distances[edge.to] = alt;
          previous[edge.to] = current;
          if (!visited.has(edge.to)) {
            steps.push({ node: edge.to, dist: alt, action: `Update: dist(${edge.to}) = ${alt} via ${current}`, visited: Array.from(visited) });
          }
        }
      }
    }

    let minNode = null;
    let minDist = Infinity;
    for (const node in distances) {
      if (!visited.has(node) && distances[node] < minDist) {
        minDist = distances[node];
        minNode = node;
      }
    }
    current = minNode;
  }

  const path = [];
  let c = end;
  if (previous[c] || c === start) {
    while (c) {
      path.unshift(c);
      c = previous[c];
    }
  }

  return { path: path.length > 0 && path[0] === start ? path : [], distance: distances[end] === Infinity ? -1 : distances[end], steps };
}

function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng);
    }
  });
  return null;
}

function App() {
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
    } else if (!endLocation && !endCoords) {
      setEndLocation(nearest);
      setEndCoords([latlng.lat, latlng.lng]);
    } else {
      setStartLocation(nearest);
      setStartCoords([latlng.lat, latlng.lng]);
      setEndLocation('');
      setEndCoords(null);
      setPath([]);
      setDistance(null);
      setRoutePositions([]);
    }
  };

  const handleSelectLocation = (location, type) => {
    const coords = lahoreLocations[location];
    if (type === 'start') {
      setStartLocation(location);
      setStartCoords([coords.lat, coords.lng]);
      setRoutePositions([]);
      setPath([]);
      setDistance(null);
    } else {
      setEndLocation(location);
      setEndCoords([coords.lat, coords.lng]);
      setRoutePositions([]);
      setPath([]);
      setDistance(null);
    }
  };

  const handleCalculate = async () => {
    if ((!startLocation && !startCoords) || (!endLocation && !endCoords)) return;

    setLoading(true);
    setRoadDistance(null);

    const start = startLocation || findNearestLocation(startCoords[0], startCoords[1]);
    const end = endLocation || findNearestLocation(endCoords[0], endCoords[1]);

    const result = dijkstraVisualized(lahoreGraph, start, end);
    setPath(result.path);
    setDistance(result.distance);
    setAlgoSteps(result.steps);
    setCurrentStep(-1);

    if (result.path.length > 0) {
      const positions = result.path.map(loc => {
        const coords = lahoreLocations[loc];
        return [coords.lat, coords.lng];
      });

      const routeCoords = [];
      let totalOSRMDistance = 0;

      for (let i = 0; i < positions.length - 1; i++) {
        const from = positions[i];
        const to = positions[i + 1];
        try {
          const response = await fetch(
            `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`
          );
          const data = await response.json();
          if (data.code === 'Ok' && data.routes[0]) {
            const geometry = data.routes[0].geometry.coordinates;
            routeCoords.push(...geometry.map(coord => [coord[1], coord[0]]));
            totalOSRMDistance += data.routes[0].distance;
          } else {
            routeCoords.push(from, to);
          }
        } catch (error) {
          routeCoords.push(from, to);
        }
      }
      
      if (positions.length > 0) {
        routeCoords.unshift(positions[0]);
      }
      
      setRoutePositions(routeCoords.length > 0 ? routeCoords : positions);
      setRoadDistance((totalOSRMDistance / 1000).toFixed(1));
    }

    setLoading(false);
  };

  const handleClear = () => {
    setStartLocation('');
    setEndLocation('');
    setStartCoords(null);
    setEndCoords(null);
    setPath([]);
    setDistance(null);
    setRoutePositions([]);
  };

  return (
    <div className="min-h-screen w-full bg-[#f0f0f0] p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-6 pb-4 border-b-2 border-black">
          <div className="flex justify-between items-end flex-wrap gap-4">
            <div>
              <p className="text-xs font-bold text-[#0066ff] uppercase tracking-widest mb-1">DSA Project</p>
                  <h1 className="text-2xl md:text-3xl font-black text-black flex items-center gap-3">
                    <MapPin className="text-[#0066ff]" />
                    Smart City Traffic Navigation
                  </h1>
                  <p className="text-sm text-gray-600 mt-1">Dijkstra Algorithm for Optimal Route Finding</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-gray-500 uppercase">Spring 2026</p>
              <p className="text-sm font-medium text-black">Semester 4</p>
            </div>
          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-white border-2 border-black p-4">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
                <div className="w-8 h-8 bg-black flex items-center justify-center">
                  <Navigation size={16} className="text-white" />
                </div>
                  <h2 className="font-bold text-black text-sm uppercase tracking-wide">Smart Navigation</h2>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 uppercase mb-2 block">Start Point</label>
                  <select 
                    className="w-full border-2 border-gray-400 bg-white p-3 text-sm font-medium text-black focus:border-blue-600 outline-none"
                    value={startLocation}
                    onChange={(e) => handleSelectLocation(e.target.value, 'start')}
                  >
                    <option value="" className="text-gray-500">Select Start</option>
                    {Object.keys(lahoreLocations).map(loc => (
                      <option key={loc} value={loc} className="text-black">{loc}</option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-center py-1">
                  <div className="w-px h-6 bg-gray-300"></div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 uppercase mb-2 block">Destination</label>
                  <select 
                    className="w-full border-2 border-gray-400 bg-white p-3 text-sm font-medium text-black focus:border-blue-600 outline-none"
                    value={endLocation}
                    onChange={(e) => handleSelectLocation(e.target.value, 'end')}
                  >
                    <option value="" className="text-gray-500">Select Destination</option>
                    {Object.keys(lahoreLocations).filter(l => l !== startLocation).map(loc => (
                      <option key={loc} value={loc} className="text-black">{loc}</option>
                    ))}
                  </select>
                </div>

                <button 
                  onClick={handleCalculate}
                  disabled={(!startLocation && !startCoords) || (!endLocation && !endCoords) || loading}
                  className="w-full bg-[#0066ff] hover:bg-[#0055dd] disabled:bg-gray-400 text-white font-bold py-3 px-4 text-sm uppercase tracking-wide"
                >
                  {loading ? 'Calculating...' : 'Find Shortest Path'}
                </button>

                {(startLocation || endLocation || startCoords || endCoords) && (
                  <button 
                    onClick={handleClear}
                    className="w-full bg-white border-2 border-black hover:bg-black hover:text-white text-black font-bold py-2 px-4 text-sm uppercase flex items-center justify-center gap-2"
                  >
                    <Trash2 size={14} /> Clear
                  </button>
                )}
              </div>
            </div>

            <div className="bg-white border-2 border-black p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 bg-[#0066ff]"></div>
                <span className="text-xs font-bold text-black uppercase">First Click = Start</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#ff3333]"></div>
                <span className="text-xs font-bold text-black uppercase">Second Click = Destination</span>
              </div>
            </div>

            <div className="bg-black text-white p-4">
              <h3 className="text-xs font-bold uppercase tracking-wide mb-3 text-white">Algorithm Info</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Method:</span>
                  <span className="font-bold text-[#0066ff]">Dijkstra</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Data:</span>
                  <span className="font-mono text-white">Priority Queue</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Complexity:</span>
                  <span className="font-mono text-white">O((V+E)logV)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Map:</span>
                  <span className="font-bold text-[#00aa55]">OpenStreetMap</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Locations:</span>
                  <span className="font-mono text-white">30</span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="bg-white border-2 border-black p-4 h-full">
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-black flex items-center justify-center">
                    <GitBranch size={16} className="text-white" />
                  </div>
                  <h2 className="font-bold text-black text-sm uppercase tracking-wide">Map View</h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-600 uppercase">Lahore, Pakistan</span>
                </div>
              </div>
              
              <div className="h-[450px] border-2 border-gray-300">
                <MapContainer 
                  center={lahoreCenter} 
                  zoom={12} 
                  style={{ height: '100%', width: '100%' }}
                  scrollWheelZoom={true}
                >
                  <TileLayer
                    attribution='&copy; OSM'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  
                  <MapClickHandler onMapClick={handleMapClick} />

                  {startCoords && (
                    <Marker position={startCoords} icon={createCustomIcon('start')}>
                      <Popup>
                        <div className="text-center p-1">
                          <strong className="text-[#0066ff]">Start Point</strong>
                        </div>
                      </Popup>
                    </Marker>
                  )}

                  {endCoords && (
                    <Marker position={endCoords} icon={createCustomIcon('end')}>
                      <Popup>
                        <div className="text-center p-1">
                          <strong className="text-[#ff3333]">Destination</strong>
                        </div>
                      </Popup>
                    </Marker>
                  )}

                  {routePositions.length > 0 && (
                    <Polyline 
                      positions={routePositions}
                      pathOptions={{
                        color: '#00aa55',
                        weight: 5,
                        opacity: 0.9
                      }}
                    />
                  )}
                </MapContainer>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 space-y-4">
            <div className="bg-white border-2 border-black p-4">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
                <div className="w-8 h-8 bg-black flex items-center justify-center">
                  <Activity size={16} className="text-white" />
                </div>
                <h2 className="font-bold text-black text-sm uppercase tracking-wide">Results</h2>
              </div>
              
              {distance !== null && distance !== -1 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#0066ff] text-white p-3 text-center">
                      <span className="text-[10px] font-bold uppercase opacity-70">Distance</span>
                      <p className="text-xl font-black">{distance.toFixed(1)} km</p>
                    </div>
                    <div className="bg-[#00aa55] text-white p-3 text-center">
                      <span className="text-[10px] font-bold uppercase opacity-70">Stops</span>
                      <p className="text-xl font-black">{path.length}</p>
                    </div>
                  </div>

                  {roadDistance && (
                    <div className="bg-[#8B5CF6] text-white p-3 text-center">
                      <span className="text-[10px] font-bold uppercase opacity-70">Road Distance</span>
                      <p className="text-xl font-black">{roadDistance} km</p>
                    </div>
                  )}

                  <div>
                    <span className="text-xs font-bold text-gray-700 uppercase block mb-2">Path Sequence</span>
                    <div className="space-y-1">
                      {path.map((step, i) => (
                        <div key={i} className="flex items-center gap-2 bg-gray-100 p-2">
                          <div className={`w-6 h-6 flex items-center justify-center text-xs font-bold ${
                            i === 0 ? 'bg-[#0066ff] text-white' : 
                            i === path.length - 1 ? 'bg-[#ff3333] text-white' : 
                            'bg-[#333] text-white'
                          }`}>
                            {i + 1}
                          </div>
                          <span className="text-sm font-medium text-black">{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {algoSteps.length > 0 && (
                    <div className="border-t-2 pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-gray-700 uppercase">Algorithm Steps</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setCurrentStep(Math.max(-1, currentStep - 1))}
                            disabled={currentStep <= -1}
                            className="text-xs px-2 py-1 bg-black text-white disabled:bg-gray-400"
                          >
                            Prev
                          </button>
                          <button
                            onClick={() => setCurrentStep(Math.min(algoSteps.length - 1, currentStep + 1))}
                            disabled={currentStep >= algoSteps.length - 1}
                            className="text-xs px-2 py-1 bg-black text-white disabled:bg-gray-400"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                      <div className="bg-gray-900 text-green-400 p-3 font-mono text-xs max-h-48 overflow-y-auto">
                        {algoSteps.slice(0, currentStep + 1).map((step, i) => (
                          <div key={i} className="mb-1">
                            <span className="text-gray-500">{i + 1}.</span> {step.action}
                          </div>
                        ))}
                        {currentStep < 0 && (
                          <div className="text-gray-500 italic">Press Next to start step-by-step visualization</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : distance === -1 ? (
                <div className="text-center py-6 bg-red-50 border border-red-200">
                  <p className="text-[#ff3333] font-bold text-sm">No Path Found</p>
                  <p className="text-xs text-gray-500 mt-1">No route exists between these locations.</p>
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-100 border-2 border-dashed border-gray-300">
                  <div className="w-12 h-12 bg-gray-200 mx-auto mb-2 flex items-center justify-center">
                    <ArrowRight size={20} className="text-gray-500" />
                  </div>
                  <p className="text-sm text-gray-700 font-medium">Select start and destination</p>
                </div>
              )}
            </div>

            <div className="bg-white border-2 border-black p-4">
              <h3 className="text-xs font-bold text-black uppercase mb-3 pb-2 border-b border-gray-200">All Locations</h3>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {Object.keys(lahoreLocations).map(loc => (
                  <div 
                    key={loc}
                    className={`text-xs p-2 cursor-pointer flex items-center gap-2 border-b border-gray-100 ${
                      startLocation === loc ? 'bg-[#0066ff] text-white' :
                      endLocation === loc ? 'bg-[#ff3333] text-white' :
                      path.includes(loc) ? 'bg-[#00aa55] text-white' :
                      'bg-white text-black hover:bg-gray-100'
                    }`}
                    onClick={() => handleSelectLocation(loc, startLocation ? 'end' : 'start')}
                  >
                    <MapPin size={10} className={startLocation === loc || endLocation === loc || path.includes(loc) ? 'text-white' : 'text-gray-500'} />
                    <span className={startLocation === loc || endLocation === loc || path.includes(loc) ? 'text-white' : 'text-black'}>{loc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>

        <footer className="mt-6 pt-4 border-t-2 border-black flex justify-between items-center text-xs text-gray-600">
          <span>DSA Project - Semester 4</span>
          <span>React + Leaflet + Dijkstra</span>
        </footer>
      </div>
    </div>
  );
}

export default App;