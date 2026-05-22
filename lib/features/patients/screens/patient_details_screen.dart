import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:timeline_tile/timeline_tile.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/utils/formatters.dart';
import '../../../shared/widgets/custom_button.dart';
import '../models/patient_model.dart';
import '../providers/patients_provider.dart';

class PatientDetailsScreen extends ConsumerStatefulWidget {
  final int patientId;

  const PatientDetailsScreen({super.key, required this.patientId});

  @override
  ConsumerState<PatientDetailsScreen> createState() => _PatientDetailsScreenState();
}

class _PatientDetailsScreenState extends ConsumerState<PatientDetailsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final patient = ref.watch(selectedPatientProvider);
    if (patient == null) return const Scaffold(body: Center(child: Text('Not found')));

    return Scaffold(
      backgroundColor: AppColors.background,
      body: NestedScrollView(
        headerSliverBuilder: (_, __) => [
          SliverAppBar(
            expandedHeight: 180,
            pinned: true,
            backgroundColor: AppColors.primary,
            leading: IconButton(
              icon: const Icon(Icons.arrow_back_ios_new, color: Colors.white),
              onPressed: () => Navigator.pop(context),
            ),
            actions: [
              IconButton(
                icon: const Icon(Icons.edit_outlined, color: Colors.white),
                onPressed: () {},
              ),
            ],
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: const BoxDecoration(gradient: AppColors.primaryGradient),
                child: SafeArea(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 60, 20, 16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        Row(
                          children: [
                            CircleAvatar(
                              radius: 28,
                              backgroundColor: Colors.white.withOpacity(0.2),
                              child: Text(
                                patient.initials,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 22,
                                ),
                              ),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    patient.name,
                                    style: const TextStyle(
                                      fontFamily: 'Poppins',
                                      color: Colors.white,
                                      fontSize: 20,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Row(
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.symmetric(
                                            horizontal: 8, vertical: 3),
                                        decoration: BoxDecoration(
                                          color: patient.status.color.withOpacity(0.2),
                                          borderRadius: BorderRadius.circular(20),
                                          border: Border.all(
                                              color: patient.status.color.withOpacity(0.4)),
                                        ),
                                        child: Row(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            Icon(patient.status.icon,
                                                size: 12, color: Colors.white),
                                            const SizedBox(width: 4),
                                            Text(
                                              patient.status.label,
                                              style: const TextStyle(
                                                  color: Colors.white,
                                                  fontSize: 11,
                                                  fontWeight: FontWeight.w600),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
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
            bottom: TabBar(
              controller: _tabController,
              labelColor: Colors.white,
              unselectedLabelColor: Colors.white70,
              indicatorColor: Colors.white,
              indicatorWeight: 3,
              tabs: const [
                Tab(text: 'Overview'),
                Tab(text: 'Timeline'),
                Tab(text: 'Documents'),
                Tab(text: 'Notes'),
              ],
            ),
          ),
        ],
        body: TabBarView(
          controller: _tabController,
          children: [
            _OverviewTab(patient: patient),
            _TimelineTab(patient: patient),
            _DocumentsTab(),
            _NotesTab(patient: patient),
          ],
        ),
      ),
      bottomNavigationBar: _BottomActions(patient: patient),
    );
  }
}

// ─── Overview Tab ────────────────────────────────────────────────────────────

class _OverviewTab extends StatelessWidget {
  final PatientModel patient;

  const _OverviewTab({required this.patient});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          _InfoCard(
            title: '📱 Contact Information',
            children: [
              _InfoRow(
                label: 'Phone',
                value: AppFormatters.phoneDisplay(patient.phone),
                trailing: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    _MiniAction(
                      icon: Icons.call,
                      color: AppColors.secondary,
                      onTap: () => _call(patient.phone),
                    ),
                    const SizedBox(width: 8),
                    _MiniAction(
                      icon: Icons.chat,
                      color: const Color(0xFF25D366),
                      onTap: () => _whatsapp(patient.phone),
                    ),
                  ],
                ),
              ),
              _InfoRow(label: 'Age', value: '${patient.age} years'),
              _InfoRow(label: 'Gender', value: patient.genderLabel),
              _InfoRow(label: 'City', value: patient.city),
            ],
          ),
          const SizedBox(height: 16),
          _InfoCard(
            title: '🏥 Medical Details',
            children: [
              _InfoRow(label: 'Specialty', value: patient.specialty),
              _InfoRow(label: 'Procedure', value: patient.procedure),
              if (patient.hospital != null)
                _InfoRow(label: 'Hospital', value: patient.hospital!),
              if (patient.doctor != null)
                _InfoRow(label: 'Doctor', value: patient.doctor!),
              if (patient.urgency != null)
                _InfoRow(label: 'Urgency', value: patient.urgency!),
              _InfoRow(
                label: 'Insurance',
                value: patient.insurance
                    ? 'Yes (${patient.insuranceProvider ?? 'Unknown'})'
                    : 'No',
              ),
            ],
          ),
          const SizedBox(height: 16),
          _InfoCard(
            title: '💰 Financial Information',
            children: [
              _InfoRow(
                  label: 'Package Cost',
                  value: AppFormatters.currency(patient.packageCost)),
              _InfoRow(
                label: 'Your Commission',
                value:
                    '${AppFormatters.currency(patient.expectedCommission)} (${patient.commissionPercent}%)',
                valueColor: AppColors.secondary,
              ),
              _InfoRow(
                label: 'Status',
                value: patient.actualCommission != null
                    ? 'Paid ${AppFormatters.currency(patient.actualCommission!)}'
                    : 'Pending',
              ),
              if (patient.budgetRange != null)
                _InfoRow(label: 'Budget Range', value: patient.budgetRange!),
            ],
          ),
          const SizedBox(height: 16),
          _InfoCard(
            title: '📅 Important Dates',
            children: [
              _InfoRow(
                  label: 'Lead Created',
                  value: AppFormatters.formatDate(patient.createdAt)),
              if (patient.opdDate != null)
                _InfoRow(
                    label: 'OPD Date',
                    value: AppFormatters.formatDate(patient.opdDate)),
              if (patient.surgeryDate != null)
                _InfoRow(
                    label: 'Surgery Date',
                    value: AppFormatters.formatDate(patient.surgeryDate)),
              if (patient.dischargeDate != null)
                _InfoRow(
                    label: 'Expected Discharge',
                    value: AppFormatters.formatDate(patient.dischargeDate)),
              _InfoRow(
                  label: 'Last Updated',
                  value: AppFormatters.timeAgo(patient.lastUpdated)),
            ],
          ),
          const SizedBox(height: 80),
        ],
      ),
    );
  }

  void _call(String phone) async {
    final uri = Uri.parse('tel:$phone');
    if (await canLaunchUrl(uri)) await launchUrl(uri);
  }

  void _whatsapp(String phone) async {
    final clean = phone.replaceAll('+', '').replaceAll(' ', '');
    final uri = Uri.parse('https://wa.me/$clean');
    if (await canLaunchUrl(uri)) await launchUrl(uri);
  }
}

