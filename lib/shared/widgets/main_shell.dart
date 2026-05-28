import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/app_colors.dart';

class MainShell extends StatelessWidget {
  final Widget child;
  final String location;

  const MainShell({super.key, required this.child, required this.location});

  static const _tabs = [
    (path: '/home', icon: Icons.home_outlined, activeIcon: Icons.home, label: 'Home'),
    (path: '/patients', icon: Icons.people_outline, activeIcon: Icons.people, label: 'Patients'),
    (path: '/earnings', icon: Icons.account_balance_wallet_outlined, activeIcon: Icons.account_balance_wallet, label: 'Earnings'),
    (path: '/notifications', icon: Icons.notifications_outlined, activeIcon: Icons.notifications, label: 'Alerts'),
    (path: '/profile', icon: Icons.person_outline, activeIcon: Icons.person, label: 'Profile'),
  ];

  int get _currentIndex {
    if (location.startsWith('/patients')) return 1;
    if (location.startsWith('/earnings')) return 2;
    if (location.startsWith('/notifications')) return 3;
    if (location.startsWith('/profile')) return 4;
    return 0;
  }

  @override
  Widget build(BuildContext context) {
    final currentIndex = _currentIndex;

    return Scaffold(
      body: child,
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: AppColors.surface,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.08),
              blurRadius: 20,
              offset: const Offset(0, -4),
            ),
          ],
        ),
        child: SafeArea(
          child: LayoutBuilder(
            builder: (context, constraints) {
              final isNarrow = constraints.maxWidth < 380;
              final iconSize = isNarrow ? 22.0 : 24.0;
              final labelSize = isNarrow ? 9.0 : 10.0;
              final hPad = isNarrow ? 4.0 : 10.0;
              return SizedBox(
                height: 64,
                child: Row(
                  children: _tabs.asMap().entries.map((e) {
                    final i = e.key;
                    final tab = e.value;
                    final isSelected = currentIndex == i;

                    return Expanded(
                      child: GestureDetector(
                        onTap: () => context.go(tab.path),
                        behavior: HitTestBehavior.opaque,
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          margin: EdgeInsets.symmetric(horizontal: hPad / 2, vertical: 6),
                          decoration: BoxDecoration(
                            color: isSelected
                                ? AppColors.primary.withOpacity(0.1)
                                : Colors.transparent,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                isSelected ? tab.activeIcon : tab.icon,
                                color: isSelected
                                    ? AppColors.primary
                                    : AppColors.textHint,
                                size: iconSize,
                              ),
                              const SizedBox(height: 2),
                              Text(
                                tab.label,
                                overflow: TextOverflow.ellipsis,
                                maxLines: 1,
                                style: TextStyle(
                                  fontSize: labelSize,
                                  color: isSelected
                                      ? AppColors.primary
                                      : AppColors.textHint,
                                  fontWeight: isSelected
                                      ? FontWeight.w600
                                      : FontWeight.normal,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    );
                  }).toList(),
                ),
              );
            },
          ),
        ),
      ),
    );
  }
}
