import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class ManagerShell extends StatelessWidget {
  final Widget child;
  final String location;

  const ManagerShell({super.key, required this.child, required this.location});

  static const _purple = Color(0xFF7C3AED);

  static const _tabs = [
    (path: '/manager/home',     icon: Icons.home_outlined,                    activeIcon: Icons.home,                   label: 'Dashboard'),
    (path: '/manager/agents',   icon: Icons.people_outline,                   activeIcon: Icons.people,                 label: 'Agents'),
    (path: '/manager/patients', icon: Icons.medical_services_outlined,        activeIcon: Icons.medical_services,       label: 'Patients'),
    (path: '/manager/earnings', icon: Icons.account_balance_wallet_outlined,  activeIcon: Icons.account_balance_wallet, label: 'Earnings'),
    (path: '/manager/profile',  icon: Icons.person_outline,                   activeIcon: Icons.person,                 label: 'Profile'),
  ];

  int get _currentIndex {
    if (location.startsWith('/manager/agents'))   return 1;
    if (location.startsWith('/manager/patients')) return 2;
    if (location.startsWith('/manager/earnings')) return 3;
    if (location.startsWith('/manager/profile'))  return 4;
    return 0;
  }

  @override
  Widget build(BuildContext context) {
    final currentIndex = _currentIndex;

    return Scaffold(
      body: child,
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: Colors.white,
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
              final iconSize  = isNarrow ? 22.0 : 24.0;
              final labelSize = isNarrow ?  9.0 : 10.0;

              return SizedBox(
                height: 64,
                child: Row(
                  children: _tabs.asMap().entries.map((e) {
                    final i      = e.key;
                    final tab    = e.value;
                    final active = currentIndex == i;

                    return Expanded(
                      child: GestureDetector(
                        onTap: () => context.go(tab.path),
                        behavior: HitTestBehavior.opaque,
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          margin: EdgeInsets.symmetric(
                            horizontal: isNarrow ? 2 : 4,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: active
                                ? _purple.withOpacity(0.1)
                                : Colors.transparent,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                active ? tab.activeIcon : tab.icon,
                                color: active ? _purple : Colors.grey.shade400,
                                size: iconSize,
                              ),
                              const SizedBox(height: 2),
                              Text(
                                tab.label,
                                overflow: TextOverflow.ellipsis,
                                maxLines: 1,
                                style: TextStyle(
                                  fontSize: labelSize,
                                  color: active ? _purple : Colors.grey.shade400,
                                  fontWeight: active
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
