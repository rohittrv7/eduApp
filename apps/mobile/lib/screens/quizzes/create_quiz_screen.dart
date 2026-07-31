import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:alledu_mobile/providers/quiz_provider.dart';
import 'package:alledu_mobile/config/theme.dart';

class CreateQuizScreen extends StatefulWidget {
  const CreateQuizScreen({super.key});

  @override
  State<CreateQuizScreen> createState() => _CreateQuizScreenState();
}

class _CreateQuizScreenState extends State<CreateQuizScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  bool _isMandatory = false;

  final List<Map<String, dynamic>> _questions = [
    {
      'text': TextEditingController(),
      'optA': TextEditingController(),
      'optB': TextEditingController(),
      'optC': TextEditingController(),
      'optD': TextEditingController(),
      'correctIdx': 0,
      'marks': 1,
    }
  ];

  void _addQuestion() {
    setState(() {
      _questions.add({
        'text': TextEditingController(),
        'optA': TextEditingController(),
        'optB': TextEditingController(),
        'optC': TextEditingController(),
        'optD': TextEditingController(),
        'correctIdx': 0,
        'marks': 1,
      });
    });
  }

  void _removeQuestion(int index) {
    if (_questions.length > 1) {
      setState(() {
        _questions.removeAt(index);
      });
    }
  }

  void _saveQuiz() async {
    if (!_formKey.currentState!.validate()) return;

    final parsedQuestions = _questions.map((q) {
      final opts = [
        (q['optA'] as TextEditingController).text.trim(),
        (q['optB'] as TextEditingController).text.trim(),
        (q['optC'] as TextEditingController).text.trim(),
        (q['optD'] as TextEditingController).text.trim(),
      ].where((o) => o.isNotEmpty).toList();

      return {
        'text': (q['text'] as TextEditingController).text.trim(),
        'type': 'mcq',
        'options': opts.length >= 2 ? opts : ['Option 1', 'Option 2'],
        'correct_answer': q['correctIdx'],
        'marks': q['marks'],
        'negative_marks': 0,
      };
    }).toList();

    final quizProv = Provider.of<QuizProvider>(context, listen: false);
    final success = await quizProv.createQuiz(
      title: _titleController.text.trim(),
      isMandatory: _isMandatory,
      questions: parsedQuestions,
    );

    if (!mounted) return;

    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Quiz created & uploaded successfully!'), backgroundColor: Colors.green),
      );
      Navigator.of(context).pop();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Failed to upload quiz. Try again.'), backgroundColor: Colors.red),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final quizProv = Provider.of<QuizProvider>(context);

    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: const Text('Create New Quiz / Test', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        backgroundColor: Colors.white,
        elevation: 0.5,
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Quiz details
            Card(
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
                side: BorderSide(color: Colors.grey.shade200),
              ),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Quiz Details', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _titleController,
                      decoration: const InputDecoration(
                        labelText: 'Quiz Title',
                        hintText: 'e.g. Physics Chapter 2 Weekly Test',
                        border: OutlineInputBorder(),
                      ),
                      validator: (val) => val == null || val.trim().isEmpty ? 'Enter quiz title' : null,
                    ),
                    const SizedBox(height: 12),
                    SwitchListTile(
                      title: const Text('Mandatory Quiz'),
                      subtitle: const Text('Requires completion to unlock certificate'),
                      value: _isMandatory,
                      onChanged: (val) => setState(() => _isMandatory = val),
                      activeColor: AppTheme.primary,
                      contentPadding: EdgeInsets.zero,
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Questions List
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Questions (${_questions.length})', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                TextButton.icon(
                  onPressed: _addQuestion,
                  icon: const Icon(Icons.add, size: 18),
                  label: const Text('Add Question'),
                ),
              ],
            ),
            const SizedBox(height: 8),

            ...List.generate(_questions.length, (index) {
              final q = _questions[index];
              return Card(
                elevation: 0,
                margin: const EdgeInsets.only(bottom: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                  side: BorderSide(color: Colors.grey.shade200),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('Q${index + 1}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                          if (_questions.length > 1)
                            IconButton(
                              icon: const Icon(Icons.delete_outline, color: Colors.red),
                              onPressed: () => _removeQuestion(index),
                            ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      TextFormField(
                        controller: q['text'] as TextEditingController,
                        decoration: const InputDecoration(
                          labelText: 'Question Text',
                          border: OutlineInputBorder(),
                        ),
                        validator: (val) => val == null || val.trim().isEmpty ? 'Enter question text' : null,
                      ),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: q['optA'] as TextEditingController,
                        decoration: const InputDecoration(labelText: 'Option A', border: OutlineInputBorder()),
                        validator: (val) => val == null || val.trim().isEmpty ? 'Enter option A' : null,
                      ),
                      const SizedBox(height: 8),
                      TextFormField(
                        controller: q['optB'] as TextEditingController,
                        decoration: const InputDecoration(labelText: 'Option B', border: OutlineInputBorder()),
                        validator: (val) => val == null || val.trim().isEmpty ? 'Enter option B' : null,
                      ),
                      const SizedBox(height: 8),
                      TextFormField(
                        controller: q['optC'] as TextEditingController,
                        decoration: const InputDecoration(labelText: 'Option C (Optional)', border: OutlineInputBorder()),
                      ),
                      const SizedBox(height: 8),
                      TextFormField(
                        controller: q['optD'] as TextEditingController,
                        decoration: const InputDecoration(labelText: 'Option D (Optional)', border: OutlineInputBorder()),
                      ),
                      const SizedBox(height: 12),
                      DropdownButtonFormField<int>(
                        value: q['correctIdx'] as int,
                        decoration: const InputDecoration(labelText: 'Correct Option', border: OutlineInputBorder()),
                        items: const [
                          DropdownMenuItem(value: 0, child: Text('Option A')),
                          DropdownMenuItem(value: 1, child: Text('Option B')),
                          DropdownMenuItem(value: 2, child: Text('Option C')),
                          DropdownMenuItem(value: 3, child: Text('Option D')),
                        ],
                        onChanged: (val) {
                          if (val != null) setState(() => q['correctIdx'] = val);
                        },
                      ),
                    ],
                  ),
                ),
              );
            }),

            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: quizProv.isLoading ? null : _saveQuiz,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primary,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: quizProv.isLoading
                  ? const CircularProgressIndicator(color: Colors.white)
                  : const Text('Save & Publish Test', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      ),
    );
  }
}
