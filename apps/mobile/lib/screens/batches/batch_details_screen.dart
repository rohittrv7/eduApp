import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:alledu_mobile/providers/batch_provider.dart';
import 'package:alledu_mobile/config/theme.dart';
import 'package:alledu_mobile/core/utils/helpers.dart';
import 'package:alledu_mobile/models/batch.dart';
import 'package:flutter_pdfview/flutter_pdfview.dart';

import 'package:alledu_mobile/providers/auth_provider.dart';
import 'package:alledu_mobile/core/api/api_client.dart';

class BatchDetailsScreen extends StatefulWidget {
  final String batchId;

  const BatchDetailsScreen({super.key, required this.batchId});

  @override
  State<BatchDetailsScreen> createState() => _BatchDetailsScreenState();
}

class _BatchDetailsScreenState extends State<BatchDetailsScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<BatchProvider>(context, listen: false).fetchBatchDetail(widget.batchId);
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _handleEnroll(BatchDetail batch) async {
    final bp = Provider.of<BatchProvider>(context, listen: false);
    bool success = false;
    
    if (batch.isFree || batch.price == 0) {
      success = await bp.enrollInFreeBatch(batch.id);
    } else {
      success = await bp.simulatePurchase(batch.id);
    }

    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(batch.isFree ? 'Successfully Enrolled!' : 'Payment Completed successfully!'),
          backgroundColor: Colors.green,
        ),
      );
    }
  }

  void _confirmDeleteBatch(BuildContext context, BatchDetail batch) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Delete Batch', style: TextStyle(fontWeight: FontWeight.bold)),
        content: Text('Are you sure you want to delete "${batch.name}"? This action cannot be undone.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.redAccent),
            onPressed: () async {
              Navigator.pop(ctx);
              final bp = Provider.of<BatchProvider>(context, listen: false);
              final messenger = ScaffoldMessenger.of(context);
              final navigator = Navigator.of(context);
              final success = await bp.deleteBatch(batch.id);
              if (success) {
                if (mounted) {
                  if (navigator.canPop()) {
                    navigator.pop();
                  } else {
                    context.go('/batches');
                  }
                  messenger.showSnackBar(
                    const SnackBar(content: Text('Batch deleted successfully!'), backgroundColor: Colors.green),
                  );
                }
              } else {
                messenger.showSnackBar(
                  SnackBar(content: Text(bp.errorMessage ?? 'Failed to delete batch'), backgroundColor: Colors.red),
                );
              }
            },
            child: const Text('Delete', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  void _showEditBatchDialog(BuildContext context, BatchDetail batch) {
    final nameCtrl = TextEditingController(text: batch.name);
    final descCtrl = TextEditingController(text: batch.description ?? '');
    final examCtrl = TextEditingController(text: batch.targetExam ?? '');
    final thumbCtrl = TextEditingController(text: batch.thumbnail ?? '');
    final priceCtrl = TextEditingController(text: batch.price.toString());
    final capCtrl = TextEditingController(text: batch.capacity?.toString() ?? '');
    final trialCtrl = TextEditingController(text: batch.trialDays?.toString() ?? '');
    String selectedLanguage = batch.language ?? 'Hinglish';
    bool isFree = batch.isFree;
    bool isSubmitting = false;

    showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              title: const Text('Edit Batch', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    TextField(
                      controller: nameCtrl,
                      decoration: const InputDecoration(labelText: 'Batch Name *'),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: examCtrl,
                      decoration: const InputDecoration(labelText: 'Target Exam'),
                    ),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<String>(
                      initialValue: ['Hinglish', 'Hindi', 'English'].contains(selectedLanguage) ? selectedLanguage : 'Hinglish',
                      decoration: const InputDecoration(labelText: 'Language'),
                      items: const [
                        DropdownMenuItem(value: 'Hinglish', child: Text('Hinglish')),
                        DropdownMenuItem(value: 'Hindi', child: Text('Hindi')),
                        DropdownMenuItem(value: 'English', child: Text('English')),
                      ],
                      onChanged: (val) => setDialogState(() => selectedLanguage = val ?? 'Hinglish'),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: descCtrl,
                      maxLines: 2,
                      decoration: const InputDecoration(labelText: 'Description'),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: thumbCtrl,
                      decoration: const InputDecoration(labelText: 'Thumbnail URL'),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Checkbox(
                          value: isFree,
                          onChanged: (val) => setDialogState(() => isFree = val ?? true),
                        ),
                        const Text('Free Batch', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                      ],
                    ),
                    if (!isFree) ...[
                      const SizedBox(height: 8),
                      TextField(
                        controller: priceCtrl,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(labelText: 'Price (₹)'),
                      ),
                    ],
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: capCtrl,
                            keyboardType: TextInputType.number,
                            decoration: const InputDecoration(labelText: 'Capacity (Optional)'),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: TextField(
                            controller: trialCtrl,
                            keyboardType: TextInputType.number,
                            decoration: const InputDecoration(labelText: 'Trial Days'),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
                ElevatedButton(
                  onPressed: isSubmitting
                      ? null
                      : () async {
                          final name = nameCtrl.text.trim();
                          if (name.isEmpty) return;
                          final bp = Provider.of<BatchProvider>(context, listen: false);
                          final messenger = ScaffoldMessenger.of(context);
                          final navigator = Navigator.of(context);
                          setDialogState(() => isSubmitting = true);
                          try {
                            final apiClient = ApiClient();
                            final payload = <String, dynamic>{
                              'name': name,
                              'target_exam': examCtrl.text.trim(),
                              'description': descCtrl.text.trim(),
                              'thumbnail': thumbCtrl.text.trim().isNotEmpty ? thumbCtrl.text.trim() : null,
                              'language': selectedLanguage,
                              'is_free': isFree,
                              'price': isFree ? 0 : (double.tryParse(priceCtrl.text.trim()) ?? 0),
                            };
                            if (capCtrl.text.trim().isNotEmpty) {
                              payload['capacity'] = int.tryParse(capCtrl.text.trim());
                            }
                            if (trialCtrl.text.trim().isNotEmpty) {
                              payload['trial_days'] = int.tryParse(trialCtrl.text.trim());
                            }

                            await apiClient.patch('/batches/${batch.id}', data: payload);
                            if (mounted) {
                              navigator.pop();
                              await bp.fetchBatchDetail(batch.id);
                              await bp.fetchExploreBatches();
                              await bp.fetchEnrolledBatches();
                              messenger.showSnackBar(const SnackBar(
                                content: Text('Batch updated successfully!'),
                                backgroundColor: Colors.green,
                              ));
                            }
                          } catch (e) {
                            messenger.showSnackBar(const SnackBar(
                              content: Text('Failed to update batch.'),
                              backgroundColor: Colors.red,
                            ));
                          } finally {
                            setDialogState(() => isSubmitting = false);
                          }
                        },
                  child: isSubmitting
                      ? const SizedBox(height: 16, width: 16, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                      : const Text('Update Batch'),
                ),
              ],
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final batchProv = Provider.of<BatchProvider>(context);
    final batch = batchProv.activeBatch;
    final userRole = auth.user?.role;
    final isManagement = userRole == 'admin' || userRole == 'teacher';

    if (batchProv.isLoading && batch == null) {
      return const Scaffold(
        backgroundColor: AppTheme.background,
        body: Center(child: CircularProgressIndicator()),
      );
    }

    if (batch == null) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('Batch Details'),
          leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: () {
              if (context.canPop()) {
                context.pop();
              } else {
                context.go('/batches');
              }
            },
          ),
        ),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.error_outline, size: 56, color: Colors.redAccent),
                const SizedBox(height: 16),
                Text(
                  batchProv.errorMessage ?? 'Failed to load batch details.',
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 20),
                ElevatedButton.icon(
                  onPressed: () => batchProv.fetchBatchDetail(widget.batchId),
                  icon: const Icon(Icons.refresh),
                  label: const Text('Retry Loading'),
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: AppTheme.background,
      body: NestedScrollView(
        headerSliverBuilder: (context, innerBoxIsScrolled) {
          return [
            SliverAppBar(
              expandedHeight: 220,
              pinned: true,
              backgroundColor: AppTheme.primary,
              iconTheme: const IconThemeData(color: Colors.white),
              leading: IconButton(
                icon: const Icon(Icons.arrow_back, color: Colors.white),
                onPressed: () {
                  if (context.canPop()) {
                    context.pop();
                  } else {
                    context.go('/batches');
                  }
                },
              ),
              actions: [
                if (isManagement) ...[
                  IconButton(
                    icon: const Icon(Icons.edit_outlined, color: Colors.white),
                    tooltip: 'Edit Batch',
                    onPressed: () => _showEditBatchDialog(context, batch),
                  ),
                  IconButton(
                    icon: const Icon(Icons.delete_outline, color: Colors.white),
                    tooltip: 'Delete Batch',
                    onPressed: () => _confirmDeleteBatch(context, batch),
                  ),
                ],
              ],
              flexibleSpace: FlexibleSpaceBar(
                background: batch.thumbnail != null && batch.thumbnail!.isNotEmpty
                    ? Image.network(batch.thumbnail!, fit: BoxFit.cover)
                    : Container(
                        color: AppTheme.primary,
                        child: const Center(
                          child: Icon(Icons.book_outlined, size: 50, color: Colors.white30),
                        ),
                      ),
              ),
            ),
            SliverToBoxAdapter(
              child: Container(
                color: Colors.white,
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      batch.targetExam?.toUpperCase() ?? 'GENERAL PREP',
                      style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: AppTheme.primary, letterSpacing: 0.5),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      batch.name,
                      style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppTheme.textPrimary, letterSpacing: -0.3),
                    ),
                    if (batch.description != null && batch.description!.isNotEmpty) ...[
                      const SizedBox(height: 10),
                      Text(
                        batch.description!,
                        style: const TextStyle(fontSize: 13, color: AppTheme.textSecondary, height: 1.4),
                      ),
                    ],
                    const SizedBox(height: 20),
                    
                    // Purchase Prompt OR Progress Card
                    if (batch.isEnrolled)
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.blue.shade50.withOpacity(0.5),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: Colors.blue.shade100),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text(
                                  '🎉 You are enrolled in this batch',
                                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppTheme.primary),
                                ),
                                Text(
                                  '${batch.progressPercent}% done',
                                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: AppTheme.textPrimary),
                                ),
                              ],
                            ),
                            const SizedBox(height: 10),
                            ClipRRect(
                              borderRadius: BorderRadius.circular(4),
                              child: LinearProgressIndicator(
                                value: batch.progressPercent / 100,
                                minHeight: 6,
                                backgroundColor: Colors.blue.shade100,
                                valueColor: const AlwaysStoppedAnimation(AppTheme.primary),
                              ),
                            )
                          ],
                        ),
                      )
                    else
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.grey.shade50,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: AppTheme.border),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'Course Fee',
                                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.textSecondary),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  batch.isFree || batch.price == 0
                                      ? 'FREE'
                                      : UIHelpers.formatINR(batch.price),
                                  style: TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.w900,
                                    color: batch.isFree ? Colors.green : AppTheme.textPrimary,
                                  ),
                                ),
                              ],
                            ),
                            ElevatedButton(
                              onPressed: batchProv.isLoading ? null : () => _handleEnroll(batch),
                              style: ElevatedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                              ),
                              child: Text(batch.isFree || batch.price == 0 ? 'Enroll Now' : 'Buy Now'),
                            ),
                          ],
                        ),
                      ),
                  ],
                ),
              ),
            ),
            
            // Tab headers
            SliverPersistentHeader(
              pinned: true,
              delegate: _SliverAppBarDelegate(
                TabBar(
                  controller: _tabController,
                  labelColor: AppTheme.primary,
                  unselectedLabelColor: AppTheme.textSecondary,
                  indicatorColor: AppTheme.primary,
                  labelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13.5),
                  tabs: const [
                    Tab(text: 'Curriculum'),
                    Tab(text: 'Live Lectures'),
                    Tab(text: 'Study Notes'),
                  ],
                ),
              ),
            ),
          ];
        },
        body: TabBarView(
          controller: _tabController,
          children: [
            _buildCurriculumTab(batch),
            _buildLiveLecturesTab(batchProv.liveClasses, batch.isEnrolled),
            _buildStudyMaterialsTab(batchProv.studyMaterials, batch.isEnrolled),
          ],
        ),
      ),
    );
  }

  Widget _buildCurriculumTab(BatchDetail batch) {
    if (batch.subjects.isEmpty) {
      return const Center(child: Text('No subjects added in this curriculum yet.'));
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: batch.subjects.length,
      itemBuilder: (context, sIdx) {
        final subject = batch.subjects[sIdx];
        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          child: ExpansionTile(
            shape: const Border(),
            title: Text(
              subject.title,
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppTheme.textPrimary),
            ),
            children: subject.chapters.map((chapter) {
              return ExpansionTile(
                shape: const Border(),
                title: Text(
                  chapter.title,
                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.textSecondary),
                ),
                children: chapter.videos.map((video) {
                  return ListTile(
                    contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
                    leading: const Icon(Icons.play_circle_outline, size: 20, color: AppTheme.primary),
                    title: Text(
                      video.title,
                      style: TextStyle(
                        fontSize: 12.5,
                        fontWeight: FontWeight.w600,
                        color: video.isLocked && !batch.isEnrolled ? Colors.grey.shade400 : AppTheme.textPrimary,
                      ),
                    ),
                    subtitle: Text(
                      '${UIHelpers.formatWatchTime(video.durationSeconds)} • ${video.progressPercent}% completed',
                      style: const TextStyle(fontSize: 11),
                    ),
                    trailing: video.isLocked && !batch.isEnrolled
                        ? const Icon(Icons.lock_outline, size: 14, color: Colors.grey)
                        : const Icon(Icons.arrow_forward, size: 14),
                    onTap: () {
                      if (video.isLocked && !batch.isEnrolled) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Please enroll in the batch to unlock this video.')),
                        );
                      } else {
                        // Navigate to live/video player matching video id
                        context.push('/live/${video.id}');
                      }
                    },
                  );
                }).toList(),
              );
            }).toList(),
          ),
        );
      },
    );
  }

  Widget _buildLiveLecturesTab(List<LiveClass> classes, bool isEnrolled) {
    // Filter: only show active (live now) and approved/scheduled (upcoming)
    final visibleClasses = classes
        .where((c) => c.status == 'active' || c.status == 'approved' || c.status == 'scheduled')
        .toList();

    if (visibleClasses.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Text('📡', style: TextStyle(fontSize: 40)),
              const SizedBox(height: 12),
              const Text(
                'No live lectures scheduled',
                style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
              ),
              const SizedBox(height: 6),
              Text(
                'Live and upcoming sessions will appear here.',
                style: TextStyle(fontSize: 12, color: Colors.grey.shade500),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: visibleClasses.length,
      itemBuilder: (context, index) {
        final live = visibleClasses[index];
        return _BatchLiveClassCard(
          liveClass: live,
          onTap: () {
            if (!isEnrolled) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Please enroll to view live classes.')),
              );
            } else {
              context.push('/live/${live.id}');
            }
          },
        );
      },
    );
  }

  Widget _buildStudyMaterialsTab(List<StudyMaterialItem> materials, bool isEnrolled) {
    if (materials.isEmpty) {
      return const Center(child: Text('No study materials uploaded yet.'));
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: materials.length,
      itemBuilder: (context, index) {
        final m = materials[index];
        final locked = !isEnrolled && !m.isFreePreview;

        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          child: ListTile(
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            leading: const Icon(Icons.description_outlined, color: Colors.blueAccent),
            title: Text(m.title, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
            subtitle: Text(m.type.toUpperCase(), style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey)),
            trailing: locked
                ? const Icon(Icons.lock_outline, size: 14)
                : const Icon(Icons.remove_red_eye_outlined, size: 16, color: AppTheme.primary),
            onTap: () {
              if (locked) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('This material is locked. Please enroll to view.')),
                );
              } else if (m.fileUrl != null) {
                // Show PDF in a simple fullscreen popup
                Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (context) => Scaffold(
                      appBar: AppBar(title: Text(m.title)),
                      body: PDFView(
                        filePath: m.fileUrl,
                        enableSwipe: true,
                        swipeHorizontal: false,
                        autoSpacing: true,
                        pageFling: true,
                      ),
                    ),
                  ),
                );
              }
            },
          ),
        );
      },
    );
  }
}

