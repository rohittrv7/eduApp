import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:alledu_mobile/config/theme.dart';
import 'package:alledu_mobile/core/api/api_client.dart';
import 'package:intl/intl.dart';

class AdminTeachersScreen extends StatefulWidget {
  const AdminTeachersScreen({super.key});

  @override
  State<AdminTeachersScreen> createState() => _AdminTeachersScreenState();
}

class _AdminTeachersScreenState extends State<AdminTeachersScreen> {
  final ApiClient _apiClient = ApiClient();
  bool _isLoading = false;
  List<dynamic> _teachers = [];
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _fetchTeachers();
  }

  Future<void> _fetchTeachers() async {
    setState(() => _isLoading = true);
    try {
      final res = await _apiClient.get('/admin/teachers');
      dynamic raw = res.data;
      if (raw is Map) raw = raw['data'] ?? raw['teachers'] ?? [];
      setState(() {
        _teachers = raw is List ? raw : [];
      });
    } catch (_) {
    } finally {
      setState(() => _isLoading = false);
    }
  }

  void _showTeacherDetailModal(Map<String, dynamic> teacher) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return _TeacherDetailSheet(
          teacher: teacher,
          onRefresh: _fetchTeachers,
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _teachers.where((t) {
      final name = (t['fullName'] ?? t['full_name'] ?? '').toString().toLowerCase();
      final email = (t['email'] ?? '').toString().toLowerCase();
      return name.contains(_searchQuery) || email.contains(_searchQuery);
    }).toList();

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppTheme.textPrimary),
          onPressed: () => context.pop(),
        ),
        title: Text(
          'Teachers (${_teachers.length})',
          style: const TextStyle(color: AppTheme.textPrimary, fontWeight: FontWeight.bold, fontSize: 18),
        ),
      ),
      body: Column(
        children: [
          // Search Input Bar
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: TextField(
              onChanged: (val) => setState(() => _searchQuery = val.toLowerCase()),
              decoration: InputDecoration(
                filled: true,
                fillColor: Colors.white,
                hintText: 'Search teachers...',
                prefixIcon: const Icon(Icons.search, size: 18, color: AppTheme.textSecondary),
                contentPadding: const EdgeInsets.symmetric(vertical: 12),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: const BorderSide(color: AppTheme.border),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: const BorderSide(color: AppTheme.primary, width: 1.5),
                ),
              ),
            ),
          ),

          // Teachers List
          Expanded(
            child: RefreshIndicator(
              onRefresh: _fetchTeachers,
              child: _isLoading
                  ? const Center(child: CircularProgressIndicator())
                  : filtered.isEmpty
                      ? const Center(child: Text('No teachers found', style: TextStyle(fontSize: 13, color: AppTheme.textSecondary)))
                      : ListView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          itemCount: filtered.length,
                          itemBuilder: (context, index) {
                            final t = filtered[index];
                            final name = t['fullName'] ?? t['full_name'] ?? 'Teacher';
                            final email = t['email'] ?? 'No email';
                            final mobile = t['mobile'] ?? '—';
                            final batchCount = t['batchCount'] ?? t['batch_count'] ?? 0;
                            final isBanned = t['isBanned'] ?? t['is_banned'] ?? false;

                            return Container(
                              margin: const EdgeInsets.only(bottom: 10),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(14),
                                border: Border.all(color: AppTheme.border),
                              ),
                              child: ListTile(
                                onTap: () => _showTeacherDetailModal(t),
                                contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                                leading: CircleAvatar(
                                  radius: 20,
                                  backgroundColor: const Color(0xFFF3E8FF),
                                  child: Text(
                                    name.isNotEmpty ? name[0].toUpperCase() : 'T',
                                    style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF7C3AED)),
                                  ),
                                ),
                                title: Row(
                                  children: [
                                    Expanded(
                                      child: Text(
                                        name,
                                        style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: isBanned ? const Color(0xFFFEE2E2) : const Color(0xFFDCFCE7),
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: Text(
                                        isBanned ? 'Banned' : 'Active',
                                        style: TextStyle(
                                          fontSize: 10,
                                          fontWeight: FontWeight.bold,
                                          color: isBanned ? Colors.red.shade700 : Colors.green.shade700,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                subtitle: Text(
                                  '$email  •  $mobile  •  $batchCount batches',
                                  style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                trailing: const Icon(Icons.chevron_right, size: 18, color: AppTheme.textSecondary),
                              ),
                            );
                          },
                        ),
            ),
          ),
        ],
      ),
    );
  }
}

class _TeacherDetailSheet extends StatefulWidget {
  final Map<String, dynamic> teacher;
  final VoidCallback onRefresh;

  const _TeacherDetailSheet({
    required this.teacher,
    required this.onRefresh,
  });

  @override
  State<_TeacherDetailSheet> createState() => _TeacherDetailSheetState();
}

class _TeacherDetailSheetState extends State<_TeacherDetailSheet> {
  final ApiClient _apiClient = ApiClient();
  final _payoutController = TextEditingController();
  bool _isSubmitting = false;
  double _totalEarnings = 0.0;

  @override
  void initState() {
    super.initState();
    _fetchEarnings();
  }

  @override
  void dispose() {
    _payoutController.dispose();
    super.dispose();
  }

  Future<void> _fetchEarnings() async {
    final id = widget.teacher['id'] ?? '';
    try {
      final res = await _apiClient.get('/admin/teachers/$id/earnings');
      if (res.data != null) {
        setState(() {
          _totalEarnings = (res.data['totalEarnings'] as num?)?.toDouble() ?? 0.0;
        });
      }
    } catch (_) {}
  }