// ─── Timeline Tab ─────────────────────────────────────────────────────────────

class _TimelineTab extends ConsumerWidget {
  final PatientModel patient;

  const _TimelineTab({required this.patient});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final timelineAsync = ref.watch(patientTimelineProvider(patient));

    return timelineAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(child: Text('Error: $e')),
      data: (events) => ListView.builder(
        padding: const EdgeInsets.all(20),
        itemCount: events.length,
        itemBuilder: (_, i) {
          final e = events[i];
          final isLast = i == events.length - 1;
          return TimelineTile(
            isFirst: i == 0,
            isLast: isLast,
            indicatorStyle: IndicatorStyle(
              width: 28,
              height: 28,
              indicator: Container(
                decoration: BoxDecoration(
                  color: e.isCompleted
                      ? AppColors.secondary
                      : e.isPending
                          ? AppColors.border
                          : AppColors.primary,
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  e.isCompleted ? Icons.check : Icons.schedule,
                  size: 14,
                  color: Colors.white,
                ),
              ),
            ),
            beforeLineStyle: LineStyle(
              color: AppColors.border,
              thickness: 2,
            ),
            endChild: Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 0, 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    e.title,
                    style: TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 14,
                      color: e.isCompleted
                          ? AppColors.textPrimary
                          : AppColors.textHint,
                    ),
                  ),
                  if (e.description != null && e.description!.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Text(
                        e.description!,
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ),
                  if (e.date.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Text(
                        AppFormatters.formatDate(e.date),
                        style: const TextStyle(
                          fontSize: 11,
                          color: AppColors.textHint,
                        ),
                      ),
                    ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

// ─── Documents Tab ────────────────────────────────────────────────────────────

class _DocumentsTab extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 70,
            height: 70,
            decoration: BoxDecoration(
              color: AppColors.primary.withOpacity(0.08),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.folder_outlined,
                size: 36, color: AppColors.primary),
          ),
          const SizedBox(height: 16),
          const Text(
            'No Documents Yet',
            style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
          ),
          const SizedBox(height: 8),
          const Text(
            'Documents will appear here once\nuploaded by the medical team.',
            textAlign: TextAlign.center,
            style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
          ),
        ],
      ),
    );
  }
}

