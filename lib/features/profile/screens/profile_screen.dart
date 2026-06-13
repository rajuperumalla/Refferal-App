import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/services/firestore_service.dart';
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
  bool _emailAlerts = true;

  // Bank details form
  bool _bankEditing = false;
  bool _bankSaved = false;
  bool _bankSaving = false;
  bool _showAccNo = false;
  final _bankNameCtrl = TextEditingController();
  final _bankAccCtrl = TextEditingController();
  final _bankIfscCtrl = TextEditingController();
  final _bankUpiCtrl = TextEditingController();

  // KYC form
  bool _kycSubmitting = false;
  final _aadhaarCtrl = TextEditingController();
  final _panCtrl = TextEditingController();
  final _kycErrors = <String, String>{};

  @override
  void dispose() {
    _bankNameCtrl.dispose();
    _bankAccCtrl.dispose();
    _bankIfscCtrl.dispose();
    _bankUpiCtrl.dispose();
    _aadhaarCtrl.dispose();
    _panCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(currentUserProvider);
    if (user == null) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      backgroundColor: AppColors.background,
      body: CustomScrollView(
        slivers: [
          // ── Profile Header ───────────────────────────────────────────────
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
                        CircleAvatar(
                          radius: 44,
                          backgroundColor: Colors.white.withOpacity(0.2),
                          child: Text(
                            user.firstName[0].toUpperCase(),
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 32,
                              fontWeight: FontWeight.bold,
                              fontFamily: 'Poppins',
                            ),
                          ),
                        ),
                        const SizedBox(height: 10),
                        Text(
                          user.name.isEmpty ? 'Agent' : user.name,
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
                            _Badge(text: 'ID: ${user.agentId}'),
                            _Badge(text: '${user.commissionRate}% Commission',
                                color: AppColors.secondary),
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
                  // ── Profile Information ──────────────────────────────────
                  _SectionCard(
                    title: '👤 Profile Information',
                    children: [
                      _InfoTile(
                        icon: Icons.person_outline,
                        label: 'Full Name',
                        value: user.name.isEmpty ? 'Not set' : user.name,
                      ),
                      _InfoTile(
                        icon: Icons.phone_outlined,
                        label: 'Phone',
                        value: user.phone,
                        badge: '✅ Verified',
                        badgeGreen: true,
                      ),
                      _InfoTile(
                        icon: Icons.email_outlined,
                        label: 'Email',
                        value: user.email ?? 'Not set',
                        badge: user.email != null ? '⚠️ Unverified' : null,
                        badgeGreen: false,
                      ),
                      _InfoTile(
                        icon: Icons.location_city_outlined,
                        label: 'City',
                        value: user.city ?? 'Not set',
                      ),
                      _InfoTile(
                        icon: Icons.badge_outlined,
                        label: 'Agent ID',
                        value: user.agentId,
                        showDivider: false,
                      ),
                    ],
                  ),

                  const SizedBox(height: 16),

                  // ── KYC Section ──────────────────────────────────────────
                  _KycSection(
                    aadhaarCtrl: _aadhaarCtrl,
                    panCtrl: _panCtrl,
                    kycErrors: _kycErrors,
                    kycSubmitting: _kycSubmitting,
                    onSubmit: () => _submitKyc(user.id),
                  ),

                  const SizedBox(height: 16),

                  // ── Bank Details ─────────────────────────────────────────
                  _BankDetailsSection(
                    nameCtrl: _bankNameCtrl,
                    accCtrl: _bankAccCtrl,
                    ifscCtrl: _bankIfscCtrl,
                    upiCtrl: _bankUpiCtrl,
                    editing: _bankEditing,
                    saving: _bankSaving,
                    saved: _bankSaved,
                    showAccNo: _showAccNo,
                    onToggleEdit: () {
                      setState(() {
                        _bankEditing = !_bankEditing;
                        _bankSaved = false;
                      });
                    },
                    onToggleAccNo: () => setState(() => _showAccNo = !_showAccNo),
                    onSave: () => _saveBankDetails(user.id),
                    onCancel: () => setState(() => _bankEditing = false),
                  ),

                  const SizedBox(height: 16),

                  // ── App Settings ─────────────────────────────────────────
                  _MenuSection(
                    title: '⚙️ App Settings',
                    items: [
                      _ToggleItem(
                        icon: Icons.notifications_outlined,
                        label: 'Push Notifications',
                        value: _notificationsEnabled,
                        onChanged: (v) => setState(() => _notificationsEnabled = v),
                      ),
                      _ToggleItem(
                        icon: Icons.email_outlined,
                        label: 'Email Alerts',
                        value: _emailAlerts,
                        onChanged: (v) => setState(() => _emailAlerts = v),
                      ),
                      _ToggleItem(
                        icon: Icons.fingerprint,
                        label: 'Biometric Login',
                        value: _biometricEnabled,
                        onChanged: (v) => setState(() => _biometricEnabled = v),
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

                  // ── Support ──────────────────────────────────────────────
                  _MenuSection(
                    title: '💬 Support & Help',
                    items: [
                      _MenuItem(icon: Icons.help_outline, label: 'FAQ', onTap: () {}),
                      _MenuItem(icon: Icons.headset_mic_outlined, label: 'Contact Support', onTap: () {}),
                      _MenuItem(icon: Icons.play_lesson_outlined, label: 'Training Materials', onTap: () {}),
                      _MenuItem(icon: Icons.description_outlined, label: 'Terms & Conditions', onTap: () {}, showDivider: false),
                    ],
                  ),

                  const SizedBox(height: 16),

                  // ── Logout ───────────────────────────────────────────────
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      onPressed: () => _confirmLogout(context),
                      icon: const Icon(Icons.logout, color: AppColors.error),
                      label: const Text('Logout from MediReferral',
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
                  const Text('MediReferral v1.0.0 · Mediciti Healthcare © 2024',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: AppColors.textHint, fontSize: 11)),
                  const SizedBox(height: 30),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _saveBankDetails(String uid) async {
    if (_bankNameCtrl.text.isEmpty ||
        _bankAccCtrl.text.isEmpty ||
        _bankIfscCtrl.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please fill all required bank fields')),
      );
      return;
    }
    setState(() => _bankSaving = true);
    await firestoreService.updateAgent(uid, {
      'bank': {
        'accountName': _bankNameCtrl.text.trim(),
        'accountNumber': _bankAccCtrl.text.trim(),
        'ifscCode': _bankIfscCtrl.text.trim().toUpperCase(),
        'upiId': _bankUpiCtrl.text.trim(),
        'verificationStatus': 'pending',
      },
    });
    setState(() {
      _bankSaving = false;
      _bankEditing = false;
      _bankSaved = true;
    });
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Bank details submitted. Admin will verify within 24 hours.'),
        backgroundColor: AppColors.secondary,
      ),
    );
  }

  Future<void> _submitKyc(String uid) async {
    final errors = <String, String>{};
    final aadhaar = _aadhaarCtrl.text.replaceAll(' ', '');
    final pan = _panCtrl.text.trim().toUpperCase();

    if (!RegExp(r'^\d{12}$').hasMatch(aadhaar)) {
      errors['aadhaar'] = 'Enter a valid 12-digit Aadhaar number';
    }
    if (!RegExp(r'^[A-Z]{5}[0-9]{4}[A-Z]{1}$').hasMatch(pan)) {
      errors['pan'] = 'Enter a valid PAN (e.g. ABCDE1234F)';
    }
    setState(() => _kycErrors
      ..clear()
      ..addAll(errors));

    if (errors.isNotEmpty) return;

    setState(() => _kycSubmitting = true);
    await firestoreService.updateAgent(uid, {
      'kyc': {
        'aadhaar': aadhaar,
        'pan': pan,
        'status': 'submitted',
        'submittedAt': DateTime.now().toIso8601String(),
      },
    });
    setState(() => _kycSubmitting = false);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('KYC submitted. Admin will review within 24 hours.'),
          backgroundColor: AppColors.secondary,
        ),
      );
    }
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
              child: const Text('Cancel')),
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

