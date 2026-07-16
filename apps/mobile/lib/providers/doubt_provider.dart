import 'package:flutter/material.dart';
import 'package:alledu_mobile/core/api/api_client.dart';
import 'package:alledu_mobile/models/doubt.dart';

class DoubtProvider extends ChangeNotifier {
  final ApiClient _apiClient = ApiClient();

  List<Doubt> _doubts = [];
  bool _isLoading = false;
  String? _errorMessage;

  List<Doubt> get doubts => _doubts;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  // Fetch doubts list (optionally filtered by video/chapter)
  Future<void> fetchDoubts({String? videoId, String? chapterId}) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final queryParams = <String, dynamic>{};
      if (videoId != null) queryParams['videoId'] = videoId;
      if (chapterId != null) queryParams['chapterId'] = chapterId;

      final res = await _apiClient.get('/doubts', queryParameters: queryParams);
      final data = res.data as List?;
      if (data != null) {
        _doubts = data.map((d) => Doubt.fromJson(d)).toList();
      }
    } catch (e) {
      _errorMessage = 'Failed to load doubts forum';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Create new doubt
  Future<bool> createDoubt({
    required String text,
    String? imageUrl,
    String? videoId,
    String? chapterId,
  }) async {
    _isLoading = true;
    notifyListeners();

    try {
      await _apiClient.post('/doubts', data: {
        'text': text,
        if (imageUrl != null) 'imageUrl': imageUrl,
        if (videoId != null) 'videoId': videoId,
        if (chapterId != null) 'chapterId': chapterId,
      });
      await fetchDoubts(videoId: videoId, chapterId: chapterId);
      return true;
    } catch (_) {
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Upvote a doubt
  Future<void> upvoteDoubt(String doubtId) async {
    try {
      await _apiClient.post('/doubts/$doubtId/upvote');
      // Update local item upvote count to reflect change instantly
      final index = _doubts.indexWhere((d) => d.id == doubtId);
      if (index != -1) {
        final current = _doubts[index];
        _doubts[index] = Doubt(
          id: current.id,
          text: current.text,
          imageUrl: current.imageUrl,
          status: current.status,
          upvotes: current.upvotes + 1,
          videoId: current.videoId,
          chapterId: current.chapterId,
          student: current.student,
          replies: current.replies,
          createdAt: current.createdAt,
          updatedAt: current.updatedAt,
        );
        notifyListeners();
      }
    } catch (_) {}
  }

  // Resolve a doubt (patch resolved status)
  Future<void> resolveDoubt(String doubtId) async {
    try {
      await _apiClient.patch('/doubts/$doubtId/resolve');
      final index = _doubts.indexWhere((d) => d.id == doubtId);
      if (index != -1) {
        final current = _doubts[index];
        _doubts[index] = Doubt(
          id: current.id,
          text: current.text,
          imageUrl: current.imageUrl,
          status: 'resolved',
          upvotes: current.upvotes,
          videoId: current.videoId,
          chapterId: current.chapterId,
          student: current.student,
          replies: current.replies,
          createdAt: current.createdAt,
          updatedAt: current.updatedAt,
        );
        notifyListeners();
      }
    } catch (_) {}
  }

  // Add Reply
  Future<bool> replyToDoubt(String doubtId, String text, {String? imageUrl}) async {
    try {
      await _apiClient.post(
        '/doubts/$doubtId/reply',
        data: {'text': text, 'image_url': imageUrl},
      );
      // Re-fetch doubts list
      await fetchDoubts();
      return true;
    } catch (_) {
      return false;
    }
  }
}
