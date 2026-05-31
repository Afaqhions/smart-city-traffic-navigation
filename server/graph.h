#ifndef GRAPH_H
#define GRAPH_H

#include <string>
#include <vector>
#include <unordered_map>

using namespace std;

// Edge structure for graph representation
struct Edge {
    string to;
    int weight;
    double distance_km;
    int traffic_density; // 0-100 scale
};

// Global graph declaration
extern unordered_map<string, vector<Edge>> graph;

// Function declarations for graph operations
void initialize_graph();
string get_all_locations_json();
string get_graph_json();

#endif // GRAPH_H
