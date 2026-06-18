import 'package:cloud_firestore/cloud_firestore.dart';

class FirestoreService {
  final FirebaseFirestore _db = FirebaseFirestore.instance;

  // ── Collections ──────────────────────────────────────────────────────────────

  CollectionReference get _agents => _db.collection('agents');
  CollectionReference get _patients => _db.collection('patients');
  CollectionReference get _commissions => _db.collection('commissions');
  CollectionReference get _notifications => _db.collection('notifications');

  // ── Agent ─────────────────────────────────────────────────────────────────

  Future<Map<String, dynamic>?> getAgent(String uid) async {
    if (uid.startsWith('mock-')) {
      final isManager = uid.contains('manager');
      final isAdmin = uid.contains('admin');
      final roleStr = isManager ? 'manager' : isAdmin ? 'admin' : 'agent';
      return {
        'id': uid,
        'name': isManager ? 'Jane Doe (Manager)' : isAdmin ? 'Admin User' : 'John Doe (Agent)',
        'phone': isManager ? '+918888888888' : isAdmin ? '+917777777777' : '+919999999999',
        'email': '$roleStr@medireferral.com',
        'agentId': isManager ? 'MG001' : isAdmin ? 'AD001' : 'AG001',
        'commissionRate': 4.5,
        'city': 'Delhi',
        'role': roleStr,
        'managerId': isManager ? null : 'mock-manager-uid',
      };
    }
    final doc = await _agents.doc(uid).get();
    if (!doc.exists) return null;
    return {'id': doc.id, ...doc.data() as Map<String, dynamic>};
  }

  // Look up pre-created profile by phone (handles +91 XXXXX XXXXX & +91XXXXXXXXXX)
  Future<Map<String, dynamic>?> getAgentByPhone(String phone) async {
    if (phone.endsWith('9999999999') || phone.endsWith('8888888888') || phone.endsWith('7777777777')) {
      final isManager = phone.endsWith('8888888888');
      final isAdmin = phone.endsWith('7777777777');
      final roleStr = isManager ? 'manager' : isAdmin ? 'admin' : 'agent';
      final uid = 'mock-$roleStr-uid';
      return {
        'id': uid,
        'name': isManager ? 'Jane Doe (Manager)' : isAdmin ? 'Admin User' : 'John Doe (Agent)',
        'phone': phone,
        'email': '$roleStr@medireferral.com',
        'agentId': isManager ? 'MG001' : isAdmin ? 'AD001' : 'AG001',
        'commissionRate': 4.5,
        'city': 'Delhi',
        'role': roleStr,
        'managerId': isManager ? null : 'mock-manager-uid',
      };
    }
    final digits = phone.replaceAll(RegExp(r'[\s\-]'), '').replaceAll('+91', '');
    final variants = [
      phone,
      '+91$digits',
      '+91 ${digits.substring(0, 5)} ${digits.substring(5)}',
    ];
    for (final v in variants) {
      final snap = await _agents.where('phone', isEqualTo: v).limit(1).get();
      if (snap.docs.isNotEmpty) {
        final doc = snap.docs.first;
        return {'id': doc.id, ...doc.data() as Map<String, dynamic>};
      }
    }
    return null;
  }

  // Real-time stream of all agents under a manager
  Stream<List<Map<String, dynamic>>> teamAgentsStream(String managerId) {
    if (managerId.startsWith('mock-')) {
      return Stream.value([
        {
          'id': 'mock-agent-uid',
          'name': 'John Doe (Agent)',
          'phone': '+919999999999',
          'email': 'agent@medireferral.com',
          'agentId': 'AG001',
          'status': 'active',
          'role': 'agent',
          'managerId': managerId,
        }
      ]);
    }
    return _agents
        .where('managerId', isEqualTo: managerId)
        .snapshots()
        .map((s) => s.docs
            .map((d) => {'id': d.id, ...d.data() as Map<String, dynamic>})
            .toList());
  }

  // Real-time stream of all patients for a list of agent IDs
  Stream<List<Map<String, dynamic>>> teamPatientsStream(List<String> agentIds) {
    if (agentIds.any((id) => id.startsWith('mock-'))) {
      return Stream.value(_mockPatients('mock-agent-uid'));
    }
    if (agentIds.isEmpty) return Stream.value([]);
    return _patients
        .where('agentId', whereIn: agentIds.take(30).toList())
        .orderBy('createdAt', descending: true)
        .snapshots()
        .map((s) => s.docs
            .map((d) => {'id': d.id, ...d.data() as Map<String, dynamic>})
            .toList());
  }

