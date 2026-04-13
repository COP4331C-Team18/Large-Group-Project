class Board {
  final String id;
  final String name;
  final String? description;
  final List<String> tags;

  const Board({
    required this.id,
    required this.name,
    this.description,
    this.tags = const [],
  });

  Board copyWith({
    String? id,
    String? name,
    String? description,
    List<String>? tags,
  }) {
    return Board(
      id: id ?? this.id,
      name: name ?? this.name,
      description: description ?? this.description,
      tags: tags ?? this.tags,
    );
  }
}
