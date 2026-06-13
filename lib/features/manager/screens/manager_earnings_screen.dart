import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/utils/formatters.dart';
import '../../../features/manager/providers/manager_provider.dart';

class ManagerEarningsScreen extends ConsumerWidget {
  const ManagerEarningsScreen({super.key});

  static const _purple = Color(0xFF7C3AED);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final stats           = ref.watch(teamStatsProvider);
    final commissionsAsync = ref.watch(teamCommissionsStreamProvider);
    final agentsAsync     = ref.watch(teamAgentsStreamProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: const Text('Team Earnings',
            style: TextStyle(
              fontFamily: 'Poppins',
              fontWeight: FontWeight.bold,
              fontSize: 18,
              color: AppColors.textPrimary,
            )),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(height: 1, color: AppColors.border),
        ),
      ),
      body: commissionsAsync.when(
        loading: () =>
            const Center(child: CircularProgressIndicator(color: _purple)),
        error: (e, _) => Center(child: Text('Error: $e')),
        data: (commissions) {
          final agents = agentsAsync.value ?? [];

          // Per-agent paid totals
          final agentEarnings = <String, double>{};
          for (final c in commissions) {
            final agentId = c['agentId'] as String? ?? '';
            final amount  = (c['amount'] ?? 0).toDouble();
            if (c['status'] == 'paid') {
              agentEarnings[agentId] =
                  (agentEarnings[agentId] ?? 0) + amount;
            }
          }

          final sortedAgents = [...agents]
            ..sort((a, b) => (agentEarnings[b['id']] ?? 0)
                .compareTo(agentEarnings[a['id']] ?? 0));

          final pending = commissions
              .where((c) =>
                  c['status'] == 'pending_approval' ||
                  c['status'] == 'approved')
              .toList();
          final paid = commissions
              .where((c) => c['status'] == 'paid')
              .toList();

          final maxEarned = sortedAgents.isNotEmpty
              ? (agentEarnings[sortedAgents.first['id']] ?? 1.0)
              : 1.0;

          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // ── Revenue hero ────────────────────────────────────────────
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [_purple, Color(0xFF6D28D9)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: [
                      BoxShadow(
                        color: _purple.withOpacity(0.3),
                        blurRadius: 16,
                        offset: const Offset(0, 6),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Total Team Earnings',
                          style: TextStyle(
                              color: Colors.white.withOpacity(0.8),
                              fontSize: 13)),
                      const SizedBox(height: 6),
                      Text(
                        AppFormatters.currency(stats.totalRevenue),
                        style: const TextStyle(
                          fontFamily: 'Poppins',
                          color: Colors.white,
                          fontSize: 30,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          _SummaryChip(
                              label: 'This Month',
                              value: AppFormatters.compactCurrency(
                                  stats.thisMonthRevenue)),
                          const SizedBox(width: 8),
                          _SummaryChip(
                              label: 'Pending',
                              value: AppFormatters.compactCurrency(
                                  stats.pendingRevenue),
                              isWarning: true),
                          const SizedBox(width: 8),
                          _SummaryChip(
                              label: 'Records',
                              value: '${commissions.length}'),
                        ],
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 16),

                // ── Status tiles ────────────────────────────────────────────
                Row(
                  children: [
                    Expanded(
                      child: _StatTile(
                        label: 'Paid',
                        value: '${paid.length}',
                        color: AppColors.secondary,
                        icon: Icons.check_circle_outline,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _StatTile(
                        label: 'Pending',
                        value: '${pending.length}',
                        color: AppColors.accent,
                        icon: Icons.hourglass_empty_rounded,
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 24),

                // ── Per-agent breakdown ─────────────────────────────────────
                const Text('📊 Agent Earnings',
                    style: TextStyle(
                        fontFamily: 'Poppins',
                        fontSize: 17,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textPrimary)),
                const SizedBox(height: 12),

                if (sortedAgents.isEmpty)
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: const Column(
                      children: [
                        Text('💰',
                            style: TextStyle(fontSize: 32)),
                        SizedBox(height: 8),
                        Text('No agents in team yet',
                            style: TextStyle(
                                color: AppColors.textSecondary)),
                      ],
                    ),
                  )
                else
                  ...sortedAgents.asMap().entries.map((entry) {
                    final rank   = entry.key + 1;
                    final a      = entry.value;
                    final name   = a['name'] as String? ?? '';
                    final city   = a['city'] as String? ?? '';
                    final earned = agentEarnings[a['id']] ?? 0.0;

                    final agentPending = commissions
                        .where((c) =>
                            c['agentId'] == a['id'] &&
                            (c['status'] == 'pending_approval' ||
                                c['status'] == 'approved'))
                        .fold<double>(
                            0,
                            (s, c) =>
                                s + (c['amount'] ?? 0).toDouble());

                    final barWidth = maxEarned > 0
                        ? earned / maxEarned
                        : 0.0;

                    return Container(
                      margin: const EdgeInsets.only(bottom: 10),
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: Column(
                        children: [
                          Row(
                            children: [
                              // Rank badge
                              Container(
                                width: 30,
                                height: 30,
                                decoration: BoxDecoration(
                                  color: rank == 1
                                      ? const Color(0xFFFEF3C7)
                                      : rank == 2
                                          ? const Color(0xFFF1F5F9)
                                          : AppColors.background,
                                  shape: BoxShape.circle,
                                ),
                                child: Center(
                                  child: Text(
                                    rank == 1
                                        ? '🥇'
                                        : rank == 2
                                            ? '🥈'
                                            : '$rank',
                                    style: TextStyle(
                                      fontSize: rank <= 2 ? 14 : 11,
                                      fontWeight: FontWeight.bold,
                                      color: AppColors.textSecondary,
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment:
                                      CrossAxisAlignment.start,
                                  children: [
                                    Text(name,
                                        style: const TextStyle(
                                            fontWeight: FontWeight.bold,
                                            fontSize: 14,
                                            color: AppColors
                                                .textPrimary)),
                                    if (city.isNotEmpty)
                                      Text(city,
                                          style: const TextStyle(
                                              fontSize: 11,
                                              color: AppColors
                                                  .textSecondary)),
                                  ],
                                ),
                              ),
                              Column(
                                crossAxisAlignment:
                                    CrossAxisAlignment.end,
                                children: [
                                  Text(
                                    AppFormatters.compactCurrency(
                                        earned),
                                    style: const TextStyle(
                                        fontWeight: FontWeight.bold,
                                        fontSize: 15,
                                        color: AppColors.secondary),
                                  ),
                                  if (agentPending > 0)
                                    Text(
                                      '${AppFormatters.compactCurrency(agentPending)} pending',
                                      style: const TextStyle(
                                          fontSize: 10,
                                          color: AppColors.accent),
                                    ),
                                ],
                              ),
                            ],
                          ),
                          const SizedBox(height: 10),
                          ClipRRect(
                            borderRadius: BorderRadius.circular(4),
                            child: LinearProgressIndicator(
                              value: barWidth.clamp(0.0, 1.0),
                              backgroundColor: AppColors.border,
                              valueColor:
                                  AlwaysStoppedAnimation<Color>(
                                rank == 1
                                    ? const Color(0xFFF59E0B)
                                    : _purple,
                              ),
                              minHeight: 6,
                            ),
                          ),
                        ],
                      ),
                    );
                  }),

                const SizedBox(height: 80),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _SummaryChip extends StatelessWidget {
  final String label, value;
  final bool isWarning;
  const _SummaryChip(
      {required this.label, required this.value, this.isWarning = false});

  @override
  Widget build(BuildContext context) => Expanded(
        child: Container(
          padding:
              const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.15),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(label,
                  style: TextStyle(
                      color: Colors.white.withOpacity(0.7),
                      fontSize: 10)),
              Text(value,
                  style: TextStyle(
                    color: isWarning
                        ? const Color(0xFFFBBF24)
                        : Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 13,
                  )),
            ],
          ),
        ),
      );
}

class _StatTile extends StatelessWidget {
  final String label, value;
  final Color color;
  final IconData icon;
  const _StatTile(
      {required this.label,
      required this.value,
      required this.color,
      required this.icon});

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border),
        ),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: color, size: 20),
            ),
            const SizedBox(width: 10),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(value,
                    style: TextStyle(
                        fontFamily: 'Poppins',
                        fontWeight: FontWeight.bold,
                        fontSize: 22,
                        color: color)),
                Text(label,
                    style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.textSecondary)),
              ],
            ),
          ],
        ),
      );
}
