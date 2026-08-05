import 'package:flutter/material.dart';
import 'package:alledu_mobile/core/api/api_client.dart';
import 'package:alledu_mobile/config/theme.dart';

class _Announcement {
  final String id;
  final String title;
  final String message;
  final String createdAt;
  final bool isRead;

  const _Announcement({
    required this.id,
    required this.title,
    required this.message,
    required this.createdAt,
    required this.isRead,
  });

  factory _Announcement.fromJson(Map<String, dynamic> json) {
    return _Announcement(
      id: json['id']?.toString() ?? '',
      title: json['title']?.toString() ?? '',
      message: (json['message'] ?? json['body'] ?? json['content'] ?? '').toString(),
      createdAt: (json['createdAt'] ?? json['created_at'] ?? '').toString(),
      isRead: json['isRead'] == true || json['is_read'] == true,
    );
  }
}

class AnnouncementsScreen extends StatefulWidget {
  const AnnouncementsScreen({super.key});

  @override
  State<AnnouncementsScreen> createState() => _AnnouncementsScreenState();
}

class _AnnouncementsScreenState extends State<AnnouncementsScreen> {
  final _api = ApiClient();
  List<_Announcement> _items = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final res = await _api.get('/announcements');
      final raw = res.data;
      final list = raw is List ? raw : (raw is Map ? (raw['data'] ?? raw['items'] ?? []) : []);
      if (list is List) {
        setState(() {
          _items = list
              .map((e) => _Announcement.fromJson(e as Map<String, dynamic>))
              .toList();
        });
      }
    } catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  Future<void> _markRead(String id) async {
    try {
      await _api.post('/announcements/$id/read');
      setState(() {
        _items = _items.map((a) => a.id == id
            ? _Announcement(id: a.id, title: a.title, message: a.message, createdAt: a.createdAt, isRead: true)
            : a).toList();
      });
    } catch (_) {}
  }

  String _formatDate(String iso) {
    try {
      final d = DateTime.parse(iso).toLocal();
      final months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      return '${d.day} ${months[d.month - 1]}, ${d.year}';
    } catch (_) { return ''; }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: const Row(
          children: [
            Icon(Icons.campaign_outlined, color: AppTheme.primary, size: 22),
            SizedBox(width: 8),
            Text('Announcements', style: TextStyle(color: AppTheme.textPrimary, fontWeight: FontWeight.bold, fontSize: 20)),
          ],
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _load,
              child: _items.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.notifications_none_outlined, size: 56, color: AppTheme.textSecondary),
                          const SizedBox(height: 12),
                          const Text('No announcements yet', style: TextStyle(color: AppTheme.textSecondary, fontSize: 15)),
                          const SizedBox(height: 6),
                          Text('Check back later', style: TextStyle(color: Colors.grey.shade400, fontSize: 12)),
                        ],
                      ),
                    )
                  : ListView.separated(
                      padding: const EdgeInsets.all(16),
                      itemCount: _items.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 12),
                      itemBuilder: (context, i) {
                        final a = _items[i];
                        return GestureDetector(
                          onTap: () { if (!a.isRead) _markRead(a.id); },
                          child: Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: a.isRead ? Colors.white : const Color(0xFFEFF6FF),
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(color: a.isRead ? AppTheme.border : AppTheme.primary.withValues(alpha: 0.3)),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Expanded(
                                      child: Text(
                                        a.title,
                                        style: TextStyle(
                                          fontSize: 14,
                                          fontWeight: a.isRead ? FontWeight.w600 : FontWeight.bold,
                                          color: AppTheme.textPrimary,
                                        ),
                                      ),
                                    ),
                                    if (!a.isRead)
                                      Container(
                                        width: 8,
                                        height: 8,
                                        decoration: const BoxDecoration(color: AppTheme.primary, shape: BoxShape.circle),
                                      ),
                                  ],
                                ),
                                const SizedBox(height: 6),
                                Text(a.message, style: const TextStyle(fontSize: 13, color: AppTheme.textSecondary, height: 1.45)),
                                if (a.createdAt.isNotEmpty) ...[
                                  const SizedBox(height: 10),
                                  Row(
                                    children: [
                                      const Icon(Icons.access_time, size: 12, color: AppTheme.textSecondary),
                                      const SizedBox(width: 4),
                                      Text(_formatDate(a.createdAt), style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
                                    ],
                                  ),
                                ],
                              ],
                            ),
                          ),
                        );
                      },
                    ),
            ),
    );
  }
}
