import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/services/firestore_service.dart';
import '../../auth/providers/auth_provider.dart';

// ── Team Agents stream ────────────────────────────────────────────────────────

final teamAgentsStreamProvider =
    StreamProvider.autoDispose<List<Map<String, dynamic>>>((ref) {
  final user = ref.watch(currentUserProvider);
  if (user == null || !user.isManager) return Stream.value([]);
  return firestoreService.teamAgentsStream(user.agentId);
});

// ── Derived: list of agent IDs ────────────────────────────────────────────────

final teamAgentIdsProvider = Provider.autoDispose<List<String>>((ref) {
  return ref.watch(teamAgentsStreamProvider).maybeWhen(
        data: (agents) => agents.map((a) => a['id'] as String).toList(),
        orElse: () => [],
      );
});

// ── Team Patients stream ──────────────────────────────────────────────────────

final teamPatientsStreamProvider =
    StreamProvider.autoDispose<List<Map<String, dynamic>>>((ref) {
  final ids = ref.watch(teamAgentIdsProvider);
  if (ids.isEmpty) return Stream.value([]);
  return firestoreService.teamPatientsStream(ids);
});

// ── Team Commissions stream ───────────────────────────────────────────────────

final teamCommissionsStreamProvider =
    StreamProvider.autoDispose<List<Map<String, dynamic>>>((ref) {
  final ids = ref.watch(teamAgentIdsProvider);
  if (ids.isEmpty) return Stream.value([]);
  return firestoreService.teamCommissionsStream(ids);
});

// ── Aggregated team stats ─────────────────────────────────────────────────────

class TeamStats {
  final int totalAgents;
  final int activeAgents;
  final int totalPatients;
  final int activePatients;
  final int completedPatients;
  final double totalRevenue;
  final double thisMonthRevenue;
  final double pendingRevenue;
  final double conversionRate;

  const TeamStats({
    this.totalAgents = 0,
    this.activeAgents = 0,
    this.totalPatients = 0,
    this.activePatients = 0,
    this.completedPatients = 0,
    this.totalRevenue = 0,
    this.thisMonthRevenue = 0,
    this.pendingRevenue = 0,
    this.conversionRate = 0,
  });
}

final teamStatsProvider = Provider.autoDispose<TeamStats>((ref) {
  final agents = ref.watch(teamAgentsStreamProvider).value ?? [];
  final patients = ref.watch(teamPatientsStreamProvider).value ?? [];
  final commissions = ref.watch(teamCommissionsStreamProvider).value ?? [];

  final totalAgents = agents.length;
  final activeAgents = agents.where((a) => a['status'] == 'active').length;
  final totalPatients = patients.length;
  final activePatients = patients
      .where((p) => !['completed', 'lost'].contains(p['status']))
      .length;
  final completedPatients =
      patients.where((p) => p['status'] == 'completed').length;
  final conversionRate =
      totalPatients > 0 ? (completedPatients / totalPatients) * 100 : 0.0;

  final now = DateTime.now();
  double totalRevenue = 0;
  double thisMonthRevenue = 0;
  double pendingRevenue = 0;

  for (final c in commissions) {
    final amount = (c['amount'] ?? 0).toDouble();
    final status = c['status'] as String? ?? '';
    if (status == 'paid') {
      totalRevenue += amount;
      final ts = c['createdAt'];
      if (ts != null) {
        try {
          final date = ts is Timestamp ? ts.toDate() : DateTime.parse(ts.toString());
          if (date.year == now.year && date.month == now.month) {
            thisMonthRevenue += amount;
          }
        } catch (_) {}
      }
    } else if (status == 'pending_approval' || status == 'approved') {
      pendingRevenue += amount;
    }
  }

  return TeamStats(
    totalAgents: totalAgents,
    activeAgents: activeAgents,
    totalPatients: totalPatients,
    activePatients: activePatients,
    completedPatients: completedPatients,
    totalRevenue: totalRevenue,
    thisMonthRevenue: thisMonthRevenue,
    pendingRevenue: pendingRevenue,
    conversionRate: conversionRate,
  );
});
