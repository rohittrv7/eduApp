import 'package:flutter/material.dart';
import 'package:alledu_mobile/core/api/api_client.dart';
import 'package:alledu_mobile/config/theme.dart';
import 'package:alledu_mobile/providers/auth_provider.dart';
import 'package:provider/provider.dart';

class _LeaderboardEntry {
  final String userId;
  final String fullName;
  final int rank;
  final int score;
  final String? photo;

  const _LeaderboardEntry({
    required this.userId,
    required this.fullName,
    required this.rank,
    required this.score,
    this.photo,
  });

  factory _LeaderboardEntry.fromJson(Map<String, dynamic> json) {
    return _LeaderboardEntry(
      userId: json['userId']?.toString() ?? json['user_id']?.toString() ?? '',
      fullName: json['fullName']?.toString() ?? json['full_name']?.toString() ?? 'Student',
      rank: (json['rank'] as num?)?.toInt() ?? 0,
      score: (json['score'] ?? json['cumulative_score'] ?? 0 as num).toInt(),
      photo: json['photo']?.toString(),
    );
  }
}

class LeaderboardScreen extends StatefulWidget {
  const LeaderboardScreen({super.key});

  @override
  State<LeaderboardScreen> createState() => _LeaderboardScreenState();
}

class _LeaderboardScreenState extends State<LeaderboardScreen> {
  final _api = ApiClient();
  List<_LeaderboardEntry> _entries = [];
  int? _myRank;
  int? _myScore;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final res = await _api.get('/leaderboard');
      final raw = res.data;
      final data = (raw is Map) ? (raw['data'] ?? raw) : raw;
      if (data is Map) {
        final list = data['entries'] as List? ?? [];
        _entries = list
            .map((e) => _LeaderboardEntry.fromJson(e as Map<String, dynamic>))
            .take(10)
            .toList();
        _myRank = (data['myRank'] as num?)?.toInt();
        _myScore = (data['myScore'] as num?)?.toInt();
      } else if (data is List) {
        _entries = data
            .map((e) => _LeaderboardEntry.fromJson(e as Map<String, dynamic>))
            .take(10)
            .toList();
      }
    } catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  Widget _rankWidget(int rank) {
    if (rank == 1) return const Text('🥇', style: TextStyle(fontSize: 20));
    if (rank == 2) return const Text('🥈', style: TextStyle(fontSize: 20));
    if (rank == 3) return const Text('🥉', style: TextStyle(fontSize: 20));
    return SizedBox(
      width: 28,
      child: Text(
        '$rank',
        textAlign: TextAlign.center,
        style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.textSecondary),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final myId = auth.user?.id ?? '';

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: const Row(
          children: [
            Text('🏆', style: TextStyle(fontSize: 20)),
            SizedBox(width: 8),
            Text(
              'Leaderboard',
              style: TextStyle(color: AppTheme.textPrimary, fontWeight: FontWeight.bold, fontSize: 20),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: AppTheme.textSecondary),
            onPressed: _load,
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _load,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  // My rank card
                  if (_myRank != null) ...[
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: const Color(0xFFEFF6FF),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: AppTheme.primary.withValues(alpha: 0.4)),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.person_outlined, color: AppTheme.primary, size: 20),
                          const SizedBox(width: 10),
                          const Text('Your Rank', style: TextStyle(fontSize: 13, color: AppTheme.textSecondary)),
                          const Spacer(),
                          Text(
                            '#$_myRank',
                            style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: AppTheme.primary),
                          ),
                          if (_myScore != null) ...[
                            const SizedBox(width: 12),
                            Text(
                              '$_myScore pts',
                              style: const TextStyle(fontSize: 13, color: AppTheme.textSecondary),
                            ),
                          ],
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],

                  // Leaderboard list
                  Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppTheme.border),
                    ),
                    child: _entries.isEmpty
                        ? const Padding(
                            padding: EdgeInsets.all(32),
                            child: Center(
                              child: Text('No entries yet', style: TextStyle(color: AppTheme.textSecondary)),
                            ),
                          )
                        : ListView.separated(
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            itemCount: _entries.length,
                            separatorBuilder: (_, __) => const Divider(height: 1, indent: 16, endIndent: 16),
                            itemBuilder: (context, i) {
                              final e = _entries[i];
                              final isMe = e.userId == myId;
                              return Container(
                                color: isMe ? const Color(0xFFEFF6FF) : Colors.transparent,
                                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                                child: Row(
                                  children: [
                                    _rankWidget(e.rank),
                                    const SizedBox(width: 12),
                                    // Avatar
                                    CircleAvatar(
                                      radius: 18,
                                      backgroundColor: AppTheme.primary,
                                      backgroundImage: e.photo != null ? NetworkImage(e.photo!) : null,
                                      child: e.photo == null
                                          ? Text(
                                              e.fullName.isNotEmpty ? e.fullName[0].toUpperCase() : 'S',
                                              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                                            )
                                          : null,
                                    ),
                                    const SizedBox(width: 10),
                                    Expanded(
                                      child: Row(
                                        children: [
                                          Flexible(
                                            child: Text(
                                              e.fullName,
                                              style: TextStyle(
                                                fontSize: 14,
                                                fontWeight: isMe ? FontWeight.bold : FontWeight.w500,
                                                color: isMe ? AppTheme.primary : AppTheme.textPrimary,
                                              ),
                                              overflow: TextOverflow.ellipsis,
                                            ),
                                          ),
                                          if (isMe) ...[
                                            const SizedBox(width: 6),
                                            Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                              decoration: BoxDecoration(
                                                color: AppTheme.primary,
                                                borderRadius: BorderRadius.circular(6),
                                              ),
                                              child: const Text('Me', style: TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold)),
                                            ),
                                          ],
                                        ],
                                      ),
                                    ),
                                    Text(
                                      '${e.score} pts',
                                      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
                                    ),
                                  ],
                                ),
                              );
                            },
                          ),
                  ),
                ],
              ),
            ),
    );
  }
}
