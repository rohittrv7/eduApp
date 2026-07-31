import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:alledu_mobile/config/theme.dart';
import 'package:alledu_mobile/core/api/api_client.dart';

class AdminStudentsScreen extends StatefulWidget {
  const AdminStudentsScreen({super.key});

  @override
  State<AdminStudentsScreen> createState() => _AdminStudentsScreenState();
}

class _AdminStudentsScreenState extends State<AdminStudentsScreen> {
  final ApiClient _apiClient = ApiClient();
  bool _isLoading = false;
  List<dynamic> _students = [];
  List<dynamic> _batches = [];
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    setState(() => _isLoading = true);
    try {
      final resStudents = await _apiClient.get('/admin/students?limit=50');
      final resBatches = await _apiClient.get('/batches');

      dynamic studentData = resStudents.data;
      if (studentData is Map) studentData = studentData['data'] ?? studentData['students'] ?? [];

      dynamic batchData = resBatches.data;
      if (batchData is Map) batchData = batchData['data'] ?? batchData['items'] ?? [];

      setState(() {
        _students = studentData is List ? studentData : [];
        _batches = batchData is List ? batchData : [];
      });
    } catch (_) {
    } finally {
      setState(() => _isLoading = false);
    }
  }

  void _showStudentDetailModal(Map<String, dynamic> student) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return _StudentDetailSheet(
          student: student,
          batches: _batches,
          onRefresh: _fetchData,
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _students.where((s) {
      final name = (s['fullName'] ?? s['full_name'] ?? '').toString().toLowerCase();
      final email = (s['email'] ?? '').toString().toLowerCase();
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
          'Students (${_students.length})',
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
                hintText: 'Search students by name or email...',
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

          // Students List
          Expanded(
            child: RefreshIndicator(
              onRefresh: _fetchData,
              child: _isLoading
                  ? const Center(child: CircularProgressIndicator())
                  : filtered.isEmpty
                      ? const Center(
                          child: Text('No students found', style: TextStyle(fontSize: 13, color: AppTheme.textSecondary)),
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          itemCount: filtered.length,
                          itemBuilder: (context, index) {
                            final s = filtered[index];
                            final name = s['fullName'] ?? s['full_name'] ?? 'Student';
                            final email = s['email'] ?? 'No email';
                            final mobile = s['mobile'] ?? '—';
                            final isBanned = s['isBanned'] ?? s['is_banned'] ?? false;
                            final skill = s['skillLevel'] ?? s['skill_level'] ?? 'basic';

                            return Container(
                              margin: const EdgeInsets.only(bottom: 10),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(14),
                                border: Border.all(color: AppTheme.border),
                              ),
                              child: ListTile(
                                onTap: () => _showStudentDetailModal(s),
                                contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                                leading: CircleAvatar(
                                  radius: 20,
                                  backgroundColor: const Color(0xFFEFF6FF),
                                  child: Text(
                                    name.isNotEmpty ? name[0].toUpperCase() : 'S',
                                    style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppTheme.primary),
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
                                  '$email  •  $mobile  •  Skill: $skill',
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

class _StudentDetailSheet extends StatefulWidget {
  final Map<String, dynamic> student;
  final List<dynamic> batches;
  final VoidCallback onRefresh;

  const _StudentDetailSheet({
    required this.student,
    required this.batches,
    required this.onRefresh,
  });

  @override
  State<_StudentDetailSheet> createState() => _StudentDetailSheetState();
}

class _StudentDetailSheetState extends State<_StudentDetailSheet> {
  final ApiClient _apiClient = ApiClient();
  bool _isSubmitting = false;
  String? _selectedBatchId;
  final _warnController = TextEditingController();
  bool _showWarnInput = false;

  @override
  void dispose() {
    _warnController.dispose();
    super.dispose();
  }

  Future<void> _toggleBan(String id, bool currentlyBanned) async {
    setState(() => _isSubmitting = true);
    try {
      if (currentlyBanned) {
        await _apiClient.post('/admin/students/$id/unban');
      } else {
        await _apiClient.post('/admin/students/$id/ban');
      }
      widget.onRefresh();
      if (mounted) Navigator.pop(context);
    } catch (_) {
    } finally {
      setState(() => _isSubmitting = false);
    }
  }

  Future<void> _makeTeacher(String id) async {
    setState(() => _isSubmitting = true);
    try {
      await _apiClient.patch('/admin/users/$id/role', data: {'role': 'teacher'});
      widget.onRefresh();
      if (mounted) Navigator.pop(context);
    } catch (_) {
    } finally {
      setState(() => _isSubmitting = false);
    }
  }

  Future<void> _invalidateSessions(String id) async {
    setState(() => _isSubmitting = true);
    try {
      await _apiClient.post('/admin/users/$id/invalidate-sessions');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Sessions invalidated')));
        Navigator.pop(context);
      }
    } catch (_) {
    } finally {
      setState(() => _isSubmitting = false);
    }
  }

  Future<void> _sendWarning(String id) async {
    final msg = _warnController.text.trim();
    if (msg.isEmpty) return;
    setState(() => _isSubmitting = true);
    try {
      await _apiClient.post('/admin/students/$id/warning', data: {'message': msg});
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Warning sent to student')));
        Navigator.pop(context);
      }
    } catch (_) {
    } finally {
      setState(() => _isSubmitting = false);
    }
  }

  Future<void> _manualEnroll(String studentId) async {
    if (_selectedBatchId == null) return;
    setState(() => _isSubmitting = true);
    try {
      await _apiClient.post('/admin/students/$studentId/enroll', data: {'batchId': _selectedBatchId});
      widget.onRefresh();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Student enrolled successfully')));
        Navigator.pop(context);
      }
    } catch (_) {
    } finally {
      setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final s = widget.student;
    final id = s['id'] ?? '';
    final name = s['fullName'] ?? s['full_name'] ?? 'Student';
    final email = s['email'] ?? '—';
    final mobile = s['mobile'] ?? '—';
    final isBanned = s['isBanned'] ?? s['is_banned'] ?? false;
    final skill = s['skillLevel'] ?? s['skill_level'] ?? 'basic';
    final enrollmentsCount = s['enrollmentCount'] ?? s['enrollment_count'] ?? 0;
    final quizScore = s['quizScore'] ?? 0;
    final watchTimeSecs = s['totalWatchTimeSecs'] ?? 0;

    final hours = (watchTimeSecs / 3600).floor();
    final mins = ((watchTimeSecs % 3600) / 60).floor();
    final watchTimeStr = hours > 0 ? '${hours}h ${mins}m' : '${mins}m';

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
                const Text('Student Details', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.textPrimary)),
                IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(context)),
              ],
            ),
            const SizedBox(height: 12),

            // Header info
            Row(
              children: [
                CircleAvatar(
                  radius: 26,
                  backgroundColor: AppTheme.primary.withOpacity(0.1),
                  child: Text(name.isNotEmpty ? name[0].toUpperCase() : 'S', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppTheme.primary)),
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

            // Details Table
            Container(
              decoration: BoxDecoration(border: Border.all(color: AppTheme.border), borderRadius: BorderRadius.circular(14)),
              child: Column(
                children: [
                  _detailRow(Icons.email_outlined, 'Email', email),
                  const Divider(height: 1),
                  _detailRow(Icons.phone_iphone_outlined, 'Mobile', mobile),
                  const Divider(height: 1),
                  _detailRow(Icons.security, 'Skill Level', skill),
                  const Divider(height: 1),
                  _detailRow(Icons.book_outlined, 'Enrollments', '$enrollmentsCount'),
                  const Divider(height: 1),
                  _detailRow(Icons.quiz_outlined, 'Quiz Score', '$quizScore'),
                  const Divider(height: 1),
                  _detailRow(Icons.timer_outlined, 'Watch Time', watchTimeStr),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Action Buttons
            const Text('ACTIONS', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.textSecondary)),
            const SizedBox(height: 10),

            // Ban / Unban Button
            ElevatedButton(
              onPressed: _isSubmitting ? null : () => _toggleBan(id, isBanned),
              style: ElevatedButton.styleFrom(
                backgroundColor: isBanned ? Colors.green.shade600 : Colors.red.shade600,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: Text(isBanned ? 'Unban Student' : 'Ban Student'),
            ),
            const SizedBox(height: 8),

            // Make Teacher Button
            ElevatedButton(
              onPressed: _isSubmitting ? null : () => _makeTeacher(id),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF7C3AED),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: const Text('Make Teacher'),
            ),
            const SizedBox(height: 8),

            // Invalidate Sessions Button
            OutlinedButton(
              onPressed: _isSubmitting ? null : () => _invalidateSessions(id),
              style: OutlinedButton.styleFrom(shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
              child: const Text('Invalidate Sessions'),
            ),
            const SizedBox(height: 8),

            // Send Warning Button
            if (!_showWarnInput)
              OutlinedButton(
                onPressed: () => setState(() => _showWarnInput = true),
                style: OutlinedButton.styleFrom(
                  foregroundColor: Colors.orange.shade700,
                  side: BorderSide(color: Colors.orange.shade300),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: const Text('Send Warning'),
              )
            else
              Column(
                children: [
                  TextField(
                    controller: _warnController,
                    decoration: const InputDecoration(hintText: 'Warning message...'),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: ElevatedButton(
                          onPressed: _isSubmitting ? null : () => _sendWarning(id),
                          style: ElevatedButton.styleFrom(backgroundColor: Colors.orange.shade600),
                          child: const Text('Send'),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () => setState(() => _showWarnInput = false),
                          child: const Text('Cancel'),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            const SizedBox(height: 16),

            // Manual Enroll in Batch Dropdown
            if (widget.batches.isNotEmpty) ...[
              const Text('MANUAL ENROLLMENT', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.textSecondary)),
              const SizedBox(height: 6),
              DropdownButtonFormField<String>(
                value: _selectedBatchId,
                hint: const Text('Select a batch to enroll'),
                items: widget.batches.map<DropdownMenuItem<String>>((b) {
                  final bId = (b['id'] ?? '').toString();
                  final bName = (b['name'] ?? b['title'] ?? '').toString();
                  return DropdownMenuItem<String>(value: bId, child: Text(bName, overflow: TextOverflow.ellipsis));
                }).toList(),
                onChanged: (val) => setState(() => _selectedBatchId = val),
              ),
              const SizedBox(height: 8),
              ElevatedButton(
                onPressed: (_isSubmitting || _selectedBatchId == null) ? null : () => _manualEnroll(id),
                style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF4F46E5)),
                child: const Text('Enroll Student in Selected Batch'),
              ),
            ],
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
