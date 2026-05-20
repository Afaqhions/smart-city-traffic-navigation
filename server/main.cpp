#include <iostream>
#include <vector>
#include <queue>
#include <unordered_map>
#include <string>
#include <algorithm>
#include <winsock2.h>
#include <sstream>

using namespace std;

struct Edge {
    string to;
    int weight;
};

unordered_map<string, vector<Edge>> graph;

// Dijkstra Algorithm
pair<vector<string>, int> dijkstra(string start, string end) {
    unordered_map<string, int> dist;
    unordered_map<string, string> parent;
    // Fixed: replaced structured binding with iterator
    for (auto it = graph.begin(); it != graph.end(); ++it) {
        dist[it->first] = 1e9;
    }
    priority_queue<pair<int, string>, vector<pair<int, string>>, greater<pair<int, string>>> pq;

    dist[start] = 0;
    pq.push({0, start});

    while (!pq.empty()) {
        int d = pq.top().first;
        string u = pq.top().second;
        pq.pop();
        if (d > dist[u]) continue;
        if (u == end) break;
        for (auto& edge : graph[u]) {
            if (dist[u] + edge.weight < dist[edge.to]) {
                dist[edge.to] = dist[u] + edge.weight;
                parent[edge.to] = u;
                pq.push({dist[edge.to], edge.to});
            }
        }
    }

    vector<string> path;
    if (dist.find(end) == dist.end() || dist[end] == 1e9) return {{}, -1};
    for (string at = end; at != ""; at = parent[at]) {
        path.push_back(at);
        if (at == start) break;
    }
    reverse(path.begin(), path.end());
    return {path, dist[end]};
}

// Simple HTTP Response Helper
string make_response(string body, int status = 200) {
    stringstream ss;
    ss << "HTTP/1.1 " << status << (status == 200 ? " OK" : " Not Found") << "\r\n";
    ss << "Content-Type: application/json\r\n";
    ss << "Access-Control-Allow-Origin: *\r\n";
    ss << "Access-Control-Allow-Methods: POST, GET, OPTIONS\r\n";
    ss << "Access-Control-Allow-Headers: Content-Type\r\n";
    ss << "Content-Length: " << body.length() << "\r\n";
    ss << "Connection: close\r\n\r\n";
    ss << body;
    return ss.str();
}

