#include "algorithms.h"
#include <queue>
#include <unordered_map>

using namespace std;

// External declaration for traffic data (defined in server.cpp)
extern vector<struct TrafficData> traffic_updates;

// Dijkstra Algorithm Implementation
pair<vector<string>, int> dijkstra(string start, string end, bool consider_traffic) {
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
vector<pair<vector<string>, int>> find_alternative_paths(string start, string end, int k) {
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
