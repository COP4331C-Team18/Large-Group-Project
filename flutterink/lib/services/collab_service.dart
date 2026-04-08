import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:web_socket_channel/web_socket_channel.dart';

class RemoteCursor {
  final String userId;
  final String username;
  final double x; // world coordinates
  final double y;
  final DateTime lastSeen;

  const RemoteCursor({
    required this.userId,
    required this.username,
    required this.x,
    required this.y,
    required this.lastSeen,
  });

  RemoteCursor copyWith({double? x, double? y, DateTime? lastSeen}) {
    return RemoteCursor(
      userId: userId,
      username: username,
      x: x ?? this.x,
      y: y ?? this.y,
      lastSeen: lastSeen ?? this.lastSeen,
    );
  }
}

class CollabService extends ChangeNotifier {
  static const String _wsUrl = String.fromEnvironment(
    'WS_URL',
    defaultValue: 'ws://localhost:9001',
  );

  WebSocketChannel? _channel;
  StreamSubscription? _sub;

  bool isConnected = false;
  String? errorMessage;

  // userId → cursor data
  final Map<String, RemoteCursor> remoteCursors = {};

  // Throttle: only send cursor every ~33ms (30fps)
  DateTime _lastCursorSend = DateTime.fromMillisecondsSinceEpoch(0);

  void connect(String sessionId, String userId, String username) {
    if (isConnected) return;

    errorMessage = null;
    _channel = WebSocketChannel.connect(Uri.parse(_wsUrl));

    // Send join message once the channel is ready
    _channel!.sink.add(jsonEncode({
      'type': 'join',
      'sessionId': sessionId,
      'userId': userId,
      'username': username,
    }));

    _sub = _channel!.stream.listen(
      (raw) {
        if (raw is String) _handleMessage(raw);
      },
      onError: (err) {
        errorMessage = 'Connection error';
        isConnected = false;
        notifyListeners();
      },
      onDone: () {
        isConnected = false;
        remoteCursors.clear();
        notifyListeners();
      },
    );

    isConnected = true;
    notifyListeners();
  }

  void _handleMessage(String raw) {
    final msg = jsonDecode(raw) as Map<String, dynamic>;
    final type = msg['type'] as String?;

    if (type == 'joined' && msg['ok'] == true) {
      isConnected = true;
      notifyListeners();
    } else if (type == 'cursor') {
      final uid = msg['userId'] as String;
      remoteCursors[uid] = RemoteCursor(
        userId: uid,
        username: msg['username'] as String? ?? 'Guest',
        x: (msg['x'] as num).toDouble(),
        y: (msg['y'] as num).toDouble(),
        lastSeen: DateTime.now(),
      );
      // Purge cursors older than 3s while we're here
      final cutoff = DateTime.now().subtract(const Duration(seconds: 3));
      remoteCursors.removeWhere((_, c) => c.lastSeen.isBefore(cutoff));
      notifyListeners();
    } else if (type == 'error') {
      errorMessage = msg['message'] as String? ?? 'Unknown error';
      notifyListeners();
    }
  }

  /// Send cursor position in world coordinates (throttled to 30fps).
  void sendCursor(double worldX, double worldY) {
    if (!isConnected || _channel == null) return;
    final now = DateTime.now();
    if (now.difference(_lastCursorSend).inMilliseconds < 33) return;
    _lastCursorSend = now;
    _channel!.sink.add(jsonEncode({
      'type': 'cursor',
      'x': worldX,
      'y': worldY,
    }));
  }

  void disconnect() {
    _sub?.cancel();
    _channel?.sink.close();
    _channel = null;
    isConnected = false;
    remoteCursors.clear();
    notifyListeners();
  }

  @override
  void dispose() {
    disconnect();
    super.dispose();
  }
}
