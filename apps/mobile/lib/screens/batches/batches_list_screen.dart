import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:alledu_mobile/providers/batch_provider.dart';
import 'package:alledu_mobile/config/theme.dart';
import 'package:alledu_mobile/core/utils/helpers.dart';

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

  @override
  Widget build(BuildContext context) {
    final batchProv = Provider.of<BatchProvider>(context);

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: const Text(
          'Course Batches',
          style: TextStyle(color: AppTheme.textPrimary, fontWeight: FontWeight.bold, fontSize: 20),
        ),
        bottom: TabBar(
          controller: _tabController,
          labelColor: AppTheme.primary,
          unselectedLabelColor: AppTheme.textSecondary,
          indicatorColor: AppTheme.primary,
          labelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
          tabs: const [
            Tab(text: 'Explore Batches'),
            Tab(text: 'My Batches'),
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
                _buildBatchesTab(batchProv.exploreBatches, batchProv.isLoading, isExplore: true),
                _buildBatchesTab(batchProv.enrolledBatches, batchProv.isLoading, isExplore: false),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBatchesTab(List<dynamic> batches, bool loading, {required bool isExplore}) {
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
                        ? Image.network(batch.thumbnail, fit: BoxFit.cover)
                        : Container(
                            color: AppTheme.primary.withOpacity(0.06),
                            child: const Center(
                              child: Icon(Icons.book_outlined, size: 40, color: AppTheme.primary),
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
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                              decoration: BoxDecoration(
                                color: AppTheme.primary,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: const Text(
                                'View Details',
                                style: TextStyle(
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
