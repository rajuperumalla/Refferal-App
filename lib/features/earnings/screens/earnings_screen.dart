import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/services/firestore_service.dart';
import '../../../core/utils/formatters.dart';
import '../../../features/auth/providers/auth_provider.dart';

// ── Commission model ──────────────────────────────────────────────────────────

class CommissionItem {
  final String id;
  final String patientName;
  final String procedure;
  final double amount;
  final String status; // pending_approval | approved | paid | rejected
  final String createdAt;
  final String? paidAt;
  final String? method;
  final String? utr;
  final String? rejectedReason;
  // MOP breakdown
  final String? mop;
  final double? ticketSize;
  final double? implantCost;
  final double? pharmacyCost;
  final double? labCost;
  final double? discount;
  final double? otherDeductions;
  final double? totalDeductions;
  final double? shareableAmount;
  final String? expectedPaymentDate;

  const CommissionItem({
    required this.id,
    required this.patientName,
    required this.procedure,
    required this.amount,
    required this.status,
    required this.createdAt,
    this.paidAt,
    this.method,
    this.utr,
    this.rejectedReason,
    this.mop,
    this.ticketSize,
    this.implantCost,
    this.pharmacyCost,
    this.labCost,
    this.discount,
    this.otherDeductions,
    this.totalDeductions,
    this.shareableAmount,
    this.expectedPaymentDate,
  });

  factory CommissionItem.fromFirestore(Map<String, dynamic> d) {
    return CommissionItem(
      id: d['id'] ?? '',
      patientName: d['patientName'] ?? d['patient_name'] ?? '',
      procedure: d['procedure'] ?? '',
      amount: (d['amount'] ?? 0).toDouble(),
      status: d['status'] ?? 'pending_approval',
      createdAt: d['createdAt']?.toString() ?? '',
      paidAt: d['paidAt']?.toString(),
      method: d['method'],
      utr: d['utr'],
      rejectedReason: d['rejectedReason'] ?? d['rejected_reason'],
      mop: d['mop'],
      ticketSize: d['ticketSize']?.toDouble(),
      implantCost: d['implantCost']?.toDouble(),
      pharmacyCost: d['pharmacyCost']?.toDouble(),
      labCost: d['labCost']?.toDouble(),
      discount: d['discount']?.toDouble(),
      otherDeductions: d['otherDeductions']?.toDouble(),
      totalDeductions: d['totalDeductions']?.toDouble(),
      shareableAmount: d['shareableAmount']?.toDouble(),
      expectedPaymentDate: d['expectedPaymentDate'],
    );
  }
}

// ── Providers ────────────────────────────────────────────────────────────────

final commissionsStreamProvider =
    StreamProvider.autoDispose<List<CommissionItem>>((ref) {
  final user = ref.watch(currentUserProvider);
  if (user == null) return Stream.value([]);
  return firestoreService.commissionsStream(user.id).map(
    (list) => list.map((d) => CommissionItem.fromFirestore(d)).toList(),
  );
});

// ── Screen ───────────────────────────────────────────────────────────────────

class EarningsScreen extends ConsumerStatefulWidget {
  const EarningsScreen({super.key});

  @override
  ConsumerState<EarningsScreen> createState() => _EarningsScreenState();
}

class _EarningsScreenState extends ConsumerState<EarningsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final commissionsAsync = ref.watch(commissionsStreamProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Commissions'),
        bottom: TabBar(
          controller: _tabController,
          labelColor: AppColors.primary,
          unselectedLabelColor: AppColors.textSecondary,
          indicatorColor: AppColors.primary,
          tabs: commissionsAsync.when(
            data: (items) {
              final pending = items.where(
                (c) => c.status == 'pending_approval' || c.status == 'approved',
              ).length;
              final paid = items.where((c) => c.status == 'paid').length;
              return [
                const Tab(text: 'Overview'),
                Tab(text: 'Pending ($pending)'),
                Tab(text: 'Paid ($paid)'),
              ];
            },
            loading: () => const [Tab(text: 'Overview'), Tab(text: 'Pending'), Tab(text: 'Paid')],
            error: (_, __) => const [Tab(text: 'Overview'), Tab(text: 'Pending'), Tab(text: 'Paid')],
          ),
        ),
      ),
      body: commissionsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
        data: (items) => TabBarView(
          controller: _tabController,
          children: [
            _OverviewTab(items: items),
            _PendingTab(items: items),
            _PaidTab(items: items),
          ],
        ),
      ),
    );
  }
}

