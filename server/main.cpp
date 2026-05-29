#include <iostream>
#include <vector>
#include <queue>
#include <unordered_map>
#include <string>
#include <algorithm>
#include <sstream>
#include <fstream>
#include <chrono>
#include <thread>
#include <mutex>
#include <condition_variable>
#include <cstring>

#ifdef _WIN32
#include <winsock2.h>
#include <ws2tcpip.h>
#pragma comment(lib, "ws2_32.lib")
#else
#include <sys/socket.h>
#include <netinet/in.h>
#include <unistd.h>
#include <arpa/inet.h>
#endif

using namespace std;

// Edge structure for graph representation
struct Edge {
    string to;
    int weight;
    double distance_km;
    int traffic_density; // 0-100 scale
};

// Graph structure for city navigation
unordered_map<string, vector<Edge>> graph;

// Traffic conditions structure
struct TrafficData {
    string road;
    int density;
    int speed_limit;
    string timestamp;
    bool is_accident;
};

vector<TrafficData> traffic_updates;

// Dijkstra Algorithm Implementation
pair<vector<string>, int> dijkstra(string start, string end, bool consider_traffic = true) {
    unordered_map<string, int> dist;
    unordered_map<string, string> parent;
    unordered_map<string, bool> visited;
    
    // Initialize distances
    for (auto it = graph.begin(); it != graph.end(); ++it) {
        dist[it->first] = 1e9;
        visited[it->first] = false;
    }
    
    // Priority queue: (distance, node)
    priority_queue<pair<int, string>, vector<pair<int, string>>, greater<pair<int, string>>> pq;
    
    dist[start] = 0;
    pq.push({0, start});
    
    vector<pair<string, string>> step_log;
    
    while (!pq.empty()) {
        int current_dist = pq.top().first;
        string current = pq.top().second;
        pq.pop();
        
        if (visited[current]) continue;
        visited[current] = true;
        
        step_log.push_back({"Visited", current});
        
        if (current == end) break;
        
        for (auto& edge : graph[current]) {
            int weight = edge.weight;
            
            // Apply traffic multiplier if enabled
            if (consider_traffic) {
                for (auto& traffic : traffic_updates) {
                    string road_key = current + "-" + edge.to;
                    if (traffic.road == road_key) {
                        weight = weight * (1 + traffic.density / 50.0);
                        break;
                    }
                }
            }
            
            if (dist[current] + weight < dist[edge.to]) {
                dist[edge.to] = dist[current] + weight;
                parent[edge.to] = current;
                pq.push({dist[edge.to], edge.to});
                step_log.push_back({"Update", edge.to + " via " + current + " = " + to_string(dist[edge.to])});
            }
        }
    }
    
    // Reconstruct path
    vector<string> path;
    if (dist.find(end) == dist.end() || dist[end] == 1e9) {
        return {path, -1};
    }
    
    for (string at = end; at != ""; at = parent[at]) {
        path.push_back(at);
        if (at == start) break;
    }
    reverse(path.begin(), path.end());
    
    return {path, dist[end]};
}

// Alternative path finding (K-th shortest path)
vector<pair<vector<string>, int>> find_alternative_paths(string start, string end, int k = 3) {
    vector<pair<vector<string>, int>> paths;
    
    // Store previous paths to avoid duplicates
    unordered_map<string, bool> visited_paths;
    
    // Use iterative deepening approach
    for (int i = 0; i < k && paths.size() < k; i++) {
        auto result = dijkstra(start, end, true);
        
        if (result.first.empty() || result.second == -1) break;
        
        // Check if path already exists
        string path_key = "";
        for (auto& node : result.first) path_key += node + "|";
        
        if (visited_paths.find(path_key) == visited_paths.end()) {
            visited_paths[path_key] = true;
            paths.push_back(result);
        }
        
        // Simulate blocking first edge for next iteration
        if (result.first.size() >= 2) {
            string first_edge = result.first[0] + "-" + result.first[1];
            // Block this edge temporarily
            for (auto& edge : graph[result.first[0]]) {
                if (edge.to == result.first[1]) {
                    int temp_weight = edge.weight;
                    edge.weight = 1e9;
                    result = dijkstra(start, end, true);
                    edge.weight = temp_weight;
                    if (!result.first.empty() && result.second != -1) {
                        string new_path_key = "";
                        for (auto& n : result.first) new_path_key += n + "|";
                        if (visited_paths.find(new_path_key) == visited_paths.end()) {
                            visited_paths[new_path_key] = true;
                            paths.push_back(result);
                        }
                    }
                    break;
                }
            }
        }
    }
    
    return paths;
}

