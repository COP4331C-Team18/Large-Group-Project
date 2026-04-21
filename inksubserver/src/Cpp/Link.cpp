#include "Link.h"
#include <iostream>
#include <sstream>
#include <algorithm>
#include <thread>
#include <cstring>
#include <nlohmann/json.hpp>
#include <curl/curl.h>

#ifdef _WIN32
#  include <winsock2.h>
#else
#  include <arpa/inet.h>
#endif

using json = nlohmann::json;

// ── libcurl write callback ────────────────────────────────────────────────────
static size_t curlWriteCallback(char* ptr, size_t size, size_t nmemb, std::string* out) {
    out->append(ptr, size * nmemb);
    return size * nmemb;
}

// ── Yjs update framing helpers ────────────────────────────────────────────────
// Each update is prefixed with a 4-byte big-endian length so the blob can be
// stored as a single Buffer in MongoDB and replayed frame-by-frame on join.

template<bool SSL>
std::string LinkManager<SSL>::serializeUpdates(const std::vector<std::string>& updates) {
    std::string result;
    result.reserve(updates.size() * 64); // rough pre-alloc
    for (const auto& u : updates) {
        uint32_t len = htonl(static_cast<uint32_t>(u.size()));
        result.append(reinterpret_cast<const char*>(&len), 4);
        result.append(u);
    }
    return result;
}

template<bool SSL>
std::vector<std::string> LinkManager<SSL>::deserializeUpdates(const std::string& blob) {
    std::vector<std::string> updates;
    size_t pos = 0;
    while (pos + 4 <= blob.size()) {
        uint32_t len;
        std::memcpy(&len, blob.data() + pos, 4);
        len = ntohl(len);
        pos += 4;
        if (pos + len > blob.size()) break;
        updates.emplace_back(blob.data() + pos, len);
        pos += len;
    }
    return updates;
}

// ── HTTP helpers (blocking — always called from background threads) ───────────

template<bool SSL>
void LinkManager<SSL>::persistRoomState(const std::string& sessionId,
                                         std::vector<std::string> buffer) {
    if (buffer.empty() || apiConfig_.url.empty()) return;

    std::string blob = serializeUpdates(buffer);

    CURL* curl = curl_easy_init();
    if (!curl) {
        std::cerr << "[http] curl_easy_init failed\n";
        return;
    }

    std::string url = apiConfig_.url + "/boards/yjs/" + sessionId;
    std::string response;

    struct curl_slist* headers = nullptr;
    headers = curl_slist_append(headers, "Content-Type: application/octet-stream");
    // Add Connection: keep-alive to encourage pooling where supported
    headers = curl_slist_append(headers, "Connection: keep-alive");
    std::string secretHeader = "x-internal-secret: " + apiConfig_.internalSecret;
    headers = curl_slist_append(headers, secretHeader.c_str());

    curl_easy_setopt(curl, CURLOPT_URL, url.c_str());
    curl_easy_setopt(curl, CURLOPT_POST, 1L);
    curl_easy_setopt(curl, CURLOPT_POSTFIELDS, blob.data());
    curl_easy_setopt(curl, CURLOPT_POSTFIELDSIZE, (long)blob.size());
    curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);
    curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, curlWriteCallback);
    curl_easy_setopt(curl, CURLOPT_WRITEDATA, &response);
    curl_easy_setopt(curl, CURLOPT_TIMEOUT, 10L);

    CURLcode res = curl_easy_perform(curl);
    long httpCode = 0;
    curl_easy_getinfo(curl, CURLINFO_RESPONSE_CODE, &httpCode);

    if (res != CURLE_OK) {
        std::cerr << "[http] persist failed: " << curl_easy_strerror(res) << "\n";
    } else {
        std::cout << "[http] persist " << sessionId << " → HTTP " << httpCode << "\n";
    }

    curl_slist_free_all(headers);
    curl_easy_cleanup(curl);
}