// ── Overview Tab ──────────────────────────────────────────────────────────────

class _OverviewTab extends StatelessWidget {
  final List<CommissionItem> items;

  const _OverviewTab({required this.items});

  @override
  Widget build(BuildContext context) {
    final paid = items.where((c) => c.status == 'paid');
    final totalEarned = paid.fold(0.0, (s, c) => s + c.amount);

    final now = DateTime.now();
    final thisMonthEarned = paid
        .where((c) => _parseTs(c.paidAt)?.month == now.month &&
            _parseTs(c.paidAt)?.year == now.year)
        .fold(0.0, (s, c) => s + c.amount);

    final pendingAmount = items
        .where((c) => c.status == 'pending_approval')
        .fold(0.0, (s, c) => s + c.amount);
    final approvedAmount = items
        .where((c) => c.status == 'approved')
        .fold(0.0, (s, c) => s + c.amount);

    // Build simple monthly data from paid items (last 6 months)
    final monthlyData = _buildMonthlyData(paid.toList());

    final topProcedures = _buildTopProcedures(paid.toList());

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          // Hero card
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: AppColors.primaryGradient,
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(
                    color: AppColors.primary.withOpacity(0.3),
                    blurRadius: 16,
                    offset: const Offset(0, 6)),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text('This Month',
                        style: TextStyle(color: Colors.white.withOpacity(0.8), fontSize: 13)),
                  ],
                ),
                const SizedBox(height: 8),
                Text(AppFormatters.currency(thisMonthEarned),
                    style: const TextStyle(
                        fontFamily: 'Poppins',
                        color: Colors.white,
                        fontSize: 34,
                        fontWeight: FontWeight.bold)),
                const SizedBox(height: 20),
                Row(
                  children: [
                    Expanded(
                      child: _SummaryChip(
                          label: 'Pending',
                          value: AppFormatters.currency(pendingAmount),
                          icon: Icons.hourglass_empty,
                          color: AppColors.accentLight),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: _SummaryChip(
                          label: 'Approved',
                          value: AppFormatters.currency(approvedAmount),
                          icon: Icons.check_circle_outline,
                          color: Colors.greenAccent),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: _SummaryChip(
                          label: 'Total Earned',
                          value: AppFormatters.compactCurrency(totalEarned),
                          icon: Icons.account_balance_wallet,
                          color: Colors.white),
                    ),
                  ],
                ),
              ],
            ),
          ),

          const SizedBox(height: 24),

          // Bar chart
          if (monthlyData.isNotEmpty)
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.border),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('📊 Monthly Breakdown',
                      style: TextStyle(
                          fontFamily: 'Poppins',
                          fontSize: 15,
                          fontWeight: FontWeight.w600)),
                  const SizedBox(height: 20),
                  SizedBox(
                    height: 180,
                    child: BarChart(
                      BarChartData(
                        alignment: BarChartAlignment.spaceAround,
                        maxY: (monthlyData.map((m) => m['amount'] as double).reduce(
                              (a, b) => a > b ? a : b,
                            ) * 1.2).ceilToDouble(),
                        barGroups: monthlyData.asMap().entries.map((e) {
                          final idx = e.key;
                          final item = e.value;
                          return BarChartGroupData(
                            x: idx,
                            barRods: [
                              BarChartRodData(
                                toY: item['amount'] as double,
                                color: idx == monthlyData.length - 1
                                    ? AppColors.primary
                                    : AppColors.primary.withOpacity(0.35),
                                width: 28,
                                borderRadius: const BorderRadius.vertical(
                                    top: Radius.circular(6)),
                              ),
                            ],
                          );
                        }).toList(),
                        titlesData: FlTitlesData(
                          bottomTitles: AxisTitles(
                            sideTitles: SideTitles(
                              showTitles: true,
                              getTitlesWidget: (v, _) => Padding(
                                padding: const EdgeInsets.only(top: 6),
                                child: Text(
                                  monthlyData[v.toInt()]['month'] as String,
                                  style: const TextStyle(
                                      fontSize: 11, color: AppColors.textSecondary),
                                ),
                              ),
                            ),
                          ),
                          leftTitles: AxisTitles(
                            sideTitles: SideTitles(
                              showTitles: true,
                              reservedSize: 48,
                              getTitlesWidget: (v, _) => Text(
                                AppFormatters.compactCurrency(v),
                                style: const TextStyle(
                                    fontSize: 10, color: AppColors.textHint),
                              ),
                            ),
                          ),
                          topTitles: const AxisTitles(
                              sideTitles: SideTitles(showTitles: false)),
                          rightTitles: const AxisTitles(
                              sideTitles: SideTitles(showTitles: false)),
                        ),
                        gridData: FlGridData(
                          drawVerticalLine: false,
                          getDrawingHorizontalLine: (_) =>
                              const FlLine(color: AppColors.divider, strokeWidth: 1),
                        ),
                        borderData: FlBorderData(show: false),
                      ),
                    ),
                  ),
                ],
              ),
            ),

          const SizedBox(height: 16),

          // Top procedures
          if (topProcedures.isNotEmpty)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.border),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('🏆 Top Earning Procedures',
                      style: TextStyle(
                          fontFamily: 'Poppins',
                          fontSize: 15,
                          fontWeight: FontWeight.w600)),
                  const SizedBox(height: 16),
                  ...topProcedures.asMap().entries.map((e) {
                    final rank = e.key + 1;
                    final item = e.value;
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: Row(
                        children: [
                          Container(
                            width: 28,
                            height: 28,
                            decoration: BoxDecoration(
                              color: rank == 1
                                  ? AppColors.accent.withOpacity(0.15)
                                  : AppColors.background,
                              shape: BoxShape.circle,
                            ),
                            child: Center(
                              child: Text('$rank',
                                  style: TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 12,
                                      color: rank == 1
                                          ? AppColors.accent
                                          : AppColors.textSecondary)),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(item['procedure'] as String,
                                style: const TextStyle(
                                    fontSize: 13, fontWeight: FontWeight.w500)),
                          ),
                          Text(AppFormatters.currency(item['amount'] as double),
                              style: const TextStyle(
                                  fontWeight: FontWeight.w600,
                                  fontSize: 14,
                                  color: AppColors.secondary)),
                        ],
                      ),
                    );
                  }),
                ],
              ),
            ),

          const SizedBox(height: 20),
        ],
      ),
    );
  }

  List<Map<String, dynamic>> _buildMonthlyData(List<CommissionItem> paid) {
    final now = DateTime.now();
    final months = List.generate(6, (i) {
      final d = DateTime(now.year, now.month - 5 + i);
      return {'month': _monthLabel(d.month), 'year': d.year, 'monthNum': d.month, 'amount': 0.0};
    });
    for (final c in paid) {
      final ts = _parseTs(c.paidAt);
      if (ts == null) continue;
      for (final m in months) {
        if (m['monthNum'] == ts.month && m['year'] == ts.year) {
          m['amount'] = (m['amount'] as double) + c.amount;
        }
      }
    }
    return months;
  }

  List<Map<String, dynamic>> _buildTopProcedures(List<CommissionItem> paid) {
    final map = <String, double>{};
    for (final c in paid) {
      map[c.procedure] = (map[c.procedure] ?? 0) + c.amount;
    }
    final sorted = map.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));
    return sorted
        .take(5)
        .map((e) => {'procedure': e.key, 'amount': e.value})
        .toList();
  }

  String _monthLabel(int month) {
    const names = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return names[month - 1];
  }

  DateTime? _parseTs(String? ts) {
    if (ts == null) return null;
    try { return DateTime.parse(ts); } catch (_) { return null; }
  }
}

