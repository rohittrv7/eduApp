import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
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

    final name = user?.fullName.isNotEmpty == true ? user!.fullName : 'Student';
    final email = user?.email ?? 'Not linked';
    final rawMobile = user?.mobile;
    final mobile = (rawMobile == null || rawMobile.startsWith('email_')) ? 'Not linked' : rawMobile;
    final streak = user?.streakCount ?? 0;
    final skill = user?.skillLevel ?? 'Beginner';
    final batchesCount = batchProv.enrolledBatches.length;

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: const Text(
          'My Profile',
          style: TextStyle(color: AppTheme.textPrimary, fontWeight: FontWeight.bold, fontSize: 20),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Avatar profile card
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
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
                            name.substring(0, 1).toUpperCase(),
                            style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w900, color: AppTheme.primary),
                          )
                        : null,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    name,
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
                  ),
                  const SizedBox(height: 4),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: AppTheme.primary.withOpacity(0.08),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      user?.role.toUpperCase() ?? 'STUDENT',
                      style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: AppTheme.primary),
                    ),
                  ),
                  const Divider(height: 32),
                  
                  // Contact details
                  _buildContactItem(Icons.email_outlined, 'Email', email),
                  const SizedBox(height: 12),
                  _buildContactItem(Icons.phone_iphone_outlined, 'Mobile', mobile),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Metrics row
            Row(
              children: [
                Expanded(
                  child: _buildMetricCard('🔥 Streak', '$streak days', 'Active days'),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildMetricCard('⭐ Skill', skill, 'Rating Level'),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildMetricCard('🎓 Courses', '$batchesCount', 'Enrolled'),
                ),
              ],
            ),
            const SizedBox(height: 24),

            // Achievements section
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: AppTheme.border),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Badges & Achievements',
                    style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
                  ),
                  const SizedBox(height: 16),
                  
                  // Badges list
                  _buildBadgeRow('🥇', 'Prime Explorer', 'Joined 1st Course batch'),
                  const SizedBox(height: 12),
                  _buildBadgeRow('🔥', 'Streak Master', 'Held a 5-day streak block'),
                  const SizedBox(height: 12),
                  _buildBadgeRow('🎓', 'Scholar Class', 'Enrolled in 2+ active classes'),
                ],
              ),
            ),
            const SizedBox(height: 32),

            // Logout Button
            ElevatedButton.icon(
              onPressed: () => auth.logout(),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFF43F5E),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              ),
              icon: const Icon(Icons.logout, size: 18),
              label: const Text('Sign Out'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildContactItem(IconData icon, String label, String value) {
    return Row(
      children: [
        Icon(icon, size: 18, color: AppTheme.textSecondary),
        const SizedBox(width: 12),
        Text(
          '$label: ',
          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.textSecondary),
        ),
        Expanded(
          child: Text(
            value,
            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppTheme.textPrimary),
            textAlign: TextAlign.end,
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }

  Widget _buildMetricCard(String iconEmoji, String value, String label) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Text(iconEmoji, style: const TextStyle(fontSize: 20)),
          const SizedBox(height: 8),
          Text(
            value,
            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: AppTheme.textPrimary),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: const TextStyle(fontSize: 10, color: AppTheme.textSecondary, fontWeight: FontWeight.bold),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildBadgeRow(String emoji, String title, String subtitle) {
    return Row(
      children: [
        Container(
          height: 40,
          width: 40,
          decoration: BoxDecoration(
            color: AppTheme.background,
            shape: BoxShape.circle,
            border: Border.all(color: AppTheme.border),
          ),
          child: Center(child: Text(emoji, style: const TextStyle(fontSize: 18))),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
              ),
              const SizedBox(height: 2),
              Text(
                subtitle,
                style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary, fontWeight: FontWeight.w500),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