template<bool SSL>
std::string LinkManager<SSL>::fetchRoomState(const std::string& sessionId, long& httpCodeOut) {
    httpCodeOut = 0;
    if (apiConfig_.url.empty()) return {};

    CURL* curl = curl_easy_init();
    if (!curl) {
        std::cerr << "[http] curl_easy_init failed\n";
        return {};
    }

    std::string url = apiConfig_.url + "/boards/yjs/" + sessionId;
    std::string response;

    struct curl_slist* headers = nullptr;
    std::string secretHeader = "x-internal-secret: " + apiConfig_.internalSecret;
    headers = curl_slist_append(headers, secretHeader.c_str());

    curl_easy_setopt(curl, CURLOPT_URL, url.c_str());
    curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);
    curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, curlWriteCallback);
    curl_easy_setopt(curl, CURLOPT_WRITEDATA, &response);
    curl_easy_setopt(curl, CURLOPT_TIMEOUT, 10L);

    CURLcode res = curl_easy_perform(curl);
    curl_easy_getinfo(curl, CURLINFO_RESPONSE_CODE, &httpCodeOut);

    curl_slist_free_all(headers);
    curl_easy_cleanup(curl);

    if (res != CURLE_OK) {
        std::cerr << "[http] fetch failed: " << curl_easy_strerror(res) << "\n";
        return {};
    }
    if (httpCodeOut == 204) return {};
    if (httpCodeOut == 404) return {};

    if (httpCodeOut != 200) {
        std::cerr << "[http] fetch HTTP " << httpCodeOut << " for " << sessionId << "\n";
        return {};
    }

    std::cout << "[http] fetched " << response.size() << " bytes for " << sessionId << "\n";
    return response;
}

template<bool SSL>
void LinkManager<SSL>::closeJoinCode(const std::string& sessionId) {
    if (apiConfig_.url.empty()) return;

    CURL* curl = curl_easy_init();
    if (!curl) return;

    std::string url = apiConfig_.url + "/boards/yjs/" + sessionId + "/close";
    std::string response;

    struct curl_slist* headers = nullptr;
    std::string secretHeader = "x-internal-secret: " + apiConfig_.internalSecret;
    headers = curl_slist_append(headers, secretHeader.c_str());

    curl_easy_setopt(curl, CURLOPT_URL, url.c_str());
    curl_easy_setopt(curl, CURLOPT_POST, 1L);
    curl_easy_setopt(curl, CURLOPT_POSTFIELDS, "");
    curl_easy_setopt(curl, CURLOPT_POSTFIELDSIZE, 0L);
    curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);
    curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, curlWriteCallback);
    curl_easy_setopt(curl, CURLOPT_WRITEDATA, &response);
    curl_easy_setopt(curl, CURLOPT_TIMEOUT, 10L);

    CURLcode res = curl_easy_perform(curl);
    long httpCode = 0;
    curl_easy_getinfo(curl, CURLINFO_RESPONSE_CODE, &httpCode);

    if (res != CURLE_OK) {
        std::cerr << "[http] closeJoinCode failed: " << curl_easy_strerror(res) << "\n";
    } else {
        std::cout << "[http] closeJoinCode " << sessionId << " → HTTP " << httpCode << "\n";
    }

    curl_slist_free_all(headers);
    curl_easy_cleanup(curl);
}

// ── generateId ────────────────────────────────────────────────────────────────

template<bool SSL>
std::string LinkManager<SSL>::generateId() {
    uint64_t val = idCounter_.fetch_add(1, std::memory_order_relaxed);
    std::ostringstream oss;
    oss << std::hex << val;
    return oss.str();
}

// ── onConnect ─────────────────────────────────────────────────────────────────

template<bool SSL>
void LinkManager<SSL>::onConnect(WSSocket* ws, std::string_view ip) {
    Connection conn;
    conn.id = generateId();
    conn.ip = std::string(ip);

    auto* data = static_cast<PerSocketData*>(ws->getUserData());
    data->connectionId = conn.id;

    connections_[ws] = conn;

    std::cout << "[+] Connected: " << conn.id
              << " from " << conn.ip
              << " | Total: " << connections_.size()
              << "\n";
}

// ── onDisconnect ──────────────────────────────────────────────────────────────

