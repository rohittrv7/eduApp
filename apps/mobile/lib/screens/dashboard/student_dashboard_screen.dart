import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:alledu_mobile/providers/auth_provider.dart';
import 'package:alledu_mobile/providers/batch_provider.dart';
import 'package:alledu_mobile/config/theme.dart';
import 'package:alledu_mobile/core/utils/helpers.dart';
import 'package:intl/intl.dart';

class StudentDashboardScreen extends StatefulWidget {
  const StudentDashboardScreen({super.key});

  @override
  State<StudentDashboardScreen> createState() => _StudentDashboardScreenState();
}

class _StudentDashboardScreenState extends State<StudentDashboardScreen> {
  @override
  void initState() {
    super.initState();
    // Fetch dashboard data
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<BatchProvider>(context, listen: false).fetchEnrolledBatches();
      Provider.of<AuthProvider>(context, listen: false).fetchProfile();
    });
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final batchProv = Provider.of<BatchProvider>(context);
    final user = auth.user;

    final fullName = user?.fullName.isNotEmpty == true ? user!.fullName : 'Student';
    final firstName = fullName.split(' ').first;
    final streakCount = user?.streakCount ?? 0;
    final hour = DateTime.now().hour;
    final greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

    return Scaffold(
      backgroundColor: AppTheme.background,
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () async {
            await Future.wait([
              auth.fetchProfile(),
              batchProv.fetchEnrolledBatches(),
            ]);
          },
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Header Profile bar
                Row(
                  children: [
                    CircleAvatar(
                      radius: 20,
                      backgroundColor: AppTheme.primary,
                      backgroundImage: user?.photo != null ? NetworkImage(user!.photo!) : null,
                      child: user?.photo == null
                          ? Text(
                              firstName.substring(0, 1).toUpperCase(),
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
                            user?.fullName ?? 'Student',
                            style: const TextStyle(fontSize: 16, color: AppTheme.textPrimary, fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                    ),
                    // Notification Icon
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
                  ],
                ),
                const SizedBox(height: 24),

                // Hero Greeting Card
                Container(
                  padding: const EdgeInsets.all(24.0),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF1D4ED8), Color(0xFF4F46E5)], // Royal blue to indigo
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(28.0),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF4F46E5).withOpacity(0.2),
                        blurRadius: 20,
                        offset: const Offset(0, 8),
                      )
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: const Text(
                          '✨ Current Streak',
                          style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                        ),
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'Hey $firstName! 👋',
                        style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w900, letterSpacing: -0.5),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        streakCount > 0
                            ? '🔥 Incredible! You hold a $streakCount-day learning streak. Keep moving forward!'
                            : '🚀 Build a streak today! Start watching a lecture to build your progress blocks.',
                        style: TextStyle(color: Colors.white.withOpacity(0.85), fontSize: 13.5, height: 1.4, fontWeight: FontWeight.w500),
                      ),
                      const SizedBox(height: 20),
                      ElevatedButton(
                        onPressed: () => context.go('/batches'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.white,
                          foregroundColor: const Color(0xFF4F46E5),
                          elevation: 0,
                          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        child: const Text('Browse Batches', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                // Stats row
                Row(
                  children: [
                    Expanded(
                      child: _buildStatCard(
                        icon: const Icon(Icons.whatshot, color: AppTheme.accentFlame),
                        value: '$streakCount days',
                        label: 'Streak',
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _buildStatCard(
                        icon: const Icon(Icons.menu_book, color: Colors.blue),
                        value: '${batchProv.enrolledBatches.length}',
                        label: 'My Batches',
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: _buildStatCard(
                        icon: const Icon(Icons.star_outline, color: Colors.amber),
                        value: '84%',
                        label: 'Avg Quiz',
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _buildStatCard(
                        icon: const Icon(Icons.emoji_events_outlined, color: AppTheme.accentTrophy),
                        value: '#12',
                        label: 'Leaderboard',
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 28),

                // Daily contribution blocks tracker
                _buildStreakTracker(streakCount),
                const SizedBox(height: 28),

                // Enrolled Batches Section
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'My Active Batches',
                      style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: AppTheme.textPrimary, letterSpacing: -0.2),
                    ),
                    TextButton(
                      onPressed: () => context.go('/batches'),
                      child: const Text('View All', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppTheme.primary)),
                    ),
                  ],
                ),
                const SizedBox(height: 8),

                if (batchProv.isLoading)
                  const Center(child: Padding(padding: EdgeInsets.all(16.0), child: CircularProgressIndicator()))
                else if (batchProv.enrolledBatches.isEmpty)
                  Container(
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: AppTheme.border),
                    ),
                    child: const Column(
                      children: [
                        Text('🎓', style: TextStyle(fontSize: 28)),
                        SizedBox(height: 8),
                        Text(
                          'You are not enrolled in any course batches yet.',
                          style: TextStyle(fontSize: 13, color: AppTheme.textSecondary, fontWeight: FontWeight.w500),
                        ),
                      ],
                    ),
                  )
                else
                  ListView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: batchProv.enrolledBatches.take(2).length,
                    itemBuilder: (context, index) {
                      final batch = batchProv.enrolledBatches[index];
                      return Card(
                        margin: const EdgeInsets.only(bottom: 12),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(20),
                          side: const BorderSide(color: AppTheme.border),
                        ),
                        child: ListTile(
                          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                          leading: Container(
                            height: 50,
                            width: 50,
                            decoration: BoxDecoration(
                              color: AppTheme.primary.withOpacity(0.08),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Icon(Icons.book_outlined, color: AppTheme.primary, size: 22),
                          ),
                          title: Text(
                            batch.name,
                            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          subtitle: Text(
                            batch.targetExam ?? 'General prep',
                            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
                          ),
                          trailing: const Icon(Icons.arrow_forward_ios, size: 14, color: AppTheme.textSecondary),
                          onTap: () => context.go('/batches/${batch.slug}'),
                        ),
                      );
                    },
                  ),
                const SizedBox(height: 16),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildStatCard({required Widget icon, required String value, required String label}) {
    return Container(
      padding: const EdgeInsets.all(16.0),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20.0),
        border: Border.all(color: AppTheme.border),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8.0),
            decoration: BoxDecoration(
              color: Colors.grey.shade50,
              borderRadius: BorderRadius.circular(12),
            ),
            child: icon,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  value,
                  style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w900, color: AppTheme.textPrimary),
                ),
                const SizedBox(height: 2),
                Text(
                  label,
                  style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.textSecondary),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStreakTracker(int streakCount) {
    final now = DateTime.now();
    final days = List.generate(7, (i) => now.subtract(Duration(days: 6 - i)));

    return Container(
      padding: const EdgeInsets.all(20.0),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24.0),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.whatshot, color: AppTheme.accentFlame, size: 18),
              const SizedBox(width: 8),
              const Text(
                'Weekly Progress',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
              ),
              const Spacer(),
              Text(
                '$streakCount day streak',
                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.accentFlame),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: List.generate(7, (i) {
              final active = i >= 7 - streakCount;
              final dayName = DateFormat('E').format(days[i]).substring(0, 1);
              return Column(
                children: [
                  Container(
                    height: 28,
                    width: 32,
                    decoration: BoxDecoration(
                      color: active ? AppTheme.accentFlame.withOpacity(0.85) : Colors.grey.shade100,
                      borderRadius: BorderRadius.circular(6),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    dayName,
                    style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.grey.shade400),
                  ),
                ],
              );
            }),
          ),
        ],
      ),
    );
  }
}
