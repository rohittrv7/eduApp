import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:alledu_mobile/providers/quiz_provider.dart';
import 'package:alledu_mobile/config/theme.dart';

class QuizTakeScreen extends StatefulWidget {
  final String quizId;

  const QuizTakeScreen({super.key, required this.quizId});

  @override
  State<QuizTakeScreen> createState() => _QuizTakeScreenState();
}

class _QuizTakeScreenState extends State<QuizTakeScreen> {
  int _currentIndex = 0;
  final Map<String, int> _selectedAnswers = {};
  bool _isLoading = true;
  bool _isSubmitting = false;
  String _title = 'Live Quiz Test';
  List<QuizQuestion> _questions = [];

  @override
  void initState() {
    super.initState();
    _loadQuiz();
  }

  Future<void> _loadQuiz() async {
    final quizProv = Provider.of<QuizProvider>(context, listen: false);
    final data = await quizProv.fetchQuizDetails(widget.quizId);

    if (data != null && data['questions'] is List) {
      final qList = (data['questions'] as List)
          .map((q) => QuizQuestion.fromJson(q))
          .toList();
      setState(() {
        _title = data['quiz']?['title'] ?? 'Quiz Test';
        _questions = qList;
        _isLoading = false;
      });
    } else {
      // Fallback default sample questions for instant offline/mock availability
      setState(() {
        _title = 'Sample Practice MCQ Test';
        _questions = [
          QuizQuestion(
            id: 'q1',
            text: 'What is the SI unit of electric current?',
            type: 'mcq',
            options: ['Ampere (A)', 'Volt (V)', 'Ohm (Ω)', 'Watt (W)'],
            correctOptionIndex: 0,
            marks: 1,
            negativeMarks: 0,
          ),
          QuizQuestion(
            id: 'q2',
            text: 'Which of the following represents acceleration due to gravity on Earth?',
            type: 'mcq',
            options: ['8.8 m/s²', '9.8 m/s²', '10.8 m/s²', '11.2 m/s²'],
            correctOptionIndex: 1,
            marks: 1,
            negativeMarks: 0,
          ),
          QuizQuestion(
            id: 'q3',
            text: 'What is the chemical formula for water?',
            type: 'mcq',
            options: ['CO2', 'NaCl', 'H2O', 'H2SO4'],
            correctOptionIndex: 2,
            marks: 1,
            negativeMarks: 0,
          ),
        ];
        _isLoading = false;
      });
    }
  }

  void _submitQuiz() async {
    setState(() => _isSubmitting = true);

    int score = 0;
    int totalMarks = 0;

    for (var q in _questions) {
      totalMarks += q.marks;
      final selected = _selectedAnswers[q.id];
      if (selected != null && selected == q.correctOptionIndex) {
        score += q.marks;
      }
    }

    final percentage = totalMarks > 0 ? (score / totalMarks) * 100 : 0.0;

    // Send attempt payload to API
    final apiAnswers = <String, dynamic>{};
    _selectedAnswers.forEach((qId, optIdx) {
      apiAnswers[qId] = optIdx;
    });

    final quizProv = Provider.of<QuizProvider>(context, listen: false);
    await quizProv.submitQuizAttempt(widget.quizId, apiAnswers);

    setState(() => _isSubmitting = false);

    if (!mounted) return;

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          children: [
            Icon(
              percentage >= 50 ? Icons.check_circle : Icons.warning_amber,
              color: percentage >= 50 ? Colors.green : Colors.orange,
              size: 28,
            ),
            const SizedBox(width: 8),
            Text(percentage >= 50 ? 'Test Completed!' : 'Test Submitted'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              '${percentage.toStringAsFixed(0)}%',
              style: TextStyle(
                fontSize: 36,
                fontWeight: FontWeight.bold,
                color: percentage >= 50 ? Colors.green : Colors.orange,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Your Score: $score / $totalMarks',
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 6),
            Text(
              percentage >= 50
                  ? 'Great effort! You passed this quiz test.'
                  : 'Keep learning and review the concepts.',
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 13, color: AppTheme.textSecondary),
            ),
          ],
        ),
        actions: [
          ElevatedButton(
            onPressed: () {
              Navigator.of(ctx).pop();
              Navigator.of(context).pop();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.primary,
              foregroundColor: Colors.white,
            ),
            child: const Text('Back to Quizzes'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    final currentQuestion = _questions[_currentIndex];
    final selectedOption = _selectedAnswers[currentQuestion.id];

    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: Text(_title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        backgroundColor: Colors.white,
        elevation: 0.5,
      ),
      body: Column(
        children: [
          // Progress bar
          LinearProgressIndicator(
            value: (_currentIndex + 1) / _questions.length,
            backgroundColor: Colors.grey[200],
            color: AppTheme.primary,
            minHeight: 4,
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Question ${_currentIndex + 1} of ${_questions.length}',
                  style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.textSecondary),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppTheme.primary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    '${currentQuestion.marks} Mark',
                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.primary),
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Card(
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                  side: BorderSide(color: Colors.grey.shade200),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        currentQuestion.text,
                        style: const TextStyle(
                          fontSize: 17,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 24),
                      ...List.generate(currentQuestion.options.length, (optIdx) {
                        final isSelected = selectedOption == optIdx;
                        final optionLetter = String.fromCharCode(65 + optIdx);
                        return GestureDetector(
                          onTap: () {
                            setState(() {
                              _selectedAnswers[currentQuestion.id] = optIdx;
                            });
                          },
                          child: Container(
                            margin: const EdgeInsets.only(bottom: 12),
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                            decoration: BoxDecoration(
                              color: isSelected ? AppTheme.primary.withOpacity(0.08) : Colors.white,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: isSelected ? AppTheme.primary : Colors.grey.shade300,
                                width: isSelected ? 2 : 1,
                              ),
                            ),
                            child: Row(
                              children: [
                                CircleAvatar(
                                  radius: 14,
                                  backgroundColor: isSelected ? AppTheme.primary : Colors.grey[200],
                                  child: Text(
                                    optionLetter,
                                    style: TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.bold,
                                      color: isSelected ? Colors.white : Colors.grey[700],
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 14),
                                Expanded(
                                  child: Text(
                                    currentQuestion.options[optIdx],
                                    style: TextStyle(
                                      fontSize: 15,
                                      fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                                      color: isSelected ? AppTheme.primary : AppTheme.textPrimary,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      }),
                    ],
                  ),
                ),
              ),
            ),
          ),
          // Navigation controls
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              border: Border(top: BorderSide(color: Colors.grey.shade200)),
            ),
            child: Row(
              children: [
                if (_currentIndex > 0)
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () {
                        setState(() => _currentIndex--);
                      },
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      child: const Text('Previous'),
                    ),
                  ),
                if (_currentIndex > 0) const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: _isSubmitting
                        ? null
                        : () {
                            if (_currentIndex < _questions.length - 1) {
                              setState(() => _currentIndex++);
                            } else {
                              _submitQuiz();
                            }
                          },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    child: Text(
                      _currentIndex < _questions.length - 1 ? 'Next Question' : 'Submit Test',
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
