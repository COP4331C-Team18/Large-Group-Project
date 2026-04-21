#pragma once

#include <uWebSockets/App.h>
#include <string>
#include <vector>
#include <unordered_map>
#include <atomic>

struct PerSocketData {
    std::string sessionId;  // room this socket belongs to (empty = no room)
    std::string userId;     // opaque user id ("anon_xxxx" for guests)
    std::string username;   // display name shown on remote cursors
    std::string connectionId; // unique internal ID for this connection
};

// --- Connection ---
struct Connection {
    std::string id;
    std::string ip;
};

// --- Per-room state ---
template<bool SSL>
struct RoomState {
    std::vector<uWS::WebSocket<SSL, true, PerSocketData>*> members;  // live peers
    std::vector<std::string> updateBuffer;  
    size_t currentBufferSize = 0;                               // accumulated Yjs binary frames
    bool isUploading = false;                                   // protects against concurrent uploads
};

// --- HTTP config passed from main ---
struct NodeApiConfig {
    std::string url;            // e.g. "http://localhost:5001/api"
    std::string internalSecret; // value of INTERNAL_SECRET in Node .env
};

// --- LinkManager (templated to handle both SSL and non-SSL) ---
template<bool SSL>
class LinkManager {
public:
    using WSSocket = uWS::WebSocket<SSL, true, PerSocketData>;

    explicit LinkManager(NodeApiConfig apiConfig) : apiConfig_(std::move(apiConfig)) {}
    ~LinkManager() = default;

    void onConnect(WSSocket* ws, std::string_view ip);
    void onDisconnect(WSSocket* ws, int code, std::string_view message);
    void onMessage(WSSocket* ws, std::string_view message, uWS::OpCode opCode);
    size_t connectionCount() const;

private:
    std::unordered_map<WSSocket*, Connection> connections_;
    std::unordered_map<std::string, RoomState<SSL>> rooms_;
    NodeApiConfig apiConfig_;
    std::atomic<uint64_t> idCounter_{0};
    static constexpr size_t MAX_BUFFER_SIZE_BYTES = 512 * 1024; // 512 KB

    std::string generateId();

    // Room helpers — called on event loop thread
    void broadcastToRoom(const std::string& sessionId, const std::string& message, WSSocket* exclude = nullptr);
    void broadcastBinaryToRoom(const std::string& sessionId, std::string_view data, WSSocket* exclude = nullptr);
    void removeFromRoom(WSSocket* ws);
    void flushRoomBuffer(const std::string& sessionId);

    // HTTP helpers — run on background threads
    void persistRoomState(const std::string& sessionId, std::vector<std::string> buffer);
    std::string fetchRoomState(const std::string& sessionId, long& httpCodeOut);
    void closeJoinCode(const std::string& sessionId);

    // Yjs update framing: length-prefix each binary update so they can be
    // stored as a single blob and replayed one frame at a time on join.
    static std::string serializeUpdates(const std::vector<std::string>& updates);
    static std::vector<std::string> deserializeUpdates(const std::string& blob);
};
