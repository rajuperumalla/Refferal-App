import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/constants/app_colors.dart';
import '../../../features/manager/providers/manager_provider.dart';

class ManagerPatientsScreen extends ConsumerStatefulWidget {
  const ManagerPatientsScreen({super.key});

  @override
  ConsumerState<ManagerPatientsScreen> createState() =>
      _ManagerPatientsScreenState();
}

class _ManagerPatientsScreenState
    extends ConsumerState<ManagerPatientsScreen> {
  String _search       = '';
  String _statusFilter = 'all';

  static const _purple = Color(0xFF7C3AED);

  static const _statusOptions = [
    ('all',           'All'),
    ('new',           'New'),
    ('contacted',     'Contacted'),
    ('opd_scheduled', 'OPD'),
    ('ipd_confirmed', 'IPD'),
    ('completed',     'Completed'),
    ('lost',          'Lost'),
  ];

  @override
  Widget build(BuildContext context) {
    final patientsAsync = ref.watch(teamPatientsStreamProvider);
    final agentsAsync   = ref.watch(teamAgentsStreamProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: const Text('Team Patients',
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
      body: patientsAsync.when(
        loading: () =>
            const Center(child: CircularProgressIndicator(color: _purple)),
        error: (e, _) => Center(child: Text('Error: $e')),
        data: (patients) {
          final agents = agentsAsync.value ?? [];

          final filtered = patients.where((p) {
            final name      = (p['name']      as String? ?? '').toLowerCase();
            final specialty = (p['specialty'] as String? ?? '').toLowerCase();
            final status    = p['status'] as String? ?? '';
            final matchSearch = _search.isEmpty ||
                name.contains(_search.toLowerCase()) ||
                specialty.contains(_search.toLowerCase());
            final matchFilter =
                _statusFilter == 'all' || status == _statusFilter;
            return matchSearch && matchFilter;
          }).toList();

          return Column(
            children: [
              // ── Search + filters ─────────────────────────────────────────
              Container(
                color: Colors.white,
                padding: const EdgeInsets.all(12),
                child: Column(
                  children: [
                    TextField(
                      onChanged: (v) => setState(() => _search = v),
                      decoration: InputDecoration(
                        hintText: 'Search patients...',
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
                        children: _statusOptions.map((opt) {
                          final (val, label) = opt;
                          return Padding(
                            padding: const EdgeInsets.only(right: 8),
                            child: FilterChip(
                              label: Text(label),
                              selected: _statusFilter == val,
                              onSelected: (_) =>
                                  setState(() => _statusFilter = val),
                              selectedColor: _purple.withOpacity(0.15),
                              checkmarkColor: _purple,
                              labelStyle: TextStyle(
                                fontSize: 12,
                                color: _statusFilter == val
                                    ? _purple
                                    : AppColors.textSecondary,
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                    ),
                  ],
                ),
              ),

              // Count
              Padding(
                padding: const EdgeInsets.symmetric(
                    horizontal: 16, vertical: 8),
                child: Align(
                  alignment: Alignment.centerLeft,
                  child: Text(
                    '${filtered.length} patient${filtered.length == 1 ? "" : "s"}',
                    style: const TextStyle(
                        fontSize: 13,
                        color: AppColors.textSecondary,
                        fontWeight: FontWeight.w500),
                  ),
                ),
              ),

              // ── List ──────────────────────────────────────────────────────
              Expanded(
                child: filtered.isEmpty
                    ? const Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text('🏥',
                                style: TextStyle(fontSize: 48)),
                            SizedBox(height: 12),
                            Text('No patients found',
                                style: TextStyle(
                                    color: AppColors.textSecondary,
                                    fontSize: 16)),
                          ],
                        ),
                      )
                    : ListView.separated(
                        padding: const EdgeInsets.fromLTRB(
                            12, 0, 12, 80),
                        itemCount: filtered.length,
                        separatorBuilder: (_, __) =>
                            const SizedBox(height: 8),
                        itemBuilder: (_, i) {
                          final p         = filtered[i];
                          final name      = p['name']      as String? ?? '';
                          final specialty = p['specialty'] as String? ?? '';
                          final procedure = p['procedure'] as String? ?? '';
                          final status    = p['status']    as String? ?? 'new';
                          final city      = p['city']      as String? ?? '';
                          final age       = p['age']?.toString() ?? '';
                          final agentId   = p['agentId']   as String? ?? '';
                          final comm      = (p['expectedCommission'] ?? 0).toDouble();

                          final agent     = agents.firstWhere(
                              (a) => a['id'] == agentId,
                              orElse: () => {});
                          final agentName = agent['name'] as String? ?? '';

                          final (sc, sl) = _statusInfo(status);

                          return Container(
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius:
                                  BorderRadius.circular(16),
                              border:
                                  Border.all(color: AppColors.border),
                            ),
                            child: Column(
                              crossAxisAlignment:
                                  CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    CircleAvatar(
                                      radius: 20,
                                      backgroundColor:
                                          _purple.withOpacity(0.1),
                                      child: Text(
                                        name.isNotEmpty
                                            ? name[0].toUpperCase()
                                            : 'P',
                                        style: const TextStyle(
                                            color: _purple,
                                            fontWeight:
                                                FontWeight.bold),
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
                                                  fontWeight:
                                                      FontWeight.bold,
                                                  fontSize: 14,
                                                  color: AppColors
                                                      .textPrimary)),
                                          Text(
                                            '${age.isNotEmpty ? "$age yrs · " : ""}$city',
                                            style: const TextStyle(
                                                fontSize: 11,
                                                color: AppColors
                                                    .textSecondary),
                                          ),
                                        ],
                                      ),
                                    ),
                                    Container(
                                      padding: const EdgeInsets
                                          .symmetric(
                                          horizontal: 8,
                                          vertical: 3),
                                      decoration: BoxDecoration(
                                        color: sc.withOpacity(0.1),
                                        borderRadius:
                                            BorderRadius.circular(20),
                                        border: Border.all(
                                            color: sc.withOpacity(
                                                0.3)),
                                      ),
                                      child: Text(sl,
                                          style: TextStyle(
                                              fontSize: 10,
                                              fontWeight:
                                                  FontWeight.bold,
                                              color: sc)),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 10),
                                Row(
                                  children: [
                                    Expanded(
                                      child: Text(
                                        '$specialty${procedure.isNotEmpty ? " · $procedure" : ""}',
                                        style: const TextStyle(
                                            fontSize: 12,
                                            color: AppColors
                                                .textSecondary),
                                        overflow:
                                            TextOverflow.ellipsis,
                                      ),
                                    ),
                                    if (comm > 0)
                                      Container(
                                        padding:
                                            const EdgeInsets.symmetric(
                                                horizontal: 8,
                                                vertical: 3),
                                        decoration: BoxDecoration(
                                          color: AppColors.secondary
                                              .withOpacity(0.1),
                                          borderRadius:
                                              BorderRadius.circular(8),
                                        ),
                                        child: Text(
                                          '₹${comm.toStringAsFixed(0)}',
                                          style: const TextStyle(
                                              fontSize: 11,
                                              fontWeight:
                                                  FontWeight.bold,
                                              color:
                                                  AppColors.secondary),
                                        ),
                                      ),
                                  ],
                                ),
                                if (agentName.isNotEmpty) ...[
                                  const SizedBox(height: 6),
                                  Row(
                                    children: [
                                      const Icon(
                                          Icons.person_outline,
                                          size: 12,
                                          color: AppColors.textHint),
                                      const SizedBox(width: 4),
                                      Text('via $agentName',
                                          style: const TextStyle(
                                              fontSize: 11,
                                              color:
                                                  AppColors.textHint)),
                                    ],
                                  ),
                                ],
                              ],
                            ),
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

  (Color, String) _statusInfo(String s) => switch (s) {
        'new'           => (const Color(0xFF3B82F6), 'New'),
        'contacted'     => (const Color(0xFFF59E0B), 'Contacted'),
        'opd_scheduled' => (const Color(0xFF10B981), 'OPD'),
        'ipd_confirmed' => (const Color(0xFF8B5CF6), 'IPD'),
        'completed'     => (const Color(0xFF059669), 'Done'),
        'lost'          => (const Color(0xFFEF4444), 'Lost'),
        _               => (Colors.grey, s),
      };
}
