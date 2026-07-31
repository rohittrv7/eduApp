import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:alledu_mobile/providers/auth_provider.dart';
import 'package:alledu_mobile/providers/batch_provider.dart';
import 'package:alledu_mobile/config/theme.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final batchProv = Provider.of<BatchProvider>(context);
    final user = auth.user;

    final role = user?.role ?? 'student';
    final name = user?.fullName.trim().isNotEmpty == true ? user!.fullName : 'User';
    final email = user?.email ?? 'Not linked';
    final rawMobile = user?.mobile;
    final mobile = (rawMobile == null || rawMobile.startsWith('email_')) ? 'Not linked' : rawMobile;

    final isAdmin = role == 'admin';
    final isTeacher = role == 'teacher';

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: Text(
          isAdmin ? 'Admin Console Profile' : (isTeacher ? 'Teacher Profile' : 'My Profile'),
          style: const TextStyle(color: AppTheme.textPrimary, fontWeight: FontWeight.bold, fontSize: 20),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // User Header Card
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppTheme.border),
              ),
              child: Column(
                children: [
                  CircleAvatar(
                    radius: 36,
                    backgroundColor: AppTheme.primary.withOpacity(0.1),
                    backgroundImage: user?.photo != null ? NetworkImage(user!.photo!) : null,
                    child: user?.photo == null
                        ? Text(
                            name.isNotEmpty ? name[0].toUpperCase() : 'U',
                            style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w900, color: AppTheme.primary),
                          )
                        : null,
                  ),
                  const SizedBox(height: 12),
                  Text(
                    name,
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
                  ),
                  const SizedBox(height: 4),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                    decoration: BoxDecoration(
                      color: isAdmin
                          ? const Color(0xFFF3E8FF)
                          : (isTeacher ? const Color(0xFFECFDF5) : const Color(0xFFEFF6FF)),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: isAdmin
                            ? const Color(0xFFD8B4FE)
                            : (isTeacher ? const Color(0xFFA7F3D0) : const Color(0xFFBFDBFE)),
                      ),
                    ),
                    child: Text(
                      role.toUpperCase(),
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w900,
                        color: isAdmin
                            ? const Color(0xFF7C3AED)
                            : (isTeacher ? const Color(0xFF059669) : AppTheme.primary),
                      ),
                    ),
                  ),
                  const Divider(height: 24),
                  _buildContactRow(Icons.email_outlined, 'Email', email),
                  const SizedBox(height: 10),
                  _buildContactRow(Icons.phone_iphone_outlined, 'Mobile', mobile),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // ADMIN Profile View
            if (isAdmin) ...[
              const Text(
                'Admin Management Desk',
                style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
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
            // TEACHER Profile View
            else if (isTeacher) ...[
              const Text(
                'Instructor Desk',
                style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(child: _buildMetricCard('📚', '${batchProv.enrolledBatches.length}', 'Batches')),
                  const SizedBox(width: 10),
                  Expanded(child: _buildMetricCard('📹', '12', 'Videos')),
                  const SizedBox(width: 10),
                  Expanded(child: _buildMetricCard('🎓', '84', 'Students')),
                ],
              ),
              const SizedBox(height: 16),
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
                      icon: Icons.videocam_outlined,
                      title: 'Schedule Live Lecture',
                      subtitle: 'Set up an upcoming stream session',
                      color: Colors.red.shade50,
                      iconColor: Colors.red.shade600,
                      onTap: () => context.go('/live'),
                    ),
                    const Divider(height: 20),
                    _buildAdminActionTile(
                      icon: Icons.upload_file_outlined,
                      title: 'Upload Course Video',
                      subtitle: 'Add recorded lectures to your batches',
                      color: Colors.blue.shade50,
                      iconColor: Colors.blue.shade600,
                      onTap: () => context.go('/batches'),
                    ),
                  ],
                ),
              ),
            ]
            // STUDENT Profile View (Matches Web Student Profile 1:1)
            else ...[
              Row(
                children: [
                  Expanded(child: _buildMetricCard('🔥 Streak', '${user?.streakCount ?? 0} days', 'Active days')),
                  const SizedBox(width: 10),
                  Expanded(child: _buildMetricCard('⭐ Skill', user?.skillLevel ?? 'Basic', 'Rating Level')),
                  const SizedBox(width: 10),
                  Expanded(child: _buildMetricCard('🎓 Courses', '${batchProv.enrolledBatches.length}', 'Enrolled')),
                ],
              ),
              const SizedBox(height: 20),
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
                      'Badges & Achievements',
                      style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
                    ),
                    const SizedBox(height: 12),
                    _buildBadgeItem('🥇', 'Prime Explorer', 'Joined 1st Course batch'),
                    const SizedBox(height: 10),
                    _buildBadgeItem('🔥', 'Streak Master', 'Held a 5-day streak block'),
                    const SizedBox(height: 10),
                    _buildBadgeItem('🎓', 'Scholar Class', 'Enrolled in 2+ active classes'),
                  ],
                ),
              ),
            ],

            const SizedBox(height: 24),

            // Sign Out Button
            ElevatedButton.icon(
              onPressed: () => auth.logout(),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFF43F5E),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              icon: const Icon(Icons.logout, size: 18),
              label: const Text('Sign Out', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildContactRow(IconData icon, String label, String value) {
    return Row(
      children: [
        Icon(icon, size: 16, color: AppTheme.textSecondary),
        const SizedBox(width: 10),
        Text('$label: ', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.textSecondary)),
        Expanded(
          child: Text(
            value,
            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.textPrimary),
            textAlign: TextAlign.end,
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }

  Widget _buildMetricCard(String emoji, String value, String label) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(
        children: [
          Text(emoji, style: const TextStyle(fontSize: 18)),
          const SizedBox(height: 4),
          Text(value, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.textPrimary)),
          Text(label, style: const TextStyle(fontSize: 10, color: AppTheme.textSecondary)),
        ],
      ),
    );
  }

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
            decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(12)),
            child: Icon(icon, color: iconColor, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.textPrimary)),
                const SizedBox(height: 2),
                Text(subtitle, style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
              ],
            ),
          ),
          const Icon(Icons.chevron_right, size: 16, color: AppTheme.textSecondary),
        ],
      ),
    );
  }

  Widget _buildBadgeItem(String emoji, String title, String subtitle) {
    return Row(
      children: [
        Container(
          height: 36,
          width: 36,
          decoration: BoxDecoration(
            color: AppTheme.background,
            shape: BoxShape.circle,
            border: Border.all(color: AppTheme.border),
          ),
          child: Center(child: Text(emoji, style: const TextStyle(fontSize: 16))),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.textPrimary)),
              Text(subtitle, style: const TextStyle(fontSize: 10, color: AppTheme.textSecondary)),
            ],
          ),
        ),
      ],
    );
  }
}
