#include <uwebsockets/App.h>
#include <fstream>
#include <iostream>
#include <string>
#include <nlohmann/json.hpp>
#include "Link.h"

using json = nlohmann::json;

// --- Load Config ---
json loadConfig(const std::string& path) {
    std::ifstream file(path);
    if (!file.is_open()) {
        std::cerr << "[!] Could not open config: " << path << "\n";
        std::cerr << "[!] Using defaults\n";
        return {
            {"server", {{"port", 9001}, {"host", "0.0.0.0"}, {"idle_timeout", 120}}},
            {"ssl",    {{"enabled", false}}},
            {"env",    "development"}
        };
    }
    return json::parse(file);
}

// --- Main ---
int main() {
    json config = loadConfig("config/config.json");

    int                port        = config["server"]["port"];
    std::string        host        = config["server"]["host"];
    unsigned short     idleTimeout = static_cast<unsigned short>(
                                        (int)config["server"]["idle_timeout"]);
    bool               sslEnabled  = config["ssl"]["enabled"];
    std::string        env         = config["env"];

    std::cout << "[inksubserver] Starting...\n";
    std::cout << "[inksubserver] Env:  " << env        << "\n";
    std::cout << "[inksubserver] Host: " << host       << "\n";
    std::cout << "[inksubserver] Port: " << port       << "\n";
    std::cout << "[inksubserver] SSL:  " << (sslEnabled ? "enabled" : "disabled") << "\n";

    if (sslEnabled) {
        std::string cert = config["ssl"]["cert"];
        std::string key  = config["ssl"]["key"];

        LinkManager<true> links;

        uWS::SSLApp({
            .cert_file_name = cert.c_str(),
            .key_file_name  = key.c_str()
        }).ws<PerSocketData>("/*", {
            .idleTimeout = idleTimeout,
            .open = [&links](auto* ws) {
                auto ip = ws->getRemoteAddressAsText();
                links.onConnect(ws, ip);
            },
            .message = [&links](auto* ws, std::string_view msg, uWS::OpCode opCode) {
                links.onMessage(ws, msg, opCode);
            },
            .close = [&links](auto* ws, int code, std::string_view msg) {
                links.onDisconnect(ws, code, msg);
            }
        }).listen(port, [port](auto* listenSocket) {
            if (listenSocket) {
                std::cout << "[inksubserver] Listening on port " << port << " (WSS)\n";
            } else {
                std::cerr << "[!] Failed to listen on port " << port << "\n";
            }
        }).run();

    } else {
        LinkManager<false> links;

        uWS::App().ws<PerSocketData>("/*", {
            .idleTimeout = idleTimeout,
            .open = [&links](auto* ws) {
                auto ip = ws->getRemoteAddressAsText();
                links.onConnect(ws, ip);
            },
            .message = [&links](auto* ws, std::string_view msg, uWS::OpCode opCode) {
                links.onMessage(ws, msg, opCode);
            },
            .close = [&links](auto* ws, int code, std::string_view msg) {
                links.onDisconnect(ws, code, msg);
            }
        }).listen(port, [port](auto* listenSocket) {
            if (listenSocket) {
                std::cout << "[inksubserver] Listening on port " << port << " (WS)\n";
            } else {
                std::cerr << "[!] Failed to listen on port " << port << "\n";
            }
        }).run();
    }

    return 0;
}