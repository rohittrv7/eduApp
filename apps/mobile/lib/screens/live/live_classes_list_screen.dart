import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:alledu_mobile/providers/batch_provider.dart';
import 'package:alledu_mobile/config/theme.dart';
import 'package:alledu_mobile/core/utils/helpers.dart';
import 'package:alledu_mobile/models/batch.dart';

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
      Provider.of<BatchProvider>(context, listen: false)
          .fetchUpcomingLiveClasses();
    });
  }

  @override
  Widget build(BuildContext context) {
    final batchProv = Provider.of<BatchProvider>(context);
    final classes = batchProv.upcomingLiveClasses;
    final activeClasses =
        classes.where((c) => c.status == 'active').toList();
    final upcomingClasses =
        classes.where((c) => c.status == 'approved' || c.status == 'scheduled').toList();

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: const Row(
          children: [
            Icon(Icons.radio, color: AppTheme.primary, size: 22),
            SizedBox(width: 8),
            Text(
              'Live Classes',
              style: TextStyle(
                color: AppTheme.textPrimary,
                fontWeight: FontWeight.bold,
                fontSize: 20,
              ),
            ),
          ],
        ),
      ),
      body: RefreshIndicator(
        onRefresh: () =>
            Provider.of<BatchProvider>(context, listen: false)
                .fetchUpcomingLiveClasses(),
        child: batchProv.isLoading
            ? const Center(child: CircularProgressIndicator())
            : (activeClasses.isEmpty && upcomingClasses.isEmpty)
                ? _buildEmptyState()
                : ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      if (activeClasses.isNotEmpty) ...[
                        _buildSectionHeader(
                          'Live Now',
                          Icons.sensors,
                          Colors.redAccent,
                        ),
                        const SizedBox(height: 10),
                        ...activeClasses.map(
                          (c) => _LiveClassCard(
                            liveClass: c,
                            onTap: () => context.push('/live/${c.id}'),
                          ),
                        ),
                        const SizedBox(height: 20),
                      ],
                      if (upcomingClasses.isNotEmpty) ...[
                        _buildSectionHeader(
                          'Upcoming',
                          Icons.schedule,
                          Colors.green,
                        ),
                        const SizedBox(height: 10),
                        ...upcomingClasses.map(
                          (c) => _LiveClassCard(
                            liveClass: c,
                            onTap: () => context.push('/live/${c.id}'),
                          ),
                        ),
                      ],
                    ],
                  ),
      ),
    );
  }

  Widget _buildSectionHeader(String title, IconData icon, Color color) {
    return Row(
      children: [
        Icon(icon, size: 18, color: color),
        const SizedBox(width: 8),
        Text(
          title,
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
      ],
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text('📡', style: TextStyle(fontSize: 48)),
            const SizedBox(height: 16),
            const Text(
              'No live classes right now',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: AppTheme.textPrimary,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              'Scheduled sessions will appear here when they go live.',
              style: TextStyle(
                fontSize: 13,
                color: Colors.grey.shade500,
                height: 1.5,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// LiveClassCard widget
// ---------------------------------------------------------------------------
class _LiveClassCard extends StatefulWidget {
  final LiveClass liveClass;
  final VoidCallback onTap;

  const _LiveClassCard({required this.liveClass, required this.onTap});

  @override
  State<_LiveClassCard> createState() => _LiveClassCardState();
}

class _LiveClassCardState extends State<_LiveClassCard>
    with SingleTickerProviderStateMixin {
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;
  Timer? _countdownTimer;
  Duration _remaining = Duration.zero;

  @override
  void initState() {
    super.initState();

    // Pulse animation for LIVE badge
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    )..repeat(reverse: true);
    _pulseAnimation =
        Tween<double>(begin: 0.6, end: 1.0).animate(_pulseController);

    _startCountdown();
  }

  void _startCountdown() {
    if (widget.liveClass.status == 'approved' ||
        widget.liveClass.status == 'scheduled') {
      _updateRemaining();
      _countdownTimer =
          Timer.periodic(const Duration(seconds: 1), (_) => _updateRemaining());
    }
  }

  void _updateRemaining() {
    try {
      final scheduledAt = DateTime.parse(widget.liveClass.scheduledAt).toLocal();
      final diff = scheduledAt.difference(DateTime.now());
      if (mounted) setState(() => _remaining = diff.isNegative ? Duration.zero : diff);
    } catch (_) {}
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _countdownTimer?.cancel();
    super.dispose();
  }

  String _formatCountdown(Duration d) {
    final days = d.inDays;
    final hours = d.inHours.remainder(24).toString().padLeft(2, '0');
    final mins = d.inMinutes.remainder(60).toString().padLeft(2, '0');
    final secs = d.inSeconds.remainder(60).toString().padLeft(2, '0');
    if (days > 0) return '${days}d ${hours}h ${mins}m';
    return '$hours:$mins:$secs';
  }

  @override
  Widget build(BuildContext context) {
    final live = widget.liveClass;
    final isActive = live.status == 'active';
    final isUpcoming =
        live.status == 'approved' || live.status == 'scheduled';

    return Card(
      margin: const EdgeInsets.only(bottom: 14),
      clipBehavior: Clip.antiAlias,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(
          color: isActive
              ? Colors.redAccent.withOpacity(0.5)
              : AppTheme.border,
          width: isActive ? 1.5 : 1.0,
        ),
      ),
      elevation: 0,
      child: InkWell(
        onTap: widget.onTap,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Thumbnail area
            AspectRatio(
              aspectRatio: 16 / 7,
              child: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: isActive
                        ? [const Color(0xFF7F1D1D), const Color(0xFFB91C1C)]
                        : [const Color(0xFF1E3A5F), AppTheme.primary],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),
                child: Stack(
                  children: [
                    Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            isActive ? Icons.sensors : Icons.schedule_outlined,
                            color: Colors.white.withOpacity(0.25),
                            size: 48,
                          ),
                        ],
                      ),
                    ),
                    // Badge
                    Positioned(
                      top: 10,
                      left: 12,
                      child: isActive
                          ? AnimatedBuilder(
                              animation: _pulseAnimation,
                              builder: (context, child) => Opacity(
                                opacity: _pulseAnimation.value,
                                child: child,
                              ),
                              child: _Badge('LIVE', Colors.redAccent),
                            )
                          : _Badge('UPCOMING', Colors.green),
                    ),
                    // Play / join icon overlay (active only)
                    if (isActive)
                      Center(
                        child: Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.15),
                            shape: BoxShape.circle,
                            border: Border.all(
                                color: Colors.white.withOpacity(0.4), width: 2),
                          ),
                          child: const Icon(Icons.play_arrow,
                              color: Colors.white, size: 28),
                        ),
                      ),
                    // Countdown timer for upcoming
                    if (isUpcoming && _remaining > Duration.zero)
                      Positioned(
                        bottom: 10,
                        right: 12,
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.black.withOpacity(0.45),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            'Starts in ${_formatCountdown(_remaining)}',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ),
            // Details
            Padding(
              padding: const EdgeInsets.fromLTRB(14, 12, 14, 14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    live.title,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.textPrimary,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (live.description != null &&
                      live.description!.isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Text(
                      live.description!,
                      style: const TextStyle(
                          fontSize: 12, color: AppTheme.textSecondary),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                  const SizedBox(height: 10),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.calendar_today_outlined,
                              size: 13, color: AppTheme.textSecondary),
                          const SizedBox(width: 4),
                          Text(
                            '${UIHelpers.formatDate(live.scheduledAt)} · ${UIHelpers.formatTime(live.scheduledAt)}',
                            style: const TextStyle(
                                fontSize: 11, color: AppTheme.textSecondary),
                          ),
                        ],
                      ),
                      if (isActive)
                        _ActionButton(
                          label: 'Join Live Now',
                          color: Colors.redAccent,
                          onTap: widget.onTap,
                        )
                      else if (isUpcoming)
                        Text(
                          _remaining > Duration.zero
                              ? _formatCountdown(_remaining)
                              : 'Starting soon',
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: Colors.green,
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
  }
}

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------
class _Badge extends StatelessWidget {
  final String label;
  final Color color;
  const _Badge(this.label, this.color);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        label,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 10,
          fontWeight: FontWeight.w900,
          letterSpacing: 0.5,
        ),
      ),
    );
  }
}

class _ActionButton extends StatelessWidget {
  final String label;
  final Color color;
  final VoidCallback onTap;
  const _ActionButton(
      {required this.label, required this.color, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: color,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Text(
          label,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 11,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }
}
