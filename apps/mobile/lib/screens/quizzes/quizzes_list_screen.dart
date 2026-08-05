import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:alledu_mobile/providers/auth_provider.dart';
import 'package:alledu_mobile/providers/quiz_provider.dart';
import 'package:alledu_mobile/config/theme.dart';

class QuizzesListScreen extends StatefulWidget {
  const QuizzesListScreen({super.key});

  @override
  State<QuizzesListScreen> createState() => _QuizzesListScreenState();
}

class _QuizzesListScreenState extends State<QuizzesListScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<QuizProvider>(context, listen: false).fetchQuizzes();
    });
  }

  @override
  Widget build(BuildContext context) {
    final authProv = Provider.of<AuthProvider>(context);
    final quizProv = Provider.of<QuizProvider>(context);
    final isTeacher =
        authProv.user?.role == 'teacher' || authProv.user?.role == 'admin';

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text(
          'Quizzes & Tests',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
        ),
        centerTitle: false,
        backgroundColor: Colors.white,
        elevation: 0.5,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => quizProv.fetchQuizzes(),
            tooltip: 'Refresh Quizzes',
          ),
        ],
      ),
      floatingActionButton: isTeacher
          ? FloatingActionButton.extended(
              onPressed: () => context.push('/quizzes/create'),
              backgroundColor: AppTheme.primary,
              icon: const Icon(Icons.add, color: Colors.white),
              label: const Text(
                'Upload Test',
                style: TextStyle(
                    color: Colors.white, fontWeight: FontWeight.bold),
              ),
            )
          : null,
      body: quizProv.isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: () => quizProv.fetchQuizzes(),
              child: quizProv.quizzes.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.quiz_outlined,
                              size: 64, color: Colors.grey[400]),
                          const SizedBox(height: 12),
                          const Text(
                            'No Quizzes or Tests Available',
                            style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: AppTheme.textPrimary),
                          ),
                          const SizedBox(height: 4),
                          const Text(
                            'Check back later for new test assignments.',
                            style: TextStyle(
                                fontSize: 13,
                                color: AppTheme.textSecondary),
                          ),
                        ],
                      ),
                    )
                  : GridView.builder(
                      padding: const EdgeInsets.all(16),
                      gridDelegate:
                          const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 2,
                        crossAxisSpacing: 12,
                        mainAxisSpacing: 12,
                        childAspectRatio: 0.72,
                      ),
                      itemCount: quizProv.quizzes.length,
                      itemBuilder: (context, index) {
                        final quiz = quizProv.quizzes[index];
                        return _buildQuizCard(context, quiz, isTeacher);
                      },
                    ),
            ),
    );
  }

  Widget _buildQuizCard(
      BuildContext context, QuizItem quiz, bool isTeacher) {
    final attempted = quiz.attempted;
    final score = quiz.score;

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: attempted ? const Color(0xFFA7F3D0) : AppTheme.border,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(12.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Icon + attempted badge
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: attempted
                        ? const Color(0xFFECFDF5)
                        : AppTheme.primary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(
                    attempted
                        ? Icons.check_circle_outline
                        : Icons.assignment_outlined,
                    color: attempted ? Colors.green : AppTheme.primary,
                    size: 20,
                  ),
                ),
                if (quiz.isMandatory)
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 5, vertical: 2),
                    decoration: BoxDecoration(
                      color: Colors.red.shade50,
                      borderRadius: BorderRadius.circular(5),
                      border: Border.all(color: Colors.red.shade200),
                    ),
                    child: const Text(
                      'MUST',
                      style: TextStyle(
                          fontSize: 9,
                          fontWeight: FontWeight.bold,
                          color: Colors.red),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 10),

            // Title
            Text(
              quiz.title,
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.bold,
                color: AppTheme.textPrimary,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 4),

            // Subject
            if (quiz.subject != null && quiz.subject!.isNotEmpty) ...[
              Text(
                quiz.subject!,
                style: const TextStyle(
                  fontSize: 11,
                  color: AppTheme.primary,
                  fontWeight: FontWeight.w600,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 4),
            ],

            // Stats row
            Wrap(
              spacing: 6,
              runSpacing: 4,
              children: [
                _buildChip(
                  icon: Icons.timer_outlined,
                  label: '${quiz.durationMinutes}m',
                ),
                if (quiz.totalMarks > 0)
                  _buildChip(
                    icon: Icons.star_outline,
                    label: '${quiz.totalMarks}m',
                  ),
                if (quiz.questionCount > 0)
                  _buildChip(
                    icon: Icons.help_outline,
                    label: '${quiz.questionCount}Q',
                  ),
              ],
            ),

            const Spacer(),

            // Score if attempted
            if (attempted && score != null) ...[
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 6),
                decoration: BoxDecoration(
                  color: const Color(0xFFECFDF5),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  'Score: ${score.toStringAsFixed(0)}${quiz.totalMarks > 0 ? "/${quiz.totalMarks}" : "%"}',
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF059669),
                  ),
                ),
              ),
              const SizedBox(height: 6),
            ],

            // Action button
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  context.push('/quizzes/${quiz.id}');
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: attempted
                      ? Colors.white
                      : AppTheme.primary,
                  foregroundColor: attempted
                      ? AppTheme.primary
                      : Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                    side: BorderSide(
                      color: attempted ? AppTheme.primary : Colors.transparent,
                    ),
                  ),
                  elevation: 0,
                ),
                child: Text(
                  isTeacher
                      ? 'View'
                      : (attempted ? 'Review' : 'Start'),
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildChip({required IconData icon, required String label}) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 11, color: AppTheme.textSecondary),
        const SizedBox(width: 2),
        Text(
          label,
          style: const TextStyle(
              fontSize: 10, color: AppTheme.textSecondary),
        ),
      ],
    );
  }
}
