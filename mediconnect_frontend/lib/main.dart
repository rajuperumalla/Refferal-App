import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mediconnect_frontend/core/routes/app_router.dart';
import 'package:mediconnect_frontend/core/theme/app_theme.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // TODO: Initialize Firebase, SharedPreferences, etc. here
  // await Firebase.initializeApp();

  runApp(const ProviderScope(child: MediConnectApp()));
}

class MediConnectApp extends ConsumerWidget {
  const MediConnectApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final goRouter = ref.watch(appRouterProvider);

    return MaterialApp.router(
      title: 'MediConnect',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: ThemeMode.system, // Depending on user choice
      routerConfig: goRouter,
    );
  }
}
