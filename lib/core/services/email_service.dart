import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/foundation.dart';

/// Queues email jobs in Firestore `mail_queue`.
/// The NestJS backend watches this collection and sends via SMTP.
class EmailService {
  final FirebaseFirestore _db = FirebaseFirestore.instance;

  static final EmailService _instance = EmailService._internal();
  factory EmailService() => _instance;
  EmailService._internal();

  CollectionReference get _queue => _db.collection('mail_queue');

  Future<void> _enqueue({
    required String to,
    required String subject,
    required String htmlBody,
    required String type,
    Map<String, dynamic> meta = const {},
  }) async {
    try {
      await _queue.add({
        'to': to,
        'subject': subject,
        'htmlBody': htmlBody,
        'type': type,
        'status': 'pending',
        'meta': meta,
        'createdAt': FieldValue.serverTimestamp(),
      });
    } catch (e) {
      debugPrint('[EmailService] Failed to queue email: $e');
    }
  }

  // ── Email templates ───────────────────────────────────────────────────────

  Future<void> sendWelcomeEmail({
    required String to,
    required String agentName,
    required String agentId,
    required String phone,
  }) =>
      _enqueue(
        to: to,
        subject: 'Welcome to MediReferral – Your Account is Ready!',
        type: 'welcome',
        meta: {'agentId': agentId},
        htmlBody: '''
<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
  <div style="background:#1565C0;padding:24px;border-radius:8px 8px 0 0">
    <h2 style="color:#fff;margin:0">Welcome to MediReferral! 👋</h2>
  </div>
  <div style="padding:24px;border:1px solid #e0e0e0;border-top:none;border-radius:0 0 8px 8px">
    <p>Hi <strong>$agentName</strong>,</p>
    <p>Your MediReferral agent account has been created successfully.</p>
    <table style="border-collapse:collapse;width:100%;margin:16px 0">
      <tr><td style="padding:8px;background:#f5f5f5;font-weight:bold">Agent ID</td><td style="padding:8px">$agentId</td></tr>
      <tr><td style="padding:8px;background:#f5f5f5;font-weight:bold">Phone</td><td style="padding:8px">$phone</td></tr>
    </table>
    <p>Login with your registered phone number using OTP.</p>
    <p style="color:#666;font-size:12px;margin-top:32px">MediReferral Partner Network</p>
  </div>
</div>''',
      );

  Future<void> sendPatientReferredEmail({
    required String to,
    required String agentName,
    required String patientName,
    required String specialty,
    required String procedure,
    required double expectedCommission,
  }) =>
      _enqueue(
        to: to,
        subject: 'New Patient Referral Confirmed – $patientName',
        type: 'patient_referred',
        meta: {'patientName': patientName},
        htmlBody: '''
<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
  <div style="background:#2E7D32;padding:24px;border-radius:8px 8px 0 0">
    <h2 style="color:#fff;margin:0">Patient Referral Confirmed ✅</h2>
  </div>
  <div style="padding:24px;border:1px solid #e0e0e0;border-top:none;border-radius:0 0 8px 8px">
    <p>Hi <strong>$agentName</strong>,</p>
    <p>Your referral for <strong>$patientName</strong> has been received.</p>
    <table style="border-collapse:collapse;width:100%;margin:16px 0">
      <tr><td style="padding:8px;background:#f5f5f5;font-weight:bold">Patient</td><td style="padding:8px">$patientName</td></tr>
      <tr><td style="padding:8px;background:#f5f5f5;font-weight:bold">Specialty</td><td style="padding:8px">$specialty</td></tr>
      <tr><td style="padding:8px;background:#f5f5f5;font-weight:bold">Procedure</td><td style="padding:8px">$procedure</td></tr>
      <tr><td style="padding:8px;background:#f1f8e9;font-weight:bold;color:#2E7D32">Expected Commission</td>
          <td style="padding:8px;color:#2E7D32;font-weight:bold">₹${expectedCommission.toStringAsFixed(0)}</td></tr>
    </table>
    <p style="color:#666;font-size:12px;margin-top:32px">MediReferral Partner Network</p>
  </div>
</div>''',
      );

  Future<void> sendCommissionApprovedEmail({
    required String to,
    required String agentName,
    required String patientName,
    required double amount,
    required String status, // 'approved' | 'paid'
  }) =>
      _enqueue(
        to: to,
        subject: status == 'paid'
            ? 'Commission Paid – ₹${amount.toStringAsFixed(0)} for $patientName'
            : 'Commission Approved – ₹${amount.toStringAsFixed(0)} for $patientName',
        type: 'commission_update',
        meta: {'patientName': patientName, 'status': status},
        htmlBody: '''
<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
  <div style="background:${status == 'paid' ? '#1565C0' : '#F57F17'};padding:24px;border-radius:8px 8px 0 0">
    <h2 style="color:#fff;margin:0">${status == 'paid' ? 'Commission Paid 💰' : 'Commission Approved ✅'}</h2>
  </div>
  <div style="padding:24px;border:1px solid #e0e0e0;border-top:none;border-radius:0 0 8px 8px">
    <p>Hi <strong>$agentName</strong>,</p>
    <p>${status == 'paid' ? '₹${amount.toStringAsFixed(0)} has been <strong>credited</strong> to your account.' : 'Your commission of ₹${amount.toStringAsFixed(0)} has been <strong>approved</strong> and will be paid soon.'}</p>
    <table style="border-collapse:collapse;width:100%;margin:16px 0">
      <tr><td style="padding:8px;background:#f5f5f5;font-weight:bold">Patient</td><td style="padding:8px">$patientName</td></tr>
      <tr><td style="padding:8px;background:#f5f5f5;font-weight:bold">Amount</td><td style="padding:8px;font-weight:bold">₹${amount.toStringAsFixed(0)}</td></tr>
      <tr><td style="padding:8px;background:#f5f5f5;font-weight:bold">Status</td><td style="padding:8px">${status == 'paid' ? 'Paid' : 'Approved'}</td></tr>
    </table>
    <p style="color:#666;font-size:12px;margin-top:32px">MediReferral Partner Network</p>
  </div>
</div>''',
      );

  Future<void> sendOtpEmail({
    required String to,
    required String name,
    required String otp,
  }) =>
      _enqueue(
        to: to,
        subject: 'Your MediReferral OTP – $otp',
        type: 'otp',
        htmlBody: '''
<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
  <div style="background:#1565C0;padding:24px;border-radius:8px 8px 0 0">
    <h2 style="color:#fff;margin:0">Your OTP Code</h2>
  </div>
  <div style="padding:24px;border:1px solid #e0e0e0;border-top:none;border-radius:0 0 8px 8px">
    <p>Hi <strong>$name</strong>,</p>
    <p>Your one-time password is:</p>
    <div style="background:#f5f5f5;padding:24px;text-align:center;border-radius:8px;margin:16px 0">
      <span style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#1565C0">$otp</span>
    </div>
    <p>Valid for 10 minutes. Do not share this with anyone.</p>
    <p style="color:#666;font-size:12px;margin-top:32px">MediReferral Partner Network</p>
  </div>
</div>''',
      );
}

final emailService = EmailService();