// ── KYC Section ───────────────────────────────────────────────────────────────

class _KycSection extends StatelessWidget {
  final TextEditingController aadhaarCtrl;
  final TextEditingController panCtrl;
  final Map<String, String> kycErrors;
  final bool kycSubmitting;
  final VoidCallback onSubmit;

  const _KycSection({
    required this.aadhaarCtrl,
    required this.panCtrl,
    required this.kycErrors,
    required this.kycSubmitting,
    required this.onSubmit,
  });

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
          const Text('🪪 KYC Verification',
              style: TextStyle(
                  fontFamily: 'Poppins',
                  fontSize: 15,
                  fontWeight: FontWeight.w600)),
          const SizedBox(height: 4),
          const Text('Required for commission payouts.',
              style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
          const SizedBox(height: 14),

          // Aadhaar
          _FieldLabel('Aadhaar Number *'),
          const SizedBox(height: 6),
          TextField(
            controller: aadhaarCtrl,
            keyboardType: TextInputType.number,
            maxLength: 14,
            decoration: InputDecoration(
              hintText: 'XXXX XXXX XXXX',
              counterText: '',
              errorText: kycErrors['aadhaar'],
            ),
          ),

          const SizedBox(height: 12),

          // PAN
          _FieldLabel('PAN Number *'),
          const SizedBox(height: 6),
          TextField(
            controller: panCtrl,
            textCapitalization: TextCapitalization.characters,
            maxLength: 10,
            decoration: InputDecoration(
              hintText: 'ABCDE1234F',
              counterText: '',
              errorText: kycErrors['pan'],
            ),
          ),

          const SizedBox(height: 16),

          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: kycSubmitting ? null : onSubmit,
              child: kycSubmitting
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(
                          strokeWidth: 2, color: Colors.white))
                  : const Text('🪪 Submit KYC Documents'),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Bank Details Section ──────────────────────────────────────────────────────

class _BankDetailsSection extends StatelessWidget {
  final TextEditingController nameCtrl;
  final TextEditingController accCtrl;
  final TextEditingController ifscCtrl;
  final TextEditingController upiCtrl;
  final bool editing;
  final bool saving;
  final bool saved;
  final bool showAccNo;
  final VoidCallback onToggleEdit;
  final VoidCallback onToggleAccNo;
  final VoidCallback onSave;
  final VoidCallback onCancel;