// ── Pending Tab ───────────────────────────────────────────────────────────────

class _PendingTab extends StatelessWidget {
  final List<CommissionItem> items;

  const _PendingTab({required this.items});

  @override
  Widget build(BuildContext context) {
    final pending  = items.where((c) => c.status == 'pending_approval' || c.status == 'approved').toList();
    final rejected = items.where((c) => c.status == 'rejected').toList();

    final pendingAmt  = pending.where((c) => c.status == 'pending_approval')
        .fold(0.0, (s, c) => s + c.amount);
    final approvedAmt = pending.where((c) => c.status == 'approved')
        .fold(0.0, (s, c) => s + c.amount);

    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        // ── Summary chips ──
        if (pending.isNotEmpty) ...[
          Row(
            children: [
              Expanded(
                child: _SummaryMiniCard(
                  label: 'Awaiting Approval',
                  amount: pendingAmt,
                  count: pending.where((c) => c.status == 'pending_approval').length,
                  color: AppColors.warning,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _SummaryMiniCard(
                  label: 'Approved — In Queue',
                  amount: approvedAmt,
                  count: pending.where((c) => c.status == 'approved').length,
                  color: AppColors.primary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
        ],

        if (pending.isEmpty)
          const Center(
            child: Padding(
              padding: EdgeInsets.symmetric(vertical: 40),
              child: Text('No pending commissions 🎉',
                  style: TextStyle(color: AppColors.textSecondary)),
            ),
          )
        else
          ...pending.map((c) => _PendingCard(item: c)),

        // ── Rejected ──
        if (rejected.isNotEmpty) ...[
          const SizedBox(height: 8),
          const Text('Rejected',
              style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textHint,
                  letterSpacing: 1)),
          const SizedBox(height: 8),
          ...rejected.map((c) => _RejectedCard(item: c)),
        ],
      ],
    );
  }
}

class _PendingCard extends StatelessWidget {
  final CommissionItem item;

  const _PendingCard({required this.item});

  @override
  Widget build(BuildContext context) {
    final statusLabel = item.status == 'approved'
        ? 'Approved — Awaiting Payment'
        : 'Awaiting Admin Approval';
    final statusColor = item.status == 'approved' ? AppColors.primary : AppColors.warning;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        children: [
          // Header
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 10),
            child: Row(
              children: [
                CircleAvatar(
                  backgroundColor: AppColors.primary.withOpacity(0.1),
                  child: Text(item.patientName.isNotEmpty ? item.patientName[0] : '?',
                      style: const TextStyle(
                          color: AppColors.primary, fontWeight: FontWeight.bold)),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(item.patientName,
                          style: const TextStyle(
                              fontWeight: FontWeight.w600, fontSize: 14)),
                      Text(item.procedure,
                          style: const TextStyle(
                              color: AppColors.textSecondary, fontSize: 12)),
                      Text('Submitted: ${AppFormatters.formatDate(item.createdAt)}',
                          style: const TextStyle(
                              color: AppColors.textHint, fontSize: 11)),
                    ],
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(AppFormatters.currency(item.amount),
                        style: const TextStyle(
                            fontFamily: 'Poppins',
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: AppColors.secondary)),
                    if (item.shareableAmount != null &&
                        item.shareableAmount != item.ticketSize)
                      Text('on ${AppFormatters.currency(item.shareableAmount!)} shareable',
                          style: const TextStyle(
                              fontSize: 10, color: AppColors.textHint)),
                  ],
                ),
              ],
            ),
          ),