// ---------------------------------------------------------------------------
// Batch live class card (active / upcoming styles)
// ---------------------------------------------------------------------------
class _BatchLiveClassCard extends StatefulWidget {
  final LiveClass liveClass;
  final VoidCallback onTap;

  const _BatchLiveClassCard({required this.liveClass, required this.onTap});

  @override
  State<_BatchLiveClassCard> createState() => _BatchLiveClassCardState();
}

class _BatchLiveClassCardState extends State<_BatchLiveClassCard>
    with SingleTickerProviderStateMixin {
  late AnimationController _pulseCtrl;
  late Animation<double> _pulseAnim;
  Timer? _timer;
  Duration _remaining = Duration.zero;

  @override
  void initState() {
    super.initState();
    _pulseCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    )..repeat(reverse: true);
    _pulseAnim = Tween<double>(begin: 0.6, end: 1.0).animate(_pulseCtrl);

    _updateRemaining();
    if (widget.liveClass.status != 'active') {
      _timer = Timer.periodic(const Duration(seconds: 1), (_) => _updateRemaining());
    }
  }

  void _updateRemaining() {
    try {
      final scheduledAt = DateTime.parse(widget.liveClass.scheduledAt).toLocal();
      final diff = scheduledAt.difference(DateTime.now());
      if (mounted) setState(() => _remaining = diff.isNegative ? Duration.zero : diff);
    } catch (_) {}
  }

  String _formatCountdown(Duration d) {
    final h = d.inHours.toString().padLeft(2, '0');
    final m = d.inMinutes.remainder(60).toString().padLeft(2, '0');
    final s = d.inSeconds.remainder(60).toString().padLeft(2, '0');
    if (d.inDays > 0) return '${d.inDays}d ${h}h ${m}m';
    return '$h:$m:$s';
  }

  @override
  void dispose() {
    _pulseCtrl.dispose();
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final live = widget.liveClass;
    final isActive = live.status == 'active';

    return Card(
      margin: const EdgeInsets.only(bottom: 14),
      clipBehavior: Clip.antiAlias,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(14),
        side: BorderSide(
          color: isActive ? Colors.redAccent.withOpacity(0.45) : AppTheme.border,
          width: isActive ? 1.5 : 1.0,
        ),
      ),
      elevation: 0,
      child: InkWell(
        onTap: widget.onTap,
        child: Row(
          children: [
            // Left gradient thumbnail
            SizedBox(
              width: 90,
              height: 90,
              child: Stack(
                children: [
                  Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: isActive
                            ? [const Color(0xFF7F1D1D), const Color(0xFFB91C1C)]
                            : [const Color(0xFF1E3A5F), AppTheme.primary],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                    ),
                    child: Center(
                      child: Icon(
                        isActive ? Icons.sensors : Icons.schedule_outlined,
                        color: Colors.white.withOpacity(0.3),
                        size: 32,
                      ),
                    ),
                  ),
                  if (isActive)
                    Center(
                      child: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.15),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.play_arrow, color: Colors.white, size: 20),
                      ),
                    ),
                ],
              ),
            ),
            // Right content
            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        if (isActive)
                          AnimatedBuilder(
                            animation: _pulseAnim,
                            builder: (_, child) =>
                                Opacity(opacity: _pulseAnim.value, child: child),
                            child: _SmallBadge('LIVE', Colors.redAccent),
                          )
                        else
                          _SmallBadge('UPCOMING', Colors.green),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            live.title,
                            style: const TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.bold,
                              color: AppTheme.textPrimary,
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        const Icon(Icons.access_time, size: 12, color: AppTheme.textSecondary),
                        const SizedBox(width: 4),
                        Text(
                          '${UIHelpers.formatDate(live.scheduledAt)} · ${UIHelpers.formatTime(live.scheduledAt)}',
                          style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    if (isActive)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(
                          color: Colors.redAccent,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Text(
                          'Join Live Now',
                          style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                        ),
                      )
                    else if (_remaining > Duration.zero)
                      Text(
                        'Starts in ${_formatCountdown(_remaining)}',
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: Colors.green,
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SmallBadge extends StatelessWidget {
  final String label;
  final Color color;
  const _SmallBadge(this.label, this.color);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(5),
      ),
      child: Text(
        label,
        style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.w900),
      ),
    );
  }
}

// Persistent header tab delegate
class _SliverAppBarDelegate extends SliverPersistentHeaderDelegate {
  final TabBar _tabBar;

  _SliverAppBarDelegate(this._tabBar);

  @override
  double get minExtent => _tabBar.preferredSize.height;
  @override
  double get maxExtent => _tabBar.preferredSize.height;

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) {
    return Container(
      color: Colors.white,
      child: _tabBar,
    );
  }

  @override
  bool shouldRebuild(_SliverAppBarDelegate oldDelegate) {
    return false;
  }
}
