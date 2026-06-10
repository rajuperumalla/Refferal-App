import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

// Screens imports will go here 
import 'package:mediconnect_frontend/features/auth/presentation/screens/login_screen.dart';
import 'package:mediconnect_frontend/features/agent/presentation/screens/agent_dashboard_screen.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  // In a real app we'd watch our auth state here to auto-redirect
  // final authState = ref.watch(authProvider);

  return GoRouter(
    initialLocation: '/login',
    routes: [
      GoRoute(
        path: '/login',
        name: 'login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/agent-dashboard',
        name: 'agentDashboard',
        builder: (context, state) => const AgentDashboardScreen(),
      ),
      // Future Routes for Doctor, Admin...
    ],
    // redirect: (BuildContext context, GoRouterState state) {
    //   final loggedIn = authState.isAuthenticated;
    //   if (!loggedIn) return '/login';
    //   return null;
    // },
  );
});
