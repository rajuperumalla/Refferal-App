import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shimmer/shimmer.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/utils/formatters.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../features/manager/providers/manager_provider.dart';

class ManagerHomeScreen extends ConsumerWidget {
  const ManagerHomeScreen({super.key});

  static const _purple     = Color(0xFF7C3AED);
  static const _purpleDark = Color(0xFF6D28D9);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user        = ref.watch(currentUserProvider);
    final agentsAsync = ref.watch(teamAgentsStreamProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: RefreshIndicator(
        color: _purple,
        onRefresh: () async {
          ref.invalidate(teamAgentsStreamProvider);
          ref.invalidate(teamPatientsStreamProvider);
          ref.invalidate(teamCommissionsStreamProvider);
        },
        child: CustomScrollView(
          slivers: [
            // ── Header ──────────────────────────────────────────────────────
            SliverAppBar(
              expandedHeight: 140,
              floating: false,
              pinned: true,
              backgroundColor: _purple,
              flexibleSpace: FlexibleSpaceBar(
                background: Container(
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      colors: [_purple, _purpleDark],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                  ),
                  child: SafeArea(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: MainAxisAlignment.end,
                        children: [
                          Row(
                            children: [
                              CircleAvatar(
                                radius: 24,
                                backgroundColor: Colors.white.withOpacity(0.2),
                                child: Text(
                                  (user?.firstName[0] ?? 'M').toUpperCase(),
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 20,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'Welcome, ${user?.firstName ?? "Manager"}',
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontSize: 18,
                                        fontWeight: FontWeight.bold,
                                        fontFamily: 'Poppins',
                                      ),
                                    ),
                                    Text(
                                      user?.agentId ?? '',
                                      style: TextStyle(
                                          color: Colors.white.withOpacity(0.7),
                                          fontSize: 12),
                                    ),
                                  ],
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color: Colors.white.withOpacity(0.2),
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                child: const Text(
                                  'MGR',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 11,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),

            SliverToBoxAdapter(
              child: agentsAsync.when(
                loading: () => _buildShimmer(),
                error: (e, _) => _buildError(ref),
                data: (agents) {
                  final stats    = ref.watch(teamStatsProvider);
                  final patients =
                      ref.watch(teamPatientsStreamProvider).value ?? [];
                  return _buildBody(context, ref, stats, agents, patients);
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBody(
    BuildContext context,
    WidgetRef ref,
    TeamStats stats,
    List<Map<String, dynamic>> agents,
    List<Map<String, dynamic>> patients,
  ) {
    // Top performer
    String? topAgentName;
    int topCount = 0;
    for (final a in agents) {
      final c = patients.where((p) => p['agentId'] == a['id']).length;
      if (c > topCount) { topCount = c; topAgentName = a['name'] as String?; }
    }

    final recent = patients.take(5).toList();

    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Revenue hero ──────────────────────────────────────────────────
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [_purple, _purpleDark],
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
                Text('Team Revenue — This Month',
                    style: TextStyle(
                        color: Colors.white.withOpacity(0.8), fontSize: 13)),
                const SizedBox(height: 6),
                Text(
                  AppFormatters.currency(stats.thisMonthRevenue),
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
                    _HeroChip(
                        label: 'Total Earned',
                        value: AppFormatters.compactCurrency(
                            stats.totalRevenue)),
                    const SizedBox(width: 8),
                    _HeroChip(
                        label: 'Pending',
                        value: AppFormatters.compactCurrency(
                            stats.pendingRevenue),
                        isWarning: true),
                    const SizedBox(width: 8),
                    _HeroChip(
                        label: 'Agents',
                        value: '${stats.totalAgents}'),
                  ],
                ),
              ],
            ),
          ),

          const SizedBox(height: 20),

          // ── KPI grid ──────────────────────────────────────────────────────
          const Text('Team Overview',
              style: TextStyle(
                  fontFamily: 'Poppins',
                  fontSize: 17,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textPrimary)),
          const SizedBox(height: 12),
          LayoutBuilder(builder: (ctx, constraints) {
            final cardW = (constraints.maxWidth - 12) / 2;
            return Wrap(
              spacing: 12,
              runSpacing: 12,
              children: [
                SizedBox(
                  width: cardW,
                  child: _KpiCard(
                    icon: Icons.people_alt_outlined,
                    label: 'Active Agents',
                    value: '${stats.activeAgents}/${stats.totalAgents}',
                    color: _purple,
                  ),
                ),
                SizedBox(
                  width: cardW,
                  child: _KpiCard(
                    icon: Icons.medical_services_outlined,
                    label: 'Active Patients',
                    value: '${stats.activePatients}',
                    color: const Color(0xFF0891B2),
                  ),
                ),
                SizedBox(
                  width: cardW,
                  child: _KpiCard(
                    icon: Icons.check_circle_outline,
                    label: 'Completed',
                    value: '${stats.completedPatients}',
                    color: AppColors.secondary,
                  ),
                ),
                SizedBox(
                  width: cardW,
                  child: _KpiCard(
                    icon: Icons.trending_up_rounded,
                    label: 'Conversion',
                    value:
                        '${stats.conversionRate.toStringAsFixed(0)}%',
                    color: AppColors.accent,
                  ),
                ),
              ],
            );
          }),

          const SizedBox(height: 24),

          // ── Top performer ─────────────────────────────────────────────────
          if (topAgentName != null) ...[
            const Text('🏆 Top Performer',
                style: TextStyle(
                    fontFamily: 'Poppins',
                    fontSize: 17,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary)),
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.border),
              ),
              child: Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: const Color(0xFFFEF3C7),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Center(
                        child: Text('🏅',
                            style: TextStyle(fontSize: 22))),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(topAgentName!,
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 15,
                              color: AppColors.textPrimary,
                            )),
                        Text('$topCount patients referred',
                            style: const TextStyle(
                                fontSize: 12,
                                color: AppColors.textSecondary)),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                      color:
                          const Color(0xFFF59E0B).withOpacity(0.1),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: const Text('⭐ Star',
                        style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFFD97706))),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
          ],

          // ── Recent patients ───────────────────────────────────────────────
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('👥 Recent Patients',
                  style: TextStyle(
                      fontFamily: 'Poppins',
                      fontSize: 17,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textPrimary)),
              TextButton(
                onPressed: () => context.go('/manager/patients'),
                child: const Text('View all'),
              ),
            ],
          ),
          const SizedBox(height: 8),
          if (recent.isEmpty)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.border),
              ),
              child: const Column(
                children: [
                  Text('👥', style: TextStyle(fontSize: 32)),
                  SizedBox(height: 8),
                  Text('No team patients yet',
                      style:
                          TextStyle(color: AppColors.textSecondary)),
                  SizedBox(height: 4),
                  Text(
                    'Patients from your agents will appear here',
                    style: TextStyle(
                        fontSize: 12, color: AppColors.textHint),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            )
          else
            Container(
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.border),
              ),
              child: Column(
                children: recent.asMap().entries.map((e) {
                  final i = e.key;
                  final p = e.value;
                  final name = p['name'] as String? ?? 'Patient';
                  final specialty = p['specialty'] as String? ?? '';
                  final status = p['status'] as String? ?? 'new';
                  final agentId = p['agentId'] as String? ?? '';
                  final agent = agents.firstWhere(
                      (a) => a['id'] == agentId,
                      orElse: () => {});
                  final agentName = agent['name'] as String? ?? '';
                  return Column(
                    children: [
                      ListTile(
                        leading: CircleAvatar(
                          backgroundColor:
                              _purple.withOpacity(0.1),
                          child: Text(
                            name[0].toUpperCase(),
                            style: const TextStyle(
                                color: _purple,
                                fontWeight: FontWeight.bold),
                          ),
                        ),
                        title: Text(name,
                            style: const TextStyle(
                                fontWeight: FontWeight.w600,
                                fontSize: 14)),
                        subtitle: Text(
                          '$specialty${agentName.isNotEmpty ? " · via $agentName" : ""}',
                          style: const TextStyle(fontSize: 11),
                        ),
                        trailing: _StatusPill(status: status),
                      ),
                      if (i < recent.length - 1)
                        const Divider(height: 1, indent: 72),
                    ],
                  );
                }).toList(),
              ),
            ),