template<bool SSL>
void LinkManager<SSL>::onDisconnect(WSSocket* ws, int code, std::string_view /*message*/) {
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

// ── flushRoomBuffer ───────────────────────────────────────────────────────────

template<bool SSL>
void LinkManager<SSL>::flushRoomBuffer(const std::string& sessionId) {
    auto it = rooms_.find(sessionId);
    if (it == rooms_.end()) return;

    auto& room = it->second;
    
    // If we're already uploading, do nothing. We'll be called again when it finishes.
    if (room.isUploading) return;
    
    // If we have data to push
    if (!room.updateBuffer.empty()) {
        std::vector<std::string> bufferToPersist = std::move(room.updateBuffer);
        room.updateBuffer.clear();
        room.currentBufferSize = 0;
        room.isUploading = true;

        std::string sid = sessionId;
        auto* loop = uWS::Loop::get();
        
        std::thread([this, sid, buf = std::move(bufferToPersist), loop]() mutable {
            persistRoomState(sid, std::move(buf));
            
            // Schedule the callback on the main thread to clear the uploading flag
            // and trigger another flush if more data accumulated during the upload.
            loop->defer([this, sid]() {
                auto it2 = rooms_.find(sid);
                if (it2 != rooms_.end()) {
                    it2->second.isUploading = false;
                    if (!it2->second.updateBuffer.empty()) {
                        flushRoomBuffer(sid);
                    }
                }
            });
        }).detach();

        std::cout << "[room] Flush triggered for " << sid << ". Flushed to API.\n";
    }
}

// ── onMessage ─────────────────────────────────────────────────────────────────

template<bool SSL>
void LinkManager<SSL>::onMessage(WSSocket* ws, std::string_view message, uWS::OpCode opCode) {
    if (connections_.find(ws) == connections_.end()) return;

    // --- Binary: Yjs update relay + buffer ---
    if (opCode == uWS::OpCode::BINARY) {
        auto* data = static_cast<PerSocketData*>(ws->getUserData());
        if (!data->sessionId.empty()) {
            auto it = rooms_.find(data->sessionId);
            if (it != rooms_.end()) {
            
                // 1. Add the update and update the tracker
                it->second.updateBuffer.emplace_back(message.data(), message.size());
                it->second.currentBufferSize += message.size();

                // 2. Check the "High-Water Mark" (512 KB)
                if (it->second.currentBufferSize >= MAX_BUFFER_SIZE_BYTES) {
                    flushRoomBuffer(data->sessionId);
                }

                // 3. Relay to others
                broadcastBinaryToRoom(data->sessionId, message, ws);
            }
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

        removeFromRoom(ws);

        auto* data = static_cast<PerSocketData*>(ws->getUserData());
        data->sessionId = sessionId;
        data->userId    = msg.value("userId",   "anon_" + sessionId.substr(0, 4));
        data->username  = msg.value("username", "Guest");

        auto& room = rooms_[sessionId];
        bool isFirstMember = room.members.empty();
        room.members.push_back(ws);

        auto& connId = connections_[ws].id;
        std::cout << "[room] " << connId << " joined " << sessionId
                  << " | Room size: " << room.members.size() << "\n";

        // Send joined ack
        json ack = {{"type", "joined"}, {"sessionId", sessionId}, {"ok", true}};
        ws->send(ack.dump(), uWS::OpCode::TEXT);

        // Broadcast updated user count to entire room
        json countMsg = {{"type", "userCount"}, {"count", room.members.size()}};
        broadcastToRoom(sessionId, countMsg.dump());

        // If this user is the first in the room, fetch persisted state from Node API
        // and send it to them via a background thread (avoids blocking the event loop).
        if (isFirstMember && !apiConfig_.url.empty()) {
            auto* loop = uWS::Loop::get();
            std::thread([this, sessionId, ws, connId, loop]() {
                long httpCode = 0;
                std::string blob = fetchRoomState(sessionId, httpCode);

                // 404 = no board with this joinCode in MongoDB — reject the room
                if (httpCode == 404) {
                    std::cerr << "[room] rejected unknown room: " << sessionId << "\n";
                    loop->defer([this, sessionId, ws, connId]() {
                        // Check if socket is still active AND belongs to the original connection
                        auto it = connections_.find(ws);
                        if (it != connections_.end() && it->second.id == connId) {
                            ws->send(R"({"type":"error","message":"invalid room code"})",
                                     uWS::OpCode::TEXT);
                            ws->close();
                        }
                        
                        // Carefully erase room if it's still empty
                        auto roomIt = rooms_.find(sessionId);
                        if (roomIt != rooms_.end() && roomIt->second.members.empty()) {
                            rooms_.erase(sessionId);
                        }
                    });
                    return;
                }

                // 204 = valid room but no Yjs data yet — nothing to hydrate
                if (blob.empty()) return;

                std::vector<std::string> updates = deserializeUpdates(blob);
                if (updates.empty()) return;

                // Deliver each stored update to the joining client on the event loop thread
                loop->defer([this, sessionId, ws, connId, updates = std::move(updates)]() {
                    // Check if socket is still active AND belongs to the original connection
                    auto it = connections_.find(ws);
                    if (it == connections_.end() || it->second.id != connId) return;

                    auto roomIt = rooms_.find(sessionId);
                    if (roomIt == rooms_.end()) return;
                    
                    auto& members = roomIt->second.members;
                    if (std::find(members.begin(), members.end(), ws) == members.end()) return;

                    for (const auto& u : updates) {
                        ws->send(std::string_view(u.data(), u.size()), uWS::OpCode::BINARY);
                    }
                    std::cout << "[room] hydrated " << sessionId
                              << " with " << updates.size() << " stored updates\n";
                });
            }).detach();
        }

        return;
    }

    if (type == "cursor") {
        auto* data = static_cast<PerSocketData*>(ws->getUserData());
        if (data->sessionId.empty()) return;

        // Inject server-stored identity so peers can't spoof each other's names
        json broadcast = {
            {"type",     "cursor"},
            {"userId",   data->userId},
            {"username", data->username},
            {"x",        msg.value("x", 0.0)},
            {"y",        msg.value("y", 0.0)},
        };
        broadcastToRoom(data->sessionId, broadcast.dump(), ws);
        return;
    }

    std::cout << "[>] Unhandled message from " << connections_[ws].id
              << ": " << message << "\n";
}

// ── broadcastToRoom ───────────────────────────────────────────────────────────

template<bool SSL>
void LinkManager<SSL>::broadcastToRoom(const std::string& sessionId,
                                        const std::string& message,
                                        WSSocket* exclude) {
    auto it = rooms_.find(sessionId);
    if (it == rooms_.end()) return;
    for (auto* peer : it->second.members) {
        if (peer != exclude) peer->send(message, uWS::OpCode::TEXT);
    }
}

template<bool SSL>
void LinkManager<SSL>::broadcastBinaryToRoom(const std::string& sessionId,
                                              std::string_view data,
                                              WSSocket* exclude) {
    auto it = rooms_.find(sessionId);
    if (it == rooms_.end()) return;
    for (auto* peer : it->second.members) {
        if (peer != exclude) peer->send(data, uWS::OpCode::BINARY);
    }
}

// ── removeFromRoom ────────────────────────────────────────────────────────────

template<bool SSL>
void LinkManager<SSL>::removeFromRoom(WSSocket* ws) {
    auto* data = static_cast<PerSocketData*>(ws->getUserData());
    if (data->sessionId.empty()) return;

    std::string sessionId = data->sessionId;
    data->sessionId.clear();

    auto it = rooms_.find(sessionId);
    if (it == rooms_.end()) return;

    auto& members = it->second.members;
    members.erase(std::remove(members.begin(), members.end(), ws), members.end());

    if (members.empty()) {
        // Last user left — trigger a final flush of whatever is left.
        flushRoomBuffer(sessionId);
        
        std::cout << "[room] Room " << sessionId << " empty. Starting 5-minute timer.\n";
        
        std::string sid = sessionId;
        auto* loop = uWS::Loop::get();
        
        std::thread([this, sid, loop]() {
            std::this_thread::sleep_for(std::chrono::minutes(5));
            
            loop->defer([this, sid]() {
                auto it2 = rooms_.find(sid);
                if (it2 != rooms_.end() && it2->second.members.empty()) {
                    // Still empty after 5 minutes.
                    std::cout << "[room] Room " << sid << " idle for 5 minutes. Destroying.\n";
                    
                    // Final safety flush in case something was stuck without triggering isUploading
                    if (!it2->second.updateBuffer.empty() && !it2->second.isUploading) {
                        std::vector<std::string> buffer = std::move(it2->second.updateBuffer);
                        std::thread([this, sid, buffer = std::move(buffer)]() mutable {
                            persistRoomState(sid, std::move(buffer));
                            closeJoinCode(sid);
                        }).detach();
                    } else if (it2->second.isUploading) {
                        // If it's currently uploading the last bit, we must wait for it to finish
                        // before closing. The easiest way is to let the upload finish in the background, 
                        // and just send the close request with a slight delay.
                        std::thread([this, sid]() {
                            std::this_thread::sleep_for(std::chrono::seconds(2));
                            closeJoinCode(sid);
                        }).detach();
                    } else {
                        std::thread([this, sid]() {
                            closeJoinCode(sid);
                        }).detach();
                    }

                    rooms_.erase(sid);
                } else if (it2 != rooms_.end()) {
                    std::cout << "[room] Timer finished, but room " << sid << " is active again. Not closing.\n";
                }
            });
        }).detach();
    } else {
        json countMsg = {{"type", "userCount"}, {"count", members.size()}};
        broadcastToRoom(sessionId, countMsg.dump());
        std::cout << "[room] " << sessionId << " | Remaining: " << members.size() << "\n";
    }
}

// ── connectionCount ───────────────────────────────────────────────────────────

template<bool SSL>
size_t LinkManager<SSL>::connectionCount() const {
    return connections_.size();
}

// ── Explicit instantiations ───────────────────────────────────────────────────
template class LinkManager<true>;
template class LinkManager<false>;