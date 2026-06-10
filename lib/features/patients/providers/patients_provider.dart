import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/dio_client.dart';
import '../models/patient_model.dart';

// Patients State
class PatientsState {
  final List<PatientModel> patients;
  final bool isLoading;
  final String? error;
  final String statusFilter;
  final String searchQuery;

  const PatientsState({
    this.patients = const [],
    this.isLoading = false,
    this.error,
    this.statusFilter = 'all',
    this.searchQuery = '',
  });

  PatientsState copyWith({
    List<PatientModel>? patients,
    bool? isLoading,
    String? error,
    String? statusFilter,
    String? searchQuery,
  }) {
    return PatientsState(
      patients: patients ?? this.patients,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      statusFilter: statusFilter ?? this.statusFilter,
      searchQuery: searchQuery ?? this.searchQuery,
    );
  }

  List<PatientModel> get filteredPatients {
    var list = patients;

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

class PatientsNotifier extends StateNotifier<PatientsState> {
  PatientsNotifier() : super(const PatientsState()) {
    fetchPatients();
  }

  Future<void> fetchPatients() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final data = await MockApiService.getPatients();
      final patients = data.map((j) => PatientModel.fromJson(j)).toList();
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

  Future<bool> addPatient(Map<String, dynamic> formData) async {
    try {
      await Future.delayed(const Duration(seconds: 1));
      // In real app, call API and refresh list
      await fetchPatients();
      return true;
    } catch (_) {
      return false;
    }
  }
}

final patientsProvider = StateNotifierProvider<PatientsNotifier, PatientsState>(
  (ref) => PatientsNotifier(),
);

// Selected patient
final selectedPatientProvider = StateProvider<PatientModel?>((ref) => null);

// Patient timeline
final patientTimelineProvider = FutureProvider.family<List<TimelineEvent>, PatientModel>(
  (ref, patient) async {
    await Future.delayed(const Duration(milliseconds: 400));
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
      description: p.hospital != null ? '${p.hospital}, 10:00 AM' : 'Hospital TBD',
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
      description: p.surgeryDate != null ? 'Surgery: ${p.surgeryDate}' : '',
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
    isCompleted: p.status == PatientStatus.completed && p.actualCommission != null,
    isPending: true,
  ));

  return events;
}