// Forward declarations
string extract_body(const string& request);

// JSON Response Helper
string make_json_response(const string& body, int status = 200) {
    stringstream ss;
    ss << "HTTP/1.1 " << status << (status == 200 ? " OK" : status == 204 ? " No Content" : " Bad Request") << "\r\n";
    ss << "Content-Type: application/json\r\n";
    ss << "Access-Control-Allow-Origin: *\r\n";
    ss << "Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT\r\n";
    ss << "Access-Control-Allow-Headers: Content-Type, Authorization\r\n";
    ss << "Content-Length: " << body.length() << "\r\n";
    ss << "Connection: close\r\n\r\n";
    ss << body;
    return ss.str();
}

// Extract body from HTTP request (handles both \r\n and \n line endings)
// If no headers found, assumes the string is already the body
string extract_body(const string& request) {
    size_t pos = request.find("\r\n\r\n");
    if (pos != string::npos) return request.substr(pos + 4);
    pos = request.find("\n\n");
    if (pos != string::npos) return request.substr(pos + 2);
    // No header delimiter found - might be just the body (for 100-continue handling)
    if (!request.empty() && (request[0] == '{' || request[0] == '[')) {
        return request;
    }
    return "";
}

// Parse JSON body for POST requests
string extract_json_value(const string& body, const string& key) {
    string search_key = "\"" + key + "\":";
    size_t pos = body.find(search_key);
    if (pos == string::npos) return "";
    pos += search_key.length();
    
    // Skip whitespace
    while (pos < body.size() && (body[pos] == ' ' || body[pos] == '\t')) pos++;
    
    if (pos >= body.size()) return "";
    
    if (body[pos] == '"') {
        pos++;
        size_t end = body.find("\"", pos);
        if (end == string::npos) return "";
        return body.substr(pos, end - pos);
    }
    
    // Non-string value (number, boolean)
    size_t end = pos;
    while (end < body.size() && body[end] != ',' && body[end] != '}' && body[end] != ']') end++;
    return body.substr(pos, end - pos);
}

// Update traffic conditions
void update_traffic(const string& road, int density) {
    bool found = false;
    for (auto& traffic : traffic_updates) {
        if (traffic.road == road) {
            traffic.density = density;
            traffic.timestamp = to_string(chrono::system_clock::now().time_since_epoch().count());
            found = true;
            break;
        }
    }
    if (!found) {
        TrafficData new_traffic;
        new_traffic.road = road;
        new_traffic.density = density;
        new_traffic.speed_limit = 60;
        new_traffic.is_accident = false;
        new_traffic.timestamp = to_string(chrono::system_clock::now().time_since_epoch().count());
        traffic_updates.push_back(new_traffic);
    }
}