  const _BankDetailsSection({
    required this.nameCtrl,
    required this.accCtrl,
    required this.ifscCtrl,
    required this.upiCtrl,
    required this.editing,
    required this.saving,
    required this.saved,
    required this.showAccNo,
    required this.onToggleEdit,
    required this.onToggleAccNo,
    required this.onSave,
    required this.onCancel,
  });

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
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('🏦 Bank Details',
                  style: TextStyle(
                      fontFamily: 'Poppins',
                      fontSize: 15,
                      fontWeight: FontWeight.w600)),
              if (!editing)
                TextButton(
                  onPressed: onToggleEdit,
                  child: Text(accCtrl.text.isEmpty ? 'Add Details' : 'Update'),
                ),
            ],
          ),

          if (saved)
            Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: AppColors.secondary.withOpacity(0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Text(
                '✅ Details submitted. Admin will review and notify within 24 hours.',
                style: TextStyle(color: AppColors.secondary, fontSize: 12),
              ),
            ),

          if (!editing) ...[
            // Read-only view
            _InfoTile(icon: Icons.person_outline, label: 'Account Holder',
                value: nameCtrl.text.isEmpty ? '—' : nameCtrl.text),
            _InfoTile(
              icon: Icons.account_balance_outlined,
              label: 'Account Number',
              value: accCtrl.text.isEmpty
                  ? '—'
                  : accCtrl.text.replaceAll(RegExp(r'.(?=.{4})'), '•'),
            ),
            _InfoTile(icon: Icons.numbers_outlined, label: 'IFSC Code',
                value: ifscCtrl.text.isEmpty ? '—' : ifscCtrl.text),
            _InfoTile(icon: Icons.payment, label: 'UPI ID',
                value: upiCtrl.text.isEmpty ? '—' : upiCtrl.text,
                showDivider: false),
          ] else ...[
            // Edit form
            const SizedBox(height: 8),
            _FieldLabel('Account Holder Name *'),
            const SizedBox(height: 6),
            TextField(controller: nameCtrl,
                decoration: const InputDecoration(hintText: 'As printed on passbook')),

            const SizedBox(height: 12),
            _FieldLabel('Account Number *'),
            const SizedBox(height: 6),
            TextField(
              controller: accCtrl,
              obscureText: !showAccNo,
              keyboardType: TextInputType.number,
              decoration: InputDecoration(
                hintText: 'Enter account number',
                suffixIcon: IconButton(
                  icon: Icon(showAccNo ? Icons.visibility_off : Icons.visibility),
                  onPressed: onToggleAccNo,
                ),
              ),
            ),

            const SizedBox(height: 12),
            _FieldLabel('IFSC Code *'),
            const SizedBox(height: 6),
            TextField(
              controller: ifscCtrl,
              textCapitalization: TextCapitalization.characters,
              maxLength: 11,
              decoration: const InputDecoration(
                hintText: 'e.g. SBIN0001234',
                counterText: '',
              ),
            ),

            const SizedBox(height: 12),
            _FieldLabel('UPI ID'),
            const SizedBox(height: 6),
            TextField(controller: upiCtrl,
                decoration: const InputDecoration(hintText: 'e.g. name@upi')),

            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: onCancel,
                    child: const Text('Cancel'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  flex: 2,
                  child: ElevatedButton(
                    onPressed: saving ? null : onSave,
                    child: saving
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(
                                strokeWidth: 2, color: Colors.white))
                        : const Text('💾 Save Bank Details'),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

// ── Helper Widgets ─────────────────────────────────────────────────────────────

class _Badge extends StatelessWidget {
  final String text;
  final Color? color;

  const _Badge({required this.text, this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
      decoration: BoxDecoration(
        color: (color ?? Colors.white).withOpacity(0.2),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(text, style: const TextStyle(color: Colors.white, fontSize: 12)),
    );
  }
}

class _SectionCard extends StatelessWidget {
  final String title;
  final List<Widget> children;

  const _SectionCard({required this.title, required this.children});

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
                    fontSize: 15,
                    fontWeight: FontWeight.w600)),
          ),
          const Divider(height: 1),
          ...children,
        ],
      ),
    );
  }
}

