#include "graph.h"
#include <sstream>

using namespace std;

// Global graph instance
unordered_map<string, vector<Edge>> graph;

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
