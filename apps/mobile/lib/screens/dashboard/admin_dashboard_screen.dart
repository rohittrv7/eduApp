import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:alledu_mobile/providers/auth_provider.dart';
import 'package:alledu_mobile/config/theme.dart';
import 'package:alledu_mobile/core/api/api_client.dart';

class AdminDashboardScreen extends StatefulWidget {
  const AdminDashboardScreen({super.key});

  @override
  State<AdminDashboardScreen> createState() => _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends State<AdminDashboardScreen> {
  final ApiClient _apiClient = ApiClient();
  bool _isLoading = false;
  Map<String, dynamic>? _adminData;

  @override
  void initState() {
    super.initState();
    _fetchAdminData();
  }

  Future<void> _fetchAdminData() async {
    setState(() => _isLoading = true);
    try {
      final res = await _apiClient.get('/admin/dashboard');
      setState(() {
        _adminData = res.data as Map<String, dynamic>?;
      });
    } catch (_) {
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final user = auth.user;

    final revenue = _adminData?['revenue'] ?? {};
    final todayRevenue = revenue['today'] ?? 0;
    final weekRevenue = revenue['week'] ?? 0;
    final monthRevenue = revenue['month'] ?? 0;

    final enrollments = _adminData?['newEnrollments'] ?? {};
    final todayEnrollments = enrollments['today'] ?? 0;

    final activeSubs = _adminData?['activeSubscriptions'] ?? 0;
    final dailyRevenue = (_adminData?['dailyRevenue'] as List?) ?? [];

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Admin Control Panel',
              style: TextStyle(fontSize: 12, color: AppTheme.textSecondary, fontWeight: FontWeight.w500),
            ),
            Text(
              user?.fullName ?? 'Admin User',
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
            ),
          ],
        ),
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 16),
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: const Color(0xFFF3E8FF),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFD8B4FE)),
            ),
            child: const Row(
              children: [
                Icon(Icons.admin_panel_settings, size: 14, color: Color(0xFF7C3AED)),
                SizedBox(width: 4),
                Text('ADMIN', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Color(0xFF7C3AED))),
              ],
            ),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _fetchAdminData,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(20.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // 4 Metrics Grid (1:1 Web Admin Dashboard)
              Row(
                children: [
                  Expanded(
                    child: _buildMetricCard(
                      label: "Today's Revenue",
                      value: '₹$todayRevenue',
                      subText: 'Week: ₹$weekRevenue',
                      bgColor: const Color(0xFFECFDF5),
                      textColor: const Color(0xFF047857),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _buildMetricCard(
                      label: 'Active Subscriptions',
                      value: '$activeSubs',
                      bgColor: const Color(0xFFEFF6FF),
                      textColor: const Color(0xFF1D4ED8),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: _buildMetricCard(
                      label: "Today Enrollments",
                      value: '$todayEnrollments',
                      bgColor: const Color(0xFFF5F3FF),
                      textColor: const Color(0xFF6D28D9),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _buildMetricCard(
                      label: 'Monthly Revenue',
                      value: '₹$monthRevenue',
                      bgColor: const Color(0xFFFFF7ED),
                      textColor: const Color(0xFFC2410C),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),

              // Daily Revenue Bar Chart (1:1 Web)
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
                      '30-Day Daily Revenue',
                      style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
                    ),
                    const SizedBox(height: 16),
                    if (_isLoading)
                      const Center(child: Padding(padding: EdgeInsets.all(16), child: CircularProgressIndicator()))
                    else if (dailyRevenue.isEmpty)
                      const Padding(
                        padding: EdgeInsets.symmetric(vertical: 20),
                        child: Center(
                          child: Text('No daily revenue recorded yet', style: TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
                        ),
                      )
                    else
                      SizedBox(
                        height: 100,
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: dailyRevenue.map((d) {
                            final amount = (d['amount'] as num?)?.toDouble() ?? 0.0;
                            final max = 10000.0;
                            final heightFactor = (amount / max).clamp(0.1, 1.0);
                            return Expanded(
                              child: Tooltip(
                                message: '${d['date']}: ₹$amount',
                                child: Container(
                                  margin: const EdgeInsets.symmetric(horizontal: 1),
                                  height: 100 * heightFactor,
                                  decoration: BoxDecoration(
                                    color: AppTheme.primary,
                                    borderRadius: BorderRadius.circular(3),
                                  ),
                                ),
                              ),
                            );
                          }).toList(),
                        ),
                      ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Quick Admin Actions (1:1 Web)
              const Text(
                'Admin Management Shortcuts',
                style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
              ),
              const SizedBox(height: 12),
              GridView.count(
                crossAxisCount: 2,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                crossAxisSpacing: 10,
                mainAxisSpacing: 10,
                childAspectRatio: 2.2,
                children: [
                  _buildShortcutCard('👨‍🎓', 'Students', () => context.push('/admin/students')),
                  _buildShortcutCard('👨‍🏫', 'Teachers', () => context.push('/admin/teachers')),
                  _buildShortcutCard('📺', 'Live Classes', () => context.push('/admin/live-classes')),
                  _buildShortcutCard('💰', 'Revenue', () => context.push('/admin/revenue')),
                  _buildShortcutCard('📚', 'Batches', () => context.go('/batches')),
                  _buildShortcutCard('⚙️', 'Settings', () => context.push('/admin/settings')),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMetricCard({
    required String label,
    required String value,
    String? subText,
    required Color bgColor,
    required Color textColor,
  }) {
    return Container(
      padding: const EdgeInsets.all(14.0),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16.0),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary, fontWeight: FontWeight.bold)),
          const SizedBox(height: 6),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(color: bgColor, borderRadius: BorderRadius.circular(8)),
            child: Text(value, style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: textColor)),
          ),
          if (subText != null) ...[
            const SizedBox(height: 4),
            Text(subText, style: const TextStyle(fontSize: 10, color: AppTheme.textSecondary)),
          ],
        ],
      ),
    );
  }

  Widget _buildShortcutCard(String emoji, String title, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppTheme.border),
        ),
        child: Row(
          children: [
            Text(emoji, style: const TextStyle(fontSize: 20)),
            const SizedBox(width: 8),
            Text(title, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.textPrimary)),
          ],
        ),
      ),
    );
  }
}
