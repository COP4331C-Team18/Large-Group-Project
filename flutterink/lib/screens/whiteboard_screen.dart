import 'dart:math';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/auth_state.dart';
import '../services/collab_service.dart';
import '../theme/app_colors.dart';

class WhiteboardScreen extends StatefulWidget {
  final String sessionId;
  const WhiteboardScreen({super.key, required this.sessionId});

  @override
  State<WhiteboardScreen> createState() => _WhiteboardScreenState();
}

class _WhiteboardScreenState extends State<WhiteboardScreen> {
  late final CollabService _collab;

  // Local strokes: list of point lists
  final List<List<Offset>> _strokes = [];
  List<Offset>? _activeStroke;

  // Viewport: offset (pan) + scale (zoom)
  Offset _vpOffset = Offset.zero;
  double _vpScale = 1.0;
  Offset? _panStart;
  Offset? _panStartVp;

  @override
  void initState() {
    super.initState();
    _collab = CollabService();

    final authState = context.read<AuthState>();
    final userId   = authState.user?.id       ?? 'anon_${_randomHex(6)}';
    final username = authState.user?.username ?? 'Guest';

    // Connect after first frame so context is fully built
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _collab.connect(widget.sessionId, userId, username);
    });
  }

  @override
  void dispose() {
    _collab.dispose();
    super.dispose();
  }

  String _randomHex(int length) {
    final rand = Random();
    return List.generate(length, (_) => rand.nextInt(16).toRadixString(16)).join();
  }

  // ── Coordinate helpers ──────────────────────────────────────────────────────

  /// Screen → world
  Offset _toWorld(Offset screen) {
    return (screen - _vpOffset) / _vpScale;
  }

  /// World → screen
  Offset _toScreen(Offset world) {
    return world * _vpScale + _vpOffset;
  }

  // ── Gesture handlers ────────────────────────────────────────────────────────

  void _onPanStart(DragStartDetails d) {
    _panStart = d.localPosition;
    _panStartVp = _vpOffset;
  }

  void _onPanUpdate(DragUpdateDetails d) {
    // Send cursor in world coords (throttled inside CollabService)
    _collab.sendCursor(
      _toWorld(d.localPosition).dx,
      _toWorld(d.localPosition).dy,
    );
  }

  void _onScaleStart(ScaleStartDetails d) {
    _panStart = d.localFocalPoint;
    _panStartVp = _vpOffset;
  }

  void _onScaleUpdate(ScaleUpdateDetails d) {
    setState(() {
      // Pan
      _vpOffset = _panStartVp! + (d.localFocalPoint - _panStart!);
      // Pinch zoom
      _vpScale = (_vpScale * d.scale).clamp(0.1, 10.0);
    });
    _collab.sendCursor(
      _toWorld(d.localFocalPoint).dx,
      _toWorld(d.localFocalPoint).dy,
    );
  }

  void _onDrawStart(DragStartDetails d) {
    final world = _toWorld(d.localPosition);
    setState(() {
      _activeStroke = [world];
      _strokes.add(_activeStroke!);
    });
  }

  void _onDrawUpdate(DragUpdateDetails d) {
    final world = _toWorld(d.localPosition);
    setState(() => _activeStroke?.add(world));
    _collab.sendCursor(world.dx, world.dy);
  }

  void _onDrawEnd(DragEndDetails _) {
    setState(() => _activeStroke = null);
  }

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider.value(
      value: _collab,
      child: Scaffold(
        backgroundColor: const Color(0xFFF8F6F0),
        appBar: AppBar(
          backgroundColor: Colors.transparent,
          elevation: 0,
          leading: BackButton(
            color: AppColors.accent,
            onPressed: () {
              _collab.disconnect();
              Navigator.of(context).pop();
            },
          ),
          title: Text(
            widget.sessionId,
            style: const TextStyle(
              fontSize: 14,
              letterSpacing: 4,
              color: AppColors.textMuted,
              fontWeight: FontWeight.w600,
            ),
          ),
          actions: [
            Consumer<CollabService>(
              builder: (_, collab, __) => Padding(
                padding: const EdgeInsets.only(right: 16),
                child: Icon(
                  Icons.circle,
                  size: 10,
                  color: collab.isConnected ? Colors.green : Colors.red,
                ),
              ),
            ),
          ],
        ),
        body: Consumer<CollabService>(
          builder: (_, collab, __) {
            if (collab.errorMessage != null) {
              return Center(
                child: Text(
                  collab.errorMessage!,
                  style: const TextStyle(color: AppColors.textMuted),
                ),
              );
            }
            return GestureDetector(
              onScaleStart: _onScaleStart,
              onScaleUpdate: _onScaleUpdate,
              child: CustomPaint(
                painter: _WhiteboardPainter(
                  strokes: _strokes,
                  vpOffset: _vpOffset,
                  vpScale: _vpScale,
                ),
                foregroundPainter: _CursorPainter(
                  cursors: collab.remoteCursors,
                  vpOffset: _vpOffset,
                  vpScale: _vpScale,
                ),
                child: const SizedBox.expand(),
              ),
            );
          },
        ),
      ),
    );
  }
}

