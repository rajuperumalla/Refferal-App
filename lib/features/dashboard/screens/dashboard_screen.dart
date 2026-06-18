import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shimmer/shimmer.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/utils/formatters.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../features/patients/models/patient_model.dart';
import '../../../features/patients/providers/patients_provider.dart';
import '../../../shared/widgets/stat_card.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(currentUserProvider);
    final patientsAsync = ref.watch(patientsStreamProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(patientsStreamProvider),
        child: CustomScrollView(
          slivers: [
            // App Bar
            SliverAppBar(
              expandedHeight: 130,
              floating: false,
              pinned: true,
              backgroundColor: AppColors.primary,
              flexibleSpace: FlexibleSpaceBar(
                background: Container(
                  decoration: const BoxDecoration(gradient: AppColors.primaryGradient),
                  child: SafeArea(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(20, 16, 20, 16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: MainAxisAlignment.end,
                        children: [
                          Row(
                            children: [
                              CircleAvatar(
                                radius: 22,
                                backgroundColor: Colors.white.withOpacity(0.2),
                                child: Text(
                                  user?.firstName[0].toUpperCase() ?? 'A',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 18,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'Welcome back,',
                                      style: TextStyle(
                                        color: Colors.white.withOpacity(0.8),
                                        fontSize: 13,
                                      ),
                                    ),
                                    Text(
                                      user?.firstName ?? 'Agent',
                                      style: const TextStyle(
                                        fontFamily: 'Poppins',
                                        color: Colors.white,
                                        fontSize: 20,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              IconButton(
                                icon: const Icon(Icons.notifications_outlined, color: Colors.white),
                                onPressed: () => context.go('/notifications'),
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
              child: patientsAsync.when(
                loading: () => _buildShimmer(),
                error: (e, _) => _buildError(ref),
                data: (patients) => _buildContent(context, patients),
              ),
            ),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/add-patient'),
        backgroundColor: AppColors.primary,
        icon: const Icon(Icons.add, color: Colors.white),
        label: const Text('Add Patient',
            style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
      ),
    );
  }

  Widget _buildContent(BuildContext context, List<PatientModel> patients) {
    // Compute stats from real patient data
    final active = patients.where(
      (p) => p.status != PatientStatus.completed && p.status != PatientStatus.lost,
    ).length;
    final pendingSurgeries = patients.where((p) => p.status == PatientStatus.ipdConfirmed).length;
    final completed = patients.where((p) => p.status == PatientStatus.completed).length;
    final conversionRate = patients.isNotEmpty
        ? ((completed / patients.length) * 100).toStringAsFixed(0)
        : '0';
    final avgCommission = patients.isNotEmpty
        ? patients.map((p) => p.expectedCommission).reduce((a, b) => a + b) / patients.length
        : 0.0;

    // Contact tracking
    final contacted = patients.where((p) => p.status != PatientStatus.newLead).length;
    final opdToIpd = patients.where((p) =>
      p.status == PatientStatus.ipdConfirmed || p.status == PatientStatus.completed).length;

    // Recent patients (last 4)
    final recent = patients.take(4).toList();

    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Earnings Hero Card ──────────────────────────────────────────
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
                  offset: const Offset(0, 6),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'This Month\'s Earnings',
                  style: TextStyle(color: Colors.white.withOpacity(0.8), fontSize: 13),
                ),
                const SizedBox(height: 6),
                const Text(
                  '₹0',
                  style: TextStyle(
                    fontFamily: 'Poppins',
                    color: Colors.white,
                    fontSize: 32,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(child: _EarningsChip(label: 'Total Earned', value: '₹0')),
                    const SizedBox(width: 12),
                    Expanded(child: _EarningsChip(label: 'Pending', value: '₹0', isWarning: true)),
                    const SizedBox(width: 12),
                    Expanded(child: _EarningsChip(label: 'Total Leads', value: '${patients.length}')),
                  ],
                ),
              ],
            ),
          ),

          const SizedBox(height: 20),

          // ── Quick Stats Grid ─────────────────────────────────────────────
          const Text('Quick Stats',
              style: TextStyle(
                  fontFamily: 'Poppins',
                  fontSize: 17,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textPrimary)),
          const SizedBox(height: 12),
          GridView.count(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisCount: 2,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            childAspectRatio: (MediaQuery.of(context).size.width - 52) / 2 / 130,
            children: [
              StatCard(
                title: 'Active Patients',
                value: '$active',
                icon: Icons.people_alt_outlined,
                color: AppColors.primary,
              ),
              StatCard(
                title: 'Pending Surgeries',
                value: '$pendingSurgeries',
                icon: Icons.medical_services_outlined,
                color: AppColors.accent,
              ),
              StatCard(
                title: 'Conversion Rate',
                value: '$conversionRate%',
                icon: Icons.trending_up_rounded,
                color: AppColors.secondary,
              ),
              StatCard(
                title: 'Avg Commission',
                value: AppFormatters.compactCurrency(avgCommission),
                icon: Icons.account_balance_wallet_outlined,
                color: AppColors.statusIPD,
              ),
            ],
          ),

          const SizedBox(height: 24),

          // ── Contact Tracking Section ─────────────────────────────────────
          const Text('📞 Contact Tracking',
              style: TextStyle(
                  fontFamily: 'Poppins',
                  fontSize: 17,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textPrimary)),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _ContactStatCard(
                  icon: '☎️',
                  label: 'Contacted',
                  value: '$contacted',
                  subtext: 'patients reached',
                  color: const Color(0xFF0891B2),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _ContactStatCard(
                  icon: '🔄',
                  label: 'OPD→IPD',
                  value: '$opdToIpd',
                  subtext: 'conversion success',
                  color: const Color(0xFF7C3AED),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _ContactStatCard(
                  icon: '✅',
                  label: 'Completed',
                  value: '$completed',
                  subtext: 'cases closed',
                  color: AppColors.secondary,
                ),
              ),
            ],
          ),

          const SizedBox(height: 24),

          // ── Recent Patients ───────────────────────────────────────────────
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
                onPressed: () => context.go('/patients'),
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
              child: Column(
                children: [
                  const Text('No patients yet', style: TextStyle(color: AppColors.textSecondary)),
                  TextButton(
                    onPressed: () => context.push('/add-patient'),
                    child: const Text('Add Patient →'),
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
                children: recent.asMap().entries.map((entry) {
                  final i = entry.key;
                  final p = entry.value;
                  return Column(
                    children: [
                      ListTile(
                        leading: CircleAvatar(
                          backgroundColor: AppColors.primary.withOpacity(0.1),
                          child: Text(
                            p.initials,
                            style: const TextStyle(
                              color: AppColors.primary,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                        title: Text(p.name,
                            style: const TextStyle(
                                fontWeight: FontWeight.w600, fontSize: 14)),
                        subtitle: Text('${p.specialty} · ${p.procedure}',
                            style: const TextStyle(fontSize: 12)),
                        trailing: _StatusBadge(status: p.status),
                        onTap: () => context.push('/patient/${p.id}'),
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

  Widget _buildShimmer() {
    return Shimmer.fromColors(
      baseColor: Colors.grey.shade200,
      highlightColor: Colors.grey.shade100,
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: List.generate(
            5,
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
  }

  Widget _buildError(WidgetRef ref) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          children: [
            const Icon(Icons.wifi_off, size: 48, color: AppColors.textHint),
            const SizedBox(height: 16),
            const Text('Unable to load dashboard',
                style: TextStyle(color: AppColors.textSecondary)),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => ref.invalidate(patientsStreamProvider),
              child: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }
}

class _EarningsChip extends StatelessWidget {
  final String label;
  final String value;
  final bool isWarning;

  const _EarningsChip({required this.label, required this.value, this.isWarning = false});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
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
              style: TextStyle(color: Colors.white.withOpacity(0.7), fontSize: 10)),
          Text(value,
              overflow: TextOverflow.ellipsis,
              maxLines: 1,
              style: TextStyle(
                color: isWarning ? AppColors.accentLight : Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 13,
              )),
        ],
      ),
    );
  }
}

class _ContactStatCard extends StatelessWidget {
  final String icon;
  final String label;
  final String value;
  final String subtext;
  final Color color;

  const _ContactStatCard({
    required this.icon,
    required this.label,
    required this.value,
    required this.subtext,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                label,
                style: const TextStyle(
                    fontSize: 11, color: AppColors.textSecondary),
              ),
              Text(icon, style: const TextStyle(fontSize: 18)),
            ],
          ),
          const SizedBox(height: 6),
          Text(value,
              style: TextStyle(
                  fontFamily: 'Poppins',
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: color)),
          const SizedBox(height: 2),
          Text(subtext,
              style: const TextStyle(fontSize: 10, color: AppColors.textHint)),
        ],
      ),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  final PatientStatus status;

  const _StatusBadge({required this.status});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: status.color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: status.color.withOpacity(0.3)),
      ),
      child: Text(
        status.label,
        style: TextStyle(
            color: status.color,
            fontSize: 10,
            fontWeight: FontWeight.w600),
      ),
    );
  }
}