// ─── Notes Tab ────────────────────────────────────────────────────────────────

class _NotesTab extends StatelessWidget {
  final PatientModel patient;

  const _NotesTab({required this.patient});

  @override
  Widget build(BuildContext context) {
    final notes = patient.notes ?? '';
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          if (notes.isNotEmpty)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.border),
              ),
              child: Text(notes, style: const TextStyle(height: 1.5)),
            )
          else
            const Center(
              child: Text('No notes added yet.',
                  style: TextStyle(color: AppColors.textHint)),
            ),
          const SizedBox(height: 16),
          CustomButton(
            label: 'Add Note',
            onPressed: () {},
            isOutlined: true,
            icon: Icons.note_add_outlined,
          ),
        ],
      ),
    );
  }
}

// ─── Bottom Actions ───────────────────────────────────────────────────────────

class _BottomActions extends StatelessWidget {
  final PatientModel patient;

  const _BottomActions({required this.patient});

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
        child: Row(
          children: [
            Expanded(
              child: SmallButton(
                label: 'Call',
                icon: Icons.call,
                color: AppColors.secondary,
                onPressed: () async {
                  final uri = Uri.parse('tel:${patient.phone}');
                  if (await canLaunchUrl(uri)) await launchUrl(uri);
                },
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: SmallButton(
                label: 'WhatsApp',
                icon: Icons.chat,
                color: const Color(0xFF25D366),
                onPressed: () async {
                  final clean = patient.phone.replaceAll('+', '').replaceAll(' ', '');
                  final uri = Uri.parse('https://wa.me/$clean');
                  if (await canLaunchUrl(uri)) await launchUrl(uri);
                },
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              flex: 2,
              child: SmallButton(
                label: 'Update Status',
                icon: Icons.update,
                onPressed: () => _showUpdateStatus(context),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showUpdateStatus(BuildContext context) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Update Status',
                style: TextStyle(
                    fontFamily: 'Poppins',
                    fontSize: 18,
                    fontWeight: FontWeight.w600)),
            const SizedBox(height: 16),
            ...PatientStatus.values
                .where((s) => s != PatientStatus.lost)
                .map((s) => ListTile(
                      leading: Container(
                        width: 12,
                        height: 12,
                        decoration: BoxDecoration(
                          color: s.color,
                          shape: BoxShape.circle,
                        ),
                      ),
                      title: Text(s.label),
                      selected: patient.status == s,
                      selectedTileColor: s.color.withOpacity(0.08),
                      onTap: () {
                        Navigator.pop(context);
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text('Status updated to ${s.label}')),
                        );
                      },
                    )),
          ],
        ),
      ),
    );
  }
}

// ─── Helper Widgets ───────────────────────────────────────────────────────────

class _InfoCard extends StatelessWidget {
  final String title;
  final List<Widget> children;

  const _InfoCard({required this.title, required this.children});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontFamily: 'Poppins',
              fontSize: 15,
              fontWeight: FontWeight.w600,
            ),
          ),
          const Divider(height: 20),
          ...children,
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final String label;
  final String value;
  final Color? valueColor;
  final Widget? trailing;

  const _InfoRow({
    required this.label,
    required this.value,
    this.valueColor,
    this.trailing,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(
              label,
              style: const TextStyle(
                color: AppColors.textSecondary,
                fontSize: 13,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: TextStyle(
                fontWeight: FontWeight.w500,
                fontSize: 13,
                color: valueColor ?? AppColors.textPrimary,
              ),
            ),
          ),
          if (trailing != null) trailing!,
        ],
      ),
    );
  }
}

class _MiniAction extends StatelessWidget {
  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  const _MiniAction({
    required this.icon,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 28,
        height: 28,
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(6),
        ),
        child: Icon(icon, size: 14, color: color),
      ),
    );
  }
}