          // MOP Breakdown
          if (item.mop != null && item.ticketSize != null)
            _MopBreakdown(item: item),

          // Footer
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 14),
            child: Wrap(
              spacing: 8,
              runSpacing: 4,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: statusColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: statusColor.withOpacity(0.3)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                          width: 6,
                          height: 6,
                          decoration: BoxDecoration(
                              color: statusColor, shape: BoxShape.circle)),
                      const SizedBox(width: 6),
                      Text(statusLabel,
                          style: TextStyle(
                              color: statusColor,
                              fontSize: 11,
                              fontWeight: FontWeight.w600)),
                    ],
                  ),
                ),
                if (item.expectedPaymentDate != null)
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.calendar_today,
                          size: 12, color: AppColors.textHint),
                      const SizedBox(width: 4),
                      Text('Expected: ${item.expectedPaymentDate}',
                          style: const TextStyle(
                              fontSize: 11, color: AppColors.textHint)),
                    ],
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _MopBreakdown extends StatelessWidget {
  final CommissionItem item;

  const _MopBreakdown({required this.item});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 0, 16, 10),
      decoration: BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: AppColors.divider,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
            ),
            child: const Row(
              children: [
                Icon(Icons.receipt_long, size: 14, color: AppColors.textSecondary),
                SizedBox(width: 6),
                Text('Bill Breakdown',
                    style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textSecondary)),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              children: [
                _BillRow(label: 'Total Bill', value: item.ticketSize!, isBold: true),
                if ((item.implantCost ?? 0) > 0)
                  _BillRow(label: '− Implants / Equipment', value: -item.implantCost!, color: Colors.red.shade600),
                if ((item.pharmacyCost ?? 0) > 0)
                  _BillRow(label: '− Pharmacy / Medicines', value: -item.pharmacyCost!, color: Colors.red.shade600),
                if ((item.labCost ?? 0) > 0)
                  _BillRow(label: '− Lab & Diagnostics', value: -item.labCost!, color: Colors.red.shade600),
                if ((item.discount ?? 0) > 0)
                  _BillRow(label: '− Hospital Discount', value: -item.discount!, color: Colors.amber.shade700),
                if ((item.otherDeductions ?? 0) > 0)
                  _BillRow(label: '− Other Deductions', value: -item.otherDeductions!),
                if ((item.totalDeductions ?? 0) > 0) ...[
                  const Divider(height: 12),
                  _BillRow(label: 'Total Deductions', value: -item.totalDeductions!, isBold: true, color: Colors.red.shade600),
                ],
                if (item.shareableAmount != null) ...[
                  const Divider(height: 12),
                  _BillRow(label: 'Shareable Amount', value: item.shareableAmount!, isBold: true, color: const Color(0xFF5B21B6)),
                ],
                const Divider(height: 12),
                _BillRow(label: 'Your Commission', value: item.amount, isBold: true, color: AppColors.secondary),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _BillRow extends StatelessWidget {
  final String label;
  final double value;
  final bool isBold;
  final Color? color;

  const _BillRow({required this.label, required this.value, this.isBold = false, this.color});

  @override
  Widget build(BuildContext context) {
    final displayColor = color ?? AppColors.textPrimary;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label,
              style: TextStyle(
                  fontSize: 12,
                  color: isBold ? displayColor : AppColors.textSecondary,
                  fontWeight: isBold ? FontWeight.w600 : FontWeight.normal)),
          Text(
            value < 0
                ? '− ${AppFormatters.currency(-value)}'
                : AppFormatters.currency(value),
            style: TextStyle(
                fontSize: 12,
                fontWeight: isBold ? FontWeight.bold : FontWeight.w500,
                color: displayColor),
          ),
        ],
      ),
    );
  }
}

