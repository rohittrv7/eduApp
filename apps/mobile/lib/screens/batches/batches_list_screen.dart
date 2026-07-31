import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:alledu_mobile/providers/auth_provider.dart';
import 'package:alledu_mobile/providers/batch_provider.dart';
import 'package:alledu_mobile/config/theme.dart';
import 'package:alledu_mobile/core/utils/helpers.dart';
import 'package:alledu_mobile/core/api/api_client.dart';

class BatchesListScreen extends StatefulWidget {
  const BatchesListScreen({super.key});

  @override
  State<BatchesListScreen> createState() => _BatchesListScreenState();
}

class _BatchesListScreenState extends State<BatchesListScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final _searchController = TextEditingController();
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final bp = Provider.of<BatchProvider>(context, listen: false);
      bp.fetchExploreBatches();
      bp.fetchEnrolledBatches();
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  void _showBatchDialog({dynamic batchToEdit}) {
    final isEditing = batchToEdit != null;
    final nameCtrl = TextEditingController(text: isEditing ? (batchToEdit.name ?? '') : '');
    final descCtrl = TextEditingController(text: isEditing ? (batchToEdit.description ?? '') : '');
    final examCtrl = TextEditingController(text: isEditing ? (batchToEdit.targetExam ?? '') : '');
    final priceCtrl = TextEditingController(text: isEditing ? (batchToEdit.price?.toString() ?? '0') : '');
    bool isFree = isEditing ? (batchToEdit.isFree ?? true) : true;
    bool isSubmitting = false;

    showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              title: Text(isEditing ? 'Edit Batch' : 'Create New Batch', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    TextField(
                      controller: nameCtrl,
                      decoration: const InputDecoration(labelText: 'Batch Name *', hintText: 'e.g. JEE Ultimate 2026'),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: examCtrl,
                      decoration: const InputDecoration(labelText: 'Target Exam', hintText: 'JEE / NEET / Foundation'),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: descCtrl,
                      maxLines: 2,
                      decoration: const InputDecoration(labelText: 'Description', hintText: 'Batch description...'),
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
                        decoration: const InputDecoration(labelText: 'Price (₹)', hintText: '999'),
                      ),
                    ],
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
                            final payload = {
                              'name': name,
                              'target_exam': examCtrl.text.trim(),
                              'description': descCtrl.text.trim(),
                              'is_free': isFree,
                              'price': isFree ? 0 : (double.tryParse(priceCtrl.text.trim()) ?? 0),
                              'language': 'Hinglish',
                            };
                            if (isEditing) {
                              await apiClient.patch('/batches/${batchToEdit.id}', data: payload);
                            } else {
                              await apiClient.post('/batches', data: payload);
                            }
                            if (mounted) {
                              navigator.pop();
                              bp.fetchExploreBatches();
                              bp.fetchEnrolledBatches();
                              messenger.showSnackBar(SnackBar(content: Text(isEditing ? 'Batch updated successfully!' : 'Batch created successfully!')));
                            }
                          } catch (_) {
                          } finally {
                            setDialogState(() => isSubmitting = false);
                          }
                        },
                  child: isSubmitting
                      ? const SizedBox(height: 16, width: 16, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                      : Text(isEditing ? 'Update Batch' : 'Create Batch'),
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
    final userRole = auth.user?.role;
    final isManagementRole = userRole == 'admin' || userRole == 'teacher';

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: Text(
          isManagementRole ? 'Batch Management' : 'Course Batches',
          style: const TextStyle(color: AppTheme.textPrimary, fontWeight: FontWeight.bold, fontSize: 20),
        ),
        actions: [
          if (isManagementRole)
            Padding(
              padding: const EdgeInsets.only(right: 12.0),
              child: ElevatedButton.icon(
                onPressed: () => _showBatchDialog(),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primary,
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
                icon: const Icon(Icons.add, size: 16, color: Colors.white),
                label: const Text('Create', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white)),
              ),
            ),
        ],
        bottom: TabBar(
          controller: _tabController,
          labelColor: AppTheme.primary,
          unselectedLabelColor: AppTheme.textSecondary,
          indicatorColor: AppTheme.primary,
          labelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
          tabs: [
            Tab(text: isManagementRole ? 'All Batches' : 'Explore Batches'),
            Tab(text: isManagementRole ? 'My Created/Assigned' : 'My Batches'),
          ],
        ),
      ),
      body: Column(
        children: [
          // Search input bar
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: TextField(
              controller: _searchController,
              onChanged: (val) {
                setState(() => _searchQuery = val.toLowerCase());
              },
              decoration: InputDecoration(
                filled: true,
                fillColor: Colors.white,
                hintText: 'Search batches...',
                prefixIcon: const Icon(Icons.search, size: 18, color: AppTheme.textSecondary),
                suffixIcon: _searchQuery.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear, size: 18),
                        onPressed: () {
                          _searchController.clear();
                          setState(() => _searchQuery = '');
                        },
                      )
                    : null,
                contentPadding: const EdgeInsets.symmetric(vertical: 12),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(16),
                  borderSide: const BorderSide(color: AppTheme.border),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(16),
                  borderSide: const BorderSide(color: AppTheme.primary, width: 1.5),
                ),
              ),
            ),
          ),
          
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                _buildBatchesTab(batchProv.exploreBatches, batchProv.isLoading, isExplore: true, isManagement: isManagementRole),
                _buildBatchesTab(batchProv.enrolledBatches, batchProv.isLoading, isExplore: false, isManagement: isManagementRole),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBatchesTab(List<dynamic> batches, bool loading, {required bool isExplore, required bool isManagement}) {
    if (loading) {
      return const Center(child: CircularProgressIndicator());
    }

    final filtered = batches.where((b) {
      return b.name.toLowerCase().contains(_searchQuery) ||
          (b.targetExam?.toLowerCase().contains(_searchQuery) ?? false);
    }).toList();

    if (filtered.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text('🔍', style: TextStyle(fontSize: 40)),
            const SizedBox(height: 12),
            Text(
              _searchQuery.isNotEmpty ? 'No batches match your search' : 'No batches found',
              style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.textSecondary),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () async {
        final bp = Provider.of<BatchProvider>(context, listen: false);
        if (isExplore) {
          await bp.fetchExploreBatches();
        } else {
          await bp.fetchEnrolledBatches();
        }
      },
      child: ListView.builder(
        padding: const EdgeInsets.symmetric(horizontal: 16.0),
        itemCount: filtered.length,
        itemBuilder: (context, index) {
          final batch = filtered[index];
          final priceText = batch.isFree || batch.price == 0
              ? 'Free'
              : UIHelpers.formatINR(batch.price);

          return Card(
            margin: const EdgeInsets.only(bottom: 16),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(20),
              side: const BorderSide(color: AppTheme.border),
            ),
            clipBehavior: Clip.antiAlias,
            elevation: 0,
            child: InkWell(
              onTap: () => context.go('/batches/${batch.slug}'),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Image header
                  AspectRatio(
                    aspectRatio: 16 / 9,
                    child: batch.thumbnail != null && batch.thumbnail.isNotEmpty
                        ? Image.network(
                            batch.thumbnail,
                            fit: BoxFit.cover,
                            errorBuilder: (context, error, stackTrace) => Container(
                              decoration: const BoxDecoration(
                                gradient: LinearGradient(
                                  colors: [AppTheme.primary, Color(0xFF1E40AF)],
                                  begin: Alignment.topLeft,
                                  end: Alignment.bottomRight,
                                ),
                              ),
                              child: Center(
                                child: Padding(
                                  padding: const EdgeInsets.all(12.0),
                                  child: Column(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      const Icon(Icons.school_rounded, size: 36, color: Colors.white),
                                      const SizedBox(height: 4),
                                      Text(
                                        batch.name,
                                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12),
                                        textAlign: TextAlign.center,
                                        maxLines: 2,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                          )
                        : Container(
                            decoration: const BoxDecoration(
                              gradient: LinearGradient(
                                colors: [AppTheme.primary, Color(0xFF1E40AF)],
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                              ),
                            ),
                            child: Center(
                              child: Padding(
                                padding: const EdgeInsets.all(12.0),
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    const Icon(Icons.school_rounded, size: 36, color: Colors.white),
                                    const SizedBox(height: 4),
                                    Text(
                                      batch.name,
                                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12),
                                      textAlign: TextAlign.center,
                                      maxLines: 2,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                  ),
                  
                  // Details
                  Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          batch.targetExam?.toUpperCase() ?? 'GENERAL PREP',
                          style: const TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w900,
                            color: AppTheme.primary,
                            letterSpacing: 0.5,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          batch.name,
                          style: const TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                            color: AppTheme.textPrimary,
                          ),
                        ),
                        if (batch.description != null && batch.description.isNotEmpty) ...[
                          const SizedBox(height: 6),
                          Text(
                            batch.description,
                            style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                        const SizedBox(height: 16),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              priceText,
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w900,
                                color: batch.isFree ? Colors.green : AppTheme.textPrimary,
                              ),
                            ),
                            Row(
                              children: [
                                if (isManagement) ...[
                                  OutlinedButton(
                                    onPressed: () => _showBatchDialog(batchToEdit: batch),
                                    style: OutlinedButton.styleFrom(
                                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                      minimumSize: Size.zero,
                                      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                    ),
                                    child: const Text('Edit', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                                  ),
                                  const SizedBox(width: 8),
                                ],
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                                  decoration: BoxDecoration(
                                    color: AppTheme.primary,
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Text(
                                    isManagement ? 'Manage Batch' : 'View Details',
                                    style: const TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.bold,
                                      color: Colors.white,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
