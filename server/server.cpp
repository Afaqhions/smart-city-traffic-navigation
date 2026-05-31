#include "server.h"
#include "graph.h"
#include "algorithms.h"
#include <iostream>
#include <sstream>
#include <chrono>
#include <algorithm>

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

// Global traffic updates instance
vector<TrafficData> traffic_updates;

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

// JSON Response Helper
string make_json_response(const string& body, int status) {
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