          const SizedBox(height: 80),
        ],
      ),
    );
  }

  Widget _buildShimmer() => Shimmer.fromColors(
        baseColor: Colors.grey.shade200,
        highlightColor: Colors.grey.shade100,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: List.generate(
              4,
              (_) => Container(
                height: 80,
                margin: const EdgeInsets.only(bottom: 12),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
            ),
          ),
        ),
      );

  Widget _buildError(WidgetRef ref) => Center(
        child: Padding(
          padding: const EdgeInsets.all(40),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.wifi_off, size: 48, color: AppColors.textHint),
              const SizedBox(height: 16),
              const Text('Unable to load dashboard',
                  style: TextStyle(color: AppColors.textSecondary)),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () {
                  ref.invalidate(teamAgentsStreamProvider);
                  ref.invalidate(teamPatientsStreamProvider);
                },
                style: ElevatedButton.styleFrom(
                    backgroundColor: _purple),
                child: const Text('Retry',
                    style: TextStyle(color: Colors.white)),
              ),
            ],
          ),
        ),
      );
}

// ── Private widgets ───────────────────────────────────────────────────────────

class _HeroChip extends StatelessWidget {
  final String label, value;
  final bool isWarning;
  const _HeroChip(
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
                  overflow: TextOverflow.ellipsis,
                  maxLines: 1,
                  style: TextStyle(
                      color: Colors.white.withOpacity(0.7),
                      fontSize: 10)),
              Text(value,
                  overflow: TextOverflow.ellipsis,
                  maxLines: 1,
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

class _KpiCard extends StatelessWidget {
  final IconData icon;
  final String label, value;
  final Color color;
  const _KpiCard(
      {required this.icon,
      required this.label,
      required this.value,
      required this.color});

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppColors.surface,
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
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(value,
                      style: TextStyle(
                          fontFamily: 'Poppins',
                          fontWeight: FontWeight.bold,
                          fontSize: 18,
                          color: color)),
                  Text(label,
                      style: const TextStyle(
                          fontSize: 11,
                          color: AppColors.textSecondary)),
                ],
              ),
            ),
          ],
        ),
      );
}

class _StatusPill extends StatelessWidget {
  final String status;
  const _StatusPill({required this.status});

  @override
  Widget build(BuildContext context) {
    final (color, label) = switch (status) {
      'new'           => (const Color(0xFF3B82F6), 'New'),
      'contacted'     => (const Color(0xFFF59E0B), 'Contacted'),
      'opd_scheduled' => (const Color(0xFF10B981), 'OPD'),
      'ipd_confirmed' => (const Color(0xFF8B5CF6), 'IPD'),
      'completed'     => (const Color(0xFF059669), 'Done'),
      'lost'          => (const Color(0xFFEF4444), 'Lost'),
      _               => (Colors.grey, status),
    };
    return Container(
      padding:
          const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Text(label,
          style: TextStyle(
              color: color,
              fontSize: 10,
              fontWeight: FontWeight.w600)),
    );
  }
}
