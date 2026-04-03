#include "Link.h"
#include <iostream>
#include <sstream>
#include <random>
#include <chrono>
#include <algorithm>
#include <nlohmann/json.hpp>

using json = nlohmann::json;

template<bool SSL>
void LinkManager<SSL>::onConnect(WSSocket* ws, std::string_view ip) {
    std::lock_guard<std::mutex> lock(mutex_);

    Connection conn;
    conn.id            = generateId();
    conn.ip            = std::string(ip);
    conn.authenticated = false;

    connections_[ws] = conn;

    std::cout << "[+] Connected: " << conn.id
              << " from " << conn.ip
              << " | Total: " << connections_.size()
              << "\n";
}

template<bool SSL>
void LinkManager<SSL>::onDisconnect(WSSocket* ws, int code, std::string_view message) {
    std::lock_guard<std::mutex> lock(mutex_);

    removeFromRoom(ws);

    auto it = connections_.find(ws);
    if (it != connections_.end()) {
        std::cout << "[-] Disconnected: " << it->second.id
                  << " | Code: " << code
                  << " | Total: " << (connections_.size() - 1)
                  << "\n";
        connections_.erase(it);
    }
}

template<bool SSL>
void LinkManager<SSL>::onMessage(WSSocket* ws, std::string_view message, uWS::OpCode opCode) {
    std::lock_guard<std::mutex> lock(mutex_);

    auto it = connections_.find(ws);
    if (it == connections_.end()) return;

    // --- Binary: Yjs update relay (opaque, no parsing) ---
    if (opCode == uWS::OpCode::BINARY) {
        auto* data = static_cast<PerSocketData*>(ws->getUserData());
        if (!data->sessionId.empty()) {
            broadcastBinaryToRoom(data->sessionId, message, ws);
        }
        return;
    }

    // --- Text: JSON protocol ---
    json msg;
    try {
        msg = json::parse(message);
    } catch (...) {
        ws->send(R"({"type":"error","message":"invalid JSON"})", uWS::OpCode::TEXT);
        return;
    }

    std::string type = msg.value("type", "");

    if (type == "join") {
        std::string sessionId = msg.value("sessionId", "");
        if (sessionId.empty()) {
            ws->send(R"({"type":"error","message":"missing sessionId"})", uWS::OpCode::TEXT);
            return;
        }

        // Remove from any previous room first
        removeFromRoom(ws);

        // Assign session to socket
        auto* data = static_cast<PerSocketData*>(ws->getUserData());
        data->sessionId = sessionId;

        // Add to room (create if needed)
        auto& room = rooms_[sessionId];
        room.push_back(ws);

        std::cout << "[room] " << it->second.id << " joined " << sessionId
                  << " | Room size: " << room.size() << "\n";

        // Acknowledge
        json ack = {{"type", "joined"}, {"sessionId", sessionId}, {"ok", true}};
        ws->send(ack.dump(), uWS::OpCode::TEXT);

        // Broadcast user count to entire room
        json countMsg = {{"type", "userCount"}, {"count", room.size()}};
        broadcastToRoom(sessionId, countMsg.dump());
        return;
    }

    std::cout << "[>] Unhandled message from " << it->second.id
              << ": " << message << "\n";
}

template<bool SSL>
void LinkManager<SSL>::broadcast(const std::string& message) {
    std::lock_guard<std::mutex> lock(mutex_);

    for (auto& [ws, conn] : connections_) {
        ws->send(message, uWS::OpCode::TEXT);
    }

    std::cout << "[*] Broadcast to " << connections_.size() << " clients\n";
}

template<bool SSL>
void LinkManager<SSL>::sendTo(const std::string& connectionId, const std::string& message) {
    std::lock_guard<std::mutex> lock(mutex_);

    for (auto& [ws, conn] : connections_) {
        if (conn.id == connectionId) {
            ws->send(message, uWS::OpCode::TEXT);
            std::cout << "[>] Sent to " << connectionId << "\n";
            return;
        }
    }

    std::cout << "[!] sendTo failed — id not found: " << connectionId << "\n";
}

template<bool SSL>
size_t LinkManager<SSL>::connectionCount() const {
    std::lock_guard<std::mutex> lock(mutex_);
    return connections_.size();
}

template<bool SSL>
std::string LinkManager<SSL>::generateId() const {
    auto now = std::chrono::high_resolution_clock::now().time_since_epoch().count();
    std::mt19937_64 rng(now);
    std::uniform_int_distribution<uint64_t> dist;

    std::ostringstream oss;
    oss << std::hex << dist(rng);
    return oss.str();
}

// --- Room helpers ---

template<bool SSL>
void LinkManager<SSL>::broadcastToRoom(const std::string& sessionId, const std::string& message, WSSocket* exclude) {
    auto it = rooms_.find(sessionId);
    if (it == rooms_.end()) return;

    for (auto* peer : it->second) {
        if (peer != exclude) {
            peer->send(message, uWS::OpCode::TEXT);
        }
    }
}

template<bool SSL>
void LinkManager<SSL>::broadcastBinaryToRoom(const std::string& sessionId, std::string_view data, WSSocket* exclude) {
    auto it = rooms_.find(sessionId);
    if (it == rooms_.end()) return;

    for (auto* peer : it->second) {
        if (peer != exclude) {
            peer->send(data, uWS::OpCode::BINARY);
        }
    }
}

template<bool SSL>
void LinkManager<SSL>::removeFromRoom(WSSocket* ws) {
    auto* data = static_cast<PerSocketData*>(ws->getUserData());
    if (data->sessionId.empty()) return;

    std::string sessionId = data->sessionId;
    data->sessionId.clear();

    auto it = rooms_.find(sessionId);
    if (it == rooms_.end()) return;

    auto& members = it->second;
    members.erase(std::remove(members.begin(), members.end(), ws), members.end());

    if (members.empty()) {
        rooms_.erase(it);
        std::cout << "[room] Room " << sessionId << " destroyed (empty)\n";
    } else {
        json countMsg = {{"type", "userCount"}, {"count", members.size()}};
        broadcastToRoom(sessionId, countMsg.dump());
        std::cout << "[room] " << sessionId << " | Remaining: " << members.size() << "\n";
    }
}

// Explicit instantiations
template class LinkManager<true>;
template class LinkManager<false>;