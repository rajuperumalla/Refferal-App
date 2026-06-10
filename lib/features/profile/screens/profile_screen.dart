import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../features/auth/models/user_model.dart';
import '../../../features/auth/providers/auth_provider.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  bool _notificationsEnabled = true;
  bool _biometricEnabled = false;
  bool _darkMode = false;

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(currentUserProvider) ?? UserModel.mock;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: CustomScrollView(
        slivers: [
          // Profile header
          SliverAppBar(
            expandedHeight: 200,
            pinned: true,
            backgroundColor: AppColors.primary,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: const BoxDecoration(gradient: AppColors.primaryGradient),
                child: SafeArea(
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Stack(
                          children: [
                            CircleAvatar(
                              radius: 44,
                              backgroundColor: Colors.white.withOpacity(0.2),
                              child: Text(
                                user.firstName[0],
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 32,
                                  fontWeight: FontWeight.bold,
                                  fontFamily: 'Poppins',
                                ),
                              ),
                            ),
                            Positioned(
                              right: 0,
                              bottom: 0,
                              child: Container(
                                width: 26,
                                height: 26,
                                decoration: const BoxDecoration(
                                  color: AppColors.secondary,
                                  shape: BoxShape.circle,
                                ),
                                child: const Icon(Icons.edit, size: 14, color: Colors.white),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        Text(
                          user.name,
                          style: const TextStyle(
                            fontFamily: 'Poppins',
                            color: Colors.white,
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Wrap(
                          alignment: WrapAlignment.center,
                          spacing: 8,
                          runSpacing: 4,
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                              decoration: BoxDecoration(
                                color: Colors.white.withOpacity(0.2),
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Text(
                                'ID: ${user.agentId}',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 12,
                                ),
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                              decoration: BoxDecoration(
                                color: AppColors.secondary.withOpacity(0.3),
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Text(
                                '${user.commissionRate}% Commission',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
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
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  // Performance Stats
                  _SectionCard(
                    title: '📊 Performance Stats',
                    children: [
                      _StatRow(label: 'Total Leads', value: '45', color: AppColors.primary),
                      _StatRow(label: 'Conversion Rate', value: '68%', color: AppColors.secondary),
                      _StatRow(label: 'Avg Response Time', value: '< 2 hrs', color: AppColors.accent),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Profile Info
                  _MenuSection(
                    title: '👤 Profile Information',
                    items: [
                      _MenuItem(
                        icon: Icons.person_outline,
                        label: user.name,
                        subtitle: 'Full Name',
                        onTap: () {},
                      ),
                      _MenuItem(
                        icon: Icons.phone_outlined,
                        label: user.phone,
                        subtitle: 'Phone Number',
                        onTap: () {},
                      ),
                      if (user.email != null)
                        _MenuItem(
                          icon: Icons.email_outlined,
                          label: user.email!,
                          subtitle: 'Email',
                          onTap: () {},
                        ),
                      _MenuItem(
                        icon: Icons.location_city_outlined,
                        label: user.city ?? 'Not set',
                        subtitle: 'City',
                        onTap: () {},
                        trailing: ElevatedButton(
                          onPressed: () {},
                          style: ElevatedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                            minimumSize: Size.zero,
                            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                          ),
                          child: const Text('Edit', style: TextStyle(fontSize: 12)),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Bank Details
                  _MenuSection(
                    title: '🏦 Bank Details',
                    items: [
                      _MenuItem(
                        icon: Icons.account_balance_outlined,
                        label: 'HDFC Bank ••••4521',
                        subtitle: 'Bank Account',
                        onTap: () {},
                      ),
                      _MenuItem(
                        icon: Icons.payment,
                        label: 'UPI: rajesh@hdfc',
                        subtitle: 'UPI ID',
                        onTap: () {},
                        trailing: TextButton(
                          onPressed: () {},
                          child: const Text('Update', style: TextStyle(fontSize: 12)),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // App Settings
                  _MenuSection(
                    title: '⚙️ App Settings',
                    items: [
                      _ToggleItem(
                        icon: Icons.notifications_outlined,
                        label: 'Push Notifications',
                        value: _notificationsEnabled,
                        onChanged: (v) =>
                            setState(() => _notificationsEnabled = v),
                      ),
                      _ToggleItem(
                        icon: Icons.fingerprint,
                        label: 'Biometric Login',
                        value: _biometricEnabled,
                        onChanged: (v) =>
                            setState(() => _biometricEnabled = v),
                      ),
                      _ToggleItem(
                        icon: Icons.dark_mode_outlined,
                        label: 'Dark Mode',
                        value: _darkMode,
                        onChanged: (v) => setState(() => _darkMode = v),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Support
                  _MenuSection(
                    title: '💬 Support & Help',
                    items: [
                      _MenuItem(
                        icon: Icons.help_outline,
                        label: 'FAQ',
                        onTap: () {},
                      ),
                      _MenuItem(
                        icon: Icons.headset_mic_outlined,
                        label: 'Contact Support',
                        onTap: () {},
                      ),
                      _MenuItem(
                        icon: Icons.play_lesson_outlined,
                        label: 'Training Materials',
                        onTap: () {},
                      ),
                      _MenuItem(
                        icon: Icons.description_outlined,
                        label: 'Terms & Conditions',
                        onTap: () {},
                        showDivider: false,
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Logout
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      onPressed: () => _confirmLogout(context),
                      icon: const Icon(Icons.logout, color: AppColors.error),
                      label: const Text('Logout',
                          style: TextStyle(color: AppColors.error)),
                      style: OutlinedButton.styleFrom(
                        side: const BorderSide(color: AppColors.error),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'MediReferral v1.0.0',
                    style: TextStyle(color: AppColors.textHint, fontSize: 12),
                  ),
                  const SizedBox(height: 30),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _confirmLogout(BuildContext context) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Logout?', style: TextStyle(fontFamily: 'Poppins')),
        content: const Text('Are you sure you want to logout?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(context);
              await ref.read(authProvider.notifier).logout();
              if (mounted) context.go('/login');
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
            child: const Text('Logout'),
          ),
        ],
      ),
    );
  }
}

// ─── Helper Widgets ───────────────────────────────────────────────────────────

class _SectionCard extends StatelessWidget {
  final String title;
  final List<Widget> children;

  const _SectionCard({required this.title, required this.children});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title,
              style: const TextStyle(
                  fontFamily: 'Poppins',
                  fontSize: 15,
                  fontWeight: FontWeight.w600)),
          const SizedBox(height: 12),
          Row(
            children: children
                .map((w) => Expanded(child: w))
                .toList(),
          ),
        ],
      ),
    );
  }
}

class _StatRow extends StatelessWidget {
  final String label;
  final String value;
  final Color color;

  const _StatRow({
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        FittedBox(
          fit: BoxFit.scaleDown,
          child: Text(
            value,
            style: TextStyle(
              fontFamily: 'Poppins',
              fontSize: 22,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          textAlign: TextAlign.center,
          overflow: TextOverflow.ellipsis,
          maxLines: 2,
          style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
        ),
      ],
    );
  }
}

class _MenuSection extends StatelessWidget {
  final String title;
  final List<Widget> items;

  const _MenuSection({required this.title, required this.items});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 8),
            child: Text(title,
                style: const TextStyle(
                    fontFamily: 'Poppins',
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textSecondary)),
          ),
          const Divider(height: 1),
          ...items,
        ],
      ),
    );
  }
}

class _MenuItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final String? subtitle;
  final VoidCallback onTap;
  final Widget? trailing;
  final bool showDivider;

  const _MenuItem({
    required this.icon,
    required this.label,
    this.subtitle,
    required this.onTap,
    this.trailing,
    this.showDivider = true,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        ListTile(
          leading: Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: AppColors.primary.withOpacity(0.08),
              borderRadius: BorderRadius.circular(9),
            ),
            child: Icon(icon, size: 18, color: AppColors.primary),
          ),
          title: Text(
            label,
            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
          ),
          subtitle: subtitle != null
              ? Text(subtitle!,
                  style: const TextStyle(
                      fontSize: 11, color: AppColors.textSecondary))
              : null,
          trailing: trailing ?? const Icon(Icons.chevron_right, color: AppColors.textHint),
          onTap: onTap,
          dense: true,
        ),
        if (showDivider) const Divider(height: 1, indent: 66),
      ],
    );
  }
}

class _ToggleItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool value;
  final ValueChanged<bool> onChanged;

  const _ToggleItem({
    required this.icon,
    required this.label,
    required this.value,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        ListTile(
          leading: Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: AppColors.primary.withOpacity(0.08),
              borderRadius: BorderRadius.circular(9),
            ),
            child: Icon(icon, size: 18, color: AppColors.primary),
          ),
          title: Text(
            label,
            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
          ),
          trailing: Switch(
            value: value,
            onChanged: onChanged,
            activeColor: AppColors.primary,
          ),
          dense: true,
        ),
        const Divider(height: 1, indent: 66),
      ],
    );
  }
}
