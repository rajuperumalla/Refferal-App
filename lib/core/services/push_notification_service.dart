import 'dart:async';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'firestore_service.dart';

class PushNotificationService {
  final FirebaseMessaging _fcm = FirebaseMessaging.instance;

  // Singleton pattern
  static final PushNotificationService _instance = PushNotificationService._internal();
  factory PushNotificationService() => _instance;
  PushNotificationService._internal();

  StreamSubscription<RemoteMessage>? _onMessageSubscription;

  Future<void> initialize(String agentId) async {
    if (agentId.startsWith('mock-')) {
      debugPrint('[PushNotificationService] Mock user, bypassing push notifications setup.');
      return;
    }

    try {
      // 1. Request permissions
      NotificationSettings settings = await _fcm.requestPermission(
        alert: true,
        announcement: false,
        badge: true,
        carPlay: false,
        criticalAlert: false,
        provisional: false,
        sound: true,
      );

      debugPrint('[PushNotificationService] User granted permission: ${settings.authorizationStatus}');

      if (settings.authorizationStatus == AuthorizationStatus.authorized ||
          settings.authorizationStatus == AuthorizationStatus.provisional) {
        
        // 2. Fetch token
        String? token;
        if (kIsWeb) {
          token = await _fcm.getToken(
            vapidKey: 'AdpetEZROlCgqmjyajCpc7skx_tzLWswX-4HB72FJFZO2GdOKgf0nGjC8hgxPJQgaxyS3vM_5Siehd4esLlGsm1xcDZM_LTNoHHbery8SZCVEu8GKy2sn7-CY-n5KSFHBYbB5iS8u1SiWkFi4TNZ_TGQJA',
          );
        } else {
          token = await _fcm.getToken();
        }

        debugPrint('[PushNotificationService] FCM Token retrieved: $token');

        if (token != null) {
          // 3. Save token in agent's document in Firestore
          await firestoreService.updateAgent(agentId, {
            'fcmToken': token,
            'fcmTokenUpdatedAt': FieldValue.serverTimestamp(),
          });
          debugPrint('[PushNotificationService] FCM token saved to Firestore for agent: $agentId');
        }

        // 4. Token refresh listener
        _fcm.onTokenRefresh.listen((newToken) async {
          debugPrint('[PushNotificationService] FCM Token refreshed: $newToken');
          await firestoreService.updateAgent(agentId, {
            'fcmToken': newToken,
            'fcmTokenUpdatedAt': FieldValue.serverTimestamp(),
          });
        });

        // 5. Foreground message handler
        _onMessageSubscription?.cancel();
        _onMessageSubscription = FirebaseMessaging.onMessage.listen((RemoteMessage message) {
          debugPrint('[PushNotificationService] Received a foreground message: ${message.notification?.title}');
        });
      }
    } catch (e) {
      debugPrint('[PushNotificationService] Error initializing push notifications: $e');
    }
  }

  Future<void> clearToken(String agentId) async {
    if (agentId.startsWith('mock-')) return;
    try {
      await firestoreService.updateAgent(agentId, {
        'fcmToken': null,
        'fcmTokenUpdatedAt': FieldValue.serverTimestamp(),
      });
      debugPrint('[PushNotificationService] FCM token cleared from Firestore.');
    } catch (e) {
      debugPrint('[PushNotificationService] Error clearing FCM token: $e');
    }
  }
}
