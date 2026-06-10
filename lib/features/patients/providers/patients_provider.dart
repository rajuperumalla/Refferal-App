import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/services/firestore_service.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../models/patient_model.dart';

// ── Patients State ────────────────────────────────────────────────────────────

/// 'recent' | 'name' | 'commission'
typedef SortMode = String;

class PatientsState {
  final List<PatientModel> patients;
  final bool isLoading;
  final String? error;
  final String statusFilter;
  final String searchQuery;
  final SortMode sortMode;

  const PatientsState({
    this.patients = const [],
    this.isLoading = false,
    this.error,
    this.statusFilter = 'all',
    this.searchQuery = '',
    this.sortMode = 'recent',
  });

  PatientsState copyWith({
    List<PatientModel>? patients,
    bool? isLoading,
    String? error,
    String? statusFilter,
    String? searchQuery,
    SortMode? sortMode,
  }) {
    return PatientsState(
      patients: patients ?? this.patients,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      statusFilter: statusFilter ?? this.statusFilter,
      searchQuery: searchQuery ?? this.searchQuery,
      sortMode: sortMode ?? this.sortMode,
    );
  }

  List<PatientModel> get filteredPatients {
    var list = patients.toList();

    if (statusFilter != 'all') {
      list = list.where((p) => _matchesFilter(p.status, statusFilter)).toList();
    }

    if (searchQuery.isNotEmpty) {
      final q = searchQuery.toLowerCase();
      list = list
          .where((p) =>
              p.name.toLowerCase().contains(q) ||
              p.phone.contains(q) ||
              p.specialty.toLowerCase().contains(q))
          .toList();
    }

    // Apply sort
    switch (sortMode) {
      case 'name':
        list.sort((a, b) => a.name.compareTo(b.name));
        break;
      case 'commission':
        list.sort((a, b) => b.expectedCommission.compareTo(a.expectedCommission));
        break;
      case 'recent':
      default:
        list.sort((a, b) => b.createdAt.compareTo(a.createdAt));
        break;
    }

    return list;
  }

  bool _matchesFilter(PatientStatus status, String filter) {
    switch (filter) {
      case 'new':
        return status == PatientStatus.newLead;
      case 'contacted':
        return status == PatientStatus.contacted;
      case 'opd':
        return status == PatientStatus.opdScheduled;
      case 'ipd':
        return status == PatientStatus.ipdConfirmed;
      case 'completed':
        return status == PatientStatus.completed;
      case 'lost':
        return status == PatientStatus.lost;
      default:
        return true;
    }
  }
}

// ── Patients Notifier ─────────────────────────────────────────────────────────

class PatientsNotifier extends Notifier<PatientsState> {
  @override
  PatientsState build() {
    Future.microtask(() => fetchPatients());
    return const PatientsState();
  }

  String get _agentId => ref.read(currentUserProvider)?.id ?? '';

  Future<void> fetchPatients() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final data = await firestoreService.getPatients(_agentId);
      final patients = data.map((j) => PatientModel.fromFirestore(j)).toList();
      state = state.copyWith(patients: patients, isLoading: false);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  void setStatusFilter(String status) {
    state = state.copyWith(statusFilter: status);
  }

  void setSearchQuery(String query) {
    state = state.copyWith(searchQuery: query);
  }

  void setSortMode(SortMode mode) {
    state = state.copyWith(sortMode: mode);
  }

  Future<bool> addPatient(Map<String, dynamic> formData) async {
    try {
      await firestoreService.addPatient({...formData, 'agentId': _agentId});
      await fetchPatients();
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<bool> updatePatientStatus(String patientId, String status) async {
    try {
      await firestoreService.updatePatient(patientId, {'status': status});
      await fetchPatients();
      return true;
    } catch (_) {
      return false;
    }
  }
}

// ── Providers ─────────────────────────────────────────────────────────────────

final patientsProvider =
    NotifierProvider<PatientsNotifier, PatientsState>(PatientsNotifier.new);

class _SelectedPatientNotifier extends Notifier<PatientModel?> {
  @override
  PatientModel? build() => null;
  void select(PatientModel? p) => state = p;
}

final selectedPatientProvider =
    NotifierProvider<_SelectedPatientNotifier, PatientModel?>(
        _SelectedPatientNotifier.new);

// Real-time stream provider (use when you need live updates)
final patientsStreamProvider =
    StreamProvider.autoDispose<List<PatientModel>>((ref) {
  final user = ref.watch(currentUserProvider);
  if (user == null) return Stream.value([]);

  return firestoreService.patientsStream(user.id).map(
        (list) => list.map((j) => PatientModel.fromFirestore(j)).toList(),
      );
});

// Patient timeline (derived from patient data, no extra Firestore call needed)
final patientTimelineProvider =
    FutureProvider.family<List<TimelineEvent>, PatientModel>(
  (ref, patient) async {
    await Future.delayed(const Duration(milliseconds: 200));
    return _buildTimeline(patient);
  },
);

List<TimelineEvent> _buildTimeline(PatientModel p) {
  final events = <TimelineEvent>[];
  final statusOrder = [
    PatientStatus.newLead,
    PatientStatus.contacted,
    PatientStatus.opdScheduled,
    PatientStatus.ipdConfirmed,
    PatientStatus.completed,
  ];

  final currentIndex = statusOrder.indexOf(p.status);

  events.add(TimelineEvent(
    date: p.createdAt,
    title: 'Lead Created',
    description: 'By you',
    isCompleted: true,
  ));

  if (currentIndex >= 1) {
    events.add(TimelineEvent(
      date: '',
      title: 'Contacted by Team',
      description: 'Category Team: ${p.specialty}',
      isCompleted: true,
    ));
  }

  if (p.opdDate != null || currentIndex >= 2) {
    events.add(TimelineEvent(
      date: p.opdDate ?? '',
      title: 'OPD Scheduled',
      description:
          p.hospital != null ? '${p.hospital}, 10:00 AM' : 'Hospital TBD',
      isCompleted: currentIndex >= 2,
      isPending: currentIndex < 2,
    ));
  }

  if (currentIndex >= 3) {
    events.add(TimelineEvent(
      date: '',
      title: 'OPD Completed',
      description: 'Surgery recommended',
      isCompleted: true,
    ));
    events.add(TimelineEvent(
      date: '',
      title: 'IPD Confirmed',
      description:
          p.surgeryDate != null ? 'Surgery: ${p.surgeryDate}' : '',
      isCompleted: true,
    ));
  }

  if (p.surgeryDate != null) {
    events.add(TimelineEvent(
      date: p.surgeryDate!,
      title: 'Surgery Scheduled',
      description: currentIndex >= 4 ? 'Completed' : 'Awaiting completion',
      isCompleted: currentIndex >= 4,
      isPending: currentIndex < 4,
    ));
  }

  events.add(TimelineEvent(
    date: '',
    title: 'Bill Verification',
    description: '',
    isCompleted: currentIndex >= 4,
    isPending: currentIndex < 4,
  ));

  events.add(TimelineEvent(
    date: '',
    title: 'Commission Payment',
    description: '',
    isCompleted:
        p.status == PatientStatus.completed && p.actualCommission != null,
    isPending: true,
  ));

  return events;
}
