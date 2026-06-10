import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../features/manager/providers/manager_provider.dart';

class ManagerProfileScreen extends ConsumerWidget {
  const ManagerProfileScreen({super.key});

  static const _purple = Color(0xFF7C3AED);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user  = ref.watch(currentUserProvider);
    final stats = ref.watch(teamStatsProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: const Text('My Profile',
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
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Profile header ───────────────────────────────────────────
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [_purple, Color(0xFF6D28D9)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 32,
                    backgroundColor: Colors.white.withOpacity(0.2),
                    child: Text(
                      (user?.firstName[0] ?? 'M').toUpperCase(),
                      style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 26),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          user?.name ?? 'Manager',
                          style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 18,
                              fontFamily: 'Poppins'),
                        ),
                        const SizedBox(height: 4),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.2),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: const Text('MANAGER',
                              style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                  letterSpacing: 1.5)),
                        ),
                        const SizedBox(height: 4),
                        Text(user?.agentId ?? '',
                            style: TextStyle(
                                color: Colors.white.withOpacity(0.7),
                                fontSize: 12)),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // ── Team stats ────────────────────────────────────────────────
            Row(
              children: [
                Expanded(
                    child: _TeamStat(
                        value: '${stats.totalAgents}',
                        label: 'Agents')),
                const SizedBox(width: 8),
                Expanded(
                    child: _TeamStat(
                        value: '${stats.totalPatients}',
                        label: 'Patients')),
                const SizedBox(width: 8),
                Expanded(
                    child: _TeamStat(
                        value:
                            '${stats.conversionRate.toStringAsFixed(0)}%',
                        label: 'Conv. Rate')),
              ],
            ),

            const SizedBox(height: 20),

            // ── Personal info ─────────────────────────────────────────────
            const Text('Personal Info',
                style: TextStyle(
                    fontFamily: 'Poppins',
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary)),
            const SizedBox(height: 10),
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.border),
              ),
              child: Column(
                children: [
                  _InfoRow(
                      icon: Icons.person_outline,
                      label: 'Full Name',
                      value: user?.name ?? '—'),
                  const Divider(height: 1, indent: 56),
                  _InfoRow(
                      icon: Icons.phone_outlined,
                      label: 'Mobile',
                      value: user?.phone ?? '—',
                      verified: true),
                  const Divider(height: 1, indent: 56),
                  _InfoRow(
                      icon: Icons.email_outlined,
                      label: 'Email',
                      value: user?.email ?? '—'),
                  const Divider(height: 1, indent: 56),
                  _InfoRow(
                      icon: Icons.location_city_outlined,
                      label: 'City',
                      value: user?.city ?? '—'),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // ── Role & access ─────────────────────────────────────────────
            const Text('Role & Access',
                style: TextStyle(
                    fontFamily: 'Poppins',
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary)),
            const SizedBox(height: 10),
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.border),
              ),
              child: Column(
                children: [
                  _PermRow(label: 'View team agents',           granted: true),
                  const Divider(height: 1, indent: 56),
                  _PermRow(label: 'Create & manage agents',     granted: true),
                  const Divider(height: 1, indent: 56),
                  _PermRow(label: 'Set agent commission rates', granted: true),
                  const Divider(height: 1, indent: 56),
                  _PermRow(label: 'View team patients',         granted: true),
                  const Divider(height: 1, indent: 56),
                  _PermRow(label: 'View team earnings',         granted: true),
                  const Divider(height: 1, indent: 56),
                  _PermRow(label: 'Approve commissions',        granted: false),
                  const Divider(height: 1, indent: 56),
                  _PermRow(label: 'Process payouts',            granted: false),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // ── Sign out ──────────────────────────────────────────────────
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: () => _confirmSignOut(context, ref),
                icon: const Icon(Icons.logout, size: 16),
                label: const Text('Sign Out'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.error,
                  side: BorderSide(
                      color: AppColors.error.withOpacity(0.3)),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14)),
                ),
              ),
            ),

            const SizedBox(height: 80),
          ],
        ),
      ),
    );
  }

  void _confirmSignOut(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16)),
        title: const Text('Sign Out'),
        content: const Text('Are you sure you want to sign out?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () async {
              Navigator.pop(ctx);
              await ref.read(authProvider.notifier).logout();
              if (context.mounted) context.go('/login');
            },
            child: const Text('Sign Out',
                style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }
}

class _TeamStat extends StatelessWidget {
  final String value, label;
  const _TeamStat({required this.value, required this.label});

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(vertical: 14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          children: [
            Text(value,
                style: const TextStyle(
                    fontFamily: 'Poppins',
                    fontWeight: FontWeight.bold,
                    fontSize: 22,
                    color: Color(0xFF7C3AED))),
            Text(label,
                style: const TextStyle(
                    fontSize: 11, color: AppColors.textSecondary)),
          ],
        ),
      );
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String label, value;
  final bool verified;
  const _InfoRow(
      {required this.icon,
      required this.label,
      required this.value,
      this.verified = false});

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.symmetric(
            horizontal: 16, vertical: 14),
        child: Row(
          children: [
            Icon(icon, size: 20, color: AppColors.textHint),
            const SizedBox(width: 16),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label,
                    style: const TextStyle(
                        fontSize: 11, color: AppColors.textHint)),
                Row(
                  children: [
                    Text(value.isNotEmpty ? value : '—',
                        style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                            color: AppColors.textPrimary)),
                    if (verified) ...[
                      const SizedBox(width: 4),
                      const Icon(Icons.verified,
                          size: 14, color: AppColors.secondary),
                    ],
                  ],
                ),
              ],
            ),
          ],
        ),
      );
}

class _PermRow extends StatelessWidget {
  final String label;
  final bool granted;
  const _PermRow({required this.label, required this.granted});

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.symmetric(
            horizontal: 16, vertical: 12),
        child: Row(
          children: [
            Icon(
              granted ? Icons.check_circle : Icons.cancel,
              size: 20,
              color: granted
                  ? AppColors.secondary
                  : AppColors.textHint,
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Text(label,
                  style: TextStyle(
                      fontSize: 13,
                      color: granted
                          ? AppColors.textPrimary
                          : AppColors.textHint)),
            ),
          ],
        ),
      );
}
