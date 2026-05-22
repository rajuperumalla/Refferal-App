import '../../../core/constants/app_colors.dart';
import 'package:flutter/material.dart';

enum PatientStatus {
  newLead,
  contacted,
  opdScheduled,
  ipdConfirmed,
  completed,
  lost;

  static PatientStatus fromString(String s) {
    switch (s) {
      case 'contacted':
        return contacted;
      case 'opd_scheduled':
        return opdScheduled;
      case 'ipd_confirmed':
        return ipdConfirmed;
      case 'completed':
        return completed;
      case 'lost':
        return lost;
      default:
        return newLead;
    }
  }

  String get label {
    switch (this) {
      case newLead:
        return 'New';
      case contacted:
        return 'Contacted';
      case opdScheduled:
        return 'OPD Scheduled';
      case ipdConfirmed:
        return 'IPD Confirmed';
      case completed:
        return 'Completed';
      case lost:
        return 'Lost';
    }
  }

  Color get color {
    switch (this) {
      case newLead:
        return AppColors.statusNew;
      case contacted:
        return AppColors.statusContacted;
      case opdScheduled:
        return AppColors.statusOPD;
      case ipdConfirmed:
        return AppColors.statusIPD;
      case completed:
        return AppColors.statusCompleted;
      case lost:
        return AppColors.statusLost;
    }
  }

  IconData get icon {
    switch (this) {
      case newLead:
        return Icons.fiber_new;
      case contacted:
        return Icons.phone_in_talk;
      case opdScheduled:
        return Icons.event_available;
      case ipdConfirmed:
        return Icons.local_hospital;
      case completed:
        return Icons.check_circle;
      case lost:
        return Icons.cancel;
    }
  }
}

class PatientModel {
  final int id;
  final String name;
  final String phone;
  final int age;
  final String gender;
  final String specialty;
  final String procedure;
  final PatientStatus status;
  final double expectedCommission;
  final double? actualCommission;
  final String? surgeryDate;
  final String? opdDate;
  final String? dischargeDate;
  final String city;
  final String? hospital;
  final String? doctor;
  final double packageCost;
  final double commissionPercent;
  final bool insurance;
  final String? insuranceProvider;
  final String? budgetRange;
  final String? urgency;
  final String? notes;
  final String createdAt;
  final String lastUpdated;

  const PatientModel({
    required this.id,
    required this.name,
    required this.phone,
    required this.age,
    required this.gender,
    required this.specialty,
    required this.procedure,
    required this.status,
    required this.expectedCommission,
    this.actualCommission,
    this.surgeryDate,
    this.opdDate,
    this.dischargeDate,
    required this.city,
    this.hospital,
    this.doctor,
    required this.packageCost,
    required this.commissionPercent,
    this.insurance = false,
    this.insuranceProvider,
    this.budgetRange,
    this.urgency,
    this.notes,
    required this.createdAt,
    required this.lastUpdated,
  });

  factory PatientModel.fromJson(Map<String, dynamic> json) {
    return PatientModel(
      id: json['id'] ?? 0,
      name: json['name'] ?? '',
      phone: json['phone'] ?? '',
      age: json['age'] ?? 0,
      gender: json['gender'] ?? 'M',
      specialty: json['specialty'] ?? '',
      procedure: json['procedure'] ?? '',
      status: PatientStatus.fromString(json['status'] ?? 'new'),
      expectedCommission: (json['expected_commission'] ?? 0).toDouble(),
      actualCommission: json['actual_commission']?.toDouble(),
      surgeryDate: json['surgery_date'],
      opdDate: json['opd_date'],
      dischargeDate: json['discharge_date'],
      city: json['city'] ?? '',
      hospital: json['hospital'],
      doctor: json['doctor'],
      packageCost: (json['package_cost'] ?? 0).toDouble(),
      commissionPercent: (json['commission_percent'] ?? 4.0).toDouble(),
      insurance: json['insurance'] ?? false,
      insuranceProvider: json['insurance_provider'],
      budgetRange: json['budget_range'],
      urgency: json['urgency'],
      notes: json['notes'],
      createdAt: json['created_at'] ?? DateTime.now().toIso8601String(),
      lastUpdated: json['last_updated'] ?? DateTime.now().toIso8601String(),
    );
  }

  String get genderLabel => gender == 'M' ? 'Male' : gender == 'F' ? 'Female' : 'Other';
  String get initials => name.isNotEmpty ? name[0].toUpperCase() : 'P';
}

class TimelineEvent {
  final String date;
  final String title;
  final String? description;
  final bool isCompleted;
  final bool isPending;

  const TimelineEvent({
    required this.date,
    required this.title,
    this.description,
    this.isCompleted = false,
    this.isPending = false,
  });
}
