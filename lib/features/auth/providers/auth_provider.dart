import 'dart:async';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/services/firebase_auth_service.dart';
import '../../../core/services/firestore_service.dart';
import '../../../core/services/push_notification_service.dart';
import '../models/user_model.dart';

class AuthState {
  final bool isAuthenticated;
  final bool isLoading;
  final UserModel? user;
  final String? error;
  // OTP flow
  final String? verificationId;
  final bool otpSent;

  const AuthState({
    this.isAuthenticated = false,
    this.isLoading = false,
    this.user,
    this.error,
    this.verificationId,
    this.otpSent = false,
  });

  AuthState copyWith({
    bool? isAuthenticated,
    bool? isLoading,
    UserModel? user,
    String? error,
    String? verificationId,
    bool? otpSent,
  }) {
    return AuthState(
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      isLoading: isLoading ?? this.isLoading,
      user: user ?? this.user,
      error: error,
      verificationId: verificationId ?? this.verificationId,
      otpSent: otpSent ?? this.otpSent,
    );
  }
}

class AuthNotifier extends Notifier<AuthState> {
  @override
  AuthState build() {
    Future.microtask(() => _init());
    return const AuthState();
  }

  Future<void> _init() async {
    state = state.copyWith(isLoading: true);
    final firebaseUser = firebaseAuthService.currentUser;
    if (firebaseUser != null) {
      await _loadUserModel(firebaseUser.uid);
    } else {
      state = state.copyWith(isLoading: false);
    }
  }

  Future<void> _loadUserModel(String uid) async {
    try {
      var data = await firestoreService.getAgent(uid);

      // If not found by Firebase UID, search by phone (pre-created in web admin)
      if (data == null) {
        final phone = firebaseAuthService.phoneNumber ?? '';
        if (phone.isNotEmpty) {
          final phoneData = await firestoreService.getAgentByPhone(phone);
          if (phoneData != null) {
            // Link this Firebase UID to the pre-created profile
            final toSave = Map<String, dynamic>.from(phoneData)
              ..remove('id');
            await firestoreService.createAgent(uid, {
              ...toSave,
              'firebaseUid': uid,
            });
            data = phoneData;
          }
        }
      }

      final user = data != null
          ? UserModel.fromFirestore(uid, data)
          : UserModel.newFromUid(uid, firebaseAuthService.phoneNumber ?? '');
      state = state.copyWith(
        isAuthenticated: true,
        isLoading: false,
        user: user,
      );
      PushNotificationService().initialize(uid);
    } catch (_) {
      state = state.copyWith(isLoading: false);
    }
  }

  // Step 1: send OTP
  Future<bool> sendOtp(String phone) async {
    state = state.copyWith(isLoading: true, error: null, otpSent: false);

    // BYPASS FOR MOCK DEMO
    if (phone.endsWith('9999999999') || 
        phone.endsWith('8888888888') || 
        phone.endsWith('7777777777') ||
        phone.endsWith('1111') ||
        phone.endsWith('0000')) {
      await Future.delayed(const Duration(milliseconds: 500));
      state = state.copyWith(
        isLoading: false,
        verificationId: 'mock-verification-id:$phone',
        otpSent: true,
      );
      return true;
    }

    // verifyPhoneNumber returns before codeSent fires (on mobile), so wait on
    // a Completer resolved by the first terminal callback.
    final completer = Completer<bool>();

    await firebaseAuthService.sendOtp(
      phoneNumber: phone,
      onAutoVerified: (credential) async {
        // Android auto-retrieval — signs in directly, no OTP screen needed
        await _signInWithCredential(credential);
        if (!completer.isCompleted) completer.complete(false);
      },
      onFailed: (e) {
        state = state.copyWith(
          isLoading: false,
          error: _authErrorMessage(e),
        );
        if (!completer.isCompleted) completer.complete(false);
      },
      onCodeSent: (verificationId, _) {
        state = state.copyWith(
          isLoading: false,
          verificationId: verificationId,
          otpSent: true,
        );
        if (!completer.isCompleted) completer.complete(true);
      },
      onTimeout: (_) {
        // Auto-retrieval timed out, but the code was already sent — ignore.
      },
    );

    return completer.future.timeout(
      const Duration(seconds: 60),
      onTimeout: () {
        state = state.copyWith(
          isLoading: false,
          error: 'Could not send OTP. Please try again.',
        );
        return false;
      },
    );
  }

  // Step 2: verify OTP
  Future<bool> verifyOtp(String smsCode) async {
    final verId = state.verificationId ?? '';
    if (verId.startsWith('mock-verification-id')) {
      final parts = verId.split(':');
      final phone = parts.length > 1 ? parts[1] : '';

      String uid = 'mock-agent-uid';
      if (phone.endsWith('8888888888') || phone.endsWith('1111')) {
        uid = 'mock-manager-uid';
      } else if (phone.endsWith('7777777777') || phone.endsWith('0000')) {
        uid = 'mock-admin-uid';
      }

      state = state.copyWith(isLoading: true, error: null);
      await Future.delayed(const Duration(milliseconds: 500));
      await _loadUserModel(uid);
      return true;
    }

    if (state.verificationId == null) {
      state = state.copyWith(error: 'Session expired. Please resend OTP.');
      return false;
    }

    state = state.copyWith(isLoading: true, error: null);
    try {
      final credential = await firebaseAuthService.verifyOtp(
        verificationId: state.verificationId!,
        smsCode: smsCode,
      );
      if (credential?.user != null) {
        await _loadUserModel(credential!.user!.uid);
        return true;
      }
      state = state.copyWith(isLoading: false, error: 'Verification failed.');
      return false;
    } on FirebaseAuthException catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: _authErrorMessage(e),
      );
      return false;
    }
  }

  Future<void> _signInWithCredential(PhoneAuthCredential credential) async {
    try {
      final result = await firebaseAuthService.signInWithCredential(credential);
      if (result?.user != null) {
        await _loadUserModel(result!.user!.uid);
      }
    } catch (_) {
      state = state.copyWith(isLoading: false);
    }
  }

  Future<void> logout() async {
    final uid = state.user?.id;
    if (uid != null) {
      await PushNotificationService().clearToken(uid);
    }
    await firebaseAuthService.signOut();
    state = const AuthState();
  }

  void clearError() {
    state = state.copyWith(error: null);
  }

  String _authErrorMessage(FirebaseAuthException e) {
    switch (e.code) {
      case 'invalid-phone-number':
        return 'Invalid phone number. Please check and try again.';
      case 'too-many-requests':
        return 'Too many attempts. Please wait and try again.';
      case 'invalid-verification-code':
        return 'Incorrect OTP. Please try again.';
      case 'session-expired':
        return 'OTP expired. Please resend.';
      default:
        return e.message ?? 'Authentication failed. Please try again.';
    }
  }
}

final authProvider = NotifierProvider<AuthNotifier, AuthState>(
  AuthNotifier.new,
);

final isAuthenticatedProvider = Provider<bool>(
  (ref) => ref.watch(authProvider).isAuthenticated,
);

final currentUserProvider = Provider<UserModel?>(
  (ref) => ref.watch(authProvider).user,
);