  Future<void> _handlePayout(String id) async {
    final amt = double.tryParse(_payoutController.text.trim());
    if (amt == null || amt <= 0) return;
    final messenger = ScaffoldMessenger.of(context);
    final navigator = Navigator.of(context);
    setState(() => _isSubmitting = true);
    try {
      await _apiClient.post('/admin/teachers/$id/payout', data: {'amount': amt});
      _payoutController.clear();
      await _fetchEarnings();
      if (mounted) {
        messenger.showSnackBar(const SnackBar(content: Text('Payout processed successfully!')));
        navigator.pop();
      }
    } catch (_) {
    } finally {
      setState(() => _isSubmitting = false);
    }
  }

  Future<void> _toggleBan(String id, bool currentlyBanned) async {
    final navigator = Navigator.of(context);
    setState(() => _isSubmitting = true);
    try {
      if (currentlyBanned) {
        await _apiClient.post('/admin/students/$id/unban');
      } else {
        await _apiClient.post('/admin/students/$id/ban');
      }
      widget.onRefresh();
      if (mounted) navigator.pop();
    } catch (_) {
    } finally {
      setState(() => _isSubmitting = false);
    }
  }

  Future<void> _demoteToStudent(String id) async {
    final navigator = Navigator.of(context);
    setState(() => _isSubmitting = true);
    try {
      await _apiClient.patch('/admin/users/$id/role', data: {'role': 'student'});
      widget.onRefresh();
      if (mounted) navigator.pop();
    } catch (_) {
    } finally {
      setState(() => _isSubmitting = false);
    }
  }

  Future<void> _invalidateSessions(String id) async {
    final messenger = ScaffoldMessenger.of(context);
    final navigator = Navigator.of(context);
    setState(() => _isSubmitting = true);
    try {
      await _apiClient.post('/admin/users/$id/invalidate-sessions');
      if (mounted) {
        messenger.showSnackBar(const SnackBar(content: Text('Sessions invalidated')));
        navigator.pop();
      }
    } catch (_) {
    } finally {
      setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = widget.teacher;
    final id = t['id'] ?? '';
    final name = t['fullName'] ?? t['full_name'] ?? 'Teacher';
    final email = t['email'] ?? '—';
    final mobile = t['mobile'] ?? '—';
    final batchCount = t['batchCount'] ?? t['batch_count'] ?? 0;
    final isBanned = t['isBanned'] ?? t['is_banned'] ?? false;
    final joinedAtStr = t['joinedAt'] ?? t['created_at'] ?? '';
    final joinedDate = DateTime.tryParse(joinedAtStr) ?? DateTime.now();

    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: const EdgeInsets.all(20),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Teacher Details', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.textPrimary)),
                IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(context)),
              ],
            ),
            const SizedBox(height: 12),

            Row(
              children: [
                CircleAvatar(
                  radius: 26,
                  backgroundColor: const Color(0xFFF3E8FF),
                  child: Text(name.isNotEmpty ? name[0].toUpperCase() : 'T', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Color(0xFF7C3AED))),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(name, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textPrimary)),
                      const SizedBox(height: 4),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: isBanned ? const Color(0xFFFEE2E2) : const Color(0xFFDCFCE7),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          isBanned ? 'Banned' : 'Active',
                          style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: isBanned ? Colors.red.shade700 : Colors.green.shade700),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Details Box
            Container(
              decoration: BoxDecoration(border: Border.all(color: AppTheme.border), borderRadius: BorderRadius.circular(14)),
              child: Column(
                children: [
                  _detailRow(Icons.email_outlined, 'Email', email),
                  const Divider(height: 1),
                  _detailRow(Icons.phone_iphone_outlined, 'Mobile', mobile),
                  const Divider(height: 1),
                  _detailRow(Icons.book_outlined, 'Batches', '$batchCount batches'),
                  const Divider(height: 1),
                  _detailRow(Icons.calendar_today_outlined, 'Joined', DateFormat('dd/MM/yyyy').format(joinedDate)),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Earnings Section (1:1 Web Screenshot)
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
                  const Row(
                    children: [
                      Icon(Icons.trending_up, color: Colors.green, size: 18),
                      SizedBox(width: 6),
                      Text('Earnings', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppTheme.textPrimary)),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    '₹${_totalEarnings.toStringAsFixed(0)}',
                    style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Color(0xFF047857)),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _payoutController,
                          keyboardType: TextInputType.number,
                          decoration: const InputDecoration(
                            hintText: 'Payout amount (₹)',
                            contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      ElevatedButton(
                        onPressed: _isSubmitting ? null : () => _handlePayout(id),
                        style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF3B82F6)),
                        child: const Text('Pay'),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            const Text('ACTIONS', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.textSecondary)),
            const SizedBox(height: 10),

            // Ban Teacher Button
            ElevatedButton(
              onPressed: _isSubmitting ? null : () => _toggleBan(id, isBanned),
              style: ElevatedButton.styleFrom(
                backgroundColor: isBanned ? Colors.green.shade600 : Colors.red.shade600,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: Text(isBanned ? 'Unban Teacher' : 'Ban Teacher'),
            ),
            const SizedBox(height: 8),

            // Make Student Button
            ElevatedButton(
              onPressed: _isSubmitting ? null : () => _demoteToStudent(id),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFF97316),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: const Text('Make Student'),
            ),
            const SizedBox(height: 8),

            // Invalidate Sessions Button
            OutlinedButton(
              onPressed: _isSubmitting ? null : () => _invalidateSessions(id),
              style: OutlinedButton.styleFrom(shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
              child: const Text('Invalidate Sessions'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _detailRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      child: Row(
        children: [
          Icon(icon, size: 16, color: AppTheme.textSecondary),
          const SizedBox(width: 10),
          Text(label, style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
          const Spacer(),
          Text(value, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.textPrimary)),
        ],
      ),
    );
  }
}
