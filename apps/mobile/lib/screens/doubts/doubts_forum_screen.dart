import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:alledu_mobile/providers/doubt_provider.dart';
import 'package:alledu_mobile/config/theme.dart';
import 'package:alledu_mobile/core/utils/helpers.dart';
import 'package:alledu_mobile/models/doubt.dart';

class DoubtsForumScreen extends StatefulWidget {
  const DoubtsForumScreen({super.key});

  @override
  State<DoubtsForumScreen> createState() => _DoubtsForumScreenState();
}

class _DoubtsForumScreenState extends State<DoubtsForumScreen> {
  String _filterStatus = 'all'; // 'all' | 'open' | 'resolved'

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<DoubtProvider>(context, listen: false).fetchDoubts();
    });
  }

  @override
  Widget build(BuildContext context) {
    final doubtProv = Provider.of<DoubtProvider>(context);

    // Apply client filters
    final filteredDoubts = doubtProv.doubts.where((d) {
      if (_filterStatus == 'all') return true;
      return d.status == _filterStatus;
    }).toList();

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: const Text(
          'Doubt Clearance Desk',
          style: TextStyle(color: AppTheme.textPrimary, fontWeight: FontWeight.bold, fontSize: 20),
        ),
      ),
      body: Column(
        children: [
          // Filters row
          Container(
            color: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
            child: Row(
              children: [
                _buildFilterButton('All Doubts', 'all'),
                const SizedBox(width: 8),
                _buildFilterButton('Open', 'open'),
                const SizedBox(width: 8),
                _buildFilterButton('Resolved', 'resolved'),
              ],
            ),
          ),
          
          Expanded(
            child: RefreshIndicator(
              onRefresh: () => doubtProv.fetchDoubts(),
              child: doubtProv.isLoading && doubtProv.doubts.isEmpty
                  ? const Center(child: CircularProgressIndicator())
                  : filteredDoubts.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Text('💬', style: TextStyle(fontSize: 40)),
                              const SizedBox(height: 12),
                              Text(
                                'No ${_filterStatus == 'all' ? '' : _filterStatus} doubts found',
                                style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.textSecondary),
                              ),
                            ],
                          ),
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: filteredDoubts.length,
                          itemBuilder: (context, index) {
                            final doubt = filteredDoubts[index];
                            return _buildDoubtCard(doubt, doubtProv);
                          },
                        ),
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: AppTheme.primary,
        foregroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        onPressed: () => context.push('/doubts/new'),
        child: const Icon(Icons.add),
      ),
    );
  }

  Widget _buildFilterButton(String label, String status) {
    final active = _filterStatus == status;
    return InkWell(
      onTap: () => setState(() => _filterStatus = status),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: active ? AppTheme.primary : Colors.grey.shade100,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.bold,
            color: active ? Colors.white : AppTheme.textSecondary,
          ),
        ),
      ),
    );
  }

  Widget _buildDoubtCard(Doubt doubt, DoubtProvider provider) {
    final studentName = doubt.student.fullName;
    final initials = studentName.isNotEmpty ? studentName.substring(0, 1).toUpperCase() : 'S';

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Author info
            Row(
              children: [
                CircleAvatar(
                  radius: 16,
                  backgroundColor: AppTheme.secondary.withOpacity(0.2),
                  child: Text(initials, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.secondary)),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(studentName, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.textPrimary)),
                      Text(UIHelpers.formatDate(doubt.createdAt), style: const TextStyle(fontSize: 10)),
                    ],
                  ),
                ),
                
                // Status banner
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: doubt.status == 'resolved' ? Colors.green.shade50 : Colors.orange.shade50,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: doubt.status == 'resolved' ? Colors.green.shade200 : Colors.orange.shade200),
                  ),
                  child: Text(
                    doubt.status.toUpperCase(),
                    style: TextStyle(
                      fontSize: 9,
                      fontWeight: FontWeight.w900,
                      color: doubt.status == 'resolved' ? Colors.green.shade700 : Colors.orange.shade700,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            
            // Text
            Text(
              doubt.text,
              style: const TextStyle(fontSize: 13.5, color: AppTheme.textPrimary, height: 1.45),
            ),
            const SizedBox(height: 16),
            
            // Stats & actions footer
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                // Upvote Button
                InkWell(
                  onTap: () => provider.upvoteDoubt(doubt.id),
                  child: Row(
                    children: [
                      const Icon(Icons.thumb_up_alt_outlined, size: 16, color: AppTheme.textSecondary),
                      const SizedBox(width: 6),
                      Text(
                        '${doubt.upvotes} Upvotes',
                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.textSecondary),
                      ),
                    ],
                  ),
                ),
                
                // Reply count
                Row(
                  children: [
                    const Icon(Icons.chat_bubble_outline, size: 16, color: AppTheme.textSecondary),
                    const SizedBox(width: 6),
                    Text(
                      '${doubt.replies.length} Replies',
                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.textSecondary),
                    ),
                  ],
                ),
                
                // Mark resolved (show only if status is open)
                if (doubt.status == 'open')
                  InkWell(
                    onTap: () => provider.resolveDoubt(doubt.id),
                    child: const Text(
                      'Mark Resolved',
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.primary),
                    ),
                  ),
              ],
            ),
            
            // Replies expansion if any
            if (doubt.replies.isNotEmpty) ...[
              const Divider(height: 24),
              const Text('Replies', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: AppTheme.textSecondary)),
              const SizedBox(height: 8),
              ListView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: doubt.replies.length,
                itemBuilder: (context, rIdx) {
                  final reply = doubt.replies[rIdx];
                  final authorInitials = reply.author.fullName.isNotEmpty
                      ? reply.author.fullName.substring(0, 1).toUpperCase()
                      : 'R';
                  final isTeacher = reply.author.role == 'teacher';
                  
                  return Container(
                    margin: const EdgeInsets.only(bottom: 8),
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: isTeacher ? Colors.blue.shade50.withOpacity(0.3) : Colors.grey.shade50,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            CircleAvatar(
                              radius: 10,
                              backgroundColor: isTeacher ? AppTheme.primary.withOpacity(0.2) : Colors.grey.shade200,
                              child: Text(authorInitials, style: TextStyle(fontSize: 8, fontWeight: FontWeight.bold, color: isTeacher ? AppTheme.primary : Colors.grey)),
                            ),
                            const SizedBox(width: 6),
                            Text(
                              reply.author.fullName,
                              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
                            ),
                            if (isTeacher) ...[
                              const SizedBox(width: 4),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                                decoration: BoxDecoration(color: AppTheme.primary, borderRadius: BorderRadius.circular(4)),
                                child: const Text('TEACHER', style: TextStyle(color: Colors.white, fontSize: 7, fontWeight: FontWeight.bold)),
                              ),
                            ],
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(reply.text, style: const TextStyle(fontSize: 12, color: AppTheme.textPrimary)),
                      ],
                    ),
                  );
                },
              ),
            ],
            
            // Add inline reply input
            const SizedBox(height: 12),
            _buildInlineReplyInput(doubt.id, provider),
          ],
        ),
      ),
    );
  }

  Widget _buildInlineReplyInput(String doubtId, DoubtProvider provider) {
    final replyController = TextEditingController();
    return Row(
      children: [
        Expanded(
          child: TextField(
            controller: replyController,
            style: const TextStyle(fontSize: 12),
            decoration: InputDecoration(
              hintText: 'Add a reply...',
              fillColor: Colors.grey.shade50,
              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: AppTheme.primary)),
            ),
          ),
        ),
        const SizedBox(width: 8),
        IconButton(
          icon: const Icon(Icons.send, size: 18, color: AppTheme.primary),
          onPressed: () async {
            final text = replyController.text.trim();
            if (text.isNotEmpty) {
              final ok = await provider.replyToDoubt(doubtId, text);
              if (ok) {
                replyController.clear();
                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Reply posted.')));
              }
            }
          },
        ),
      ],
    );
  }
}
