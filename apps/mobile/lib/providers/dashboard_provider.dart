import 'package:flutter/material.dart';
import 'package:alledu_mobile/core/api/api_client.dart';

class WatchSessionItem {
  final String videoId;
  final String title;
  final String? thumbnail;
  final int progressPercent;

  WatchSessionItem({
    required this.videoId,
    required this.title,
    this.thumbnail,
    required this.progressPercent,
  });

  factory WatchSessionItem.fromJson(Map<String, dynamic> json) {
    return WatchSessionItem(
      videoId: json['videoId'] ?? json['id'] ?? '',
      title: json['title'] ?? 'Video Lecture',
      thumbnail: json['thumbnail'] ?? json['thumbnail_url'],
      progressPercent: (json['progressPercent'] ?? json['progress_percent'] ?? 0) as int,
    );
  }
}

class RecentQuizItem {
  final String id;
  final String quizTitle;
  final DateTime attemptedAt;
  final int score;
  final int totalMarks;

  RecentQuizItem({
    required this.id,
    required this.quizTitle,
    required this.attemptedAt,
    required this.score,
    required this.totalMarks,
  });

  factory RecentQuizItem.fromJson(Map<String, dynamic> json) {
    return RecentQuizItem(
      id: json['id'] ?? '',
      quizTitle: json['quizTitle'] ?? json['title'] ?? 'Quiz',
      attemptedAt: DateTime.tryParse(json['attemptedAt'] ?? json['created_at'] ?? '') ?? DateTime.now(),
      score: (json['score'] ?? 0) as int,
      totalMarks: (json['totalMarks'] ?? json['total_marks'] ?? 100) as int,
    );
  }
}

class LeaderboardEntry {
  final String userId;
  final String fullName;
  final int rank;
  final int score;

  LeaderboardEntry({
    required this.userId,
    required this.fullName,
    required this.rank,
    required this.score,
  });

  factory LeaderboardEntry.fromJson(Map<String, dynamic> json) {
    return LeaderboardEntry(
      userId: json['userId'] ?? json['id'] ?? '',
      fullName: json['fullName'] ?? json['full_name'] ?? 'Student',
      rank: (json['rank'] ?? 0) as int,
      score: (json['score'] ?? json['cumulative_score'] ?? 0) as int,
    );
  }
}

class DashboardProvider extends ChangeNotifier {
  final ApiClient _apiClient = ApiClient();

  List<WatchSessionItem> _watchSessions = [];
  List<RecentQuizItem> _recentQuizzes = [];
  List<LeaderboardEntry> _leaderboardEntries = [];
  int? _myRank;
  double? _quizAvgScore;
  int _unreadNotificationsCount = 0;
  bool _isLoading = false;

  List<WatchSessionItem> get watchSessions => _watchSessions;
  List<RecentQuizItem> get recentQuizzes => _recentQuizzes;
  List<LeaderboardEntry> get leaderboardEntries => _leaderboardEntries;
  int? get myRank => _myRank;
  double? get quizAvgScore => _quizAvgScore;
  int get unreadNotificationsCount => _unreadNotificationsCount;
  bool get isLoading => _isLoading;

  Future<void> fetchDashboardData() async {
    _isLoading = true;
    notifyListeners();

    try {
      await Future.wait([
        _fetchWatchSessions(),
        _fetchRecentQuizzes(),
        _fetchUserStats(),
        _fetchLeaderboard(),
        _fetchNotifications(),
      ]);
    } catch (_) {
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> _fetchWatchSessions() async {
    try {
      final res = await _apiClient.get('/videos/watch-sessions/recent');
      final data = res.data as List?;
      if (data != null) {
        _watchSessions = data.map((x) => WatchSessionItem.fromJson(x)).toList();
      }
    } catch (_) {}
  }

  Future<void> _fetchRecentQuizzes() async {
    try {
      final res = await _apiClient.get('/quizzes/attempts/recent');
      final data = res.data as List?;
      if (data != null) {
        _recentQuizzes = data.map((x) => RecentQuizItem.fromJson(x)).toList();
      }
    } catch (_) {}
  }

  Future<void> _fetchUserStats() async {
    try {
      final res = await _apiClient.get('/users/me/stats');
      if (res.data != null) {
        _quizAvgScore = (res.data['quizAvgScore'] as num?)?.toDouble();
      }
    } catch (_) {}
  }

  Future<void> _fetchLeaderboard() async {
    try {
      final res = await _apiClient.get('/leaderboard');
      if (res.data != null) {
        _myRank = res.data['myRank'] as int?;
        final entries = res.data['entries'] as List?;
        if (entries != null) {
          _leaderboardEntries = entries.map((e) => LeaderboardEntry.fromJson(e)).toList();
        }
      }
    } catch (_) {}
  }

  Future<void> _fetchNotifications() async {
    try {
      final res = await _apiClient.get('/notifications/unread');
      final data = res.data as List?;
      if (data != null) {
        _unreadNotificationsCount = data.length;
      }
    } catch (_) {}
  }
}
