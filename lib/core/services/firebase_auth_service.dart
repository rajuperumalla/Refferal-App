import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';

class FirebaseAuthService {
  final FirebaseAuth _auth = FirebaseAuth.instance;

  // Holds web ConfirmationResult between sendOtp and verifyOtp
  ConfirmationResult? _confirmationResult;

  Stream<User?> get authStateChanges => _auth.authStateChanges();
  User? get currentUser => _auth.currentUser;

  // Send OTP — web uses signInWithPhoneNumber; mobile uses verifyPhoneNumber
  Future<void> sendOtp({
    required String phoneNumber,
    required void Function(PhoneAuthCredential) onAutoVerified,
    required void Function(FirebaseAuthException) onFailed,
    required void Function(String verificationId, int? resendToken) onCodeSent,
    required void Function(String verificationId) onTimeout,
  }) async {
    if (kIsWeb) {
      try {
        // signInWithPhoneNumber creates an invisible RecaptchaVerifier internally
        // when no verifier is supplied — avoids the FirebaseAuthPlatform type issue
        _confirmationResult = await _auth.signInWithPhoneNumber(phoneNumber);
        // Use a sentinel verificationId so auth_provider knows OTP was sent
        onCodeSent('web-otp', null);
      } on FirebaseAuthException catch (e) {
        onFailed(e);
      } catch (e) {
        onFailed(FirebaseAuthException(
          code: 'web-error',
          message: e.toString(),
        ));
      }
    } else {
      await _auth.verifyPhoneNumber(
        phoneNumber: phoneNumber,
        verificationCompleted: onAutoVerified,
        verificationFailed: onFailed,
        codeSent: onCodeSent,
        codeAutoRetrievalTimeout: onTimeout,
        timeout: const Duration(seconds: 60),
      );
    }
  }

  // Verify OTP — web uses ConfirmationResult.confirm(); mobile uses credential
  Future<UserCredential?> verifyOtp({
    required String verificationId,
    required String smsCode,
  }) async {
    if (kIsWeb) {
      if (_confirmationResult == null) {
        throw FirebaseAuthException(
          code: 'session-expired',
          message: 'OTP session expired. Please resend.',
        );
      }
      return await _confirmationResult!.confirm(smsCode);
    }
    final credential = PhoneAuthProvider.credential(
      verificationId: verificationId,
      smsCode: smsCode,
    );
    return await _auth.signInWithCredential(credential);
  }

  Future<UserCredential?> signInWithCredential(
    PhoneAuthCredential credential,
  ) async {
    return await _auth.signInWithCredential(credential);
  }

  Future<void> signOut() async {
    _confirmationResult = null;
    await _auth.signOut();
  }

  String? get uid => _auth.currentUser?.uid;
  String? get phoneNumber => _auth.currentUser?.phoneNumber;
}

// Singleton provider
final firebaseAuthService = FirebaseAuthService();
