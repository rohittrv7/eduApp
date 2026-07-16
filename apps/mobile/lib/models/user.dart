class UserProfile {
  final String id;
  final String fullName;
  final String? email;
  final String? mobile;
  final String role;
  final String? photo;
  final String? skillLevel;
  final int streakCount;

  UserProfile({
    required this.id,
    required this.fullName,
    this.email,
    this.mobile,
    required this.role,
    this.photo,
    this.skillLevel,
    required this.streakCount,
  });

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    return UserProfile(
      id: json['id'] ?? '',
      fullName: json['full_name'] ?? json['fullName'] ?? '',
      email: json['email'],
      mobile: json['mobile'],
      role: json['role'] ?? 'student',
      photo: json['profile_photo'] ?? json['photo'],
      skillLevel: json['skill_level'] ?? json['skillLevel'],
      streakCount: json['streak_count'] ?? json['streakCount'] ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'full_name': fullName,
      'email': email,
      'mobile': mobile,
      'role': role,
      'profile_photo': photo,
      'skill_level': skillLevel,
      'streak_count': streakCount,
    };
  }
}