class _RejectedCard extends StatelessWidget {
  final CommissionItem item;

  const _RejectedCard({required this.item});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.error.withOpacity(0.05),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.error.withOpacity(0.2)),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(item.patientName,
                    style: const TextStyle(fontWeight: FontWeight.w600)),
                Text(item.procedure,
                    style: const TextStyle(
                        color: AppColors.textSecondary, fontSize: 12)),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppColors.error.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: AppColors.error.withOpacity(0.3)),
                  ),
                  child: Text(
                    '❌ ${item.rejectedReason ?? "Rejected by admin"}',
                    style: const TextStyle(
                        color: AppColors.error,
                        fontSize: 11,
                        fontWeight: FontWeight.w500),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Text(AppFormatters.currency(item.amount),
              style: const TextStyle(
                  fontFamily: 'Poppins',
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: AppColors.error)),
        ],
      ),
    );
  }
}

// ── Paid Tab ──────────────────────────────────────────────────────────────────

class _PaidTab extends StatelessWidget {
  final List<CommissionItem> items;

  const _PaidTab({required this.items});

  @override
  Widget build(BuildContext context) {
    final paid = items.where((c) => c.status == 'paid').toList();

    if (paid.isEmpty) {
      return const Center(
        child: Text('No paid commissions yet',
            style: TextStyle(color: AppColors.textSecondary)),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(20),
      itemCount: paid.length,
      itemBuilder: (_, i) => _PaidCard(item: paid[i]),
    );
  }
}

class _PaidCard extends StatelessWidget {
  final CommissionItem item;