  // Real-time stream of commissions for a list of agent IDs
  Stream<List<Map<String, dynamic>>> teamCommissionsStream(List<String> agentIds) {
    if (agentIds.any((id) => id.startsWith('mock-'))) {
      return Stream.value(_mockCommissions('mock-agent-uid'));
    }
    if (agentIds.isEmpty) return Stream.value([]);
    return _commissions
        .where('agentId', whereIn: agentIds.take(30).toList())
        .orderBy('createdAt', descending: true)
        .snapshots()
        .map((s) => s.docs
            .map((d) => {'id': d.id, ...d.data() as Map<String, dynamic>})
            .toList());
  }

  Future<void> createAgent(String uid, Map<String, dynamic> data) async {
    if (uid.startsWith('mock-')) return;
    await _agents.doc(uid).set({
      ...data,
      'createdAt': FieldValue.serverTimestamp(),
      'status': 'pending',
    });
  }

  Future<void> updateAgent(String uid, Map<String, dynamic> data) async {
    if (uid.startsWith('mock-')) return;
    await _agents.doc(uid).update(data);
  }

  // ── Patients ──────────────────────────────────────────────────────────────

  Stream<List<Map<String, dynamic>>> patientsStream(String agentId) {
    if (agentId.startsWith('mock-')) {
      return Stream.value(_mockPatients(agentId));
    }
    return _patients
        .where('agentId', isEqualTo: agentId)
        .orderBy('createdAt', descending: true)
        .snapshots()
        .map((snap) => snap.docs
            .map((d) => {'id': d.id, ...d.data() as Map<String, dynamic>})
            .toList());
  }

  Future<List<Map<String, dynamic>>> getPatients(String agentId) async {
    if (agentId.startsWith('mock-')) {
      return _mockPatients(agentId);
    }
    final snap = await _patients
        .where('agentId', isEqualTo: agentId)
        .orderBy('createdAt', descending: true)
        .get();
    return snap.docs
        .map((d) => {'id': d.id, ...d.data() as Map<String, dynamic>})
        .toList();
  }

  Future<Map<String, dynamic>?> getPatient(String patientId) async {
    if (patientId.startsWith('mock-') || ['101','102','103','104','105'].contains(patientId)) {
      final list = _mockPatients('mock-agent-uid');
      if (patientId == '101') return list[0];
      if (patientId == '102') return list[1];
      if (patientId == '103') return list[2];
      if (patientId == '104') return list[3];
      if (patientId == '105') return list[4];
      return list.first;
    }
    final doc = await _patients.doc(patientId).get();
    if (!doc.exists) return null;
    return {'id': doc.id, ...doc.data() as Map<String, dynamic>};
  }

  Future<String> addPatient(Map<String, dynamic> data) async {
    if ((data['agentId'] as String? ?? '').startsWith('mock-')) {
      return 'mock-added-patient-id';
    }
    final ref = await _patients.add({
      ...data,
      'status': 'new',
      'createdAt': FieldValue.serverTimestamp(),
      'lastUpdated': FieldValue.serverTimestamp(),
    });
    return ref.id;
  }

  Future<void> updatePatient(String id, Map<String, dynamic> data) async {
    if (id.startsWith('mock-') || ['101','102','103','104','105'].contains(id)) return;
    await _patients.doc(id).update({
      ...data,
      'lastUpdated': FieldValue.serverTimestamp(),
    });
  }

  // ── Commissions ───────────────────────────────────────────────────────────

  Stream<List<Map<String, dynamic>>> commissionsStream(String agentId) {
    if (agentId.startsWith('mock-')) {
      return Stream.value(_mockCommissions(agentId));
    }
    return _commissions
        .where('agentId', isEqualTo: agentId)
        .orderBy('createdAt', descending: true)
        .snapshots()
        .map((snap) => snap.docs
            .map((d) => {'id': d.id, ...d.data() as Map<String, dynamic>})
            .toList());
  }

