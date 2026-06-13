import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'core/services/push_notification_service.dart';
import 'core/theme/app_theme.dart';
import 'features/auth/providers/auth_provider.dart';
import 'features/auth/screens/login_screen.dart';
import 'features/auth/screens/otp_screen.dart';
import 'features/auth/screens/splash_screen.dart';
import 'features/dashboard/screens/dashboard_screen.dart';
import 'features/earnings/screens/earnings_screen.dart';
import 'features/manager/screens/manager_agents_screen.dart';
import 'features/manager/screens/manager_earnings_screen.dart';
import 'features/manager/screens/manager_home_screen.dart';
import 'features/manager/screens/manager_patients_screen.dart';
import 'features/manager/screens/manager_profile_screen.dart';
import 'features/notifications/screens/notifications_screen.dart';
import 'features/patients/screens/add_patient_screen.dart';
import 'features/patients/screens/patient_details_screen.dart';
import 'features/patients/screens/patients_screen.dart';
import 'features/profile/screens/profile_screen.dart';
import 'shared/widgets/main_shell.dart';
import 'shared/widgets/manager_shell.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authProvider);

  return GoRouter(
    initialLocation: '/',
    redirect: (context, state) {
      final isLoggedIn = authState.isAuthenticated;
      final loc = state.matchedLocation;
      final isOnAuth = loc == '/login' || loc == '/otp';

      // Not logged in → send to login (except splash / auth screens)
      if (!isLoggedIn && !isOnAuth && loc != '/') return '/login';

      // Logged in on entry points → role-based home
      if (isLoggedIn && (loc == '/login' || loc == '/')) {
        final role = authState.user?.role ?? 'agent';
        return (role == 'manager' || role == 'admin') ? '/manager/home' : '/home';
      }

      // Role enforcement
      if (isLoggedIn) {
        final role = authState.user?.role ?? 'agent';
        final isManagerOrAdmin = role == 'manager' || role == 'admin';
        // Manager/admin trying to access agent-only routes
        if (isManagerOrAdmin && loc.startsWith('/home')) {
          return '/manager/home';
        }
        if (isManagerOrAdmin && loc.startsWith('/patients') && !loc.startsWith('/manager')) {
          return '/manager/patients';
        }
        if (isManagerOrAdmin && loc.startsWith('/earnings') && !loc.startsWith('/manager')) {
          return '/manager/earnings';
        }
        // Agent trying to access manager routes
        if (!isManagerOrAdmin && loc.startsWith('/manager')) {
          return '/home';
        }
      }

      return null;
    },
    routes: [
      // ── Splash ──────────────────────────────────────────────────────────
      GoRoute(
        path: '/',
        builder: (_, __) => const SplashScreen(),
      ),

      // ── Auth ─────────────────────────────────────────────────────────────
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

      // ── Agent Shell (bottom nav: blue) ────────────────────────────────────
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

      // ── Manager Shell (bottom nav: purple) ────────────────────────────────
      ShellRoute(
        builder: (context, state, child) => ManagerShell(
          child: child,
          location: state.uri.toString(),
        ),
        routes: [
          GoRoute(
            path: '/manager/home',
            builder: (_, __) => const ManagerHomeScreen(),
          ),
          GoRoute(
            path: '/manager/agents',
            builder: (_, __) => const ManagerAgentsScreen(),
          ),
          GoRoute(
            path: '/manager/patients',
            builder: (_, __) => const ManagerPatientsScreen(),
          ),
          GoRoute(
            path: '/manager/earnings',
            builder: (_, __) => const ManagerEarningsScreen(),
          ),
          GoRoute(
            path: '/manager/profile',
            builder: (_, __) => const ManagerProfileScreen(),
          ),
        ],
      ),

      // ── Standalone screens ────────────────────────────────────────────────
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
      scaffoldMessengerKey: scaffoldMessengerKey,
    );
  }
}
