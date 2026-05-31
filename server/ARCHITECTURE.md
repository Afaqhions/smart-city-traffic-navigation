# Server Architecture - 3 Developer Split

## Overview
The monolithic `main.cpp` has been split into **3 major components** for collaborative development by 3 developers.

---

## Developer 1: **Graph Management** 
### Files: `graph.h` and `graph.cpp`

**Responsibilities:**
- Manage the city graph data structure
- Initialize Lahore's road network with all 30 locations
- Build and maintain Edge relationships between locations
- Generate JSON representations of the graph for API responses

**Key Functions:**
- `initialize_graph()` - Loads all city locations and road connections
- `get_all_locations_json()` - Returns location coordinates as JSON
- `get_graph_json()` - Serializes the entire graph structure

**Data Structures:**
- `Edge` struct - Represents road connections with weight, distance, and traffic density
- `graph` global map - Stores the complete city network

---

## Developer 2: **Pathfinding Algorithms**
### Files: `algorithms.h` and `algorithms.cpp`

**Responsibilities:**
- Implement shortest path finding (Dijkstra's algorithm)
- Find alternative routes for users
- Handle traffic-aware routing
- Optimize route discovery algorithms

**Key Functions:**
- `dijkstra(start, end, consider_traffic)` - Finds shortest path using Dijkstra
- `find_alternative_paths(start, end, k)` - Returns k alternative routes

**Algorithm Features:**
- Traffic multiplier applied based on real-time congestion data
- Path reconstruction with step-by-step logging
- K-shortest paths support using edge-blocking approach

---

## Developer 3: **Server & API**
### Files: `server.h` and `server.cpp`

**Responsibilities:**
- Manage HTTP server socket operations
- Handle API endpoints and HTTP routing
- Manage real-time traffic updates
- Parse JSON requests and build responses
- Cross-Origin Resource Sharing (CORS) support

**Key Functions:**
- `run_server()` - Main server loop listening on port 18080
- `make_json_response(body, status)` - HTTP response formatter
- `extract_body(request)` - Parses HTTP request body
- `extract_json_value(body, key)` - Extracts JSON parameters
- `update_traffic(road, density)` - Updates traffic conditions

**API Endpoints:**
```
GET  /api/locations          → Returns all city locations
GET  /api/graph              → Returns complete graph structure
GET  /api/traffic            → Returns current traffic conditions
POST /api/navigate           → Find shortest path with parameters
POST /api/alternatives       → Find alternative routes
POST /api/traffic            → Update traffic density on road
OPTIONS *                    → CORS preflight
```

**Data Structures:**
- `TrafficData` struct - Stores real-time traffic conditions
- `traffic_updates` global vector - Maintains traffic history

---

## Compilation

### Option 1: Separate Compilation (Recommended for team development)
```bash
# Developer 1 compiles graph
g++ -c graph.cpp -o graph.o

# Developer 2 compiles algorithms
g++ -c algorithms.cpp -o algorithms.o

# Developer 3 compiles server
g++ -c server.cpp -o server.o

# Link all objects (requires crow_all.h in same directory)
g++ graph.o algorithms.o server.o -o dsa-server -lws2_32
```

### Option 2: Single Command
```bash
g++ graph.cpp algorithms.cpp server.cpp -o dsa-server -lws2_32
```

---

## Integration Points

### Between Developer 1 & 2:
- `graph.h` declares the `Edge` struct and `graph` map
- Developer 2 uses `graph` to traverse nodes in Dijkstra algorithm

### Between Developer 2 & 3:
- `algorithms.h` declares dijkstra and find_alternative_paths functions
- `traffic_updates` vector is used by algorithms to apply traffic multipliers

### Between Developer 1 & 3:
- `get_all_locations_json()` and `get_graph_json()` provide API responses
- Both depend on the initialized `graph` structure

---

## Development Workflow

1. **Developer 1** - Focus on graph completeness and correctness
2. **Developer 2** - Ensure algorithms work correctly with the graph
3. **Developer 3** - Test all API endpoints with real HTTP requests

### Testing Tips:
- Use curl to test endpoints:
  ```bash
  curl http://localhost:18080/api/locations
  curl -X POST -H "Content-Type: application/json" \
       -d '{"start":"UET Lahore","end":"Lahore Zoo"}' \
       http://localhost:18080/api/navigate
  ```

---

## Dependencies
- **Platform:** Windows (with WSA) or Linux (with POSIX sockets)
- **Header:** `crow_all.h` (already provided in server/)
- **Standard Libraries:** iostream, sstream, vector, queue, unordered_map, chrono, thread, etc.

---

## Future Enhancements
- Add database integration for persistent traffic data
- Implement multi-threaded client handling
- Add route optimization with time windows
- Support for real-time GPS tracking
- Mobile app integration
