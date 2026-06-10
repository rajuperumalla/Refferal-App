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
    final doc = await _agents.doc(uid).get();
    if (!doc.exists) return null;
    return {'id': doc.id, ...doc.data() as Map<String, dynamic>};
  }

  // Look up pre-created profile by phone (handles +91 XXXXX XXXXX & +91XXXXXXXXXX)
  Future<Map<String, dynamic>?> getAgentByPhone(String phone) async {
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
    return _agents
        .where('managerId', isEqualTo: managerId)
        .snapshots()
        .map((s) => s.docs
            .map((d) => {'id': d.id, ...d.data() as Map<String, dynamic>})
            .toList());
  }

  // Real-time stream of all patients for a list of agent IDs
  Stream<List<Map<String, dynamic>>> teamPatientsStream(List<String> agentIds) {
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
    await _agents.doc(uid).set({
      ...data,
      'createdAt': FieldValue.serverTimestamp(),
      'status': 'pending',
    });
  }

  Future<void> updateAgent(String uid, Map<String, dynamic> data) async {
    await _agents.doc(uid).update(data);
  }

  // ── Patients ──────────────────────────────────────────────────────────────

  Stream<List<Map<String, dynamic>>> patientsStream(String agentId) {
    return _patients
        .where('agentId', isEqualTo: agentId)
        .orderBy('createdAt', descending: true)
        .snapshots()
        .map((snap) => snap.docs
            .map((d) => {'id': d.id, ...d.data() as Map<String, dynamic>})
            .toList());
  }

  Future<List<Map<String, dynamic>>> getPatients(String agentId) async {
    final snap = await _patients
        .where('agentId', isEqualTo: agentId)
        .orderBy('createdAt', descending: true)
        .get();
    return snap.docs
        .map((d) => {'id': d.id, ...d.data() as Map<String, dynamic>})
        .toList();
  }

  Future<Map<String, dynamic>?> getPatient(String patientId) async {
    final doc = await _patients.doc(patientId).get();
    if (!doc.exists) return null;
    return {'id': doc.id, ...doc.data() as Map<String, dynamic>};
  }

  Future<String> addPatient(Map<String, dynamic> data) async {
    final ref = await _patients.add({
      ...data,
      'status': 'new',
      'createdAt': FieldValue.serverTimestamp(),
      'lastUpdated': FieldValue.serverTimestamp(),
    });
    return ref.id;
  }

  Future<void> updatePatient(String id, Map<String, dynamic> data) async {
    await _patients.doc(id).update({
      ...data,
      'lastUpdated': FieldValue.serverTimestamp(),
    });
  }

  // ── Commissions ───────────────────────────────────────────────────────────

  Stream<List<Map<String, dynamic>>> commissionsStream(String agentId) {
    return _commissions
        .where('agentId', isEqualTo: agentId)
        .orderBy('createdAt', descending: true)
        .snapshots()
        .map((snap) => snap.docs
            .map((d) => {'id': d.id, ...d.data() as Map<String, dynamic>})
            .toList());
  }

  Future<Map<String, dynamic>> getCommissionSummary(String agentId) async {
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
    await _notifications.doc(notifId).update({'isRead': true});
  }

  Future<void> markAllNotificationsRead(String agentId) async {
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
}

final firestoreService = FirestoreService();
