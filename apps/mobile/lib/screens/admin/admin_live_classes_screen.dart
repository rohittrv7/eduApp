import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:alledu_mobile/config/theme.dart';
import 'package:alledu_mobile/core/api/api_client.dart';
import 'package:intl/intl.dart';

class AdminLiveClassesScreen extends StatefulWidget {
  const AdminLiveClassesScreen({super.key});

  @override
  State<AdminLiveClassesScreen> createState() => _AdminLiveClassesScreenState();
}

class _AdminLiveClassesScreenState extends State<AdminLiveClassesScreen> with SingleTickerProviderStateMixin {
  final ApiClient _apiClient = ApiClient();
  late TabController _tabController;
  bool _isLoading = false;
  List<dynamic> _liveClasses = [];

  final List<String> _filterTabs = ['All', 'Pending', 'Scheduled', 'Approved', 'Live', 'Ended'];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _filterTabs.length, vsync: this);
    _fetchLiveClasses();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _fetchLiveClasses() async {
    setState(() => _isLoading = true);
    try {
      final res = await _apiClient.get('/admin/live-classes');
      dynamic raw = res.data;
      if (raw is Map) raw = raw['data'] ?? raw['classes'] ?? [];
      setState(() {
        _liveClasses = raw is List ? raw : [];
      });
    } catch (_) {
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _approveClass(String id) async {
    try {
      await _apiClient.post('/admin/live-classes/$id/approve');
      _fetchLiveClasses();
    } catch (_) {}
  }

  Future<void> _rejectClass(String id) async {
    try {
      await _apiClient.post('/admin/live-classes/$id/reject');
      _fetchLiveClasses();
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppTheme.textPrimary),
          onPressed: () => context.pop(),
        ),
        title: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Live Classes', style: TextStyle(color: AppTheme.textPrimary, fontWeight: FontWeight.bold, fontSize: 18)),
            Text('Teacher ke scheduled classes approve/reject karo', style: TextStyle(color: AppTheme.textSecondary, fontSize: 11)),
          ],
        ),
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          labelColor: AppTheme.primary,
          unselectedLabelColor: AppTheme.textSecondary,
          indicatorColor: AppTheme.primary,
          tabs: _filterTabs.map((t) {
            int count = 0;
            if (t == 'All') {
              count = _liveClasses.length;
            } else {
              count = _liveClasses.where((c) => (c['status'] ?? '').toString().toLowerCase() == t.toLowerCase()).length;
            }
            return Tab(text: '$t ($count)');
          }).toList(),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: _fetchLiveClasses,
        child: TabBarView(
          controller: _tabController,
          children: _filterTabs.map((tab) {
            final filtered = _liveClasses.where((c) {
              if (tab == 'All') return true;
              return (c['status'] ?? '').toString().toLowerCase() == tab.toLowerCase();
            }).toList();

            if (_isLoading) {
              return const Center(child: CircularProgressIndicator());
            }

            if (filtered.isEmpty) {
              return const Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.sensors_off_outlined, size: 48, color: AppTheme.textSecondary),
                    SizedBox(height: 12),
                    Text('Koi live class nahi hai abhi', style: TextStyle(fontSize: 13, color: AppTheme.textSecondary)),
                  ],
                ),
              );
            }

            return ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: filtered.length,
              itemBuilder: (context, index) {
                final cls = filtered[index];
                final id = cls['id'] ?? '';
                final title = cls['title'] ?? 'Live Stream';
                final teacherName = cls['teacherName'] ?? cls['teacher']?['full_name'] ?? 'Instructor';
                final batchTitle = cls['batchTitle'] ?? cls['batch']?['name'] ?? 'Batch';
                final status = cls['status'] ?? 'pending';
                final scheduledAt = cls['scheduledAt'] ?? cls['scheduled_at'] ?? '';
                final scheduledDate = DateTime.tryParse(scheduledAt) ?? DateTime.now();

                final isPending = status == 'pending';

                return Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(14),
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
                          Expanded(
                            child: Text(title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppTheme.textPrimary)),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: isPending ? const Color(0xFFFEF3C7) : const Color(0xFFDCFCE7),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              status.toUpperCase(),
                              style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: isPending ? Colors.amber.shade900 : Colors.green.shade800),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text('Instructor: $teacherName  •  Batch: $batchTitle', style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
                      const SizedBox(height: 4),
                      Text('Scheduled: ${DateFormat('dd/MM/yyyy, hh:mm a').format(scheduledDate)}', style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
                      if (isPending) ...[
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Expanded(
                              child: ElevatedButton(
                                onPressed: () => _approveClass(id),
                                style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF059669)),
                                child: const Text('Approve Class'),
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: OutlinedButton(
                                onPressed: () => _rejectClass(id),
                                style: OutlinedButton.styleFrom(foregroundColor: Colors.red.shade600),
                                child: const Text('Reject'),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ],
                  ),
                );
              },
            );
          }).toList(),
        ),
      ),
    );
  }
}
