class DoubtAuthor {
  final String id;
  final String fullName;
  final String? profilePhoto;
  final String role;

  DoubtAuthor({
    required this.id,
    required this.fullName,
    this.profilePhoto,
    required this.role,
  });

  factory DoubtAuthor.fromJson(Map<String, dynamic> json) {
    return DoubtAuthor(
      id: json['id'] ?? '',
      fullName: json['fullName'] ?? json['full_name'] ?? '',
      profilePhoto: json['profilePhoto'] ?? json['profile_photo'] ?? json['photo'],
      role: json['role'] ?? 'student',
    );
  }
}

class DoubtReply {
  final String id;
  final String text;
  final String? imageUrl;
  final DoubtAuthor author;
  final String createdAt;

  DoubtReply({
    required this.id,
    required this.text,
    this.imageUrl,
    required this.author,
    required this.createdAt,
  });

  factory DoubtReply.fromJson(Map<String, dynamic> json) {
    return DoubtReply(
      id: json['id'] ?? '',
      text: json['text'] ?? '',
      imageUrl: json['imageUrl'] ?? json['image_url'],
      author: DoubtAuthor.fromJson(json['author'] ?? {}),
      createdAt: json['createdAt'] ?? json['created_at'] ?? '',
    );
  }
}

class Doubt {
  final String id;
  final String text;
  final String? imageUrl;
  final String status; // 'open' | 'resolved'
  final int upvotes;
  final String? videoId;
  final String? chapterId;
  final DoubtAuthor student;
  final List<DoubtReply> replies;
  final String createdAt;
  final String updatedAt;

  Doubt({
    required this.id,
    required this.text,
    this.imageUrl,
    required this.status,
    required this.upvotes,
    this.videoId,
    this.chapterId,
    required this.student,
    required this.replies,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Doubt.fromJson(Map<String, dynamic> json) {
    var reps = json['replies'] as List? ?? [];
    return Doubt(
      id: json['id'] ?? '',
      text: json['text'] ?? '',
      imageUrl: json['imageUrl'] ?? json['image_url'],
      status: json['status'] ?? 'open',
      upvotes: json['upvotes'] ?? 0,
      videoId: json['videoId'],
      chapterId: json['chapterId'],
      student: DoubtAuthor.fromJson(json['student'] ?? {}),
      replies: reps.map((r) => DoubtReply.fromJson(r)).toList(),
      createdAt: json['createdAt'] ?? json['created_at'] ?? '',
      updatedAt: json['updatedAt'] ?? json['updated_at'] ?? '',
    );
  }
}
