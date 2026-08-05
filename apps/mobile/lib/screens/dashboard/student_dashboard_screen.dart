import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:alledu_mobile/providers/auth_provider.dart';
import 'package:alledu_mobile/providers/batch_provider.dart';
import 'package:alledu_mobile/providers/dashboard_provider.dart';
import 'package:alledu_mobile/config/theme.dart';

class StudentDashboardScreen extends StatefulWidget {
  const StudentDashboardScreen({super.key});

  @override
  State<StudentDashboardScreen> createState() => _StudentDashboardScreenState();
}

class _StudentDashboardScreenState extends State<StudentDashboardScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _refreshData();
    });
  }

  Future<void> _refreshData() async {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final batchProv = Provider.of<BatchProvider>(context, listen: false);
    final dashProv = Provider.of<DashboardProvider>(context, listen: false);

    await Future.wait([
      auth.fetchProfile(),
      batchProv.fetchEnrolledBatches(),
      dashProv.fetchDashboardData(),
    ]);
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final batchProv = Provider.of<BatchProvider>(context);
    final dashProv = Provider.of<DashboardProvider>(context);
    final user = auth.user;

    final displayName = user?.fullName.trim().isNotEmpty == true
        ? user!.fullName
        : (user?.email?.split('@').first ?? 'Student');
    final firstName = displayName.split(' ').first;
    final streakCount = user?.streakCount ?? 0;
    final hour = DateTime.now().hour;
    final greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

    final enrolledBatches = batchProv.enrolledBatches;
    final watchSessions = dashProv.watchSessions;
    final recentQuizzes = dashProv.recentQuizzes;
    final leaderboardEntries = dashProv.leaderboardEntries;
    final myRank = dashProv.myRank;
    final quizAvgScore = dashProv.quizAvgScore;

    return Scaffold(
      backgroundColor: AppTheme.background,
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _refreshData,
          color: AppTheme.primary,
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Top Header with Profile and Notifications
                Row(
                  children: [
                    CircleAvatar(
                      radius: 20,
                      backgroundColor: AppTheme.primary,
                      backgroundImage: user?.photo != null ? NetworkImage(user!.photo!) : null,
                      child: user?.photo == null
                          ? Text(
                              firstName.isNotEmpty ? firstName[0].toUpperCase() : 'S',
                              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                            )
                          : null,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '$greeting,',
                            style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary, fontWeight: FontWeight.w500),
                          ),
                          Text(
                            displayName,
                            style: const TextStyle(fontSize: 16, color: AppTheme.textPrimary, fontWeight: FontWeight.bold),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                    Stack(
                      children: [
                        Container(
                          height: 40,
                          width: 40,
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: AppTheme.border),
                          ),
                          child: const Icon(Icons.notifications_none_outlined, size: 20, color: AppTheme.textSecondary),
                        ),
                        if (dashProv.unreadNotificationsCount > 0)
                          Positioned(
                            right: 6,
                            top: 6,
                            child: Container(
                              height: 8,
                              width: 8,
                              decoration: const BoxDecoration(
                                color: Colors.redAccent,
                                shape: BoxShape.circle,
                              ),
                            ),
                          ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 20),

                // Hero Greeting Gradient Card (1:1 Web match)
                Container(
                  padding: const EdgeInsets.all(22.0),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF1A56DB), Color(0xFF3B82F6)],
                      begin: Alignment.centerLeft,
                      end: Alignment.centerRight,
                    ),
                    borderRadius: BorderRadius.circular(20.0),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF1A56DB).withOpacity(0.25),
                        blurRadius: 15,
                        offset: const Offset(0, 6),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '$greeting,',
                        style: TextStyle(color: Colors.white.withOpacity(0.85), fontSize: 13, fontWeight: FontWeight.w500),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '$firstName 👋',
                        style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        streakCount > 0
                            ? "You're on a $streakCount-day streak! Keep it up."
                            : "Start learning today to build your streak!",
                        style: TextStyle(color: Colors.white.withOpacity(0.9), fontSize: 13.5),
                      ),
                      const SizedBox(height: 16),
                      InkWell(
                        onTap: () => context.go('/batches'),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.2),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: const Text(
                            'My Batches',
                            style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),

                // 4 Stat Cards Row (1:1 Web match)
                Row(
                  children: [
                    Expanded(
                      child: _buildStatCard(
                        icon: const Icon(Icons.whatshot, color: Color(0xFFF97316), size: 18),
                        label: 'Streak',
                        value: '$streakCount days',
                        bgColor: const Color(0xFFFFF7ED),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: _buildStatCard(
                        icon: const Icon(Icons.book_outlined, color: Color(0xFF3B82F6), size: 18),
                        label: 'My Batches',
                        value: '${enrolledBatches.length}',
                        bgColor: const Color(0xFFEFF6FF),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: _buildStatCard(
                        icon: const Icon(Icons.star_outline, color: Color(0xFFEAB308), size: 18),
                        label: 'Avg Score',
                        value: quizAvgScore != null ? '${quizAvgScore.toStringAsFixed(0)}%' : '—',
                        bgColor: const Color(0xFFFEFCE8),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: _buildStatCard(
                        icon: const Icon(Icons.emoji_events_outlined, color: Color(0xFFA855F7), size: 18),
                        label: 'My Rank',
                        value: myRank != null ? '#$myRank' : '—',
                        bgColor: const Color(0xFFFAF5FF),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),

                // Continue Watching Section
                if (watchSessions.isNotEmpty) ...[
                  _buildSectionHeader(
                    title: 'Continue Watching',
                    icon: const Icon(Icons.play_circle_outline, size: 18, color: AppTheme.primary),
                    onTapViewAll: () => context.go('/batches'),
                  ),
                  const SizedBox(height: 10),
                  SizedBox(
                    height: 140,
                    child: ListView.builder(
                      scrollDirection: Axis.horizontal,
                      itemCount: watchSessions.length,
                      itemBuilder: (context, index) {
                        final session = watchSessions[index];
                        return Container(
                          width: 220,
                          margin: const EdgeInsets.only(right: 12),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: AppTheme.border),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Container(
                                height: 80,
                                decoration: BoxDecoration(
                                  color: Colors.grey.shade200,
                                  borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
                                  image: session.thumbnail != null
                                      ? DecorationImage(image: NetworkImage(session.thumbnail!), fit: BoxFit.cover)
                                      : null,
                                ),
                                child: Stack(
                                  children: [
                                    if (session.thumbnail == null)
                                      const Center(child: Icon(Icons.play_circle_fill, size: 32, color: AppTheme.primary)),
                                    Positioned(
                                      bottom: 0,
                                      left: 0,
                                      right: 0,
                                      child: LinearProgressIndicator(
                                        value: session.progressPercent / 100.0,
                                        backgroundColor: Colors.grey.shade300,
                                        valueColor: const AlwaysStoppedAnimation<Color>(AppTheme.primary),
                                        minHeight: 4,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              Padding(
                                padding: const EdgeInsets.all(8.0),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      session.title,
                                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      '${session.progressPercent}% watched',
                                      style: const TextStyle(fontSize: 10, color: AppTheme.textSecondary),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        );
                      },
                    ),
                  ),
                  const SizedBox(height: 24),
                ],

                // My Batches Section
                _buildSectionHeader(
                  title: 'My Batches',
                  icon: const Icon(Icons.book_outlined, size: 18, color: AppTheme.primary),
                  onTapViewAll: () => context.go('/batches'),
                ),
                const SizedBox(height: 10),

                if (batchProv.isLoading)
                  const Center(child: Padding(padding: EdgeInsets.all(16.0), child: CircularProgressIndicator()))
                else if (enrolledBatches.isEmpty)
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppTheme.border),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.school_outlined, size: 32, color: AppTheme.textSecondary),
                        const SizedBox(width: 12),
                        const Expanded(
                          child: Text(
                            'You have not enrolled in any batches yet.',
                            style: TextStyle(fontSize: 13, color: AppTheme.textSecondary),
                          ),
                        ),
                        TextButton(
                          onPressed: () => context.go('/batches'),
                          child: const Text('Explore', style: TextStyle(fontWeight: FontWeight.bold, color: AppTheme.primary)),
                        ),
                      ],
                    ),
                  )
                else
                  ListView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: enrolledBatches.take(3).length,
                    itemBuilder: (context, index) {
                      final batch = enrolledBatches[index];
                      return Container(
                        margin: const EdgeInsets.only(bottom: 10),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: AppTheme.border),
                        ),
                        child: ListTile(
                          contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                          leading: Container(
                            height: 44,
                            width: 44,
                            decoration: BoxDecoration(
                              color: const Color(0xFFEFF6FF),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: const Icon(Icons.book_outlined, color: AppTheme.primary, size: 20),
                          ),
                          title: Text(
                            batch.name,
                            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          subtitle: Text(
                            batch.targetExam ?? 'General Batch',
                            style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary),
                          ),
                          trailing: const Icon(Icons.arrow_forward_ios, size: 14, color: AppTheme.textSecondary),
                          onTap: () => context.go('/batches/${batch.slug}'),
                        ),
                      );
                    },
                  ),
                const SizedBox(height: 24),

                // Streak Calendar Section (1:1 Web match)
                Container(
                  padding: const EdgeInsets.all(16.0),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppTheme.border),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.whatshot, color: Color(0xFFF97316), size: 18),
                          const SizedBox(width: 6),
                          const Text(
                            'Daily Streak',
                            style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      _buildStreakCalendar(streakCount),
                    ],
                  ),
                ),
                const SizedBox(height: 20),

                // Recent Quizzes Section (1:1 Web match)
                Container(
                  padding: const EdgeInsets.all(16.0),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppTheme.border),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              const Icon(Icons.track_changes, color: Color(0xFFA855F7), size: 18),
                              const SizedBox(width: 6),
                              const Text(
                                'Recent Quizzes',
                                style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
                              ),
                            ],
                          ),
                          GestureDetector(
                            onTap: () => context.go('/quizzes'),
                            child: const Text('View all', style: TextStyle(fontSize: 12, color: AppTheme.primary, fontWeight: FontWeight.bold)),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      if (recentQuizzes.isEmpty)
                        const Padding(
                          padding: EdgeInsets.symmetric(vertical: 12),
                          child: Center(
                            child: Text(
                              'No quizzes attempted yet',
                              style: TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                            ),
                          ),
                        )
                      else
                        ListView.builder(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          itemCount: recentQuizzes.take(3).length,
                          itemBuilder: (context, index) {
                            final q = recentQuizzes[index];
                            return Container(
                              margin: const EdgeInsets.only(bottom: 8),
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                              decoration: BoxDecoration(
                                color: Colors.grey.shade50,
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          q.quizTitle,
                                          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                        Text(
                                          DateFormat('dd/MM/yyyy').format(q.attemptedAt),
                                          style: const TextStyle(fontSize: 10, color: AppTheme.textSecondary),
                                        ),
                                      ],
                                    ),
                                  ),
                                  Text(
                                    '${q.score}/${q.totalMarks}',
                                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.primary),
                                  ),
                                ],
                              ),
                            );
                          },
                        ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),

                // Leaderboard Top 5 Section (1:1 Web match)
                Container(
                  padding: const EdgeInsets.all(16.0),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppTheme.border),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              const Icon(Icons.emoji_events, color: Color(0xFFEAB308), size: 18),
                              const SizedBox(width: 6),
                              const Text(
                                'Leaderboard',
                                style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
                              ),
                              if (myRank != null) ...[
                                const SizedBox(width: 8),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: AppTheme.primary,
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Text(
                                    '#$myRank',
                                    style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.white),
                                  ),
                                ),
                              ],
                            ],
                          ),
                          GestureDetector(
                            onTap: () => context.go('/leaderboard'),
                            child: const Text('View all', style: TextStyle(fontSize: 12, color: AppTheme.primary, fontWeight: FontWeight.bold)),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      if (leaderboardEntries.isEmpty)
                        const Padding(
                          padding: EdgeInsets.symmetric(vertical: 12),
                          child: Center(
                            child: Text('No leaderboard data yet', style: TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
                          ),
                        )
                      else
                        ListView.builder(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          itemCount: leaderboardEntries.take(5).length,
                          itemBuilder: (context, index) {
                            final entry = leaderboardEntries[index];
                            return Padding(
                              padding: const EdgeInsets.symmetric(vertical: 4),
                              child: Row(
                                children: [
                                  SizedBox(
                                    width: 20,
                                    child: Text(
                                      '${entry.rank}',
                                      style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.textSecondary),
                                    ),
                                  ),
                                  CircleAvatar(
                                    radius: 12,
                                    backgroundColor: AppTheme.primary,
                                    child: Text(
                                      entry.fullName.isNotEmpty ? entry.fullName[0].toUpperCase() : 'S',
                                      style: const TextStyle(fontSize: 10, color: Colors.white, fontWeight: FontWeight.bold),
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      entry.fullName,
                                      style: const TextStyle(fontSize: 13, color: AppTheme.textPrimary),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                  Text(
                                    '${entry.score}',
                                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.primary),
                                  ),
                                ],
                              ),
                            );
                          },
                        ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                // Quick Links Grid (1:1 Web match)
                GridView.count(
                  crossAxisCount: 2,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  crossAxisSpacing: 10,
                  mainAxisSpacing: 10,
                  childAspectRatio: 2.5,
                  children: [
                    _buildQuickLinkCard(
                      label: 'Test Series',
                      icon: const Icon(Icons.bar_chart_outlined, color: Colors.blue, size: 20),
                      onTap: () => context.go('/quizzes'),
                    ),
                    _buildQuickLinkCard(
                      label: 'Doubts',
                      icon: const Icon(Icons.trending_up, color: Colors.green, size: 20),
                      onTap: () => context.go('/doubts'),
                    ),
                    _buildQuickLinkCard(
                      label: 'Leaderboard',
                      icon: const Icon(Icons.emoji_events_outlined, color: Colors.amber, size: 20),
                      onTap: () => context.go('/leaderboard'),
                    ),
                    _buildQuickLinkCard(
                      label: 'My Profile',
                      icon: const Icon(Icons.person_outline, color: Colors.purple, size: 20),
                      onTap: () => context.go('/profile'),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildStatCard({
    required Widget icon,
    required String label,
    required String value,
    required Color bgColor,
  }) {
    return Container(
      padding: const EdgeInsets.all(14.0),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16.0),
        border: Border.all(color: AppTheme.border),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8.0),
            decoration: BoxDecoration(
              color: bgColor,
              borderRadius: BorderRadius.circular(10),
            ),
            child: icon,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  value,
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
                ),
                Text(
                  label,
                  style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader({
    required String title,
    required Widget icon,
    required VoidCallback onTapViewAll,
  }) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Row(
          children: [
            icon,
            const SizedBox(width: 6),
            Text(
              title,
              style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
            ),
          ],
        ),
        GestureDetector(
          onTap: onTapViewAll,
          child: const Row(
            children: [
              Text('View all ', style: TextStyle(fontSize: 12, color: AppTheme.primary, fontWeight: FontWeight.bold)),
              Icon(Icons.chevron_right, size: 14, color: AppTheme.primary),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildStreakCalendar(int streakCount) {
    final now = DateTime.now();
    final days = List.generate(7, (i) => now.subtract(Duration(days: 6 - i)));

    return Column(
      children: [
        Row(
          children: [
            Text(
              '$streakCount',
              style: const TextStyle(fontSize: 26, fontWeight: FontWeight.bold, color: Color(0xFFF97316)),
            ),
            const SizedBox(width: 6),
            const Text('day streak', style: TextStyle(fontSize: 13, color: AppTheme.textSecondary)),
          ],
        ),
        const SizedBox(height: 8),
        Row(
          children: List.generate(7, (i) {
            final active = i >= 7 - streakCount;
            return Expanded(
              child: Container(
                height: 24,
                margin: const EdgeInsets.symmetric(horizontal: 2),
                decoration: BoxDecoration(
                  color: active ? const Color(0xFFFB923C) : Colors.grey.shade100,
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
            );
          }),
        ),
        const SizedBox(height: 4),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: days.map((d) {
            return Expanded(
              child: Text(
                DateFormat('E').format(d).substring(0, 1),
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 10, color: AppTheme.textSecondary),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildQuickLinkCard({
    required String label,
    required Widget icon,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppTheme.border),
        ),
        child: Row(
          children: [
            icon,
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                label,
                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
              ),
            ),
            const Icon(Icons.chevron_right, size: 14, color: AppTheme.textSecondary),
          ],
        ),
      ),
    );
  }
}
