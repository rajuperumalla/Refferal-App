import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'core/theme/app_theme.dart';
import 'features/auth/providers/auth_provider.dart';
import 'features/auth/screens/login_screen.dart';
import 'features/auth/screens/otp_screen.dart';
import 'features/auth/screens/splash_screen.dart';
import 'features/dashboard/screens/dashboard_screen.dart';
import 'features/earnings/screens/earnings_screen.dart';
import 'features/notifications/screens/notifications_screen.dart';
import 'features/patients/screens/add_patient_screen.dart';
import 'features/patients/screens/patient_details_screen.dart';
import 'features/patients/screens/patients_screen.dart';
import 'features/profile/screens/profile_screen.dart';
import 'shared/widgets/main_shell.dart';

// Router provider
final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authProvider);

  return GoRouter(
    initialLocation: '/',
    redirect: (context, state) {
      final isLoggedIn = authState.isAuthenticated;
      final isOnAuth = state.matchedLocation == '/login' ||
          state.matchedLocation == '/otp';

      if (!isLoggedIn && !isOnAuth && state.matchedLocation != '/') {
        return '/login';
      }
      return null;
    },
    routes: [
      // Splash
      GoRoute(
        path: '/',
        builder: (_, __) => const SplashScreen(),
      ),

      // Auth
      GoRoute(
        path: '/login',
        builder: (_, __) => const LoginScreen(),
      ),
      GoRoute(
        path: '/otp',
        builder: (context, state) {
          final phone = state.extra as String? ?? '';
          return OtpScreen(phone: phone);
        },
      ),

      // Main Shell with Bottom Nav
      ShellRoute(
        builder: (context, state, child) => MainShell(
          child: child,
          location: state.uri.toString(),
        ),
        routes: [
          GoRoute(
            path: '/home',
            builder: (_, __) => const DashboardScreen(),
          ),
          GoRoute(
            path: '/patients',
            builder: (_, __) => const PatientsScreen(),
          ),
          GoRoute(
            path: '/earnings',
            builder: (_, __) => const EarningsScreen(),
          ),
          GoRoute(
            path: '/notifications',
            builder: (_, __) => const NotificationsScreen(),
          ),
          GoRoute(
            path: '/profile',
            builder: (_, __) => const ProfileScreen(),
          ),
        ],
      ),

      // Standalone screens (no bottom nav)
      GoRoute(
        path: '/add-patient',
        builder: (_, __) => const AddPatientScreen(),
      ),
      GoRoute(
        path: '/patient/:id',
        builder: (context, state) {
          final id = int.tryParse(state.pathParameters['id'] ?? '') ?? 0;
          return PatientDetailsScreen(patientId: id);
        },
      ),
    ],
  );
});

class MediReferralApp extends ConsumerWidget {
  const MediReferralApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);

    return MaterialApp.router(
      title: 'MediReferral',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: ThemeMode.light,
      routerConfig: router,
    );
  }
}
