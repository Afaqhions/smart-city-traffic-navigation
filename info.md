# Smart City Traffic Navigation — Developer Docs

## Project Overview

Full-stack DSA project demonstrating **Dijkstra's shortest path algorithm** on a real city map (Lahore, Pakistan). Users select start/destination points from 30 locations, and the backend computes the optimal route considering optional traffic simulation.

| Layer | Tech | Location |
|-------|------|----------|
| Frontend | React 19 + Vite 8 + Tailwind CSS 4 + Leaflet | `client/` |
| Backend | C++11 (raw sockets + Winsock/POSIX) | `server/main.cpp` |
| Map | OpenStreetMap via Leaflet + OSRM for road routing | — |

---

## Quick Start

```bash
# Terminal 1 — Backend
cd server
g++ -std=c++11 main.cpp -o server -lws2_32   # Windows
g++ -std=c++11 main.cpp -o server            # Linux/macOS
./server                                      # binds to :18080

# Terminal 2 — Frontend
cd client
npm install    # one-time
npm run dev    # starts Vite on :5173
```

Open **http://localhost:5173**.

---

## Backend (`server/main.cpp`)

### Graph

30 Lahore locations as nodes, ~120 directed edges with weights representing travel cost. Defined in `initialize_graph()`.

**Edge struct:**
```
to            — destination node name
weight        — base travel cost (integer)
distance_km   — real road distance in km
traffic_density — static default density (0–100)
```

### Dijkstra Algorithm

```cpp
pair<vector<string>, int> dijkstra(start, end, consider_traffic)
```

- Min-heap priority queue `O((V+E)log V)`
- When `consider_traffic=true`, each edge weight is multiplied by `(1 + traffic.density / 50.0)` if a traffic update exists for that road
- Returns `{path[], totalDistance}` or `{-1}` if unreachable

### Alternative Routes

```cpp
find_alternative_paths(start, end, k=3)
```

- Runs Dijkstra → blocks first edge of found path → re-runs Dijkstra
- Deduplicates paths by visited-node signature
- Returns up to `k` alternatives

### Traffic Simulation

- **GET /api/traffic** — returns all active traffic updates with density & timestamp
- **POST /api/traffic** — body `{road, density}` — adds/updates a road's density
- Traffic updates persist in-memory in `traffic_updates` vector (volatile)

### API Endpoints

| Method | Path | Body | Response |
|--------|------|------|----------|
| GET | `/api/locations` | — | `{locations: [{name, lat, lng}]}` |
| GET | `/api/graph` | — | `{graph: {nodeName: [{to, weight, distance, traffic}]}}` |
| GET | `/api/traffic` | — | `{traffic: [{road, density, timestamp}]}` |
| POST | `/api/navigate` | `{start, end, consider_traffic}` | `{distance, path[], estimated_time}` |
| POST | `/api/alternatives` | `{start, end, k}` | `{paths: [{id, distance, path[]}]}` |
| POST | `/api/traffic` | `{road, density}` | `{status, message}` |

### HTTP Handling Details

- Parses request line + headers manually
- Handles `\n` (LF) and `\r\n` (CRLF) line endings via `extract_body()`
- Handles `Expect: 100-continue` by sending `100 Continue` then re-reading body
- CORS headers allow all origins

### JSON Parsing

`extract_json_value(body, key)` — simple string search (no JSON library dependency):
- Searches for `"key":` then skips whitespace
- Handles quoted string values and unquoted numbers/booleans

---

## Frontend (`client/`)

### Architecture

Single-page React app, all state in `App.jsx` (~1150 lines). Three sub-components:

| Component | Purpose |
|-----------|---------|
| `TrafficLayer` | Renders traffic density circles on the map |
| `DijkstraVisualizer` | Step-by-step algorithm playback with play/pause/prev/next |
| `MapClickHandler` | Captures map clicks to set nearest location |

### State Management (key variables)

```
startLocation / endLocation    — selected names from dropdown/search
startCoords / endCoords        — [lat, lng] for map markers
path / distance                — Dijkstra result
routePositions                 — OSRM road-following polyline coords
algoSteps / currentStep        — step-by-step visualization state
trafficData                    — current traffic updates from backend
graphData                      — graph structure for road segment selector
considerTraffic                — toggle for traffic-aware routing
alternativePaths / selectedPath — alternative route display
searchTerm                     — location search filter
sidebarOpen                    — sidebar visibility
showToast / statusMessage      — animated toast notifications
```

### Location Search

- `filteredLocations` — filters 30 locations by `searchTerm`
- When user types, a **location list** appears below the search input
- Click a location → sets it as start (if none) or destination
- Each entry shows type as a colored dot + type label

### Traffic Simulation UI

Collapsible panel with:
- **Road Segment** dropdown — populated from `/api/graph` response (all directed edges)
- **Density slider** (0–100%) — controls traffic density
- **Apply Traffic** button — POSTs to `/api/traffic`, then refreshes `trafficData` from GET endpoint
- Traffic layer circles on map update automatically via useEffect polling (every 30s)

### Dijkstra Visualizer

- Generates synthetic step-by-step log from the returned path
- Play/Pause at 800ms interval
- Progress bar, visited/queue/step counters
- Auto-scroll log with current step highlighting

### Map Interactions

- **Click anywhere** — finds nearest of the 30 locations
- First click → sets start (blue "A" marker)
- Second click → sets destination (red "B" marker)
- Third click → resets and sets new start
- **Route polyline** — green for primary path, purple for alternatives
- **Traffic circles** — colored red/orange/green based on density %
- **Markers** — square flat divIcons (no border-radius)

### Data Flow

```
User selects locations → clicks "Find Shortest Path"
  → POST /api/navigate → displays distance, path, stops, estimated time
  → GET /api/alternatives → displays alternative routes in sidebar
  → OSRM API calls per edge → real road polyline on map
  → Generates algorithm steps → DijkstraVisualizer playback
```

---

## Build & Lint

```bash
cd client
npm run build      # production build → dist/
npm run lint       # ESLint (flat config)
npm run preview    # serve dist/ locally
```

---

## Design Decisions

- **Flat design** — square corners (`rounded-none`), solid flat colors (`bg-blue-600`), no shadows
- **C++ backend** — educational choice to implement Dijkstra from scratch with no framework
- **No JSON library** — manual string parsing in C++ to keep it self-contained (only standard library)
- **100-continue support** — Windows HTTP stack (WinHTTP/PowerShell) requires this
- **OSRM for roads** — real road geometries instead of straight-line paths between nodes
- **Single-file frontend** — keeps the project simple for a DSA course demo

---

## File Structure

```
dsa-sample/
├── client/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── public/
│   │   └── favicon.svg, icons.svg
│   └── src/
│       ├── main.jsx           # React entry
│       ├── App.jsx            # everything
│       ├── index.css          # Tailwind + custom styles
│       └── assets/
├── server/
│   ├── main.cpp               # HTTP server + Dijkstra + graph data
│   └── crow_all.h             # (unused Crow header)
└── info.md
```