// Initialize Lahore city graph with real road data
void initialize_graph() {
    // Core City Areas
    graph["UET Lahore"] = {
        {"Ferozepur Road", 3, 2.5, 30},
        {"Shalimar Gardens", 3, 3.2, 25},
        {"Gulberg III", 4, 4.1, 20},
        {"Minhaj-ul-Quran International", 5, 4.8, 15},
        {"Baroon", 3, 3.0, 25}
    };
    
    graph["University of Punjab"] = {
        {"UET Lahore", 4, 3.5, 20},
        {"Shalimar Block", 2, 2.0, 35},
        {"Kot Lakhpat", 3, 2.8, 25},
        {"Wapda Town", 3, 3.2, 25}
    };
    
    graph["Lahore Railway Station"] = {
        {"Anarkali Bazaar", 2, 1.8, 40},
        {"Badshahi Mosque", 3, 2.5, 30},
        {"Canal Bank", 3, 3.2, 25},
        {"Mall Road", 2, 2.4, 35},
        {"Ichra", 2, 2.0, 35},
        {"Mozang", 2, 2.2, 35}
    };
    
    graph["Lahore Airport (Allama Iqbal)"] = {
        {"Lahore Cantt", 4, 4.0, 20},
        {"Canal Bank", 6, 5.5, 15},
        {"Badshahi Mosque", 7, 7.2, 10},
        {"Wapda Town", 5, 4.8, 15}
    };
    
    graph["Mall Road"] = {
        {"Lahore Railway Station", 2, 2.4, 35},
        {"Anarkali Bazaar", 2, 1.5, 45},
        {"Canal Bank", 3, 2.8, 30},
        {"Ferozepur Road", 2, 1.8, 40},
        {"Lahore Cantt", 4, 3.5, 20},
        {"Ichra", 2, 2.0, 35},
        {"Samanabad", 2, 2.2, 35}
    };
    
    graph["Anarkali Bazaar"] = {
        {"Lahore Railway Station", 2, 1.8, 40},
        {"Mall Road", 2, 1.5, 45},
        {"Badshahi Mosque", 2, 1.8, 40},
        {"Gulberg III", 3, 2.5, 30},
        {"Samanabad", 2, 1.5, 45},
        {"Lahore Zoo", 1, 1.2, 50}
    };
    
    graph["Minhaj-ul-Quran International"] = {
        {"UET Lahore", 5, 4.8, 15},
        {"Gulberg III", 2, 1.8, 40},
        {"Lahore Zoo", 4, 3.5, 20},
        {"Model Town", 4, 4.2, 18},
        {"Wapda Town", 3, 2.5, 30},
        {"Kot Lakhpat", 3, 3.0, 25}
    };
    
    graph["Shalimar Gardens"] = {
        {"UET Lahore", 3, 3.2, 25},
        {"Lahore Cantt", 5, 4.5, 18},
        {"Canal Bank", 3, 2.5, 30},
        {"Baghbanpura", 2, 2.0, 35},
        {"Mozang", 4, 3.8, 20},
        {"Mughalpura", 3, 2.8, 25}
    };
    
    graph["Badshahi Mosque"] = {
        {"Lahore Railway Station", 3, 2.5, 30},
        {"Anarkali Bazaar", 2, 1.8, 40},
        {"Lahore Airport (Allama Iqbal)", 7, 7.2, 10},
        {"Lahore Zoo", 4, 4.0, 18},
        {"Mozang", 2, 2.0, 35}
    };
    
    graph["Lahore Zoo"] = {
        {"Minhaj-ul-Quran International", 4, 3.5, 20},
        {"Badshahi Mosque", 4, 4.0, 18},
        {"Gulberg III", 2, 2.2, 35},
        {"Garden Town", 3, 2.5, 30},
        {"Yousafabad", 2, 1.5, 45}
    };
    
    graph["Canal Bank"] = {
        {"Lahore Railway Station", 3, 3.2, 25},
        {"Mall Road", 3, 2.8, 30},
        {"Lahore Airport (Allama Iqbal)", 6, 5.5, 15},
        {"Shalimar Gardens", 3, 2.5, 30},
        {"Lahore Cantt", 3, 3.2, 25},
        {"Gulberg III", 3, 3.0, 25}
    };
    
    graph["Ferozepur Road"] = {
        {"UET Lahore", 3, 2.5, 30},
        {"Mall Road", 2, 1.8, 40},
        {"Lahore Cantt", 3, 2.8, 30},
        {"Gulberg III", 2, 1.5, 45},
        {"Baroon", 1, 1.2, 50},
        {"Wahdat Colony", 2, 2.0, 35}
    };
    
    graph["Gulberg III"] = {
        {"UET Lahore", 4, 4.1, 20},
        {"Ferozepur Road", 2, 1.5, 45},
        {"Anarkali Bazaar", 3, 2.5, 30},
        {"Minhaj-ul-Quran International", 2, 1.8, 40},
        {"Lahore Zoo", 2, 2.2, 35},
        {"Garden Town", 2, 1.8, 40},
        {"Canal Bank", 3, 3.0, 25}
    };
    
    graph["Lahore Cantt"] = {
        {"Lahore Airport (Allama Iqbal)", 4, 4.0, 20},
        {"Mall Road", 4, 3.5, 20},
        {"Shalimar Gardens", 5, 4.5, 18},
        {"Canal Bank", 3, 3.2, 25},
        {"Ferozepur Road", 3, 2.8, 30},
        {"Mughalpura", 4, 3.5, 20},
        {"Mozang", 3, 2.8, 30}
    };
    
    graph["Model Town"] = {
        {"Minhaj-ul-Quran International", 4, 4.2, 18},
        {"Garden Town", 3, 3.0, 25},
        {"Wapda Town", 2, 2.2, 35},
        {"Kot Lakhpat", 3, 2.5, 30},
        {"Johar Town", 4, 3.5, 20}
    };
    
    graph["Garden Town"] = {
        {"Minhaj-ul-Quran International", 3, 3.0, 25},
        {"Lahore Zoo", 3, 2.5, 30},
        {"Gulberg III", 2, 1.8, 40},
        {"Model Town", 3, 3.0, 25},
        {"Yousafabad", 2, 1.5, 45},
        {"Township", 2, 2.2, 35}
    };
    
    graph["Shalimar Block"] = {
        {"University of Punjab", 2, 2.0, 35},
        {"Kot Lakhpat", 2, 1.5, 45},
        {"Wapda Town", 2, 2.2, 35},
        {"Baroon", 3, 2.5, 30}
    };
    
    graph["Ichra"] = {
        {"Lahore Railway Station", 2, 2.0, 35},
        {"Mall Road", 2, 2.0, 35},
        {"Mozang", 2, 1.8, 40},
        {"Samanabad", 2, 1.5, 45}
    };
    
    graph["Nishtar Town"] = {
        {"Mall Road", 3, 2.5, 30},
        {"Samanabad", 2, 1.8, 40},
        {"Yousafabad", 1, 1.2, 50},
        {"Township", 2, 2.0, 35}
    };
    
    graph["Township"] = {
        {"Garden Town", 2, 2.2, 35},
        {"Nishtar Town", 2, 2.0, 35},
        {"Yousafabad", 2, 1.5, 45},
        {"Johar Town", 3, 2.5, 30},
        {"Wapda Town", 3, 3.0, 25}
    };
    
    graph["Wapda Town"] = {
        {"Minhaj-ul-Quran International", 3, 2.5, 30},
        {"Shalimar Block", 2, 2.2, 35},
        {"Model Town", 2, 2.2, 35},
        {"Kot Lakhpat", 2, 1.8, 40},
        {"Johar Town", 3, 2.5, 30},
        {"Lahore Airport (Allama Iqbal)", 5, 4.8, 15}
    };
    
    graph["Johar Town"] = {
        {"Model Town", 4, 3.5, 20},
        {"Township", 3, 2.5, 30},
        {"Wapda Town", 3, 2.5, 30},
        {"Kot Lakhpat", 3, 3.0, 25}
    };
    
    graph["Mughalpura"] = {
        {"Shalimar Gardens", 3, 2.8, 25},
        {"Lahore Cantt", 4, 3.5, 20},
        {"Baghbanpura", 3, 2.5, 30},
        {"Mozang", 3, 3.0, 25}
    };
    
    graph["Mozang"] = {
        {"Lahore Railway Station", 2, 2.2, 35},
        {"Badshahi Mosque", 2, 2.0, 35},
        {"Shalimar Gardens", 4, 3.8, 20},
        {"Lahore Cantt", 3, 2.8, 30},
        {"Ichra", 2, 1.8, 40},
        {"Mughalpura", 3, 3.0, 25}
    };
    
    graph["Baghbanpura"] = {
        {"Shalimar Gardens", 2, 2.0, 35},
        {"Mughalpura", 3, 2.5, 30},
        {"Wahdat Colony", 2, 2.0, 35},
        {"Baroon", 3, 2.8, 25}
    };
    
    graph["Wahdat Colony"] = {
        {"Ferozepur Road", 2, 2.0, 35},
        {"Baghbanpura", 2, 2.0, 35},
        {"Baroon", 2, 1.5, 45},
        {"Mughalpura", 3, 2.8, 25}
    };
    
    graph["Samanabad"] = {
        {"Mall Road", 2, 2.2, 35},
        {"Anarkali Bazaar", 2, 1.5, 45},
        {"Ichra", 2, 1.5, 45},
        {"Nishtar Town", 2, 1.8, 40},
        {"Yousafabad", 1, 1.2, 50}
    };
    
    graph["Yousafabad"] = {
        {"Lahore Zoo", 2, 1.5, 45},
        {"Garden Town", 2, 1.5, 45},
        {"Nishtar Town", 1, 1.2, 50},
        {"Township", 2, 1.5, 45},
        {"Samanabad", 1, 1.2, 50}
    };
    
    graph["Kot Lakhpat"] = {
        {"University of Punjab", 3, 2.8, 25},
        {"Shalimar Block", 2, 1.5, 45},
        {"Minhaj-ul-Quran International", 3, 3.0, 25},
        {"Model Town", 3, 2.5, 30},
        {"Wapda Town", 2, 1.8, 40},
        {"Johar Town", 3, 3.0, 25}
    };
    
    graph["Baroon"] = {
        {"UET Lahore", 3, 3.0, 25},
        {"Ferozepur Road", 1, 1.2, 50},
        {"Shalimar Block", 3, 2.5, 30},
        {"Baghbanpura", 3, 2.8, 25},
        {"Wahdat Colony", 2, 1.5, 45}
    };
}

