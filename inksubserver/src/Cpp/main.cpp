#include <uWebSockets/App.h>
#include <fstream>
#include <iostream>
#include <string>
#include <nlohmann/json.hpp>
#include <sys/resource.h> 
#include "Link.h"

using json = nlohmann::json;

// --- Load Config ---
json loadConfig(const std::string& path) {
    std::ifstream file(path);
    if (!file.is_open()) {
        std::cerr << "[!] Could not open config: " << path << "\n";
        return {
            {"server", {{"port", 9001}, {"host", "0.0.0.0"}, {"idle_timeout", 120}}},
            {"ssl",    {{"enabled", false}}},
            {"node_api", {{"url", "http://localhost:5001/api"}, {"internal_secret", ""}}},
            {"env",    "development"}
        };
    }
    return json::parse(file);
}

int main() {
    // ── STEP 1: KERNEL UNLOCK ────────────────────────────────────────────────
    struct rlimit rl;
    if (getrlimit(RLIMIT_NOFILE, &rl) == 0) {
        rl.rlim_cur = 20000; 
        rl.rlim_max = 20000;
        if (setrlimit(RLIMIT_NOFILE, &rl) != 0) {
            std::cerr << "[!] System limit override failed. Run with 'sudo'!\n";
        } else {
            std::cout << "[inksubserver] Kernel unlock successful: 20,000 allowed.\n";
        }
    }

    json config = loadConfig("config/config.json");
    int port = config["server"]["port"];
    unsigned short idleTimeout = static_cast<unsigned short>((int)config["server"]["idle_timeout"]);

    NodeApiConfig apiConfig;
    apiConfig.url = config["node_api"].value("url", "http://localhost:5001/api");
    apiConfig.internalSecret = config["node_api"].value("internal_secret", "");

    // ── STEP 2: ENGINE LAUNCH ────────────────────────────────────────────────
    
    if (config["ssl"]["enabled"]) {
        LinkManager<true> links(apiConfig);
        uWS::SSLApp({
            .cert_file_name = config["ssl"]["cert"].get<std::string>().c_str(),
            .key_file_name  = config["ssl"]["key"].get<std::string>().c_str()
        }).ws<PerSocketData>("/*", {
            /* Settings */
            .compression = uWS::DISABLED,
            .maxPayloadLength = 16 * 1024 * 1024,
            .idleTimeout = idleTimeout,
            .maxBackpressure = 100 * 1024 * 1024,
            /* Handlers */
            .open = [&links](auto* ws) { links.onConnect(ws, ws->getRemoteAddressAsText()); },
            .message = [&links](auto* ws, std::string_view msg, uWS::OpCode opCode) { links.onMessage(ws, msg, opCode); },
            .close = [&links](auto* ws, int code, std::string_view msg) { links.onDisconnect(ws, code, msg); }
        }).listen(port, [port](auto* s) { if(s) std::cout << "Listening on " << port << " (SSL)\n"; }).run();

    } else {
        LinkManager<false> links(apiConfig);
        uWS::App().ws<PerSocketData>("/*", {
            /* Settings */
            .compression = uWS::DISABLED,
            .maxPayloadLength = 16 * 1024 * 1024,
            .idleTimeout = idleTimeout,
            .maxBackpressure = 100 * 1024 * 1024,
            /* Handlers */
            .open = [&links](auto* ws) { links.onConnect(ws, ws->getRemoteAddressAsText()); },
            .message = [&links](auto* ws, std::string_view msg, uWS::OpCode opCode) { links.onMessage(ws, msg, opCode); },
            .close = [&links](auto* ws, int code, std::string_view msg) { links.onDisconnect(ws, code, msg); }
        }).listen(port, [port](auto* s) { if(s) std::cout << "Listening on " << port << " (Non-SSL)\n"; }).run();
    }

    return 0;
}