  Future<Map<String, dynamic>> getCommissionSummary(String agentId) async {
    if (agentId.startsWith('mock-')) {
      return {
        'totalEarned': 4500.0,
        'pending': 11900.0,
        'thisMonth': 4500.0,
      };
    }
    final snap = await _commissions
        .where('agentId', isEqualTo: agentId)
        .get();

    double totalEarned = 0;
    double pending = 0;
    double thisMonth = 0;

    final now = DateTime.now();
    for (final doc in snap.docs) {
      final data = doc.data() as Map<String, dynamic>;
      final amount = (data['amount'] ?? 0).toDouble();
      final status = data['status'] ?? '';
      final ts = data['createdAt'];

      if (status == 'paid') {
        totalEarned += amount;
        if (ts is Timestamp) {
          final date = ts.toDate();
          if (date.year == now.year && date.month == now.month) {
            thisMonth += amount;
          }
        }
      } else if (status == 'pending_approval' || status == 'approved') {
        pending += amount;
      }
    }

    return {
      'totalEarned': totalEarned,
      'pending': pending,
      'thisMonth': thisMonth,
    };
  }

  // ── Notifications ─────────────────────────────────────────────────────────

  Stream<List<Map<String, dynamic>>> notificationsStream(String agentId) {
    if (agentId.startsWith('mock-')) {
      return Stream.value(_mockNotifications(agentId));
    }
    return _notifications
        .where('agentId', isEqualTo: agentId)
        .orderBy('createdAt', descending: true)
        .limit(50)
        .snapshots()
        .map((snap) => snap.docs
            .map((d) => {'id': d.id, ...d.data() as Map<String, dynamic>})
            .toList());
  }

  Future<void> markNotificationRead(String notifId) async {
    if (notifId.startsWith('mock-')) return;
    await _notifications.doc(notifId).update({'isRead': true});
  }

  Future<void> markAllNotificationsRead(String agentId) async {
    if (agentId.startsWith('mock-')) return;
    final snap = await _notifications
        .where('agentId', isEqualTo: agentId)
        .where('isRead', isEqualTo: false)
        .get();
    final batch = _db.batch();
    for (final doc in snap.docs) {
      batch.update(doc.reference, {'isRead': true});
    }
    await batch.commit();
  }

  // ── Mock Helpers ─────────────────────────────────────────────────────────────

