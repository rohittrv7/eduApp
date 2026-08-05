import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:alledu_mobile/providers/auth_provider.dart';
import 'package:alledu_mobile/config/theme.dart';
import 'package:alledu_mobile/core/api/api_client.dart';

// ---------------------------------------------------------------------------
// Data model for user stats from /users/me/stats
// ---------------------------------------------------------------------------
class _UserStats {
  final int enrolledBatchCount;
  final double quizAvgScore;
  final int quizzesAttempted;
  final double attendancePercent;
  final int streakCount;
  final int cumulativeScore;
  final String? skillLevel;
  final List<String> achievements;

  const _UserStats({
    required this.enrolledBatchCount,
    required this.quizAvgScore,
    required this.quizzesAttempted,
    required this.attendancePercent,
    required this.streakCount,
    required this.cumulativeScore,
    this.skillLevel,
    required this.achievements,
  });

  factory _UserStats.fromJson(Map<String, dynamic> json) {
    final rawAchievements = json['achievements'];
    List<String> achievements = [];
    if (rawAchievements is List) {
      achievements = rawAchievements.map((e) => e.toString()).toList();
    }
    return _UserStats(
      enrolledBatchCount: (json['enrolledBatchCount'] ?? json['enrolled_batch_count'] ?? 0) as int,
      quizAvgScore: (json['quizAvgScore'] ?? json['quiz_avg_score'] ?? 0).toDouble(),
      quizzesAttempted: (json['quizzesAttempted'] ?? json['quizzes_attempted'] ?? 0) as int,
      attendancePercent: (json['attendancePercent'] ?? json['attendance_percent'] ?? 0).toDouble(),
      streakCount: (json['streakCount'] ?? json['streak_count'] ?? 0) as int,
      cumulativeScore: (json['cumulativeScore'] ?? json['cumulative_score'] ?? 0) as int,
      skillLevel: json['skillLevel']?.toString() ?? json['skill_level']?.toString(),
      achievements: achievements,
    );
  }
}

