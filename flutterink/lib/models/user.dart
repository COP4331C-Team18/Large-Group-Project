enum AuthProvider { inkboard, google }

class User {
  final String id;
  final String username;
  final String email;
  final bool verified;
  final AuthProvider provider;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  const User({
    required this.id,
    required this.username,
    required this.email,
    required this.verified,
    required this.provider,
    this.createdAt,
    this.updatedAt,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: (json['_id'] ?? json['id']) as String,
      username: json['username'] as String,
      email: json['email'] as String,
      verified: json['verified'] as bool? ?? false,
      provider: json['provider'] == 'google'
          ? AuthProvider.google
          : AuthProvider.inkboard,
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
        'username': username,
        'email': email,
        'verified': verified,
        'provider': provider.name,
        if (createdAt != null) 'createdAt': createdAt!.toIso8601String(),
        if (updatedAt != null) 'updatedAt': updatedAt!.toIso8601String(),
      };
}
