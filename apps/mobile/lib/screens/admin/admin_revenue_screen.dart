import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:alledu_mobile/config/theme.dart';
import 'package:alledu_mobile/core/api/api_client.dart';
import 'package:intl/intl.dart';

class AdminRevenueScreen extends StatefulWidget {
  const AdminRevenueScreen({super.key});

  @override
  State<AdminRevenueScreen> createState() => _AdminRevenueScreenState();
}

class _AdminRevenueScreenState extends State<AdminRevenueScreen> {
  final ApiClient _apiClient = ApiClient();
  bool _isLoading = false;
  List<dynamic> _transactions = [];
  String _selectedStatus = 'All';

  @override
  void initState() {
    super.initState();
    _fetchTransactions();
  }

  Future<void> _fetchTransactions() async {
    setState(() => _isLoading = true);
    try {
      final res = await _apiClient.get('/admin/revenue/transactions');
      dynamic raw = res.data;
      if (raw is Map) raw = raw['data'] ?? raw['transactions'] ?? [];
      setState(() {
        _transactions = raw is List ? raw : [];
      });
    } catch (_) {
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _transactions.where((t) {
      if (_selectedStatus == 'All') return true;
      return (t['status'] ?? '').toString().toLowerCase() == _selectedStatus.toLowerCase();
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
        title: const Text(
          'Revenue & Transactions',
          style: TextStyle(color: AppTheme.textPrimary, fontWeight: FontWeight.bold, fontSize: 18),
        ),
      ),
      body: Column(
        children: [
          // Filter Bar
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            color: Colors.white,
            child: Row(
              children: [
                const Text('Status: ', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.textSecondary)),
                const SizedBox(width: 8),
                DropdownButton<String>(
                  value: _selectedStatus,
                  items: ['All', 'Completed', 'Pending', 'Failed'].map((s) {
                    return DropdownMenuItem(value: s, child: Text(s, style: const TextStyle(fontSize: 13)));
                  }).toList(),
                  onChanged: (val) {
                    if (val != null) setState(() => _selectedStatus = val);
                  },
                ),
              ],
            ),
          ),
          const Divider(height: 1),

          // Transactions List
          Expanded(
            child: RefreshIndicator(
              onRefresh: _fetchTransactions,
              child: _isLoading
                  ? const Center(child: CircularProgressIndicator())
                  : filtered.isEmpty
                      ? const Center(child: Text('No transactions found.', style: TextStyle(fontSize: 13, color: AppTheme.textSecondary)))
                      : ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: filtered.length,
                          itemBuilder: (context, index) {
                            final tx = filtered[index];
                            final studentName = tx['studentName'] ?? tx['user']?['full_name'] ?? 'Student';
                            final batchName = tx['batchName'] ?? tx['batch']?['name'] ?? 'Batch';
                            final amount = tx['amount'] ?? 0;
                            final method = tx['method'] ?? 'Razorpay';
                            final status = tx['status'] ?? 'completed';
                            final dateStr = tx['createdAt'] ?? tx['created_at'] ?? '';
                            final date = DateTime.tryParse(dateStr) ?? DateTime.now();

                            final isSuccess = status == 'completed' || status == 'success';

                            return Container(
                              margin: const EdgeInsets.only(bottom: 10),
                              padding: const EdgeInsets.all(14),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(14),
                                border: Border.all(color: AppTheme.border),
                              ),
                              child: Row(
                                children: [
                                  CircleAvatar(
                                    radius: 18,
                                    backgroundColor: isSuccess ? const Color(0xFFDCFCE7) : const Color(0xFFFEE2E2),
                                    child: Icon(
                                      isSuccess ? Icons.arrow_downward : Icons.close,
                                      size: 18,
                                      color: isSuccess ? Colors.green.shade700 : Colors.red.shade700,
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(studentName, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.textPrimary)),
                                        Text('$batchName  •  $method', style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
                                        Text(DateFormat('dd/MM/yyyy, hh:mm a').format(date), style: const TextStyle(fontSize: 10, color: AppTheme.textSecondary)),
                                      ],
                                    ),
                                  ),
                                  Column(
                                    crossAxisAlignment: CrossAxisAlignment.end,
                                    children: [
                                      Text('₹$amount', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppTheme.textPrimary)),
                                      const SizedBox(height: 2),
                                      Text(status.toUpperCase(), style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: isSuccess ? Colors.green.shade700 : Colors.red.shade700)),
                                    ],
                                  ),
                                ],
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
