#pragma once

#include <uwebsockets/App.h>
#include <string>
#include <vector>
#include <unordered_map>
#include <mutex>
#include <functional>

struct PerSocketData {
    std::string sessionId;   // room this socket belongs to (empty = no room)
};

// --- Connection ---
struct Connection {
    std::string id;
    std::string ip;
    bool authenticated;
};

// --- LinkManager (templated to handle both SSL and non-SSL) ---
template<bool SSL>
class LinkManager {
public:
    using WSSocket = uWS::WebSocket<SSL, true, PerSocketData>;

    LinkManager() = default;
    ~LinkManager() = default;

    void onConnect(WSSocket* ws, std::string_view ip);
    void onDisconnect(WSSocket* ws, int code, std::string_view message);
    void onMessage(WSSocket* ws, std::string_view message, uWS::OpCode opCode);
    void broadcast(const std::string& message);
    void sendTo(const std::string& connectionId, const std::string& message);
    size_t connectionCount() const;

private:
    std::unordered_map<WSSocket*, Connection> connections_;
    std::unordered_map<std::string, std::vector<WSSocket*>> rooms_;
    mutable std::mutex mutex_;

    std::string generateId() const;
    void broadcastToRoom(const std::string& sessionId, const std::string& message, WSSocket* exclude = nullptr);
    void broadcastBinaryToRoom(const std::string& sessionId, std::string_view data, WSSocket* exclude = nullptr);
    void removeFromRoom(WSSocket* ws);
};