  const _PaidCard({required this.item});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: AppColors.secondary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.check_circle_outline,
                      color: AppColors.secondary),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(item.patientName,
                          style: const TextStyle(
                              fontWeight: FontWeight.w600, fontSize: 14)),
                      Text(item.procedure,
                          style: const TextStyle(
                              color: AppColors.textSecondary, fontSize: 12)),
                      Wrap(
                        spacing: 8,
                        children: [
                          if (item.paidAt != null)
                            Text('Paid: ${AppFormatters.formatDate(item.paidAt)}',
                                style: const TextStyle(
                                    fontSize: 11, color: AppColors.textHint)),
                          if (item.method != null)
                            Text('· ${item.method}',
                                style: const TextStyle(
                                    fontSize: 11, color: AppColors.textHint)),
                          if (item.utr != null)
                            Text('· UTR: ${item.utr}',
                                style: const TextStyle(
                                    fontSize: 11, color: AppColors.textHint)),
                        ],
                      ),
                    ],
                  ),
                ),
                Text(AppFormatters.currency(item.amount),
                    style: const TextStyle(
                        fontFamily: 'Poppins',
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: AppColors.secondary)),
              ],
            ),
          ),
          // MOP breakdown for paid too
          if (item.mop != null && item.ticketSize != null)
            _MopBreakdown(item: item),
        ],
      ),
    );
  }
}

// ── Shared helpers ─────────────────────────────────────────────────────────────

class _SummaryChip extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color color;

  const _SummaryChip({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.15),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: 6),
          Flexible(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(label,
                    overflow: TextOverflow.ellipsis,
                    maxLines: 1,
                    style:
                        TextStyle(color: Colors.white.withOpacity(0.7), fontSize: 10)),
                Text(value,
                    overflow: TextOverflow.ellipsis,
                    maxLines: 1,
                    style: TextStyle(
                        color: color, fontWeight: FontWeight.bold, fontSize: 13)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _SummaryMiniCard extends StatelessWidget {
  final String label;
  final double amount;
  final int count;
  final Color color;

  const _SummaryMiniCard({
    required this.label,
    required this.amount,
    required this.count,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: color.withOpacity(0.08),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withOpacity(0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label,
              style: TextStyle(
                  fontSize: 11, color: color, fontWeight: FontWeight.w600)),
          const SizedBox(height: 4),
          Text(AppFormatters.currency(amount),
              style: TextStyle(
                  fontFamily: 'Poppins',
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: color)),
          Text('$count commission${count != 1 ? 's' : ''}',
              style: TextStyle(fontSize: 11, color: color.withOpacity(0.7))),
        ],
      ),
    );
  }
}
