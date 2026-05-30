# Smart City Traffic Navigation System

**A Data Structures and Algorithms Project**
**Implementing Dijkstra's Shortest Path Algorithm for Urban Traffic Routing**

---

<p align="center">
<b>Course:</b> Data Structures and Algorithms<br>
<b>Semester:</b> 4th<br>
<b>Year:</b> 2026
</p>

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Problem Statement](#2-problem-statement)
3. [Objectives](#3-objectives)
4. [Literature Review](#4-literature-review)
5. [Methodology](#5-methodology)
    - 5.1 [Dijkstra's Algorithm](#51-dijkstras-algorithm)
    - 5.2 [Graph Representation](#52-graph-representation)
    - 5.3 [Alternative Path Finding](#53-alternative-path-finding)
    - 5.4 [Traffic Simulation](#54-traffic-simulation)
6. [System Architecture](#6-system-architecture)
    - 6.1 [System Overview](#61-system-overview)
    - 6.2 [Technology Stack](#62-technology-stack)
    - 6.3 [API Design](#63-api-design)
7. [Implementation Details](#7-implementation-details)
    - 7.1 [Backend Implementation (C++)](#71-backend-implementation-c)
    - 7.2 [Frontend Implementation (React)](#72-frontend-implementation-react)
    - 7.3 [Data Flow](#73-data-flow)
8. [Results and Screenshots](#8-results-and-screenshots)
9. [Testing and Evaluation](#9-testing-and-evaluation)
10. [Challenges Faced](#10-challenges-faced)
11. [Conclusion](#11-conclusion)
12. [Future Work](#12-future-work)
13. [References](#13-references)

---

## 1. Introduction

Urban traffic congestion is a growing challenge in metropolitan cities around the world. With rapid urbanization, the need for efficient navigation systems that can compute optimal routes in real time has become increasingly important. This project, **Smart City Traffic Navigation System**, addresses this problem by implementing Dijkstra's shortest path algorithm on a real-world road network of Lahore, Pakistan.

The system provides an interactive web-based interface that allows users to select from 30 key locations across Lahore, compute the shortest path between them, visualize the algorithm step-by-step, and simulate the impact of traffic conditions on route planning. The backend is written entirely in C++ using only the standard library, with a custom HTTP server and JSON parser, while the frontend is built with React and Leaflet for an interactive map experience.

This project demonstrates the practical application of fundamental data structures and algorithms — including graphs, priority queues, hash maps, and shortest-path algorithms — in solving a real-world problem.

---

## 2. Problem Statement

In a busy city like Lahore, commuters face several challenges:

- **Traffic congestion** during peak hours significantly increases travel time.
- **Lack of real-time route optimization** — most navigation systems do not account for dynamic traffic conditions in a way that is transparent to the user.
- **Educational gap** — students learning data structures often struggle to connect theoretical concepts with practical applications.

This project aims to solve these problems by:

1. Implementing a **shortest path algorithm** (Dijkstra) on a real city graph.
2. Allowing **traffic simulation** to demonstrate how dynamic conditions affect route planning.
3. Providing an **algorithm visualizer** that shows each step of Dijkstra's algorithm in action, making the learning process interactive and intuitive.

---

## 3. Objectives

The following objectives were set for this project:

1. **Implement Dijkstra's shortest path algorithm** using a priority queue for optimal performance.
2. **Model a real-world road network** as a weighted directed graph with 30 nodes and approximately 120 edges representing Lahore's key locations and road connections.
3. **Build a custom HTTP server** in C++ from scratch to handle API requests without external frameworks.
4. **Develop an interactive frontend** with map integration for visual route exploration.
5. **Implement traffic simulation** to demonstrate the effect of varying traffic densities on route selection.
6. **Provide alternative route finding** (k-th shortest paths) using an edge-blocking approach.
7. **Create an algorithm visualizer** that displays step-by-step execution of Dijkstra's algorithm for educational purposes.

---

## 4. Literature Review

### 4.1 Shortest Path Algorithms

The shortest path problem is one of the most fundamental problems in graph theory. Several algorithms have been developed to solve it:

| Algorithm | Time Complexity | Key Feature |
|-----------|----------------|-------------|
| Dijkstra's Algorithm | O((V + E) log V) | Works with non-negative weights |
| Bellman-Ford Algorithm | O(V × E) | Handles negative weights |
| A* Search | O(E) (heuristic dependent) | Uses heuristic for faster search |
| Floyd-Warshall Algorithm | O(V³) | All-pairs shortest paths |
| Johnson's Algorithm | O(V² log V + V × E) | Sparse graph optimization |

**Dijkstra's algorithm** (Edsger W. Dijkstra, 1956) was chosen for this project because:
- It guarantees the optimal solution for graphs with non-negative edge weights.
- Its time complexity of O((V + E) log V) using a binary heap priority queue is efficient for our graph size (30 nodes).
- It is widely taught in undergraduate data structures courses and serves as an excellent educational demonstration.

### 4.2 Graph Data Structures

Graphs can be represented using:
- **Adjacency Matrix** — O(V²) space, O(1) edge lookup
- **Adjacency List** — O(V + E) space, O(degree) edge lookup

For this project, an **adjacency list** was chosen because the graph is sparse (120 edges for 30 nodes), making it more memory-efficient.

### 4.3 Related Work

Several existing navigation systems use similar principles:
- **Google Maps** uses a combination of Dijkstra's algorithm and A* search with real-time traffic data.
- **OSRM (Open Source Routing Machine)** provides high-performance routing using contraction hierarchies.
- **Leaflet Routing Machine** is an open-source routing library for Leaflet maps.

This project differentiates itself by:
- Implementing the algorithm from scratch in C++ without external libraries.
- Providing transparent step-by-step algorithm visualization.
- Allowing manual traffic simulation for educational purposes.

---

## 5. Methodology

### 5.1 Dijkstra's Algorithm

Dijkstra's algorithm finds the shortest path from a source node to a destination node in a weighted graph with non-negative edge weights.

#### 5.1.1 Algorithm Pseudocode

```
function Dijkstra(Graph, source, destination, considerTraffic):
    for each vertex v in Graph:
        dist[v] = INFINITY
        visited[v] = false
        parent[v] = null
    
    dist[source] = 0
    priorityQueue = Min-Heap()
    priorityQueue.push((0, source))
    
    while priorityQueue is not empty:
        (currentDist, current) = priorityQueue.pop()
        
        if visited[current] == true:
            continue
        
        visited[current] = true
        
        if current == destination:
            break
        
        for each edge (current -> neighbor) in Graph:
            weight = edge.weight
            
            if considerTraffic == true and traffic exists for this road:
                trafficFactor = 1 + (traffic.density / 50.0)
                weight = weight * trafficFactor
            
            newDist = dist[current] + weight
            
            if newDist < dist[neighbor]:
                dist[neighbor] = newDist
                parent[neighbor] = current
                priorityQueue.push((newDist, neighbor))
    
    if dist[destination] == INFINITY:
        return no path found
    
    path = [] // reconstruct path from destination to source using parent map
    current = destination
    while current != source:
        path.prepend(current)
        current = parent[current]
    path.prepend(source)
    
    return (path, dist[destination])
```

#### 5.1.2 Data Structures Used

| Data Structure | C++ Implementation | Purpose |
|---------------|-------------------|---------|
| Distance Map | `unordered_map<string, int> dist` | Tracks shortest distance from source to each node |
| Parent Map | `unordered_map<string, string> parent` | Reconstructs the path after algorithm completes |
| Visited Set | `unordered_map<string, bool> visited` | Prevents re-processing of settled nodes |
| Priority Queue (Min-Heap) | `priority_queue<pair<int, string>, vector<...>, greater<...>>` | Always processes the node with the smallest distance first |
| Adjacency List | `unordered_map<string, vector<Edge>> graph` | Stores the graph for efficient neighbor iteration |

#### 5.1.3 Time Complexity Analysis

- **Worst Case:** O((V + E) log V) where V = number of vertices, E = number of edges
- Each vertex is extracted from the priority queue once: O(V log V)
- Each edge is relaxed at most once: O(E log V)
- For our graph: V = 30, E ≈ 120, so the algorithm runs in negligible time.

#### 5.1.4 Space Complexity

- O(V) for the distance, parent, and visited maps
- O(V) for the priority queue
- O(V + E) for the adjacency list
- Total: O(V + E)

### 5.2 Graph Representation

The road network of Lahore is modeled as a **weighted directed graph** using an adjacency list.

#### 5.2.1 Edge Structure

Each edge in the graph contains:

| Field | Type | Description |
|-------|------|-------------|
| `to` | `string` | Destination node name |
| `weight` | `int` | Base travel cost (arbitrary units proportional to distance) |
| `distance_km` | `double` | Real road distance in kilometers |
| `traffic_density` | `int` | Default static traffic density (0–100) |

#### 5.2.2 Node Set (30 Locations)

The 30 locations are categorized as follows:

| Category | Locations |
|----------|-----------|
| **Universities** | LUMS, UET Lahore, University of the Punjab, FC College University, King Edward Medical University |
| **Transit Hubs** | Lahore Junction Railway Station, Allama Iqbal International Airport, Lahore Metro Bus Terminal |
| **Tourist & Historic Sites** | Badshahi Mosque, Minar-e-Pakistan, Shalimar Gardens, Lahore Museum, Lahore Fort |
| **Commercial Areas** | Gulberg Main Boulevard, MM Alam Road, Fortress Stadium, Pace Shopping Mall, Liberty Roundabout |
| **Residential Areas** | DHA Phase 5, Johar Town, Model Town, Garden Town, Defence Housing Authority |
| **Public Spaces** | Greater Iqbal Park, Race Course Park |
| **Government Buildings** | Punjab Assembly, Civil Secretariat |
| **Hospitals** | Mayo Hospital, Shaukat Khanum Memorial Hospital |
| **Other** | The Mall, Thokar Niaz Baig, Kahna Interchange |

### 5.3 Alternative Path Finding

To provide users with multiple route options, the system implements a **k-th shortest path** algorithm using an edge-blocking approach:

1. Run Dijkstra's algorithm to find the shortest path P₁.
2. Block the first edge of P₁ by setting its weight to infinity.
3. Re-run Dijkstra to find path P₂.
4. Deduplicate paths using a hash map of visited-node signatures.
5. Repeat until k paths are found or no more alternatives exist.

**Limitation:** This is a simplified approach. Yen's algorithm provides more robust k-th shortest path results but was not implemented due to time constraints.

### 5.4 Traffic Simulation

Traffic simulation allows users to see how dynamic road conditions affect route selection.

#### 5.4.1 Traffic Model

When a traffic update exists for a road segment, the edge weight is adjusted using the formula:

```
adjustedWeight = baseWeight × (1 + trafficDensity / 50.0)
```

For example:
- If `trafficDensity = 0` (no traffic), `adjustedWeight = baseWeight` (no change)
- If `trafficDensity = 50` (moderate traffic), `adjustedWeight = baseWeight × 1.5` (50% increase)
- If `trafficDensity = 100` (severe traffic), `adjustedWeight = baseWeight × 3.0` (200% increase)

This simple model demonstrates how higher traffic density increases the effective cost of traversing a road, potentially causing the algorithm to choose an alternative route.

#### 5.4.2 Traffic Data Structure

| Field | Type | Description |
|-------|------|-------------|
| `road` | `string` | Road segment identifier (e.g., "LUMS→UET") |
| `density` | `int` | Traffic density percentage (0–100) |
| `speed_limit` | `int` | Speed limit on the road (km/h) |
| `timestamp` | `string` | When the traffic update was recorded |
| `is_accident` | `bool` | Whether an accident has been reported |

---

## 6. System Architecture

### 6.1 System Overview

The system follows a **client-server architecture**:

```
┌─────────────────┐         HTTP/JSON          ┌──────────────────┐
│                   │ ◄──────────────────────► │                    │
│   React Frontend  │                           │   C++ Backend     │
│   (Port 5173)     │                           │   (Port 18080)    │
│                   │                           │                    │
│  ┌─────────────┐  │                           │  ┌──────────────┐  │
│  │ Leaflet Map  │  │                           │  │ Dijkstra     │  │
│  │ + UI         │  │                           │  │ Algorithm    │  │
│  └─────────────┘  │                           │  └──────────────┘  │
│                   │                           │                    │
│  ┌─────────────┐  │                           │  ┌──────────────┐  │
│  │ Algorithm   │  │                           │  │ Graph Data   │  │
│  │ Visualizer  │  │                           │  │ (30 nodes)   │  │
│  └─────────────┘  │                           │  └──────────────┘  │
└─────────────────┘                           └──────────────────┘
         │                                              │
         │                                              │
         ▼                                              ▼
  ┌─────────────────┐                           ┌──────────────────┐
  │ OSRM API        │                           │ Traffic Data     │
  │ (Road Geometry) │                           │ (In-Memory)     │
  └─────────────────┘                           └──────────────────┘
```

### 6.2 Technology Stack

#### Backend

| Component | Technology | Justification |
|-----------|------------|---------------|
| Language | C++11 | High performance, memory efficiency, educational value |
| Network | Winsock / POSIX Sockets | Native OS socket API, no framework dependency |
| JSON Parsing | Custom string parser | Keeps the project self-contained |
| Build | g++ / MSVC | Standard C++ compilers |

The backend was intentionally built without external frameworks to demonstrate deep understanding of:
- Raw socket programming
- HTTP protocol handling
- Manual request parsing
- Memory management in C++

#### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| React | ^19.2.6 | Component-based UI framework |
| Vite | ^8.0.12 | Fast build tool and dev server |
| Tailwind CSS | ^4.3.0 | Utility-first CSS framework |
| Leaflet | ^1.9.4 | Open-source interactive map library |
| react-leaflet | ^5.0.0 | React bindings for Leaflet |
| Framer Motion | ^12.38 | Animation library for UI transitions |
| Lucide React | ^1.16 | Icon set |

### 6.3 API Design

The backend exposes six REST API endpoints:

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/locations` | Returns all 30 locations with coordinates |
| `GET` | `/api/graph` | Returns the complete graph structure |
| `GET` | `/api/traffic` | Returns current traffic updates |
| `POST` | `/api/navigate` | Computes shortest path between two locations |
| `POST` | `/api/alternatives` | Finds k alternative routes |
| `POST` | `/api/traffic` | Adds or updates traffic on a road segment |

All responses are in JSON format with CORS headers.

---

## 7. Implementation Details

### 7.1 Backend Implementation (C++)

The backend is implemented in a single file (`server/main.cpp`, ~796 lines) containing:

#### 7.1.1 Custom HTTP Server

The HTTP server is built from scratch using Berkeley sockets:

- **Socket Setup:** Creates a TCP socket, binds to port 18080, and listens for incoming connections.
- **Request Parsing:** Manually parses the HTTP request line, headers, and body. Handles both LF (`\n`) and CRLF (`\r\n`) line endings.
- **100-Continue Handling:** When the client sends an `Expect: 100-continue` header, the server responds with `HTTP/1.1 100 Continue` before reading the actual request body. This is required for compatibility with Windows HTTP clients.
- **Response Formatting:** Constructs HTTP responses with proper headers, content-length, and CORS headers.

#### 7.1.2 Custom JSON Parser

A lightweight JSON value extractor (`extract_json_value`) searches for a key in a JSON string and returns its value. This avoids any external JSON library dependency.

**How it works:**
1. Searches for the pattern `"key":` in the string.
2. Advances past the colon and any whitespace.
3. If the value starts with `"`, reads until the closing `"`.
4. Otherwise, reads until a comma, closing brace, or whitespace.

**Limitations:** This is a simple parser and does not handle nested objects or arrays. However, it is sufficient for the flat JSON structures used in this project.

#### 7.1.3 Dijkstra Implementation

The core algorithm is implemented in the `dijkstra()` function:

- Accepts three parameters: `start` node name, `end` node name, and a boolean `consider_traffic`.
- Uses a **min-heap priority queue** to always process the node with the smallest tentative distance.
- When `consider_traffic` is true, consults the `traffic_updates` vector and adjusts edge weights accordingly.
- Returns a pair containing the path (as a vector of node names) and the total distance.

#### 7.1.4 Graph Initialization

The `initialize_graph()` function populates the adjacency list with data for 30 Lahore locations. Each edge includes real approximate distances between locations and a default traffic density value.

### 7.2 Frontend Implementation (React)

The frontend is implemented as a single-page React application (`client/src/App.jsx`, ~1153 lines).

#### 7.2.1 Core Components

**App Component** — The main application component managing all state and rendering the UI. It includes:
- A searchable location selector
- An interactive Leaflet map
- A sidebar with route information
- Traffic simulation controls
- The algorithm visualizer

**TrafficLayer Component** — Renders color-coded circles on the map representing traffic density on road segments:
- Red circles for high density (≥70%)
- Orange circles for medium density (40–69%)
- Green circles for low density (<40%)

**DijkstraVisualizer Component** — Provides step-by-step playback of Dijkstra's algorithm:
- Synthetic step generation from the returned path data
- Play/Pause controls with adjustable speed (800ms interval)
- Previous/Next buttons for manual step-through
- Progress bar showing current position
- Counters for visited nodes, queue size, and step number
- Animated log view that highlights the current step

**MapClickHandler Component** — Wraps the Leaflet map and captures click events, finding the nearest location from the predefined set of 30 locations.

#### 7.2.2 Key Features

**Interactive Map:**
- OpenStreetMap tiles rendered via Leaflet
- Custom square divIcon markers (blue "A" for start, red "B" for destination)
- Green polyline for the shortest path with an arrow at the midpoint
- Purple polyline for alternative routes
- Color-coded traffic density circles
- The map auto-fits to show the entire route

**Location Selection:**
- Two modes: dropdown search and map click
- Search input filters locations by name
- Each location shows its type with a colored indicator dot
- First selection sets start, second sets destination

**Traffic Simulation Panel:**
- Dropdown to select a road segment
- Slider to set traffic density (0–100%)
- Apply button to POST the traffic update to the backend
- Visual feedback via map circles

**Route Information Sidebar:**
- Start and destination names with swap button
- Total distance with estimated travel time
- Ordered list of intermediate stops
- Alternative routes with selection capability
- Toast notifications for status messages

### 7.3 Data Flow

The following sequence diagram illustrates the flow of data when a user searches for a route:

```
User                    Frontend (React)          Backend (C++)             OSRM API
  │                          │                        │                       │
  │  Select Locations        │                        │                       │
  │────────────────────────►│                        │                       │
  │                          │                        │                       │
  │  Click "Find Path"       │                        │                       │
  │────────────────────────►│                        │                       │
  │                          │  POST /api/navigate    │                       │
  │                          │──────────────────────►│                       │
  │                          │                        │                       │
  │                          │                        │  Run Dijkstra         │
  │                          │                        │  ├─ Initialize dist   │
  │                          │                        │  ├─ Process nodes     │
  │                          │                        │  ├─ Relax edges       │
  │                          │                        │  └─ Reconstruct path  │
  │                          │                        │                       │
  │                          │  {distance, path[]}    │                       │
  │                          │◄──────────────────────│                       │
  │                          │                        │                       │
  │                          │  POST /api/alternatives│                       │
  │                          │──────────────────────►│                       │
  │                          │  {paths[]}            │                       │
  │                          │◄──────────────────────│                       │
  │                          │                        │                       │
  │                          │  For each edge:        │                       │
  │                          │  GET OSRM route        │                       │
  │                          │──────────────────────────────────────────────►│
  │                          │  Road geometry         │                       │
  │                          │◄──────────────────────────────────────────────│
  │                          │                        │                       │
  │  Display route on map    │                        │                       │
  │◄────────────────────────│                        │                       │
```

---

## 8. Results and Screenshots

### 8.1 Functional Results

The system was tested with various start-destination pairs across Lahore. The following results were observed:

**Test Case 1: LUMS to UET Lahore**

| Parameter | Value |
|-----------|-------|
| Start | LUMS |
| Destination | UET Lahore |
| Path (no traffic) | LUMS → Thokar Niaz Baig → Kahna Interchange → UET Lahore |
| Distance (no traffic) | ~25 km |
| Path (with traffic on LUMS→Thokar) | (Alternative route avoiding congested road) |

**Test Case 2: Badshahi Mosque to Allama Iqbal International Airport**

| Parameter | Value |
|-----------|-------|
| Start | Badshahi Mosque |
| Destination | Allama Iqbal International Airport |
| Path | Badshahi Mosque → The Mall → Liberty Roundabout → Gulberg Main Boulevard → Airport |
| Total distance | ~15 km |

**Test Case 3: Multiple Alternative Paths**

For most pairs, the system successfully finds 2–3 alternative paths, demonstrating the edge-blocking approach. The primary path is highlighted in green while alternatives appear in purple on the map.

### 8.2 Algorithm Visualizer Results

The Dijkstra algorithm visualizer successfully displays:
- The sequence of nodes visited in order
- The current node being processed (highlighted)
- The distance of each node from the source at each step
- The final shortest path reconstruction

### 8.3 Traffic Simulation Results

Traffic simulation correctly affects route selection:
- When a road on the shortest path has high traffic density (>70%), the algorithm may choose an alternative route.
- The effect is proportional to the traffic density value.

---

## 9. Testing and Evaluation

### 9.1 Algorithm Correctness

The Dijkstra implementation was tested against the following scenarios:

1. **Direct edge** — Start and destination are directly connected. Expected: Direct path returned.
2. **Multi-hop path** — Start and destination are not directly connected. Expected: Shortest multi-hop path.
3. **Unreachable destination** — No path exists. Expected: Distance = -1.
4. **Same start and destination** — Expected: Distance = 0.
5. **Traffic-affected routing** — Adding traffic causes route change. Expected: Alternative path chosen.

All scenarios produced correct results.

### 9.2 Performance

| Metric | Result |
|--------|--------|
| Backend response time (average) | < 10 ms |
| Frontend load time | ~2 seconds (development mode) |
| Concurrent users | 1 (single-threaded backend) |

### 9.3 Limitations

- The backend is single-threaded and can only handle one request at a time.
- The JSON parser is basic and does not handle nested structures.
- The alternative path algorithm uses a simple edge-blocking approach rather than Yen's algorithm.
- Traffic data is volatile and resets when the server restarts.
- The frontend is a single large file (App.jsx, 1153 lines), which could be refactored.

---

## 10. Challenges Faced

### 10.1 C++ HTTP Server

Building an HTTP server from scratch required deep understanding of:
- **Socket programming** — Setting up TCP sockets, binding, listening, and accepting connections on both Windows (Winsock) and POSIX systems.
- **HTTP protocol** — Correctly parsing request lines, headers, and handling different line endings (LF vs CRLF).
- **100-Continue** — Windows HTTP clients (including PowerShell) send an `Expect: 100-continue` header. The server must respond with `100 Continue` before accepting the request body, otherwise the client waits indefinitely.

### 10.2 Cross-Platform Compatibility

The socket API differs between Windows (Winsock) and Linux/macOS (POSIX):
- Windows requires `WSAStartup()` and `WSACleanup()`.
- Windows uses `closesocket()` instead of `close()`.
- Windows uses `recv()` with different error handling.

The code uses preprocessor directives (`#ifdef _WIN32`) to handle these differences.

### 10.3 JSON Parsing Without a Library

Parsing JSON manually was error-prone because:
- Whitespace handling between keys and values requires careful skipping.
- String values may contain escaped characters.
- The parser must distinguish between string values (quoted) and numeric values (unquoted).

### 10.4 Frontend Complexity

Managing all state in a single component (App.jsx) became challenging as features were added. State management for start/destination, paths, traffic data, algorithm visualization, and UI state required careful organization to avoid conflicts.

---

## 11. Conclusion

This project successfully demonstrates the practical application of Dijkstra's shortest path algorithm in the context of urban traffic navigation. By implementing the algorithm from scratch in C++ and building a full-stack web application around it, we have shown how fundamental data structures and algorithms can solve real-world problems.

**Key achievements:**

1. A working shortest path navigation system for Lahore with 30 locations and approximately 120 road connections.
2. A custom HTTP server and JSON parser in C++ with zero external dependencies.
3. An interactive web-based map interface with Leaflet integration.
4. Traffic simulation capabilities that demonstrate dynamic route re-computation.
5. A step-by-step algorithm visualizer for educational purposes.
6. Alternative route finding with up to 3 path options.

The project serves as an educational tool that bridges the gap between theoretical algorithm study and practical application. It shows that complex systems can be built with a solid understanding of core computer science concepts, without relying on external frameworks.

---

## 12. Future Work

The following enhancements are planned for future versions:

1. **Yen's Algorithm** — Replace the edge-blocking approach with Yen's algorithm for more robust k-th shortest path computation.
2. **Database Integration** — Add SQLite or similar lightweight database for persistent traffic data and user preferences.
3. **Real-Time Traffic API** — Integrate with a real-time traffic data provider for live traffic conditions.
4. **A\* Algorithm** — Implement A* search for comparison and for faster pathfinding on larger graphs.
5. **Bidirectional Dijkstra** — Implement bidirectional search for improved performance.
6. **Code Refactoring** — Split the frontend into multiple component files and the backend into multiple modules for better maintainability.
7. **Unit Tests** — Add comprehensive unit tests for both backend algorithms and frontend components.
8. **Larger Graph** — Expand the graph to include more locations and roads across Lahore.
9. **User Authentication** — Allow users to save favorite locations and routes.
10. **Mobile Responsiveness** — Improve the UI for mobile devices.

---

## 13. References

1. Dijkstra, E. W. (1959). "A note on two problems in connexion with graphs." *Numerische Mathematik*, 1(1), 269–271.

2. Cormen, T. H., Leiserson, C. E., Rivest, R. L., & Stein, C. (2009). *Introduction to Algorithms* (3rd ed.). MIT Press.

3. OpenStreetMap Contributors. (2024). "OpenStreetMap." https://www.openstreetmap.org/

4. Leaflet.js. (2024). "Leaflet — an open-source JavaScript library for interactive maps." https://leafletjs.com/

5. React Documentation. (2024). "React — A JavaScript library for building user interfaces." https://react.dev/

6. OSRM — Open Source Routing Machine. (2024). "OSRM API Documentation." http://project-osrm.org/docs/v5.24.0/api/

7. Skiena, S. S. (2008). *The Algorithm Design Manual* (2nd ed.). Springer.

8. Yen, J. Y. (1971). "Finding the K Shortest Loopless Paths in a Network." *Management Science*, 17(11), 712–716.

---

<p align="center">
<b>— End of Document —</b>
</p>