  List<Map<String, dynamic>> _mockPatients(String agentId) {
    return [
      {
        'id': '101',
        'name': 'Ramesh Kumar',
        'phone': '+919876543210',
        'age': 45,
        'gender': 'M',
        'specialty': 'Ortho',
        'procedure': 'Knee Replacement',
        'status': 'ipd_confirmed',
        'expectedCommission': 4500.0,
        'surgeryDate': '2026-06-25',
        'city': 'Hyderabad',
        'hospital': 'Apollo Hospitals',
        'doctor': 'Dr. Suresh Reddy',
        'packageCost': 120000.0,
        'commissionPercent': 3.75,
        'createdAt': Timestamp.fromDate(DateTime.now().subtract(const Duration(days: 10))),
        'lastUpdated': Timestamp.fromDate(DateTime.now().subtract(const Duration(hours: 9))),
        'opdDate': '2026-06-15',
        'dischargeDate': '2026-06-28',
        'notes': 'Patient prefers morning slot. Has diabetes - needs special care.',
        'urgency': 'Within a week',
        'budgetRange': '1L-2L',
        'insurance': false,
        'agentId': agentId,
      },
      {
        'id': '102',
        'name': 'Priya Sharma',
        'phone': '+919765432109',
        'age': 35,
        'gender': 'F',
        'specialty': 'Urology',
        'procedure': 'Stone Removal',
        'status': 'opd_scheduled',
        'expectedCommission': 3900.0,
        'surgeryDate': null,
        'city': 'Bangalore',
        'hospital': 'Manipal Hospital',
        'doctor': 'Dr. Anil Mehta',
        'packageCost': 80000.0,
        'commissionPercent': 4.0,
        'createdAt': Timestamp.fromDate(DateTime.now().subtract(const Duration(days: 8))),
        'lastUpdated': Timestamp.fromDate(DateTime.now().subtract(const Duration(hours: 15))),
        'opdDate': '2026-06-22',
        'urgency': 'Within a month',
        'budgetRange': '50k-1L',
        'insurance': true,
        'insuranceProvider': 'Star Health',
        'notes': '',
        'agentId': agentId,
      },
      {
        'id': '103',
        'name': 'Suresh Rao',
        'phone': '+919654321098',
        'age': 52,
        'gender': 'M',
        'specialty': 'Cardiology',
        'procedure': 'Angioplasty',
        'status': 'new',
        'expectedCommission': 8000.0,
        'surgeryDate': null,
        'city': 'Chennai',
        'hospital': null,
        'doctor': null,
        'packageCost': 200000.0,
        'commissionPercent': 4.0,
        'createdAt': Timestamp.fromDate(DateTime.now().subtract(const Duration(hours: 5))),
        'lastUpdated': Timestamp.fromDate(DateTime.now().subtract(const Duration(hours: 5))),
        'urgency': 'Immediate',
        'budgetRange': 'Above 2L',
        'insurance': true,
        'insuranceProvider': 'HDFC ERGO',
        'notes': 'Urgent case - chest pain reported',
        'agentId': agentId,
      },
      {
        'id': '104',
        'name': 'Meena Devi',
        'phone': '+919543210987',
        'age': 28,
        'gender': 'F',
        'specialty': 'Gynecology',
        'procedure': 'Laparoscopy',
        'status': 'contacted',
        'expectedCommission': 2800.0,
        'surgeryDate': null,
        'city': 'Mumbai',
        'hospital': 'Kokilaben Hospital',
        'doctor': null,
        'packageCost': 70000.0,
        'commissionPercent': 4.0,
        'createdAt': Timestamp.fromDate(DateTime.now().subtract(const Duration(days: 20))),
        'lastUpdated': Timestamp.fromDate(DateTime.now().subtract(const Duration(days: 15))),
        'urgency': 'Flexible',
        'budgetRange': '50k-1L',
        'insurance': false,
        'notes': '',
        'agentId': agentId,
      },
      {
        'id': '105',
        'name': 'Vijay Patel',
        'phone': '+919432109876',
        'age': 60,
        'gender': 'M',
        'specialty': 'General Surgery',
        'procedure': 'Gallbladder Removal',
        'status': 'completed',
        'expectedCommission': 3200.0,
        'actualCommission': 3200.0,
        'surgeryDate': '2026-06-01',
        'city': 'Delhi',
        'hospital': 'Fortis Hospital',
        'doctor': 'Dr. Ravi Gupta',
        'packageCost': 80000.0,
        'commissionPercent': 4.0,
        'createdAt': Timestamp.fromDate(DateTime.now().subtract(const Duration(days: 40))),
        'lastUpdated': Timestamp.fromDate(DateTime.now().subtract(const Duration(days: 30))),
        'urgency': 'Within a week',
        'budgetRange': '50k-1L',
        'insurance': false,
        'notes': 'Surgery completed successfully',
        'agentId': agentId,
      },
    ];
  }

  List<Map<String, dynamic>> _mockCommissions(String agentId) {
    return [
      {
        'id': 'c101',
        'agentId': agentId,
        'amount': 4500.0,
        'status': 'paid',
        'createdAt': Timestamp.fromDate(DateTime.now().subtract(const Duration(days: 2))),
      },
      {
        'id': 'c102',
        'agentId': agentId,
        'amount': 3900.0,
        'status': 'approved',
        'createdAt': Timestamp.fromDate(DateTime.now().subtract(const Duration(days: 4))),
      },
      {
        'id': 'c103',
        'agentId': agentId,
        'amount': 8000.0,
        'status': 'pending_approval',
        'createdAt': Timestamp.fromDate(DateTime.now().subtract(const Duration(hours: 5))),
      },
    ];
  }

  List<Map<String, dynamic>> _mockNotifications(String agentId) {
    return [
      {
        'id': 'n1',
        'agentId': agentId,
        'type': 'commission',
        'title': 'Commission Approved',
        'body': '₹3,900 for Priya Sharma has been approved and is ready for payment.',
        'isRead': false,
        'createdAt': Timestamp.fromDate(DateTime.now().subtract(const Duration(hours: 2))),
      },
      {
        'id': 'n2',
        'agentId': agentId,
        'type': 'patient',
        'title': 'Patient Status Update',
        'body': 'Ramesh Kumar status has been updated to IPD Confirmed.',
        'isRead': false,
        'createdAt': Timestamp.fromDate(DateTime.now().subtract(const Duration(hours: 5))),
      },
    ];
  }
}

final firestoreService = FirestoreService();
