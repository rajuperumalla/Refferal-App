import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/constants/app_colors.dart';
import '../../../features/manager/providers/manager_provider.dart';

class ManagerAgentsScreen extends ConsumerStatefulWidget {
  const ManagerAgentsScreen({super.key});

  @override
  ConsumerState<ManagerAgentsScreen> createState() =>
      _ManagerAgentsScreenState();
}

class _ManagerAgentsScreenState
    extends ConsumerState<ManagerAgentsScreen> {
  String _search = '';
  String _filter = 'all';

  static const _purple = Color(0xFF7C3AED);

  @override
  Widget build(BuildContext context) {
    final agentsAsync   = ref.watch(teamAgentsStreamProvider);
    final patientsAsync = ref.watch(teamPatientsStreamProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: const Text('My Agents',
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
      body: agentsAsync.when(
        loading: () =>
            const Center(child: CircularProgressIndicator(color: _purple)),
        error: (e, _) =>
            Center(child: Text('Error: $e', style: const TextStyle(color: AppColors.error))),
        data: (agents) {
          final patients = patientsAsync.value ?? [];

          final filtered = agents.where((a) {
            final name   = (a['name'] as String? ?? '').toLowerCase();
            final id     = (a['id']   as String? ?? '').toLowerCase();
            final status = a['status'] as String? ?? '';
            final matchSearch = _search.isEmpty ||
                name.contains(_search.toLowerCase()) ||
                id.contains(_search.toLowerCase());
            final matchFilter = _filter == 'all' || status == _filter;
            return matchSearch && matchFilter;
          }).toList();

          return Column(
            children: [
              // ── Search + filter ──────────────────────────────────────────
              Container(
                color: Colors.white,
                padding: const EdgeInsets.all(12),
                child: Column(
                  children: [
                    TextField(
                      onChanged: (v) => setState(() => _search = v),
                      decoration: InputDecoration(
                        hintText: 'Search agents...',
                        prefixIcon: const Icon(Icons.search, size: 20),
                        contentPadding: const EdgeInsets.symmetric(
                            horizontal: 16, vertical: 10),
                        border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide:
                                const BorderSide(color: AppColors.border)),
                        enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide:
                                const BorderSide(color: AppColors.border)),
                        focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide:
                                const BorderSide(color: _purple)),
                      ),
                    ),
                    const SizedBox(height: 8),
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: [
                          'all',
                          'active',
                          'pending',
                          'inactive',
                          'suspended'
                        ].map((s) {
                          final label = s == 'all'
                              ? 'All (${agents.length})'
                              : '${s[0].toUpperCase()}${s.substring(1)}';
                          return Padding(
                            padding: const EdgeInsets.only(right: 8),
                            child: FilterChip(
                              label: Text(label),
                              selected: _filter == s,
                              onSelected: (_) =>
                                  setState(() => _filter = s),
                              selectedColor: _purple.withOpacity(0.15),
                              checkmarkColor: _purple,
                              labelStyle: TextStyle(
                                fontSize: 12,
                                color: _filter == s
                                    ? _purple
                                    : AppColors.textSecondary,
                                fontWeight: _filter == s
                                    ? FontWeight.w600
                                    : FontWeight.normal,
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                    ),
                  ],
                ),
              ),

              // ── Agent list ───────────────────────────────────────────────
              Expanded(
                child: filtered.isEmpty
                    ? const Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text('👥',
                                style: TextStyle(fontSize: 48)),
                            SizedBox(height: 12),
                            Text('No agents found',
                                style: TextStyle(
                                    color: AppColors.textSecondary,
                                    fontSize: 16)),
                          ],
                        ),
                      )
                    : ListView.separated(
                        padding: const EdgeInsets.all(12),
                        itemCount: filtered.length,
                        separatorBuilder: (_, __) =>
                            const SizedBox(height: 8),
                        itemBuilder: (context, i) {
                          final a = filtered[i];
                          final agentPatients = patients
                              .where((p) => p['agentId'] == a['id'])
                              .toList();
                          final completed = agentPatients
                              .where((p) => p['status'] == 'completed')
                              .length;
                          final conv = agentPatients.isNotEmpty
                              ? (completed /
                                      agentPatients.length *
                                      100)
                                  .toStringAsFixed(0)
                              : '0';
                          return _AgentCard(
                            agent: a,
                            patientCount: agentPatients.length,
                            convRate: conv,
                          );
                        },
                      ),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _AgentCard extends StatelessWidget {
  final Map<String, dynamic> agent;
  final int patientCount;
  final String convRate;

  const _AgentCard({
    required this.agent,
    required this.patientCount,
    required this.convRate,
  });

  static const _purple = Color(0xFF7C3AED);

  @override
  Widget build(BuildContext context) {
    final name      = agent['name']           as String? ?? '';
    final phone     = agent['phone']          as String? ?? '';
    final city      = agent['city']           as String? ?? '';
    final commRate  = (agent['commissionRate'] ?? 0).toDouble();
    final id        = agent['id']             as String? ?? '';
    final status    = agent['status']         as String? ?? 'pending';

    final (statusColor, statusLabel) = switch (status) {
      'active'    => (AppColors.secondary, 'Active'),
      'pending'   => (AppColors.accent, 'Pending'),
      'suspended' => (AppColors.error, 'Suspended'),
      _           => (AppColors.textHint, 'Inactive'),
    };

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 22,
                backgroundColor: _purple.withOpacity(0.1),
                child: Text(
                  name.isNotEmpty ? name[0].toUpperCase() : 'A',
                  style: const TextStyle(
                      color: _purple,
                      fontWeight: FontWeight.bold,
                      fontSize: 16),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(name,
                        style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 14,
                            color: AppColors.textPrimary)),
                    Text(
                      '${city.isNotEmpty ? "$city · " : ""}$phone',
                      style: const TextStyle(
                          fontSize: 11,
                          color: AppColors.textSecondary),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: statusColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(20),
                  border:
                      Border.all(color: statusColor.withOpacity(0.3)),
                ),
                child: Text(statusLabel,
                    style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                        color: statusColor)),
              ),
            ],
          ),
          const SizedBox(height: 12),
          const Divider(height: 1),
          const SizedBox(height: 12),
          Row(
            children: [
              _Metric(
                  label: 'Patients',
                  value: '$patientCount',
                  icon: Icons.people_outline),
              const SizedBox(width: 8),
              _Metric(
                  label: 'Conversion',
                  value: '$convRate%',
                  icon: Icons.trending_up_rounded),
              const SizedBox(width: 8),
              _Metric(
                  label: 'Commission',
                  value: '$commRate%',
                  icon: Icons.percent_rounded),
            ],
          ),
          const SizedBox(height: 8),
          Text(id,
              style: const TextStyle(
                  fontSize: 10,
                  color: AppColors.textHint,
                  fontFamily: 'monospace')),
        ],
      ),
    );
  }
}

class _Metric extends StatelessWidget {
  final String label, value;
  final IconData icon;
  const _Metric(
      {required this.label, required this.value, required this.icon});

  @override
  Widget build(BuildContext context) => Expanded(
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 6),
          decoration: BoxDecoration(
            color: AppColors.background,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Column(
            children: [
              Icon(icon, size: 14, color: AppColors.textSecondary),
              const SizedBox(height: 2),
              Text(value,
                  style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                      color: AppColors.textPrimary)),
              Text(label,
                  style: const TextStyle(
                      fontSize: 9, color: AppColors.textHint)),
            ],
          ),
        ),
      );
}
