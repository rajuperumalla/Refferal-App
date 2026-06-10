import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/network/dio_client.dart';
import '../../../core/utils/formatters.dart';

final notificationsProvider =
    FutureProvider<List<Map<String, dynamic>>>((ref) async {
  return await MockApiService.getNotifications();
});

class NotificationsScreen extends ConsumerStatefulWidget {
  const NotificationsScreen({super.key});

  @override
  ConsumerState<NotificationsScreen> createState() =>
      _NotificationsScreenState();
}

class _NotificationsScreenState extends ConsumerState<NotificationsScreen> {
  String _filter = 'all';

  final _categories = [
    ('all', 'All', Icons.notifications_outlined),
    ('commission', 'Commission', Icons.currency_rupee),
    ('patient_update', 'Patients', Icons.person_outlined),
    ('appointment', 'Appointments', Icons.event_outlined),
    ('alert', 'Alerts', Icons.warning_outlined),
  ];

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(notificationsProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          TextButton(
            onPressed: () {},
            child: const Text('Mark all read'),
          ),
        ],
      ),
      body: Column(
        children: [
          // Filter chips
          SizedBox(
            height: 52,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              itemCount: _categories.length,
              itemBuilder: (_, i) {
                final (key, label, icon) = _categories[i];
                final isSelected = _filter == key;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: FilterChip(
                    avatar: Icon(icon,
                        size: 14,
                        color: isSelected
                            ? AppColors.primary
                            : AppColors.textHint),
                    label: Text(label,
                        style: TextStyle(
                          fontSize: 12,
                          color: isSelected
                              ? AppColors.primary
                              : AppColors.textSecondary,
                          fontWeight: isSelected
                              ? FontWeight.w600
                              : FontWeight.normal,
                        )),
                    selected: isSelected,
                    onSelected: (_) => setState(() => _filter = key),
                    selectedColor: AppColors.primary.withOpacity(0.1),
                    backgroundColor: AppColors.surface,
                    side: BorderSide(
                      color: isSelected ? AppColors.primary : AppColors.border,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(20),
                    ),
                  ),
                );
              },
            ),
          ),

          Expanded(
            child: async.when(
              loading: () =>
                  const Center(child: CircularProgressIndicator()),
              error: (e, _) => Center(child: Text('Error: $e')),
              data: (items) {
                final filtered = _filter == 'all'
                    ? items
                    : items.where((n) => n['type'] == _filter).toList();

                if (filtered.isEmpty) {
                  return const Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.notifications_off_outlined,
                            size: 48, color: AppColors.textHint),
                        SizedBox(height: 12),
                        Text('No notifications',
                            style: TextStyle(color: AppColors.textSecondary)),
                      ],
                    ),
                  );
                }

                return ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  itemCount: filtered.length,
                  itemBuilder: (_, i) =>
                      _NotificationCard(notification: filtered[i]),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _NotificationCard extends StatelessWidget {
  final Map<String, dynamic> notification;

  const _NotificationCard({required this.notification});

  IconData get _icon {
    switch (notification['type']) {
      case 'commission':
        return Icons.currency_rupee;
      case 'patient_update':
        return Icons.person_outlined;
      case 'appointment':
        return Icons.event_outlined;
      case 'alert':
        return Icons.warning_outlined;
      default:
        return Icons.notifications_outlined;
    }
  }

  Color get _color {
    switch (notification['type']) {
      case 'commission':
        return AppColors.secondary;
      case 'patient_update':
        return AppColors.primary;
      case 'appointment':
        return AppColors.statusOPD;
      case 'alert':
        return AppColors.warning;
      default:
        return AppColors.primary;
    }
  }

  @override
  Widget build(BuildContext context) {
    final isRead = notification['is_read'] as bool;

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: isRead ? AppColors.surface : _color.withOpacity(0.04),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: isRead ? AppColors.border : _color.withOpacity(0.3),
        ),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
        leading: Stack(
          children: [
            Container(
              width: 42,
              height: 42,
              decoration: BoxDecoration(
                color: _color.withOpacity(0.12),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(_icon, color: _color, size: 20),
            ),
            if (!isRead)
              Positioned(
                right: 0,
                top: 0,
                child: Container(
                  width: 10,
                  height: 10,
                  decoration: const BoxDecoration(
                    color: AppColors.primary,
                    shape: BoxShape.circle,
                  ),
                ),
              ),
          ],
        ),
        title: Text(
          notification['title'],
          style: TextStyle(
            fontWeight: isRead ? FontWeight.w500 : FontWeight.w600,
            fontSize: 14,
          ),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 4),
            Text(
              notification['body'],
              style: const TextStyle(
                fontSize: 12,
                color: AppColors.textSecondary,
                height: 1.4,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              AppFormatters.timeAgo(notification['timestamp']),
              style: const TextStyle(fontSize: 11, color: AppColors.textHint),
            ),
          ],
        ),
        isThreeLine: true,
      ),
    );
  }
}
