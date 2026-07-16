import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:alledu_mobile/providers/batch_provider.dart';
import 'package:alledu_mobile/config/theme.dart';
import 'package:alledu_mobile/core/utils/helpers.dart';

class LiveClassesListScreen extends StatefulWidget {
  const LiveClassesListScreen({super.key});

  @override
  State<LiveClassesListScreen> createState() => _LiveClassesListScreenState();
}

class _LiveClassesListScreenState extends State<LiveClassesListScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      // Pre-load active classes list
      Provider.of<BatchProvider>(context, listen: false).fetchEnrolledBatches();
    });
  }

  @override
  Widget build(BuildContext context) {
    final batchProv = Provider.of<BatchProvider>(context);
    final classes = batchProv.liveClasses;

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: const Text(
          'Live Lectures',
          style: TextStyle(color: AppTheme.textPrimary, fontWeight: FontWeight.bold, fontSize: 20),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          if (batchProv.enrolledBatches.isNotEmpty) {
            await batchProv.fetchBatchDetail(batchProv.enrolledBatches.first.slug);
          }
        },
        child: classes.isEmpty
            ? Center(
                child: Padding(
                  padding: const EdgeInsets.all(24.0),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text('📡', style: TextStyle(fontSize: 40)),
                      const SizedBox(height: 12),
                      const Text(
                        'No live streams scheduled today',
                        style: TextStyle(fontWeight: FontWeight.bold, color: AppTheme.textSecondary),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'Scheduled sessions will show up here as soon as they go online.',
                        style: TextStyle(fontSize: 12, color: Colors.grey.shade400, height: 1.4),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                ),
              )
            : ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: classes.length,
                itemBuilder: (context, index) {
                  final live = classes[index];
                  final isLive = live.status == 'live';

                  return Card(
                    margin: const EdgeInsets.only(bottom: 16),
                    clipBehavior: Clip.antiAlias,
                    child: InkWell(
                      onTap: () => context.go('/live/${live.id}'),
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Row(
                          children: [
                            Container(
                              height: 48,
                              width: 48,
                              decoration: BoxDecoration(
                                color: isLive ? Colors.red.shade50 : AppTheme.primary.withOpacity(0.06),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Icon(
                                isLive ? Icons.sensors : Icons.videocam_outlined,
                                color: isLive ? Colors.redAccent : AppTheme.primary,
                                size: 22,
                              ),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    live.title,
                                    style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    'Starts: ${UIHelpers.formatDate(live.scheduledAt)} at ${UIHelpers.formatTime(live.scheduledAt)}',
                                    style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w500),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 8),
                            if (isLive)
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(color: Colors.redAccent, borderRadius: BorderRadius.circular(20)),
                                child: const Text('LIVE', style: TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.w900)),
                              )
                            else
                              const Icon(Icons.arrow_forward_ios, size: 14, color: AppTheme.textSecondary),
                          ],
                        ),
                      ),
                    ),
                  );
                },
              ),
      ),
    );
  }
}
