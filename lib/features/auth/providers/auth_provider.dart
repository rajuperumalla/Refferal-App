import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/services/firebase_auth_service.dart';
import '../../../core/services/firestore_service.dart';
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

class AuthNotifier extends StateNotifier<AuthState> {
  AuthNotifier() : super(const AuthState()) {
    _init();
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
      final data = await firestoreService.getAgent(uid);
      final user = data != null
          ? UserModel.fromFirestore(uid, data)
          : UserModel.newFromUid(uid, firebaseAuthService.phoneNumber ?? '');
      state = state.copyWith(
        isAuthenticated: true,
        isLoading: false,
        user: user,
      );
    } catch (_) {
      state = state.copyWith(isLoading: false);
    }
  }

  // Step 1: send OTP
  Future<bool> sendOtp(String phone) async {
    state = state.copyWith(isLoading: true, error: null, otpSent: false);

    bool success = false;

    await firebaseAuthService.sendOtp(
      phoneNumber: phone,
      onAutoVerified: (credential) async {
        // Android auto-retrieval
        await _signInWithCredential(credential);
      },
      onFailed: (e) {
        state = state.copyWith(
          isLoading: false,
          error: _authErrorMessage(e),
        );
      },
      onCodeSent: (verificationId, _) {
        state = state.copyWith(
          isLoading: false,
          verificationId: verificationId,
          otpSent: true,
        );
        success = true;
      },
      onTimeout: (_) {
        state = state.copyWith(isLoading: false);
      },
    );

    return success;
  }

  // Step 2: verify OTP
  Future<bool> verifyOtp(String smsCode) async {
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

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>(
  (ref) => AuthNotifier(),
);

final isAuthenticatedProvider = Provider<bool>(
  (ref) => ref.watch(authProvider).isAuthenticated,
);

final currentUserProvider = Provider<UserModel?>(
  (ref) => ref.watch(authProvider).user,
);