// ---------------------------------------------------------------------------
// Profile screen
// ---------------------------------------------------------------------------
class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final ApiClient _api = ApiClient();
  _UserStats? _stats;
  bool _loadingStats = true;

  @override
  void initState() {
    super.initState();
    _fetchStats();
  }

  Future<void> _fetchStats() async {
    try {
      final res = await _api.get('/users/me/stats');
      if (res.data != null) {
        setState(() {
          _stats = _UserStats.fromJson(res.data as Map<String, dynamic>);
          _loadingStats = false;
        });
      } else {
        setState(() => _loadingStats = false);
      }
    } catch (_) {
      setState(() => _loadingStats = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final user = auth.user;

    final role = user?.role ?? 'student';
    final name = (user?.fullName.trim().isNotEmpty == true) ? user!.fullName : 'User';
    final email = user?.email ?? 'Not linked';
    final rawMobile = user?.mobile;
    final mobile =
        (rawMobile == null || rawMobile.startsWith('email_')) ? 'Not linked' : rawMobile;

    final isAdmin = role == 'admin';
    final isTeacher = role == 'teacher';

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: Text(
          isAdmin
              ? 'Admin Console Profile'
              : (isTeacher ? 'Teacher Profile' : 'My Profile'),
          style: const TextStyle(
              color: AppTheme.textPrimary, fontWeight: FontWeight.bold, fontSize: 20),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // ----------------------------------------------------------------
            // PROFILE HEADER CARD
            // ----------------------------------------------------------------
            _buildProfileHeader(name, role, email, mobile, isAdmin, isTeacher),
            const SizedBox(height: 20),

            // ----------------------------------------------------------------
            // ADMIN VIEW
            // ----------------------------------------------------------------
            if (isAdmin) ...[
              const Text(
                'Admin Management Desk',
                style: TextStyle(
                    fontSize: 15, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
              ),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppTheme.border),
                ),
                child: Column(
                  children: [
                    _buildAdminActionTile(
                      icon: Icons.people_outline,
                      title: 'Manage Students',
                      subtitle: 'View student details, ban, enroll or promote',
                      color: Colors.purple.shade50,
                      iconColor: Colors.purple.shade600,
                      onTap: () => context.push('/admin/students'),
                    ),
                    const Divider(height: 20),
                    _buildAdminActionTile(
                      icon: Icons.supervisor_account_outlined,
                      title: 'Manage Teachers',
                      subtitle: 'Verify instructors, assign batches & permissions',
                      color: Colors.blue.shade50,
                      iconColor: Colors.blue.shade600,
                      onTap: () => context.push('/admin/teachers'),
                    ),
                    const Divider(height: 20),
                    _buildAdminActionTile(
                      icon: Icons.analytics_outlined,
                      title: 'Platform Analytics & Revenue',
                      subtitle: 'Check 30-day earnings and subscription trends',
                      color: Colors.green.shade50,
                      iconColor: Colors.green.shade600,
                      onTap: () => context.push('/admin/revenue'),
                    ),
                    const Divider(height: 20),
                    _buildAdminActionTile(
                      icon: Icons.settings_outlined,
                      title: 'System Settings',
                      subtitle: 'Configure platform parameters and keys',
                      color: Colors.orange.shade50,
                      iconColor: Colors.orange.shade600,
                      onTap: () => context.push('/admin/settings'),
                    ),
                  ],
                ),
              ),
            ]

            // ----------------------------------------------------------------
            // TEACHER VIEW
            // ----------------------------------------------------------------
            else if (isTeacher) ...[
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppTheme.border),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      '💡 Teacher management is better on web',
                      style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.textSecondary),
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'Use the web app to manage your batches, schedule live sessions, and upload course content.',
                      style: TextStyle(fontSize: 12, color: AppTheme.textSecondary, height: 1.5),
                    ),
                  ],
                ),
              ),
            ]

            // ----------------------------------------------------------------
            // STUDENT VIEW
            // ----------------------------------------------------------------
            else ...[
              // Stats grid (3 cards)
              _loadingStats
                  ? const Center(child: Padding(padding: EdgeInsets.all(16), child: CircularProgressIndicator()))
                  : _buildStatsRow(_stats),
              const SizedBox(height: 16),

              // Progress Reports link row
              _buildProgressReportsRow(),
              const SizedBox(height: 16),

              // Achievements & Badges
              _buildBadgesSection(_stats),
            ],

            const SizedBox(height: 24),

            // Logout button
            ElevatedButton.icon(
              onPressed: () => auth.logout(),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFF43F5E),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              icon: const Icon(Icons.logout, size: 18),
              label: const Text('Sign Out',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
            ),
          ],
        ),
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Profile header: avatar + name + role + email + mobile + streak badge
  // ---------------------------------------------------------------------------
  Widget _buildProfileHeader(
    String name,
    String role,
    String email,
    String mobile,
    bool isAdmin,
    bool isTeacher,
  ) {
    final streakCount = _stats?.streakCount ?? 0;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppTheme.border),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Avatar
          CircleAvatar(
            radius: 32,
            backgroundColor: AppTheme.primary.withOpacity(0.1),
            child: Text(
              name.isNotEmpty ? name[0].toUpperCase() : 'U',
              style: const TextStyle(
                  fontSize: 24, fontWeight: FontWeight.w900, color: AppTheme.primary),
            ),
          ),
          const SizedBox(width: 14),
          // Name + role + contact
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        name,
                        style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: AppTheme.textPrimary),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                // Role badge
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: isAdmin
                        ? const Color(0xFFF3E8FF)
                        : (isTeacher
                            ? const Color(0xFFECFDF5)
                            : const Color(0xFFEFF6FF)),
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(
                      color: isAdmin
                          ? const Color(0xFFD8B4FE)
                          : (isTeacher
                              ? const Color(0xFFA7F3D0)
                              : const Color(0xFFBFDBFE)),
                    ),
                  ),
                  child: Text(
                    role.toUpperCase(),
                    style: TextStyle(
                      fontSize: 9,
                      fontWeight: FontWeight.w900,
                      color: isAdmin
                          ? const Color(0xFF7C3AED)
                          : (isTeacher ? const Color(0xFF059669) : AppTheme.primary),
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    const Icon(Icons.email_outlined, size: 13, color: AppTheme.textSecondary),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        email,
                        style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    const Icon(Icons.phone_iphone_outlined,
                        size: 13, color: AppTheme.textSecondary),
                    const SizedBox(width: 4),
                    Text(
                      mobile,
                      style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary),
                    ),
                  ],
                ),
              ],
            ),
          ),
          // Streak badge (only for students)
          if (!isAdmin && !isTeacher)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: const Color(0xFFFFF7ED),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFFED7AA)),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text('🔥', style: TextStyle(fontSize: 18)),
                  const SizedBox(height: 2),
                  Text(
                    '$streakCount',
                    style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w900,
                        color: Color(0xFFF97316)),
                  ),
                  const Text(
                    'streak',
                    style: TextStyle(fontSize: 9, color: Color(0xFFF97316)),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Stats row: 3 cards
  // ---------------------------------------------------------------------------
  Widget _buildStatsRow(_UserStats? stats) {
    return Row(
      children: [
        Expanded(
          child: _StatCard(
            icon: Icons.book_outlined,
            iconColor: AppTheme.primary,
            bgColor: const Color(0xFFEFF6FF),
            label: 'Batches',
            value: '${stats?.enrolledBatchCount ?? 0}',
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _StatCard(
            icon: Icons.star_outline,
            iconColor: const Color(0xFFEAB308),
            bgColor: const Color(0xFFFEFCE8),
            label: 'Avg Score',
            value: stats != null
                ? '${stats.quizAvgScore.toStringAsFixed(0)}%'
                : '—',
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _StatCard(
            icon: Icons.check_circle_outline,
            iconColor: Colors.green,
            bgColor: const Color(0xFFECFDF5),
            label: 'Attendance',
            value: stats != null
                ? '${stats.attendancePercent.toStringAsFixed(0)}%'
                : '—',
          ),
        ),
      ],
    );
  }

  // ---------------------------------------------------------------------------
  // Progress reports link row
  // ---------------------------------------------------------------------------
  Widget _buildProgressReportsRow() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppTheme.border),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: const Color(0xFFEFF6FF),
            borderRadius: BorderRadius.circular(10),
          ),
          child: const Icon(Icons.bar_chart_outlined, size: 20, color: AppTheme.primary),
        ),
        title: const Text(
          'Progress Reports',
          style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
        ),
        subtitle: const Text(
          'View detailed performance analytics',
          style: TextStyle(fontSize: 11, color: AppTheme.textSecondary),
        ),
        trailing: const Icon(Icons.arrow_forward_ios, size: 14, color: AppTheme.textSecondary),
        onTap: () {
          // Progress reports - navigate or show coming soon
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Progress Reports coming soon!')),
          );
        },
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Badges section
  // ---------------------------------------------------------------------------
  Widget _buildBadgesSection(_UserStats? stats) {
    final streakCount = stats?.streakCount ?? 0;
    final quizAvgScore = stats?.quizAvgScore ?? 0;
    final quizzesAttempted = stats?.quizzesAttempted ?? 0;
    final attendancePercent = stats?.attendancePercent ?? 0;
    final achievements = stats?.achievements ?? [];

    // Badge unlock logic
    final streak7Unlocked = streakCount >= 7;
    final quizMasterUnlocked =
        quizzesAttempted >= 5 && quizAvgScore >= 80;
    final top10Unlocked = achievements.contains('top10') ||
        achievements.contains('TOP_10_SCHOLAR') ||
        achievements.contains('top_10_scholar');
    final perfectAttendanceUnlocked = attendancePercent >= 100;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Achievements & Badges',
            style: TextStyle(
                fontSize: 14, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
          ),
          const SizedBox(height: 14),
          _BadgeRow(
            emoji: '🔥',
            title: '7-Day Streak',
            criteria: 'Maintain a 7-day learning streak',
            unlocked: streak7Unlocked,
          ),
          const SizedBox(height: 12),
          _BadgeRow(
            emoji: '🎯',
            title: 'Quiz Master',
            criteria: '5+ quizzes with 80%+ avg score',
            unlocked: quizMasterUnlocked,
          ),
          const SizedBox(height: 12),
          _BadgeRow(
            emoji: '🏆',
            title: 'Top 10 Scholar',
            criteria: 'Reach top 10 on the leaderboard',
            unlocked: top10Unlocked,
          ),
          const SizedBox(height: 12),
          _BadgeRow(
            emoji: '✅',
            title: 'Perfect Attendance',
            criteria: '100% attendance in your batches',
            unlocked: perfectAttendanceUnlocked,
          ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Admin action tile
  // ---------------------------------------------------------------------------
  Widget _buildAdminActionTile({
    required IconData icon,
    required String title,
    required String subtitle,
    required Color color,
    required Color iconColor,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration:
                BoxDecoration(color: color, borderRadius: BorderRadius.circular(12)),
            child: Icon(icon, color: iconColor, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title,
                    style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.textPrimary)),
                const SizedBox(height: 2),
                Text(subtitle,
                    style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
              ],
            ),
          ),
          const Icon(Icons.chevron_right, size: 16, color: AppTheme.textSecondary),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Stat card widget
// ---------------------------------------------------------------------------
class _StatCard extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final Color bgColor;
  final String label;
  final String value;

  const _StatCard({
    required this.icon,
    required this.iconColor,
    required this.bgColor,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(color: bgColor, shape: BoxShape.circle),
            child: Icon(icon, size: 18, color: iconColor),
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: const TextStyle(
                fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: const TextStyle(fontSize: 10, color: AppTheme.textSecondary),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Badge row widget
// ---------------------------------------------------------------------------
class _BadgeRow extends StatelessWidget {
  final String emoji;
  final String title;
  final String criteria;
  final bool unlocked;

  const _BadgeRow({
    required this.emoji,
    required this.title,
    required this.criteria,
    required this.unlocked,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          height: 40,
          width: 40,
          decoration: BoxDecoration(
            color: unlocked
                ? const Color(0xFFFFFBEB)
                : AppTheme.background,
            shape: BoxShape.circle,
            border: Border.all(
              color: unlocked
                  ? const Color(0xFFFDE68A)
                  : AppTheme.border,
            ),
          ),
          child: Center(
            child: Text(
              emoji,
              style: TextStyle(
                  fontSize: 18,
                  color: unlocked ? null : null),
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.textPrimary),
              ),
              const SizedBox(height: 2),
              Text(
                criteria,
                style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary),
              ),
            ],
          ),
        ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
          decoration: BoxDecoration(
            color: unlocked
                ? const Color(0xFFECFDF5)
                : Colors.grey.shade100,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(
              color: unlocked
                  ? const Color(0xFFA7F3D0)
                  : Colors.grey.shade300,
            ),
          ),
          child: Text(
            unlocked ? 'Unlocked' : 'Locked',
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.bold,
              color: unlocked
                  ? const Color(0xFF059669)
                  : AppTheme.textSecondary,
            ),
          ),
        ),
      ],
    );
  }
}