class _InfoTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final String? badge;
  final bool badgeGreen;
  final bool showDivider;

  const _InfoTile({
    required this.icon,
    required this.label,
    required this.value,
    this.badge,
    this.badgeGreen = false,
    this.showDivider = true,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        ListTile(
          dense: true,
          leading: Container(
            width: 34,
            height: 34,
            decoration: BoxDecoration(
              color: AppColors.primary.withOpacity(0.08),
              borderRadius: BorderRadius.circular(9),
            ),
            child: Icon(icon, size: 17, color: AppColors.primary),
          ),
          title: Text(label,
              style: const TextStyle(
                  fontSize: 11, color: AppColors.textSecondary)),
          subtitle: Row(
            children: [
              Text(value,
                  style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                      color: AppColors.textPrimary)),
              if (badge != null) ...[
                const SizedBox(width: 6),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: badgeGreen
                        ? AppColors.secondary.withOpacity(0.1)
                        : AppColors.warning.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(badge!,
                      style: TextStyle(
                          fontSize: 9,
                          fontWeight: FontWeight.w600,
                          color: badgeGreen ? AppColors.secondary : AppColors.warning)),
                ),
              ],
            ],
          ),
        ),
        if (showDivider) const Divider(height: 1, indent: 66),
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
  final bool showDivider;

  const _MenuItem({
    required this.icon,
    required this.label,
    this.subtitle,
    required this.onTap,
    this.showDivider = true,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        ListTile(
          dense: true,
          leading: Container(
            width: 34,
            height: 34,
            decoration: BoxDecoration(
              color: AppColors.primary.withOpacity(0.08),
              borderRadius: BorderRadius.circular(9),
            ),
            child: Icon(icon, size: 17, color: AppColors.primary),
          ),
          title: Text(label,
              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
          subtitle: subtitle != null
              ? Text(subtitle!,
                  style: const TextStyle(
                      fontSize: 11, color: AppColors.textSecondary))
              : null,
          trailing: const Icon(Icons.chevron_right, color: AppColors.textHint),
          onTap: onTap,
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
          dense: true,
          leading: Container(
            width: 34,
            height: 34,
            decoration: BoxDecoration(
              color: AppColors.primary.withOpacity(0.08),
              borderRadius: BorderRadius.circular(9),
            ),
            child: Icon(icon, size: 17, color: AppColors.primary),
          ),
          title: Text(label,
              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
          trailing: Switch(
              value: value, onChanged: onChanged, activeColor: AppColors.primary),
        ),
        const Divider(height: 1, indent: 66),
      ],
    );
  }
}

class _FieldLabel extends StatelessWidget {
  final String text;

  const _FieldLabel(this.text);

  @override
  Widget build(BuildContext context) {
    return Text(text,
        style: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w500,
            color: AppColors.textSecondary));
  }
}