// ── Deterministic cursor color ─────────────────────────────────────────────────

Color _cursorColor(String userId) {
  int hash = 0;
  for (final c in userId.codeUnits) {
    hash = (hash << 5) - hash + c;
    hash &= 0x7fffffff;
  }
  final hue = (hash % 360).toDouble();
  return HSLColor.fromAHSL(1.0, hue, 0.65, 0.45).toColor();
}

// ── Stroke painter ─────────────────────────────────────────────────────────────

class _WhiteboardPainter extends CustomPainter {
  final List<List<Offset>> strokes;
  final Offset vpOffset;
  final double vpScale;

  const _WhiteboardPainter({
    required this.strokes,
    required this.vpOffset,
    required this.vpScale,
  });

  Offset _toScreen(Offset world) => world * vpScale + vpOffset;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = const Color(0xFF111410)
      ..strokeWidth = 3.0 / vpScale
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round
      ..style = PaintingStyle.stroke;

    for (final stroke in strokes) {
      if (stroke.length < 2) continue;
      final path = Path()..moveTo(
        _toScreen(stroke[0]).dx,
        _toScreen(stroke[0]).dy,
      );
      for (int i = 1; i < stroke.length; i++) {
        path.lineTo(_toScreen(stroke[i]).dx, _toScreen(stroke[i]).dy);
      }
      canvas.drawPath(path, paint);
    }
  }

  @override
  bool shouldRepaint(_WhiteboardPainter old) =>
      old.strokes != strokes ||
      old.vpOffset != vpOffset ||
      old.vpScale != vpScale;
}

// ── Cursor painter ─────────────────────────────────────────────────────────────

class _CursorPainter extends CustomPainter {
  final Map<String, RemoteCursor> cursors;
  final Offset vpOffset;
  final double vpScale;

  const _CursorPainter({
    required this.cursors,
    required this.vpOffset,
    required this.vpScale,
  });

  Offset _toScreen(double wx, double wy) =>
      Offset(wx, wy) * vpScale + vpOffset;

  @override
  void paint(Canvas canvas, Size size) {
    final cutoff = DateTime.now().subtract(const Duration(seconds: 3));

    for (final cursor in cursors.values) {
      if (cursor.lastSeen.isBefore(cutoff)) continue;

      final s = _toScreen(cursor.x, cursor.y);
      final col = _cursorColor(cursor.userId);

      // Arrow pointer
      final arrowPaint = Paint()..color = col;
      final borderPaint = Paint()
        ..color = Colors.white.withOpacity(0.85)
        ..strokeWidth = 1.5
        ..style = PaintingStyle.stroke;

      final arrow = Path()
        ..moveTo(s.dx,       s.dy)
        ..lineTo(s.dx + 10,  s.dy + 14)
        ..lineTo(s.dx + 4,   s.dy + 12)
        ..lineTo(s.dx + 2,   s.dy + 20)
        ..lineTo(s.dx - 1,   s.dy + 19)
        ..lineTo(s.dx + 1,   s.dy + 11)
        ..lineTo(s.dx - 4,   s.dy + 11)
        ..close();

      canvas.drawPath(arrow, arrowPaint);
      canvas.drawPath(arrow, borderPaint);

      // Name label
      const textStyle = TextStyle(
        color: Colors.white,
        fontSize: 11,
        fontWeight: FontWeight.w700,
        fontFamily: 'Raleway',
      );
      final tp = TextPainter(
        text: TextSpan(text: cursor.username, style: textStyle),
        textDirection: TextDirection.ltr,
      )..layout();

      const pad = 5.0;
      final lx = s.dx + 13;
      final ly = s.dy + 2;
      final pillRect = RRect.fromRectAndRadius(
        Rect.fromLTWH(lx - pad, ly, tp.width + pad * 2, tp.height + 2),
        const Radius.circular(4),
      );
      canvas.drawRRect(pillRect, Paint()..color = col);
      tp.paint(canvas, Offset(lx, ly + 1));
    }
  }

  @override
  bool shouldRepaint(_CursorPainter old) =>
      old.cursors != cursors ||
      old.vpOffset != vpOffset ||
      old.vpScale != vpScale;
}