// Function to get all locations
string get_all_locations_json() {
    stringstream ss;
    ss << "{\"locations\":[";
    bool first = true;
    vector<pair<string, pair<double, double>>> coordinates = {
        {"UET Lahore", {31.5785, 74.4022}},
        {"University of Punjab", {31.5680, 74.4650}},
        {"Lahore Railway Station", {31.5712, 74.3042}},
        {"Lahore Airport (Allama Iqbal)", {31.5214, 74.4031}},
        {"Mall Road", {31.5636, 74.3142}},
        {"Anarkali Bazaar", {31.5654, 74.3331}},
        {"Minhaj-ul-Quran International", {31.5385, 74.4032}},
        {"Shalimar Gardens", {31.5882, 74.3642}},
        {"Badshahi Mosque", {31.5883, 74.3104}},
        {"Lahore Zoo", {31.5402, 74.3331}},
        {"Canal Bank", {31.5736, 74.3592}},
        {"Ferozepur Road", {31.5682, 74.3782}},
        {"Gulberg III", {31.5454, 74.3952}},
        {"Lahore Cantt", {31.5876, 74.3492}},
        {"Model Town", {31.5185, 74.4122}},
        {"Garden Town", {31.5298, 74.3832}},
        {"Shalimar Block", {31.5500, 74.4400}},
        {"Ichra", {31.5570, 74.3080}},
        {"Nishtar Town", {31.5350, 74.3200}},
        {"Township", {31.5100, 74.3500}},
        {"Wapda Town", {31.5200, 74.3900}},
        {"Johar Town", {31.4950, 74.3700}},
        {"Mughalpura", {31.5900, 74.3700}},
        {"Mozang", {31.5800, 74.3250}},
        {"Baghbanpura", {31.5950, 74.3800}},
        {"Wahdat Colony", {31.5850, 74.3850}},
        {"Samanabad", {31.5550, 74.3400}},
        {"Yousafabad", {31.5400, 74.3500}},
        {"Kot Lakhpat", {31.5300, 74.4200}},
        {"Baroon", {31.5600, 74.3950}}
    };
    
    for (auto& loc : coordinates) {
        if (!first) ss << ",";
        ss << "{\"name\":\"" << loc.first << "\",\"lat\":" << loc.second.first << ",\"lng\":" << loc.second.second << "}";
        first = false;
    }
    ss << "]}";
    return ss.str();
}

