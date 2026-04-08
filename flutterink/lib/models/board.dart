class BoardRevision {
  /// Raw Yjs update bytes for this revision.
  final List<int> yjsUpdate;

  /// ID of the user who authored this revision.
  final String userId;

  /// When this revision was saved.
  final DateTime savedAt;

  const BoardRevision({
    required this.yjsUpdate,
    required this.userId,
    required this.savedAt,
  });

  factory BoardRevision.fromJson(Map<String, dynamic> json) {
    // yjsUpdate arrives as a list of ints (Buffer serialized to JSON)
    final rawUpdate = json['yjsUpdate'];
    List<int> bytes = [];
    if (rawUpdate is List) {
      bytes = rawUpdate.cast<int>();
    }

    return BoardRevision(
      yjsUpdate: bytes,
      userId: json['userId'] as String,
      savedAt: json['savedAt'] != null
          ? DateTime.parse(json['savedAt'] as String)
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() => {
        'yjsUpdate': yjsUpdate,
        'userId': userId,
        'savedAt': savedAt.toIso8601String(),
      };
}

class Board {
  final String id;
  final String title;
  final String description;
  final String category;
  final String? joinCode;
  final String ownerId;

  /// Raw Yjs state blob (latest snapshot).
  final List<int> yjsUpdate;

  /// Base64 or URL for the dashboard preview image.
  final String? thumbnail;

  final List<String> tags;
  final List<BoardRevision> revisions;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  const Board({
    required this.id,
    required this.title,
    required this.description,
    required this.category,
    this.joinCode,
    required this.ownerId,
    required this.yjsUpdate,
    this.thumbnail,
    required this.tags,
    required this.revisions,
    this.createdAt,
    this.updatedAt,
  });

  factory Board.fromJson(Map<String, dynamic> json) {
    // yjsUpdate arrives as a list of ints (Buffer serialized to JSON)
    final rawUpdate = json['yjsUpdate'];
    List<int> bytes = [];
    if (rawUpdate is List) {
      bytes = rawUpdate.cast<int>();
    }

    return Board(
      id: (json['boardId'] ?? json['_id'] ?? json['id']) as String,
      title: json['title'] as String,
      description: json['description'] as String? ?? '',
      category: json['category'] as String? ?? 'General',
      joinCode: json['joinCode'] as String?,
      ownerId: json['owner'] as String,
      yjsUpdate: bytes,
      thumbnail: json['thumbnail'] as String?,
      tags: (json['tags'] as List<dynamic>?)?.cast<String>() ?? [],
      revisions: (json['revisions'] as List<dynamic>?)
              ?.map((r) => BoardRevision.fromJson(r as Map<String, dynamic>))
              .toList() ??
          [],
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'] as String)
          : null,
      updatedAt: json['updatedAt'] != null
          ? DateTime.tryParse(json['updatedAt'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'description': description,
        'category': category,
        if (joinCode != null) 'joinCode': joinCode,
        'owner': ownerId,
        'yjsUpdate': yjsUpdate,
        if (thumbnail != null) 'thumbnail': thumbnail,
        'tags': tags,
        'revisions': revisions.map((r) => r.toJson()).toList(),
        if (createdAt != null) 'createdAt': createdAt!.toIso8601String(),
        if (updatedAt != null) 'updatedAt': updatedAt!.toIso8601String(),
      };
}
