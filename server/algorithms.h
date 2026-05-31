#ifndef ALGORITHMS_H
#define ALGORITHMS_H

#include "graph.h"
#include <string>
#include <vector>

using namespace std;

// Function declarations for pathfinding algorithms
pair<vector<string>, int> dijkstra(string start, string end, bool consider_traffic = true);
vector<pair<vector<string>, int>> find_alternative_paths(string start, string end, int k = 3);

#endif // ALGORITHMS_H
