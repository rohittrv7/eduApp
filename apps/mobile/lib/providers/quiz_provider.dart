import 'package:flutter/material.dart';
import 'package:alledu_mobile/core/api/api_client.dart';

class QuizQuestion {
  final String id;
  final String text;
  final String type;
  final List<String> options;
  final int correctOptionIndex;
  final String? explanation;
  final int marks;
  final int negativeMarks;

  QuizQuestion({
    required this.id,
    required this.text,
    required this.type,
    required this.options,
    required this.correctOptionIndex,
    this.explanation,
    required this.marks,
    required this.negativeMarks,
  });

  factory QuizQuestion.fromJson(Map<String, dynamic> json) {
    final rawOptions = json['options'];
    List<String> parsedOptions = [];
    if (rawOptions is List) {
      parsedOptions = rawOptions.map((e) => e.toString()).toList();
    }
    
    int correctIdx = 0;
    final ca = json['correct_answer'] ?? json['correctAnswer'];
    if (ca is num) {
      correctIdx = ca.toInt();
    } else if (ca is String) {
      correctIdx = int.tryParse(ca) ?? 0;
    }

    return QuizQuestion(
      id: json['id'] ?? '',
      text: json['text'] ?? '',
      type: json['type'] ?? 'mcq',
      options: parsedOptions,
      correctOptionIndex: correctIdx,
      explanation: json['explanation'],
      marks: (json['marks'] as num?)?.toInt() ?? 1,
      negativeMarks: (json['negative_marks'] as num?)?.toInt() ?? 0,
    );
  }
}

class QuizItem {
  final String id;
  final String title;
  final String? teacherId;
  final bool isMandatory;
  final int questionCount;

  QuizItem({
    required this.id,
    required this.title,
    this.teacherId,
    required this.isMandatory,
    required this.questionCount,
  });

  factory QuizItem.fromJson(Map<String, dynamic> json) {
    return QuizItem(
      id: json['id'] ?? '',
      title: json['title'] ?? 'Quiz Test',
      teacherId: json['teacher_id'],
      isMandatory: json['is_mandatory'] ?? false,
      questionCount: json['questionCount'] ?? (json['questions'] as List?)?.length ?? 0,
    );
  }
}

class QuizProvider extends ChangeNotifier {
  final ApiClient _apiClient = ApiClient();

  List<QuizItem> _quizzes = [];
  bool _isLoading = false;
  String? _errorMessage;

  List<QuizItem> get quizzes => _quizzes;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  Future<void> fetchQuizzes() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final res = await _apiClient.get('/quizzes');
      final data = res.data as List?;
      if (data != null) {
        _quizzes = data.map((q) => QuizItem.fromJson(q)).toList();
      }
    } catch (e) {
      // Fallback mock data if API is initializing
      _quizzes = [
        QuizItem(id: 'mock-1', title: 'Mathematics Chapter 1 MCQ Test', isMandatory: true, questionCount: 5),
        QuizItem(id: 'mock-2', title: 'Physics Kinematics Mock Test', isMandatory: false, questionCount: 4),
        QuizItem(id: 'mock-3', title: 'Chemistry Organic Reactions Quiz', isMandatory: false, questionCount: 5),
      ];
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<Map<String, dynamic>?> fetchQuizDetails(String quizId) async {
    try {
      final res = await _apiClient.get('/quizzes/$quizId');
      return res.data;
    } catch (e) {
      return null;
    }
  }

  Future<Map<String, dynamic>?> submitQuizAttempt(String quizId, Map<String, dynamic> answers) async {
    try {
      final res = await _apiClient.post('/quizzes/$quizId/attempt', data: {'answers': answers});
      return res.data;
    } catch (e) {
      return null;
    }
  }

  Future<bool> createQuiz({
    required String title,
    required bool isMandatory,
    required List<Map<String, dynamic>> questions,
  }) async {
    _isLoading = true;
    notifyListeners();

    try {
      await _apiClient.post('/quizzes', data: {
        'title': title,
        'is_mandatory': isMandatory,
        'questions': questions,
      });
      await fetchQuizzes();
      return true;
    } catch (e) {
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
