#ifndef SERVER_H
#define SERVER_H

#include <string>
#include <vector>

using namespace std;

// Traffic conditions structure
struct TrafficData {
    string road;
    int density;
    int speed_limit;
    string timestamp;
    bool is_accident;
};

// Global traffic updates declaration
extern vector<TrafficData> traffic_updates;

// Function declarations for server operations
void update_traffic(const string& road, int density);
string make_json_response(const string& body, int status = 200);
string extract_body(const string& request);
string extract_json_value(const string& body, const string& key);
void run_server();

#endif // SERVER_H