int main() {
    // Seed Graph Data for Lahore
    graph["UET Lahore"] = {{"Ferozepur Road", 3}, {"Shalimar Gardens", 3}, {"Gulberg III", 4}, {"Minhaj-ul-Quran International", 5}, {"Baroon", 3}};
    graph["University of Punjab"] = {{"UET Lahore", 4}, {"Shalimar Block", 2}, {"Kot Lakhpat", 3}, {"Wapda Town", 3}};
    graph["Lahore Railway Station"] = {{"Anarkali Bazaar", 2}, {"Badshahi Mosque", 3}, {"Canal Bank", 3}, {"Mall Road", 2}, {"Ichra", 2}, {"Mozang", 2}};
    graph["Lahore Airport (Allama Iqbal)"] = {{"Lahore Cantt", 4}, {"Canal Bank", 6}, {"Badshahi Mosque", 7}, {"Wapda Town", 5}};
    graph["Mall Road"] = {{"Lahore Railway Station", 2}, {"Anarkali Bazaar", 2}, {"Canal Bank", 3}, {"Ferozepur Road", 2}, {"Lahore Cantt", 4}, {"Ichra", 2}, {"Samanabad", 2}};
    graph["Anarkali Bazaar"] = {{"Lahore Railway Station", 2}, {"Mall Road", 2}, {"Badshahi Mosque", 2}, {"Gulberg III", 3}, {"Samanabad", 2}, {"Lahore Zoo", 1}};
    graph["Minhaj-ul-Quran International"] = {{"UET Lahore", 5}, {"Gulberg III", 2}, {"Lahore Zoo", 4}, {"Model Town", 4}, {"Wapda Town", 3}, {"Kot Lakhpat", 3}};
    graph["Shalimar Gardens"] = {{"UET Lahore", 3}, {"Lahore Cantt", 5}, {"Canal Bank", 3}, {"Baghbanpura", 2}, {"Mozang", 4}, {"Mughalpura", 3}};
    graph["Badshahi Mosque"] = {{"Lahore Railway Station", 3}, {"Anarkali Bazaar", 2}, {"Lahore Airport (Allama Iqbal)", 7}, {"Lahore Zoo", 4}, {"Mozang", 2}};
    graph["Lahore Zoo"] = {{"Minhaj-ul-Quran International", 4}, {"Badshahi Mosque", 4}, {"Gulberg III", 2}, {"Garden Town", 3}, {"Yousafabad", 2}};
    graph["Canal Bank"] = {{"Lahore Railway Station", 3}, {"Mall Road", 3}, {"Lahore Airport (Allama Iqbal)", 6}, {"Shalimar Gardens", 3}, {"Lahore Cantt", 3}, {"Gulberg III", 3}};
    graph["Ferozepur Road"] = {{"UET Lahore", 3}, {"Mall Road", 2}, {"Lahore Cantt", 3}, {"Gulberg III", 2}, {"Baroon", 1}, {"Wahdat Colony", 2}};
    graph["Gulberg III"] = {{"UET Lahore", 4}, {"Ferozepur Road", 2}, {"Anarkali Bazaar", 3}, {"Minhaj-ul-Quran International", 2}, {"Lahore Zoo", 2}, {"Garden Town", 2}, {"Canal Bank", 3}};
    graph["Lahore Cantt"] = {{"Lahore Airport (Allama Iqbal)", 4}, {"Mall Road", 4}, {"Shalimar Gardens", 5}, {"Canal Bank", 3}, {"Ferozepur Road", 3}, {"Mughalpura", 4}, {"Mozang", 3}};
    graph["Model Town"] = {{"Minhaj-ul-Quran International", 4}, {"Garden Town", 3}, {"Wapda Town", 2}, {"Kot Lakhpat", 3}, {"Johar Town", 4}};
    graph["Garden Town"] = {{"Minhaj-ul-Quran International", 3}, {"Lahore Zoo", 3}, {"Gulberg III", 2}, {"Model Town", 3}, {"Yousafabad", 2}, {"Township", 2}};
    graph["Shalimar Block"] = {{"University of Punjab", 2}, {"Kot Lakhpat", 2}, {"Wapda Town", 2}, {"Baroon", 3}};
    graph["Ichra"] = {{"Lahore Railway Station", 2}, {"Mall Road", 2}, {"Mozang", 2}, {"Samanabad", 2}};
    graph["Nishtar Town"] = {{"Mall Road", 3}, {"Samanabad", 2}, {"Yousafabad", 1}, {"Township", 2}};
    graph["Township"] = {{"Garden Town", 2}, {"Nishtar Town", 2}, {"Yousafabad", 2}, {"Johar Town", 3}, {"Wapda Town", 3}};
    graph["Wapda Town"] = {{"Minhaj-ul-Quran International", 3}, {"Shalimar Block", 2}, {"Model Town", 2}, {"Kot Lakhpat", 2}, {"Johar Town", 3}, {"Lahore Airport (Allama Iqbal)", 5}};
    graph["Johar Town"] = {{"Model Town", 4}, {"Township", 3}, {"Wapda Town", 3}, {"Kot Lakhpat", 3}};
    graph["Mughalpura"] = {{"Shalimar Gardens", 3}, {"Lahore Cantt", 4}, {"Baghbanpura", 3}, {"Mozang", 3}};
    graph["Mozang"] = {{"Lahore Railway Station", 2}, {"Badshahi Mosque", 2}, {"Shalimar Gardens", 4}, {"Lahore Cantt", 3}, {"Ichra", 2}, {"Mughalpura", 3}};
    graph["Baghbanpura"] = {{"Shalimar Gardens", 2}, {"Mughalpura", 3}, {"Wahdat Colony", 2}, {"Baroon", 3}};
    graph["Wahdat Colony"] = {{"Ferozepur Road", 2}, {"Baghbanpura", 2}, {"Baroon", 2}, {"Mughalpura", 3}};
    graph["Samanabad"] = {{"Mall Road", 2}, {"Anarkali Bazaar", 2}, {"Ichra", 2}, {"Nishtar Town", 2}, {"Yousafabad", 1}};
    graph["Yousafabad"] = {{"Lahore Zoo", 2}, {"Garden Town", 2}, {"Nishtar Town", 1}, {"Township", 2}, {"Samanabad", 1}};
    graph["Kot Lakhpat"] = {{"University of Punjab", 3}, {"Shalimar Block", 2}, {"Minhaj-ul-Quran International", 3}, {"Model Town", 3}, {"Wapda Town", 2}, {"Johar Town", 3}};
    graph["Baroon"] = {{"UET Lahore", 3}, {"Ferozepur Road", 1}, {"Shalimar Block", 3}, {"Baghbanpura", 3}, {"Wahdat Colony", 2}};

    // Initialize Winsock
    WSADATA wsaData;
    WSAStartup(MAKEWORD(2, 2), &wsaData);

    SOCKET server_fd = socket(AF_INET, SOCK_STREAM, 0);
    sockaddr_in address;
    address.sin_family = AF_INET;
    address.sin_addr.s_addr = INADDR_ANY;
    address.sin_port = htons(18080);

    bind(server_fd, (struct sockaddr*)&address, sizeof(address));
    listen(server_fd, 3);

    cout << "--- Smart City Backend Live on Port 18080 ---" << endl;

    while (true) {
        SOCKET client_fd = accept(server_fd, NULL, NULL);
        char buffer[4096] = {0};
        recv(client_fd, buffer, 4096, 0);
        string request(buffer);

        if (request.find("OPTIONS") != string::npos) {
            string res = make_response("", 204);
            send(client_fd, res.c_str(), res.length(), 0);
        } else if (request.find("GET /api/map") != string::npos) {
            stringstream ss;
            ss << "{\"cities\":[";
            bool first_city = true;
            // Fixed: replaced structured binding with iterator
            for (auto it = graph.begin(); it != graph.end(); ++it) {
                if (!first_city) ss << ",";
                ss << "{\"name\":\"" << it->first << "\",\"roads\":[";
                for (size_t i = 0; i < it->second.size(); i++) {
                    ss << "{\"to\":\"" << it->second[i].to << "\",\"weight\":" << it->second[i].weight << "}" << (i == it->second.size() - 1 ? "" : ",");
                }
                ss << "]}";
                first_city = false;
            }
            ss << "]}";
            string res = make_response(ss.str());
            send(client_fd, res.c_str(), res.length(), 0);
        } else if (request.find("POST /api/navigate") != string::npos) {
            size_t body_start = request.find("\r\n\r\n") + 4;
            string body = request.substr(body_start);
            // Simple JSON parser for "start" and "end"
            size_t s_pos = body.find("\"start\":\"") + 9;
            string start = body.substr(s_pos, body.find("\"", s_pos) - s_pos);
            size_t e_pos = body.find("\"end\":\"") + 7;
            string end = body.substr(e_pos, body.find("\"", e_pos) - e_pos);

            auto result = dijkstra(start, end);
            stringstream ss;
            if (result.second == -1) ss << "{\"error\":\"Not found\"}";
            else {
                ss << "{\"distance\":" << result.second << ",\"path\":[";
                for (size_t i = 0; i < result.first.size(); i++) {
                    ss << "\"" << result.first[i] << "\"" << (i == result.first.size() - 1 ? "" : ",");
                }
                ss << "]}";
            }
            string res = make_response(ss.str());
            send(client_fd, res.c_str(), res.length(), 0);
        }
        closesocket(client_fd);
    }

    return 0;
}