// Get graph data as JSON
string get_graph_json() {
    stringstream ss;
    ss << "{\"graph\":{";
    bool first_node = true;
    for (auto& node : graph) {
        if (!first_node) ss << ",";
        ss << "\"" << node.first << "\":[";
        bool first_edge = true;
        for (auto& edge : node.second) {
            if (!first_edge) ss << ",";
            ss << "{\"to\":\"" << edge.to << "\",\"weight\":" << edge.weight 
               << ",\"distance\":" << edge.distance_km 
               << ",\"traffic\":" << edge.traffic_density << "}";
            first_edge = false;
        }
        ss << "]";
        first_node = false;
    }
    ss << "}}";
    return ss.str();
}

// Main server function
void run_server() {
    // Initialize graph
    initialize_graph();
    
    #ifdef _WIN32
    WSADATA wsaData;
    if (WSAStartup(MAKEWORD(2, 2), &wsaData) != 0) {
        cerr << "WSAStartup failed" << endl;
        return;
    }
    #endif
    
    int server_fd = socket(AF_INET, SOCK_STREAM, 0);
    if (server_fd < 0) {
        cerr << "Socket creation failed" << endl;
        return;
    }
    
    int opt = 1;
    setsockopt(server_fd, SOL_SOCKET, SO_REUSEADDR, (char*)&opt, sizeof(opt));
    
    sockaddr_in address;
    address.sin_family = AF_INET;
    address.sin_addr.s_addr = INADDR_ANY;
    address.sin_port = htons(18080);
    
    if (bind(server_fd, (struct sockaddr*)&address, sizeof(address)) < 0) {
        cerr << "Bind failed" << endl;
        return;
    }
    
    if (listen(server_fd, 10) < 0) {
        cerr << "Listen failed" << endl;
        return;
    }
    
    cout << "\n================================================" << endl;
    cout << "   SMART CITY TRAFFIC NAVIGATION SYSTEM" << endl;
    cout << "================================================" << endl;
    cout << "   Server running on port 18080" << endl;
    cout << "   API endpoints:" << endl;
    cout << "     GET  /api/locations - Get all locations" << endl;
    cout << "     GET  /api/graph - Get graph data" << endl;
    cout << "     POST /api/navigate - Find shortest path" << endl;
    cout << "     POST /api/alternatives - Find alternative paths" << endl;
    cout << "     POST /api/traffic - Update traffic conditions" << endl;
    cout << "     GET  /api/traffic - Get traffic conditions" << endl;
    cout << "================================================\n" << endl;
    
    while (true) {
        sockaddr_in client_addr;
        socklen_t client_len = sizeof(client_addr);
        int client_fd = accept(server_fd, (struct sockaddr*)&client_addr, &client_len);
        
        if (client_fd < 0) {
            cerr << "Accept failed" << endl;
            continue;
        }
        
        char buffer[16384] = {0};
        int total_read = recv(client_fd, buffer, sizeof(buffer) - 1, 0);
        
        if (total_read > 0) {
            string request(buffer, total_read);
            string method, path;
            
            // Parse HTTP request line
            size_t method_end = request.find(' ');
            if (method_end != string::npos) {
                method = request.substr(0, method_end);
                size_t path_end = request.find(' ', method_end + 1);
                if (path_end != string::npos) {
                    path = request.substr(method_end + 1, path_end - method_end - 1);
                }
            }
            
            // Handle POST/PUT with incomplete body (Expect: 100-continue etc.)
            if ((method == "POST" || method == "PUT") && extract_body(request).empty()) {
                if (request.find("Expect:") != string::npos || request.find("expect:") != string::npos) {
                    string continue_resp = "HTTP/1.1 100 Continue\r\n\r\n";
                    send(client_fd, continue_resp.c_str(), continue_resp.length(), 0);
                }
                for (int attempt = 0; attempt < 3; attempt++) {
                    fd_set readfds;
                    FD_ZERO(&readfds);
                    FD_SET(client_fd, &readfds);
                    timeval tv = {1, 0};
                    if (select(client_fd + 1, &readfds, NULL, NULL, &tv) > 0) {
                        int more = recv(client_fd, buffer, sizeof(buffer) - 1, 0);
                        if (more > 0) {
                            request = string(buffer, more);
                            break;
                        }
                    } else break;
                }
            }
            
            string response;
            
            // Handle OPTIONS preflight
            if (method == "OPTIONS") {
                response = make_json_response("", 204);
            }
            // Get all locations
            else if (method == "GET" && path == "/api/locations") {
                response = make_json_response(get_all_locations_json());
                cout << "[INFO] GET /api/locations - Returned " << graph.size() << " locations" << endl;
            }
            // Get graph data
            else if (method == "GET" && path == "/api/graph") {
                response = make_json_response(get_graph_json());
                cout << "[INFO] GET /api/graph - Returned graph data" << endl;
            }
            // Get traffic conditions
            else if (method == "GET" && path == "/api/traffic") {
                stringstream ss;
                ss << "{\"traffic\":[";
                for (size_t i = 0; i < traffic_updates.size(); i++) {
                    if (i > 0) ss << ",";
                    ss << "{\"road\":\"" << traffic_updates[i].road 
                       << "\",\"density\":" << traffic_updates[i].density 
                       << ",\"timestamp\":\"" << traffic_updates[i].timestamp << "\"}";
                }
                ss << "]}";
                response = make_json_response(ss.str());
                cout << "[INFO] GET /api/traffic - Returned " << traffic_updates.size() << " updates" << endl;
            }
            // Navigate - find shortest path
            else if (method == "POST" && path == "/api/navigate") {
                string body = extract_body(request);
                string start = extract_json_value(body, "start");
                string end = extract_json_value(body, "end");
                string consider_traffic_str = extract_json_value(body, "consider_traffic");
                bool consider_traffic = (consider_traffic_str == "true" || consider_traffic_str == "1");
                
                cout << "[INFO] POST /api/navigate - From: " << start << " To: " << end;
                if (consider_traffic) cout << " (with traffic)";
                cout << endl;
                
                auto result = dijkstra(start, end, consider_traffic);
                
                stringstream ss;
                if (result.second == -1) {
                    ss << "{\"error\":\"No path found between " << start << " and " << end << "\"}";
                } else {
                    ss << "{\"distance\":" << result.second;
                    ss << ",\"path\":[";
                    for (size_t i = 0; i < result.first.size(); i++) {
                        if (i > 0) ss << ",";
                        ss << "\"" << result.first[i] << "\"";
                    }
                    ss << "],\"steps\":" << result.first.size();
                    ss << ",\"estimated_time\":" << (result.second * 2) << "}";
                }
                response = make_json_response(ss.str());
            }
            // Find alternative paths
            else if (method == "POST" && path == "/api/alternatives") {
                string body = extract_body(request);
                string start = extract_json_value(body, "start");
                string end = extract_json_value(body, "end");
                string k_str = extract_json_value(body, "k");
                int k = (k_str.empty() || k_str == "null") ? 3 : stoi(k_str);
                
                cout << "[INFO] POST /api/alternatives - From: " << start << " To: " << end << " (k=" << k << ")" << endl;
                
                auto paths = find_alternative_paths(start, end, k);
                
                stringstream ss;
                ss << "{\"paths\":[";
                for (size_t i = 0; i < paths.size(); i++) {
                    if (i > 0) ss << ",";
                    ss << "{\"id\":" << i+1 << ",\"distance\":" << paths[i].second;
                    ss << ",\"path\":[";
                    for (size_t j = 0; j < paths[i].first.size(); j++) {
                        if (j > 0) ss << ",";
                        ss << "\"" << paths[i].first[j] << "\"";
                    }
                    ss << "]}";
                }
                ss << "]}";
                response = make_json_response(ss.str());
            }
            // Update traffic conditions
            else if (method == "POST" && path == "/api/traffic") {
                string body = extract_body(request);
                string road = extract_json_value(body, "road");
                string density_str = extract_json_value(body, "density");
                
                if (!road.empty() && !density_str.empty()) {
                    int density = stoi(density_str);
                    update_traffic(road, density);
                    stringstream ss;
                    ss << "{\"status\":\"success\",\"message\":\"Traffic updated for " << road << "\"}";
                    response = make_json_response(ss.str());
                    cout << "[INFO] POST /api/traffic - Updated " << road << " density to " << density << endl;
                } else {
                    response = make_json_response("{\"error\":\"Missing road or density\"}", 400);
                }
            }
            // 404 Not Found
            else {
                response = make_json_response("{\"error\":\"Endpoint not found\"}", 404);
                cout << "[WARN] 404 - Unknown endpoint: " << method << " " << path << endl;
            }
            
            send(client_fd, response.c_str(), response.length(), 0);
        }
        
        #ifdef _WIN32
        closesocket(client_fd);
        #else
        close(client_fd);
        #endif
    }
    
    #ifdef _WIN32
    closesocket(server_fd);
    WSACleanup();
    #else
    close(server_fd);
    #endif
}

int main() {
    run_server();
    return 0;
}